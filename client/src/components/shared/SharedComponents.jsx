/**
 * Shared reusable components
 */
import React from 'react'
import { clsx } from 'clsx'
import { getSeverityClass, getStatusClass, getSeverityColor, getRiskColor } from '../../utils/helpers'

// ─── Severity Badge ───────────────────────────────────────────────────────────
export function SeverityBadge({ severity, size = 'sm' }) {
  const s = (severity || '').toLowerCase()
  return (
    <span className={clsx(getSeverityClass(s), size === 'lg' && 'text-sm px-3 py-1.5')}>
      <span className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: getSeverityColor(s) }} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const labels = {
    open: 'Open',
    investigating: 'Investigating',
    resolved: 'Resolved',
    closed: 'Closed',
    false_positive: 'False Positive',
  }
  return (
    <span className={getStatusClass(s)}>
      {labels[s] || s}
    </span>
  )
}

// ─── Risk Score ───────────────────────────────────────────────────────────────
export function RiskScore({ score }) {
  const color = getRiskColor(score)
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="risk-bar flex-1">
        <div
          className="risk-bar-fill"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-semibold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

// ─── IP Tag ───────────────────────────────────────────────────────────────────
export function IPTag({ ip, isBlacklisted, isTrusted }) {
  if (!ip) return <span className="text-dark-600">—</span>
  return (
    <span className={clsx(
      'ip-tag',
      isBlacklisted && 'ip-tag-danger',
      isTrusted && 'ip-tag-safe'
    )}>
      {ip}
    </span>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 'sm', className = '' }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-10 h-10' }
  return (
    <div className={clsx('border-2 border-dark-700 border-t-primary-500 rounded-full animate-spin',
      sizes[size], className)} />
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {Icon && <Icon className="w-8 h-8 text-dark-500" />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange, total, perPage }) {
  if (totalPages <= 1) return null

  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  const pages = []
  const maxVisible = 5
  let start = Math.max(1, page - 2)
  let end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between pt-4 border-t border-dark-800">
      <span className="text-xs text-dark-500">
        Showing {from}–{to} of {total} results
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="pagination-btn disabled:opacity-30 disabled:cursor-not-allowed text-xs"
        >
          ‹
        </button>
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="pagination-btn text-xs w-7 h-7">1</button>
            {start > 2 && <span className="text-dark-600 text-xs px-1">…</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx('pagination-btn text-xs w-7 h-7', p === page && 'active')}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-dark-600 text-xs px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="pagination-btn text-xs w-7 h-7">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="pagination-btn disabled:opacity-30 disabled:cursor-not-allowed text-xs"
        >
          ›
        </button>
      </div>
    </div>
  )
}

// ─── MITRE Badge ─────────────────────────────────────────────────────────────
export function MitreBadge({ technique, tactic }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-xs text-primary-400 font-semibold">{technique}</span>
      {tactic && <span className="text-[10px] text-dark-500">{tactic}</span>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="page-title flex items-center gap-3">
          {Icon && (
            <span className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary-400" />
            </span>
          )}
          {title}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KPICard({ label, value, icon: Icon, color, change, loading, className }) {
  return (
    <div className={clsx('kpi-card animate-slide-up', className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-dark-400 font-medium uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-dark-700 rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>
          {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
        </div>
      )}
      {change !== undefined && (
        <div className={clsx(
          'text-xs mt-2',
          change >= 0 ? 'text-red-400' : 'text-green-400'
        )}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% from yesterday
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full glass-panel animate-fade-in', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <h2 className="text-base font-semibold text-dark-100">{title}</h2>
          <button onClick={onClose} className="btn-icon">
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Toast notification (simple) ─────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  const colors = {
    success: 'border-green-500/30 bg-green-500/10 text-green-300',
    error:   'border-red-500/30 bg-red-500/10 text-red-300',
    info:    'border-primary-500/30 bg-primary-500/10 text-primary-300',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  }
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border',
      'glass-panel animate-slide-up max-w-sm',
      colors[type]
    )}>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-xs opacity-60 hover:opacity-100">×</button>
    </div>
  )
}
