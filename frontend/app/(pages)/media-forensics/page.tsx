"use client"

import type React from "react"

import { useState } from "react"
import { ImageIcon, Video, Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analyzeImage, analyzeVideo, type ImageAnalysisResponse, type VideoAnalysisResponse } from "@/lib/api-client"

type AnalysisResult = (ImageAnalysisResponse | VideoAnalysisResponse) & { fileName: string }

export default function MediaForensicsPage() {
  const [activeTab, setActiveTab] = useState("image")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append("image", file)

      const data = await analyzeImage(formData)
      setResult({ ...data, fileName: file.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("video", file)

      const data = await analyzeVideo(formData)
      setResult({ ...data, fileName: file.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze video")
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Media Forensics</h1>
              <p className="text-sm text-slate-500">Detect deepfakes in images and videos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
            </TabsList>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Image</CardTitle>
                  <CardDescription>Analyze images for deepfakes (.jpg, .png)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                    <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 font-medium">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isLoading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Tab */}
            <TabsContent value="video" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Video</CardTitle>
                  <CardDescription>Analyze videos for deepfakes (.mp4)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                    <Video className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 font-medium">Click to upload</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={isLoading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">MP4 up to 50MB</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="mt-4 text-slate-600">Analyzing media for deepfakes...</p>
              <p className="text-sm text-slate-400">This may take a moment</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
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
              {/* Preview */}
              {preview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="Uploaded media"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle>Detection Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {result.prediction === "Real" ? (
                      <>
                        <CheckCircle className="h-12 w-12 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-lg font-bold text-green-600">Appears Authentic</p>
                          <p className="text-sm text-slate-600">No signs of deepfake detected</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-12 w-12 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="text-lg font-bold text-red-600">Deepfake Detected</p>
                          <p className="text-sm text-slate-600">This media appears to be manipulated</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Confidence */}
              <Card>
                <CardHeader>
                  <CardTitle>Confidence Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            result.confidence > 0.8 ? "bg-green-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{result.details}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
