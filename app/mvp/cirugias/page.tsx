'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  CalendarDays,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import SurgeryStatusBadge from '@/components/surgery-status-badge'
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
  edad: number | null
  obra_social: string | null
  especialidadId: string
  especialidad: string
  salaId: string | null
  sala: string | null
  anestesiaId: string | null
  anestesia: string | null
  byer: boolean
  sedacion: boolean
  estado: string
  intervencionIds: string[]
  intervenciones: string[]
  insumos: { nombre: string; cantidad: number }[]
  observaciones: string | null
  duracion_estimada_minutos: number
  prioridad_clinica: number
  cirujanoForzadoId: string | null
  cirujanoForzado: { id: string; nombre: string; rol: string } | null
  created_at: string
  updated_at: string
}

type PlanningStatus = 'planning' | 'pending_approval' | 'failed' | 'approved' | 'rejected'
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

interface SurgeryCatalogs {
  specialties: { id: string; nombre: string }[]
  interventions: { id: string; nombre: string; especialidadId: string }[]
  anesthesia_types: { id: string; nombre: string }[]
  surgeons: { id: string; nombre: string; rol: string }[]
}

interface PlanningPreflight {
  pending_count: number
  valid_count: number
  can_plan: boolean
  blocking_reasons: string[]
  invalid_surgeries: { id: string; paciente: string; dni: string; reasons: string[] }[]
  resources: {
    available_operating_rooms_count: number
    available_surgeons_count: number
  }
}

