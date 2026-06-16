'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const CREATE_PLANNING_PERMISSION = 'plannings.can_create_planning'
const APPROVE_PLANNING_PERMISSION = 'plannings.can_approve_planning'

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

type PlanningStatus = 'planning' | 'pending_approval' | 'failed' | 'approved' | 'rejected'
type SurgerySortKey = 'inicio_asc' | 'inicio_desc' | 'paciente_asc' | 'prioridad_pendientes'

interface PlanningCreateResponse {
  id: string
  scheduler_uuid: string
  status: PlanningStatus
}

interface SchedulerSurgeryPayload {
  id: number
  source_id?: string
  specialty_id: number
  procedure_id: number
  estimated_duration: number
  clinical_priority: number
}

interface PlanningInputPayload {
  week_start?: string
  pending_surgeries?: SchedulerSurgeryPayload[]
  id_maps?: {
    surgeries?: Record<string, number>
  }
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
  input_payload: PlanningInputPayload
  output_payload: PlanningOutput | null
  error_message: string | null
  progress_percentage: number
  duration_seconds: number | null
  approved_at: string | null
  approved_by: string | null
  rejected_at: string | null
  rejected_by: string | null
  rejection_reason: string | null
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
  if (status === 'pending_approval') return 'Pendiente de aprobación'
  if (status === 'approved') return 'Aprobada'
  if (status === 'rejected') return 'Rechazada'
  return 'Fallida'
}

function getStatusClasses(status: PlanningStatus) {
  if (status === 'approved') return 'border-purple-200 bg-purple-50 text-purple-700'
  if (status === 'pending_approval') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (status === 'rejected') return 'border-slate-200 bg-slate-50 text-slate-700'
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-blue-200 bg-blue-50 text-blue-700'
}

function getStatusIcon(status: PlanningStatus) {
  if (status === 'approved') return <CheckCircle size={16} />
  if (status === 'pending_approval') return <Clock size={16} />
  if (status === 'failed') return <XCircle size={16} />
  if (status === 'rejected') return <XCircle size={16} />
  return <Activity size={16} className="animate-pulse" />
}

function reverseMap(map?: Record<string, number>) {
  return Object.fromEntries(Object.entries(map ?? {}).map(([key, value]) => [value, key])) as Record<number, string>
}

function sortCirugias(cirugias: CirugiaReal[], sortKey: SurgerySortKey) {
  return [...cirugias].sort((left, right) => {
    if (sortKey === 'paciente_asc') {
      return left.paciente.localeCompare(right.paciente, 'es')
    }

    if (sortKey === 'inicio_desc') {
      const leftTime = left.inicio ? new Date(left.inicio).getTime() : 0
      const rightTime = right.inicio ? new Date(right.inicio).getTime() : 0
      return rightTime - leftTime
    }

    if (sortKey === 'prioridad_pendientes') {
      const leftPending = left.estado === 'Pendiente' ? 0 : 1
      const rightPending = right.estado === 'Pendiente' ? 0 : 1
      if (leftPending !== rightPending) return leftPending - rightPending
      return left.paciente.localeCompare(right.paciente, 'es')
    }

    const leftTime = left.inicio ? new Date(left.inicio).getTime() : Number.POSITIVE_INFINITY
    const rightTime = right.inicio ? new Date(right.inicio).getTime() : Number.POSITIVE_INFINITY
    return leftTime - rightTime
  })
}


