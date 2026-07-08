/**
 * Dashboard Page - Professional SOC overview
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, AlertTriangle, FileText, CheckCircle, Clock,
  TrendingUp, Users, Globe, Play, RefreshCw, AlertCircle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { dashboardAPI, logsAPI } from '../services/api'
import { SeverityBadge, StatusBadge, RiskScore, KPICard, Spinner } from '../components/shared/SharedComponents'
import { formatDate, timeAgo, THREAT_TYPE_LABELS } from '../utils/helpers'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.get()
        if (active) {
          setData(res.data)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError('Failed to load dashboard metrics. Ensure backend is running.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchData()

    // Polling every 30s
    const timer = setInterval(() => {
      setRefreshKey(k => k + 1)
    }, 30000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [refreshKey])

  const handleScan = async () => {
    try {
      setScanning(true)
      await logsAPI.scan()
      setRefreshKey(k => k + 1)
    } catch (err) {
      alert('Scanning failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setScanning(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const { kpis, charts, recent_alerts, activity_feed } = data || {
    kpis: {}, charts: { severity_pie: [] }, recent_alerts: [], activity_feed: []
  }

  return (
    <div className="space-y-6">
      {/* Upper header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Operations Center</h1>
          <p className="text-dark-400 text-sm">Real-time threat monitoring and event analysis dashboard</p>
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
            onClick={handleScan}
            disabled={scanning || kpis.total_logs === 0}
            className="btn-primary"
          >
            {scanning ? <Spinner size="xs" /> : <Play className="w-4 h-4 fill-current" />}
            Scan Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Security Logs"
          value={kpis.total_logs}
          icon={FileText}
          color="#3b82f6"
          loading={loading}
        />
        <KPICard
          label="Critical Threats"
          value={kpis.critical_alerts}
          icon={AlertTriangle}
          color="#ef4444"
          loading={loading}
        />
        <KPICard
          label="High/Medium Alerts"
          value={(kpis.high_alerts || 0) + (kpis.medium_alerts || 0)}
          icon={Shield}
          color="#f97316"
          loading={loading}
        />
        <KPICard
          label="Open Incidents"
          value={kpis.open_incidents}
          icon={Clock}
          color="#eab308"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="chart-container lg:col-span-2">
          <div className="chart-title">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            Attack Timeline (Trend)
          </div>
          <div className="h-72">
            {charts.attack_timeline && charts.attack_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.attack_timeline}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="total" name="Total Events" stroke="#06b6d4" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                  <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" fill="none" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="high" name="High" stroke="#f97316" fill="none" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-500">No event log data scanned yet.</div>
            )}
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="chart-container">
          <div className="chart-title">
            <Shield className="w-4 h-4 text-primary-400" />
            Severity Distribution
          </div>
          <div className="h-72 flex flex-col justify-center">
            {kpis.total_alerts > 0 ? (
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.severity_pie.filter(c => c.value > 0)}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {charts.severity_pie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{kpis.total_alerts}</span>
                  <span className="text-[10px] uppercase text-dark-500 tracking-wider">Total Alerts</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-500">No alerts detected.</div>
            )}
            <div className="flex justify-center gap-4 text-xs mt-2">
              {charts.severity_pie.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-dark-400">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Attacker IPs */}
        <div className="chart-container">
          <div className="chart-title">
            <Globe className="w-4 h-4 text-primary-400" />
            Top Attacker IPs
          </div>
          <div className="h-64">
            {charts.top_attacker_ips && charts.top_attacker_ips.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.top_attacker_ips} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="source_ip" type="category" width={100} style={{ fontFamily: 'monospace', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Alerts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-500 font-sans">No data available.</div>
            )}
          </div>
        </div>

        {/* Most Targeted Users */}
        <div className="chart-container">
          <div className="chart-title">
            <Users className="w-4 h-4 text-primary-400" />
            Most Targeted Users
          </div>
          <div className="h-64">
            {charts.targeted_users && charts.targeted_users.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.targeted_users}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="username" style={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Attempts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-500">No data available.</div>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-panel p-5 flex flex-col h-[340px]">
          <div className="chart-title border-b border-dark-800 pb-3 mb-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Live Activity Feed
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {activity_feed && activity_feed.length > 0 ? (
              activity_feed.map((act, index) => (
                <div key={index} className="flex items-start gap-3 text-xs border-b border-dark-800/30 pb-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-primary-500`}
                        style={{ backgroundColor: act.type === 'incident' ? '#eab308' : '#06b6d4' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-dark-200 font-medium break-words leading-tight">{act.message}</p>
                    <p className="text-[10px] text-dark-500 mt-0.5">{timeAgo(act.created_at)} · {act.type.toUpperCase()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-dark-500">No activities recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Security Alerts</h2>
          <button onClick={() => navigate('/alerts')} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            View All Alerts
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Threat Name</th>
                <th>Source IP</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>MITRE ATT&CK</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recent_alerts && recent_alerts.length > 0 ? (
                recent_alerts.map((alert) => (
                  <tr key={alert.id} className="cursor-pointer" onClick={() => navigate(`/alerts/${alert.id}`)}>
                    <td className="font-semibold text-white">{alert.alert_name}</td>
                    <td className="font-mono text-xs text-dark-300">{alert.source_ip || '—'}</td>
                    <td><RiskScore score={alert.risk_score} /></td>
                    <td><SeverityBadge severity={alert.severity} /></td>
                    <td className="font-mono text-xs text-primary-400">{alert.mitre_technique || '—'}</td>
                    <td><StatusBadge status={alert.status} /></td>
                    <td className="text-xs text-dark-500">{formatDate(alert.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-dark-500">
                    No security alerts found. Upload and scan logs to generate alerts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
