/**
 * Alerts Page - Full alert monitoring list
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Filter, RefreshCw, PlusCircle, FileSpreadsheet } from 'lucide-react'
import { alertsAPI, incidentsAPI, reportsAPI, downloadBlob } from '../services/api'
import { SeverityBadge, StatusBadge, RiskScore, Pagination, EmptyState, Spinner } from '../components/shared/SharedComponents'
import { formatDate, truncate, THREAT_TYPE_LABELS } from '../utils/helpers'

export default function Alerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [threatFilter, setThreatFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const res = await alertsAPI.getAll({
        page,
        per_page: perPage,
        search,
        severity: severityFilter,
        status: statusFilter,
        threat_type: threatFilter,
      })
      setAlerts(res.data.alerts)
      setTotal(res.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [page, severityFilter, statusFilter, threatFilter, refreshKey])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchAlerts()
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const blobRes = await reportsAPI.generateCSV({
        alert_ids: alerts.map(a => a.id)
      })
      downloadBlob(blobRes.data, `sentinelx_alerts_export_${Date.now()}.csv`)
    } catch (err) {
      alert('CSV export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleCreateIncident = async (alert) => {
    if (!window.confirm(`Create a new security incident from Alert #${alert.id}?`)) return
    try {
      const res = await incidentsAPI.create({
        alert_id: alert.id,
        title: `Incident: [${alert.severity.toUpperCase()}] ${alert.alert_name}`,
        notes: `Automatically generated from threat detection alert.\nSource: ${alert.source_ip}\nDestination: ${alert.dest_ip}\nUsername: ${alert.username}\nRisk Score: ${alert.risk_score}`
      })
      navigate(`/incidents/${res.data.incident_id}`)
    } catch (err) {
      alert('Failed to generate incident: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Alerts</h1>
          <p className="text-dark-400 text-sm">Monitor, filter, investigate, and escalate rule engine security alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting || alerts.length === 0}
            className="btn-secondary"
          >
            {exporting ? <Spinner size="xs" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Form */}
      <div className="glass-panel p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts by name, Source IP, MITRE technique..."
              className="input pl-10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-400 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }}
              className="select"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

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
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-400 mb-1">Threat Type</label>
            <select
              value={threatFilter}
              onChange={(e) => { setThreatFilter(e.target.value); setPage(1) }}
              className="select"
            >
              <option value="">All Threats</option>
              {Object.entries(THREAT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button type="submit" className="btn-primary w-full py-2">
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Alerts Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : alerts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Alert Name</th>
                    <th>Threat Type</th>
                    <th>Source IP</th>
                    <th>Risk Score</th>
                    <th>Severity</th>
                    <th>MITRE ATT&CK</th>
                    <th>Status</th>
                    <th>Time Generated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="group relative">
                      <td
                        onClick={() => navigate(`/alerts/${alert.id}`)}
                        className="font-semibold text-white cursor-pointer group-hover:text-primary-400 transition-colors"
                      >
                        {alert.alert_name}
                      </td>
                      <td className="text-xs text-dark-300">{THREAT_TYPE_LABELS[alert.threat_type] || alert.threat_type}</td>
                      <td className="font-mono text-xs text-dark-300">{alert.source_ip || '—'}</td>
                      <td><RiskScore score={alert.risk_score} /></td>
                      <td><SeverityBadge severity={alert.severity} /></td>
                      <td className="font-mono text-xs text-primary-400">{alert.mitre_technique || '—'}</td>
                      <td><StatusBadge status={alert.status} /></td>
                      <td className="text-xs text-dark-500">{formatDate(alert.created_at)}</td>
                      <td className="text-right">
                        {alert.status === 'open' ? (
                          <button
                            onClick={() => handleCreateIncident(alert)}
                            className="btn-icon hover:bg-yellow-500/10 hover:text-yellow-400"
                            title="Escalate to Incident"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/alerts/${alert.id}`)}
                            className="text-xs text-primary-400 hover:text-primary-300 underline bg-transparent border-0 cursor-pointer"
                          >
                            View
                          </button>
                        )}
                      </td>
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
            icon={Bell}
            title="No Alerts Detected"
            description="All systems clear. Check your logs or run a detection scan to locate potential security issues."
          />
        )}
      </div>
    </div>
  )
}
