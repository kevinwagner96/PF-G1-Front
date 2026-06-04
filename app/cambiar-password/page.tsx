'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope, Lock, Eye, EyeOff, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface ValidationRule {
  label: string
  test: (password: string) => boolean
}

const validationRules: ValidationRule[] = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Al menos una mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos un número', test: (p) => /[0-9]/.test(p) },
]

export default function CambiarPasswordPage() {
  const router = useRouter()
  const { user, isAuthenticated, requiresPasswordChange, changePassword, isLoading } = useAuth()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (!requiresPasswordChange) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, requiresPasswordChange, router])

  const allRulesPassed = validationRules.every(rule => rule.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!allRulesPassed) {
      setError('La contraseña no cumple con todos los requisitos')
      return
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    const success = await changePassword(newPassword)
    if (success) {
      router.push('/seleccionar-experiencia')
    } else {
      setError('Error al cambiar la contraseña')
    }
  }

  if (!isAuthenticated || !requiresPasswordChange) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SurgiCare</h1>
          <p className="text-gray-500 mt-1">Sistema de Gestión de Turnos Quirúrgicos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Cambiar Contraseña</h2>
            <p className="text-sm text-gray-500 mt-1">
              Bienvenido/a {user?.nombre}. Por seguridad, debe cambiar su contraseña inicial.
            </p>
          </div>

          {/* Alerta informativa */}
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-amber-800">
              Este es su primer inicio de sesión. Debe establecer una nueva contraseña para continuar.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nueva contraseña */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={18} />
                </div>
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Validaciones */}
            <div className="space-y-2">
              {validationRules.map((rule, index) => {
                const passed = rule.test(newPassword)
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-sm ${
                      passed ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {passed ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <X size={16} className="text-gray-300" />
                    )}
                    <span>{rule.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={18} />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  required
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-300'
                        : 'border-red-300'
                      : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading || !allRulesPassed || !passwordsMatch}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Guardando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 SurgiCare. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
