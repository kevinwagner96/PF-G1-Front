'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/sidebar'
import MockDataNotice from '@/components/mock-data-notice'

export default function MockPageShell({ activePage, children }: { activePage: string; children: ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth()

  const mockAuthBypass = process.env.NEXT_PUBLIC_MOCK_AUTH_BYPASS === 'true'

  useEffect(() => {
    if (mockAuthBypass) return
    if (!isLoading && !isAuthenticated) router.push('/login')
    else if (!isLoading && requiresPasswordChange) router.push('/cambiar-password')
  }, [isAuthenticated, isLoading, requiresPasswordChange, mockAuthBypass, router])

  if (!mockAuthBypass && (isLoading || !isAuthenticated)) return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">Cargando...</div>
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage={activePage} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MockDataNotice />
        <main className="min-w-0 flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
