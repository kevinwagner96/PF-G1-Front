'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { apiRequest } from './api'
import type { ReactNode } from 'react'
import type { Usuario } from './mock-data'

type AuthenticatedUser = Omit<Usuario, 'password'>

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000

interface StoredSession {
  user: AuthenticatedUser
  expiresAt: number
}

interface LoginResponse {
  user: AuthenticatedUser
}

interface ChangePasswordResponse {
  user: AuthenticatedUser
}

interface AuthState {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  requiresPasswordChange: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; requiresPasswordChange?: boolean }>
  logout: () => void
  changePassword: (newPassword: string) => Promise<boolean>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function createStoredSession(user: AuthenticatedUser): StoredSession {
  return {
    user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    requiresPasswordChange: false,
  })

  useEffect(() => {
    const savedSession = localStorage.getItem('surgicare_session')
    const legacySavedUser = localStorage.getItem('surgicare_user')

    if (savedSession) {
      const session = JSON.parse(savedSession) as StoredSession

      if (session.expiresAt <= Date.now()) {
        localStorage.removeItem('surgicare_session')
        localStorage.removeItem('surgicare_user')
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      setState({
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requiresPasswordChange: session.user.requiereCambioPassword,
      })
    } else if (legacySavedUser) {
      const user = JSON.parse(legacySavedUser) as AuthenticatedUser
      const session = createStoredSession(user)
      localStorage.setItem('surgicare_session', JSON.stringify(session))
      localStorage.removeItem('surgicare_user')

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requiresPasswordChange: user.requiereCambioPassword,
      })
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    if (!state.isAuthenticated) return

    const savedSession = localStorage.getItem('surgicare_session')
    if (!savedSession) return

    const session = JSON.parse(savedSession) as StoredSession
    const remainingTime = session.expiresAt - Date.now()

    if (remainingTime <= 0) {
      logout()
      return
    }

    const timeoutId = window.setTimeout(() => {
      logout()
    }, remainingTime)

    return () => window.clearTimeout(timeoutId)
  }, [state.isAuthenticated])

  const login = async (email: string, password: string): Promise<{ success: boolean; requiresPasswordChange?: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { user } = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem('surgicare_session', JSON.stringify(createStoredSession(user)))
      localStorage.removeItem('surgicare_user')
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requiresPasswordChange: user.requiereCambioPassword,
      })

      return { success: true, requiresPasswordChange: user.requiereCambioPassword }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Credenciales incorrectas',
      }))
      return { success: false }
    }
  }

  const logout = () => {
    localStorage.removeItem('surgicare_user')
    localStorage.removeItem('surgicare_session')
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresPasswordChange: false,
    })
  }

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!state.user) {
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { user } = await apiRequest<ChangePasswordResponse>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ userId: state.user.id, newPassword }),
      })

      localStorage.setItem('surgicare_session', JSON.stringify(createStoredSession(user)))
      localStorage.removeItem('surgicare_user')
    
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
        requiresPasswordChange: false,
      }))

      return true
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cambiar la contraseña',
      }))
      return false
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, changePassword, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
