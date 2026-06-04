'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
    } else if (requiresPasswordChange) {
      router.replace('/cambiar-password')
    } else {
      router.replace('/seleccionar-experiencia')
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Cargando...</div>
    </div>
  )
}
