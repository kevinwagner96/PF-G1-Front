'use client'

import { useMemo, useState } from 'react'
import { Calendar, Check, Clock, Edit3, FileText, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Cirugia, mockCirugias } from '@/lib/mock-data'
import ConfirmActionDialog from './confirm-action-dialog'
import EmptyState from './empty-state'
import PageHeader from './page-header'
import SurgeryStatusBadge from './surgery-status-badge'
import ViewCirugia from './view-cirugia-modal'

type Tab = 'pendientes' | 'programadas' | 'historial'
type Request = { surgeryIds: string[]; action: 'reprogramar' | 'cancelar' | 'cambiar_equipo'; date: string; time: string; reason: string }

const emptyRequest: Request = { surgeryIds: [], action: 'reprogramar', date: '', time: '', reason: '' }

export default function MiAgendaCirujano() {
  const [surgeries, setSurgeries] = useState<Cirugia[]>(() => mockCirugias.filter((surgery) => surgery.cirujanoId === 'p3'))
  const [approvedIds, setApprovedIds] = useState<string[]>([])
  const [tab, setTab] = useState<Tab>('pendientes')
  const [selected, setSelected] = useState<Cirugia | null>(null)
  const [approveId, setApproveId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [request, setRequest] = useState<Request>(emptyRequest)

  const groups = useMemo(() => ({
    pendientes: surgeries.filter((surgery) => surgery.estado === 'Programada' && !approvedIds.includes(surgery.id)),
    programadas: surgeries.filter((surgery) => (surgery.estado === 'Programada' && approvedIds.includes(surgery.id)) || surgery.estado === 'En Curso'),
    historial: surgeries.filter((surgery) => surgery.estado === 'Completada' || surgery.estado === 'Cancelada'),
  }), [approvedIds, surgeries])

  const approve = () => {
    if (!approveId) return
    setApprovedIds((ids) => [...ids, approveId])
    setApproveId(null)
    toast({ title: 'Asignación aprobada', description: 'La cirugía pasó a Mis cirugías programadas.' })
  }
  const reject = () => {
    if (!rejectId || !rejectReason.trim()) return
    setSurgeries((current) => current.map((surgery) => surgery.id === rejectId ? { ...surgery, estado: 'Cancelada', observaciones: `Rechazo: ${rejectReason.trim()}` } : surgery))
    setRejectId(null)
    setRejectReason('')
    toast({ title: 'Asignación rechazada', description: 'Se registró el motivo y la cirugía pasó al historial.' })
  }
  const submitRequest = () => {
    toast({ title: 'Solicitud enviada', description: 'El cambio quedó registrado.' })
    setRequest(emptyRequest)
    setRequestOpen(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pendientes', label: 'Pendientes de aprobación' },
    { id: 'programadas', label: 'Mis cirugías programadas' },
    { id: 'historial', label: 'Historial' },
  ]
  const current = groups[tab]

  return <div className="space-y-6">
    <PageHeader eyebrow="Perfil · Dr. Rodríguez" title="Mi agenda" description="Revise asignaciones sin duplicados entre pestañas y registre sus decisiones." actions={<button type="button" onClick={() => setRequestOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Edit3 size={18} />Solicitar modificación</button>} />

    <div role="tablist" aria-label="Secciones de la agenda" className="flex gap-2 border-b">{tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} key={item.id} onClick={() => setTab(item.id)} className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === item.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-muted-foreground'}`}>{item.label}<span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === item.id ? 'bg-blue-100 text-blue-700' : 'bg-muted'}`}>{groups[item.id].length}</span></button>)}</div>

    {current.length === 0 ? <EmptyState icon={FileText} title="No hay cirugías en esta sección" description={tab === 'pendientes' ? 'No quedan asignaciones pendientes de una decisión.' : 'Las acciones realizadas aparecerán aquí cuando corresponda.'} /> : <div className="space-y-4">{current.map((surgery) => <article key={surgery.id} className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"><button type="button" onClick={() => setSelected(surgery)} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><div className="flex items-start justify-between"><div><div className="flex items-center gap-3"><h3 className="text-lg font-semibold">{surgery.paciente}</h3><SurgeryStatusBadge status={surgery.estado} /></div><p className="mt-2 text-muted-foreground">{surgery.intervencion}</p><div className="mt-3 flex gap-6 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Calendar size={14} />{surgery.fecha || 'Sin fecha'}</span><span className="inline-flex items-center gap-1.5"><Clock size={14} />{surgery.hora || 'Sin hora'}</span><span>{surgery.quirofano || 'Sin quirófano'}</span></div></div><span className="text-xs text-blue-700">Ver detalle</span></div></button>{tab === 'pendientes' && <div className="mt-4 flex gap-2 border-t pt-4"><button type="button" onClick={() => setApproveId(surgery.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800"><Check size={14} />Aprobar</button><button type="button" onClick={() => { setRequest((value) => ({ ...value, surgeryIds: [surgery.id] })); setRequestOpen(true) }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800"><Edit3 size={14} />Solicitar cambio</button><button type="button" onClick={() => setRejectId(surgery.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-800"><X size={14} />Rechazar</button></div>}</article>)}</div>}

    {selected && <ViewCirugia cirugia={selected} onClose={() => setSelected(null)} />}
    <ConfirmActionDialog open={Boolean(approveId)} onOpenChange={(open) => { if (!open) setApproveId(null) }} title="Aprobar asignación" description="La cirugía pasará a Mis cirugías programadas." confirmLabel="Aprobar asignación" tone="primary" onConfirm={approve} />

    {rejectId && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="agenda-reject-title" className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl"><h2 id="agenda-reject-title" className="text-xl font-bold">Rechazar asignación</h2><p className="mt-2 text-sm text-muted-foreground">El motivo es obligatorio y quedará visible en el historial.</p><label htmlFor="agenda-reject-reason" className="mt-4 block text-sm font-medium">Motivo *</label><textarea id="agenda-reject-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border bg-background p-3" /><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => { setRejectId(null); setRejectReason('') }} className="rounded-lg bg-muted px-4 py-2">Cancelar</button><button type="button" disabled={!rejectReason.trim()} onClick={reject} className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50">Confirmar rechazo</button></div></div></div>}

    {requestOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="request-title" className="w-full max-w-lg rounded-xl bg-card shadow-2xl"><div className="border-b p-6"><h2 id="request-title" className="text-xl font-bold">Solicitar modificación</h2><p className="mt-1 text-sm text-muted-foreground">Complete los datos de la modificación solicitada.</p></div><div className="space-y-5 p-6"><fieldset><legend className="mb-2 text-sm font-medium">Cirugías afectadas *</legend><div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">{groups.programadas.map((surgery) => <label key={surgery.id} className="flex items-center gap-2 rounded p-2 text-sm hover:bg-muted"><input type="checkbox" checked={request.surgeryIds.includes(surgery.id)} onChange={() => setRequest((value) => ({ ...value, surgeryIds: value.surgeryIds.includes(surgery.id) ? value.surgeryIds.filter((id) => id !== surgery.id) : [...value.surgeryIds, surgery.id] }))} />{surgery.paciente} · {surgery.fecha} {surgery.hora}</label>)}{groups.programadas.length === 0 && <p className="p-3 text-sm text-muted-foreground">Primero apruebe una asignación.</p>}</div></fieldset><label className="block text-sm font-medium">Acción *<select value={request.action} onChange={(event) => setRequest((value) => ({ ...value, action: event.target.value as Request['action'] }))} className="mt-2 w-full rounded-lg border bg-background p-2.5"><option value="reprogramar">Reprogramar</option><option value="cancelar">Cancelar</option><option value="cambiar_equipo">Cambiar equipo médico</option></select></label>{request.action === 'reprogramar' && <div className="grid grid-cols-2 gap-4"><label className="text-sm font-medium">Nueva fecha<input type="date" value={request.date} onChange={(event) => setRequest((value) => ({ ...value, date: event.target.value }))} className="mt-2 w-full rounded-lg border p-2.5" /></label><label className="text-sm font-medium">Nueva hora<input type="time" value={request.time} onChange={(event) => setRequest((value) => ({ ...value, time: event.target.value }))} className="mt-2 w-full rounded-lg border p-2.5" /></label></div>}<label className="block text-sm font-medium">Justificación *<textarea value={request.reason} onChange={(event) => setRequest((value) => ({ ...value, reason: event.target.value }))} rows={4} className="mt-2 w-full rounded-lg border p-3" /></label></div><div className="flex justify-end gap-3 border-t p-5"><button type="button" onClick={() => setRequestOpen(false)} className="rounded-lg bg-muted px-4 py-2">Cancelar</button><button type="button" disabled={request.surgeryIds.length === 0 || !request.reason.trim()} onClick={submitRequest} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">Enviar solicitud</button></div></div></div>}
  </div>
}
