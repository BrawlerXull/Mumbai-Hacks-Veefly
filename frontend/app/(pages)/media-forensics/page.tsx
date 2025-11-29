"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ImageIcon, Video, Loader2, AlertTriangle, CheckCircle, XCircle, Upload, Sparkles, Shield, Info, Zap, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analyzeImage, analyzeVideo, type ImageAnalysisResponse, type VideoAnalysisResponse } from "@/lib/api-client"

type AnalysisResult = (ImageAnalysisResponse | VideoAnalysisResponse) & { fileName: string }

export default function MediaForensicsPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [activeTab, setActiveTab] = useState("image")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Intro animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const syntheticEvent = {
      target: { files: [file] }
    } as unknown as React.ChangeEvent<HTMLInputElement>

    if (activeTab === "image") {
      handleImageUpload(syntheticEvent)
    } else {
      handleVideoUpload(syntheticEvent)
    }
  }

  // Intro Animation Screen
  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.3),transparent_70%)] animate-pulse" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(168,85,247,0.1),rgba(139,92,246,0.2),rgba(168,85,247,0.1))] animate-spin-slow" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf614_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf614_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)]" />
          
          {/* Floating Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Central Content */}
        <div className="relative z-10 text-center">
          {/* Icon with Multiple Rings */}
          <div className="relative mx-auto w-32 h-32 mb-8">
            {/* Outer Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
            
            {/* Spinning Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-violet-500 animate-spin" />
            
            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-violet-500/30 blur-2xl animate-pulse" />
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Shield className="h-16 w-16 text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse" />
                <Eye className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-purple-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Media Forensics
            </h1>
            <p className="text-lg text-purple-300 animate-fade-in-up flex items-center justify-center gap-2" style={{ animationDelay: '0.4s' }}>
              <Zap className="h-5 w-5" />
              AI-Powered Deepfake Detection
            </p>
            
            {/* Loading Bar */}
            <div className="max-w-xs mx-auto mt-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 animate-loading-bar" />
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p className="mt-8 text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            Initializing neural networks...
          </p>
        </div>
      </div>
    )
  }

  // Main Application
  return (
    <div className="w-full min-h-screen bg-[#0a0a0a] animate-fade-in">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#151515_1px,transparent_1px),linear-gradient(to_bottom,#151515_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40 animate-slide-down">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 animate-pulse opacity-50" />
                <Shield className="relative h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Media Forensics</h1>
                <p className="text-sm text-gray-400">Detect deepfakes with AI precision</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">99.2%</p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-400">1M+</p>
                <p className="text-xs text-gray-500">Analyzed</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-8 relative z-10 bg-black/70">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Advanced Neural Detection</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Verify Media <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">Authenticity</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Upload images or videos to detect AI-generated deepfakes using state-of-the-art machine learning algorithms
            </p>
          </div>

          {/* Tabs with Enhanced Styling */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <TabsList className="grid w-full grid-cols-2 bg-[#151515] border border-gray-800 p-1 rounded-xl shadow-lg">
              <TabsTrigger 
                value="image" 
                className="  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 text-gray-400 transition-all duration-300 rounded-lg"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger 
                value="video"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/50 text-gray-400 transition-all duration-300 rounded-lg"
              >
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
            </TabsList>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4 animate-fade-in-up">
              <Card className="border-gray-800 bg-[#151515] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5 pointer-events-none" />
                <CardHeader className="relative">
                  <CardTitle className="text-gray-200 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-purple-400" />
                    Upload Image for Analysis
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Supports JPG, PNG, WEBP • Max 10MB
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
                      dragActive
                        ? "border-purple-500 bg-purple-500/10 scale-[1.02] shadow-lg shadow-purple-500/20"
                        : "border-gray-700 hover:border-gray-600 bg-[#0a0a0a]"
                    }`}
                  >
                    {/* Animated Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 rounded-2xl transition-opacity duration-300 ${
                      dragActive ? "opacity-100 animate-pulse" : "opacity-0"
                    }`} />
                    
                    <div className="relative">
                      <div className="relative inline-block mb-6">
                        <div className={`absolute inset-0 bg-purple-500/30 blur-3xl rounded-full transition-all duration-300 ${
                          dragActive ? "scale-150 opacity-100" : "scale-100 opacity-0"
                        }`} />
                        <div className={`relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 transition-all duration-300 ${
                          dragActive ? "scale-110 rotate-12" : "scale-100 rotate-0"
                        }`}>
                          <ImageIcon className={`h-16 w-16 transition-all duration-300 ${
                            dragActive ? "text-purple-400" : "text-gray-600"
                          }`} />
                        </div>
                      </div>
                      
                      <div>
                        <label className="cursor-pointer group inline-block">
                          <span className="text-lg font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                            Click to upload
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isLoading}
                            className="hidden"
                          />
                        </label>
                        <p className="text-gray-500 mt-3">or drag and drop your image here</p>
                        <div className="flex items-center justify-center gap-4 mt-6">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Secure</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>Fast</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Shield className="h-4 w-4 text-purple-500" />
                            <span>Private</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-xl border border-purple-500/20">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Info className="h-5 w-5 text-purple-400 flex-shrink-0" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-200 font-semibold mb-1">Advanced AI Detection</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Our neural network analyzes facial features, lighting inconsistencies, digital artifacts, and pixel-level manipulation patterns to detect even the most sophisticated deepfakes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Tab */}
            <TabsContent value="video" className="space-y-4 animate-fade-in-up">
              <Card className="border-gray-800 bg-[#151515] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                <CardHeader className="relative">
                  <CardTitle className="text-gray-200 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-violet-400" />
                    Upload Video for Analysis
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Supports MP4, MOV, AVI • Max 50MB
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
                      dragActive
                        ? "border-violet-500 bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/20"
                        : "border-gray-700 hover:border-gray-600 bg-[#0a0a0a]"
                    }`}
                  >
                    {/* Animated Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-violet-500/0 rounded-2xl transition-opacity duration-300 ${
                      dragActive ? "opacity-100 animate-pulse" : "opacity-0"
                    }`} />
                    
                    <div className="relative">
                      <div className="relative inline-block mb-6">
                        <div className={`absolute inset-0 bg-violet-500/30 blur-3xl rounded-full transition-all duration-300 ${
                          dragActive ? "scale-150 opacity-100" : "scale-100 opacity-0"
                        }`} />
                        <div className={`relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 transition-all duration-300 ${
                          dragActive ? "scale-110 rotate-12" : "scale-100 rotate-0"
                        }`}>
                          <Video className={`h-16 w-16 transition-all duration-300 ${
                            dragActive ? "text-violet-400" : "text-gray-600"
                          }`} />
                        </div>
                      </div>
                      
                      <div>
                        <label className="cursor-pointer group inline-block">
                          <span className="text-lg font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
                            Click to upload
                          </span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            disabled={isLoading}
                            className="hidden"
                          />
                        </label>
                        <p className="text-gray-500 mt-3">or drag and drop your video here</p>
                        <div className="flex items-center justify-center gap-4 mt-6">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Secure</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>Fast</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Shield className="h-4 w-4 text-violet-500" />
                            <span>Private</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                      <Info className="h-5 w-5 text-violet-400 flex-shrink-0" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-200 font-semibold mb-1">Frame-by-Frame Analysis</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Videos are analyzed across multiple frames to detect temporal inconsistencies, unnatural movements, facial morphing, and other signs of video manipulation or deepfake generation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Loading State with Epic Animation */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="relative">
                {/* Multiple Spinning Rings with Glow */}
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-violet-500 animate-spin shadow-lg shadow-purple-500/50" />
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-violet-500 border-l-purple-500 animate-spin shadow-lg shadow-violet-500/50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-4 rounded-full border-4 border-transparent border-b-purple-400 animate-spin" style={{ animationDuration: '2s' }} />
                
                {/* Pulsing Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-violet-500/30 blur-2xl animate-pulse" />
                
                {/* Center Icon */}
                <div className="relative flex items-center justify-center w-32 h-32">
                  <Sparkles className="h-12 w-12 text-purple-400 animate-pulse" />
                </div>
              </div>
              
              <div className="mt-10 text-center space-y-3">
                <p className="text-xl font-semibold text-gray-200 animate-pulse">
                  Analyzing media for deepfakes...
                </p>
                <p className="text-sm text-gray-500">Our AI is examining every detail</p>
              </div>

              {/* Analysis Steps */}
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {["Processing Frames", "Detecting Artifacts", "Neural Analysis", "Computing Score"].map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#151515] rounded-xl border border-gray-800 animate-fade-in-up shadow-lg"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 animate-pulse" />
                    <span className="text-sm text-gray-400">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="border-red-500/30 bg-red-500/10 mb-8 animate-fade-in shadow-xl shadow-red-500/10">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-300 text-lg">Analysis Failed</p>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="space-y-6 animate-fade-in">
              {/* Preview */}
              {preview && (
                <Card className="border-gray-800 bg-[#151515] overflow-hidden hover:border-gray-700 transition-all duration-300 shadow-xl animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="text-gray-200 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-purple-400" />
                      Uploaded Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      <img
                        src={preview || "/placeholder.svg"}
                        alt="Uploaded media"
                        className="relative max-w-full h-auto rounded-xl border border-gray-800 shadow-2xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prediction with Enhanced Design */}
              <Card className="border-gray-800 bg-[#151515] overflow-hidden hover:border-gray-700 transition-all duration-300 shadow-xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className={`absolute inset-0 pointer-events-none ${
                  result.prediction === "Real" 
                    ? "bg-gradient-to-br from-green-500/10 via-transparent to-transparent" 
                    : "bg-gradient-to-br from-red-500/10 via-transparent to-transparent"
                }`} />
                <CardHeader className="relative">
                  <CardTitle className="text-gray-200 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    Detection Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center gap-6 p-8 rounded-2xl bg-[#0a0a0a] border border-gray-800">
                    {result.prediction === "Real" ? (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/30 blur-2xl rounded-full animate-pulse" />
                          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                            <CheckCircle className="h-14 w-14 text-green-400 animate-scale-in" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400 mb-1">Appears Authentic</p>
                          <p className="text-gray-400">No signs of deepfake or manipulation detected</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full animate-pulse" />
                          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30">
                            <XCircle className="h-14 w-14 text-red-400 animate-scale-in" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-400 mb-1">Deepfake Detected</p>
                          <p className="text-gray-400">This media appears to be artificially generated or manipulated</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Confidence Score with Progress Animation */}
              <Card className="border-gray-800 bg-[#151515] hover:border-gray-700 transition-all duration-300 shadow-xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <CardHeader>
                  <CardTitle className="text-gray-200 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Confidence Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-1000 ease-out shadow-lg ${
                            result.confidence > 0.8 
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/50" 
                              : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/50"
                          }`}
                          style={{ 
                            width: `${result.confidence * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-3">
                        <span className="text-xs text-gray-600 font-medium">Low</span>
                        <span className="text-xs text-gray-600 font-medium">High</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className={`text-4xl font-bold ${
                        result.confidence > 0.8 ? "text-green-400" : "text-amber-400"
                      }`}>
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Confidence</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details */}
              <Card className="border-gray-800 bg-[#151515] hover:border-gray-700 transition-all duration-300 shadow-xl animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <CardHeader>
                  <CardTitle className="text-gray-200 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-400" />
                    Detailed Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">{result.details}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.6s ease-out forwards;
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}