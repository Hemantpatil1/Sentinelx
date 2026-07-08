/**
 * Authentication Context
 * Provides auth state and login/logout actions across the app
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('sentinelx_token')
    const storedUser = localStorage.getItem('sentinelx_user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('sentinelx_token')
        localStorage.removeItem('sentinelx_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    setError(null)
    setLoading(true)
    try {
      const { data } = await authAPI.login(username, password)
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('sentinelx_token', data.token)
      localStorage.setItem('sentinelx_user', JSON.stringify(data.user))
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('sentinelx_token')
      localStorage.removeItem('sentinelx_user')
    }
  }, [])

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
