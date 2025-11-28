"use client"

import { CATEGORY_COLORS, RELATIONSHIP_COLORS, type NodeCategory, type RelationshipType } from "@/lib/graph-data"

export function GraphLegend() {
  const categories = Object.entries(CATEGORY_COLORS) as [NodeCategory, (typeof CATEGORY_COLORS)[NodeCategory]][]
  const relationships = Object.entries(RELATIONSHIP_COLORS) as [
    RelationshipType,
    (typeof RELATIONSHIP_COLORS)[RelationshipType],
  ][]

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Node Categories</p>
        <div className="flex flex-wrap items-center gap-3">
          {categories.map(([category, colors]) => (
            <div key={category} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full border-2"
                style={{ backgroundColor: colors.fill, borderColor: colors.stroke }}
              />
              <span className="text-xs text-muted-foreground">{colors.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relationship Types</p>
        <div className="flex flex-wrap items-center gap-3">
          {relationships.map(([type, style]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="h-0.5 w-4 rounded"
                style={{
                  backgroundColor: style.color,
                  borderStyle: style.dashPattern.length > 0 ? "dashed" : "solid",
                }}
              />
              <span className="text-xs text-muted-foreground">{style.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Verification Status
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-green-500 bg-transparent" />
              <span className="text-xs text-muted-foreground">Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-dashed border-red-500 bg-transparent" />
              <span className="text-xs text-muted-foreground">Debunked</span>
            </div>
          </div>
        </div>

        <div className="border-l border-border pl-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platforms</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold">
                W
              </div>
              <span className="text-xs text-muted-foreground">Web</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold">
                R
              </div>
              <span className="text-xs text-muted-foreground">Reddit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold">
                X
              </div>
              <span className="text-xs text-muted-foreground">Twitter</span>
            </div>
          </div>
        </div>

        <div className="border-l border-border pl-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visual Cues</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="text-xs text-muted-foreground">Node size = connections</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-6 bg-slate-400" />
              <span className="text-xs text-muted-foreground">Edge thickness = weight</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
