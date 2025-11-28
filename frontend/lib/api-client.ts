const API_BASE_URL = "http://localhost:6000"

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

export interface TextAnalysisResponse {
  authenticity_score: number
  report: string
  key_claims: string[] | { claim: string; keywords: string[] }[]
  category: string
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
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData,
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
