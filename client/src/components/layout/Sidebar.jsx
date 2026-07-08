/**
 * Sidebar Navigation Component
 */
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Radar, Bell, AlertTriangle,
  FileBarChart, Shield, Settings, ChevronLeft, ChevronRight,
  Zap, Activity,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',           badge: null },
  { to: '/logs',                icon: FileText,         label: 'Log Management',       badge: null },
  { to: '/threat-detection',    icon: Radar,            label: 'Threat Detection',     badge: null },
  { to: '/alerts',              icon: Bell,             label: 'Alerts',               badge: 'live' },
  { to: '/incidents',           icon: AlertTriangle,    label: 'Incidents',            badge: null },
  { to: '/reports',             icon: FileBarChart,     label: 'Reports',              badge: null },
  { to: '/threat-intelligence', icon: Shield,           label: 'Threat Intel',         badge: null },
  { to: '/settings',            icon: Settings,         label: 'Settings',             badge: null },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={clsx(
        'flex flex-col border-r border-dark-800 transition-all duration-300 relative z-20',
        'bg-dark-900/80 backdrop-blur-xl',
        collapsed ? 'w-[64px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-dark-800 min-h-[64px]',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
          <Zap className="w-4 h-4 text-dark-950 fill-current" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white tracking-wider">SentinelX</div>
            <div className="text-[10px] text-dark-500 leading-tight">SOC Platform</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {/* Section label */}
        {!collapsed && (
          <div className="px-3 pb-2 pt-1">
            <span className="text-[10px] uppercase tracking-widest text-dark-600 font-semibold">Navigation</span>
          </div>
        )}

        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'nav-item relative group',
              isActive && 'active',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
            {badge === 'live' && !collapsed && (
              <span className="ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              </span>
            )}
            {/* Tooltip for collapsed mode */}
            {collapsed && (
              <div className="tooltip left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status indicator */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-dark-800">
          <div className="flex items-center gap-2 text-xs text-dark-500">
            <Activity className="w-3 h-3 text-green-400" />
            <span>System Operational</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={clsx(
          'absolute -right-3 top-20 w-6 h-6 rounded-full',
          'bg-dark-800 border border-dark-700 text-dark-400 hover:text-dark-100',
          'flex items-center justify-center transition-all duration-200 hover:border-primary-500/50',
          'shadow-md z-30'
        )}
        aria-label="Toggle sidebar"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft  className="w-3 h-3" />
        }
      </button>
    </aside>
  )
}
