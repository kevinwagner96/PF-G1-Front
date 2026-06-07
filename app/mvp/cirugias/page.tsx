'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  CalendarDays,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react'
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

type PlanningStatus = 'planning' | 'completed' | 'failed'

interface PlanningCreateResponse {
  id: string
  scheduler_uuid: string
  status: PlanningStatus
}

interface PlanningCronogramaItem {
  paciente_id: number
  medico: string
  slot_inicio?: number
  hora_inicio: string
  hora_fin: string
  duracion?: number
}

interface PlanningBlock {
  quirofano: string
  turno: string
  especialidad: string
  utilizacion_porcentaje: number
  cronograma: PlanningCronogramaItem[]
}

interface PlanningDay {
  nombre: string
  bloques: PlanningBlock[]
}

interface PlanningOutput {
  fitness_total?: number
  duracion_segundos?: number
  resumen?: {
    pacientes_programados?: number
    pacientes_pendientes?: number
    ids_pendientes?: number[]
  }
  dias?: PlanningDay[]
}

interface PlanningResponse {
  id: string
  scheduler_uuid: string
  status: PlanningStatus
  input_payload: Record<string, unknown>
  output_payload: PlanningOutput | null
  error_message: string | null
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin programar'

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getCurrentWeekStart() {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

function getStatusLabel(status: PlanningStatus) {
  if (status === 'planning') return 'Planificando'
  if (status === 'completed') return 'Completada'
  return 'Fallida'
}

function getStatusClasses(status: PlanningStatus) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-blue-200 bg-blue-50 text-blue-700'
}

function getStatusIcon(status: PlanningStatus) {
  if (status === 'completed') return <CheckCircle size={16} />
  if (status === 'failed') return <XCircle size={16} />
  return <Activity size={16} className="animate-pulse" />
}

export default function MvpCirugiasPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth()
  const [cirugias, setCirugias] = useState<CirugiaReal[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planning, setPlanning] = useState<PlanningResponse | null>(null)
  const [planningError, setPlanningError] = useState<string | null>(null)
  const [isPlanningRequesting, setIsPlanningRequesting] = useState(false)

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

  useEffect(() => {
    if (!planning || planning.status !== 'planning') return

    let cancelled = false
    const schedulerUuid = planning.scheduler_uuid

    async function fetchPlanning() {
      try {
        const data = await apiRequest<PlanningResponse>(`/planificaciones/${schedulerUuid}`)
        if (!cancelled) {
          setPlanning(data)
          setPlanningError(null)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setPlanningError(
            fetchError instanceof Error ? fetchError.message : 'No se pudo consultar la planificación',
          )
        }
      }
    }

    const intervalId = window.setInterval(fetchPlanning, 3000)
    fetchPlanning()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [planning?.scheduler_uuid, planning?.status])

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

  const refreshPlanning = async () => {
    if (!planning) return
    setPlanningError(null)
    try {
      const data = await apiRequest<PlanningResponse>(`/planificaciones/${planning.scheduler_uuid}`)
      setPlanning(data)
    } catch (fetchError) {
      setPlanningError(fetchError instanceof Error ? fetchError.message : 'No se pudo consultar la planificación')
    }
  }

  const startPlanning = async () => {
    setIsPlanningRequesting(true)
    setPlanningError(null)
    try {
      const created = await apiRequest<PlanningCreateResponse>('/planificaciones', {
        method: 'POST',
        body: JSON.stringify({ week_start: getCurrentWeekStart() }),
      })
      setPlanning({
        id: created.id,
        scheduler_uuid: created.scheduler_uuid,
        status: created.status,
        input_payload: {},
        output_payload: null,
        error_message: null,
        duration_seconds: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (planningRequestError) {
      setPlanningError(
        planningRequestError instanceof Error
          ? planningRequestError.message
          : 'No se pudo iniciar la planificación',
      )
    } finally {
      setIsPlanningRequesting(false)
    }
  }

  const planningOutput = planning?.output_payload
  const planningDays = planningOutput?.dias ?? []
  const visibleBlocks = planningDays.flatMap((day) =>
    day.bloques
      .filter((block) => block.cronograma.length > 0)
      .map((block) => ({ day: day.nombre, ...block })),
  )

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage="lista-cirugias" navigationMode="mvp" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Cirugías</h1>
                <p className="text-muted-foreground mt-1">
                  MVP - Programacion de Agenda con IA. Datos reales desde PostgreSQL.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={startPlanning}
                  disabled={isPlanningRequesting || planning?.status === 'planning'}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <Sparkles size={16} />
                  {isPlanningRequesting || planning?.status === 'planning'
                    ? 'Planificando...'
                    : 'Generar planificación'}
                </button>
                <button
                  type="button"
                  onClick={refreshCirugias}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <RefreshCw size={16} />
                  Actualizar
                </button>
              </div>
            </div>

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Planificación IA</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    El resultado se guarda como JSON y queda pendiente de aprobación.
                  </p>
                </div>
                {planning ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${getStatusClasses(planning.status)}`}
                  >
                    {getStatusIcon(planning.status)}
                    {getStatusLabel(planning.status)}
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
                    Sin ejecución iniciada
                  </span>
                )}
              </div>

              {planning && (
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">UUID Scheduler</p>
                    <p className="mt-1 truncate font-mono text-xs text-slate-900">{planning.scheduler_uuid}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">Programadas</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {planningOutput?.resumen?.pacientes_programados ?? '-'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">Pendientes</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {planningOutput?.resumen?.pacientes_pendientes ?? '-'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">Duración</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {planning.duration_seconds ?? planningOutput?.duracion_segundos ?? '-'}s
                    </p>
                  </div>
                </div>
              )}

              {planningError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {planningError}
                </div>
              )}

              {planning?.status === 'failed' && planning.error_message && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {planning.error_message}
                </div>
              )}

              {planning?.status === 'planning' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-700">
                  <Clock size={16} className="animate-pulse" />
                  Consultando estado automáticamente cada 3 segundos...
                </div>
              )}

              {planning && planning.status !== 'planning' && (
                <button
                  type="button"
                  onClick={refreshPlanning}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <RefreshCw size={14} />
                  Actualizar planificación
                </button>
              )}

              {visibleBlocks.length > 0 && (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {visibleBlocks.map((block, index) => (
                    <div key={`${block.day}-${block.quirofano}-${block.turno}-${index}`} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {block.day} · {block.turno}
                          </p>
                          <p className="text-sm text-slate-600">
                            {block.quirofano} · {block.especialidad}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {block.utilizacion_porcentaje}% uso
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {block.cronograma.map((item) => (
                          <div key={`${block.day}-${block.quirofano}-${item.paciente_id}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-900">Paciente #{item.paciente_id}</span>
                              <span className="text-slate-600">
                                {item.hora_inicio} - {item.hora_fin}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{item.medico}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

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
