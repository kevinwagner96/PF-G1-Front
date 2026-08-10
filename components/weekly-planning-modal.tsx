'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Check, LoaderCircle, Sparkles, X, XCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ConfirmActionDialog from './confirm-action-dialog'
import StatusBadge from './status-badge'

interface WeeklySurgery {
  id: string
  dia: string
  hora: string
  paciente: string
  especialidad: string
  cirujano: string
  sala: string
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

const generatedSurgeries: WeeklySurgery[] = [
  { id: 'p1', dia: 'Lunes', hora: '08:00', paciente: 'Patricia Vega', especialidad: 'Cirugía General', cirujano: 'Dr. Rodríguez', sala: 'Quirófano B' },
  { id: 'p2', dia: 'Martes', hora: '09:30', paciente: 'Alejandro Ríos', especialidad: 'Cirugía General', cirujano: 'Dr. Rodríguez', sala: 'Quirófano A' },
  { id: 'p3', dia: 'Miércoles', hora: '11:00', paciente: 'Natalia Castro', especialidad: 'Ginecología', cirujano: 'Dra. Rojas', sala: 'Quirófano C' },
]

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
      toast({ title: 'Planificación simulada generada', description: 'La propuesta está lista para revisar.' })
    }, 900)
  }

  const approve = () => {
    setDecision('approved')
    setConfirmApprove(false)
    onApproved?.()
    toast({ title: 'Planificación aprobada', description: 'Las cirugías simuladas pasaron a Programada durante esta sesión.' })
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
              <StatusBadge kind="planning" status={decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : phase === 'processing' ? 'planning' : phase === 'review' ? 'pending_approval' : 'simulation'} />
              <span className="text-xs font-medium text-muted-foreground">Planificación mock</span>
            </div>
            <h2 id="planning-title" className="text-2xl font-bold">Planificación semanal</h2>
            <p className="mt-1 text-sm text-muted-foreground">Semana del 17/11 al 21/11 · los resultados se restablecen al recargar.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar planificación" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6" aria-live="polite">
          {phase === 'preflight' && (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-xl border bg-blue-50 p-5">
                <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 text-blue-600" /><div><h3 className="font-semibold text-blue-950">Datos listos para la simulación</h3><p className="mt-1 text-sm text-blue-800">Se distribuirán solicitudes pendientes en los recursos mock disponibles.</p></div></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Solicitudes" value="4" detail="3 válidas" />
                <SummaryCard label="Quirófanos" value="4" detail="disponibles" />
                <SummaryCard label="Cirujanos" value="8" detail="activos" />
              </div>
              <div className="rounded-xl border p-5"><h3 className="font-semibold">Bloqueos detectados</h3><p className="mt-2 text-sm text-muted-foreground">1 solicitud no se asignará porque su cirujano figura inactivo en los datos simulados.</p></div>
            </div>
          )}

          {phase === 'processing' && (
            <div className="grid min-h-96 place-items-center text-center">
              <div><LoaderCircle className="mx-auto mb-4 animate-spin text-blue-600" size={44} /><h3 className="text-xl font-semibold">Generando propuesta simulada</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">Se están evaluando disponibilidad, horarios y recursos. Esta vista se actualizará automáticamente.</p></div>
            </div>
          )}

          {phase === 'review' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <SummaryCard label="Asignadas" value="3" detail="de 4" />
                <SummaryCard label="No asignadas" value="1" detail="solicitud" />
                <SummaryCard label="Utilización" value="68%" detail="promedio simulado" />
                <SummaryCard label="Duración" value="4 h 30 min" detail="planificada" />
              </div>
              <div className="grid grid-cols-5 gap-3">
                {daysOfWeek.map((day) => (
                  <section key={day} className="min-h-72 rounded-xl border bg-muted/30 p-3">
                    <h3 className="border-b pb-2 font-semibold">{day}</h3>
                    <div className="mt-3 space-y-3">
                      {groupedByDay[day].length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">Sin cirugías asignadas</p> : groupedByDay[day].map((surgery) => (
                        <article key={surgery.id} className="rounded-lg border-l-4 border-l-blue-500 bg-card p-3 text-xs shadow-sm">
                          <p className="font-semibold text-blue-700">{surgery.hora} · {surgery.sala}</p>
                          <p className="mt-2 font-medium">{surgery.paciente}</p>
                          <p className="mt-1 text-muted-foreground">{surgery.especialidad}</p>
                          <p className="text-muted-foreground">{surgery.cirujano}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Cirugías no asignadas (1)</summary><p className="mt-3 text-sm text-muted-foreground">Fernando Luna · Prostatectomía. El conjunto mock indica que no fue posible asignarla en esta propuesta.</p></details>
              {decision && <div className={`rounded-xl border p-4 text-sm ${decision === 'approved' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>La propuesta fue {decision === 'approved' ? 'aprobada' : 'rechazada'} en esta sesión simulada.</div>}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-card p-5">
          <button type="button" onClick={onClose} className="rounded-lg bg-muted px-4 py-2 font-medium">Cerrar</button>
          {phase === 'preflight' && <button type="button" onClick={generate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"><Sparkles size={18} />Generar propuesta</button>}
          {phase === 'review' && !viewOnly && !decision && <div className="flex gap-2"><button type="button" onClick={() => setRejectOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-medium text-red-700"><XCircle size={18} />Rechazar con motivo</button><button type="button" onClick={() => setConfirmApprove(true)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white"><Check size={18} />Aprobar planificación</button></div>}
        </footer>
        </div>
      </div>

      <ConfirmActionDialog open={confirmApprove} onOpenChange={setConfirmApprove} title="Aprobar planificación simulada" description="Las solicitudes asignadas pasarán a estado Programada durante esta sesión. El cambio se perderá al recargar." confirmLabel="Aprobar planificación" onConfirm={approve} />

      {rejectOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="reject-title" className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl"><h3 id="reject-title" className="text-lg font-semibold">Rechazar propuesta</h3><p className="mt-2 text-sm text-muted-foreground">Indique un motivo para que el administrador pueda corregir las solicitudes.</p><label htmlFor="reject-reason" className="mt-4 block text-sm font-medium">Motivo *</label><textarea id="reject-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border bg-background p-3" aria-invalid={!reason.trim()} /><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setRejectOpen(false)} className="rounded-lg bg-muted px-4 py-2">Cancelar</button><button type="button" disabled={!reason.trim()} onClick={reject} className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50">Confirmar rechazo</button></div></div></div>}
    </>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></div>
}
