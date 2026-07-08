/**
 * Login Page — Professional SOC authentication
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Shield, Lock, User, AlertCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

const DEMO_CREDENTIALS = [
  { label: 'Admin', username: 'admin', password: 'admin123', role: 'Administrator', color: '#ef4444' },
  { label: 'Analyst', username: 'analyst', password: 'analyst123', role: 'SOC Analyst', color: '#06b6d4' },
]

export default function Login() {
  const { login, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [particles, setParticles] = useState([])

  // Generate random particle positions
  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 4 + 2,
    })))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password.')
      return
    }
    const result = await login(username, password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setLocalError(result.error)
    }
  }

  const fillDemo = (creds) => {
    setUsername(creds.username)
    setPassword(creds.password)
    setLocalError('')
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-950">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 cyber-bg" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04]"
             style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
             style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        
        {/* Floating particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-primary-400/20 animate-pulse-slow"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-4 flex items-center gap-12 min-h-screen py-12">
        
        {/* Left: Branding panel */}
        <div className="hidden lg:flex flex-col flex-1 text-white pr-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Zap className="w-6 h-6 text-dark-950 fill-current" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-wider text-gradient">SENTINELX</div>
              <div className="text-xs text-dark-500 tracking-wide">Enterprise SIEM Platform</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Protect Your Infrastructure<br />
            <span className="text-gradient">in Real Time</span>
          </h1>
          <p className="text-dark-400 text-lg mb-12 leading-relaxed">
            Enterprise-grade Security Information and Event Management platform with AI-powered threat detection, incident response, and automated reporting.
          </p>

          {/* Feature pills */}
          {[
            { icon: Shield, text: 'MITRE ATT&CK Framework Mapping' },
            { icon: Zap,    text: '7 Active Detection Rules' },
            { icon: Lock,   text: 'JWT-Secured Role-Based Access' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-dark-300 text-sm">{text}</span>
            </div>
          ))}

          {/* Stats row */}
          <div className="flex items-center gap-8 mt-12 pt-8 border-t border-dark-800">
            {[
              { val: '7', label: 'Detection Rules' },
              { val: '5', label: 'Alert Severities' },
              { val: '100%', label: 'Open Source' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-gradient">{val}</div>
                <div className="text-xs text-dark-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login form */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0 flex-shrink-0">
          <div className="glass-panel p-8">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
                <Zap className="w-5 h-5 text-dark-950 fill-current" />
              </div>
              <div className="text-lg font-bold text-gradient tracking-wider">SENTINELX</div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-1">Sign In to SOC</h2>
              <p className="text-dark-400 text-sm">Enter your credentials to access the platform</p>
            </div>

            {/* Demo credentials */}
            <div className="mb-6 p-3 rounded-xl bg-dark-800/60 border border-dark-700">
              <p className="text-xs text-dark-500 mb-2 font-medium uppercase tracking-wider">Demo Access</p>
              <div className="flex gap-2">
                {DEMO_CREDENTIALS.map(cred => (
                  <button
                    key={cred.username}
                    onClick={() => fillDemo(cred)}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-dark-600 hover:border-primary-500/40 bg-dark-900/50 hover:bg-dark-800 transition-all duration-200 text-left group"
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{ backgroundColor: `${cred.color}20`, border: `1px solid ${cred.color}40` }}>
                      <span className="text-[9px] font-bold" style={{ color: cred.color }}>
                        {cred.label[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-dark-200 leading-tight">{cred.label}</div>
                      <div className="text-[10px] text-dark-500 leading-tight">{cred.role}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 ml-auto text-dark-600 group-hover:text-dark-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {displayError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-dark-600 bg-dark-800 text-primary-500" />
                  <span className="text-xs text-dark-400">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-dark-600 mt-6">
              Protected by SentinelX Security Platform
            </p>
          </div>

          {/* Version info */}
          <div className="text-center mt-4 text-xs text-dark-700">
            SentinelX v1.0.0 · Enterprise Edition · © 2024
          </div>
        </div>
      </div>
    </div>
  )
}
