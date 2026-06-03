'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/sidebar'
import PersonalList from '@/components/personal-list'

export default function PersonalPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (requiresPasswordChange) {
        router.push('/cambiar-password')
      }
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage="personal" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <PersonalList />
          </div>
        </main>
      </div>
    </div>
  )
}
