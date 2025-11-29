"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, ImageIcon, Network, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Text Analysis",
    href: "/analyze",
    icon: FileText,
    description: "Detect fake news in text, URLs, or files",
    color: "blue",
  },
  {
    title: "Media Forensics",
    href: "/media-forensics",
    icon: ImageIcon,
    description: "Detect deepfakes in images and videos",
    color: "purple",
  },
  {
    title: "Info X-ray",
    href: "/supply-chain",
    icon: Network,
    description: "Track claim propagation across platforms",
    color: "cyan",
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-gray-800/50 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="border-b border-gray-800/50 p-6 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#0f0f0f]">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-xl group-hover:bg-red-500/30 transition-all duration-300"></div>
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300 group-hover:scale-105">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-[#0a0a0a] shadow-lg shadow-blue-500/50 animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                RumerLens
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-yellow-500" />
                <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                  AI-Powered Analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10" 
                    : "text-gray-400 hover:bg-gradient-to-r hover:from-[#151515] hover:to-[#1a1a1a] hover:text-gray-200 border border-gray-800/50 hover:border-gray-700/50",
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-r-full"></div>
                )}
                
                {/* Icon with background */}
                <div className={cn(
                  "relative shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/10 shadow-inner" 
                    : "bg-gray-800/30 group-hover:bg-gray-800/50"
                )}>
                  <Icon className={cn(
                    "h-4.5 w-4.5 transition-all duration-200",
                    isActive ? "text-blue-400" : "text-gray-400 group-hover:text-gray-300"
                  )} />
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-500/10 rounded-lg animate-pulse"></div>
                  )}
                </div>

                {/* Text content */}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "font-semibold text-sm mb-0.5 transition-colors duration-200",
                    isActive ? "text-blue-300" : "text-gray-300 group-hover:text-white"
                  )}>
                    {item.title}
                  </p>
                  <p className={cn(
                    "text-xs line-clamp-2 leading-relaxed transition-colors duration-200",
                    isActive ? "text-blue-400/60" : "text-gray-500 group-hover:text-gray-400"
                  )}>
                    {item.description}
                  </p>
                </div>

                {/* Hover effect overlay */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800/50 p-4 bg-gradient-to-t from-[#050505] to-transparent">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
            <p>Powered by <span className="text-gray-500 font-medium">AI Detection</span></p>
          </div>
        </div>
      </div>
    </aside>
  )
}