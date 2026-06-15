'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { apiRequest, ensureCsrfToken } from './api'
import type { ReactNode } from 'react'
import type { Usuario } from './mock-data'

type AuthenticatedUser = Omit<Usuario, 'password'>

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    requiresPasswordChange: false,
  })

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        await ensureCsrfToken()
        const { user } = await apiRequest<LoginResponse>('/auth/me/')
        if (cancelled) return
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          requiresPasswordChange: user.requiereCambioPassword,
        })
      } catch {
        if (cancelled) return
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          requiresPasswordChange: false,
        })
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; requiresPasswordChange?: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { user } = await apiRequest<LoginResponse>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

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
    apiRequest<void>('/auth/logout/', { method: 'POST' }).catch(() => undefined)
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresPasswordChange: false,
    })
  }

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!state.user) return false

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { user } = await apiRequest<ChangePasswordResponse>('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      })

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
