'use client'

import { useMemo, useState } from 'react'
import { Edit2, Eye, ListFilter, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Cirugia, getCirujanos, mockCirugias, mockPersonal, mockQuirofanos, mockTiposCirugia } from '@/lib/mock-data'
import ConfirmActionDialog from './confirm-action-dialog'
import EditCirugia from './edit-cirugia-modal'
import EmptyState from './empty-state'
import PageHeader from './page-header'
import ProgramarModal, { ProgramarFormData } from './programar-modal'
import SurgeryStatusBadge from './surgery-status-badge'
import ViewCirugia from './view-cirugia-modal'
import WeeklyPlanningModal from './weekly-planning-modal'

type Filters = {
  search: string
  estado: string
  quirofano: string
  fechaDesde: string
  fechaHasta: string
  cirujano: string
}

const emptyFilters: Filters = { search: '', estado: '', quirofano: '', fechaDesde: '', fechaHasta: '', cirujano: '' }
const statuses = ['Pendiente', 'Programada', 'En Curso', 'Completada', 'Cancelada'] as const

function formatDateTime(surgery: Cirugia) {
  if (!surgery.fecha || !surgery.hora) return 'Sin programar'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(`${surgery.fecha}T${surgery.hora}`))
}

function getDuration(surgery: Cirugia) {
  if (surgery.hora && surgery.horaFin) {
    const [startHour, startMinute] = surgery.hora.split(':').map(Number)
    const [endHour, endMinute] = surgery.horaFin.split(':').map(Number)
    return `${endHour * 60 + endMinute - startHour * 60 - startMinute} min`
  }
  const procedure = mockTiposCirugia.find((item) => item.nombre === surgery.intervencion)
  return procedure ? `${procedure.duracionEstimada} min` : 'Sin definir'
}

