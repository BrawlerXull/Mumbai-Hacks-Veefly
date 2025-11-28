"use client"

import { Network, GitBranch, Users, Activity, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import type { TrackPropagationResponse } from "@/lib/api-client"

export interface GraphStatsProps {
  data: TrackPropagationResponse
}

export function GraphStats({ data }: GraphStatsProps) {
  const platformCounts = data.graph_data.nodes.reduce(
    (acc, node) => {
      acc[node.platform] = (acc[node.platform] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const maxConnections = Math.max(
    ...data.graph_data.nodes.map(
      (node) => data.graph_data.edges.filter((e) => e.source === node.id || e.target === node.id).length,
    ),
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <GitBranch className="h-3.5 w-3.5" />
            Total Nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-900">{data.graph_stats.nodes}</p>
          <p className="text-xs text-slate-500">Posts & articles</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Network className="h-3.5 w-3.5" />
            Total Edges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-900">{data.graph_stats.edges}</p>
          <p className="text-xs text-slate-500">Connections</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Avg Connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-900">
            {data.graph_stats.nodes > 0 ? (data.graph_stats.edges / data.graph_stats.nodes).toFixed(1) : 0}
          </p>
          <p className="text-xs text-slate-500">Per node</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Users className="h-3.5 w-3.5" />
            Platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-900">{Object.keys(platformCounts).length}</p>
          <p className="text-xs text-slate-500">Unique sources</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Activity className="h-3.5 w-3.5" />
            Max Reach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-900">{maxConnections}</p>
          <p className="text-xs text-slate-500">Connections</p>
        </CardContent>
      </Card>
    </div>
  )
}
