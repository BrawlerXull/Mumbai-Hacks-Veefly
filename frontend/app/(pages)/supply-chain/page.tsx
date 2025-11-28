"use client";
import { useState } from "react";
import { Search, Network, AlertTriangle, Info, Loader2, TrendingUp, Clock, Globe } from "lucide-react";
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
    <div className="w-full min-h-screen bg-[#0a0a0a]">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#151515_1px,transparent_1px),linear-gradient(to_bottom,#151515_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20 animate-pulse">
              <Network className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Supply Chain Tracker
              </h1>
              <p className="text-sm text-gray-400">
                Track how claims propagate across the web
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Search Section with Animation */}
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative flex gap-3 p-1">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-colors duration-200 peer-focus:text-emerald-400" />
                  <Input
                    placeholder='Enter a claim to track (e.g., "Dharmendra Death")'
                    className="peer border-gray-800 bg-[#151515] pl-12 h-14 rounded-xl text-gray-200 placeholder-gray-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="h-14 px-8 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Network className="mr-2 h-5 w-5" />
                      Track Claim
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State with Advanced Animation */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="relative">
                {/* Spinning Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                
                {/* Center Icon */}
                <div className="relative flex items-center justify-center w-24 h-24">
                  <Network className="h-10 w-10 text-emerald-400 animate-pulse" />
                </div>
              </div>
              
              <div className="mt-8 text-center space-y-2">
                <p className="text-lg font-medium text-gray-200 animate-pulse">
                  Tracking claim propagation across the web...
                </p>
                <p className="text-sm text-gray-500">This may take a moment</p>
              </div>

              {/* Progress Indicators */}
              <div className="mt-8 flex gap-4">
                {["Scanning", "Analyzing", "Mapping"].map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-2 px-4 py-2 bg-[#151515] rounded-lg border border-gray-800 animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-gray-400">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="border-red-500/30 bg-red-500/10 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <CardContent className="flex items-center gap-3 py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-300">
                    Failed to track claim
                  </p>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results State */}
          {!isLoading && !error && !data && hasSearched && (
            <Card className="border-gray-800 bg-[#151515] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-700/20 blur-2xl rounded-full" />
                  <Network className="relative h-16 w-16 text-gray-700" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-300">No propagation data found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try searching for a different claim
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!hasSearched && (
            <Card className="border-gray-800 bg-[#151515] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5" />
              <CardContent className="relative flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <Search className="relative h-16 w-16 text-emerald-400" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-200">
                  Enter a claim to track its propagation
                </p>
                <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
                  Search for topics like "Dharmendra Death" or any claim you want to analyze
                </p>

                {/* Feature Highlights */}
                <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-2xl">
                  {[
                    { icon: TrendingUp, label: "Track Spread", desc: "Monitor viral claims" },
                    { icon: Clock, label: "Timeline View", desc: "See propagation history" },
                    { icon: Globe, label: "Multi-Platform", desc: "Cross-platform analysis" }
                  ].map((feature, i) => (
                    <div
                      key={feature.label}
                      className="flex flex-col items-center gap-2 p-4 bg-[#0a0a0a] rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <feature.icon className="h-6 w-6 text-emerald-400" />
                      <p className="text-sm font-medium text-gray-300">{feature.label}</p>
                      <p className="text-xs text-gray-600 text-center">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {data && !isLoading && (
            <div className="space-y-8 animate-in fade-in duration-700">
              {/* Claim Header with Animation */}
              <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20 animate-in slide-in-from-top-4 duration-500">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Tracking Claim</p>
                  <h2 className="text-lg font-semibold text-white">
                    "{data.claim}"
                  </h2>
                </div>
              </div>

              {/* Graph Stats with Staggered Animation */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                <h3 className="mb-4 text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Network Statistics
                </h3>
                <GraphStats data={data} />
              </div>

              {/* Graph Legend */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
                <Card className="border-gray-800 bg-[#151515] hover:border-gray-700 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-200">Legend</CardTitle>
                    <CardDescription className="text-gray-500">
                      Understanding the visualization elements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GraphLegend />
                  </CardContent>
                </Card>
              </div>

              {/* Knowledge Graph */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
                <Card className="border-gray-800 bg-[#151515] overflow-hidden hover:border-gray-700 transition-all duration-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                  <CardHeader className="relative">
                    <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                      <Network className="h-4 w-4 text-emerald-400" />
                      Knowledge Graph
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      Interactive network of connected claims and sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 relative">
                    <KnowledgeGraph
                      nodes={data.graph_data.nodes.map((node) => ({
                        ...node,
                        category: "rumor",
                        credibilityScore: 0.5,
                        engagementWeight: 0.5,
                        verificationStatus: "unverified",
                        platform: node.platform as "web" | "twitter" | "reddit",
                      }))}
                      edges={data.graph_data.edges.map((edge) => ({
                        ...edge,
                        relationshipType: "related",
                        strengthCategory: "moderate",
                        similarityScore: 0.5,
                      }))}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Propagation Graph */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
                <PropagationGraph data={data} />
              </div>

              {/* Narrative Report */}
              <Card className="border-gray-800 bg-[#151515] hover:border-gray-700 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '500ms' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-gray-200">
                    <Info className="h-4 w-4 text-blue-400" />
                    Narrative Report
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    AI-generated analysis of claim propagation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-sm leading-relaxed text-gray-400">
                      {data.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Origins List */}
              <Card className="border-gray-800 bg-[#151515] hover:border-gray-700 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '600ms' }}>
                <CardHeader>
                  <CardTitle className="text-gray-200 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    Origin Sources
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Earliest detections of the claim
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OriginsList
                    origins={data.origins.map((origin) => ({
                      ...origin,
                      category: "rumor",
                      credibilityScore: 0.5,
                      engagementWeight: 0.5,
                      verificationStatus: "unverified",
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