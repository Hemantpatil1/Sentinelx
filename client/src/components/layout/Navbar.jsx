/**
 * Top Navigation Bar
 */
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Bell, Search, User, LogOut, ChevronDown, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const PAGE_TITLES = {
  '/dashboard':            'SOC Dashboard',
  '/logs':                 'Log Management',
  '/threat-detection':     'Threat Detection Engine',
  '/alerts':               'Alert Management',
  '/incidents':            'Incident Response',
  '/reports':              'Reports & Analytics',
  '/threat-intelligence':  'Threat Intelligence',
  '/settings':             'Settings',
}

export default function Navbar({ onMenuToggle }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const pageTitle = PAGE_TITLES[location.pathname] || 'SentinelX'

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-dark-800 bg-dark-900/60 backdrop-blur-xl flex-shrink-0 z-10">
      {/* Left: menu + breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="btn-icon"
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-dark-500 text-xs">SentinelX</span>
          <span className="text-dark-600">/</span>
          <span className="text-dark-100 text-sm font-medium">{pageTitle}</span>
        </div>
      </div>

      {/* Right: search, notifications, user */}
      <div className="flex items-center gap-3">
        {/* Status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          All Systems Operational
        </div>

        {/* Current time (UTC) */}
        <div className="hidden lg:block text-dark-500 text-xs font-mono">
          {new Date().toUTCString().slice(0, 25)}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-200',
              'bg-dark-800/50 border-dark-700 hover:border-primary-500/40',
              dropdownOpen && 'border-primary-500/40 bg-dark-800'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-dark-950 text-xs font-bold uppercase">
                {user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-dark-100 leading-tight">{user?.username}</div>
              <div className="text-[10px] text-dark-500 capitalize flex items-center gap-1">
                {isAdmin && <Shield className="w-2.5 h-2.5 text-primary-400" />}
                {user?.role}
              </div>
            </div>
            <ChevronDown className={clsx(
              'w-3.5 h-3.5 text-dark-400 transition-transform duration-200 hidden md:block',
              dropdownOpen && 'rotate-180'
            )} />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 glass-panel py-1.5 animate-fade-in z-50">
              <div className="px-4 py-2 border-b border-dark-800 mb-1">
                <div className="text-xs font-semibold text-dark-100">{user?.username}</div>
                <div className="text-[10px] text-dark-500">{user?.email}</div>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings') }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile & Settings
              </button>
              <div className="border-t border-dark-800 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
