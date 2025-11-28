"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { ExternalLink, ZoomIn, ZoomOut, Maximize2, Info, Filter, Eye, EyeOff, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type GraphNode,
  type GraphEdge,
  CATEGORY_COLORS,
  RELATIONSHIP_COLORS,
  type NodeCategory,
  type RelationshipType,
} from "@/lib/graph-data"

interface KnowledgeGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface NodePosition {
  x: number
  y: number
  vx: number
  vy: number
  node: GraphNode
  radius: number
  weightedRadius: number
}

const CANVAS_WIDTH = 1400
const CANVAS_HEIGHT = 900

// Enhanced color palette for better visual distinction
const ENHANCED_CATEGORY_COLORS: Record<NodeCategory, { fill: string; stroke: string; glowColor: string; textColor: string; label: string }> = {
  claim: {
    fill: "#3b82f6",
    stroke: "#1e40af",
    glowColor: "rgba(59, 130, 246, 0.4)",
    textColor: "#ffffff",
    label: "Claim"
  },
  evidence: {
    fill: "#10b981",
    stroke: "#047857",
    glowColor: "rgba(16, 185, 129, 0.4)",
    textColor: "#ffffff",
    label: "Evidence"
  },
  context: {
    fill: "#f59e0b",
    stroke: "#d97706",
    glowColor: "rgba(245, 158, 11, 0.4)",
    textColor: "#ffffff",
    label: "Context"
  },
  source: {
    fill: "#8b5cf6",
    stroke: "#6d28d9",
    glowColor: "rgba(139, 92, 246, 0.4)",
    textColor: "#ffffff",
    label: "Source"
  },
  expert: {
    fill: "#ec4899",
    stroke: "#be185d",
    glowColor: "rgba(236, 72, 153, 0.4)",
    textColor: "#ffffff",
    label: "Expert"
  },
  counterpoint: {
    fill: "#ef4444",
    stroke: "#b91c1c",
    glowColor: "rgba(239, 68, 68, 0.4)",
    textColor: "#ffffff",
    label: "Counterpoint"
  },
  discussion: {
    fill: "#06b6d4",
    stroke: "#0e7490",
    glowColor: "rgba(6, 182, 212, 0.4)",
    textColor: "#ffffff",
    label: "Discussion"
  }
}

const ENHANCED_RELATIONSHIP_COLORS: Record<RelationshipType, { color: string; label: string; dashPattern: number[] }> = {
  supports: { color: "#10b981", label: "Supports", dashPattern: [] },
  contradicts: { color: "#ef4444", label: "Contradicts", dashPattern: [8, 4] },
  provides_context: { color: "#f59e0b", label: "Context", dashPattern: [4, 2] },
  quotes: { color: "#8b5cf6", label: "Quotes", dashPattern: [2, 2] },
  responds_to: { color: "#06b6d4", label: "Response", dashPattern: [6, 3] },
  related: { color: "#64748b", label: "Related", dashPattern: [4, 4] }
}

// Helper function to validate and sanitize numeric values
const sanitizeValue = (value: number, fallback: number = 0, min?: number, max?: number): number => {
  if (!isFinite(value) || isNaN(value)) {
    return fallback
  }
  let result = value
  if (min !== undefined) result = Math.max(min, result)
  if (max !== undefined) result = Math.min(max, result)
  return result
}

