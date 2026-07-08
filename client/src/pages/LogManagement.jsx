/**
 * Log Management Page - Handles uploading, parsing, viewing and deleting logs
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  FileText, Upload, Trash2, Search, Filter, AlertCircle, CheckCircle,
  Play, RefreshCw, X, ArrowUpRight
} from 'lucide-react'
import { logsAPI } from '../services/api'
import { formatDate, truncate } from '../utils/helpers'
import { Spinner, Pagination, EmptyState } from '../components/shared/SharedComponents'

export default function LogManagement() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [filenameFilter, setFilenameFilter] = useState('')
  const [filenames, setFilenames] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanningFile, setScanningFile] = useState(null)
  
  // Upload states
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const fileInputRef = useRef(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await logsAPI.getAll({
        page,
        per_page: perPage,
        search,
        status: statusFilter,
        filename: filenameFilter
      })
      setLogs(res.data.logs)
      setTotal(res.data.total)
      setFilenames(res.data.filenames || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, statusFilter, filenameFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete log entry #${id}?`)) return
    try {
      await logsAPI.delete(id)
      fetchLogs()
    } catch (err) {
      alert('Delete failed')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setUploadError('')
    setUploadSuccess('')

    try {
      const res = await logsAPI.upload(file, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(percent)
      })
      setUploadSuccess(res.data.message)
      setPage(1)
      fetchLogs()
      
      // Auto trigger scan on file upload
      setScanningFile(file.name)
      await handleScan(res.data.log_ids)
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload log file')
    } finally {
      setUploading(false)
      setScanningFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleScan = async (logIds = null) => {
    try {
      setScanning(true)
      const res = await logsAPI.scan(logIds)
      alert(`Threat detection scan complete!\nGenerated ${res.data.alerts_generated} alerts.`)
    } catch (err) {
      alert('Scanning failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Log Management</h1>
          <p className="text-dark-400 text-sm">Upload, parse, search and manage security event logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScan()}
            disabled={scanning || logs.length === 0}
            className="btn-primary"
          >
            {scanning ? (
              <>
                <Spinner size="xs" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Detection Rules
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Zone & Form Filter panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Log Upload Card */}
        <div className="glass-panel p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary-400" />
              Upload Security Logs
            </h2>
            <p className="text-dark-400 text-xs mb-4">
              Supported formats: <b>CSV, LOG, TXT</b>. Files will be parsed automatically using rule-based parsers.
            </p>

            {/* Drag Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-dark-700 hover:border-primary-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group bg-dark-900/30 hover:bg-dark-900/50"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.log,.txt"
                className="hidden"
              />
              <FileText className="w-10 h-10 text-dark-500 group-hover:text-primary-400 transition-colors mb-3" />
              <span className="text-xs font-semibold text-dark-200 group-hover:text-white transition-colors">
                Select log file
              </span>
              <span className="text-[10px] text-dark-500 mt-1">or drag & drop here</span>
            </div>
          </div>

          {/* Progress / Status */}
          <div className="mt-4 space-y-2">
            {uploading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-400">Uploading log file...</span>
                  <span className="text-primary-400 font-mono font-semibold">{uploadProgress}%</span>
                </div>
                <div className="h-1 bg-dark-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {scanning && scanningFile && (
              <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg">
                <Spinner size="xs" />
                Parsing & scanning {scanningFile}...
              </div>
            )}

            {uploadError && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="flex items-start gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-lg">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{uploadSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter controls */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-400" />
            Search & Filters
          </h2>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs by IP address, username, action, etc..."
                className="input pl-10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="select"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="ALLOWED">ALLOWED</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1">File Origin</label>
              <select
                value={filenameFilter}
                onChange={(e) => { setFilenameFilter(e.target.value); setPage(1) }}
                className="select"
              >
                <option value="">All Files</option>
                {filenames.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              {(search || statusFilter || filenameFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('')
                    setFilenameFilter('')
                    setPage(1)
                  }}
                  className="btn-secondary py-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
              <button type="submit" className="btn-primary py-2 px-6">
                Apply Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Log list table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Source IP</th>
                    <th>Destination IP</th>
                    <th>Username</th>
                    <th>Port/Proto</th>
                    <th>Status</th>
                    <th>Action</th>
                    <th>Raw Line</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs text-dark-400 whitespace-nowrap font-mono">{log.timestamp || formatDate(log.created_at)}</td>
                      <td className="font-mono text-xs text-white">{log.source_ip || '—'}</td>
                      <td className="font-mono text-xs text-dark-300">{log.dest_ip || '—'}</td>
                      <td className="font-semibold text-dark-200">{log.username || '—'}</td>
                      <td className="font-mono text-xs text-dark-300">
                        {log.port ? `${log.port}/${log.protocol}` : log.protocol || '—'}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          log.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          log.status === 'BLOCKED' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-dark-800 text-dark-400 border border-dark-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-primary-400">{log.action || '—'}</td>
                      <td className="text-xs text-dark-500 font-mono" title={log.raw_line}>
                        {truncate(log.raw_line, 50)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="btn-icon text-dark-500 hover:text-red-400 hover:bg-red-500/10"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
            icon={FileText}
            title="No Log Entries Found"
            description="Upload log files or clear filters to populate security logs."
            action={
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Upload Sample Log
              </button>
            }
          />
        )}
      </div>
    </div>
  )
}
