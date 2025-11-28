"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, ImageIcon, Network } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Text Analysis",
    href: "/analyze",
    icon: FileText,
    description: "Detect fake news in text, URLs, or files",
  },
  {
    title: "Media Forensics",
    href: "/media-forensics",
    icon: ImageIcon,
    description: "Detect deepfakes in images and videos",
  },
  {
    title: "Supply Chain Tracker",
    href: "/supply-chain",
    icon: Network,
    description: "Track claim propagation across platforms",
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900">Misinformation Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Detection & Analysis</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-4 py-3 transition-colors",
                  isActive ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          <p>Powered by AI Detection</p>
        </div>
      </div>
    </aside>
  )
}
