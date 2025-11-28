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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Users, Share2, Clock } from "lucide-react"
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

    return Object.entries(nodesByTime)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, counts]) => ({
        time,
        ...counts,
        total: counts.twitter + counts.reddit + counts.other,
      }))
  }, [data])

  const platformStats = useMemo(() => {
    const stats = {
      twitter: 0,
      reddit: 0,
      other: 0,
    }

    data.graph_data.nodes.forEach((node) => {
      if (node.platform === "twitter") stats.twitter++
      else if (node.platform === "reddit") stats.reddit++
      else stats.other++
    })

    return [
      { name: "Twitter", value: stats.twitter, color: "#3b82f6" },
      { name: "Reddit", value: stats.reddit, color: "#f97316" },
      { name: "Other", value: stats.other, color: "#8b5cf6" },
    ]
  }, [data])

  const insights = useMemo(() => {
    const totalNodes = data.graph_data.nodes.length
    const totalEdges = data.graph_data.edges.length
    const avgConnections = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0

    // Find peak propagation time
    const peakTime = timeSeriesData.reduce((max, curr) => 
      curr.total > max.total ? curr : max, 
      timeSeriesData[0] || { time: "N/A", total: 0 }
    )

    // Calculate growth rate
    const firstPeriod = timeSeriesData[0]?.total || 0
    const lastPeriod = timeSeriesData[timeSeriesData.length - 1]?.total || 0
    const growthRate = firstPeriod > 0 ? ((lastPeriod - firstPeriod) / firstPeriod) * 100 : 0

    // Find most connected node
    const nodeConnections = data.graph_data.nodes.map((node) => ({
      id: node.id,
      connections: data.graph_data.edges.filter(
        (e) => e.source === node.id || e.target === node.id
      ).length,
    }))
    const mostConnected = nodeConnections.reduce((max, curr) => 
      curr.connections > max.connections ? curr : max,
      { id: "N/A", connections: 0 }
    )

    // Dominant platform
    const dominant = platformStats.reduce((max, curr) => 
      curr.value > max.value ? curr : max,
      platformStats[0]
    )

    return {
      totalNodes,
      totalEdges,
      avgConnections: avgConnections.toFixed(1),
      peakTime: peakTime.time,
      peakCount: peakTime.total,
      growthRate: growthRate.toFixed(1),
      mostConnectedId: mostConnected.id,
      mostConnectedCount: mostConnected.connections,
      dominantPlatform: dominant.name,
      dominantPercentage: ((dominant.value / totalNodes) * 100).toFixed(1),
    }
  }, [data, timeSeriesData, platformStats])

  const networkData = useMemo(() => {
    return data.graph_data.nodes.map((node) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      platform: node.platform,
      size: data.graph_data.edges.filter((e) => e.source === node.id || e.target === node.id).length * 10 + 100,
      id: node.id,
    }))
  }, [data])

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{insights.totalNodes}</div>
            <p className="text-xs text-gray-500 mt-1">Across all platforms</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Connections</CardTitle>
              <Share2 className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{insights.totalEdges}</div>
            <p className="text-xs text-gray-500 mt-1">Avg {insights.avgConnections} per post</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Growth Rate</CardTitle>
              {parseFloat(insights.growthRate) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{insights.growthRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Period over period</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Peak Activity</CardTitle>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{insights.peakCount}</div>
            <p className="text-xs text-gray-500 mt-1">At {insights.peakTime}</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Platform</Badge>
            <p className="text-sm text-gray-700">
              <strong>{insights.dominantPlatform}</strong> is the dominant platform with{" "}
              <strong>{insights.dominantPercentage}%</strong> of all posts
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">Network</Badge>
            <p className="text-sm text-gray-700">
              Most influential node has <strong>{insights.mostConnectedCount} connections</strong>,
              indicating a key spreader in the network
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700">Spread</Badge>
            <p className="text-sm text-gray-700">
              Average of <strong>{insights.avgConnections} connections per post</strong> shows{" "}
              {parseFloat(insights.avgConnections) > 2 ? "high" : "moderate"} viral potential
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Platform Distribution</CardTitle>
            <CardDescription>Content spread across different platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Share</CardTitle>
            <CardDescription>Percentage breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Propagation Timeline</CardTitle>
          <CardDescription>How the claim spread across platforms over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorTwitter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorReddit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="twitter"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#colorTwitter)"
                name="Twitter"
              />
              <Area
                type="monotone"
                dataKey="reddit"
                stackId="1"
                stroke="#f97316"
                fill="url(#colorReddit)"
                name="Reddit"
              />
              <Area
                type="monotone"
                dataKey="other"
                stackId="1"
                stroke="#8b5cf6"
                fill="url(#colorOther)"
                name="Other"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Network Graph</CardTitle>
          <CardDescription>
            Nodes represent posts/articles, sized by connectivity. Larger nodes indicate more influential spreaders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="x" name="Position X" stroke="#64748b" hide />
              <YAxis dataKey="y" name="Position Y" stroke="#64748b" hide />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              <Scatter
                name="Twitter"
                data={networkData.filter((n) => n.platform === "twitter")}
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Scatter
                name="Reddit"
                data={networkData.filter((n) => n.platform === "reddit")}
                fill="#f97316"
                fillOpacity={0.6}
              />
              <Scatter
                name="Other"
                data={networkData.filter((n) => n.platform !== "twitter" && n.platform !== "reddit")}
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}