'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, FlaskConical, LogOut, MonitorCog, Stethoscope } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function SeleccionarExperienciaPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange, logout, user } = useAuth()

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

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">SurgiCare</h1>
              <p className="text-sm text-slate-500">Bienvenido/a, {user?.nombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            <LogOut size={16} />
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Elegir experiencia</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Seleccioná cómo querés ingresar</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="group min-h-80 rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
              <MonitorCog size={34} />
            </div>
            <h3 className="text-3xl font-bold text-slate-950">Mockup</h3>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
              Ingresa al sistema completo como está hoy, usando los datos mock para recorrer pantallas,
              navegación y flujos visuales.
            </p>
          </button>

          <button
            type="button"
            onClick={() => router.push('/mvp/cirugias')}
            className="group min-h-80 rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
              <FlaskConical size={34} />
            </div>
            <h3 className="text-3xl font-bold text-slate-950">MVP</h3>
            <p className="mt-2 text-lg font-semibold text-emerald-700">Programacion de Agenda con IA</p>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
              Ingresa a la primera versión conectada a la base real. Por ahora solo está habilitada
              la lista de cirugías.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <CalendarClock size={16} />
              Datos reales desde PostgreSQL
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}

