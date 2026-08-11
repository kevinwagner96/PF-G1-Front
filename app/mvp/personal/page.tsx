'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  RotateCcw,
  UserRound,
  Users,
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import FeedbackMessage from '@/components/feedback-message'
import PageHeader from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const CREATE_PLANNING_PERMISSION = 'plannings.can_create_planning'
const PLANNING_START = 480
const PLANNING_END = 780
const DAYS = [
  { id: '0', label: 'Lunes', shortLabel: 'Lun' },
  { id: '1', label: 'Martes', shortLabel: 'Mar' },
  { id: '2', label: 'Miércoles', shortLabel: 'Mié' },
  { id: '3', label: 'Jueves', shortLabel: 'Jue' },
  { id: '4', label: 'Viernes', shortLabel: 'Vie' },
]

interface MedicalStaff {
  id: string
  name: string
  role: string
  specialties_ids: string[]
  availability_hours: Record<string, [number, number]>
}

interface Catalogs {
  specialties: { id: string; nombre: string }[]
}

interface DayForm {
  enabled: boolean
  start: string
  end: string
}

type AvailabilityForm = Record<string, DayForm>

function minuteToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

function timeToMinute(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function getUsableMinutes(hours?: [number, number]) {
  if (!hours) return 0
  return Math.max(0, Math.min(hours[1], PLANNING_END) - Math.max(hours[0], PLANNING_START))
}

function formatDuration(minutes: number) {
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1).replace('.', ',')} h`
}

function formFromStaff(staff: MedicalStaff): AvailabilityForm {
  return Object.fromEntries(DAYS.map((day) => {
    const hours = staff.availability_hours[day.id]
    return [day.id, {
      enabled: Boolean(hours),
      start: hours ? minuteToTime(hours[0]) : '08:00',
      end: hours ? minuteToTime(hours[1]) : '13:00',
    }]
  }))
}

function formSignature(form: AvailabilityForm) {
  return DAYS.map((day) => {
    const value = form[day.id]
    return `${day.id}:${value?.enabled ?? false}:${value?.start ?? ''}:${value?.end ?? ''}`
  }).join('|')
}

function AvailabilityCell({ hours }: { hours?: [number, number] }) {
  if (!hours) {
    return (
      <div className="flex min-h-14 flex-col justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-400">
        <span className="text-sm font-medium">—</span>
        <span className="text-[11px]">No disponible</span>
      </div>
    )
  }

  const usableMinutes = getUsableMinutes(hours)
  return (
    <div className={cn(
      'flex min-h-14 flex-col justify-center rounded-lg border px-3 py-2',
      usableMinutes > 0
        ? 'border-blue-100 bg-blue-50 text-blue-950'
        : 'border-amber-200 bg-amber-50 text-amber-950',
    )}>
      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
        {minuteToTime(hours[0])}–{minuteToTime(hours[1])}
      </span>
      <span className={cn('text-[11px]', usableMinutes > 0 ? 'text-blue-700' : 'text-amber-700')}>
        {usableMinutes > 0 ? `${formatDuration(usableMinutes)} utilizables` : 'Fuera de jornada'}
      </span>
    </div>
  )
}

export default function MvpPersonalPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange, user } = useAuth()
  const canManage = user?.permissions?.includes(CREATE_PLANNING_PERMISSION) ?? false
  const [staff, setStaff] = useState<MedicalStaff[]>([])
  const [specialties, setSpecialties] = useState<Catalogs['specialties']>([])
  const [isFetching, setIsFetching] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState<MedicalStaff | null>(null)
  const [form, setForm] = useState<AvailabilityForm>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (requiresPasswordChange) {
      router.push('/cambiar-password')
      return
    }
    if (!canManage) {
      router.push('/mvp/cirugias')
    }
  }, [canManage, isAuthenticated, isLoading, requiresPasswordChange, router])

  useEffect(() => {
    if (!canManage) return
    let cancelled = false
    async function load() {
      setIsFetching(true)
      setLoadError(null)
      try {
        const [staffData, catalogData] = await Promise.all([
          apiRequest<MedicalStaff[]>('/medical-staff/'),
          apiRequest<Catalogs>('/surgery-catalogs/'),
        ])
        if (cancelled) return
        setStaff(staffData.filter((item) => item.role.toLowerCase() === 'cirujano'))
        setSpecialties(catalogData.specialties)
      } catch (loadError) {
        if (!cancelled) setLoadError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los cirujanos')
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [canManage, reloadKey])

  const specialtyNames = useMemo(
    () => Object.fromEntries(specialties.map((specialty) => [specialty.id, specialty.nombre])),
    [specialties],
  )
  const configuredStaffCount = staff.filter((item) => DAYS.some((day) => item.availability_hours[day.id])).length
  const configuredDaysCount = staff.reduce(
    (total, item) => total + DAYS.filter((day) => item.availability_hours[day.id]).length,
    0,
  )
  const weeklyUsableMinutes = staff.reduce(
    (total, item) => total + DAYS.reduce(
      (staffTotal, day) => staffTotal + getUsableMinutes(item.availability_hours[day.id]),
      0,
    ),
    0,
  )
  const invalidDay = DAYS.find((day) => {
    const value = form[day.id]
    return value?.enabled && (
      !isValidTime(value.start)
      || !isValidTime(value.end)
      || timeToMinute(value.start) >= timeToMinute(value.end)
    )
  })
  const editorActiveDays = DAYS.filter((day) => form[day.id]?.enabled).length
  const editorUsableMinutes = DAYS.reduce((total, day) => {
    const value = form[day.id]
    if (!value?.enabled || !isValidTime(value.start) || !isValidTime(value.end)) return total
    return total + getUsableMinutes([timeToMinute(value.start), timeToMinute(value.end)])
  }, 0)
  const editorOutsideDays = DAYS.filter((day) => {
    const value = form[day.id]
    return value?.enabled
      && isValidTime(value.start)
      && isValidTime(value.end)
      && getUsableMinutes([timeToMinute(value.start), timeToMinute(value.end)]) === 0
  })
  const hasChanges = editing
    ? formSignature(form) !== formSignature(formFromStaff(editing))
    : false

  const openEditor = (item: MedicalStaff) => {
    setEditing(item)
    setForm(formFromStaff(item))
    setSaveError(null)
  }

  const applyStandardWeek = () => {
    setForm(Object.fromEntries(DAYS.map((day) => [day.id, { enabled: true, start: '08:00', end: '13:00' }])))
    setSaveError(null)
  }

  const clearWeek = () => {
    setForm((current) => Object.fromEntries(DAYS.map((day) => [
      day.id,
      { ...(current[day.id] ?? { start: '08:00', end: '13:00' }), enabled: false },
    ])))
    setSaveError(null)
  }

  const save = async () => {
    if (!editing || invalidDay || !hasChanges) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const availability_hours = Object.fromEntries(
        DAYS.filter((day) => form[day.id]?.enabled).map((day) => [
          day.id,
          [timeToMinute(form[day.id].start), timeToMinute(form[day.id].end)],
        ]),
      )
      const updated = await apiRequest<MedicalStaff>(`/medical-staff/${editing.id}/availability/`, {
        method: 'PUT',
        body: JSON.stringify({ availability_hours }),
      })
      setStaff((current) => current.map((item) => item.id === updated.id ? updated : item))
      setEditing(null)
      toast({ title: 'Horario actualizado', description: 'La próxima planificación usará esta disponibilidad semanal.' })
    } catch (saveError) {
      setSaveError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el horario')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !isAuthenticated || !canManage) {
    return <div className="min-h-screen bg-slate-50" />
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activePage="personal" navigationMode="mvp" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          <PageHeader
            eyebrow="MVP · Datos reales"
            title="Horarios médicos"
            description="Definí cuándo está disponible cada cirujano y revisá la cobertura de toda la semana antes de planificar."
          />

          <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de disponibilidad">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Users size={20} /></span>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-slate-950">{configuredStaffCount}<span className="text-base font-medium text-slate-400">/{staff.length}</span></p>
                  <p className="text-sm text-slate-600">Cirujanos con horario</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><CalendarDays size={20} /></span>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-slate-950">{configuredDaysCount}<span className="text-base font-medium text-slate-400">/{staff.length * DAYS.length}</span></p>
                  <p className="text-sm text-slate-600">Días con cobertura</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Clock3 size={20} /></span>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-slate-950">{formatDuration(weeklyUsableMinutes)}</p>
                  <p className="text-sm text-slate-600">Capacidad semanal usable</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <Clock3 className="mt-0.5 shrink-0 text-blue-700" size={18} />
            <div>
              <p className="font-semibold">Jornada que usa el planificador: 08:00–13:00</p>
              <p className="mt-0.5 text-blue-800">Podés cargar horarios más amplios, pero el decoder sólo considera la parte que coincide con esa franja.</p>
            </div>
          </div>

          {loadError && (
            <div className="space-y-3">
              <FeedbackMessage tone="error" title="No se pudieron cargar los horarios">{loadError}</FeedbackMessage>
              <Button variant="outline" onClick={() => setReloadKey((current) => current + 1)}>Reintentar</Button>
            </div>
          )}

          {isFetching ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-8 w-72 animate-pulse rounded bg-slate-100" />
              {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
              <Users className="mx-auto text-slate-400" size={36} />
              <h2 className="mt-3 font-semibold text-slate-900">No hay cirujanos activos</h2>
              <p className="mt-1 text-sm text-slate-500">Cargalos desde la administración del sistema antes de definir horarios.</p>
            </div>
          ) : !loadError && (
            <section className="space-y-3" aria-labelledby="weekly-schedule-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="weekly-schedule-title" className="text-lg font-semibold text-slate-950">Disponibilidad semanal</h2>
                  <p className="text-sm text-slate-500">Compará rápidamente qué cirujano está disponible cada día.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500" aria-label="Referencias">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Con disponibilidad</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />No disponible</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Fuera de jornada</span>
                </div>
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="min-w-[925px]">
                  <div className="grid grid-cols-[160px_125px_repeat(5,minmax(100px,1fr))_52px] gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Cirujano</span>
                    <span>Especialidad</span>
                    {DAYS.map((day) => <span key={day.id}>{day.label}</span>)}
                    <span className="text-right">Acción</span>
                  </div>
                  {staff.map((item) => {
                    const names = item.specialties_ids.map((id) => specialtyNames[id]).filter(Boolean)
                    return (
                      <article key={item.id} className="grid grid-cols-[160px_125px_repeat(5,minmax(100px,1fr))_52px] items-center gap-2 border-b border-slate-100 px-4 py-4 last:border-b-0 hover:bg-slate-50/60">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><UserRound size={19} /></span>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-950">{item.name}</h3>
                            <p className="text-xs text-slate-500">Cirujano activo</p>
                          </div>
                        </div>
                        <div>
                          {names.length > 0
                            ? names.map((name) => <Badge key={name} variant="secondary" className="mr-1 max-w-full truncate bg-slate-100 px-1.5 text-[11px] text-slate-700">{name}</Badge>)
                            : <span className="text-sm text-slate-400">Sin especialidad activa</span>}
                        </div>
                        {DAYS.map((day) => <AvailabilityCell key={day.id} hours={item.availability_hours[day.id]} />)}
                        <div className="flex justify-end">
                          <Button type="button" variant="outline" size="icon" onClick={() => openEditor(item)} aria-label={`Editar horario de ${item.name}`} title={`Editar horario de ${item.name}`}>
                            <Edit3 />
                          </Button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:hidden">
                {staff.map((item) => {
                  const names = item.specialties_ids.map((id) => specialtyNames[id]).filter(Boolean)
                  return (
                    <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><UserRound size={19} /></span>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-950">{item.name}</h3>
                            <p className="truncate text-xs text-slate-500">{names.join(' · ') || 'Sin especialidad activa'}</p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="icon" onClick={() => openEditor(item)} aria-label={`Editar horario de ${item.name}`}>
                          <Edit3 />
                        </Button>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {DAYS.map((day) => (
                          <div key={day.id}>
                            <p className="mb-1 text-xs font-semibold text-slate-500">{day.shortLabel}</p>
                            <AvailabilityCell hours={item.availability_hours[day.id]} />
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open && !isSaving) { setEditing(null); setSaveError(null) } }}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 p-5 pr-12">
            <div className="flex items-center gap-3 text-left">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><UserRound size={21} /></span>
              <div>
                <DialogTitle>Disponibilidad de {editing?.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  {editing?.specialties_ids.map((id) => specialtyNames[id]).filter(Boolean).join(' · ') || 'Sin especialidad activa'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Días disponibles</p>
                <p className="mt-0.5 font-semibold tabular-nums text-slate-950">{editorActiveDays} de 5</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Capacidad utilizable</p>
                <p className="mt-0.5 font-semibold tabular-nums text-slate-950">{formatDuration(editorUsableMinutes)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-500">Jornada del decoder</p>
                <p className="mt-0.5 font-semibold tabular-nums text-slate-950">08:00–13:00</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={applyStandardWeek} disabled={isSaving}>
                <CheckCircle2 /> Usar jornada estándar (Lun–Vie)
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearWeek} disabled={isSaving} className="text-slate-600">
                <RotateCcw /> Quitar toda la semana
              </Button>
            </div>

            <div className="space-y-2">
            <div className="hidden grid-cols-[150px_1fr_1fr] gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Día</span><span>Desde</span><span>Hasta</span>
            </div>
            {DAYS.map((day) => {
              const value = form[day.id] ?? { enabled: false, start: '08:00', end: '13:00' }
              const usableMinutes = value.enabled && isValidTime(value.start) && isValidTime(value.end)
                ? getUsableMinutes([timeToMinute(value.start), timeToMinute(value.end)])
                : 0
              return (
                <div key={day.id} className={cn(
                  'grid gap-3 rounded-xl border p-3 transition-colors sm:grid-cols-[150px_1fr_1fr] sm:items-center',
                  value.enabled ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-slate-50/60',
                )}>
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <Switch
                      id={`availability-${day.id}`}
                      checked={value.enabled}
                      onCheckedChange={(checked) => {
                        setForm((current) => ({ ...current, [day.id]: { ...value, enabled: checked } }))
                        setSaveError(null)
                      }}
                      aria-label={`${value.enabled ? 'Desactivar' : 'Activar'} ${day.label}`}
                    />
                    <label htmlFor={`availability-${day.id}`} className="flex-1 cursor-pointer text-sm font-semibold text-slate-900">{day.label}</label>
                    <span className={cn('text-xs sm:hidden', value.enabled ? 'text-blue-700' : 'text-slate-400')}>
                      {value.enabled ? (usableMinutes > 0 ? `${formatDuration(usableMinutes)} utilizables` : 'Fuera de jornada') : 'No disponible'}
                    </span>
                  </div>
                  <label className="grid grid-cols-[64px_1fr] items-center gap-2 text-xs text-slate-500 sm:block">
                    <span className="sm:sr-only">Desde</span>
                    <input
                      type="time"
                      value={value.start}
                      disabled={!value.enabled}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, [day.id]: { ...value, start: event.target.value } }))
                        setSaveError(null)
                      }}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium tabular-nums text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      aria-label={`Inicio ${day.label}`}
                    />
                  </label>
                  <label className="grid grid-cols-[64px_1fr] items-center gap-2 text-xs text-slate-500 sm:block">
                    <span className="sm:sr-only">Hasta</span>
                    <input
                      type="time"
                      value={value.end}
                      disabled={!value.enabled}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, [day.id]: { ...value, end: event.target.value } }))
                        setSaveError(null)
                      }}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium tabular-nums text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      aria-label={`Fin ${day.label}`}
                    />
                  </label>
                </div>
              )
            })}
            </div>

            {invalidDay && <FeedbackMessage tone="error">En {invalidDay.label}, ingresá un horario válido y asegurate de que la hora de fin sea posterior al inicio.</FeedbackMessage>}
            {editorOutsideDays.length > 0 && !invalidDay && (
              <FeedbackMessage tone="warning">
                {editorOutsideDays.map((day) => day.label).join(', ')} {editorOutsideDays.length === 1 ? 'queda' : 'quedan'} fuera de 08:00–13:00 y no aportará capacidad al planificador.
              </FeedbackMessage>
            )}
            {saveError && <FeedbackMessage tone="error" title="No se pudo guardar el horario">{saveError}</FeedbackMessage>}
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-white p-4 sm:items-center sm:justify-between sm:px-5">
            <p className="text-left text-xs text-slate-500">
              {hasChanges ? 'Tenés cambios sin guardar.' : 'No hay cambios pendientes.'}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => { setEditing(null); setSaveError(null) }} disabled={isSaving}>Cancelar</Button>
              <Button type="button" onClick={save} disabled={isSaving || Boolean(invalidDay) || !hasChanges}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
