"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Shield, CheckCircle, AlertTriangle, FileText, Link as LinkIcon, Upload, Sparkles, Info, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { analyzeText, type TextAnalysisResponse } from "@/lib/api-client"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  analysis?: TextAnalysisResponse
  timestamp: Date
}

export default function TextAnalysisChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "👋 Hi! I'm your AI-powered fact-checking assistant. I can help you analyze text for credibility and detect potential misinformation.\n\nYou can:\n• Paste text directly\n• Share a URL to an article\n• Upload a .txt file\n\nJust send me what you'd like to analyze!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const isURL = (text: string) => {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  const handleAnalyze = async (content: string, isUrl: boolean = false) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      if (isUrl) {
        formData.append("url", content)
      } else {
        formData.append("text", content)
      }

      const data = await analyzeText(formData)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I've completed the analysis. Here are the results:",
        analysis: data,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Sorry, I encountered an error: ${err instanceof Error ? err.message : "Failed to analyze content"}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const isUrl = isURL(input.trim())
    handleAnalyze(input.trim(), isUrl)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `📄 Uploaded file: ${file.name}`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const data = await analyzeText(formData)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I've analyzed your file. Here are the results:",
        analysis: data,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Sorry, I couldn't analyze the file: ${err instanceof Error ? err.message : "Failed to analyze file"}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
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
    if (file && file.type === "text/plain") {
      handleFileUpload(file)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div
      className="flex flex-col h-screen bg-[#0a0a0a]"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">FactCheck AI</h1>
              <p className="text-xs text-gray-400">AI-Powered Credibility Analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.type === "assistant" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex-shrink-0">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              )}

              <div className={`flex flex-col gap-3 max-w-2xl ${message.type === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      : "bg-[#151515] text-gray-300 border border-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Analysis Results */}
                {message.analysis && (
                  <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Authenticity Score Card */}
                    <Card className="border-gray-800 bg-[#151515] overflow-hidden">
                      <div
                        className={`absolute inset-0 pointer-events-none ${
                          message.analysis.authenticity_score > 0.7
                            ? "bg-gradient-to-br from-green-500/5 via-transparent to-transparent"
                            : message.analysis.authenticity_score > 0.4
                            ? "bg-gradient-to-br from-amber-500/5 via-transparent to-transparent"
                            : "bg-gradient-to-br from-red-500/5 via-transparent to-transparent"
                        }`}
                      />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="h-5 w-5 text-blue-400" />
                          <h3 className="font-semibold text-gray-200">Authenticity Score</h3>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1">
                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 ease-out ${
                                  message.analysis.authenticity_score > 0.7
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                    : message.analysis.authenticity_score > 0.4
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                    : "bg-gradient-to-r from-red-500 to-rose-500"
                                }`}
                                style={{ width: `${message.analysis.authenticity_score * 100}%` }}
                              />
                            </div>
                          </div>
                          <span
                            className={`text-2xl font-bold ${
                              message.analysis.authenticity_score > 0.7
                                ? "text-green-400"
                                : message.analysis.authenticity_score > 0.4
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {(message.analysis.authenticity_score * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] rounded-lg border border-gray-800">
                          <Shield
                            className={`h-4 w-4 ${
                              message.analysis.authenticity_score > 0.7
                                ? "text-green-400"
                                : message.analysis.authenticity_score > 0.4
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          />
                          <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="text-sm font-semibold text-gray-200">{message.analysis.category}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Analysis Report */}
                    <Card className="border-gray-800 bg-[#151515]">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Info className="h-5 w-5 text-blue-400" />
                          <h3 className="font-semibold text-gray-200">Detailed Analysis</h3>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none space-y-3">
                          {message.analysis.report.split('\n').map((line, idx) => {
                            const trimmedLine = line.trim()
                            
                            // Skip bullet point markers that are standalone
                            if (trimmedLine === '•' || trimmedLine === '*' || trimmedLine === '-') {
                              return null
                            }
                            
                            // Handle headers (##, ###, etc)
                            if (trimmedLine.startsWith('###')) {
                              return (
                                <h4 key={idx} className="text-base font-semibold text-gray-200 mt-6 mb-3 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-blue-500 rounded"></span>
                                  {trimmedLine.replace(/^###\s*/, '').replace(/^\d+\.\s*/, '')}
                                </h4>
                              )
                            }
                            if (trimmedLine.startsWith('##')) {
                              return (
                                <h3 key={idx} className="text-lg font-bold text-gray-100 mt-6 mb-3 flex items-center gap-2">
                                  <span className="w-1.5 h-5 bg-cyan-500 rounded"></span>
                                  {trimmedLine.replace(/^##\s*/, '')}
                                </h3>
                              )
                            }
                            
                            // Handle numbered sections (1., 2., etc.) at start of line
                            if (/^\d+\.\s+[A-Z]/.test(trimmedLine)) {
                              return (
                                <h4 key={idx} className="text-base font-semibold text-gray-200 mt-5 mb-2 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-blue-500 rounded"></span>
                                  {trimmedLine}
                                </h4>
                              )
                            }
                            
                            // Handle list items with * or - (including those with bold text)
                            if (/^[\*\-]\s+/.test(trimmedLine)) {
                              const content = trimmedLine.replace(/^[\*\-]\s+/, '')
                              
                              // Parse bold text within list items
                              const renderContent = () => {
                                if (content.includes('**')) {
                                  const parts = content.split(/(\*\*.*?\*\*)/)
                                  return parts.map((part, i) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                      return <strong key={i} className="text-gray-200 font-semibold">{part.slice(2, -2)}</strong>
                                    }
                                    // Replace backticks for inline code
                                    if (part.includes('`')) {
                                      return part.split(/(`.*?`)/).map((subpart, j) => {
                                        if (subpart.startsWith('`') && subpart.endsWith('`')) {
                                          return <code key={j} className="text-cyan-400 bg-gray-900 px-1 rounded text-xs">{subpart.slice(1, -1)}</code>
                                        }
                                        return subpart
                                      })
                                    }
                                    return part
                                  })
                                }
                                return content
                              }
                              
                              return (
                                <div key={idx} className="flex items-start gap-2.5 ml-4 my-2">
                                  <span className="text-blue-400 mt-1 text-lg leading-none">•</span>
                                  <div className="text-sm text-gray-400 leading-relaxed flex-1">
                                    {renderContent()}
                                  </div>
                                </div>
                              )
                            }
                            
                            // Handle horizontal rules
                            if (trimmedLine === '---' || trimmedLine === '•') {
                              return <hr key={idx} className="border-gray-800 my-4" />
                            }
                            
                            // Handle empty lines
                            if (trimmedLine === '') {
                              return <div key={idx} className="h-1"></div>
                            }
                            
                            // Handle lines with bold text (**text**)
                            if (line.includes('**')) {
                              const parts = line.split(/(\*\*.*?\*\*)/)
                              return (
                                <p key={idx} className="text-sm text-gray-400 leading-relaxed">
                                  {parts.map((part, i) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                      return <strong key={i} className="text-gray-200 font-semibold">{part.slice(2, -2)}</strong>
                                    }
                                    return part
                                  })}
                                </p>
                              )
                            }
                            
                            // Regular paragraphs
                            return (
                              <p key={idx} className="text-sm text-gray-400 leading-relaxed">
                                {line}
                              </p>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Key Claims */}
                    {message.analysis.key_claims && message.analysis.key_claims.length > 0 && (
                      <Card className="border-gray-800 bg-[#151515]">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <h3 className="font-semibold text-gray-200">Key Claims</h3>
                          </div>
                          <ul className="space-y-3">
                            {message.analysis.key_claims
                              .filter((claim) => {
                                const claimText = typeof claim === "string" ? claim : claim.claim
                                // Filter out HTML, DOCTYPE declarations, and very short/technical content
                                return (
                                  claimText &&
                                  !claimText.includes('<!doctype') &&
                                  !claimText.includes('<html') &&
                                  !claimText.includes('</html>') &&
                                  !claimText.startsWith('<') &&
                                  claimText.length > 10 &&
                                  claimText.trim().length > 0
                                )
                              })
                              .map((claim, idx) => {
                                const claimText = typeof claim === "string" ? claim : claim.claim
                                return (
                                  <li 
                                    key={idx} 
                                    className="flex items-start gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-300 leading-relaxed">
                                      {claimText}
                                    </span>
                                  </li>
                                )
                              })}
                            {message.analysis.key_claims.filter((claim) => {
                              const claimText = typeof claim === "string" ? claim : claim.claim
                              return (
                                claimText &&
                                !claimText.includes('<!doctype') &&
                                !claimText.includes('<html') &&
                                !claimText.includes('</html>') &&
                                !claimText.startsWith('<') &&
                                claimText.length > 10
                              )
                            }).length === 0 && (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">No specific claims could be extracted from this content.</p>
                                <p className="text-xs text-gray-600 mt-1">This may be due to the nature of the input or incomplete article content.</p>
                              </div>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                <span className="text-xs text-gray-600">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {message.type === "user" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0">
                  <span className="text-sm font-medium text-white">You</span>
                </div>
              )}
            </div>
          ))}

          {/* Loading State */}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex-shrink-0">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="rounded-2xl px-4 py-3 bg-[#151515] border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-400">Analyzing content...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Drag Overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-blue-500 m-4 rounded-2xl">
          <div className="text-center">
            <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-semibold text-white">Drop your file here</p>
            <p className="text-sm text-gray-400 mt-2">We'll analyze it for you</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste text, enter a URL, or drag & drop a file..."
              disabled={isLoading}
              rows={1}
              className="min-h-[52px] max-h-[200px] resize-none bg-[#151515] border-gray-800 text-gray-300 placeholder-gray-600 pr-24 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-gray-800"
              >
                <Upload className="h-4 w-4 text-gray-400" />
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="h-8 w-8 p-0 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="hidden"
            />
          </form>

          <p className="text-xs text-gray-600 text-center mt-2">
            Press Enter to send • Shift + Enter for new line • Supports text, URLs, and .txt files
          </p>
        </div>
      </div>
    </div>
  )
}