export type NodeCategory = "verified" | "debunked" | "clarification" | "rumor"
export type RelationshipType = "similar" | "contradicts" | "amplifies" | "related"

export interface GraphNode {
  id: string
  content: string
  author: string
  platform: "web" | "twitter" | "reddit"
  timestamp: string | null
  url: string
  category: NodeCategory
  credibilityScore: number
  engagementWeight: number
  verificationStatus: "verified" | "debunked" | "clarification" | "unverified"
  clusterSize?: number
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
  relationshipType: RelationshipType
  strengthCategory: "strong" | "moderate" | "weak"
  similarityScore: number
}

export const CATEGORY_COLORS: Record<
  NodeCategory,
  { fill: string; stroke: string; label: string; glowColor?: string; textColor?: string }
> = {
  verified: {
    fill: "#22c55e",
    stroke: "#16a34a",
    label: "Verified",
    glowColor: "rgba(34, 197, 94, 0.4)",
    textColor: "#ffffff",
  },
  debunked: {
    fill: "#ef4444",
    stroke: "#dc2626",
    label: "Debunked",
    glowColor: "rgba(239, 68, 68, 0.4)",
    textColor: "#ffffff",
  },
  clarification: {
    fill: "#3b82f6",
    stroke: "#1d4ed8",
    label: "Clarification",
    glowColor: "rgba(59, 130, 246, 0.4)",
    textColor: "#ffffff",
  },
  rumor: {
    fill: "#f59e0b",
    stroke: "#d97706",
    label: "Rumor",
    glowColor: "rgba(245, 158, 11, 0.4)",
    textColor: "#ffffff",
  },
}

export const RELATIONSHIP_COLORS: Record<RelationshipType, { color: string; label: string; dashPattern: number[] }> = {
  similar: { color: "#22c55e", label: "Similar", dashPattern: [] },
  contradicts: { color: "#ef4444", label: "Contradicts", dashPattern: [5, 5] },
  amplifies: { color: "#3b82f6", label: "Amplifies", dashPattern: [] },
  related: { color: "#f59e0b", label: "Related", dashPattern: [2, 5] },
}
