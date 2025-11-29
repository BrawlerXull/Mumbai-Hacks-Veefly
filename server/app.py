from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from agents.orchestrator import OrchestratorAgent
from agents.MultiModelOrchestrator import MultiModelOrchestrator
from agents.propogation_agent import MisinformationTracker
from utils.helpers import fetch_article_content
from twilio.twiml.messaging_response import MessagingResponse
import json
import os

app = Flask(__name__)
CORS(app) # Allow all origins
load_dotenv()

print(os.getenv("OPENAI_API_KEY"))
print(os.getenv("GOOGLE_API_KEY"))

def load_article_from_file(file) -> str:
    return file.read().decode("utf-8")

@app.route("/analyze", methods=["POST"])
def analyze_article():
    try:
        article_text = None
        
        if "text" in request.form and request.form["text"].strip() != "":
            article_text = request.form["text"]

        elif "url" in request.form and request.form["url"].strip() != "":
            url = request.form["url"]
            article_text = fetch_article_content(url)
            if not article_text:
                return jsonify({"error": "Could not fetch content from URL"}), 400

        elif "file" in request.files:
            file = request.files["file"]
            article_text = file.read().decode("utf-8")

        else:
            return jsonify({"error": "Please provide text, url, or file"}), 400

        # Metadata
        article_metadata = {
            "source": request.form.get("source", "Unknown"),
            "title": request.form.get("title", "Unknown"),
            "date": request.form.get("date", "Unknown"),
            "url": request.form.get("url")
        }

        orchestrator = OrchestratorAgent()
        results = orchestrator.process_article(article_text, article_metadata)

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/track-propagation', methods=['POST'])
def track_propagation():
    try:
        data = request.get_json()
        if not data or 'claim' not in data:
            return jsonify({"error": "Missing 'claim' in request body"}), 400
        print(data)
        claim = data['claim']
        print(claim)
        
        tracker = MisinformationTracker()
        report = tracker.track(claim)
        
        # Convert report to JSON-serializable format if needed (default=str handles dates/objects)
        return json.dumps(report, default=str), 200, {'Content-Type': 'application/json'}
        
    except Exception as e:
        print(f"Error tracking propagation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/verify-claim', methods=['POST'])
def verify_claim():
    """
    Endpoint to verify a claim using the full verdict pipeline.
    
    Request body:
    {
        "query": "the claim to verify"
    }
    
    Response:
    {
        "query": "...",
        "verdict": {
            "verdict": "TRUE/FALSE/LIKELY TRUE/LIKELY FALSE/UNVERIFIED",
            "confidence": 0.95,
            "explanation": "...",
            "evidence_summary": {...}
        },
        "harvested_items": [...],
        "analyzed_claims": {
            "supporting": [...],
            "contradicting": [...],
            "neutral": [...]
        },
        "statistics": {
            "total_items": 41,
            "supporting_count": 10,
            "contradicting_count": 5,
            "neutral_count": 26
        }
    }
    """
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "Missing 'query' in request body"}), 400
        
        query = data['query']
        
        # Import the agents
        from agents.propogation_agent import HarvestAgent
        from agents.claim_agent import ClaimAnalysisAgent
        from agents.verdict_agent import VerdictAgent
        
        # 1. Harvest Data
        harvester = HarvestAgent(use_smart_accounts=True)
        items = harvester.harvest(query)
        
        # 2. Analyze Claims
        analyzer = ClaimAnalysisAgent()
        analyzed_items = analyzer.analyze_claims(query, items)
        
        # 3. Flatten analysis data for easier access
        for item in analyzed_items:
            analysis = item.get('analysis', {})
            item['classification'] = analysis.get('classification', 'NEUTRAL')
            item['claim'] = analysis.get('claim', 'No claim extracted')
            item['reasoning'] = analysis.get('reasoning', 'No reasoning provided')
        
        # 4. Determine Verdict
        verdict_agent = VerdictAgent()
        final_verdict = verdict_agent.determine_verdict(query, analyzed_items)
        
        # 5. Categorize claims
        supporting = [item for item in analyzed_items if item.get('classification') == 'SUPPORT']
        contradicting = [item for item in analyzed_items if item.get('classification') == 'CONTRADICT']
        neutral = [item for item in analyzed_items if item.get('classification') == 'NEUTRAL']
        
        # 6. Build response
        response = {
            "query": query,
            "verdict": final_verdict,
            "harvested_items": items,
            "analyzed_claims": {
                "supporting": supporting,
                "contradicting": contradicting,
                "neutral": neutral
            },
            "statistics": {
                "total_items": len(analyzed_items),
                "supporting_count": len(supporting),
                "contradicting_count": len(contradicting),
                "neutral_count": len(neutral),
                "instagram_items": len([i for i in analyzed_items if i.get('source_type') == 'related']),
                "general_items": len([i for i in analyzed_items if i.get('source_type') == 'general'])
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error verifying claim: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/analyze-video", methods=["POST"])
def analyze_video():
    """
    Endpoint to analyze a video for deepfakes.
    Expects a video file in the 'video' field of the multipart/form-data request.
    """
    temp_path = None
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files["video"]
        if video_file.filename == "":
            return jsonify({"error": "No selected file"}), 400
            
        # Save to a temporary file
        # Ensure the temp directory exists
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_path = os.path.join(temp_dir, video_file.filename)
        video_file.save(temp_path)
        
        # Metadata
        video_metadata = {
            "filename": video_file.filename,
            "source": request.form.get("source", "API Upload"),
            "date": request.form.get("date", "Unknown")
        }
        
        # Process
        orchestrator = MultiModelOrchestrator()
        result = orchestrator.process_video(temp_path, video_metadata)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    finally:
        # Clean up
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Error removing temp file {temp_path}: {e}")

@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    """
    Endpoint to analyze an image for deepfakes.
    Expects an image file in the 'image' field of the multipart/form-data request.
    """
    temp_path = None
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        image_file = request.files["image"]
        if image_file.filename == "":
            return jsonify({"error": "No selected file"}), 400
            
        # Save to a temporary file
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_path = os.path.join(temp_dir, image_file.filename)
        image_file.save(temp_path)
        
        # Metadata
        image_metadata = {
            "filename": image_file.filename,
            "source": request.form.get("source", "API Upload"),
            "date": request.form.get("date", "Unknown")
        }
        
        # Process
        orchestrator = MultiModelOrchestrator()
        result = orchestrator.process_image(temp_path, image_metadata)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    finally:
        # Clean up
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Error removing temp file {temp_path}: {e}")

@app.route("/whatsapp", methods=["POST"])
def whatsapp_webhook():
    try:
        incoming_text = request.form.get("Body")
        sender = request.form.get("From")

        print(f"WhatsApp message from {sender}: {incoming_text}")

        orchestrator = OrchestratorAgent()
        results = orchestrator.process_article(
            incoming_text,
            {"source": "WhatsApp", "title": "NA", "date": "NA", "url": None}
        )

        # Build WhatsApp-friendly reply
        authenticity = results.get("authenticity_category", "N/A")
        score = results.get("authenticity_score", "N/A")
        report = results.get("report", "No summary available.")
        key_claims = results.get("key_claims", [])

        claims_text = "\n".join([f"- {c['claim']}" for c in key_claims]) if key_claims else "N/A"

        reply_message = (
            f"📰 *Fake News Analysis Report*\n\n"
            f"🔍 *Authenticity:* {authenticity}\n"
            f"📊 *Score:* {score:.2f}/1.0\n\n"
            f"🧾 *Summary:*\n{report}\n\n"
            f"📌 *Key Claims:*\n{claims_text}"
        )

        twilio_resp = MessagingResponse()
        twilio_resp.message(reply_message)

        return str(twilio_resp)

    except Exception as e:
        twilio_resp = MessagingResponse()
        twilio_resp.message(f"⚠️ Error: {str(e)}")
        return str(twilio_resp)


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Fake News Detection API is running"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000, debug=True)
