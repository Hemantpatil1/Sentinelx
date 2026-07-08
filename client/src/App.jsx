/**
 * SentinelX App — Root component with routing
 */
import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoadingScreen from './components/shared/LoadingScreen'

// Lazy-loaded pages
const Login            = lazy(() => import('./pages/Login'))
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const LogManagement    = lazy(() => import('./pages/LogManagement'))
const ThreatDetection  = lazy(() => import('./pages/ThreatDetection'))
const Alerts           = lazy(() => import('./pages/Alerts'))
const AlertDetail      = lazy(() => import('./pages/AlertDetail'))
const Incidents        = lazy(() => import('./pages/Incidents'))
const IncidentDetail   = lazy(() => import('./pages/IncidentDetail'))
const Reports          = lazy(() => import('./pages/Reports'))
const ThreatIntelligence = lazy(() => import('./pages/ThreatIntelligence'))
const Settings         = lazy(() => import('./pages/Settings'))
const NotFound         = lazy(() => import('./pages/NotFound'))

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// Public route (redirect to dashboard if logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Protected routes (wrapped in AppLayout) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={<Dashboard />} />
          <Route path="logs"               element={<LogManagement />} />
          <Route path="threat-detection"   element={<ThreatDetection />} />
          <Route path="alerts"             element={<Alerts />} />
          <Route path="alerts/:id"         element={<AlertDetail />} />
          <Route path="incidents"          element={<Incidents />} />
          <Route path="incidents/:id"      element={<IncidentDetail />} />
          <Route path="reports"            element={<Reports />} />
          <Route path="threat-intelligence" element={<ThreatIntelligence />} />
          <Route path="settings"           element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
