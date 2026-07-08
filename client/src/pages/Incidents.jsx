/**
 * Incidents Page - Main list of escalated security incidents
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Search, Filter, RefreshCw, UserCheck } from 'lucide-react'
import { incidentsAPI } from '../services/api'
import { SeverityBadge, StatusBadge, RiskScore, Pagination, EmptyState, Spinner } from '../components/shared/SharedComponents'
import { formatDate, truncate } from '../utils/helpers'

export default function Incidents() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const res = await incidentsAPI.getAll({
        page,
        per_page: perPage,
        status: statusFilter,
        priority: priorityFilter
      })
      setIncidents(res.data.incidents)
      setTotal(res.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [page, statusFilter, priorityFilter])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-yellow-500 fill-yellow-500/10" />
            Security Incidents
          </h1>
          <p className="text-dark-400 text-sm">Escalated case management, owner assignment and remediation audit trail</p>
        </div>
        <button
          onClick={fetchIncidents}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Options */}
      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-dark-400 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="select"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-dark-400 mb-1">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }}
            className="select"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-end justify-end">
          <button onClick={fetchIncidents} className="btn-primary w-full py-2">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Incidents List Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : incidents.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Incident ID</th>
                    <th>Title</th>
                    <th>Severity / Priority</th>
                    <th>Risk</th>
                    <th>Source IP</th>
                    <th>Assigned Analyst</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="cursor-pointer hover:bg-dark-800/50"
                    >
                      <td className="font-mono text-xs text-dark-400 font-semibold">INC-{inc.id}</td>
                      <td className="font-semibold text-white">{inc.title}</td>
                      <td>
                        <SeverityBadge severity={inc.priority} />
                      </td>
                      <td>
                        <RiskScore score={inc.risk_score || 0} />
                      </td>
                      <td className="font-mono text-xs text-dark-300">{inc.source_ip || '—'}</td>
                      <td className="text-xs text-dark-200">
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-dark-500" />
                          {inc.assigned_to || <span className="text-dark-500 italic">Unassigned</span>}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="text-xs text-dark-500">{formatDate(inc.updated_at)}</td>
                      <td className="text-xs text-dark-500">{formatDate(inc.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4">
              <Pagination
                page={page}
                totalPages={Math.ceil(total / perPage)}
                onPageChange={setPage}
                total={total}
                perPage={perPage}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No Incidents Logged"
            description="No escalated security cases mapped to database. Create incidents from alerts."
          />
        )}
      </div>
    </div>
  )
}
