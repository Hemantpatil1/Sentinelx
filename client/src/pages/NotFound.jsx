/**
 * NotFound Page - 404 handler
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Shield } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 cyber-bg opacity-30" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-dark-950/80 to-dark-950" />

      <div className="relative text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto shadow-glow-red">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black font-mono text-red-500 tracking-wider">404</h1>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Access Restricted</h2>
          <p className="text-xs text-dark-400 leading-relaxed">
            The resource path requested does not exist or requires higher administrative permissions. Please verify the URL.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary py-2 px-6 justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
