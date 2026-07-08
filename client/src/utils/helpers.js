/**
 * Shared utility functions
 */

/**
 * Format a date string for display
 */
export const formatDate = (dateStr, includeTime = true) => {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
    return new Intl.DateTimeFormat('en-US', options).format(date)
  } catch {
    return dateStr
  }
}

/**
 * Format relative time (e.g. "2 minutes ago")
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60)    return `${diff}s ago`
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch {
    return dateStr
  }
}

/**
 * Get severity color class
 */
export const getSeverityClass = (severity) => {
  const s = (severity || '').toLowerCase()
  if (s === 'critical') return 'badge-critical'
  if (s === 'high')     return 'badge-high'
  if (s === 'medium')   return 'badge-medium'
  if (s === 'low')      return 'badge-low'
  return 'badge-neutral'
}

/**
 * Get severity dot color
 */
export const getSeverityColor = (severity) => {
  const s = (severity || '').toLowerCase()
  if (s === 'critical') return '#ef4444'
  if (s === 'high')     return '#f97316'
  if (s === 'medium')   return '#eab308'
  if (s === 'low')      return '#22c55e'
  return '#64748b'
}

/**
 * Get status badge class
 */
export const getStatusClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'open')          return 'status-open'
  if (s === 'investigating') return 'status-investigating'
  if (s === 'resolved')      return 'status-resolved'
  if (s === 'closed')        return 'status-closed'
  return 'badge-neutral'
}

/**
 * Get risk score color
 */
export const getRiskColor = (score) => {
  if (score >= 90) return '#ef4444'
  if (score >= 75) return '#f97316'
  if (score >= 50) return '#eab308'
  return '#22c55e'
}

/**
 * Threat type to display name
 */
export const THREAT_TYPE_LABELS = {
  brute_force:          'Brute Force',
  port_scan:            'Port Scan',
  malicious_ip:         'Malicious IP',
  ddos:                 'DDoS Attack',
  suspicious_admin:     'Suspicious Admin Login',
  impossible_travel:    'Impossible Travel',
  privilege_escalation: 'Privilege Escalation',
}

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLen = 40) => {
  if (!text) return '—'
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

/**
 * Format bytes to human-readable
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Generate a random color for charts (from a preset palette)
 */
const CHART_COLORS = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#f97316', '#84cc16', '#06b6d4', '#6366f1',
]
export const getChartColor = (index) => CHART_COLORS[index % CHART_COLORS.length]

/**
 * Clamp a value between min and max
 */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
