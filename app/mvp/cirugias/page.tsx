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
  Gauge,
  ListFilter,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  Timer,
  Trash2,
  UserRound,
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
import ConfirmActionDialog from '@/components/confirm-action-dialog'
import FeedbackMessage from '@/components/feedback-message'
import FormSection from '@/components/form-section'
import PageHeader from '@/components/page-header'
import StatusBadge from '@/components/status-badge'
import { toast } from '@/hooks/use-toast'

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

interface MvpTimelineSurgery {
  id: string
  hora: string
  duracion: number
  paciente: string
  especialidad: string
  cirujano: string
}

const planningDayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

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
  surgeons: { id: string; nombre: string; rol: string; especialidadIds: string[] }[]
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

function formatPlanningWeek(weekStart?: string) {
  const start = weekStart ? new Date(`${weekStart}T12:00:00`) : new Date(`${getCurrentWeekStart()}T12:00:00`)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  const formatDayMonth = (date: Date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
  return `Semana del ${formatDayMonth(start)} al ${formatDayMonth(end)}`
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
    cirujano_forzado_id: form.cirujano_forzado_id,
    duracion_estimada_minutos: Number(form.duracion_estimada_minutos),
    prioridad_clinica: Number(form.prioridad_clinica),
    byer: form.byer,
    sedacion: form.sedacion,
    observaciones: form.observaciones.trim() || null,
  }
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function normalizePlanningDay(value: string) {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return planningDayNames.find((day) => day.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalized) ?? value
}

function MvpKpiCard({ icon: Icon, label, value, detail, tone }: { icon: typeof ListChecks; label: string; value: string; detail: string; tone: 'slate' | 'amber' | 'emerald' }) {
  const toneClasses = tone === 'amber' ? 'text-amber-500' : tone === 'emerald' ? 'text-emerald-500' : 'text-slate-400'
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${toneClasses}`}><Icon size={20} />{label}</div><p className="mt-3 text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-400">{detail}</p></div>
}

function MvpSpecialtyLegend({ specialties }: { specialties: string[] }) {
  return <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><span className="text-sm font-semibold uppercase tracking-wide text-slate-400">Especialidades</span>{specialties.map((specialty) => <span key={specialty} className="inline-flex items-center gap-2 text-sm text-slate-600"><span className={`h-3 w-3 rounded-full ${mvpSpecialtyDot(specialty)}`} />{specialty}</span>)}</div>
}

function MvpTimelineRoom({ room, groupedByDay }: { room: string; groupedByDay: Record<string, MvpTimelineSurgery[]> }) {
  const roomTone = room.toLowerCase().includes('1') ? 'bg-indigo-500' : room.toLowerCase().includes('2') ? 'bg-violet-500' : 'bg-cyan-500'
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-900"><span className={`h-3 w-3 rounded-full ${roomTone}`} />{room}</header><div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]"><div aria-hidden="true" />{planningDayNames.map((day) => <h3 key={day} className="border-b border-l border-slate-200 px-4 py-3 font-semibold text-slate-700">{day}</h3>)}<MvpTimeAxis />{planningDayNames.map((day) => <MvpTimelineDay key={day} surgeries={groupedByDay[day] ?? []} />)}</div></section>
}

function MvpTimeAxis() {
  const hours = Array.from({ length: 8 }, (_, index) => index + 8)
  return <div aria-label="Horario de 08:00 a 15:00" className="relative h-[420px] border-r border-slate-200 bg-white text-[11px] text-slate-400">{hours.map((hour, index) => <span key={hour} className={`absolute right-2 ${index === 0 ? 'translate-y-0' : index === hours.length - 1 ? '-translate-y-full' : '-translate-y-1/2'}`} style={{ top: `${(index / (hours.length - 1)) * 100}%` }}>{String(hour).padStart(2, '0')}:00</span>)}</div>
}

function MvpTimelineDay({ surgeries }: { surgeries: MvpTimelineSurgery[] }) {
  return <div className="relative h-[420px] overflow-hidden border-l border-slate-200 bg-white">{Array.from({ length: 8 }, (_, index) => <span key={index} className="absolute inset-x-0 border-t border-dashed border-slate-200" style={{ top: `${(index / 7) * 100}%` }} />)}{surgeries.map((surgery) => <MvpTimelineSurgery key={surgery.id} surgery={surgery} />)}</div>
}

function MvpTimelineSurgery({ surgery }: { surgery: MvpTimelineSurgery }) {
  const startMinutes = mvpToMinutes(surgery.hora)
  const top = Math.max(0, Math.min(100, ((startMinutes - 8 * 60) / (7 * 60)) * 100))
  const height = Math.max(3, Math.min(100 - top, (Math.max(15, surgery.duracion) / (7 * 60)) * 100))
  const compact = surgery.duracion <= 90
  return <article className={`absolute inset-x-3 overflow-hidden rounded-xl border shadow-sm ${compact ? 'p-2 text-[11px]' : 'p-3 text-xs'} ${mvpSpecialtyClasses(surgery.especialidad)}`} style={{ top: `calc(${top}% + 4px)`, height: `calc(${height}% - 8px)` }}><div className="flex items-center justify-between gap-1 font-semibold"><span>{surgery.hora} - {mvpFormatTime(surgery.hora, surgery.duracion)}</span><span className="text-slate-400">{surgery.duracion}′</span></div><p className="mt-1 font-semibold text-slate-800">{surgery.paciente}</p><p className="text-slate-500">{surgery.cirujano}</p><p className="mt-1 flex items-center gap-1 text-slate-500"><span className={`h-2 w-2 rounded-full ${mvpSpecialtyDot(surgery.especialidad)}`} />{surgery.especialidad}</p></article>
}

function mvpToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return (Number.isFinite(hours) ? hours : 8) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

function mvpFormatTime(start: string, duration: number) {
  const end = mvpToMinutes(start) + duration
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
}

function mvpSpecialtyClasses(specialty: string) {
  if (specialty === 'Cirugía General') return 'border-emerald-100 bg-emerald-50'
  if (specialty === 'Traumatología') return 'border-blue-100 bg-blue-50'
  if (specialty === 'Urología') return 'border-amber-100 bg-amber-50'
  if (specialty === 'Ginecología') return 'border-rose-100 bg-rose-50'
  if (specialty === 'Oftalmología') return 'border-cyan-100 bg-cyan-50'
  if (specialty === 'Neurocirugía') return 'border-violet-100 bg-violet-50'
  return 'border-violet-100 bg-violet-50'
}

function mvpSpecialtyDot(specialty: string) {
  if (specialty === 'Cirugía General') return 'bg-emerald-500'
  if (specialty === 'Traumatología') return 'bg-blue-500'
  if (specialty === 'Urología') return 'bg-amber-500'
  if (specialty === 'Ginecología') return 'bg-rose-500'
  if (specialty === 'Oftalmología') return 'bg-cyan-500'
  if (specialty === 'Neurocirugía') return 'bg-violet-500'
  return 'bg-violet-500'
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
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false)
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    estado: 'Pendiente',
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
      toast({ title: 'Planificación iniciada', description: `${formatPlanningWeek(getCurrentWeekStart())}. El progreso se actualizará automáticamente.` })
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
      cirujano_forzado_id: '',
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
    if (!isSurgeryFormValid) {
      setSurgeryError('Revisá los campos obligatorios antes de guardar.')
      return
    }
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
      toast({
        title: editingSurgery ? 'Cirugía actualizada' : 'Cirugía registrada',
        description: editingSurgery
          ? 'Los datos operativos se guardaron correctamente.'
          : 'La solicitud quedó pendiente de asignación.',
      })
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
      toast({ title: 'Cirugía cancelada', description: `${cancelSurgery.paciente} quedó con estado Cancelada y liberó su programación.` })
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
      setIsDeleteConfirmOpen(false)
      toast({ title: 'Planificación eliminada', description: 'Ya podés corregir las solicitudes y generar una nueva propuesta.' })
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
      setIsApproveConfirmOpen(false)
      toast({ title: 'Planificación aprobada', description: 'Las cirugías asignadas pasaron al estado Programada.' })
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
      setIsRejectConfirmOpen(false)
      toast({ title: 'Planificación rechazada', description: 'El motivo quedó registrado. El administrador puede corregir las cirugías y regenerar.' })
    } catch (rejectError) {
      setPlanningError(rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar la planificación')
    } finally {
      setIsRejectingPlanning(false)
    }
  }

  const planningOutput = planning?.output_payload
  const planningDays = useMemo(() => planningOutput?.dias ?? [], [planningOutput?.dias])
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
  const planningTimelineRooms = useMemo(() => {
    const rooms = Array.from(new Set(planningDays.flatMap((day) => day.bloques.map((block) => block.quirofano))))
    return rooms.map((room) => ({
      room,
      groupedByDay: Object.fromEntries(
        planningDayNames.map((dayName) => [
          dayName,
          scheduledPlanningItems
            .filter(({ day, block }) => normalizePlanningDay(day) === dayName && block.quirofano === room)
            .map(({ item, block, cirugia }) => ({
              id: `${room}-${dayName}-${item.paciente_id}-${item.hora_inicio}`,
              hora: item.hora_inicio,
              duracion: item.duracion ?? cirugia?.duracion_estimada_minutos ?? 90,
              paciente: cirugia?.paciente ?? `Cirugía #${item.paciente_id}`,
              especialidad: cirugia?.especialidad ?? block.especialidad,
              cirujano: item.medico,
            } satisfies MvpTimelineSurgery)),
        ]),
      ) as Record<string, MvpTimelineSurgery[]>,
    }))
  }, [planningDays, scheduledPlanningItems])
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
      const searchable = `${cirugia.paciente} ${cirugia.dni}`.toLowerCase()
      if (filters.search && !searchable.includes(filters.search.toLowerCase().trim())) return false
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
    search: '',
    estado: 'Pendiente',
    quirofano: '',
    fechaDesde: '',
    fechaHasta: '',
    dniPaciente: '',
    cirujano: '',
  })
  const canReviewPlanning = canApprovePlanning && planning?.status === 'pending_approval'
  const canDeletePlanning = canCreatePlanning
  const hasActivePlanning = planning?.status === 'planning' || planning?.status === 'pending_approval'
  const canStartPlanning =
    canCreatePlanning &&
    planning?.status !== 'planning' &&
    planning?.status !== 'pending_approval' &&
    preflight?.can_plan !== false
  const modalTitle = canReviewPlanning ? 'Revisar planificación semanal' : 'Generar planificación semanal'
  const selectedIntervention = catalogs?.interventions.find((item) => item.id === surgeryForm.intervention_id)
  const compatibleSurgeons = (catalogs?.surgeons ?? []).filter(
    (surgeon) => selectedIntervention && surgeon.especialidadIds.includes(selectedIntervention.especialidadId),
  )
  const formErrors = useMemo(() => {
    const next: Partial<Record<keyof SurgeryFormState, string>> = {}
    if (!surgeryForm.dni.trim()) next.dni = 'Ingresá el DNI del paciente.'
    else if (!/^\d{7,10}$/.test(surgeryForm.dni.trim())) next.dni = 'Usá entre 7 y 10 números, sin puntos.'
    if (!surgeryForm.paciente.trim()) next.paciente = 'Ingresá el nombre del paciente.'
    if (!surgeryForm.intervention_id) next.intervention_id = 'Seleccioná una intervención.'
    if (!surgeryForm.cirujano_forzado_id) next.cirujano_forzado_id = 'Seleccioná el cirujano asignado.'
    if (!Number.isFinite(Number(surgeryForm.duracion_estimada_minutos)) || Number(surgeryForm.duracion_estimada_minutos) <= 0) {
      next.duracion_estimada_minutos = 'Ingresá una duración mayor a 0 minutos.'
    }
    if (!Number.isFinite(Number(surgeryForm.prioridad_clinica)) || Number(surgeryForm.prioridad_clinica) <= 0) {
      next.prioridad_clinica = 'Ingresá una prioridad mayor a 0.'
    }
    return next
  }, [surgeryForm])
  const isSurgeryFormValid = catalogs !== null && Object.keys(formErrors).length === 0

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
            <PageHeader
              className="mb-6"
              eyebrow="MVP · Datos reales"
              title="Cirugías"
              description="Registrá solicitudes quirúrgicas, revisá su estado y generá la agenda semanal asistida por IA."
              actions={
                <>
                {canCreatePlanning && (
                  <button
                    type="button"
                    onClick={openCreateSurgery}
                    disabled={hasActivePlanning}
                    title={hasActivePlanning ? 'Finalizá la planificación activa antes de modificar cirugías' : 'Registrar una nueva cirugía'}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus size={16} />
                    Nueva cirugía
                  </button>
                )}
                {canCreatePlanning && !canReviewPlanning && (
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
                </>
              }
            />

            {planning?.status === 'planning' && !isPlanningModalOpen && (
              <FeedbackMessage className="mb-4" title="Planificación en proceso">
                {formatPlanningWeek(planning.input_payload.week_start)} · {progress}% completado. Podés seguir trabajando y volver a revisar el progreso.
              </FeedbackMessage>
            )}
            {planning?.status === 'pending_approval' && canCreatePlanning && (
              <FeedbackMessage className="mb-4" tone="warning" title="Edición temporalmente bloqueada">
                Hay una planificación pendiente de revisión. Para evitar inconsistencias, no se pueden crear, editar ni cancelar cirugías hasta que sea aprobada o rechazada.
              </FeedbackMessage>
            )}

            <Dialog open={isPlanningModalOpen} onOpenChange={setIsPlanningModalOpen}>
              <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-[min(1380px,calc(100vw-2rem))]">
                <DialogHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                    <div>
                      <DialogTitle>{modalTitle}</DialogTitle>
                      <DialogDescription>
                        {canReviewPlanning
                          ? 'Revisá la propuesta generada por IA antes de confirmar la agenda.'
                          : `${pendingCirugiasCount} cirugías pendientes para planificar. ${formatPlanningWeek(planning?.input_payload.week_start)}`}
                      </DialogDescription>
                    </div>
                    {planning ? (
                      <StatusBadge kind="planning" status={planning.status} />
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
                        Sin ejecución iniciada
                      </span>
                    )}
                  </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">

                {!planning && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
                    <CalendarDays className="mx-auto text-slate-400" size={36} />
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">Todavía no hay una planificación para esta semana</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                      Generá una propuesta para distribuir las {pendingCirugiasCount} cirugías pendientes en los quirófanos y horarios disponibles.
                    </p>
                    <p className="mt-2 text-xs font-medium text-blue-700">{formatPlanningWeek()}</p>
                    {canCreatePlanning && (
                      <button
                        type="button"
                        onClick={startPlanning}
                        disabled={isPlanningRequesting || !canStartPlanning}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        <Sparkles size={18} />
                        {isPlanningRequesting ? 'Planificando...' : 'Generar planificación'}
                      </button>
                    )}
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
                    <p className="mt-2 text-xs text-slate-500">La propuesta se actualiza automáticamente cada 2,5 segundos. Podés cerrar esta ventana sin interrumpir el proceso.</p>
                  </div>
                )}

                {planning?.status === 'pending_approval' && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <Clock size={18} />
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
                    <div className="grid gap-4 md:grid-cols-4">
                      <MvpKpiCard icon={ListChecks} label="Programadas" value={String(planningOutput?.resumen?.pacientes_programados ?? scheduledPlanningItems.length)} detail="de solicitudes" tone="slate" />
                      <MvpKpiCard icon={CalendarDays} label="Quedan afuera" value={String(planningOutput?.resumen?.pacientes_pendientes ?? pendingSurgeries.length)} detail="solicitudes" tone="amber" />
                      <MvpKpiCard icon={Gauge} label="Utilización prom." value={`${averagePlanningUtilization}%`} detail="promedio semanal" tone="emerald" />
                      <MvpKpiCard icon={Timer} label="Ejecución" value={`${planning?.duration_seconds ?? planningOutput?.duracion_segundos ?? '-'} s`} detail="tiempo de generación" tone="slate" />
                    </div>
                    <MvpSpecialtyLegend specialties={Array.from(new Set(scheduledPlanningItems.map(({ block, cirugia }) => cirugia?.especialidad ?? block.especialidad)))} />
                    <div className="space-y-5">
                      {planningTimelineRooms.map(({ room, groupedByDay }) => <MvpTimelineRoom key={room} room={room} groupedByDay={groupedByDay} />)}
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
                            {showPendingOutside ? 'Ocultá' : 'Tocá para ver'} las cirugías no incluidas en esta propuesta.
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

                </div>

                <DialogFooter className="items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {planning && canDeletePlanning && (
                      <button
                        type="button"
                        onClick={() => setIsDeleteConfirmOpen(true)}
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
                            onClick={showRejectReason
                              ? () => rejectionReason.trim()
                                ? setIsRejectConfirmOpen(true)
                                : setPlanningError('Ingresá un motivo para rechazar la planificación')
                              : () => setShowRejectReason(true)}
                            disabled={isRejectingPlanning}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                          >
                            <XCircle size={14} />
                            {isRejectingPlanning ? 'Rechazando...' : showRejectReason ? 'Confirmar rechazo' : 'Rechazar con motivo'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsApproveConfirmOpen(true)}
                          disabled={isApprovingPlanning}
                          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                        >
                          <CheckCircle size={14} />
                          {isApprovingPlanning ? 'Aprobando...' : 'Aprobar planificación'}
                        </button>
                      </>
                    )}
                    {canCreatePlanning && planning && (planning.status === 'failed' || planning.status === 'rejected') && (
                      <button
                        type="button"
                        onClick={startPlanning}
                        disabled={isPlanningRequesting || !canStartPlanning}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        <Sparkles size={16} />
                        {isPlanningRequesting ? 'Planificando...' : 'Generar planificación semanal'}
                      </button>
                    )}
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="relative min-w-[280px] flex-1">
                <span className="sr-only">Buscar por paciente o DNI</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Buscar por paciente o DNI..."
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
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
                Más filtros
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
              <div className="ml-auto flex flex-wrap gap-2">
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
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center text-red-700">
                  <p>{error}</p>
                  <button type="button" onClick={refreshCirugias} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium hover:bg-red-50"><RefreshCw size={15} />Reintentar</button>
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
                    Probá cambiar el estado, los filtros avanzados o el texto de búsqueda.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-sm">
                    <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Inicio</th>
                        <th className="px-4 py-3">Paciente</th>
                        <th className="px-4 py-3">Intervención</th>
                        <th className="px-4 py-3">Cirujano</th>
                        <th className="px-4 py-3">Quirófano</th>
                        <th className="px-4 py-3">Duración</th>
                        <th className="px-4 py-3">Estado</th>
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
                          <td className="px-4 py-4 text-foreground">
                            <div className="font-medium">{cirugia.intervenciones.join(', ') || 'Sin intervención'}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{cirugia.especialidad}</div>
                          </td>
                          <td className="px-4 py-4 text-foreground">{cirugia.cirujanoForzado?.nombre ?? 'Sin asignar'}</td>
                          <td className="px-4 py-4 text-foreground">{cirugia.sala ?? 'Sin sala'}</td>
                          <td className="px-4 py-4 text-foreground">{cirugia.duracion_estimada_minutos} min</td>
                          <td className="px-4 py-4">
                            <SurgeryStatusBadge status={cirugia.estado} />
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
                              {canCreatePlanning && !hasActivePlanning && cirugia.estado === 'Pendiente' && (
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
                              {canCreatePlanning && !hasActivePlanning && ['Pendiente', 'Programada'].includes(cirugia.estado) && (
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
          <div className="space-y-4">
            <FormSection title="Paciente" description="Datos de identificación y cobertura." icon={<UserRound size={18} />}>
              <div className="grid gap-4 md:grid-cols-2">
                <label htmlFor="surgery-dni" className="text-sm font-medium text-slate-700">
                  DNI <span className="text-red-600">*</span>
                  <input id="surgery-dni" inputMode="numeric" value={surgeryForm.dni} aria-invalid={Boolean(formErrors.dni)} aria-describedby="surgery-dni-error" onChange={(event) => setSurgeryForm((form) => ({ ...form, dni: event.target.value.replace(/\D/g, '') }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" />
                  {formErrors.dni && <span id="surgery-dni-error" className="mt-1 block text-xs text-red-600">{formErrors.dni}</span>}
                </label>
                <label htmlFor="surgery-patient" className="text-sm font-medium text-slate-700">
                  Nombre completo <span className="text-red-600">*</span>
                  <input id="surgery-patient" value={surgeryForm.paciente} aria-invalid={Boolean(formErrors.paciente)} aria-describedby="surgery-patient-error" onChange={(event) => setSurgeryForm((form) => ({ ...form, paciente: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" />
                  {formErrors.paciente && <span id="surgery-patient-error" className="mt-1 block text-xs text-red-600">{formErrors.paciente}</span>}
                </label>
                <label htmlFor="surgery-age" className="text-sm font-medium text-slate-700">Edad<input id="surgery-age" type="number" min="0" value={surgeryForm.edad} onChange={(event) => setSurgeryForm((form) => ({ ...form, edad: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" /></label>
                <label htmlFor="surgery-insurance" className="text-sm font-medium text-slate-700">Obra social<input id="surgery-insurance" value={surgeryForm.obra_social} onChange={(event) => setSurgeryForm((form) => ({ ...form, obra_social: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" /></label>
              </div>
            </FormSection>

            <FormSection title="Procedimiento clínico" description="Información utilizada para priorizar y estimar la cirugía." icon={<Activity size={18} />}>
              <div className="grid gap-4 md:grid-cols-2">
                <label htmlFor="surgery-intervention" className="text-sm font-medium text-slate-700 md:col-span-2">Intervención <span className="text-red-600">*</span>
                  <select id="surgery-intervention" value={surgeryForm.intervention_id} aria-invalid={Boolean(formErrors.intervention_id)} onChange={(event) => setSurgeryForm((form) => ({ ...form, intervention_id: event.target.value, cirujano_forzado_id: '' }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500">
                    <option value="">Seleccioná una intervención</option>
                    {(catalogs?.interventions ?? []).map((intervention) => {
                      const specialty = catalogs?.specialties.find((item) => item.id === intervention.especialidadId)
                      return <option key={intervention.id} value={intervention.id}>{intervention.nombre}{specialty ? ` · ${specialty.nombre}` : ''}</option>
                    })}
                  </select>
                  {formErrors.intervention_id && <span className="mt-1 block text-xs text-red-600">{formErrors.intervention_id}</span>}
                </label>
                <label htmlFor="surgery-duration" className="text-sm font-medium text-slate-700">Duración estimada (min) <span className="text-red-600">*</span><input id="surgery-duration" type="number" min="1" value={surgeryForm.duracion_estimada_minutos} aria-invalid={Boolean(formErrors.duracion_estimada_minutos)} onChange={(event) => setSurgeryForm((form) => ({ ...form, duracion_estimada_minutos: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" />{formErrors.duracion_estimada_minutos && <span className="mt-1 block text-xs text-red-600">{formErrors.duracion_estimada_minutos}</span>}</label>
                <label htmlFor="surgery-priority" className="text-sm font-medium text-slate-700">Prioridad clínica <span className="text-red-600">*</span><input id="surgery-priority" type="number" min="0.01" step="0.1" value={surgeryForm.prioridad_clinica} aria-invalid={Boolean(formErrors.prioridad_clinica)} onChange={(event) => setSurgeryForm((form) => ({ ...form, prioridad_clinica: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" />{formErrors.prioridad_clinica && <span className="mt-1 block text-xs text-red-600">{formErrors.prioridad_clinica}</span>}</label>
              </div>
            </FormSection>

            <FormSection title="Requisitos" description="Asignaciones opcionales y consideraciones para el equipo." icon={<Stethoscope size={18} />}>
              <div className="grid gap-4 md:grid-cols-2">
                <label htmlFor="surgery-anesthesia" className="text-sm font-medium text-slate-700">Anestesia<select id="surgery-anesthesia" value={surgeryForm.tipo_anestesia_id} onChange={(event) => setSurgeryForm((form) => ({ ...form, tipo_anestesia_id: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"><option value="">Sin definir</option>{(catalogs?.anesthesia_types ?? []).map((anesthesia) => <option key={anesthesia.id} value={anesthesia.id}>{anesthesia.nombre}</option>)}</select></label>
                <label htmlFor="surgery-surgeon" className="text-sm font-medium text-slate-700">Cirujano asignado *<select id="surgery-surgeon" value={surgeryForm.cirujano_forzado_id} onChange={(event) => setSurgeryForm((form) => ({ ...form, cirujano_forzado_id: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"><option value="">Seleccionar cirujano</option>{compatibleSurgeons.map((surgeon) => <option key={surgeon.id} value={surgeon.id}>{surgeon.nombre}</option>)}</select>{formErrors.cirujano_forzado_id && <span className="mt-1 block text-xs font-normal text-red-600">{formErrors.cirujano_forzado_id}</span>}</label>
                <div className="flex items-center gap-5 md:col-span-2"><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={surgeryForm.byer} onChange={(event) => setSurgeryForm((form) => ({ ...form, byer: event.target.checked }))} />Byer</label><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={surgeryForm.sedacion} onChange={(event) => setSurgeryForm((form) => ({ ...form, sedacion: event.target.checked }))} />Sedación</label></div>
                <label htmlFor="surgery-notes" className="text-sm font-medium text-slate-700 md:col-span-2">Observaciones<textarea id="surgery-notes" value={surgeryForm.observaciones} onChange={(event) => setSurgeryForm((form) => ({ ...form, observaciones: event.target.value }))} rows={3} placeholder="Alergias, consideraciones clínicas u otra información relevante..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" /></label>
              </div>
            </FormSection>
            {editingSurgery && <FeedbackMessage>Programación actual: {formatDateTime(editingSurgery.inicio)} · {editingSurgery.sala ?? 'Sin sala'}. La agenda sólo cambia al aprobar una planificación.</FeedbackMessage>}
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
              disabled={isSavingSurgery || !isSurgeryFormValid}
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
                <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                  <div><DialogTitle>{selectedSurgery.paciente}</DialogTitle><DialogDescription>DNI {selectedSurgery.dni}</DialogDescription></div>
                  <SurgeryStatusBadge status={selectedSurgery.estado} />
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <FormSection title="Paciente" icon={<UserRound size={18} />}><div className="grid gap-3 md:grid-cols-3"><DetailItem label="Nombre" value={selectedSurgery.paciente} /><DetailItem label="DNI" value={selectedSurgery.dni} /><DetailItem label="Obra social" value={selectedSurgery.obra_social ?? 'Sin definir'} /></div></FormSection>
                <FormSection title="Solicitud quirúrgica" icon={<Activity size={18} />}><div className="grid gap-3 md:grid-cols-2"><DetailItem label="Intervención" value={selectedSurgery.intervenciones.join(', ') || 'Sin intervención'} /><DetailItem label="Especialidad" value={selectedSurgery.especialidad} /><DetailItem label="Duración estimada" value={`${selectedSurgery.duracion_estimada_minutos} min`} /><DetailItem label="Prioridad clínica" value={selectedSurgery.prioridad_clinica.toString()} /></div></FormSection>
                <FormSection title="Programación y equipo" icon={<Stethoscope size={18} />}><div className="grid gap-3 md:grid-cols-2"><DetailItem label="Inicio" value={formatDateTime(selectedSurgery.inicio)} /><DetailItem label="Fin" value={formatDateTime(selectedSurgery.fin)} /><DetailItem label="Quirófano" value={selectedSurgery.sala ?? 'Sin asignar'} /><DetailItem label="Cirujano" value={selectedSurgery.cirujanoForzado?.nombre ?? 'Sin asignar'} /><DetailItem label="Anestesia" value={selectedSurgery.anestesia ?? 'Sin definir'} /><DetailItem label="Opciones" value={[selectedSurgery.byer ? 'Byer' : null, selectedSurgery.sedacion ? 'Sedación' : null].filter(Boolean).join(' · ') || 'Sin opciones adicionales'} /></div></FormSection>
                <FormSection title="Recursos y observaciones"><DetailItem label="Insumos" value={selectedSurgery.insumos.length > 0 ? selectedSurgery.insumos.map((item) => `${item.nombre} x${item.cantidad}`).join(', ') : 'Sin insumos cargados'} />{selectedSurgery.observaciones && <div className="mt-3"><DetailItem label="Observaciones" value={selectedSurgery.observaciones} /></div>}</FormSection>
                <FormSection title="Auditoría"><div className="grid gap-3 md:grid-cols-2"><DetailItem label="Creada" value={formatDateTime(selectedSurgery.created_at)} /><DetailItem label="Última actualización" value={formatDateTime(selectedSurgery.updated_at)} /></div></FormSection>
              </div>
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
      <ConfirmActionDialog
        open={isApproveConfirmOpen}
        onOpenChange={setIsApproveConfirmOpen}
        title="Aprobar planificación semanal"
        description="Las cirugías asignadas pasarán a Programada con el horario, quirófano y cirujano de esta propuesta."
        confirmLabel="Aprobar planificación"
        busyLabel="Aprobando..."
        busy={isApprovingPlanning}
        tone="success"
        onConfirm={approvePlanning}
        detail={planning && <FeedbackMessage tone="warning">{planningOutput?.resumen?.pacientes_programados ?? scheduledPlanningItems.length} cirugías serán programadas. Revisá la propuesta completa antes de confirmar.</FeedbackMessage>}
      />
      <ConfirmActionDialog
        open={isRejectConfirmOpen}
        onOpenChange={setIsRejectConfirmOpen}
        title="Rechazar planificación"
        description="La propuesta quedará rechazada y ninguna cirugía cambiará de estado. El administrador podrá corregir las solicitudes y generar otra."
        confirmLabel="Confirmar rechazo"
        busyLabel="Rechazando..."
        busy={isRejectingPlanning}
        onConfirm={rejectPlanning}
        detail={<FeedbackMessage tone="warning" title="Motivo registrado">{rejectionReason}</FeedbackMessage>}
      />
      <ConfirmActionDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar planificación"
        description="Se eliminará esta ejecución y su propuesta. Las cirugías conservarán su estado actual."
        confirmLabel="Eliminar planificación"
        busyLabel="Eliminando..."
        busy={isDeletingPlanning}
        onConfirm={deletePlanning}
      />
    </div>
  )
}
