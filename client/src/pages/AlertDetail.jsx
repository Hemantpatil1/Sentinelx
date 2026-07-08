/**
 * Alert Detail Page - View alert specifics, recommendation engine, and update status
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Bell, ShieldAlert, ArrowLeft, PlusCircle, CheckCircle,
  FileSpreadsheet, Shield, User, Globe, AlertOctagon, HelpCircle
} from 'lucide-react'
import { alertsAPI, incidentsAPI } from '../services/api'
import { SeverityBadge, StatusBadge, RiskScore, Spinner } from '../components/shared/SharedComponents'
import { formatDate, THREAT_TYPE_LABELS } from '../utils/helpers'

export default function AlertDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [escalating, setEscalating] = useState(false)

  const fetchAlert = async () => {
    try {
      setLoading(true)
      const res = await alertsAPI.get(id)
      setAlert(res.data)
    } catch (err) {
      alert('Alert not found')
      navigate('/alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlert()
  }, [id])

  const handleUpdateStatus = async (status) => {
    try {
      setStatusUpdating(true)
      await alertsAPI.updateStatus(id, status)
      setAlert(prev => ({ ...prev, status }))
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleEscalateIncident = async () => {
    try {
      setEscalating(true)
      const res = await incidentsAPI.create({
        alert_id: alert.id,
        title: `Incident: [${alert.severity.toUpperCase()}] ${alert.alert_name}`,
        notes: `Escalated directly from alert monitor details page.\nRisk: ${alert.risk_score}`
      })
      navigate(`/incidents/${res.data.incident_id}`)
    } catch (err) {
      alert('Failed to create incident')
    } finally {
      setEscalating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <button
          onClick={() => navigate('/alerts')}
          className="btn-secondary py-1.5 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Alerts
        </button>
      </div>

      {/* Main Alert Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core details */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-dark-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <SeverityBadge severity={alert.severity} size="lg" />
                <StatusBadge status={alert.status} />
              </div>
              <h1 className="text-xl font-bold text-white leading-tight">{alert.alert_name}</h1>
              <p className="text-dark-500 text-xs mt-1">Generated: {formatDate(alert.created_at)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-dark-500 block uppercase font-medium tracking-wide">Threat Score</span>
              <div className="mt-1 flex items-center justify-end">
                <RiskScore score={alert.risk_score} />
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider block">Threat Category</span>
                <span className="text-sm font-semibold text-white mt-1 block">
                  {THREAT_TYPE_LABELS[alert.threat_type] || alert.threat_type}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider block">Source IP (Attacker)</span>
                <span className="font-mono text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded inline-block mt-1">
                  {alert.source_ip || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider block">Destination IP (Target)</span>
                <span className="font-mono text-sm text-dark-200 mt-1 block">
                  {alert.dest_ip || '—'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider block">Targeted Username</span>
                <span className="text-sm font-semibold text-white mt-1 block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-dark-500" />
                  {alert.username || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider block">MITRE Technique</span>
                <span className="font-mono text-sm text-primary-400 mt-1 block">
                  {alert.mitre_technique || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider block">MITRE Tactic</span>
                <span className="text-xs text-dark-300 mt-1 block">
                  {alert.mitre_tactic || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Action recommendation */}
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-primary-400" />
              Automated SOC Recommendations
            </h3>
            <div className="text-xs text-dark-300 leading-relaxed font-mono whitespace-pre-line">
              {alert.recommendation}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white mb-4">Analyst Investigation Controls</h2>
            
            <div className="space-y-3">
              {alert.status === 'open' && (
                <button
                  onClick={() => handleUpdateStatus('investigating')}
                  disabled={statusUpdating}
                  className="btn-secondary w-full justify-center text-xs"
                >
                  <Shield className="w-4 h-4 text-yellow-400" />
                  Mark as Investigating
                </button>
              )}
              {alert.status !== 'resolved' && (
                <button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={statusUpdating}
                  className="btn-secondary w-full justify-center text-xs hover:border-green-500/50"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Mark as Resolved
                </button>
              )}
              {alert.status === 'resolved' && (
                <button
                  onClick={() => handleUpdateStatus('open')}
                  disabled={statusUpdating}
                  className="btn-secondary w-full justify-center text-xs"
                >
                  <Bell className="w-4 h-4" />
                  Reopen Alert
                </button>
              )}
            </div>
          </div>

          {/* Incident Escalation Box */}
          <div className="border-t border-dark-800 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Escalation Panel</h3>
            {alert.incident ? (
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 space-y-2">
                <span className="text-[10px] text-yellow-500 font-semibold block uppercase">Linked Incident</span>
                <p className="text-xs font-bold text-white leading-tight">{alert.incident.title}</p>
                <button
                  onClick={() => navigate(`/incidents/${alert.incident.id}`)}
                  className="btn-secondary w-full py-1 text-xs mt-1"
                >
                  Go to Incident #{alert.incident.id}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-dark-500 leading-normal">
                  Escalate this alert into a full tracked incident response workflow for investigation notes and audit log trail.
                </p>
                <button
                  onClick={handleEscalateIncident}
                  disabled={escalating}
                  className="btn-primary w-full justify-center text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Incident case
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
