import { SidebarNav } from '@/components/sidebar-nav'
import React from 'react'

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
        <div className="flex h-screen bg-slate-50">
          <SidebarNav />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
    </div>
  )
}

export default layout