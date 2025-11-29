# 🔍 RumerLens - AI-Powered Fact-Checking Platform

<div align="center">

![RumerLens](https://img.shields.io/badge/RumerLens-AI%20Powered-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask)

**A comprehensive misinformation detection and fact-checking platform powered by AI**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-endpoints)

</div>

---

## 📖 Overview
![PHOTO-2025-11-29-07-09-49](https://github.com/user-attachments/assets/76e42ddb-0bb5-4637-9646-d4e12ce903c3)


RumerLens is a cutting-edge fact-checking platform that leverages multiple AI models and social media analysis to verify claims, detect deepfakes, and track misinformation propagation across platforms. Built for the Mumbai Hacks hackathon, it combines advanced NLP, computer vision, and graph analysis to combat misinformation.

### 🎯 Key Capabilities

- **Text Analysis**: Verify claims from text, URLs, or uploaded files
- **Media Forensics**: Detect deepfakes in images and videos
- **Info X-ray**: Track claim propagation across social media platforms
- **Multi-Platform Support**: Analyze content from Twitter/X, Reddit, Instagram, and general web sources
- **Real-time Analysis**: Get instant verdict with confidence scores and evidence breakdown

---

## ✨ Features
![PHOTO-2025-11-29-07-29-43](https://github.com/user-attachments/assets/59439ef6-9a91-4b32-adac-294cfcafaabc)


![PHOTO-2025-11-29-07-25-26](https://github.com/user-attachments/assets/39c66d67-8e5c-4477-8567-e4d9243d20af)

### 🔎 Text Analysis
- **Multi-source verification** across Twitter/X, Reddit, Instagram, and web
- **Claim categorization** (Supporting, Contradicting, Neutral)
- **Confidence scoring** with detailed explanations
- **Source extraction** with platform-specific metadata
- **Reasoning analysis** for each evidence piece

### 🎭 Media Forensics
- **Deepfake detection** for images and videos
- **Authenticity scoring** with confidence metrics
- **Visual artifact analysis**
- **Multi-model ensemble** for accurate detection
![PHOTO-2025-11-29-07-28-25](https://github.com/user-attachments/assets/e07591ff-985b-4a15-9b2a-341486c0683a)

### 🌐 Info X-ray (Supply Chain Tracking)
- **Claim origin tracking** across platforms
- **Propagation graph visualization** using NetworkX
- **Timeline analysis** of misinformation spread
- **Node and edge statistics** for network analysis
- **Interactive graph exploration**

### 💬 Chat Interface
- **Real-time analysis** with streaming responses
- **Collapsible evidence sections** for better UX
- **User/AI message alignment** (chat-style layout)
- **File upload support** (.txt files)
- **URL analysis** with automatic content extraction

---

## 🏗️ Architecture

### Frontend Stack

```
frontend/
├── app/
│   ├── (pages)/
│   │   ├── analyze/          # Text analysis chat interface
│   │   ├── media-forensics/  # Deepfake detection
│   │   └── supply-chain/     # Propagation tracking
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # Radix UI components
│   ├── home.tsx              # Hero section
│   ├── sidebar-nav.tsx       # Navigation sidebar
│   ├── knowledge-graph.tsx   # Graph visualization
│   └── Orb.tsx               # WebGL background
└── lib/
    ├── api-client.ts         # Backend API integration
    ├── graph-data.ts         # Graph utilities
    └── utils.ts              # Helper functions
```

**Technologies:**
- **Framework**: Next.js 16.0.3 (App Router)
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Graphics**: OGL 1.0.11 (WebGL)
- **Language**: TypeScript 5

### Backend Stack

```
server/
├── agents/
│   ├── orchestrator.py           # Main analysis orchestrator
│   ├── MultiModelOrchestrator.py # Multi-model coordination
│   ├── deepfake_image.py         # Image deepfake detection
│   ├── deepfake.py               # Video deepfake detection
│   ├── propogation_agent.py      # Network analysis
│   ├── scorer_agent.py           # Scoring engine
│   ├── search_agent.py           # Web search agent
│   ├── x_agent.py                # Twitter/X agent
│   ├── reddit_agent.py           # Reddit agent
│   └── instagram_agent.py        # Instagram agent
├── utils/
│   ├── helpers.py                # Utility functions
│   └── mcp_client.py             # MCP integration
├── app.py                        # Flask application
└── requirements.txt              # Python dependencies
```

**Technologies:**
- **Framework**: Flask 3.1.2
- **AI Models**: Google Gemini, OpenAI GPT
- **ML Libraries**: TensorFlow, Keras, Scikit-learn
- **NLP**: LangChain, LangGraph
- **Computer Vision**: OpenCV, Pillow
- **Graph Analysis**: NetworkX
- **Web Scraping**: BeautifulSoup4, Playwright
- **APIs**: Twitter API, Reddit API, Instagram API

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.9+
- **API Keys**:
  - OpenAI API Key
  - Google Gemini API Key
  - Twitter/X API credentials
  - Reddit API credentials
  - Instagram API credentials (optional)

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Run development server
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
touch .env
```

Add the following to `.env`:

```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
```

Run the server:

```bash
python app.py
```

The backend will be available at `http://localhost:6000`

---

## 🎮 Usage

### 1. Text Analysis

**Via Web Interface:**
1. Navigate to `/analyze`
2. Enter your claim, paste a URL, or upload a .txt file
3. Click analyze to get instant results

**Response includes:**
- ✅ **Verdict**: LIKELY TRUE/FALSE/UNCERTAIN/MIXED EVIDENCE
- 📊 **Confidence Score**: 0-100% with progress bar
- 📝 **Explanation**: AI-generated reasoning
- 📈 **Statistics**: Evidence breakdown by type
- 🟢 **Supporting Evidence**: Claims that support the statement
- 🔴 **Contradicting Evidence**: Claims that contradict the statement
- 🔗 **Sources**: Links to original content

### 2. Media Forensics

1. Navigate to `/media-forensics`
2. Upload an image or video
3. Get deepfake detection results with confidence scores

### 3. Info X-ray (Propagation Tracking)

1. Navigate to `/supply-chain`
2. Enter a claim to track
3. View the propagation graph showing:
   - Origin points
   - Spread pattern
   - Platform distribution
   - Timeline of propagation

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:6000
```

### 1. Analyze Text

**Endpoint:** `POST /api/verify-claim`

**Request Body:**
```json
{
  "query": "Elon Musk bought Twitter",
  "url": "https://example.com/article" // optional
}
```

**Response:**
```json
{
  "query": "Elon Musk bought Twitter",
  "verdict": {
    "verdict": "LIKELY TRUE",
    "confidence": 0.7,
    "explanation": "Based on evidence...",
    "evidence_summary": {
      "general": {
        "stance": "SUPPORTS_CLAIM",
        "support": 20,
        "contradict": 1
      },
      "instagram": {
        "stance": "SILENT",
        "support": 0,
        "contradict": 0
      }
    }
  },
  "analyzed_claims": {
    "supporting": [...],
    "contradicting": [...],
    "neutral": [...]
  },
  "statistics": {
    "total_items": 33,
    "supporting_count": 20,
    "contradicting_count": 1,
    "neutral_count": 12,
    "general_items": 33,
    "instagram_items": 0
  }
}
```

### 2. Deepfake Detection

**Endpoint:** `POST /deepfake_image`

**Request:**
- Multipart form data with image file

**Response:**
```json
{
  "prediction": "Real/Fake",
  "confidence": 0.95,
  "details": "Analysis details..."
}
```

### 3. Track Propagation

**Endpoint:** `POST /track_full_propagation`

**Request Body:**
```json
{
  "claim": "Your claim here"
}
```

**Response:**
```json
{
  "claim": "Your claim here",
  "origins": [...],
  "graph_data": {
    "nodes": [...],
    "edges": [...]
  },
  "graph_stats": {
    "nodes": 50,
    "edges": 75
  },
  "explanation": "Network analysis..."
}
```

---

## 🎨 UI Features

### Modern Design Elements

- **WebGL Background**: Animated Orb component using OGL
- **Gradient Effects**: Premium blue-to-cyan gradients
- **Collapsible Sections**: Evidence sections collapse by default
- **Chat Layout**: User messages on right, AI on left
- **Responsive Design**: Mobile-friendly interface
- **Dark Theme**: Eye-friendly dark mode
- **Smooth Animations**: Transitions and hover effects
- **Loading States**: Clear feedback during analysis

### Navigation

- **Sidebar Navigation**: Quick access to all features
- **Breadcrumbs**: Easy navigation tracking
- **Status Indicators**: Live status badges
- **Logo**: Animated glow effects with status dot

---

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run lint
npm run build
```

### Backend
```bash
cd server
pytest tests/
```

---

## 📦 Dependencies

### Key Frontend Dependencies

- `next`: 16.0.3
- `react`: 19.2.0
- `tailwindcss`: 4.1.1
- `@radix-ui/*`: Various UI primitives
- `lucide-react`: Icons
- `ogl`: WebGL library

### Key Backend Dependencies

- `flask`: 3.1.2
- `google-generativeai`: 0.7.2
- `openai`: 1.75.1
- `langchain`: 0.3.28
- `tensorflow`: 2.18.0
- `opencv-python`: 4.11.0.86
- `networkx`: 3.4.2
- `playwright`: 1.54.0

---

## 🔐 Security

- API keys stored in `.env` (never committed)
- CORS configured for frontend origin
- Input validation on all endpoints
- Rate limiting (recommended for production)
- Sanitized user inputs

---

## 🚧 Roadmap

- [ ] Real-time collaboration features
- [ ] Browser extension for instant fact-checking
- [ ] Mobile app (React Native)
- [ ] More social media platforms (TikTok, Facebook)
- [ ] Audio deepfake detection
- [ ] Multi-language support
- [ ] Historical claim database
- [ ] User reputation system

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ for Mumbai Hacks by the RumerLens team.

---

## 🙏 Acknowledgments

- **Google Gemini** for advanced AI capabilities
- **OpenAI** for GPT models
- **Radix UI** for accessible components
- **Vercel** for Next.js framework
- **OGL** for WebGL rendering
- All open-source contributors

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with 🔍 by RumerLens Team

</div>
