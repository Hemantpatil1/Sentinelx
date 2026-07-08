/**
 * Reports Page - Generate professional incident threat reports
 */
import React, { useState, useEffect } from 'react'
import { FileText, FileBarChart, Download, FileSpreadsheet, Send, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { reportsAPI, downloadBlob } from '../services/api'
import { formatDate } from '../utils/helpers'
import { Spinner } from '../components/shared/SharedComponents'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [generatingCsv, setGeneratingCsv] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchReportsList = async () => {
    try {
      setLoading(true)
      const res = await reportsAPI.getAll()
      setReports(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportsList()
  }, [])

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPdf(true)
      setSuccessMsg('')
      const res = await reportsAPI.generatePDF({ type: 'threat_summary' })
      const filename = `sentinelx_threat_report_${Date.now()}.pdf`
      downloadBlob(res.data, filename)
      setSuccessMsg('PDF Threat Report generated successfully.')
      fetchReportsList()
    } catch (err) {
      alert('Failed to generate PDF Report. Ensure ReportLab is installed in your python env.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleGenerateCSV = async () => {
    try {
      setGeneratingCsv(true)
      setSuccessMsg('')
      const res = await reportsAPI.generateCSV()
      const filename = `sentinelx_alerts_export_${Date.now()}.csv`
      downloadBlob(res.data, filename)
      setSuccessMsg('CSV Export generated successfully.')
      fetchReportsList()
    } catch (err) {
      alert('Failed to generate CSV export.')
    } finally {
      setGeneratingCsv(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-primary-400" />
            SOC Reports & Analytics
          </h1>
          <p className="text-dark-400 text-sm">Generate executive PDF threat summaries, CSV event exports, and audit reports</p>
        </div>
        <button
          onClick={fetchReportsList}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Action panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PDF Generator */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-base font-bold text-white">Executive Threat Summary (PDF)</h2>
            <p className="text-xs text-dark-400 leading-relaxed">
              Generates a formal, printable PDF document containing audit metadata, executive metrics summaries, alert details (up to 30 events), and actionable SOC recommendation logs.
            </p>
          </div>
          <button
            onClick={handleGeneratePDF}
            disabled={generatingPdf}
            className="btn-primary w-full justify-center py-2.5 mt-4"
          >
            {generatingPdf ? (
              <>
                <Spinner size="xs" />
                Generating Document...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF Report
              </>
            )}
          </button>
        </div>

        {/* CSV Exporter */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-white">Full Alerts Event Export (CSV)</h2>
            <p className="text-xs text-dark-400 leading-relaxed">
              Exports the entire alerts database table containing complete columns (threat categories, source/destination IPs, usernames, risk scores, status) for SIEM import or Excel forensics.
            </p>
          </div>
          <button
            onClick={handleGenerateCSV}
            disabled={generatingCsv}
            className="btn-secondary w-full justify-center py-2.5 mt-4 hover:border-emerald-500/50"
          >
            {generatingCsv ? (
              <>
                <Spinner size="xs" />
                Exporting Data...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Alerts CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated history */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-800">
          <h2 className="text-sm font-semibold text-white">Generated Report Registry</h2>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Format</th>
                  <th>Generated By</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep) => (
                  <tr key={rep.id}>
                    <td className="font-semibold text-white font-mono text-xs">{rep.report_name}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.report_type === 'pdf' ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {rep.report_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-xs text-dark-200">{rep.generated_by}</td>
                    <td className="text-xs text-dark-500">{formatDate(rep.created_at)}</td>
                    <td>
                      <span className="text-[10px] text-dark-500 italic">Saved in generated_reports/</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-dark-500 text-xs">
            No reports in registry. Click buttons above to compile and register threat intelligence documents.
          </div>
        )}
      </div>
    </div>
  )
}
