/**
 * Settings Page - Configuration and details
 */
import React from 'react'
import { Settings as SettingsIcon, Shield, User, HardDrive, Cpu, Terminal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-primary-400" />
          System Settings
        </h1>
        <p className="text-dark-400 text-sm">Review profile details, local database paths, and API integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 space-y-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-dark-800 pb-3">
            <User className="w-4 h-4 text-primary-400" />
            User Account Details
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-dark-500 block">Username</span>
              <span className="text-white font-semibold mt-0.5 block">{user?.username || '—'}</span>
            </div>
            <div>
              <span className="text-dark-500 block">Email Address</span>
              <span className="text-white mt-0.5 block">{user?.email || '—'}</span>
            </div>
            <div>
              <span className="text-dark-500 block">System Role</span>
              <span className="px-2 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20 font-bold font-mono text-[10px] mt-1 inline-block capitalize">
                {user?.role || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* SIEM Config */}
        <div className="glass-panel p-6 space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-dark-800 pb-3">
            <Cpu className="w-4 h-4 text-primary-400" />
            SIEM System Infrastructure Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-3 bg-dark-900 p-4 rounded-xl border border-dark-800/80">
              <div className="flex items-center gap-2 text-primary-400 font-bold mb-1">
                <HardDrive className="w-3.5 h-3.5" />
                DATABASE DRIVER
              </div>
              <p className="text-dark-400">Type: <span className="text-white">SQLite3 (Raw SQL)</span></p>
              <p className="text-dark-400">Path: <span className="text-white">server/database/sentinelx.db</span></p>
              <p className="text-dark-400">Foreign Keys: <span className="text-green-400">PRAGMA ON</span></p>
            </div>

            <div className="space-y-3 bg-dark-900 p-4 rounded-xl border border-dark-800/80">
              <div className="flex items-center gap-2 text-primary-400 font-bold mb-1">
                <Terminal className="w-3.5 h-3.5" />
                THREAT SCANNERS
              </div>
              <p className="text-dark-400">Detection Type: <span className="text-white">Rule-based Analysis</span></p>
              <p className="text-dark-400">Active Rules: <span className="text-white">7 Configured</span></p>
              <p className="text-dark-400">Auto Scan on Upload: <span className="text-green-400">Enabled</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