export default function MvpCirugiasPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange, user } = useAuth()
  const [cirugias, setCirugias] = useState<CirugiaReal[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planning, setPlanning] = useState<PlanningResponse | null>(null)
  const [planningError, setPlanningError] = useState<string | null>(null)
  const [isPlanningRequesting, setIsPlanningRequesting] = useState(false)
  const [isDeletingPlanning, setIsDeletingPlanning] = useState(false)
  const [isApprovingPlanning, setIsApprovingPlanning] = useState(false)
  const [isRejectingPlanning, setIsRejectingPlanning] = useState(false)
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showPendingOutside, setShowPendingOutside] = useState(false)
  const [statusFilter, setStatusFilter] = useState('Pendiente')
  const [specialtyFilter, setSpecialtyFilter] = useState('Todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SurgerySortKey>('prioridad_pendientes')

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (requiresPasswordChange) {
        router.push('/cambiar-password')
      }
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router])

  const refreshCirugias = async () => {
    setIsFetching(true)
    setError(null)
    try {
      const data = await apiRequest<CirugiaReal[]>('/surgeries/')
      setCirugias(data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar las cirugías')
    } finally {
      setIsFetching(false)
    }
  }

  const fetchActivePlanning = async () => {
    setPlanningError(null)
    try {
      const data = await apiRequest<PlanningResponse>('/plannings/active/')
      setPlanning(data)
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.message === 'Planning not found') {
        setPlanning(null)
        return
      }
      setPlanningError(fetchError instanceof Error ? fetchError.message : 'No se pudo consultar la planificación activa')
    }
  }

  useEffect(() => {
    if (!isAuthenticated || requiresPasswordChange) return
    refreshCirugias()
    fetchActivePlanning()
  }, [isAuthenticated, requiresPasswordChange])

  useEffect(() => {
    if (!planning || planning.status !== 'planning') return

    let cancelled = false
    const schedulerUuid = planning.scheduler_uuid

    async function fetchPlanning() {
      try {
        const data = await apiRequest<PlanningResponse>(`/plannings/${schedulerUuid}/`)
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

    const intervalId = window.setInterval(fetchPlanning, 2500)
    fetchPlanning()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [planning?.scheduler_uuid, planning?.status])

  const refreshPlanning = async () => {
    if (!planning) return
    setPlanningError(null)
    try {
      const data = await apiRequest<PlanningResponse>(`/plannings/${planning.scheduler_uuid}/`)
      setPlanning(data)
    } catch (fetchError) {
      setPlanningError(fetchError instanceof Error ? fetchError.message : 'No se pudo consultar la planificación')
    }
  }

  const startPlanning = async () => {
    setIsPlanningRequesting(true)
    setPlanningError(null)
    try {
      const created = await apiRequest<PlanningCreateResponse>('/plannings/', {
        method: 'POST',
        body: JSON.stringify({ week_start: getCurrentWeekStart() }),
      })
      const data = await apiRequest<PlanningResponse>(`/plannings/${created.scheduler_uuid}/`)
      setPlanning(data)
      setIsPlanningModalOpen(true)
      setShowRejectReason(false)
      setRejectionReason('')
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

  const deletePlanning = async () => {
    if (!planning) return
    setIsDeletingPlanning(true)
    setPlanningError(null)
    try {
      await apiRequest<void>(`/plannings/${planning.scheduler_uuid}/`, { method: 'DELETE' })
      setPlanning(null)
    } catch (deleteError) {
      setPlanningError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la planificación')
    } finally {
      setIsDeletingPlanning(false)
    }
  }

  const approvePlanning = async () => {
    if (!planning) return
    setIsApprovingPlanning(true)
    setPlanningError(null)
    try {
      const data = await apiRequest<PlanningResponse>(`/plannings/${planning.scheduler_uuid}/approve/`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setPlanning(data)
      await refreshCirugias()
    } catch (approvalError) {
      setPlanningError(approvalError instanceof Error ? approvalError.message : 'No se pudo aprobar la planificación')
    } finally {
      setIsApprovingPlanning(false)
    }
  }

  const rejectPlanning = async () => {
    if (!planning) return
    if (!rejectionReason.trim()) {
      setPlanningError('Ingresá un motivo para rechazar la planificación')
      setShowRejectReason(true)
      return
    }
    setIsRejectingPlanning(true)
    setPlanningError(null)
    try {
      const data = await apiRequest<PlanningResponse>(`/plannings/${planning.scheduler_uuid}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      })
      setPlanning(data)
      setShowRejectReason(false)
    } catch (rejectError) {
      setPlanningError(rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar la planificación')
    } finally {
      setIsRejectingPlanning(false)
    }
  }

  const planningOutput = planning?.output_payload
  const planningDays = planningOutput?.dias ?? []
  const surgeryIdBySchedulerId = useMemo(
    () => reverseMap(planning?.input_payload?.id_maps?.surgeries),
    [planning?.input_payload?.id_maps?.surgeries],
  )
  const cirugiasById = useMemo(
    () => Object.fromEntries(cirugias.map((cirugia) => [cirugia.id, cirugia])),
    [cirugias],
  )
  const pendingScheduledIds = planningOutput?.resumen?.ids_pendientes ?? []
  const pendingSurgeries = pendingScheduledIds
    .map((schedulerId) => cirugiasById[surgeryIdBySchedulerId[schedulerId]])
    .filter(Boolean)
  const progress = Math.max(0, Math.min(100, planning?.progress_percentage ?? 0))
  const pendingCirugiasCount = cirugias.filter((cirugia) => cirugia.estado === 'Pendiente').length
  const statusOptions = useMemo(
    () => ['Todos', ...Array.from(new Set(cirugias.map((cirugia) => cirugia.estado))).sort((a, b) => a.localeCompare(b, 'es'))],
    [cirugias],
  )
  const specialtyOptions = useMemo(
    () => ['Todas', ...Array.from(new Set(cirugias.map((cirugia) => cirugia.especialidad))).sort((a, b) => a.localeCompare(b, 'es'))],
    [cirugias],
  )
  const filteredCirugias = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const filtered = cirugias.filter((cirugia) => {
      const matchesStatus = statusFilter === 'Todos' || cirugia.estado === statusFilter
      const matchesSpecialty = specialtyFilter === 'Todas' || cirugia.especialidad === specialtyFilter
      const matchesSearch =
        !normalizedSearch ||
        cirugia.paciente.toLowerCase().includes(normalizedSearch) ||
        cirugia.dni.toLowerCase().includes(normalizedSearch) ||
        cirugia.intervenciones.some((intervencion) => intervencion.toLowerCase().includes(normalizedSearch))
      return matchesStatus && matchesSpecialty && matchesSearch
    })
    return sortCirugias(filtered, sortKey)
  }, [cirugias, searchTerm, sortKey, specialtyFilter, statusFilter])
  const userPermissions = user?.permissions ?? []
  const canCreatePlanning = userPermissions.includes(CREATE_PLANNING_PERMISSION)
  const canApprovePlanning = userPermissions.includes(APPROVE_PLANNING_PERMISSION)
  const canReviewPlanning = canApprovePlanning && planning?.status === 'pending_approval'
  const canDeletePlanning = canCreatePlanning
  const canStartPlanning = canCreatePlanning && planning?.status !== 'planning' && planning?.status !== 'pending_approval'
  const modalTitle = canReviewPlanning ? 'Revisar planificación semanal' : 'Generar planificación semanal'
  const shouldShowPendingApprovalSnack = canReviewPlanning && !isPlanningModalOpen

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

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
                {canCreatePlanning && (
                  <button
                    type="button"
                    onClick={() => setIsPlanningModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Sparkles size={16} />
                    {planning ? 'Ver planificación' : 'Generar planificación'}
                  </button>
                )}
                {canReviewPlanning && (
                  <button
                    type="button"
                    onClick={() => setIsPlanningModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                  >
                    <Eye size={16} />
                    Ver planificación
                  </button>
                )}
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

            <Dialog open={isPlanningModalOpen} onOpenChange={setIsPlanningModalOpen}>
              <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[min(1380px,calc(100vw-2rem))]">
                <DialogHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                    <div>
                      <DialogTitle>{modalTitle}</DialogTitle>
                      <DialogDescription>
                        {canReviewPlanning
                          ? 'Revisá la propuesta generada por IA antes de confirmar la agenda.'
                          : `${pendingCirugiasCount} cirugías pendientes para planificar esta semana.`}
                      </DialogDescription>
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
                </DialogHeader>

                {!planning && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase text-slate-500">Pendientes</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{pendingCirugiasCount}</p>
                      </div>
                      <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                        <p className="text-sm font-medium text-slate-900">Planificación semanal</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Generá una propuesta automática para organizar quirófanos, turnos y equipos disponibles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {planning?.status === 'planning' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">Progreso</span>
                      <span className="font-semibold text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {planning?.status === 'pending_approval' && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <Clock size={16} />
                    Esta planificación está pendiente de aprobación del cirujano.
                  </div>
                )}

                {planningError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {planningError}
                  </div>
                )}

                {planning?.status === 'rejected' && planning.rejection_reason && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="font-medium">Motivo del rechazo:</span> {planning.rejection_reason}
                  </div>
                )}

                {planning?.status === 'failed' && planning.error_message && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {planning.error_message}
                  </div>
                )}

                {planning?.status === 'planning' && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <Clock size={16} className="animate-pulse" />
                    Calculando propuesta semanal...
                  </div>
                )}

                {planningDays.length > 0 && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <div className="grid min-w-[1180px] grid-cols-5 divide-x divide-slate-200">
                        {planningDays.map((day) => (
                          <div key={day.nombre} className="bg-white">
                            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-sm font-semibold text-slate-900">{day.nombre}</p>
                            </div>
                            <div className="space-y-3 p-3">
                              {day.bloques
                                .filter((block) => block.cronograma.length > 0)
                                .map((block, blockIndex) => (
                                  <div key={`${day.nombre}-${block.quirofano}-${block.turno}-${blockIndex}`} className="rounded-lg border border-slate-200 p-3">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{block.turno}</p>
                                        <p className="text-xs text-slate-600">{block.quirofano}</p>
                                        <p className="text-xs text-slate-500">{block.especialidad}</p>
                                      </div>
                                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                                        {block.utilizacion_porcentaje}%
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      {block.cronograma.map((item) => {
                                        const cirugia = cirugiasById[surgeryIdBySchedulerId[item.paciente_id]]
                                        return (
                                          <div key={`${block.quirofano}-${item.paciente_id}`} className="rounded-md bg-slate-50 px-2 py-2 text-xs">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="font-semibold text-slate-900">
                                                {item.hora_inicio} - {item.hora_fin}
                                              </span>
                                              <span className="text-slate-500">{item.duracion ?? '-'} min</span>
                                            </div>
                                            <p className="mt-1 font-medium text-slate-900">
                                              {cirugia?.paciente ?? `Cirugía #${item.paciente_id}`}
                                            </p>
                                            <p className="text-slate-600">{item.medico}</p>
                                            <p className="text-slate-500">{cirugia?.intervenciones.join(', ') ?? block.especialidad}</p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              {day.bloques.every((block) => block.cronograma.length === 0) && (
                                <p className="py-6 text-center text-xs text-slate-400">Sin cirugías asignadas</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <button
                        type="button"
                        onClick={() => setShowPendingOutside((value) => !value)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <h3 className="font-semibold text-amber-950">{pendingSurgeries.length} quedan afuera</h3>
                          <p className="mt-1 text-xs text-amber-700">
                            Tocá para {showPendingOutside ? 'ocultar' : 'ver'} las cirugías no incluidas en esta propuesta.
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
                          {showPendingOutside ? 'Ocultar' : 'Ver detalle'}
                        </span>
                      </button>
                      {showPendingOutside && (
                        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {pendingSurgeries.length > 0 ? pendingSurgeries.map((cirugia) => (
                            <div key={cirugia.id} className="rounded-md bg-white px-3 py-2 text-sm shadow-sm">
                              <p className="font-medium text-slate-900">{cirugia.paciente}</p>
                              <p className="text-xs text-slate-600">{cirugia.especialidad}</p>
                              <p className="text-xs text-slate-500">{cirugia.intervenciones.join(', ')}</p>
                            </div>
                          )) : (
                            <p className="rounded-md bg-white px-3 py-4 text-center text-sm text-slate-500 shadow-sm">
                              Todas las cirugías pendientes entran en la propuesta.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter className="items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {planning && canDeletePlanning && (
                      <button
                        type="button"
                        onClick={deletePlanning}
                        disabled={isDeletingPlanning || planning.status === 'planning' || planning.status === 'pending_approval'}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                      >
                        <Trash2 size={14} />
                        {isDeletingPlanning ? 'Eliminando...' : 'Eliminar planificación'}
                      </button>
                    )}
                    {planning && planning.status !== 'planning' && (
                      <button
                        type="button"
                        onClick={refreshPlanning}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <RefreshCw size={14} />
                        Actualizar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {canReviewPlanning && (
                      <>
                        <div className="flex w-full flex-col gap-2 sm:w-auto">
                          {showRejectReason && (
                            <textarea
                              value={rejectionReason}
                              onChange={(event) => setRejectionReason(event.target.value)}
                              placeholder="Motivo del rechazo"
                              rows={3}
                              className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-amber-500 sm:w-80"
                            />
                          )}
                          <button
                            type="button"
                            onClick={showRejectReason ? rejectPlanning : () => setShowRejectReason(true)}
                            disabled={isRejectingPlanning}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                          >
                            <XCircle size={14} />
                            {isRejectingPlanning ? 'Rechazando...' : showRejectReason ? 'Confirmar rechazo' : 'Rechazar'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={approvePlanning}
                          disabled={isApprovingPlanning}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                        >
                          <CheckCircle size={14} />
                          {isApprovingPlanning ? 'Aprobando...' : 'Aprobar planificación'}
                        </button>
                      </>
                    )}
                    {canCreatePlanning && (
                      <button
                        type="button"
                        onClick={startPlanning}
                        disabled={isPlanningRequesting || !canStartPlanning}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        <Sparkles size={16} />
                        {isPlanningRequesting || planning?.status === 'planning'
                          ? 'Planificando...'
                          : 'Generar planificación semanal'}
                      </button>
                    )}
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-white p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-64 flex-1 text-sm font-medium text-slate-700">
                    Buscar
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <Search size={16} className="text-slate-400" />
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Paciente, DNI o intervención"
                        className="w-full bg-transparent text-sm font-normal text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Estado
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="mt-1 block min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Especialidad
                    <select
                      value={specialtyFilter}
                      onChange={(event) => setSpecialtyFilter(event.target.value)}
                      className="mt-1 block min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-blue-500"
                    >
                      {specialtyOptions.map((specialty) => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Ordenar
                    <select
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value as SurgerySortKey)}
                      className="mt-1 block min-w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-blue-500"
                    >
                      <option value="prioridad_pendientes">Pendientes primero</option>
                      <option value="inicio_asc">Inicio más próximo</option>
                      <option value="inicio_desc">Inicio más reciente</option>
                      <option value="paciente_asc">Paciente A-Z</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('Pendiente')
                      setSpecialtyFilter('Todas')
                      setSearchTerm('')
                      setSortKey('prioridad_pendientes')
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Filter size={16} />
                    Pendientes
                  </button>
                </div>
                <div className="mt-3 text-sm text-slate-500">
                  Mostrando <span className="font-medium text-slate-900">{filteredCirugias.length}</span> de <span className="font-medium text-slate-900">{cirugias.length}</span> cirugías.
                </div>
              </div>
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
              ) : filteredCirugias.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <Search size={44} className="mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900">No hay resultados</h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Probá cambiar el estado, la especialidad o el texto de búsqueda.
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
                      {filteredCirugias.map((cirugia) => (
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
      {shouldShowPendingApprovalSnack && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-lg border border-amber-200 bg-white p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <Clock size={20} className="mt-0.5 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Hay una planificación pendiente de aprobación</p>
              <p className="mt-1 text-sm text-slate-600">Abrí la propuesta para aprobarla o rechazarla con motivo.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPlanningModalOpen(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Eye size={14} />
            Ver planificación
          </button>
        </div>
      )}
    </div>
  )
}
