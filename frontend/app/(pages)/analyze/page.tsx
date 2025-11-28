"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { analyzeText, type TextAnalysisResponse } from "@/lib/api-client"

export default function TextAnalysisPage() {
  const [activeTab, setActiveTab] = useState("text")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TextAnalysisResponse | null>(null)

  // Text tab
  const [text, setText] = useState("")
  const [source, setSource] = useState("")
  const [title, setTitle] = useState("")

  // URL tab
  const [url, setUrl] = useState("")

  // File tab
  const [fileName, setFileName] = useState("")

  const handleAnalyzeText = async () => {
    if (!text.trim()) {
      setError("Please enter text to analyze")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("text", text)
      if (source) formData.append("source", source)
      if (title) formData.append("title", title)

      const data = await analyzeText(formData)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a URL to analyze")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("url", url)
      if (source) formData.append("source", source)
      if (title) formData.append("title", title)

      const data = await analyzeText(formData)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze URL")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (source) formData.append("source", source)
      if (title) formData.append("title", title)

      const data = await analyzeText(formData)
      setResult(data)
      setFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze file")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Text Analysis</h1>
              <p className="text-sm text-slate-500">Detect fake news and analyze credibility</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">Paste Text</TabsTrigger>
              <TabsTrigger value="url">Enter URL</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paste Text Content</CardTitle>
                  <CardDescription>Paste the article or text you want to analyze</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <Input placeholder="Source (optional)" value={source} onChange={(e) => setSource(e.target.value)} />
                  <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Button
                    onClick={handleAnalyzeText}
                    disabled={isLoading || !text.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Credibility"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analyze Article from URL</CardTitle>
                  <CardDescription>Provide a URL to the article you want to analyze</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    type="url"
                  />
                  <Input placeholder="Source (optional)" value={source} onChange={(e) => setSource(e.target.value)} />
                  <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Button
                    onClick={handleAnalyzeUrl}
                    disabled={isLoading || !url.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Credibility"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* File Tab */}
            <TabsContent value="file" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Text File</CardTitle>
                  <CardDescription>Upload a .txt file for analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 font-medium">Click to upload</span>
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        disabled={isLoading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">or drag and drop</p>
                  </div>
                  {fileName && <p className="text-sm text-slate-600">Selected: {fileName}</p>}
                  <Input placeholder="Source (optional)" value={source} onChange={(e) => setSource(e.target.value)} />
                  <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50 mb-8">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Analysis Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="space-y-6">
              {/* Authenticity Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Authenticity Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            result.authenticity_score > 0.7
                              ? "bg-green-500"
                              : result.authenticity_score > 0.4
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${result.authenticity_score * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">
                      {(result.authenticity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Category: <span className="font-semibold">{result.category}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Report */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{result.report}</p>
                </CardContent>
              </Card>

              {/* Key Claims */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.key_claims.map((claim, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{typeof claim === "string" ? claim : claim.claim}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
