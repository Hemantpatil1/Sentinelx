/**
 * App Layout — Sidebar + Navbar + Content Area
 */
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar onMenuToggle={() => setSidebarCollapsed(c => !c)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <div className="max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