interface SurgeryFormState {
  dni: string
  paciente: string
  edad: string
  obra_social: string
  intervention_id: string
  tipo_anestesia_id: string
  cirujano_forzado_id: string
  duracion_estimada_minutos: string
  prioridad_clinica: string
  byer: boolean
  sedacion: boolean
  observaciones: string
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

const emptySurgeryForm: SurgeryFormState = {
  dni: '',
  paciente: '',
  edad: '',
  obra_social: '',
  intervention_id: '',
  tipo_anestesia_id: '',
  cirujano_forzado_id: '',
  duracion_estimada_minutos: '90',
  prioridad_clinica: '1',
  byer: false,
  sedacion: false,
  observaciones: '',
}

function formFromSurgery(cirugia: CirugiaReal): SurgeryFormState {
  return {
    dni: cirugia.dni,
    paciente: cirugia.paciente,
    edad: cirugia.edad?.toString() ?? '',
    obra_social: cirugia.obra_social ?? '',
    intervention_id: cirugia.intervencionIds[0] ?? '',
    tipo_anestesia_id: cirugia.anestesiaId ?? '',
    cirujano_forzado_id: cirugia.cirujanoForzadoId ?? '',
    duracion_estimada_minutos: cirugia.duracion_estimada_minutos.toString(),
    prioridad_clinica: cirugia.prioridad_clinica.toString(),
    byer: cirugia.byer,
    sedacion: cirugia.sedacion,
    observaciones: cirugia.observaciones ?? '',
  }
}

function buildSurgeryPayload(form: SurgeryFormState) {
  return {
    patient: {
      dni: form.dni.trim(),
      nombre: form.paciente.trim(),
      edad: form.edad.trim() ? Number(form.edad) : null,
      obra_social: form.obra_social.trim() || null,
    },
    intervention_ids: [form.intervention_id],
    tipo_anestesia_id: form.tipo_anestesia_id || null,
    cirujano_forzado_id: form.cirujano_forzado_id || null,
    duracion_estimada_minutos: Number(form.duracion_estimada_minutos),
    prioridad_clinica: Number(form.prioridad_clinica),
    byer: form.byer,
    sedacion: form.sedacion,
    observaciones: form.observaciones.trim() || null,
  }
}


export default function MvpCirugiasPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange, user } = useAuth()
  const [cirugias, setCirugias] = useState<CirugiaReal[]>([])
  const [catalogs, setCatalogs] = useState<SurgeryCatalogs | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planning, setPlanning] = useState<PlanningResponse | null>(null)
  const [preflight, setPreflight] = useState<PlanningPreflight | null>(null)
  const [planningError, setPlanningError] = useState<string | null>(null)
  const [surgeryError, setSurgeryError] = useState<string | null>(null)
  const [isPlanningRequesting, setIsPlanningRequesting] = useState(false)
  const [isDeletingPlanning, setIsDeletingPlanning] = useState(false)
  const [isApprovingPlanning, setIsApprovingPlanning] = useState(false)
  const [isRejectingPlanning, setIsRejectingPlanning] = useState(false)
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false)
  const [isSurgeryModalOpen, setIsSurgeryModalOpen] = useState(false)
  const [isSavingSurgery, setIsSavingSurgery] = useState(false)
  const [selectedSurgery, setSelectedSurgery] = useState<CirugiaReal | null>(null)
  const [editingSurgery, setEditingSurgery] = useState<CirugiaReal | null>(null)
  const [surgeryForm, setSurgeryForm] = useState<SurgeryFormState>(emptySurgeryForm)
  const [cancelSurgery, setCancelSurgery] = useState<CirugiaReal | null>(null)
  const [isCancellingSurgery, setIsCancellingSurgery] = useState(false)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showPendingOutside, setShowPendingOutside] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    estado: '',
    quirofano: '',
    fechaDesde: '',
    fechaHasta: '',
    dniPaciente: '',
    cirujano: '',
  })
  const userPermissions = user?.permissions ?? []
  const canCreatePlanning = userPermissions.includes(CREATE_PLANNING_PERMISSION)
  const canApprovePlanning = userPermissions.includes(APPROVE_PLANNING_PERMISSION)

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

  const fetchCatalogs = async () => {
    try {
      const data = await apiRequest<SurgeryCatalogs>('/surgery-catalogs/')
      setCatalogs(data)
      setSurgeryForm((current) => ({
        ...current,
        intervention_id: current.intervention_id || data.interventions[0]?.id || '',
        tipo_anestesia_id: current.tipo_anestesia_id || data.anesthesia_types[0]?.id || '',
        cirujano_forzado_id: current.cirujano_forzado_id || data.surgeons[0]?.id || '',
      }))
    } catch (fetchError) {
      setSurgeryError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar los catálogos')
    }
  }

  const refreshPreflight = async () => {
    if (!canCreatePlanning) return
    try {
      const data = await apiRequest<PlanningPreflight>('/plannings/preflight/')
      setPreflight(data)
    } catch (fetchError) {
      setPlanningError(fetchError instanceof Error ? fetchError.message : 'No se pudieron validar los datos para planificar')
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
    fetchCatalogs()
    fetchActivePlanning()
  }, [isAuthenticated, requiresPasswordChange])

  useEffect(() => {
    if (!isPlanningModalOpen || !canCreatePlanning) return
    refreshPreflight()
  }, [isPlanningModalOpen, canCreatePlanning])

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
      const latestPreflight = await apiRequest<PlanningPreflight>('/plannings/preflight/')
      setPreflight(latestPreflight)
      if (!latestPreflight.can_plan) {
        setPlanningError('Corregí las validaciones pendientes antes de generar la planificación')
        return
      }
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

  const openCreateSurgery = () => {
    setEditingSurgery(null)
    setSurgeryError(null)
    setSurgeryForm({
      ...emptySurgeryForm,
      intervention_id: catalogs?.interventions[0]?.id ?? '',
      tipo_anestesia_id: catalogs?.anesthesia_types[0]?.id ?? '',
      cirujano_forzado_id: catalogs?.surgeons[0]?.id ?? '',
    })
    setIsSurgeryModalOpen(true)
  }

  const openEditSurgery = (cirugia: CirugiaReal) => {
    setEditingSurgery(cirugia)
    setSurgeryError(null)
    setSurgeryForm(formFromSurgery(cirugia))
    setIsSurgeryModalOpen(true)
  }

  const saveSurgery = async () => {
    setIsSavingSurgery(true)
    setSurgeryError(null)
    try {
      const payload = buildSurgeryPayload(surgeryForm)
      const path = editingSurgery ? `/surgeries/${editingSurgery.id}/` : '/surgeries/'
      const method = editingSurgery ? 'PATCH' : 'POST'
      await apiRequest<CirugiaReal>(path, {
        method,
        body: JSON.stringify(payload),
      })
      setIsSurgeryModalOpen(false)
      setEditingSurgery(null)
      await refreshCirugias()
      if (isPlanningModalOpen) await refreshPreflight()
    } catch (saveError) {
      setSurgeryError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la cirugía')
    } finally {
      setIsSavingSurgery(false)
    }
  }

  const confirmCancelSurgery = async () => {
    if (!cancelSurgery) return
    setIsCancellingSurgery(true)
    setSurgeryError(null)
    try {
      await apiRequest<CirugiaReal>(`/surgeries/${cancelSurgery.id}/cancel/`, { method: 'POST' })
      setCancelSurgery(null)
      await refreshCirugias()
      if (isPlanningModalOpen) await refreshPreflight()
    } catch (cancelError) {
      setSurgeryError(cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar la cirugía')
    } finally {
      setIsCancellingSurgery(false)
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
  const scheduledPlanningItems = planningDays.flatMap((day) =>
    day.bloques.flatMap((block) =>
      block.cronograma.map((item) => ({
        day: day.nombre,
        block,
        item,
        cirugia: cirugiasById[surgeryIdBySchedulerId[item.paciente_id]],
      })),
    ),
  )
  const utilizedPlanningBlocks = planningDays.flatMap((day) => day.bloques).filter((block) => block.cronograma.length > 0)
  const averagePlanningUtilization =
    utilizedPlanningBlocks.length > 0
      ? Math.round(utilizedPlanningBlocks.reduce((total, block) => total + block.utilizacion_porcentaje, 0) / utilizedPlanningBlocks.length)
      : 0
  const progress = Math.max(0, Math.min(100, planning?.progress_percentage ?? 0))
  const pendingCirugiasCount = cirugias.filter((cirugia) => cirugia.estado === 'Pendiente').length
  const operatingRoomOptions = useMemo(() => Array.from(
    new Map(
      cirugias
        .filter((cirugia) => cirugia.salaId && cirugia.sala)
        .map((cirugia) => [cirugia.salaId as string, cirugia.sala as string]),
    ),
    ([id, nombre]) => ({ id, nombre }),
  ), [cirugias])
  const filteredCirugias = useMemo(() => {
    return cirugias.filter((cirugia) => {
      const surgeryDate = cirugia.inicio?.slice(0, 10) ?? ''
      if (filters.estado && cirugia.estado !== filters.estado) return false
      if (filters.quirofano && cirugia.salaId !== filters.quirofano) return false
      if (filters.fechaDesde && (!surgeryDate || surgeryDate < filters.fechaDesde)) return false
      if (filters.fechaHasta && (!surgeryDate || surgeryDate > filters.fechaHasta)) return false
      if (filters.dniPaciente && !cirugia.dni.includes(filters.dniPaciente)) return false
      if (filters.cirujano && cirugia.cirujanoForzadoId !== filters.cirujano) return false
      return true
    })
  }, [cirugias, filters])
  const activeFiltersCount = Object.values(filters).filter(Boolean).length
  const clearFilters = () => setFilters({
    estado: '',
    quirofano: '',
    fechaDesde: '',
    fechaHasta: '',
    dniPaciente: '',
    cirujano: '',
  })
  const canReviewPlanning = canApprovePlanning && planning?.status === 'pending_approval'
  const canDeletePlanning = canCreatePlanning
  const canStartPlanning =
    canCreatePlanning &&
    planning?.status !== 'planning' &&
    planning?.status !== 'pending_approval' &&
    preflight?.can_plan !== false
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
                    onClick={openCreateSurgery}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    <Plus size={16} />
                    Nueva cirugía
                  </button>
                )}
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

                {!planning && canCreatePlanning && preflight && (
                  <div className={`rounded-xl border p-4 ${preflight.can_plan ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className={preflight.can_plan ? 'font-semibold text-emerald-950' : 'font-semibold text-red-950'}>
                          Validación previa
                        </h3>
                        <p className={preflight.can_plan ? 'mt-1 text-sm text-emerald-700' : 'mt-1 text-sm text-red-700'}>
                          {preflight.valid_count} de {preflight.pending_count} cirugías pendientes están listas para planificar.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="rounded-md bg-white px-3 py-2 text-slate-700 shadow-sm">
                          {preflight.resources.available_operating_rooms_count} quirófanos
                        </span>
                        <span className="rounded-md bg-white px-3 py-2 text-slate-700 shadow-sm">
                          {preflight.resources.available_surgeons_count} cirujanos
                        </span>
                      </div>
                    </div>
                    {preflight.blocking_reasons.length > 0 && (
                      <ul className="mt-3 space-y-1 text-sm text-red-800">
                        {preflight.blocking_reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    )}
                    {preflight.invalid_surgeries.length > 0 && (
                      <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-white p-3 text-sm shadow-sm">
                        {preflight.invalid_surgeries.map((item) => (
                          <div key={item.id} className="border-b border-slate-100 py-2 last:border-0">
                            <p className="font-medium text-slate-900">{item.paciente} · DNI {item.dni}</p>
                            <p className="text-xs text-slate-600">{item.reasons.join(' · ')}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase text-slate-500">Programadas</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                          {planningOutput?.resumen?.pacientes_programados ?? scheduledPlanningItems.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase text-slate-500">Quedan afuera</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                          {planningOutput?.resumen?.pacientes_pendientes ?? pendingSurgeries.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase text-slate-500">Utilización prom.</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{averagePlanningUtilization}%</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase text-slate-500">Ejecución</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                          {planning?.duration_seconds ?? planningOutput?.duracion_segundos ?? '-'}s
                        </p>
                      </div>
                    </div>
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

            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters((current) => !current)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                <ListFilter size={18} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
              <div className="ml-auto flex gap-2">
                {['Pendiente', 'Programada', 'En Curso', 'Completada', 'Cancelada'].map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setFilters((current) => ({
                      ...current,
                      estado: current.estado === status ? '' : status,
                    }))}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.estado === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {showFilters && (
              <div className="mb-4 rounded-lg border border-border bg-card p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <label className="text-xs font-medium text-muted-foreground">
                    Estado
                    <select
                      value={filters.estado}
                      onChange={(event) => setFilters((current) => ({ ...current, estado: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {['Pendiente', 'Programada', 'En Curso', 'Completada', 'Cancelada'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">
                    Quirófano
                    <select
                      value={filters.quirofano}
                      onChange={(event) => setFilters((current) => ({ ...current, quirofano: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {operatingRoomOptions.map((room) => (
                        <option key={room.id} value={room.id}>{room.nombre}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">
                    Fecha desde
                    <input
                      type="date"
                      value={filters.fechaDesde}
                      onChange={(event) => setFilters((current) => ({ ...current, fechaDesde: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">
                    Fecha hasta
                    <input
                      type="date"
                      value={filters.fechaHasta}
                      onChange={(event) => setFilters((current) => ({ ...current, fechaHasta: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">
                    DNI Paciente
                    <div className="relative mt-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        type="text"
                        value={filters.dniPaciente}
                        onChange={(event) => setFilters((current) => ({ ...current, dniPaciente: event.target.value }))}
                        placeholder="Buscar DNI..."
                        className="w-full rounded-lg border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">
                    Cirujano
                    <select
                      value={filters.cirujano}
                      onChange={(event) => setFilters((current) => ({ ...current, cirujano: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {(catalogs?.surgeons ?? []).map((surgeon) => (
                        <option key={surgeon.id} value={surgeon.id}>{surgeon.nombre}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-white p-4 text-sm text-slate-500">
                Mostrando <span className="font-medium text-slate-900">{filteredCirugias.length}</span> de{' '}
                <span className="font-medium text-slate-900">{cirugias.length}</span> cirugías.
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
                        <th className="px-4 py-3">Acciones</th>
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
                            <SurgeryStatusBadge status={cirugia.estado} />
                          </td>
                          <td className="px-4 py-4 text-foreground">
                            {[
                              cirugia.byer ? 'Byer' : null,
                              cirugia.sedacion ? 'Sedación' : null,
                            ].filter(Boolean).join(' · ') || 'Sin opciones'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSurgery(cirugia)}
                                aria-label="Ver cirugía"
                                title="Ver cirugía"
                                className="inline-flex rounded-md border border-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <Eye size={15} />
                              </button>
                              {canCreatePlanning && cirugia.estado === 'Pendiente' && (
                                <button
                                  type="button"
                                  onClick={() => openEditSurgery(cirugia)}
                                  aria-label="Editar cirugía"
                                  title="Editar cirugía"
                                  className="inline-flex rounded-md border border-blue-200 p-2 text-blue-700 transition-colors hover:bg-blue-50"
                                >
                                  <Edit3 size={15} />
                                </button>
                              )}
                              {canCreatePlanning && ['Pendiente', 'Programada'].includes(cirugia.estado) && (
                                <button
                                  type="button"
                                  onClick={() => setCancelSurgery(cirugia)}
                                  aria-label="Cancelar cirugía"
                                  title="Cancelar cirugía"
                                  className="inline-flex rounded-md border border-red-200 p-2 text-red-700 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
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
      <Dialog open={isSurgeryModalOpen} onOpenChange={setIsSurgeryModalOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingSurgery ? 'Editar cirugía' : 'Nueva cirugía'}</DialogTitle>
            <DialogDescription>
              {editingSurgery
                ? 'Actualizá los datos operativos. La fecha, hora y sala dependen de la planificación.'
                : 'Registrá una solicitud quirúrgica pendiente de asignación.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              DNI
              <input
                value={surgeryForm.dni}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, dni: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Paciente
              <input
                value={surgeryForm.paciente}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, paciente: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Edad
              <input
                type="number"
                min="0"
                value={surgeryForm.edad}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, edad: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Obra social
              <input
                value={surgeryForm.obra_social}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, obra_social: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Intervención
              <select
                value={surgeryForm.intervention_id}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, intervention_id: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              >
                {(catalogs?.interventions ?? []).map((intervention) => {
                  const specialty = catalogs?.specialties.find((item) => item.id === intervention.especialidadId)
                  return (
                    <option key={intervention.id} value={intervention.id}>
                      {intervention.nombre}{specialty ? ` · ${specialty.nombre}` : ''}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Anestesia
              <select
                value={surgeryForm.tipo_anestesia_id}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, tipo_anestesia_id: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              >
                <option value="">Sin definir</option>
                {(catalogs?.anesthesia_types ?? []).map((anesthesia) => (
                  <option key={anesthesia.id} value={anesthesia.id}>{anesthesia.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Cirujano
              <select
                value={surgeryForm.cirujano_forzado_id}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, cirujano_forzado_id: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              >
                <option value="">Sin asignar</option>
                {(catalogs?.surgeons ?? []).map((surgeon) => (
                  <option key={surgeon.id} value={surgeon.id}>{surgeon.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Duración estimada
              <input
                type="number"
                min="1"
                value={surgeryForm.duracion_estimada_minutos}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, duracion_estimada_minutos: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Prioridad clínica
              <input
                type="number"
                min="0.01"
                step="0.1"
                value={surgeryForm.prioridad_clinica}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, prioridad_clinica: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
            <div className="flex items-center gap-4 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={surgeryForm.byer}
                  onChange={(event) => setSurgeryForm((form) => ({ ...form, byer: event.target.checked }))}
                />
                Byer
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={surgeryForm.sedacion}
                  onChange={(event) => setSurgeryForm((form) => ({ ...form, sedacion: event.target.checked }))}
                />
                Sedación
              </label>
            </div>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Observaciones
              <textarea
                value={surgeryForm.observaciones}
                onChange={(event) => setSurgeryForm((form) => ({ ...form, observaciones: event.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
            {editingSurgery && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:col-span-2">
                Programación actual: {formatDateTime(editingSurgery.inicio)} · {editingSurgery.sala ?? 'Sin sala'}.
              </div>
            )}
          </div>
          {surgeryError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {surgeryError}
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsSurgeryModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveSurgery}
              disabled={isSavingSurgery}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSavingSurgery ? 'Guardando...' : 'Guardar cirugía'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedSurgery !== null} onOpenChange={(open) => !open && setSelectedSurgery(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          {selectedSurgery && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSurgery.paciente}</DialogTitle>
                <DialogDescription>DNI {selectedSurgery.dni} · {selectedSurgery.estado}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['Inicio', formatDateTime(selectedSurgery.inicio)],
                  ['Fin', formatDateTime(selectedSurgery.fin)],
                  ['Especialidad', selectedSurgery.especialidad],
                  ['Intervenciones', selectedSurgery.intervenciones.join(', ') || 'Sin intervenciones'],
                  ['Sala', selectedSurgery.sala ?? 'Sin sala'],
                  ['Anestesia', selectedSurgery.anestesia ?? 'Sin definir'],
                  ['Cirujano', selectedSurgery.cirujanoForzado?.nombre ?? 'Sin asignar'],
                  ['Duración estimada', `${selectedSurgery.duracion_estimada_minutos} min`],
                  ['Prioridad clínica', selectedSurgery.prioridad_clinica.toString()],
                  ['Obra social', selectedSurgery.obra_social ?? 'Sin definir'],
                  ['Creada', formatDateTime(selectedSurgery.created_at)],
                  ['Actualizada', formatDateTime(selectedSurgery.updated_at)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Insumos</p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedSurgery.insumos.length > 0
                    ? selectedSurgery.insumos.map((item) => `${item.nombre} x${item.cantidad}`).join(', ')
                    : 'Sin insumos cargados'}
                </p>
              </div>
              {selectedSurgery.observaciones && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Observaciones</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedSurgery.observaciones}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelSurgery !== null} onOpenChange={(open) => !open && setCancelSurgery(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar cirugía</DialogTitle>
            <DialogDescription>
              La cirugía quedará como Cancelada y se liberará la sala y el horario asignado.
            </DialogDescription>
          </DialogHeader>
          {cancelSurgery && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {cancelSurgery.paciente} · {cancelSurgery.intervenciones.join(', ') || cancelSurgery.especialidad}
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setCancelSurgery(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmCancelSurgery}
              disabled={isCancellingSurgery}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isCancellingSurgery ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
