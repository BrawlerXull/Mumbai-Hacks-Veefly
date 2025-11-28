"use client";

import { useState } from "react";
import { Search, Network, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  trackPropagation,
  type TrackPropagationResponse,
} from "@/lib/api-client";
import { PropagationGraph } from "@/components/propagation-graph";
import { GraphStats } from "@/components/graph-stats";
import { GraphLegend } from "@/components/graph-legend";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { OriginsList } from "@/components/origins-list";

export default function SupplyChainPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackPropagationResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    console.log("[v0] Sending track propagation request:", {
      claim: searchQuery,
    });

    try {
      const result = await trackPropagation(searchQuery);
      console.log("[v0] Received response:", result);
      setData(result);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to track claim";
      console.log("[v0] Error occurred:", errorMsg);
      setError(errorMsg);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Supply Chain Tracker
              </h1>
              <p className="text-sm text-slate-500">
                Track how claims propagate across the web
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Section */}
          <div className="mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder='Enter a claim to track (e.g., "Dharmendra Death")'
                  className="border-slate-200 bg-white pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  "Track Claim"
                )}
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
              <p className="mt-4 text-slate-600">
                Tracking claim propagation across the web...
              </p>
              <p className="text-sm text-slate-400">This may take a moment</p>
            </div>
          )}

          {error && !isLoading && (
            <Card className="border-red-200 bg-red-50 mb-8">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">
                    Failed to track claim
                  </p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && !data && hasSearched && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Network className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-600">No propagation data found</p>
                <p className="text-sm text-slate-400">
                  Try searching for a different claim
                </p>
              </CardContent>
            </Card>
          )}

          {!hasSearched && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-600">
                  Enter a claim to track its propagation
                </p>
                <p className="text-sm text-slate-400">
                  Search for topics like "Dharmendra Death" or any claim you
                  want to analyze
                </p>
              </CardContent>
            </Card>
          )}

          {data && !isLoading && (
            <div className="space-y-8">
              {/* Claim Header */}
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-medium text-slate-900">
                  Tracking:{" "}
                  <span className="text-green-600">"{data.claim}"</span>
                </h2>
              </div>

              {/* Graph Stats */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                  Network Statistics
                </h3>
                <GraphStats data={data} />
              </div>

              {/* Graph Legend */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Legend</CardTitle>
                    <CardDescription>
                      Understanding the visualization elements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GraphLegend />
                  </CardContent>
                </Card>
              </div>

              {/* Knowledge Graph */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Knowledge Graph</CardTitle>
                    <CardDescription>
                      Interactive network of connected claims and sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <KnowledgeGraph
                      nodes={data.graph_data.nodes.map((node) => ({
                        ...node,
                        category: "rumor", // Default category
                        credibilityScore: 0.5, // Default score
                        engagementWeight: 0.5, // Default weight
                        verificationStatus: "unverified", // Default status
                        platform: node.platform as "web" | "twitter" | "reddit",
                      }))}
                      edges={data.graph_data.edges.map((edge) => ({
                        ...edge,
                        relationshipType: "related", // Default relationship
                        strengthCategory: "moderate", // Default strength
                        similarityScore: 0.5, // Default similarity
                      }))}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Propagation Graph */}
              <div>
                <PropagationGraph data={data} />
              </div>

              {/* Narrative Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                    <Info className="h-4 w-4" />
                    Narrative Report
                  </CardTitle>
                  <CardDescription>
                    AI-generated analysis of claim propagation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {data.explanation}
                  </p>
                </CardContent>
              </Card>

              {/* Origins List */}
              <Card>
                <CardHeader>
                  <CardTitle>Origin Sources</CardTitle>
                  <CardDescription>
                    Earliest detections of the claim
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OriginsList
                    origins={data.origins.map((origin) => ({
                      ...origin,
                      category: "rumor", // Default category
                      credibilityScore: 0.5, // Default score
                      engagementWeight: 0.5, // Default weight
                      verificationStatus: "unverified", // Default status
                      platform: origin.platform as "web" | "twitter" | "reddit",
                    }))}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
