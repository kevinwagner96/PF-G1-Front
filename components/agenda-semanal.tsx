'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Stethoscope, User, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Cirugia, mockCirugias, mockQuirofanos } from '@/lib/mock-data'
import PageHeader from './page-header'
import ViewCirugia from './view-cirugia-modal'

const statusClasses: Record<Cirugia['estado'], string> = {
  Pendiente: 'bg-slate-100 border-slate-400 text-slate-800', Programada: 'bg-blue-50 border-blue-500 text-blue-800',
  'En Curso': 'bg-amber-50 border-amber-500 text-amber-900', Completada: 'bg-emerald-50 border-emerald-500 text-emerald-800', Cancelada: 'bg-red-50 border-red-500 text-red-800',
}

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekDates(date: Date) {
  const start = new Date(date)
  const weekday = start.getDay()
  start.setDate(start.getDate() - weekday + (weekday === 0 ? -6 : 1))
  return Array.from({ length: 7 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day })
}

export default function AgendaSemanal() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [surgeries, setSurgeries] = useState<Cirugia[]>(() => [...mockCirugias])
  const [selected, setSelected] = useState<Cirugia | null>(null)
  const [assigning, setAssigning] = useState<Cirugia | null>(null)
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  const [assignment, setAssignment] = useState({ date: toDateInput(weekDates[0]), time: '08:00', roomId: '' })
  const pending = surgeries.filter((surgery) => surgery.estado === 'Pendiente')

  const navigateWeek = (direction: number) => setCurrentDate((value) => { const next = new Date(value); next.setDate(next.getDate() + direction * 7); return next })
  const openAssignment = (surgery: Cirugia) => {
    setAssigning(surgery)
    setAssignment({ date: toDateInput(weekDates[0]), time: '08:00', roomId: '' })
  }
  const saveAssignment = () => {
    if (!assigning || !assignment.date || !assignment.time || !assignment.roomId) return
    const room = mockQuirofanos.find((item) => item.id === assignment.roomId)
    setSurgeries((current) => current.map((surgery) => surgery.id === assigning.id ? { ...surgery, fecha: assignment.date, hora: assignment.time, quirofanoId: assignment.roomId, quirofano: room?.nombre ?? '', estado: 'Programada' } : surgery))
    setAssigning(null)
    toast({ title: 'Cirugía asignada', description: 'La agenda se actualizó correctamente.' })
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Agenda quirúrgica" title="Agenda semanal" description="Seleccione una cirugía para ver su detalle o asigne solicitudes pendientes a un horario disponible." actions={<div className="flex items-center gap-2"><button type="button" onClick={() => navigateWeek(-1)} aria-label="Semana anterior" className="rounded-lg p-2 hover:bg-muted"><ChevronLeft /></button><span className="min-w-48 text-center text-sm font-medium capitalize">{weekDates[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span><button type="button" onClick={() => navigateWeek(1)} aria-label="Semana siguiente" className="rounded-lg p-2 hover:bg-muted"><ChevronRight /></button><button type="button" onClick={() => setCurrentDate(new Date())} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Hoy</button></div>} />

    <div className="flex flex-wrap gap-4 rounded-lg border bg-card px-4 py-3 text-xs text-muted-foreground" aria-label="Leyenda de estados">{Object.entries(statusClasses).map(([status, classes]) => <span key={status} className="inline-flex items-center gap-2"><span className={`h-3 w-3 rounded-sm border-l-4 ${classes}`} />{status}</span>)}</div>

    <div className="flex gap-6">
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-7 border-b">{weekDates.map((date, index) => <div key={date.toISOString()} className={`border-r p-3 text-center last:border-r-0 ${date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''}`}><p className="text-xs font-medium uppercase text-muted-foreground">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}</p><p className="mt-1 text-lg font-bold">{date.getDate()}</p></div>)}</div>
        <div className="grid min-h-[500px] grid-cols-7">{weekDates.map((date) => {
          const daily = surgeries.filter((surgery) => surgery.fecha === toDateInput(date) && surgery.estado !== 'Pendiente').sort((a, b) => a.hora.localeCompare(b.hora))
          return <div key={date.toISOString()} className="border-r p-2 last:border-r-0"><div className="space-y-2">{daily.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Sin cirugías</p> : daily.map((surgery) => <button type="button" key={surgery.id} onClick={() => setSelected(surgery)} className={`w-full rounded-lg border-l-4 p-2 text-left text-xs transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${statusClasses[surgery.estado]}`}><span className="mb-1 flex items-center gap-1 font-semibold"><Clock size={12} />{surgery.hora}</span><span className="block truncate font-medium">{surgery.paciente}</span><span className="flex items-center gap-1 truncate opacity-75"><User size={10} />{surgery.cirujano}</span><span className="flex items-center gap-1 truncate opacity-75"><Stethoscope size={10} />{surgery.quirofano}</span></button>)}</div></div>
        })}</div>
      </div>

      <aside className="w-80 shrink-0 overflow-hidden rounded-xl border bg-card"><div className="border-b p-4"><h2 className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} className="text-amber-500" />Pendientes de asignación</h2><p className="mt-1 text-xs text-muted-foreground">{pending.length} cirugía{pending.length === 1 ? '' : 's'} sin programar</p></div><div className="max-h-[500px] space-y-3 overflow-y-auto p-4">{pending.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Todas las solicitudes están asignadas.</p> : pending.map((surgery) => <article key={surgery.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium text-amber-950">{surgery.paciente}</p><p className="text-xs text-amber-800">{surgery.intervencion}</p></div><span className="rounded bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">{surgery.prioridad}</span></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-amber-700">{surgery.tiempoEspera ?? 0} días de espera</span><button type="button" onClick={() => openAssignment(surgery)} className="font-semibold text-blue-700 hover:underline">Asignar</button></div></article>)}</div></aside>
    </div>

    {selected && <ViewCirugia cirugia={selected} onClose={() => setSelected(null)} />}
    {assigning && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="assign-title" className="w-full max-w-lg rounded-xl bg-card shadow-2xl"><div className="flex items-start justify-between border-b p-6"><div><h2 id="assign-title" className="text-xl font-bold">Asignar cirugía</h2><p className="mt-1 text-sm text-muted-foreground">{assigning.paciente} · {assigning.intervencion}</p></div><button type="button" onClick={() => setAssigning(null)} aria-label="Cerrar" className="rounded-lg p-2 hover:bg-muted"><X /></button></div><div className="grid grid-cols-2 gap-4 p-6"><label className="text-sm font-medium">Fecha *<input type="date" value={assignment.date} onChange={(event) => setAssignment((current) => ({ ...current, date: event.target.value }))} className="mt-2 w-full rounded-lg border bg-background p-2.5" /></label><label className="text-sm font-medium">Hora *<input type="time" value={assignment.time} onChange={(event) => setAssignment((current) => ({ ...current, time: event.target.value }))} className="mt-2 w-full rounded-lg border bg-background p-2.5" /></label><label className="col-span-2 text-sm font-medium">Quirófano *<select value={assignment.roomId} onChange={(event) => setAssignment((current) => ({ ...current, roomId: event.target.value }))} className="mt-2 w-full rounded-lg border bg-background p-2.5"><option value="">Seleccione un quirófano</option>{mockQuirofanos.filter((room) => room.disponible).map((room) => <option key={room.id} value={room.id}>{room.nombre} · piso {room.piso}</option>)}</select></label><p className="col-span-2 text-xs text-muted-foreground">Verifique la fecha, la hora y el quirófano antes de confirmar.</p></div><div className="flex justify-end gap-3 border-t p-5"><button type="button" onClick={() => setAssigning(null)} className="rounded-lg bg-muted px-4 py-2">Cancelar</button><button type="button" disabled={!assignment.date || !assignment.time || !assignment.roomId} onClick={saveAssignment} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">Confirmar asignación</button></div></div></div>}
  </div>
}
