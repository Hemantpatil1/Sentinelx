/**
 * Incident Detail Page - Case investigation notes, timeline, audit logs and actions
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, User, UserCheck, MessageSquare,
  Clock, ShieldAlert, CheckCircle, FileText, Send, HelpCircle
} from 'lucide-react'
import { incidentsAPI } from '../services/api'
import { SeverityBadge, StatusBadge, RiskScore, Spinner } from '../components/shared/SharedComponents'
import { formatDate, timeAgo } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [inc, setInc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [assignee, setAssignee] = useState('')

  const fetchIncident = async () => {
    try {
      setLoading(true)
      const res = await incidentsAPI.get(id)
      setInc(res.data)
      setAssignee(res.data.assigned_to || '')
    } catch (err) {
      alert('Incident case not found')
      navigate('/incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncident()
  }, [id])

  const handleUpdate = async (fields) => {
    try {
      setUpdating(true)
      await incidentsAPI.update(id, fields)
      // Refetch for fresh audit logs
      await fetchIncident()
    } catch (err) {
      alert('Failed to update case parameters')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = () => {
    if (!newNote.trim()) return
    const updatedNotes = inc.notes
      ? `${inc.notes}\n\n[Note by ${user.username} at ${new Date().toISOString()}]:\n${newNote}`
      : `[Note by ${user.username} at ${new Date().toISOString()}]:\n${newNote}`
    
    handleUpdate({ notes: updatedNotes })
    setNewNote('')
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
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/incidents')}
          className="btn-secondary py-1.5 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Incident Investigation details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-dark-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-dark-500 font-bold bg-dark-800 border border-dark-700 px-2 py-0.5 rounded">
                    CASE-INC-{inc.id}
                  </span>
                  <SeverityBadge severity={inc.priority} />
                  <StatusBadge status={inc.status} />
                </div>
                <h1 className="text-xl font-bold text-white leading-tight">{inc.title}</h1>
                <p className="text-dark-500 text-xs mt-1">Logged: {formatDate(inc.created_at)}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-dark-500 block uppercase font-medium tracking-wide">Threat Score</span>
                <div className="mt-1 flex items-center justify-end">
                  <RiskScore score={inc.risk_score || 0} />
                </div>
              </div>
            </div>

            {/* Sub-details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-dark-500 block">Source IP (Attacker)</span>
                  <span className="font-mono text-sm text-red-400 font-bold mt-0.5 block">{inc.source_ip || '—'}</span>
                </div>
                <div>
                  <span className="text-dark-500 block">Destination IP (Target)</span>
                  <span className="font-mono text-xs text-dark-300 mt-0.5 block">{inc.dest_ip || '—'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-dark-500 block">MITRE ATT&CK Mapping</span>
                  <span className="font-mono text-xs text-primary-400 mt-0.5 block">
                    {inc.mitre_technique} · {inc.mitre_tactic}
                  </span>
                </div>
                <div>
                  <span className="text-dark-500 block">Target User Account</span>
                  <span className="text-xs text-white font-semibold mt-0.5 block">{inc.username || '—'}</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-primary-400" />
                Response Action Playbook
              </h3>
              <p className="text-xs text-dark-300 font-mono leading-relaxed whitespace-pre-line">
                {inc.recommendation}
              </p>
            </div>
          </div>

          {/* Incident Journal & Notes */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-400" />
              Investigation Journal & Case Notes
            </h2>

            {inc.notes ? (
              <div className="bg-dark-900/60 rounded-xl p-4 border border-dark-800/80 max-h-[300px] overflow-y-auto space-y-4 font-mono text-xs text-dark-200 whitespace-pre-line">
                {inc.notes}
              </div>
            ) : (
              <p className="text-xs text-dark-500 italic">No notes recorded for this incident yet.</p>
            )}

            {/* Write new note */}
            <div className="space-y-3 pt-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type analyst logs, firewall blocks, user verification notes here..."
                rows="3"
                className="input text-xs"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  disabled={updating || !newNote.trim()}
                  className="btn-primary py-1.5 px-4 text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save Journal Entry
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Case Management */}
        <div className="space-y-6">
          
          {/* Assignment / Status Panel */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Case Management</h3>

            {/* Assign User */}
            <div>
              <label className="block text-xs text-dark-400 mb-1">Assign Incident Owner</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="analyst_name"
                  className="input py-1.5 text-xs"
                />
                <button
                  onClick={() => handleUpdate({ assigned_to: assignee })}
                  disabled={updating}
                  className="btn-secondary py-1.5 text-xs"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Status updates */}
            <div className="pt-2 space-y-2 border-t border-dark-800">
              <label className="block text-xs text-dark-400 mb-1">Update Case Status</label>
              {inc.status === 'open' && (
                <button
                  onClick={() => handleUpdate({ status: 'investigating' })}
                  disabled={updating}
                  className="btn-secondary w-full text-xs justify-center"
                >
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  Mark as Investigating
                </button>
              )}
              {inc.status !== 'resolved' && (
                <button
                  onClick={() => handleUpdate({ status: 'resolved' })}
                  disabled={updating}
                  className="btn-secondary w-full text-xs justify-center hover:border-green-500/50"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  Resolve Case (Close Alert)
                </button>
              )}
              {inc.status === 'resolved' && (
                <button
                  onClick={() => handleUpdate({ status: 'open' })}
                  disabled={updating}
                  className="btn-secondary w-full text-xs justify-center"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Re-open Incident
                </button>
              )}
            </div>
          </div>

          {/* Audit History Logs */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-400" />
              Incident Audit Trail
            </h3>
            
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
              {inc.history && inc.history.length > 0 ? (
                inc.history.map((hist) => (
                  <div key={hist.id} className="text-xs border-l-2 border-dark-700 pl-3 py-0.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-dark-500">
                      <span className="font-semibold text-dark-300">{hist.performed_by}</span>
                      <span>{timeAgo(hist.created_at)}</span>
                    </div>
                    <p className="text-dark-200 text-[11px] leading-tight">{hist.details}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-dark-500 italic">No audit trail events mapped.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
