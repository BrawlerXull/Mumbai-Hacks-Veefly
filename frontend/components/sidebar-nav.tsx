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
    <aside className="w-64 border-r border-gray-800 bg-[#0a0a0a]">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="border-b border-gray-800 p-6">
          <h2 className="text-lg font-bold">
            <span className="text-blue-500">V</span>
            <span className="text-white">eritas</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Detection & Analysis</p>
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
                  "flex items-start gap-3 rounded-lg px-4 py-3 transition-all",
                  isActive 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" 
                    : "text-gray-400 hover:bg-[#151515] hover:text-gray-200 border border-transparent",
                )}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className={cn(
                    "text-xs line-clamp-1",
                    isActive ? "text-blue-300/70" : "text-gray-500"
                  )}>
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 text-xs text-gray-500">
          <p>Powered by AI Detection</p>
        </div>
      </div>
    </aside>
  )
}