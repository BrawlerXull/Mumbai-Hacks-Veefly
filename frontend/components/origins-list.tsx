"use client"

import type React from "react"
import { Globe, MessageCircle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type GraphNode, CATEGORY_COLORS, type NodeCategory } from "@/lib/graph-data"

interface OriginsListProps {
  origins: GraphNode[]
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  twitter: <span className="text-xs font-bold">X</span>,
  reddit: <MessageCircle className="h-3.5 w-3.5" />,
  web: <Globe className="h-3.5 w-3.5" />,
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-slate-100 text-slate-700 border-slate-200",
  reddit: "bg-orange-50 text-orange-700 border-orange-200",
  web: "bg-blue-50 text-blue-700 border-blue-200",
}

export function OriginsList({ origins }: OriginsListProps) {
  return (
    <div className="space-y-4">
      {origins.map((origin) => {
        const categoryColors = CATEGORY_COLORS[origin.category as NodeCategory]
        return (
          <a
            key={origin.id}
            href={origin.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(PLATFORM_COLORS[origin.platform], "gap-1.5")}>
                  {PLATFORM_ICONS[origin.platform]}
                  <span className="capitalize">{origin.platform}</span>
                </Badge>
                {categoryColors && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: categoryColors.fill }}
                    title={categoryColors.label}
                  />
                )}
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mb-2 line-clamp-2 text-sm text-slate-700">{origin.content}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">{origin.author}</span>
              <span>{origin.timestamp || "Unknown"}</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
