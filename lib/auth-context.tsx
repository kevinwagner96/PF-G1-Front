'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { mockUsuarios, Usuario } from './mock-data'

interface AuthState {
  user: Usuario | null
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
    // Simular verificación de sesión
    const savedUser = localStorage.getItem('surgicare_user')
    if (savedUser) {
      const user = JSON.parse(savedUser) as Usuario
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

  const login = async (email: string, password: string): Promise<{ success: boolean; requiresPasswordChange?: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800))

    const user = mockUsuarios.find(u => u.email === email)

    if (!user) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Credenciales incorrectas' }))
      return { success: false }
    }

    if (user.password !== password) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Credenciales incorrectas' }))
      return { success: false }
    }

    if (user.bloqueado) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Cuenta bloqueada. Contacte al administrador.' }))
      return { success: false }
    }

    localStorage.setItem('surgicare_user', JSON.stringify(user))
    
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      requiresPasswordChange: user.requiereCambioPassword,
    })

    return { success: true, requiresPasswordChange: user.requiereCambioPassword }
  }

  const logout = () => {
    localStorage.removeItem('surgicare_user')
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresPasswordChange: false,
    })
  }

  const changePassword = async (newPassword: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }))

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (state.user) {
      const updatedUser = { ...state.user, requiereCambioPassword: false }
      localStorage.setItem('surgicare_user', JSON.stringify(updatedUser))
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
        requiresPasswordChange: false,
      }))
      return true
    }

    setState(prev => ({ ...prev, isLoading: false }))
    return false
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
