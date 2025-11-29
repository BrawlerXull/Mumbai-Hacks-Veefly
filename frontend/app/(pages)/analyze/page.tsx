"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Shield, CheckCircle, XCircle, AlertTriangle, Upload, ChevronDown, ExternalLink, BookOpen, TrendingUp } from "lucide-react"
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

interface Source {
  title: string
  url?: string
  snippet?: string
  domain?: string
  index: number
}

export default function ImprovedTextAnalysisChatPage() {
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
  const [expandedSections, setExpandedSections] = useState<Record<string, { supporting: boolean; contradicting: boolean; sources: boolean }>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleSection = (messageId: string, section: 'supporting' | 'contradicting' | 'sources') => {
    setExpandedSections(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [section]: !prev[messageId]?.[section]
      }
    }))
  }

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

  const extractSources = (analysis: TextAnalysisResponse): Source[] => {
    const sources: Source[] = []
    const seenUrls = new Set<string>()
    
    if (analysis.analyzed_claims) {
      const allClaims = [
        ...(analysis.analyzed_claims.supporting || []),
        ...(analysis.analyzed_claims.contradicting || []),
        ...(analysis.analyzed_claims.neutral || [])
      ]
      
      allClaims.forEach((claim) => {
        if (claim.url && !seenUrls.has(claim.url)) {
          seenUrls.add(claim.url)
          try {
            const urlObj = new URL(claim.url)
            sources.push({
              title: claim.platform || urlObj.hostname.replace('www.', ''),
              url: claim.url,
              snippet: claim.content?.substring(0, 150),
              domain: urlObj.hostname,
              index: sources.length + 1
            })
          } catch (e) {
            // Skip invalid URLs
          }
        }
      })
    }

    return sources
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

  const renderSources = (sources: Source[], messageId: string) => {
    if (sources.length === 0) return null

    return (
      <div className="mt-4">
        <button
          onClick={() => toggleSection(messageId, 'sources')}
          className="w-full flex items-center gap-2 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] transition-colors border border-gray-800"
        >
          <BookOpen className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          <span className="font-medium text-gray-200 text-sm">Sources</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {sources.length}
          </span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              expandedSections[messageId]?.sources ? 'rotate-180' : ''
            }`}
          />
        </button>
        
        {expandedSections[messageId]?.sources && (
          <div className="mt-2 space-y-2">
            {sources.map((source) => (
              <a
                key={source.index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800 hover:border-blue-500/50 hover:bg-[#202020] transition-all"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mt-0.5">
                  {source.index}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-200 line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {source.title}
                    </h4>
                    <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                  
                  {source.domain && (
                    <p className="text-xs text-gray-500 mt-1">
                      {source.domain}
                    </p>
                  )}
                  
                  {source.snippet && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mt-1">
                      {source.snippet}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    )
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
      <header className="border-b border-gray-800 bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">FactCheck AI</h1>
              <p className="text-xs text-gray-500">AI-Powered Credibility Analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`group flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] ${message.type === "user" ? "items-end" : "items-start"}`}>
                  {/* Message Header */}
                  <div className={`flex items-center gap-3 mb-3 ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {message.type === "assistant" ? (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shrink-0 shadow-lg shadow-blue-500/30">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-200">FactCheck AI</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shrink-0 shadow-lg">
                          <span className="text-xs font-medium text-white">You</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-200">You</span>
                      </>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={message.type === "user" ? "mr-11" : "ml-11"}>
                    <div 
                      className={`rounded-2xl px-4 py-3 ${
                        message.type === "user" 
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" 
                          : "bg-[#151515] border border-gray-800"
                      }`}
                    >
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        message.type === "user" ? "text-white" : "text-gray-300"
                      }`}>
                        {message.content}
                      </p>
                    </div>

                    {/* Analysis Results */}
                    {message.analysis && (
                      <div className="mt-4 space-y-3">{/* Verdict Card */}
                      {message.analysis.verdict && (
                        <div className="rounded-lg border border-gray-800 bg-[#151515] p-4 overflow-hidden relative">
                          <div
                            className={`absolute inset-0 pointer-events-none opacity-5 ${
                              message.analysis.verdict.verdict === "LIKELY TRUE"
                                ? "bg-gradient-to-br from-green-500"
                                : message.analysis.verdict.verdict === "LIKELY FALSE"
                                ? "bg-gradient-to-br from-red-500"
                                : "bg-gradient-to-br from-amber-500"
                            }`}
                          />
                          
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="h-4 w-4 text-blue-400" />
                              <h3 className="font-semibold text-sm text-gray-200">Verdict</h3>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {message.analysis.verdict.verdict === "LIKELY TRUE" && (
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                )}
                                {message.analysis.verdict.verdict === "LIKELY FALSE" && (
                                  <XCircle className="h-5 w-5 text-red-400" />
                                )}
                                {(message.analysis.verdict.verdict === "UNCERTAIN" || message.analysis.verdict.verdict === "MIXED EVIDENCE") && (
                                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                                )}
                                <div>
                                  <p className={`text-base font-bold ${
                                    message.analysis.verdict.verdict === "LIKELY TRUE"
                                      ? "text-green-400"
                                      : message.analysis.verdict.verdict === "LIKELY FALSE"
                                      ? "text-red-400"
                                      : "text-amber-400"
                                  }`}>
                                    {message.analysis.verdict.verdict}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className={`text-xl font-bold ${
                                  message.analysis.verdict.confidence > 0.7
                                    ? "text-green-400"
                                    : message.analysis.verdict.confidence > 0.4
                                    ? "text-amber-400"
                                    : "text-red-400"
                                }`}>
                                  {(message.analysis.verdict.confidence * 100).toFixed(0)}%
                                </p>
                                <p className="text-xs text-gray-500">Confidence</p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-1000 ease-out ${
                                    message.analysis.verdict.confidence > 0.7
                                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                      : message.analysis.verdict.confidence > 0.4
                                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                      : "bg-gradient-to-r from-red-500 to-rose-500"
                                  }`}
                                  style={{ width: `${message.analysis.verdict.confidence * 100}%` }}
                                />
                              </div>
                            </div>

                            {message.analysis.verdict.explanation && (
                              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-gray-800">
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {message.analysis.verdict.explanation}
                                </p>
                              </div>
                            )}

                            {message.analysis.verdict.evidence_summary && (
                              <div className="mt-3 space-y-2">
                                {message.analysis.verdict.evidence_summary.general && (
                                  <div className="p-3 bg-[#0a0a0a] rounded-lg border border-gray-800">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-gray-400">General Sources</p>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        message.analysis.verdict.evidence_summary.general.stance === "SUPPORTS_CLAIM"
                                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                          : message.analysis.verdict.evidence_summary.general.stance === "CONTRADICTS_CLAIM"
                                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                      }`}>
                                        {message.analysis.verdict.evidence_summary.general.stance.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                    <div className="flex gap-4 text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                                        <span className="text-gray-300">
                                          {message.analysis.verdict.evidence_summary.general.support} Supporting
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                                        <span className="text-gray-300">
                                          {message.analysis.verdict.evidence_summary.general.contradict} Contradicting
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {message.analysis.verdict.evidence_summary.instagram && (
                                  <div className="p-3 bg-[#0a0a0a] rounded-lg border border-gray-800">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-gray-400">Instagram Sources</p>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        message.analysis.verdict.evidence_summary.instagram.stance === "SUPPORTS_CLAIM"
                                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                          : message.analysis.verdict.evidence_summary.instagram.stance === "CONTRADICTS_CLAIM"
                                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                      }`}>
                                        {message.analysis.verdict.evidence_summary.instagram.stance.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                    <div className="flex gap-4 text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                                        <span className="text-gray-300">
                                          {message.analysis.verdict.evidence_summary.instagram.support} Supporting
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                                        <span className="text-gray-300">
                                          {message.analysis.verdict.evidence_summary.instagram.contradict} Contradicting
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Statistics */}
                      {message.analysis.statistics && (
                        <div className="rounded-lg border border-gray-800 bg-[#151515] p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-blue-400" />
                            <h3 className="font-semibold text-sm text-gray-200">Evidence Statistics</h3>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 bg-[#0a0a0a] rounded-lg border border-green-800/30">
                              <p className="text-xs text-gray-500 mb-0.5">Supporting</p>
                              <p className="text-lg font-bold text-green-400">{message.analysis.statistics.supporting_count}</p>
                            </div>
                            <div className="p-2.5 bg-[#0a0a0a] rounded-lg border border-red-800/30">
                              <p className="text-xs text-gray-500 mb-0.5">Contradicting</p>
                              <p className="text-lg font-bold text-red-400">{message.analysis.statistics.contradicting_count}</p>
                            </div>
                            <div className="p-2.5 bg-[#0a0a0a] rounded-lg border border-amber-800/30">
                              <p className="text-xs text-gray-500 mb-0.5">Neutral</p>
                              <p className="text-lg font-bold text-amber-400">{message.analysis.statistics.neutral_count}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {renderSources(extractSources(message.analysis), message.id)}

                      {/* Supporting Claims */}
                      {message.analysis.analyzed_claims?.supporting && message.analysis.analyzed_claims.supporting.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleSection(message.id, 'supporting')}
                            className="w-full flex items-center gap-2 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] transition-colors border border-green-800/30"
                          >
                            <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="font-medium text-gray-200 text-sm">Supporting Evidence</span>
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                              {message.analysis.analyzed_claims.supporting.length}
                            </span>
                            <ChevronDown 
                              className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                                expandedSections[message.id]?.supporting ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedSections[message.id]?.supporting && (
                            <div className="mt-2 space-y-2">
                              {message.analysis.analyzed_claims.supporting.map((claim, idx) => (
                                <div key={idx} className="p-3 bg-[#1a1a1a] rounded-lg border border-green-800/30">
                                  <div className="flex items-start justify-between gap-3 mb-1">
                                    <p className="text-sm text-gray-300 leading-relaxed flex-1">{claim.claim}</p>
                                    {claim.platform && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                                        {claim.platform}
                                      </span>
                                    )}
                                  </div>
                                  {claim.author && (
                                    <p className="text-xs text-gray-500 mb-1">By: {claim.author}</p>
                                  )}
                                  {claim.reasoning && (
                                    <p className="text-xs text-gray-400 italic mt-2 pt-2 border-t border-gray-800">
                                      {claim.reasoning}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contradicting Claims */}
                      {message.analysis.analyzed_claims?.contradicting && message.analysis.analyzed_claims.contradicting.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleSection(message.id, 'contradicting')}
                            className="w-full flex items-center gap-2 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] transition-colors border border-red-800/30"
                          >
                            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                            <span className="font-medium text-gray-200 text-sm">Contradicting Evidence</span>
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              {message.analysis.analyzed_claims.contradicting.length}
                            </span>
                            <ChevronDown 
                              className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                                expandedSections[message.id]?.contradicting ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedSections[message.id]?.contradicting && (
                            <div className="mt-2 space-y-2">
                              {message.analysis.analyzed_claims.contradicting.map((claim, idx) => (
                                <div key={idx} className="p-3 bg-[#1a1a1a] rounded-lg border border-red-800/30">
                                  <div className="flex items-start justify-between gap-3 mb-1">
                                    <p className="text-sm text-gray-300 leading-relaxed flex-1">{claim.claim}</p>
                                    {claim.platform && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                                        {claim.platform}
                                      </span>
                                    )}
                                  </div>
                                  {claim.author && (
                                    <p className="text-xs text-gray-500 mb-1">By: {claim.author}</p>
                                  )}
                                  {claim.reasoning && (
                                    <p className="text-xs text-gray-400 italic mt-2 pt-2 border-t border-gray-800">
                                      {claim.reasoning}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Key Claims */}
                      {message.analysis.key_claims && message.analysis.key_claims.length > 0 && (
                        <div className="rounded-lg border border-gray-800 bg-[#151515] p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <h3 className="font-semibold text-sm text-gray-200">Key Claims</h3>
                          </div>
                          <ul className="space-y-2">
                            {message.analysis.key_claims
                              .filter((claim) => {
                                const claimText = typeof claim === "string" ? claim : claim.claim
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
                                    className="flex items-start gap-2 p-2.5 bg-[#0a0a0a] rounded-lg border border-gray-800"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-300 leading-relaxed">
                                      {claimText}
                                    </span>
                                  </li>
                                )
                              })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex-shrink-0">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">FactCheck AI</span>
                </div>
                <div className="ml-10">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-400">Analyzing content...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
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
      <div className="border-t border-gray-800 bg-[#0a0a0a] sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste text, enter a URL, or drag & drop a file..."
                  disabled={isLoading}
                  rows={1}
                  className="min-h-[52px] max-h-[200px] resize-none bg-[#1a1a1a] border-gray-700 text-gray-300 placeholder-gray-500 pr-12 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="absolute right-2 bottom-2 h-8 w-8 p-0 hover:bg-gray-700/50"
                >
                  <Upload className="h-4 w-4 text-gray-400" />
                </Button>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="h-[52px] w-[52px] p-0 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex-shrink-0"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
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
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}