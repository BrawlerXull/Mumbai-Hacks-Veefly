"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { TrackPropagationResponse } from "@/lib/api-client"

export interface PropagationGraphProps {
  data: TrackPropagationResponse
}

export function PropagationGraph({ data }: PropagationGraphProps) {
  const timeSeriesData = useMemo(() => {
    const nodesByTime: Record<string, { twitter: number; reddit: number; other: number }> = {}

    data.graph_data.nodes.forEach((node) => {
      const time = node.timestamp || "Unknown"
      if (!nodesByTime[time]) {
        nodesByTime[time] = { twitter: 0, reddit: 0, other: 0 }
      }

      if (node.platform === "twitter") {
        nodesByTime[time].twitter++
      } else if (node.platform === "reddit") {
        nodesByTime[time].reddit++
      } else {
        nodesByTime[time].other++
      }
    })

    return Object.entries(nodesByTime).map(([time, counts]) => ({
      time,
      ...counts,
      total: counts.twitter + counts.reddit + counts.other,
    }))
  }, [data])

  const networkData = useMemo(() => {
    return data.graph_data.nodes.map((node, idx) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      platform: node.platform,
      size: data.graph_data.edges.filter((e) => e.source === node.id || e.target === node.id).length * 10 + 100,
      id: node.id,
    }))
  }, [data])

  return (
    <div className="space-y-6">
      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Propagation Timeline</CardTitle>
          <CardDescription>How the claim spread across platforms over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Line type="monotone" dataKey="twitter" stroke="#3b82f6" strokeWidth={2} name="Twitter" />
              <Line type="monotone" dataKey="reddit" stroke="#f97316" strokeWidth={2} name="Reddit" />
              <Line type="monotone" dataKey="other" stroke="#8b5cf6" strokeWidth={2} name="Other" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Network Graph</CardTitle>
          <CardDescription>Nodes represent posts/articles, sized by connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="x" name="Position X" stroke="#64748b" />
              <YAxis dataKey="y" name="Position Y" stroke="#64748b" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter name="Twitter" data={networkData.filter((n) => n.platform === "twitter")} fill="#3b82f6" />
              <Scatter name="Reddit" data={networkData.filter((n) => n.platform === "reddit")} fill="#f97316" />
              <Scatter
                name="Other"
                data={networkData.filter((n) => n.platform !== "twitter" && n.platform !== "reddit")}
                fill="#8b5cf6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