export function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
  const [hoveredNode, setHoveredNode] = useState<NodePosition | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodePosition | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 50, y: 30 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showEdgeLabels, setShowEdgeLabels] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [verificationFilter, setVerificationFilter] = useState<string>("all")
  const [credibilityThreshold, setCredibilityThreshold] = useState(0)
  const nodePositionsRef = useRef<NodePosition[]>([])
  const animationRef = useRef<number>(0)

  // Filter nodes based on current filters
  const filteredNodes = nodes.filter(node => {
    if (searchQuery && !node.author.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !node.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter !== "all" && node.category !== categoryFilter) {
      return false
    }
    if (verificationFilter !== "all" && node.verificationStatus !== verificationFilter) {
      return false
    }
    if (node.credibilityScore < credibilityThreshold / 100) {
      return false
    }
    return true
  })

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
  const filteredEdges = edges.filter(e => 
    filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  )

  const getNodeRadius = useCallback(
    (node: GraphNode) => {
      const connections = edges.filter((e) => e.source === node.id || e.target === node.id)
      const connectionCount = connections.length
      
      // Base radius from connections with better scaling
      const baseRadius = Math.min(Math.max(16, 12 + connectionCount * 2), 40)
      
      // Weight multiplier with better visual impact
      const weightMultiplier = 1 + sanitizeValue(node.engagementWeight, 0.5, 0, 1) * 0.6
      
      // Credibility bonus for verified sources
      const credibilityBonus = sanitizeValue(node.credibilityScore, 0.5, 0, 1) > 0.8 ? 1.2 : 1
      
      const radius = Math.min(baseRadius * weightMultiplier * credibilityBonus, 50)
      
      // Ensure radius is always valid and within reasonable bounds
      return sanitizeValue(radius, 20, 12, 50)
    },
    [edges],
  )

  useEffect(() => {
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    // Group nodes by category for cluster positioning
    const categoryGroups: Record<string, typeof filteredNodes> = {}
    filteredNodes.forEach((node) => {
      if (!categoryGroups[node.category]) categoryGroups[node.category] = []
      categoryGroups[node.category].push(node)
    })

    const categories = Object.keys(categoryGroups)
    const angleStep = (2 * Math.PI) / Math.max(categories.length, 1)

    // Sort categories by average credibility
    const sortedCategories = categories.sort((a, b) => {
      const avgA = categoryGroups[a].reduce((sum, n) => sum + sanitizeValue(n.credibilityScore, 0.5), 0) / categoryGroups[a].length
      const avgB = categoryGroups[b].reduce((sum, n) => sum + sanitizeValue(n.credibilityScore, 0.5), 0) / categoryGroups[b].length
      return avgB - avgA
    })

    nodePositionsRef.current = filteredNodes.map((node) => {
      const categoryIndex = sortedCategories.indexOf(node.category)
      const categoryNodes = categoryGroups[node.category]
      const nodeIndexInCategory = categoryNodes.indexOf(node)
      const radius = getNodeRadius(node)

      // Higher credibility = closer to center
      const credibility = sanitizeValue(node.credibilityScore, 0.5, 0, 1)
      const distanceFromCenter = 200 + (1 - credibility) * 200

      // Spread nodes in a cluster around category center
      const baseAngle = categoryIndex * angleStep - Math.PI / 2
      const spreadAngle =
        baseAngle + (nodeIndexInCategory / Math.max(categoryNodes.length - 1, 1) - 0.5) * (angleStep * 0.8)

      // Add controlled randomness for visual variety
      const jitterX = (Math.random() - 0.5) * 60
      const jitterY = (Math.random() - 0.5) * 60

      return {
        x: sanitizeValue(centerX + Math.cos(spreadAngle) * distanceFromCenter + jitterX, centerX, 50, dimensions.width - 50),
        y: sanitizeValue(centerY + Math.sin(spreadAngle) * distanceFromCenter + jitterY, centerY, 50, dimensions.height - 50),
        vx: 0,
        vy: 0,
        node,
        radius,
        weightedRadius: radius,
      }
    })
  }, [filteredNodes, dimensions, getNodeRadius])

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(rect.width, CANVAS_WIDTH),
          height: CANVAS_HEIGHT,
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const nodeMap = new Map<string, NodePosition>()
    nodePositionsRef.current.forEach((np) => nodeMap.set(np.node.id, np))

    let frameCount = 0
    const maxFrames = 400

    const simulate = () => {
      const positions = nodePositionsRef.current
      const centerX = dimensions.width / 2
      const centerY = dimensions.height / 2

      // Apply forces for first 400 frames
      if (frameCount < maxFrames) {
        positions.forEach((p1, i) => {
          // Validate current position before calculations
          p1.x = sanitizeValue(p1.x, centerX, 0, dimensions.width)
          p1.y = sanitizeValue(p1.y, centerY, 0, dimensions.height)
          p1.vx = sanitizeValue(p1.vx, 0, -20, 20)
          p1.vy = sanitizeValue(p1.vy, 0, -20, 20)

          positions.forEach((p2, j) => {
            if (i === j) return
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSquared = dx * dx + dy * dy
            const dist = Math.sqrt(distSquared)
            
            // Prevent division by zero and ensure minimum distance
            const effectiveDist = Math.max(dist, 10)
            const minDist = p1.radius + p2.radius + 70

            if (effectiveDist < minDist * 2.5) {
              // Cap the force to prevent extreme values
              const forceMagnitude = Math.min(
                (1400 * (1 - frameCount / maxFrames)) / (effectiveDist * effectiveDist),
                15 // Maximum force cap
              )
              const forceX = (dx / effectiveDist) * forceMagnitude * 0.1
              const forceY = (dy / effectiveDist) * forceMagnitude * 0.1
              
              p1.vx += sanitizeValue(forceX, 0, -5, 5)
              p1.vy += sanitizeValue(forceY, 0, -5, 5)
            }
          })

          // Gentle attraction to center
          const distToCenter = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2)
          if (distToCenter > 380) {
            p1.vx += sanitizeValue((centerX - p1.x) * 0.0015, 0, -2, 2)
            p1.vy += sanitizeValue((centerY - p1.y) * 0.0015, 0, -2, 2)
          }

          // Damping
          const damping = 0.84 + (frameCount / maxFrames) * 0.08
          p1.vx *= damping
          p1.vy *= damping

          // Cap velocity
          p1.vx = sanitizeValue(p1.vx, 0, -10, 10)
          p1.vy = sanitizeValue(p1.vy, 0, -10, 10)

          // Update position
          p1.x += p1.vx
          p1.y += p1.vy

          // Boundary constraints
          const padding = p1.radius + 50
          p1.x = sanitizeValue(p1.x, centerX, padding, dimensions.width - padding)
          p1.y = sanitizeValue(p1.y, centerY, padding, dimensions.height - padding)
        })

        filteredEdges.forEach((edge) => {
          const source = nodeMap.get(edge.source)
          const target = nodeMap.get(edge.target)
          if (!source || !target) return

          const dx = target.x - source.x
          const dy = target.y - source.y
          const distSquared = dx * dx + dy * dy
          const dist = Math.sqrt(distSquared)
          
          // Prevent division by zero
          const effectiveDist = Math.max(dist, 10)

          // Ideal distance based on relationship strength
          const edgeWeight = sanitizeValue(edge.weight, 0.5, 0, 1)
          const idealDist = 160 + (1 - edgeWeight) * 120 + (source.radius + target.radius)
          const force = sanitizeValue((effectiveDist - idealDist) * 0.005 * Math.max(edgeWeight, 0.1), 0, -3, 3)

          const forceX = (dx / effectiveDist) * force
          const forceY = (dy / effectiveDist) * force

          source.vx += sanitizeValue(forceX, 0, -2, 2)
          source.vy += sanitizeValue(forceY, 0, -2, 2)
          target.vx -= sanitizeValue(forceX, 0, -2, 2)
          target.vy -= sanitizeValue(forceY, 0, -2, 2)
        })

        frameCount++
      }

      // Clear and setup transform
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)
      
      // Enhanced gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
      bgGradient.addColorStop(0, "#f8fafc")
      bgGradient.addColorStop(0.5, "#f1f5f9")
      bgGradient.addColorStop(1, "#e2e8f0")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)
      
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      // Highlight selected node connections
      const connectedNodeIds = new Set<string>()
      if (selectedNode) {
        filteredEdges.forEach((edge) => {
          if (edge.source === selectedNode.node.id || edge.target === selectedNode.node.id) {
            connectedNodeIds.add(edge.source)
            connectedNodeIds.add(edge.target)
          }
        })
      }

      // Draw edges
      filteredEdges.forEach((edge) => {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        if (!source || !target) return

        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        // Skip invalid edges
        if (dist < 0.1 || !isFinite(dist)) return

        // Validate all coordinates
        if (!isFinite(source.x) || !isFinite(source.y) || !isFinite(target.x) || !isFinite(target.y)) {
          return
        }

        // Calculate edge endpoints at node boundaries
        const sourceX = source.x + (dx / dist) * source.radius
        const sourceY = source.y + (dy / dist) * source.radius
        const targetX = target.x - (dx / dist) * target.radius
        const targetY = target.y - (dy / dist) * target.radius

        if (!isFinite(sourceX) || !isFinite(sourceY) || !isFinite(targetX) || !isFinite(targetY)) {
          return
        }

        const relStyle = ENHANCED_RELATIONSHIP_COLORS[edge.relationshipType as RelationshipType] || ENHANCED_RELATIONSHIP_COLORS.related
        const isHovered = hoveredEdge === edge
        const isConnectedToSelected = selectedNode && (edge.source === selectedNode.node.id || edge.target === selectedNode.node.id)

        const edgeWeight = sanitizeValue(edge.weight, 0.5, 0, 1)
        let baseThickness = Math.max(1.5, edgeWeight * 6)
        if (selectedNode && !isConnectedToSelected) {
          baseThickness *= 0.3
        }
        const thickness = isHovered ? baseThickness + 3 : baseThickness

        // Enhanced gradient with better color blending
        const gradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY)
        const sourceColor = ENHANCED_CATEGORY_COLORS[source.node.category as NodeCategory]?.fill || "#64748b"
        const targetColor = ENHANCED_CATEGORY_COLORS[target.node.category as NodeCategory]?.fill || "#64748b"

        let alphaValue = isHovered ? 0.9 : 0.35 + edgeWeight * 0.45
        if (selectedNode && !isConnectedToSelected) {
          alphaValue *= 0.2
        }
        const alpha = Math.round(alphaValue * 255).toString(16).padStart(2, "0")
        
        gradient.addColorStop(0, `${sourceColor}${alpha}`)
        gradient.addColorStop(0.5, `${relStyle.color}${alpha}`)
        gradient.addColorStop(1, `${targetColor}${alpha}`)

        // Draw edge with shadow
        if (isHovered || isConnectedToSelected) {
          ctx.shadowColor = relStyle.color
          ctx.shadowBlur = 8
        }
        
        ctx.beginPath()
        ctx.setLineDash(relStyle.dashPattern)
        ctx.moveTo(sourceX, sourceY)
        ctx.lineTo(targetX, targetY)
        ctx.strokeStyle = gradient
        ctx.lineWidth = thickness
        ctx.stroke()
        ctx.setLineDash([])
        ctx.shadowBlur = 0

        // Enhanced arrow
        const arrowSize = 7 + edgeWeight * 5
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX)
        ctx.beginPath()
        ctx.moveTo(targetX, targetY)
        ctx.lineTo(
          targetX - arrowSize * Math.cos(angle - Math.PI / 6),
          targetY - arrowSize * Math.sin(angle - Math.PI / 6),
        )
        ctx.lineTo(
          targetX - arrowSize * Math.cos(angle + Math.PI / 6),
          targetY - arrowSize * Math.sin(angle + Math.PI / 6),
        )
        ctx.closePath()
        ctx.fillStyle = `${targetColor}${isHovered || isConnectedToSelected ? "ff" : alpha}`
        ctx.fill()

        // Enhanced edge labels
        if (showEdgeLabels || isHovered || isConnectedToSelected) {
          const midX = (sourceX + targetX) / 2
          const midY = (sourceY + targetY) / 2

          ctx.font = "bold 10px system-ui"
          const label = `${relStyle.label} (${(edgeWeight * 100).toFixed(0)}%)`
          const labelWidth = ctx.measureText(label).width + 12
          
          // Label background with shadow
          ctx.shadowColor = "rgba(0,0,0,0.1)"
          ctx.shadowBlur = 4
          ctx.fillStyle = "rgba(255,255,255,0.95)"
          ctx.fillRect(midX - labelWidth / 2, midY - 9, labelWidth, 18)
          ctx.shadowBlur = 0
          
          // Label border
          ctx.strokeStyle = relStyle.color + "40"
          ctx.lineWidth = 1
          ctx.strokeRect(midX - labelWidth / 2, midY - 9, labelWidth, 18)

          // Label text
          ctx.fillStyle = isHovered || isConnectedToSelected ? "#0f172a" : "#475569"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(label, midX, midY)
        }
      })

      // Draw nodes
      positions.forEach((p) => {
        // Validate position and radius before drawing
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.radius) || p.radius <= 0) {
          return
        }

        if (!p || !p.node) return

        const colors = ENHANCED_CATEGORY_COLORS[p.node.category as NodeCategory] || {
          fill: "#64748b",
          stroke: "#475569",
          glowColor: "rgba(100,116,139,0.4)",
          textColor: "#ffffff",
        }
        const isHovered = hoveredNode?.node.id === p.node.id
        const isSelected = selectedNode?.node.id === p.node.id
        const isConnected = connectedNodeIds.has(p.node.id)
        const isDimmed = selectedNode && !isConnected && !isSelected

        let opacity = 1
        if (isDimmed) {
          opacity = 0.2
        }

        const credibility = sanitizeValue(p.node.credibilityScore, 0.5, 0, 1)

        // Enhanced outer glow
        if ((credibility > 0.7 || isHovered || isSelected) && !isDimmed) {
          const glowSize = isSelected ? 18 : isHovered ? 14 : 8 + credibility * 8
          const glowIntensity = isSelected ? 0.6 : isHovered ? 0.5 : 0.3
          
          const glowGradient = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, p.radius + glowSize)
          glowGradient.addColorStop(0, colors.glowColor.replace(/[\d.]+\)/, `${glowIntensity})`))
          glowGradient.addColorStop(1, colors.glowColor.replace(/[\d.]+\)/, "0)"))
          
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius + glowSize, 0, Math.PI * 2)
          ctx.fillStyle = glowGradient
          ctx.fill()
        }

        // Enhanced shadow
        if (!isDimmed) {
          ctx.beginPath()
          ctx.arc(p.x + 2, p.y + 4, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,0,0,${0.15 * opacity})`
          ctx.fill()
        }

        // Node circle - use simple fill if gradient parameters are invalid
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        
        // Try to create gradient, fall back to solid color if it fails
        try {
          const gradX0 = p.x - p.radius * 0.4
          const gradY0 = p.y - p.radius * 0.4
          const gradX1 = p.x + p.radius * 0.2
          const gradY1 = p.y + p.radius * 0.2
          const gradR0 = 0
          const gradR1 = p.radius * 1.2

          if (isFinite(gradX0) && isFinite(gradY0) && isFinite(gradX1) && 
              isFinite(gradY1) && isFinite(gradR0) && isFinite(gradR1) && gradR1 > 0) {
            const nodeGradient = ctx.createRadialGradient(gradX0, gradY0, gradR0, gradX1, gradY1, gradR1)
            const lightenColor = (color: string) => {
              const r = parseInt(color.slice(1, 3), 16)
              const g = parseInt(color.slice(3, 5), 16)
              const b = parseInt(color.slice(5, 7), 16)
              return `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)})`
            }
            
            nodeGradient.addColorStop(0, lightenColor(colors.fill))
            nodeGradient.addColorStop(0.6, colors.fill)
            nodeGradient.addColorStop(1, colors.stroke)
            ctx.fillStyle = nodeGradient
          } else {
            ctx.fillStyle = colors.fill
          }
        } catch (e) {
          ctx.fillStyle = colors.fill
        }

        ctx.globalAlpha = opacity
        ctx.fill()
        ctx.globalAlpha = 1

        // Enhanced border
        const engagementWeight = sanitizeValue(p.node.engagementWeight, 0.5, 0, 1)
        const borderWidth = isSelected ? 4 : isHovered ? 3 : 2 + engagementWeight * 1.5
        ctx.strokeStyle = isSelected || isHovered ? "#ffffff" : colors.stroke
        ctx.lineWidth = borderWidth
        ctx.globalAlpha = opacity
        ctx.stroke()
        ctx.globalAlpha = 1

        // Verification status indicator with enhanced styling
        if (p.node.verificationStatus === "verified" && !isDimmed) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2)
          ctx.strokeStyle = "#22c55e"
          ctx.lineWidth = 3
          ctx.stroke()
          
          // Checkmark
          ctx.fillStyle = "#22c55e"
          ctx.font = `bold ${p.radius * 0.4}px system-ui`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("✓", p.x + p.radius * 0.7, p.y - p.radius * 0.7)
        } else if (p.node.verificationStatus === "debunked" && !isDimmed) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2)
          ctx.strokeStyle = "#ef4444"
          ctx.lineWidth = 3
          ctx.setLineDash([5, 3])
          ctx.stroke()
          ctx.setLineDash([])
          
          // X mark
          ctx.fillStyle = "#ef4444"
          ctx.font = `bold ${p.radius * 0.5}px system-ui`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("✕", p.x + p.radius * 0.7, p.y - p.radius * 0.7)
        }

        // Platform indicator with better styling
        ctx.globalAlpha = opacity
        ctx.fillStyle = colors.textColor || "#ffffff"
        ctx.font = `bold ${Math.max(11, p.radius * 0.6)}px system-ui`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const platformIcon = p.node.platform === "reddit" ? "R" : p.node.platform === "twitter" ? "X" : "W"
        ctx.fillText(platformIcon, p.x, p.y)
        ctx.globalAlpha = 1

        // Enhanced node label
        if (p.radius > 18 || isHovered || isSelected) {
          ctx.font = `${isHovered || isSelected ? "bold " : ""}11px system-ui`
          ctx.textAlign = "center"

          let label = p.node.author
          if (label.startsWith("u/")) label = label.substring(0, 14) + (label.length > 14 ? "..." : "")
          else if (label.length > 16) label = label.substring(0, 16) + "..."

          const labelWidth = ctx.measureText(label).width + 14
          const labelY = p.y + p.radius + 6
          
          // Label background with shadow
          ctx.shadowColor = "rgba(0,0,0,0.1)"
          ctx.shadowBlur = 3
          ctx.fillStyle = "rgba(255,255,255,0.98)"
          ctx.fillRect(p.x - labelWidth / 2, labelY, labelWidth, 18)
          ctx.shadowBlur = 0

          // Label border
          ctx.strokeStyle = colors.fill + "60"
          ctx.lineWidth = 1.5
          ctx.strokeRect(p.x - labelWidth / 2, labelY, labelWidth, 18)

          // Label text
          ctx.fillStyle = "#0f172a"
          ctx.fillText(label, p.x, labelY + 9)
        }
      })

      ctx.restore()
      animationRef.current = requestAnimationFrame(simulate)
    }

    simulate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, filteredEdges, hoveredNode, hoveredEdge, selectedNode, zoom, pan, showEdgeLabels])

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      if (isDragging) {
        setPan({
          x: e.clientX - rect.left - dragStart.x,
          y: e.clientY - rect.top - dragStart.y,
        })
        return
      }

      const positions = nodePositionsRef.current
      let foundNode: NodePosition | null = null

      for (const p of positions) {
        const dx = p.x - x
        const dy = p.y - y
        if (Math.sqrt(dx * dx + dy * dy) < p.radius + 10) {
          foundNode = p
          break
        }
      }

      setHoveredNode(foundNode)

      // Check for edge hover if no node is hovered
      if (!foundNode) {
        const nodeMap = new Map(positions.map((p) => [p.node.id, p]))
        let foundEdge: GraphEdge | null = null

        for (const edge of filteredEdges) {
          const source = nodeMap.get(edge.source)
          const target = nodeMap.get(edge.target)
          if (!source || !target) continue

          const dx = target.x - source.x
          const dy = target.y - source.y
          const len = Math.sqrt(dx * dx + dy * dy)
          if (len === 0) continue

          const t = Math.max(0, Math.min(1, ((x - source.x) * dx + (y - source.y) * dy) / (len * len)))
          const projX = source.x + t * dx
          const projY = source.y + t * dy
          const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2)

          if (dist < 12) {
            foundEdge = edge
            break
          }
        }
        setHoveredEdge(foundEdge)
      } else {
        setHoveredEdge(null)
      }

      if (foundNode || hoveredEdge) {
        setTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    },
    [zoom, pan, isDragging, dragStart, filteredEdges],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - rect.left - pan.x,
        y: e.clientY - rect.top - pan.y,
      })
    },
    [pan],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    if (hoveredNode && !isDragging) {
      if (selectedNode?.node.id === hoveredNode.node.id) {
        // Double click - open URL
        if (hoveredNode.node.url) {
          window.open(hoveredNode.node.url, "_blank")
        }
      } else {
        // Single click - select node
        setSelectedNode(hoveredNode)
      }
    } else if (!hoveredNode && !isDragging) {
      // Click on empty space - deselect
      setSelectedNode(null)
    }
  }, [hoveredNode, selectedNode, isDragging])

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3))
  const handleReset = () => {
    setZoom(0.85)
    setPan({ x: 50, y: 30 })
    setSelectedNode(null)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setVerificationFilter("all")
    setCredibilityThreshold(0)
  }

  // Calculate statistics
  const stats = {
    totalNodes: nodes.length,
    filteredNodes: filteredNodes.length,
    totalEdges: edges.length,
    filteredEdges: filteredEdges.length,
    avgCredibility: (nodes.reduce((sum, n) => sum + sanitizeValue(n.credibilityScore, 0.5), 0) / Math.max(nodes.length, 1) * 100).toFixed(1),
    verifiedCount: nodes.filter(n => n.verificationStatus === "verified").length,
    debunkedCount: nodes.filter(n => n.verificationStatus === "debunked").length,
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Stats Bar */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-background/95 backdrop-blur text-sm font-medium px-3 py-1.5">
          <span className="text-muted-foreground">Nodes:</span>
          <span className="ml-1 font-bold text-foreground">{stats.filteredNodes}</span>
          <span className="text-muted-foreground">/{stats.totalNodes}</span>
        </Badge>
        <Badge variant="secondary" className="bg-background/95 backdrop-blur text-sm font-medium px-3 py-1.5">
          <span className="text-muted-foreground">Edges:</span>
          <span className="ml-1 font-bold text-foreground">{stats.filteredEdges}</span>
          <span className="text-muted-foreground">/{stats.totalEdges}</span>
        </Badge>
        <Badge variant="secondary" className="bg-green-50 backdrop-blur text-sm font-medium px-3 py-1.5">
          <span className="text-green-700">Verified:</span>
          <span className="ml-1 font-bold text-green-900">{stats.verifiedCount}</span>
        </Badge>
        <Badge variant="secondary" className="bg-red-50 backdrop-blur text-sm font-medium px-3 py-1.5">
          <span className="text-red-700">Debunked:</span>
          <span className="ml-1 font-bold text-red-900">{stats.debunkedCount}</span>
        </Badge>
        <Badge variant="secondary" className="bg-blue-50 backdrop-blur text-sm font-medium px-3 py-1.5">
          <span className="text-blue-700">Avg Credibility:</span>
          <span className="ml-1 font-bold text-blue-900">{stats.avgCredibility}%</span>
        </Badge>
      </div>

      {/* Controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button 
          variant={showFilters ? "default" : "outline"} 
          size="icon" 
          onClick={() => setShowFilters(!showFilters)} 
          className="h-9 w-9 bg-background/95 backdrop-blur shadow-lg"
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleZoomIn} 
          className="h-9 w-9 bg-background/95 backdrop-blur shadow-lg"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="h-9 w-9 bg-background/95 backdrop-blur shadow-lg"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleReset} 
          className="h-9 w-9 bg-background/95 backdrop-blur shadow-lg"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant={showEdgeLabels ? "default" : "outline"}
          size="icon"
          onClick={() => setShowEdgeLabels(!showEdgeLabels)}
          className="h-9 w-9 bg-background/95 backdrop-blur shadow-lg"
          title="Toggle edge labels"
        >
          {showEdgeLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute right-4 top-64 z-10 w-72 rounded-lg border border-border bg-background/98 backdrop-blur p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
              Clear All
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search author or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(ENHANCED_CATEGORY_COLORS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: value.fill }} />
                        {value.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Verification Status</label>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">✓ Verified</SelectItem>
                  <SelectItem value="debunked">✕ Debunked</SelectItem>
                  <SelectItem value="clarification">⚠ Clarification</SelectItem>
                  <SelectItem value="pending">○ Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Min Credibility: {credibilityThreshold}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={credibilityThreshold}
                onChange={(e) => setCredibilityThreshold(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full cursor-grab rounded-lg shadow-lg active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredNode(null)
          setHoveredEdge(null)
          setIsDragging(false)
        }}
        onClick={handleClick}
      />

      {/* Enhanced Node Tooltip */}
      {hoveredNode && !isDragging && (
        <div
          className="pointer-events-none absolute z-20 max-w-md rounded-xl border-2 border-border bg-background/98 backdrop-blur p-5 shadow-2xl"
          style={{
            left: Math.min(tooltipPosition.x + 20, dimensions.width - 380),
            top: Math.min(tooltipPosition.y + 20, dimensions.height - 320),
            borderColor: ENHANCED_CATEGORY_COLORS[hoveredNode.node.category as NodeCategory]?.fill || "#64748b"
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full shadow-md"
              style={{ backgroundColor: ENHANCED_CATEGORY_COLORS[hoveredNode.node.category as NodeCategory]?.fill || "#64748b" }}
            />
            <span className="text-sm font-bold uppercase tracking-wide text-foreground">
              {ENHANCED_CATEGORY_COLORS[hoveredNode.node.category as NodeCategory]?.label || hoveredNode.node.category}
            </span>
            <Badge variant="secondary" className="ml-auto capitalize">
              {hoveredNode.node.platform}
            </Badge>
          </div>

          <p className="mb-2 text-base font-bold text-foreground">{hoveredNode.node.author}</p>
          <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
            {hoveredNode.node.content}
          </p>

          <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-muted/60 p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {(sanitizeValue(hoveredNode.node.credibilityScore, 0.5) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Credibility</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {(sanitizeValue(hoveredNode.node.engagementWeight, 0.5) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
            <div className="text-center">
              <div
                className={`text-xs font-bold uppercase ${
                  hoveredNode.node.verificationStatus === "verified"
                    ? "text-green-600"
                    : hoveredNode.node.verificationStatus === "debunked"
                      ? "text-red-600"
                      : hoveredNode.node.verificationStatus === "clarification"
                        ? "text-blue-600"
                        : "text-amber-600"
                }`}
              >
                {hoveredNode.node.verificationStatus === "verified" && "✓ "}
                {hoveredNode.node.verificationStatus === "debunked" && "✕ "}
                {hoveredNode.node.verificationStatus}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">{hoveredNode.node.timestamp || "Unknown date"}</span>
            {hoveredNode.node.url && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <ExternalLink className="h-3.5 w-3.5" />
                Double-click to open
              </span>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Edge Tooltip */}
      {hoveredEdge && !hoveredNode && !isDragging && (
        <div
          className="pointer-events-none absolute z-20 max-w-sm rounded-xl border-2 border-border bg-background/98 backdrop-blur p-4 shadow-2xl"
          style={{
            left: Math.min(tooltipPosition.x + 20, dimensions.width - 320),
            top: Math.min(tooltipPosition.y + 20, dimensions.height - 180),
            borderColor: ENHANCED_RELATIONSHIP_COLORS[hoveredEdge.relationshipType as RelationshipType]?.color || "#64748b"
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div
              className="h-3 w-12 rounded"
              style={{
                backgroundColor: ENHANCED_RELATIONSHIP_COLORS[hoveredEdge.relationshipType as RelationshipType]?.color || "#64748b",
              }}
            />
            <span className="text-sm font-bold uppercase tracking-wide text-foreground">
              {ENHANCED_RELATIONSHIP_COLORS[hoveredEdge.relationshipType as RelationshipType]?.label ||
                hoveredEdge.relationshipType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/60 p-2">
              <div className="text-xs text-muted-foreground">Similarity</div>
              <div className="text-base font-bold">{(sanitizeValue(hoveredEdge.similarityScore, 0.5) * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <div className="text-xs text-muted-foreground">Strength</div>
              <div
                className={`text-base font-bold capitalize ${
                  hoveredEdge.strengthCategory === "strong"
                    ? "text-green-600"
                    : hoveredEdge.strengthCategory === "moderate"
                      ? "text-amber-600"
                      : "text-slate-500"
                }`}
              >
                {hoveredEdge.strengthCategory}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border bg-background/95 backdrop-blur p-3 shadow-lg">
        <h4 className="mb-2 text-xs font-bold text-foreground">Categories</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ENHANCED_CATEGORY_COLORS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: value.fill }} />
              <span className="text-xs text-muted-foreground">{value.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Info Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10 w-80 rounded-lg border-2 border-primary bg-background/98 backdrop-blur p-4 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Selected Node</h4>
            <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)} className="h-6 w-6 p-0">
              ✕
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Author:</span> {selectedNode.node.author}
            </div>
            <div>
              <span className="font-semibold">Category:</span>{" "}
              <Badge variant="secondary" className="ml-1">
                {ENHANCED_CATEGORY_COLORS[selectedNode.node.category as NodeCategory]?.label}
              </Badge>
            </div>
            <div>
              <span className="font-semibold">Connections:</span>{" "}
              {edges.filter(e => e.source === selectedNode.node.id || e.target === selectedNode.node.id).length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}