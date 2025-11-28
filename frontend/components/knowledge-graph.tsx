"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { ExternalLink, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
  const [hoveredNode, setHoveredNode] = useState<NodePosition | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 50, y: 30 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showEdgeLabels, setShowEdgeLabels] = useState(false)
  const nodePositionsRef = useRef<NodePosition[]>([])
  const animationRef = useRef<number>(0)

  const getNodeRadius = useCallback(
    (node: GraphNode) => {
      const connections = edges.filter((e) => e.source === node.id || e.target === node.id)
      const connectionCount = connections.length
      const totalWeight = connections.reduce((sum, e) => sum + e.weight, 0)

      // Base radius from connections
      const baseRadius = Math.min(Math.max(14, 10 + connectionCount * 1.5), 35)

      // Weight multiplier (engagementWeight is pre-computed)
      const weightMultiplier = 1 + node.engagementWeight * 0.5

      // Credibility bonus for verified sources
      const credibilityBonus = node.credibilityScore > 0.8 ? 1.15 : 1

      return Math.min(baseRadius * weightMultiplier * credibilityBonus, 45)
    },
    [edges],
  )

  useEffect(() => {
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    // Group nodes by category for cluster positioning
    const categoryGroups: Record<string, typeof nodes> = {}
    nodes.forEach((node) => {
      if (!categoryGroups[node.category]) categoryGroups[node.category] = []
      categoryGroups[node.category].push(node)
    })

    const categories = Object.keys(categoryGroups)
    const angleStep = (2 * Math.PI) / Math.max(categories.length, 1)

    // Sort categories by average credibility to position verified sources centrally
    const sortedCategories = categories.sort((a, b) => {
      const avgA = categoryGroups[a].reduce((sum, n) => sum + n.credibilityScore, 0) / categoryGroups[a].length
      const avgB = categoryGroups[b].reduce((sum, n) => sum + n.credibilityScore, 0) / categoryGroups[b].length
      return avgB - avgA
    })

    nodePositionsRef.current = nodes.map((node) => {
      const categoryIndex = sortedCategories.indexOf(node.category)
      const categoryNodes = categoryGroups[node.category]
      const nodeIndexInCategory = categoryNodes.indexOf(node)
      const radius = getNodeRadius(node)

      // Higher credibility = closer to center
      const distanceFromCenter = 220 + (1 - node.credibilityScore) * 180

      // Spread nodes in a cluster around category center
      const baseAngle = categoryIndex * angleStep - Math.PI / 2
      const spreadAngle =
        baseAngle + (nodeIndexInCategory / Math.max(categoryNodes.length - 1, 1) - 0.5) * (angleStep * 0.7)

      // Add some randomness for visual variety
      const jitterX = (Math.random() - 0.5) * 80
      const jitterY = (Math.random() - 0.5) * 80

      return {
        x: centerX + Math.cos(spreadAngle) * distanceFromCenter + jitterX,
        y: centerY + Math.sin(spreadAngle) * distanceFromCenter + jitterY,
        vx: 0,
        vy: 0,
        node,
        radius,
        weightedRadius: radius,
      }
    })
  }, [nodes, dimensions, getNodeRadius])

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
    const maxFrames = 400 // More iterations for better layout

    const simulate = () => {
      const positions = nodePositionsRef.current
      const centerX = dimensions.width / 2
      const centerY = dimensions.height / 2

      // Apply forces for first 400 frames
      if (frameCount < maxFrames) {
        positions.forEach((p1, i) => {
          positions.forEach((p2, j) => {
            if (i === j) return
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const minDist = p1.radius + p2.radius + 60 // Increased spacing

            if (dist < minDist * 2.5) {
              const force = (1200 * (1 - frameCount / maxFrames)) / (dist * dist)
              p1.vx += (dx / dist) * force * 0.12
              p1.vy += (dy / dist) * force * 0.12
            }
          })

          // Gentle attraction to center
          const distToCenter = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2)
          if (distToCenter > 350) {
            p1.vx += (centerX - p1.x) * 0.002
            p1.vy += (centerY - p1.y) * 0.002
          }

          // Damping (increases over time for settling)
          const damping = 0.82 + (frameCount / maxFrames) * 0.1
          p1.vx *= damping
          p1.vy *= damping

          // Update position
          p1.x += p1.vx
          p1.y += p1.vy

          // Boundary constraints with larger padding
          const padding = p1.radius + 40
          p1.x = Math.max(padding, Math.min(dimensions.width - padding, p1.x))
          p1.y = Math.max(padding, Math.min(dimensions.height - padding, p1.y))
        })

        edges.forEach((edge) => {
          const source = nodeMap.get(edge.source)
          const target = nodeMap.get(edge.target)
          if (!source || !target) return

          const dx = target.x - source.x
          const dy = target.y - source.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1

          // Ideal distance inversely proportional to weight (stronger = closer)
          const idealDist = 150 + (1 - edge.weight) * 100 + (source.radius + target.radius)
          const force = (dist - idealDist) * 0.006 * Math.max(edge.weight, 0.1)

          source.vx += (dx / dist) * force
          source.vy += (dy / dist) * force
          target.vx -= (dx / dist) * force
          target.vy -= (dy / dist) * force
        })

        frameCount++
      }

      // Clear and setup transform
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      edges.forEach((edge) => {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        if (!source || !target) return

        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist === 0 || !isFinite(dist)) return

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

        const relStyle = RELATIONSHIP_COLORS[edge.relationshipType as RelationshipType] || RELATIONSHIP_COLORS.related
        const isHovered = hoveredEdge === edge

        const baseThickness = Math.max(1, edge.weight * 5)
        const thickness = isHovered ? baseThickness + 2 : baseThickness

        // Draw edge line with gradient
        const gradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY)
        const sourceColor = CATEGORY_COLORS[source.node.category as NodeCategory]?.fill || "#64748b"
        const targetColor = CATEGORY_COLORS[target.node.category as NodeCategory]?.fill || "#64748b"

        const alphaValue = isHovered ? 0.8 : 0.3 + edge.weight * 0.4
        const alpha = Math.round(alphaValue * 255)
          .toString(16)
          .padStart(2, "0")
        gradient.addColorStop(0, `${sourceColor}${alpha}`)
        gradient.addColorStop(1, `${targetColor}${alpha}`)

        ctx.beginPath()
        ctx.setLineDash(relStyle.dashPattern)
        ctx.moveTo(sourceX, sourceY)
        ctx.lineTo(targetX, targetY)
        ctx.strokeStyle = gradient
        ctx.lineWidth = thickness
        ctx.stroke()
        ctx.setLineDash([])

        // Draw arrow
        const arrowSize = 6 + edge.weight * 4
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
        ctx.fillStyle = `${targetColor}${isHovered ? "ff" : "80"}`
        ctx.fill()

        if (showEdgeLabels || isHovered) {
          const midX = (sourceX + targetX) / 2
          const midY = (sourceY + targetY) / 2

          ctx.font = "9px system-ui"
          ctx.fillStyle = isHovered ? "#1e293b" : "#64748b"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"

          // Background for label
          const label = `${relStyle.label} (${(edge.weight * 100).toFixed(0)}%)`
          const labelWidth = ctx.measureText(label).width + 6
          ctx.fillStyle = "rgba(255,255,255,0.9)"
          ctx.fillRect(midX - labelWidth / 2, midY - 7, labelWidth, 14)

          ctx.fillStyle = isHovered ? "#1e293b" : "#64748b"
          ctx.fillText(label, midX, midY)
        }
      })

      positions.forEach((p) => {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.radius) || p.radius <= 0) {
          return
        }

        if (!p || !p.node) return

        const colors = CATEGORY_COLORS[p.node.category as NodeCategory] || {
          fill: "#64748b",
          stroke: "#475569",
          glowColor: "rgba(100,116,139,0.4)",
        }
        const isHovered = hoveredNode?.node.id === p.node.id

        // Outer glow based on credibility (more credible = larger glow)
        if (p.node.credibilityScore > 0.7 || isHovered) {
          const glowSize = isHovered ? 12 : 6 + p.node.credibilityScore * 6
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius + glowSize, 0, Math.PI * 2)
          ctx.fillStyle = colors.glowColor || "rgba(100,116,139,0.4)"
          ctx.fill()
        }

        // Node shadow
        ctx.beginPath()
        ctx.arc(p.x + 2, p.y + 3, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0,0,0,0.12)"
        ctx.fill()

        const gradX0 = p.x - p.radius * 0.3
        const gradY0 = p.y - p.radius * 0.3
        const gradX1 = p.x
        const gradY1 = p.y
        const gradR0 = 0
        const gradR1 = p.radius

        if (
          !isFinite(gradX0) ||
          !isFinite(gradY0) ||
          !isFinite(gradX1) ||
          !isFinite(gradY1) ||
          !isFinite(gradR0) ||
          !isFinite(gradR1) ||
          gradR1 <= 0
        ) {
          // Fallback to solid color if gradient parameters are invalid
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = colors.fill
          ctx.fill()
        } else {
          // Node circle with gradient
          const nodeGradient = ctx.createRadialGradient(gradX0, gradY0, gradR0, gradX1, gradY1, gradR1)
          nodeGradient.addColorStop(0, colors.fill)
          nodeGradient.addColorStop(1, colors.stroke)

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = nodeGradient
          ctx.fill()
        }

        // Border with weight-based thickness
        const borderWidth = isHovered ? 3 : 1.5 + p.node.engagementWeight * 1.5
        ctx.strokeStyle = isHovered ? "#ffffff" : colors.stroke
        ctx.lineWidth = borderWidth
        ctx.stroke()

        if (p.node.verificationStatus === "verified") {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2)
          ctx.strokeStyle = "#22c55e"
          ctx.lineWidth = 2
          ctx.stroke()
        } else if (p.node.verificationStatus === "debunked") {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2)
          ctx.strokeStyle = "#ef4444"
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Platform indicator
        ctx.fillStyle = colors.textColor || "#ffffff"
        ctx.font = `bold ${Math.max(10, p.radius * 0.55)}px system-ui`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const platformIcon = p.node.platform === "reddit" ? "R" : p.node.platform === "twitter" ? "X" : "W"
        ctx.fillText(platformIcon, p.x, p.y)

        // Node label - always show for larger or hovered nodes
        if (p.radius > 20 || isHovered) {
          ctx.font = `${isHovered ? "bold " : ""}10px system-ui`
          ctx.textAlign = "center"

          let label = p.node.author
          if (label.startsWith("u/")) label = label.substring(0, 14) + (label.length > 14 ? "..." : "")
          else if (label.length > 16) label = label.substring(0, 16) + "..."

          const labelWidth = ctx.measureText(label).width + 10
          ctx.fillStyle = "rgba(255,255,255,0.95)"
          ctx.fillRect(p.x - labelWidth / 2, p.y + p.radius + 5, labelWidth, 16)

          ctx.strokeStyle = colors.stroke
          ctx.lineWidth = 0.5
          ctx.strokeRect(p.x - labelWidth / 2, p.y + p.radius + 5, labelWidth, 16)

          ctx.fillStyle = "#1e293b"
          ctx.fillText(label, p.x, p.y + p.radius + 14)
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
  }, [dimensions, edges, hoveredNode, hoveredEdge, zoom, pan, showEdgeLabels])

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
        if (Math.sqrt(dx * dx + dy * dy) < p.radius + 8) {
          foundNode = p
          break
        }
      }

      setHoveredNode(foundNode)

      // Check for edge hover if no node is hovered
      if (!foundNode) {
        const nodeMap = new Map(positions.map((p) => [p.node.id, p]))
        let foundEdge: GraphEdge | null = null

        for (const edge of edges) {
          const source = nodeMap.get(edge.source)
          const target = nodeMap.get(edge.target)
          if (!source || !target) continue

          // Point-to-line distance
          const dx = target.x - source.x
          const dy = target.y - source.y
          const len = Math.sqrt(dx * dx + dy * dy)
          if (len === 0) continue

          const t = Math.max(0, Math.min(1, ((x - source.x) * dx + (y - source.y) * dy) / (len * len)))
          const projX = source.x + t * dx
          const projY = source.y + t * dy
          const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2)

          if (dist < 10) {
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
    [zoom, pan, isDragging, dragStart, edges],
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
    if (hoveredNode?.node.url && !isDragging) {
      window.open(hoveredNode.node.url, "_blank")
    }
  }, [hoveredNode, isDragging])

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3))
  const handleReset = () => {
    setZoom(0.85)
    setPan({ x: 50, y: 30 })
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8 bg-background/90 backdrop-blur">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8 bg-background/90 backdrop-blur"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} className="h-8 w-8 bg-background/90 backdrop-blur">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant={showEdgeLabels ? "default" : "outline"}
          size="icon"
          onClick={() => setShowEdgeLabels(!showEdgeLabels)}
          className="h-8 w-8 bg-background/90 backdrop-blur"
          title="Toggle edge labels"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full cursor-grab rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 active:cursor-grabbing"
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

      {/* Node Tooltip */}
      {hoveredNode && !isDragging && (
        <div
          className="pointer-events-none absolute z-20 max-w-sm rounded-lg border border-border bg-popover p-4 shadow-xl"
          style={{
            left: Math.min(tooltipPosition.x + 15, dimensions.width - 340),
            top: Math.min(tooltipPosition.y + 15, dimensions.height - 280),
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[hoveredNode.node.category as NodeCategory]?.fill || "#64748b" }}
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_COLORS[hoveredNode.node.category as NodeCategory]?.label || hoveredNode.node.category}
            </span>
            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
              {hoveredNode.node.platform}
            </span>
          </div>

          <p className="mb-2 text-sm font-semibold text-foreground">{hoveredNode.node.author}</p>
          <p className="mb-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{hoveredNode.node.content}</p>

          <div className="mb-3 grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-foreground">
                {(hoveredNode.node.credibilityScore * 100).toFixed(0)}%
              </div>
              <div className="text-muted-foreground">Credibility</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">
                {(hoveredNode.node.engagementWeight * 100).toFixed(0)}%
              </div>
              <div className="text-muted-foreground">Engagement</div>
            </div>
            <div className="text-center">
              <div
                className={`font-semibold ${
                  hoveredNode.node.verificationStatus === "verified"
                    ? "text-green-600"
                    : hoveredNode.node.verificationStatus === "debunked"
                      ? "text-red-600"
                      : hoveredNode.node.verificationStatus === "clarification"
                        ? "text-blue-600"
                        : "text-amber-600"
                }`}
              >
                {hoveredNode.node.verificationStatus}
              </div>
              <div className="text-muted-foreground">Status</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-xs text-muted-foreground">{hoveredNode.node.timestamp || "Unknown date"}</span>
            {hoveredNode.node.url && (
              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                <ExternalLink className="h-3 w-3" />
                Click to open
              </span>
            )}
          </div>
        </div>
      )}

      {/* Edge Tooltip */}
      {hoveredEdge && !hoveredNode && !isDragging && (
        <div
          className="pointer-events-none absolute z-20 max-w-xs rounded-lg border border-border bg-popover p-3 shadow-xl"
          style={{
            left: Math.min(tooltipPosition.x + 15, dimensions.width - 280),
            top: Math.min(tooltipPosition.y + 15, dimensions.height - 150),
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-2 w-8 rounded"
              style={{
                backgroundColor:
                  RELATIONSHIP_COLORS[hoveredEdge.relationshipType as RelationshipType]?.color || "#64748b",
              }}
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {RELATIONSHIP_COLORS[hoveredEdge.relationshipType as RelationshipType]?.label ||
                hoveredEdge.relationshipType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Similarity</div>
              <div className="font-semibold">{(hoveredEdge.similarityScore * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Strength</div>
              <div
                className={`font-semibold capitalize ${
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
    </div>
  )
}
