/**
 * Threat Detection Page - Mapped rules configuration and execution
 */
import React, { useState, useEffect } from 'react'
import {
  Radar, Play, ShieldAlert, BookOpen, ExternalLink,
  CheckCircle, ArrowUpRight, HelpCircle
} from 'lucide-react'
import { logsAPI } from '../services/api'
import { Spinner } from '../components/shared/SharedComponents'

const RULES_LIST = [
  {
    id: 1,
    name: 'Brute Force Detection',
    mitre: 'T1110 (Credential Access)',
    severity: 'High',
    risk: 90,
    desc: 'More than five failed login attempts within 60 seconds from the same source IP address.',
    recommendation: 'Block malicious IP at perimeter firewall, force account password resets, and enable MFA.'
  },
  {
    id: 2,
    name: 'Port Scan Detection',
    mitre: 'T1046 (Discovery)',
    severity: 'High',
    risk: 85,
    desc: 'A single IP scans more than ten distinct destination ports within a 30-second window.',
    recommendation: 'Apply edge firewall block to source IP, close unused public-facing ports, review IDS/IPS policies.'
  },
  {
    id: 3,
    name: 'Known Malicious IP Access',
    mitre: 'T1071 (Command and Control)',
    severity: 'Critical',
    risk: 100,
    desc: 'Any connection request matching blacklisted command-and-control (C2) servers or Tor exit nodes.',
    recommendation: 'Isolate compromised internal nodes from the network, initiate incident response plan immediately.'
  },
  {
    id: 4,
    name: 'DDoS Attack Detection',
    mitre: 'T1498 (Impact)',
    severity: 'Critical',
    risk: 95,
    desc: 'More than one hundred requests sent from the same source IP within a 30-second timeframe.',
    recommendation: 'Enable global CDN rate-limiting, activate traffic scrubbing, scale server instances or initiate IP shunning.'
  },
  {
    id: 5,
    name: 'Suspicious Admin Login',
    mitre: 'T1078 (Defense Evasion)',
    severity: 'Medium',
    risk: 65,
    desc: 'Successful authentication into administrative accounts outside core business hours (11 PM to 6 AM).',
    recommendation: 'Validate authentication context with administrator, review logs for command executions during off-hours.'
  },
  {
    id: 6,
    name: 'Impossible Login (Travel)',
    mitre: 'T1078.004 (Credential Access)',
    severity: 'High',
    risk: 88,
    desc: 'Same username authenticated from two separate geological subnets within a 10-minute window.',
    recommendation: 'Suspend user account sessions, revoke JWT authentication tokens, verify user presence via primary contact.'
  },
  {
    id: 7,
    name: 'Privilege Escalation Attempt',
    mitre: 'T1068 (Privilege Escalation)',
    severity: 'Critical',
    risk: 92,
    desc: 'Multiple failed administrator access attempts or suspicious system service manipulation commands.',
    recommendation: 'Isolate the local server node, inspect authentication configurations, restrict sudo access privileges.'
  }
]

export default function ThreatDetection() {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  const handleManualScan = async () => {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await logsAPI.scan()
      setScanResult({
        success: true,
        message: `Threat scan executed successfully! Mapped ${res.data.alerts_generated} new alerts to database.`,
        count: res.data.alerts_generated
      })
    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Threat scan execution failed.'
      })
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radar className="w-6 h-6 text-primary-400" />
            Threat Detection Rules Engine
          </h1>
          <p className="text-dark-400 text-sm">Configure, audit and trigger rule-based alerts mapped to MITRE ATT&CK tactics</p>
        </div>
        <button
          onClick={handleManualScan}
          disabled={scanning}
          className="btn-primary"
        >
          {scanning ? (
            <>
              <Spinner size="xs" />
              Scanning Event Database...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Run All Detection Rules
            </>
          )}
        </button>
      </div>

      {scanResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
          scanResult.success
            ? 'bg-green-500/10 border-green-500/20 text-green-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {scanResult.success ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm font-semibold">{scanResult.success ? 'Scan Complete' : 'Scan Error'}</p>
            <p className="text-xs opacity-90 mt-1">{scanResult.message}</p>
          </div>
        </div>
      )}

      {/* Rules Engine Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-400" />
              Active Detection Rules ({RULES_LIST.length})
            </h2>
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">Engine Active</span>
          </div>

          <div className="space-y-4">
            {RULES_LIST.map((rule) => (
              <div key={rule.id} className="glass-panel p-5 space-y-3 relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">
                      {rule.id}. {rule.name}
                    </h3>
                    <p className="text-[10px] text-primary-400 font-semibold tracking-wider uppercase mt-1 font-mono">
                      MITRE ATT&CK: {rule.mitre}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      rule.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      rule.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {rule.severity}
                    </span>
                    <span className="font-mono text-xs text-dark-400 bg-dark-800 border border-dark-700 px-1.5 py-0.5 rounded">
                      Risk: {rule.risk}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-dark-300 leading-relaxed bg-dark-900/40 p-2.5 rounded-lg border border-dark-800/40">
                  {rule.desc}
                </p>

                <div className="text-[11px] text-dark-400 flex items-start gap-1">
                  <span className="font-bold text-primary-400/80">Recommended Actions:</span>
                  <span className="flex-1 italic">{rule.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MITRE ATT&CK Matrix panel */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary-400" />
            MITRE ATT&CK Matrix Mapping
          </h2>

          <div className="glass-panel p-6 space-y-4">
            <p className="text-xs text-dark-400 leading-relaxed">
              SentinelX threat detection engine coordinates all parsing events and maps triggers to specific Tactics and Techniques defined in the MITRE ATT&CK security matrix.
            </p>

            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
              {[
                { tactic: 'Credential Access', code: 'T1110', label: 'Brute Force / Guessing' },
                { tactic: 'Discovery', code: 'T1046', label: 'Network Service Scanning' },
                { tactic: 'Command & Control', code: 'T1071', label: 'Known Bad/Tor egress' },
                { tactic: 'Impact', code: 'T1498', label: 'Denial of Service (DDoS)' },
                { tactic: 'Defense Evasion', code: 'T1078', label: 'Off-hours admin actions' },
                { tactic: 'Credential Access', code: 'T1078.004', label: 'Impossible geological travel' },
                { tactic: 'Privilege Escalation', code: 'T1068', label: 'Local vulnerability exploit' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-dark-900 border border-dark-800 rounded-lg flex flex-col justify-between h-20">
                  <div>
                    <span className="text-primary-400 font-bold">{item.code}</span>
                    <h4 className="text-white mt-1 leading-tight">{item.label}</h4>
                  </div>
                  <span className="text-[9px] text-dark-500 uppercase tracking-wider">{item.tactic}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dark-800 pt-4 flex justify-between items-center text-xs">
              <span className="text-dark-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Want to expand detection scope?
              </span>
              <a
                href="https://attack.mitre.org/"
                target="_blank"
                rel="noreferrer"
                className="text-primary-400 hover:text-primary-300 flex items-center gap-1 font-semibold"
              >
                Explore MITRE
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
