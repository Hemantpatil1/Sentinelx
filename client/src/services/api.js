/**
 * API Service Layer — Axios instance with JWT interceptors
 */
import axios from 'axios'

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor: Attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sentinelx_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor: Handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sentinelx_token')
      localStorage.removeItem('sentinelx_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
}

// ─── Dashboard API ────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

// ─── Logs API ─────────────────────────────────────────────────────────────────
export const logsAPI = {
  getAll: (params = {}) => api.get('/logs', { params }),
  upload: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/logs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  delete: (id) => api.delete(`/logs/${id}`),
  scan: (logIds) => api.post('/logs/scan', { log_ids: logIds }),
  stats: () => api.get('/logs/stats'),
}

// ─── Alerts API ───────────────────────────────────────────────────────────────
export const alertsAPI = {
  getAll: (params = {}) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  updateStatus: (id, status) => api.put(`/alerts/${id}/status`, { status }),
  summary: () => api.get('/alerts/summary'),
}

// ─── Incidents API ────────────────────────────────────────────────────────────
export const incidentsAPI = {
  getAll: (params = {}) => api.get('/incidents', { params }),
  get: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
}

// ─── Reports API ──────────────────────────────────────────────────────────────
export const reportsAPI = {
  getAll: () => api.get('/reports'),
  generatePDF: (data = {}) =>
    api.post('/reports/pdf', data, { responseType: 'blob' }),
  generateCSV: (data = {}) =>
    api.post('/reports/csv', data, { responseType: 'blob' }),
}

// ─── Threat Intel API ─────────────────────────────────────────────────────────
export const threatIntelAPI = {
  get: () => api.get('/threat-intel'),
  checkIP: (ip) => api.post('/threat-intel/check', { ip }),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default api
