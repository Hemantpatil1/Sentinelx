/**
 * Loading Screen — Full page loader shown during auth init or lazy page loads
 */
import React from 'react'
import { Zap } from 'lucide-react'

export default function LoadingScreen({ message = 'Loading SentinelX...' }) {
  return (
    <div className="fixed inset-0 bg-dark-950 flex flex-col items-center justify-center z-50">
      {/* Animated background */}
      <div className="absolute inset-0 cyber-bg opacity-50" />

      {/* Scan line effect */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent animate-scan opacity-30" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-10 h-10 text-dark-950 fill-current" />
          </div>
          {/* Rotating ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-primary-400 animate-spin" />
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gradient tracking-widest">SENTINELX</div>
          <div className="text-dark-500 text-xs mt-1 tracking-wider uppercase">
            Enterprise Threat Detection Platform
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-0.5 bg-dark-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"
               style={{ animation: 'loading 1.5s ease-in-out infinite' }} />
        </div>

        <p className="text-dark-500 text-xs">{message}</p>
      </div>

      <style>{`
        @keyframes loading {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 70%; margin-left: 30%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
