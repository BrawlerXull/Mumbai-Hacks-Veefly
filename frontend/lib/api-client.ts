const API_BASE_URL = "https://nonpredicative-neta-pratincolous.ngrok-free.dev/"

export interface TrackPropagationResponse {
  claim: string
  origins: Array<{
    platform: string
    content: string
    url: string
    timestamp: string | null
    author: string
    id: string
  }>
  graph_data: {
    directed: boolean
    multigraph: boolean
    nodes: Array<{
      platform: string
      content: string
      url: string
      timestamp: string | null
      author: string
      id: string
    }>
    edges: Array<{
      source: string
      target: string
      weight: number
    }>
  }
  graph_stats: {
    nodes: number
    edges: number
  }
  explanation: string
}

export interface AnalyzedClaim {
  claim: string
  classification: "SUPPORT" | "CONTRADICT" | "NEUTRAL"
  content: string
  url: string
  platform: string
  author: string
  timestamp: string
  reasoning: string
  id: string
  source_type: string
  analysis: {
    claim: string
    classification: string
    reasoning: string
  }
}

export interface TextAnalysisResponse {
  query: string
  analyzed_claims: {
    supporting: AnalyzedClaim[]
    contradicting: AnalyzedClaim[]
    neutral: AnalyzedClaim[]
  }
  harvested_items: AnalyzedClaim[]
  statistics: {
    total_items: number
    supporting_count: number
    contradicting_count: number
    neutral_count: number
    general_items: number
    instagram_items: number
  }
  verdict: {
    verdict: "LIKELY TRUE" | "LIKELY FALSE" | "UNCERTAIN" | "MIXED EVIDENCE"
    confidence: number
    explanation: string
    evidence_summary: {
      general: {
        stance: string
        support: number
        contradict: number
      }
      instagram: {
        stance: string
        support: number
        contradict: number
      }
    }
  }
  // Legacy fields for backward compatibility
  authenticity_score?: number
  report?: string
  key_claims?: string[] | { claim: string; keywords: string[] }[]
  category?: string
}

export interface ImageAnalysisResponse {
  prediction: string
  confidence: number
  details: string
}

export interface VideoAnalysisResponse {
  prediction: string
  confidence: number
  details: string
}

// Track claim propagation
export async function trackPropagation(claim: string): Promise<TrackPropagationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/track-propagation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ claim }),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`)
  }

  return response.json()
}

// Analyze text for credibility
export async function analyzeText(formData: FormData): Promise<TextAnalysisResponse> {
  // Extract the data from FormData
  const text = formData.get("text") as string | null
  const url = formData.get("url") as string | null
  
  // Build JSON payload
  const payload: any = {}
  if (text) {
    payload.query = text
  }
  if (url) {
    payload.url = url
  }

  const response = await fetch(`${API_BASE_URL}/api/verify-claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`)
  }

  return response.json()
}

// Verify claim with JSON payload
export async function verifyClaim(query: string): Promise<TextAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/verify-claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`)
  }

  return response.json()
}

// Analyze image for deepfakes
export async function analyzeImage(formData: FormData): Promise<ImageAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze-image`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`)
  }

  return response.json()
}

// Analyze video for deepfakes
export async function analyzeVideo(formData: FormData): Promise<VideoAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze-video`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`)
  }

  return response.json()
}
