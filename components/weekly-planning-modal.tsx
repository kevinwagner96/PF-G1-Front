'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Check, Clock3, Gauge, LoaderCircle, ListChecks, Sparkles, Timer, X, XCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ConfirmActionDialog from './confirm-action-dialog'
import StatusBadge from './status-badge'

interface WeeklySurgery {
  id: string
  dia: string
  hora: string
  duracion: number
  paciente: string
  especialidad: string
  cirujano: string
  sala: string
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const roomNames = ['Quirófano 1', 'Quirófano 2', 'Quirófano 3']

const schedulePlan = [
  { dia: 'Lunes', especialidades: ['Traumatología', 'Cirugía General', 'Urología'], cantidades: [2, 1, 3], inicios: [0, 60, 30] },
  { dia: 'Martes', especialidades: ['Traumatología', 'Traumatología', 'Neurocirugía'], cantidades: [1, 2, 2], inicios: [90, 0, 30] },
  { dia: 'Miércoles', especialidades: ['Cirugía General', 'Urología', 'Traumatología'], cantidades: [3, 2, 2], inicios: [0, 60, 90] },
  { dia: 'Jueves', especialidades: ['Neurocirugía', 'Cirugía General', 'Traumatología'], cantidades: [2, 3, 1], inicios: [60, 0, 90] },
  { dia: 'Viernes', especialidades: ['Traumatología', 'Urología', 'Cirugía General'], cantidades: [2, 2, 2], inicios: [0, 90, 30] },
] as const

const patientNames = ['Juan Martínez', 'Claudia Moreno', 'Ana López', 'Carlos Ruiz', 'Lucía Gómez', 'Pedro Sánchez', 'Patricia Vega', 'Alejandro Ríos', 'Natalia Castro', 'Fernando Luna', 'Gabriela Mendoza', 'Roberto García', 'Laura Fernández', 'Oscar Navarro', 'Diego Torres', 'María Fernández', 'Sergio Romero', 'Verónica Herrera', 'Luciana Ortiz', 'Gabriela Méndez', 'Martín Díaz', 'Claudia Ríos', 'Tomás Molina', 'Carolina Suárez', 'Hernán Acosta', 'Sofía Núñez', 'Valentina Castro', 'Nicolás Vera', 'Micaela Sosa', 'Federico Paz']
const surgeonsBySpecialty: Record<string, string> = { 'Traumatología': 'Dr. Pérez', 'Cirugía General': 'Dra. Sosa', 'Urología': 'Dr. Vargas', 'Neurocirugía': 'Dra. Rojas' }

let patientIndex = 0
const generatedSurgeries: WeeklySurgery[] = schedulePlan.flatMap((dayPlan, dayIndex) => dayPlan.especialidades.flatMap((especialidad, roomIndex) => {
  let startMinutes = 8 * 60 + dayPlan.inicios[roomIndex]
  return Array.from({ length: dayPlan.cantidades[roomIndex] }, (_, slotIndex) => {
    const duracion = [120, 90, 120][(slotIndex + roomIndex) % 3]
    const surgery = { id: `p-${dayIndex}-${roomIndex}-${slotIndex}`, dia: dayPlan.dia, hora: formatClock(startMinutes), duracion, paciente: patientNames[patientIndex++], especialidad, cirujano: surgeonsBySpecialty[especialidad], sala: roomNames[roomIndex] }
    startMinutes += duracion
    return surgery
  })
}))

interface WeeklyPlanningModalProps {
  onClose: () => void
  viewOnly?: boolean
  onApproved?: () => void
  onRejected?: (reason: string) => void
}

export default function WeeklyPlanningModal({ onClose, viewOnly = false, onApproved, onRejected }: WeeklyPlanningModalProps) {
  const [phase, setPhase] = useState<'preflight' | 'processing' | 'review'>(viewOnly ? 'review' : 'preflight')
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const groupedByDay = useMemo(() => Object.fromEntries(
    daysOfWeek.map((day) => [day, phase === 'review' ? generatedSurgeries.filter((surgery) => surgery.dia === day) : []])
  ) as Record<string, WeeklySurgery[]>, [phase])

  const generate = () => {
    setPhase('processing')
    window.setTimeout(() => {
      setPhase('review')
      toast({ title: 'Planificación generada', description: 'La propuesta está lista para revisar.' })
    }, 3000)
  }

  const approve = () => {
    setDecision('approved')
    setConfirmApprove(false)
    onApproved?.()
    toast({ title: 'Planificación aprobada', description: 'Las cirugías pasaron a estado Programada.' })
  }

  const reject = () => {
    const normalizedReason = reason.trim()
    if (!normalizedReason) return
    setDecision('rejected')
    setRejectOpen(false)
    onRejected?.(normalizedReason)
    toast({ title: 'Planificación rechazada', description: 'Puede corregir las solicitudes y generar una nueva propuesta.' })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="planning-title" className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge kind="planning" status={decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : phase === 'processing' ? 'planning' : phase === 'review' ? 'pending_approval' : 'ready'} />
              <span className="text-xs font-medium text-muted-foreground">Propuesta quirúrgica</span>
            </div>
            <h2 id="planning-title" className="text-2xl font-bold">Generar planificación semanal</h2>
            <p className="mt-1 text-sm text-muted-foreground">35 cirugías pendientes para planificar esta semana.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar planificación" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6" aria-live="polite">
          {phase === 'review' && <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><Clock3 size={18} aria-hidden="true" />Esta planificación está pendiente de aprobación del cirujano.</div>}
          {phase === 'preflight' && (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-xl border bg-blue-50 p-5">
                <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 text-blue-600" /><div><h3 className="font-semibold text-blue-950">Datos listos para la planificación</h3><p className="mt-1 text-sm text-blue-800">Se distribuirán solicitudes pendientes en los recursos disponibles.</p></div></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Solicitudes" value="35" detail="30 válidas" />
                <SummaryCard label="Quirófanos" value="3" detail="por jornada" />
                <SummaryCard label="Cirujanos" value="8" detail="activos" />
              </div>
              <div className="rounded-xl border p-5"><h3 className="font-semibold">Bloqueos detectados</h3><p className="mt-2 text-sm text-muted-foreground">5 solicitudes quedarán fuera de la propuesta por restricciones de disponibilidad.</p></div>
              <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center"><h3 className="text-lg font-semibold">Todavía no hay una planificación para esta semana</h3><p className="mt-2 text-sm text-muted-foreground">Generá una propuesta para distribuir las cirugías en los tres quirófanos.</p>{!viewOnly && <button type="button" onClick={generate} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"><Sparkles size={18} />Generar planificación</button>}</div>
            </div>
          )}

          {phase === 'processing' && (
            <div className="grid min-h-96 place-items-center text-center">
              <div><LoaderCircle className="mx-auto mb-4 animate-spin text-blue-600" size={44} /><h3 className="text-xl font-semibold">Generando propuesta</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">Se están evaluando disponibilidad, horarios y recursos. Esta vista se actualizará automáticamente.</p></div>
            </div>
          )}

          {phase === 'review' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <KpiCard icon={ListChecks} label="Programadas" value="30" detail="de 35 solicitudes" tone="slate" />
                <KpiCard icon={CalendarDays} label="Quedan afuera" value="5" detail="solicitudes" tone="amber" />
                <KpiCard icon={Gauge} label="Utilización prom." value="92%" detail="promedio semanal" tone="emerald" />
                <KpiCard icon={Timer} label="Ejecución" value="3.0 s" detail="tiempo de generación" tone="slate" />
              </div>
              <SpecialtyLegend />
              <div className="space-y-5"><TimelineRoom room="Quirófano 1" groupedByDay={groupedByDay} /><TimelineRoom room="Quirófano 2" groupedByDay={groupedByDay} /><TimelineRoom room="Quirófano 3" groupedByDay={groupedByDay} /></div>
              <details className="rounded-xl border border-amber-200 bg-amber-50 p-4"><summary className="cursor-pointer font-semibold text-amber-900">5 quedan afuera</summary><p className="mt-3 text-sm text-amber-800">Tocá para ver las cirugías no incluidas en esta propuesta.</p></details>
              {decision && <div className={`rounded-xl border p-4 text-sm ${decision === 'approved' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>La propuesta fue {decision === 'approved' ? 'aprobada' : 'rechazada'}.</div>}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-card p-5">
          <button type="button" onClick={onClose} className="rounded-lg bg-muted px-4 py-2 font-medium">Cerrar</button>
          {phase === 'review' && !viewOnly && !decision && <div className="flex gap-2"><button type="button" onClick={() => setRejectOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-medium text-red-700"><XCircle size={18} />Rechazar con motivo</button><button type="button" onClick={() => setConfirmApprove(true)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"><Check size={18} />Aprobar planificación</button></div>}
        </footer>
        </div>
      </div>

      <ConfirmActionDialog open={confirmApprove} onOpenChange={setConfirmApprove} title="Aprobar planificación" description="Las solicitudes asignadas pasarán a estado Programada." confirmLabel="Aprobar planificación" onConfirm={approve} tone="success" />

      {rejectOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="reject-title" className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl"><h3 id="reject-title" className="text-lg font-semibold">Rechazar propuesta</h3><p className="mt-2 text-sm text-muted-foreground">Indique un motivo para que el administrador pueda corregir las solicitudes.</p><label htmlFor="reject-reason" className="mt-4 block text-sm font-medium">Motivo *</label><textarea id="reject-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border bg-background p-3" aria-invalid={!reason.trim()} /><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setRejectOpen(false)} className="rounded-lg bg-muted px-4 py-2">Cancelar</button><button type="button" disabled={!reason.trim()} onClick={reject} className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50">Confirmar rechazo</button></div></div></div>}
    </>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></div>
}

function KpiCard({ icon: Icon, label, value, detail, tone }: { icon: typeof ListChecks; label: string; value: string; detail: string; tone: 'slate' | 'amber' | 'emerald' }) {
  const toneClasses = tone === 'amber' ? 'text-amber-500' : tone === 'emerald' ? 'text-emerald-500' : 'text-slate-400'
  return <div className="rounded-2xl border bg-card p-5"><div className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${toneClasses}`}><Icon size={20} />{label}</div><p className="mt-3 text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-400">{detail}</p></div>
}

function SpecialtyLegend() {
  const specialties = [
    ['Oftalmología', 'bg-cyan-500'],
    ['Ginecología', 'bg-rose-500'],
    ['Traumatología', 'bg-blue-500'],
    ['Cirugía General', 'bg-emerald-500'],
    ['Urología', 'bg-amber-500'],
    ['Neurocirugía', 'bg-violet-500'],
  ]
  return <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border bg-card px-5 py-4"><span className="text-sm font-semibold uppercase tracking-wide text-slate-400">Especialidades</span>{specialties.map(([label, color]) => <span key={label} className="inline-flex items-center gap-2 text-sm text-slate-600"><span className={`h-3 w-3 rounded-full ${color}`} />{label}</span>)}</div>
}

function TimelineRoom({ room, groupedByDay }: { room: string; groupedByDay: Record<string, WeeklySurgery[]> }) {
  const roomTone = room === 'Quirófano 1' ? 'bg-indigo-500' : room === 'Quirófano 2' ? 'bg-violet-500' : 'bg-cyan-500'
  return <section className="overflow-hidden rounded-2xl border bg-card">
    <header className="flex items-center gap-3 border-b bg-card px-5 py-4 text-lg font-semibold"><span className={`h-3 w-3 rounded-full ${roomTone}`} />{room}</header>
    <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]">
      <div aria-hidden="true" />
      {daysOfWeek.map((day) => <h3 key={day} className="border-b border-l px-4 py-3 font-semibold text-slate-700">{day}</h3>)}
      <TimeAxis />
      {daysOfWeek.map((day) => <TimelineDay key={day} surgeries={groupedByDay[day].filter((surgery) => surgery.sala === room)} />)}
    </div>
  </section>
}

function TimeAxis() {
  const hours = Array.from({ length: 8 }, (_, index) => index + 8)
  return <div className="relative h-[420px] border-r bg-card text-[11px] text-slate-400">{hours.map((hour, index) => <span key={hour} className={`absolute right-2 ${index === 0 ? 'translate-y-0' : index === hours.length - 1 ? '-translate-y-full' : '-translate-y-1/2'}`} style={{ top: `${(index / (hours.length - 1)) * 100}%` }}>{String(hour).padStart(2, '0')}:00</span>)}</div>
}

function TimelineDay({ surgeries }: { surgeries: WeeklySurgery[] }) {
  const hours = Array.from({ length: 8 }, (_, index) => index)
  return <div className="relative h-[420px] overflow-hidden border-l bg-white">{hours.map((hour) => <span key={hour} className="absolute inset-x-0 border-t border-dashed border-slate-200" style={{ top: `${(hour / 7) * 100}%` }} />)}{surgeries.map((surgery) => <TimelineSurgery key={surgery.id} surgery={surgery} />)}</div>
}

function TimelineSurgery({ surgery }: { surgery: WeeklySurgery }) {
  const startMinutes = toMinutes(surgery.hora)
  const top = ((startMinutes - 8 * 60) / (7 * 60)) * 100
  const height = (surgery.duracion / (7 * 60)) * 100
  const compact = surgery.duracion <= 90
  return <article className={`absolute inset-x-3 overflow-hidden rounded-xl border shadow-sm ${compact ? 'p-2 text-[11px]' : 'p-3 text-xs'} ${getSpecialtyClasses(surgery.especialidad)}`} style={{ top: `calc(${top}% + 4px)`, height: `calc(${height}% - 8px)` }}><div className="flex items-center justify-between gap-1 font-semibold"><span>{surgery.hora} - {formatTime(surgery.hora, surgery.duracion)}</span><span className="text-slate-400">{surgery.duracion}′</span></div><p className="mt-1 font-semibold text-slate-800">{surgery.paciente}</p><p className="text-slate-500">{surgery.cirujano}</p><p className="mt-1 flex items-center gap-1 text-slate-500"><span className={`h-2 w-2 rounded-full ${getSpecialtyDot(surgery.especialidad)}`} />{surgery.especialidad}</p></article>
}

function formatClock(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTime(start: string, duration: number) {
  const [hours, minutes] = start.split(':').map(Number)
  const end = hours * 60 + minutes + duration
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
}

function getSpecialtyClasses(specialty: string) {
  if (specialty === 'Cirugía General') return 'border-emerald-100 bg-emerald-50'
  if (specialty === 'Traumatología') return 'border-blue-100 bg-blue-50'
  if (specialty === 'Urología') return 'border-amber-100 bg-amber-50'
  if (specialty === 'Ginecología') return 'border-rose-100 bg-rose-50'
  if (specialty === 'Oftalmología') return 'border-cyan-100 bg-cyan-50'
  if (specialty === 'Neurocirugía') return 'border-violet-100 bg-violet-50'
  return 'border-violet-100 bg-violet-50'
}

function getSpecialtyDot(specialty: string) {
  if (specialty === 'Cirugía General') return 'bg-emerald-500'
  if (specialty === 'Traumatología') return 'bg-blue-500'
  if (specialty === 'Urología') return 'bg-amber-500'
  if (specialty === 'Ginecología') return 'bg-rose-500'
  if (specialty === 'Oftalmología') return 'bg-cyan-500'
  if (specialty === 'Neurocirugía') return 'bg-violet-500'
  return 'bg-violet-500'
}
