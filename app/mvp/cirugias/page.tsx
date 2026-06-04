'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, RefreshCw } from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface CirugiaReal {
  id: string
  inicio: string | null
  fin: string | null
  pacienteId: string
  paciente: string
  dni: string
  especialidad: string
  sala: string | null
  anestesia: string | null
  byer: boolean
  sedacion: boolean
  estado: string
  intervenciones: string[]
  insumos: { nombre: string; cantidad: number }[]
  observaciones: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin programar'

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function MvpCirugiasPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth()
  const [cirugias, setCirugias] = useState<CirugiaReal[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (requiresPasswordChange) {
        router.push('/cambiar-password')
      }
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router])

  useEffect(() => {
    if (!isAuthenticated || requiresPasswordChange) return

    async function fetchCirugias() {
      setIsFetching(true)
      setError(null)
      try {
        const data = await apiRequest<CirugiaReal[]>('/cirugias')
        setCirugias(data)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar las cirugías')
      } finally {
        setIsFetching(false)
      }
    }

    fetchCirugias()
  }, [isAuthenticated, requiresPasswordChange])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const refreshCirugias = async () => {
    setIsFetching(true)
    setError(null)
    try {
      const data = await apiRequest<CirugiaReal[]>('/cirugias')
      setCirugias(data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar las cirugías')
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage="lista-cirugias" navigationMode="mvp" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Cirugías</h1>
                <p className="text-muted-foreground mt-1">
                  MVP - Programacion de Agenda con IA. Datos reales desde PostgreSQL.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshCirugias}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {isFetching ? (
                <div className="flex min-h-64 items-center justify-center text-slate-500">
                  Cargando cirugías...
                </div>
              ) : error ? (
                <div className="flex min-h-64 items-center justify-center text-red-600">
                  {error}
                </div>
              ) : cirugias.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <CalendarDays size={44} className="mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900">No hay cirugías cargadas</h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    La tabla ya consulta la base real. Cuando carguemos cirugías en PostgreSQL,
                    van a aparecer acá.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Inicio</th>
                        <th className="px-4 py-3">Paciente</th>
                        <th className="px-4 py-3">Especialidad</th>
                        <th className="px-4 py-3">Intervenciones</th>
                        <th className="px-4 py-3">Sala</th>
                        <th className="px-4 py-3">Anestesia</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Opciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cirugias.map((cirugia) => (
                        <tr key={cirugia.id} className="hover:bg-muted/50">
                          <td className="px-4 py-4 font-medium text-foreground">
                            {formatDateTime(cirugia.inicio)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground">{cirugia.paciente}</div>
                            <div className="text-xs text-muted-foreground">DNI {cirugia.dni}</div>
                          </td>
                          <td className="px-4 py-4 text-foreground">{cirugia.especialidad}</td>
                          <td className="px-4 py-4 text-foreground">
                            {cirugia.intervenciones.length > 0
                              ? cirugia.intervenciones.join(', ')
                              : 'Sin intervenciones'}
                          </td>
                          <td className="px-4 py-4 text-foreground">{cirugia.sala ?? 'Sin sala'}</td>
                          <td className="px-4 py-4 text-foreground">
                            {cirugia.anestesia ?? 'Sin definir'}
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              {cirugia.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-foreground">
                            {[
                              cirugia.byer ? 'Byer' : null,
                              cirugia.sedacion ? 'Sedación' : null,
                            ].filter(Boolean).join(' · ') || 'Sin opciones'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
