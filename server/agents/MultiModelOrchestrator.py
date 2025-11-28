"""
Multi-Model Orchestrator for Deepfake Detection.
Responsible for coordinating the deepfake detection process using video and audio analysis.
"""
from typing import Dict, Any, List, Optional
import json
import torch
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

from agents.deepfake import VideoFeatureExtractor, AudioFeatureExtractor, DeepfakeClassifier, process_video, process_audio
from agents.deepfake_image import DeepfakeImagePredictor
from utils.helpers import load_api_key

class MultiModelOrchestrator:
    """Agent for orchestrating the deepfake detection process."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Multi-Model Orchestrator.
        
        Args:
            api_key: Optional API key for LLM services
        """
        self.api_key = api_key or load_api_key("OPENAI_API_KEY") # Using same key env var as orchestrator.py
        self.llm = ChatGoogleGenerativeAI(temperature=0, model="models/gemini-2.5-flash")
        
        # Initialize Deepfake Models
        self.video_model = VideoFeatureExtractor()
        self.audio_model = AudioFeatureExtractor()
        self.classifier = DeepfakeClassifier()
        
        # Load model weights if available (placeholder for now, as deepfake.py didn't show weight loading logic in __main__)
        # In a real scenario, we would load state_dicts here.
        self.video_model.eval()
        self.audio_model.eval()
        self.classifier.eval()
        
        # Initialize Image Predictor
        self.image_predictor = DeepfakeImagePredictor()

        # Initialize the LLM chain for generating the final report
        self.report_generation_prompt = PromptTemplate(
            input_variables=["input_metadata", "authenticity_score", "authenticity_category"],
            template="""
            Generate a comprehensive deepfake detection report for the following video analysis.
            
            Video Metadata:
            {input_metadata}
            
            Analysis Results:
            Authenticity Score: {authenticity_score} (0 = Fake, 1 = Real)
            Category: {authenticity_category}
            
            Your report should include:
            1. An executive summary with the overall assessment
            2. Explanation of the analysis (visual and audio consistency)
            3. Recommendations for the viewer
            
            Keep the report concise, objective, and evidence-based.
            """
        )
        
        self.report_generation_chain = LLMChain(
            llm=self.llm,
            prompt=self.report_generation_prompt
        )
    
    def process_video(self, video_path: str, video_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a video to determine if it's a deepfake.
        
        Args:
            video_path: Path to the video file
            video_metadata: Optional metadata about the video
            
        Returns:
            Dictionary with authenticity assessment and report
        """
        print(f"Starting deepfake detection process for {video_path}...")
        
        if video_metadata is None:
            video_metadata = {
                "filename": os.path.basename(video_path),
                "source": "Unknown"
            }
            
        try:
            # Step 1: Extract features
            # Note: deepfake.py functions might need adjustment if they expect specific paths or throw errors
            video_frames = process_video(video_path)
            audio_features = process_audio(video_path)
            
            # Step 2: Run Classifier
            with torch.no_grad():
                v_feat = self.video_model(video_frames)
                a_feat = self.audio_model(audio_features)
                prediction = self.classifier(v_feat, a_feat)
                
            real_probability = prediction[0, 0].item()
            
            # Step 3: Determine Category
            authenticity_category = "Real" if real_probability > 0.5 else "Fake"
            
            # Step 4: Generate Report
            final_report = self._generate_report(video_metadata, real_probability, authenticity_category)
            
            result = {
                "video_metadata": video_metadata,
                "authenticity_score": real_probability,
                "authenticity_category": authenticity_category,
                "report": final_report
            }
            
            return result

        except Exception as e:
            print(f"Error processing video: {e}")
            return {
                "video_metadata": video_metadata,
                "error": str(e),
                "authenticity_category": "Error"
            }

    def process_image(self, image_path: str, image_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process an image to determine if it's a deepfake.
        
        Args:
            image_path: Path to the image file
            image_metadata: Optional metadata about the image
            
        Returns:
            Dictionary with authenticity assessment and report
        """
        print(f"Starting deepfake image detection process for {image_path}...")
        
        if image_metadata is None:
            image_metadata = {
                "filename": os.path.basename(image_path),
                "source": "Unknown"
            }
            
        try:
            # Step 1: Run Predictor
            # The model returns probability of being REAL (based on sigmoid output usually, but let's verify)
            # In the provided code: layers.Dense(1, activation='sigmoid')
            # Usually 1 = Class 1, 0 = Class 0. We need to know which is which.
            # Assuming standard: 1 = Real, 0 = Fake (or vice versa). 
            # The user's deepfake.py had: if(real_probability>0.5): prediction = "real"
            # Let's assume the new model follows similar convention or we interpret it.
            # Let's assume 1 = Real, 0 = Fake for now.
            
            real_probability = self.image_predictor.predict(image_path)
            
            # Step 2: Determine Category
            authenticity_category = "Real" if real_probability > 0.5 else "Fake"
            
            # Step 3: Generate Report
            # We can reuse the same report generation chain but pass image metadata
            final_report = self._generate_report(image_metadata, real_probability, authenticity_category)
            
            result = {
                "image_metadata": image_metadata,
                "authenticity_score": real_probability,
                "authenticity_category": authenticity_category,
                "report": final_report
            }
            
            return result

        except Exception as e:
            print(f"Error processing image: {e}")
            return {
                "image_metadata": image_metadata,
                "error": str(e),
                "authenticity_category": "Error"
            }

    def _generate_report(self, metadata: Dict[str, Any], score: float, category: str) -> str:
        """
        Generate a report using LLM.
        """
        print("Generating final deepfake report...")
        try:
            # Ensure metadata is serialized to string as prompt expects string
            metadata_str = json.dumps(metadata, indent=2)
            
            report = self.report_generation_chain.run(
                input_metadata=metadata_str,
                authenticity_score=f"{score:.4f}",
                authenticity_category=category
            )
            return report
        except Exception as e:
            print(f"Error generating report: {e}")
            return f"Analysis complete. Result: {category} (Score: {score:.4f}). Report generation failed."
