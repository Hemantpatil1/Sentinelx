/**
 * Threat Intelligence Page - Show threat intelligence and check IPs
 */
import React, { useState, useEffect } from 'react'
import { Shield, Search, CheckCircle, AlertOctagon, HelpCircle, RefreshCw, Server, AlertCircle } from 'lucide-react'
import { threatIntelAPI } from '../services/api'
import { Spinner } from '../components/shared/SharedComponents'

export default function ThreatIntelligence() {
  const [intel, setIntel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // IP Checking
  const [checkIpVal, setCheckIpVal] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)

  const fetchIntel = async () => {
    try {
      setLoading(true)
      const res = await threatIntelAPI.get()
      setIntel(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntel()
  }, [refreshKey])

  const handleCheckIP = async (e) => {
    e.preventDefault()
    if (!checkIpVal.trim()) return
    setChecking(true)
    setCheckResult(null)
    try {
      const res = await threatIntelAPI.checkIP(checkIpVal.trim())
      setCheckResult(res.data)
    } catch (err) {
      setCheckResult({ error: 'Failed to look up IP configuration details.' })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-primary-400" />
            Threat Intelligence (TI)
          </h1>
          <p className="text-dark-400 text-sm">Analyze blacklisted network hosts, whitelist exceptions, and perform live IP verification checks</p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload Intelligence Feeds
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IP check box */}
        <div className="glass-panel p-6 space-y-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-primary-400" />
            Live IP Reputation Check
          </h2>
          <p className="text-xs text-dark-400 leading-relaxed">
            Verify a source IP against active blacklist and trusted network exceptions configured on this SIEM node.
          </p>

          <form onSubmit={handleCheckIP} className="space-y-3">
            <input
              type="text"
              value={checkIpVal}
              onChange={(e) => setCheckIpVal(e.target.value)}
              placeholder="e.g. 185.234.218.23"
              className="input text-xs"
            />
            <button
              type="submit"
              disabled={checking || !checkIpVal.trim()}
              className="btn-primary w-full justify-center text-xs py-2"
            >
              {checking ? <Spinner size="xs" /> : 'Inspect IP reputation'}
            </button>
          </form>

          {/* IP Lookup Result */}
          {checkResult && (
            <div className="mt-4 animate-fade-in">
              {checkResult.error ? (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {checkResult.error}
                </div>
              ) : checkResult.status === 'blacklisted' ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold uppercase">
                    <AlertOctagon className="w-4 h-4" />
                    Threat IP Detected
                  </div>
                  <p className="font-mono">Reputation: MALICIOUS HOST</p>
                  <p className="opacity-80">This IP matches malicious Tor nodes or botnet C2 servers in blacklist.txt. Block connection immediately.</p>
                </div>
              ) : checkResult.status === 'trusted' ? (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-green-400 font-bold uppercase">
                    <CheckCircle className="w-4 h-4" />
                    Trusted Host
                  </div>
                  <p className="font-mono">Reputation: INTERNAL/TRUSTED</p>
                  <p className="opacity-80">This host is whitelisted in trusted_ips.txt and is marked as safe core infrastructure.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-dark-400 font-bold uppercase">
                    <Server className="w-4 h-4" />
                    Unknown/Unlisted
                  </div>
                  <p className="font-mono">Reputation: NEUTRAL</p>
                  <p className="opacity-80">This host does not appear in whitelists or default threat feeds.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* IP Feeds Display */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Blacklisted list */}
          <div className="glass-panel p-5 flex flex-col h-[400px]">
            <h2 className="text-sm font-semibold text-white border-b border-dark-800 pb-3 mb-3 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              Active Blacklisted IPs ({intel?.blacklist_count || 0})
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loading ? (
                <div className="flex justify-center pt-20"><Spinner size="sm" /></div>
              ) : intel?.blacklisted_ips?.length > 0 ? (
                intel.blacklisted_ips.map((ip) => (
                  <div key={ip} className="flex items-center justify-between text-xs bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg p-2.5 transition-colors">
                    <span className="font-mono text-red-300">{ip}</span>
                    <span className="text-[9px] uppercase tracking-wider text-red-500 font-bold">Malicious</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-dark-500 italic text-center pt-20">No blacklisted host IPs resolved.</p>
              )}
            </div>
          </div>

          {/* Trusted list */}
          <div className="glass-panel p-5 flex flex-col h-[400px]">
            <h2 className="text-sm font-semibold text-white border-b border-dark-800 pb-3 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Trusted Network Hosts ({intel?.trusted_count || 0})
            </h2>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loading ? (
                <div className="flex justify-center pt-20"><Spinner size="sm" /></div>
              ) : intel?.trusted_ips?.length > 0 ? (
                intel.trusted_ips.map((ip) => (
                  <div key={ip} className="flex items-center justify-between text-xs bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 rounded-lg p-2.5 transition-colors">
                    <span className="font-mono text-green-300">{ip}</span>
                    <span className="text-[9px] uppercase tracking-wider text-green-500 font-bold">Trusted</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-dark-500 italic text-center pt-20">No trusted host IPs resolved.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