export default function CirugiasTable() {
  const [surgeries, setSurgeries] = useState<Cirugia[]>(() => [...mockCirugias])
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Cirugia | null>(null)
  const [mode, setMode] = useState<'view' | 'edit' | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showPlanning, setShowPlanning] = useState(false)
  const [planningDecision, setPlanningDecision] = useState<'approved' | 'rejected' | null>(null)
  const surgeons = getCirujanos()

  const activeFiltersCount = [filters.estado, filters.quirofano, filters.fechaDesde, filters.fechaHasta, filters.cirujano].filter(Boolean).length
  const filtered = useMemo(() => surgeries.filter((surgery) => {
    const query = filters.search.trim().toLocaleLowerCase('es')
    if (query && !`${surgery.paciente} ${surgery.dni}`.toLocaleLowerCase('es').includes(query)) return false
    if (filters.estado && surgery.estado !== filters.estado) return false
    if (filters.quirofano && surgery.quirofanoId !== filters.quirofano) return false
    if (filters.fechaDesde && surgery.fecha && surgery.fecha < filters.fechaDesde) return false
    if (filters.fechaHasta && surgery.fecha && surgery.fecha > filters.fechaHasta) return false
    if (filters.cirujano && surgery.cirujanoId !== filters.cirujano) return false
    return true
  }), [filters, surgeries])

  const saveNew = (data: ProgramarFormData) => {
    const surgeon = mockPersonal.find((item) => item.id === data.cirujanoId)
    const anesthetist = mockPersonal.find((item) => item.id === data.anestesistaId)
    const instrumenter = mockPersonal.find((item) => item.id === data.instrumentadorId)
    const procedures = data.intervenciones.map((id) => mockTiposCirugia.find((item) => item.id === id)).filter(Boolean)
    const mainProcedure = procedures[0]
    const surgery: Cirugia = {
      id: `mock-surgery-${Date.now()}`,
      fecha: '', hora: '', pacienteId: data.pacienteId, paciente: data.pacienteNombre, dni: data.pacienteDni,
      prioridad: data.prioridad, servicio: mainProcedure?.especialidad ?? 'Sin definir', quirofanoId: '', quirofano: '',
      especialidad: mainProcedure?.especialidad ?? 'Sin definir', intervencion: procedures.map((item) => item?.nombre).join(', '),
      anestesia: 'Sin definir', cirujanoId: data.cirujanoId, cirujano: surgeon?.nombre ?? 'Sin asignar',
      anestesistaId: data.anestesistaId || undefined, anestesista: anesthetist?.nombre,
      instrumentadorId: data.instrumentadorId || undefined, instrumentador: instrumenter?.nombre,
      ayudantes: data.ayudantes.map((id) => mockPersonal.find((item) => item.id === id)?.nombre).filter((name): name is string => Boolean(name)),
      estado: 'Pendiente', insumos: data.insumos.map(({ nombre, cantidad }) => ({ nombre, cantidad })), observaciones: data.observaciones,
    }
    setSurgeries((current) => [surgery, ...current])
    toast({ title: 'Solicitud creada', description: 'Se agregó con estado Pendiente.' })
  }

  const saveEdit = (updated: Cirugia) => {
    setSurgeries((current) => current.map((item) => item.id === updated.id ? updated : item))
    setMode(null)
    setSelected(null)
    toast({ title: 'Cirugía actualizada', description: 'Los cambios se guardaron correctamente.' })
  }

  const cancel = () => {
    if (!cancelId) return
    setSurgeries((current) => current.map((item) => item.id === cancelId ? { ...item, estado: 'Cancelada' } : item))
    setCancelId(null)
    toast({ title: 'Cirugía cancelada', description: 'Permanece visible con estado Cancelada.' })
  }

  const approvePlanning = () => {
    const assignments = [
      { id: 'c11', fecha: '2026-08-17', hora: '08:00', horaFin: '09:30', quirofanoId: 'qf2', quirofano: 'Quirófano B' },
      { id: 'c12', fecha: '2026-08-18', hora: '09:30', horaFin: '10:15', quirofanoId: 'qf1', quirofano: 'Quirófano A' },
      { id: 'c13', fecha: '2026-08-19', hora: '11:00', horaFin: '12:00', quirofanoId: 'qf3', quirofano: 'Quirófano C' },
    ]
    setSurgeries((current) => current.map((surgery) => {
      const assignment = assignments.find((item) => item.id === surgery.id)
      return assignment ? { ...surgery, ...assignment, estado: 'Programada' as const } : surgery
    }))
    setPlanningDecision('approved')
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Gestión quirúrgica" title="Cirugías" description="Cree, revise y programe solicitudes quirúrgicas." actions={<><button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={17} />Nueva cirugía</button><button type="button" onClick={() => setShowPlanning(true)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-card px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"><Sparkles size={17} />{planningDecision ? 'Ver planificación' : 'Generar planificación'}</button></>} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[320px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
          <label htmlFor="surgery-search" className="sr-only">Buscar por paciente o DNI</label>
          <input id="surgery-search" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Buscar por paciente o DNI..." className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
        </div>
        <button type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${showFilters || activeFiltersCount ? 'bg-blue-100 text-blue-700' : 'bg-muted'}`}><ListFilter size={17} />Más filtros{activeFiltersCount > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{activeFiltersCount}</span>}</button>
        {(filters.search || activeFiltersCount > 0) && <button type="button" onClick={() => setFilters(emptyFilters)} className="inline-flex items-center gap-1 text-sm text-blue-700"><X size={15} />Limpiar</button>}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtros rápidos por estado">{statuses.map((status) => <button type="button" key={status} aria-pressed={filters.estado === status} onClick={() => setFilters((current) => ({ ...current, estado: current.estado === status ? '' : status }))} className={`rounded-full px-3 py-1.5 text-xs font-medium ${filters.estado === status ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{status}</button>)}</div>

      {showFilters && <div className="grid grid-cols-5 gap-4 rounded-xl border bg-card p-4">
        <FilterSelect id="operating-room-filter" label="Quirófano" value={filters.quirofano} onChange={(value) => setFilters((current) => ({ ...current, quirofano: value }))}><option value="">Todos</option>{mockQuirofanos.map((room) => <option key={room.id} value={room.id}>{room.nombre}</option>)}</FilterSelect>
        <FilterField id="date-from" label="Desde" type="date" value={filters.fechaDesde} onChange={(value) => setFilters((current) => ({ ...current, fechaDesde: value }))} />
        <FilterField id="date-to" label="Hasta" type="date" value={filters.fechaHasta} onChange={(value) => setFilters((current) => ({ ...current, fechaHasta: value }))} />
        <div className="col-span-2"><FilterSelect id="surgeon-filter" label="Cirujano" value={filters.cirujano} onChange={(value) => setFilters((current) => ({ ...current, cirujano: value }))}><option value="">Todos</option>{surgeons.map((surgeon) => <option key={surgeon.id} value={surgeon.id}>{surgeon.nombre}</option>)}</FilterSelect></div>
      </div>}

      <p className="text-sm text-muted-foreground">{filtered.length} resultado{filtered.length === 1 ? '' : 's'} de {surgeries.length} · {activeFiltersCount + (filters.search ? 1 : 0)} filtro{activeFiltersCount + (filters.search ? 1 : 0) === 1 ? '' : 's'} activo{activeFiltersCount + (filters.search ? 1 : 0) === 1 ? '' : 's'}</p>

      {filtered.length === 0 ? <EmptyState icon={Search} title="No hay cirugías para mostrar" description="No se encontraron resultados para la búsqueda y los filtros actuales." action={<button type="button" onClick={() => setFilters(emptyFilters)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Limpiar filtros</button>} /> : <div className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-sm"><thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Fecha y hora</th><th scope="col" className="px-4 py-3">Paciente</th><th scope="col" className="px-4 py-3">Intervención</th><th scope="col" className="px-4 py-3">Cirujano</th><th scope="col" className="px-4 py-3">Quirófano</th><th scope="col" className="px-4 py-3">Duración</th><th scope="col" className="px-4 py-3">Estado</th><th scope="col" className="px-4 py-3">Acciones</th></tr></thead><tbody className="divide-y">{filtered.map((surgery) => <tr key={surgery.id} className="hover:bg-muted/40"><td className="whitespace-nowrap px-4 py-4 font-medium">{formatDateTime(surgery)}</td><td className="px-4 py-4"><p className="font-medium">{surgery.paciente}</p><p className="text-xs text-muted-foreground">DNI {surgery.dni}</p></td><td className="px-4 py-4"><p>{surgery.intervencion}</p><p className="text-xs text-muted-foreground">{surgery.especialidad}</p></td><td className="px-4 py-4">{surgery.cirujano || 'Sin asignar'}</td><td className="px-4 py-4">{surgery.quirofano || 'Sin asignar'}</td><td className="px-4 py-4">{getDuration(surgery)}</td><td className="px-4 py-4"><SurgeryStatusBadge status={surgery.estado} /></td><td className="px-4 py-4"><div className="flex gap-2"><IconAction label="Ver cirugía" onClick={() => { setSelected(surgery); setMode('view') }}><Eye size={16} /></IconAction>{surgery.estado === 'Pendiente' && <IconAction label="Editar cirugía" tone="blue" onClick={() => { setSelected(surgery); setMode('edit') }}><Edit2 size={16} /></IconAction>}{(surgery.estado === 'Pendiente' || surgery.estado === 'Programada') && <IconAction label="Cancelar cirugía" tone="red" onClick={() => setCancelId(surgery.id)}><Trash2 size={16} /></IconAction>}</div></td></tr>)}</tbody></table></div></div>}

      {mode === 'view' && selected && <ViewCirugia cirugia={selected} onClose={() => { setMode(null); setSelected(null) }} />}
      {mode === 'edit' && selected && <EditCirugia cirugia={selected} onClose={() => { setMode(null); setSelected(null) }} onSave={saveEdit} />}
      {showCreate && <ProgramarModal onClose={() => setShowCreate(false)} onSave={saveNew} />}
      {showPlanning && <WeeklyPlanningModal onClose={() => setShowPlanning(false)} viewOnly={planningDecision === 'approved'} onApproved={approvePlanning} onRejected={() => setPlanningDecision('rejected')} />}
      <ConfirmActionDialog open={Boolean(cancelId)} onOpenChange={(open) => { if (!open) setCancelId(null) }} title="Cancelar cirugía" description="La cirugía permanecerá visible con estado Cancelada." confirmLabel="Confirmar cancelación" onConfirm={cancel} />
    </div>
  )
}

function IconAction({ label, onClick, tone = 'slate', children }: { label: string; onClick: () => void; tone?: 'slate' | 'blue' | 'red'; children: React.ReactNode }) {
  const colors = tone === 'blue' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : tone === 'red' ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={`rounded-md border p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${colors}`}>{children}</button>
}

function FilterField({ id, label, type, value, onChange }: { id: string; label: string; type: string; value: string; onChange: (value: string) => void }) {
  return <div><label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
}

function FilterSelect({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">{children}</select></div>
}
