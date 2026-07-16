'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, Eye, Trash2, Edit2, Search, X, Plus, Sparkles, ListFilter } from 'lucide-react'
import ViewCirugia from './view-cirugia-modal'
import EditCirugia from './edit-cirugia-modal'
import ProgramarModal from './programar-modal'
import WeeklyPlanningModal from './weekly-planning-modal'
import SurgeryStatusBadge from './surgery-status-badge'
import { mockCirugias as initialCirugias, mockQuirofanos, getCirujanos, Cirugia } from '@/lib/mock-data'

const formatDateTime = (cirugia: Cirugia) => {
  if (!cirugia.fecha || !cirugia.hora) return 'Sin programar'

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(`${cirugia.fecha}T${cirugia.hora}`))
}

export default function CirugiasTable() {
  const [cirugias, setCirugias] = useState<Cirugia[]>(initialCirugias)
  const [selectedCirugia, setSelectedCirugia] = useState<Cirugia | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null)
  const [cancelSurgeryId, setCancelSurgeryId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showProgramarModal, setShowProgramarModal] = useState(false)
  const [showWeeklyPlanning, setShowWeeklyPlanning] = useState(false)

  // Filtros
  const [filters, setFilters] = useState({
    estado: '',
    quirofano: '',
    fechaDesde: '',
    fechaHasta: '',
    dniPaciente: '',
    cirujano: '',
  })

  const cirujanos = getCirujanos()

  const filteredCirugias = useMemo(() => {
    return cirugias.filter(c => {
      if (filters.estado && c.estado !== filters.estado) return false
      if (filters.quirofano && c.quirofanoId !== filters.quirofano) return false
      if (filters.fechaDesde && c.fecha && c.fecha < filters.fechaDesde) return false
      if (filters.fechaHasta && c.fecha && c.fecha > filters.fechaHasta) return false
      if (filters.dniPaciente && !c.dni.includes(filters.dniPaciente)) return false
      if (filters.cirujano && c.cirujanoId !== filters.cirujano) return false
      return true
    })
  }, [cirugias, filters])

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length

  const clearFilters = () => {
    setFilters({
      estado: '',
      quirofano: '',
      fechaDesde: '',
      fechaHasta: '',
      dniPaciente: '',
      cirujano: '',
    })
  }

  const canCancel = (estado: string) => {
    return estado === 'Programada' || estado === 'Pendiente'
  }

  const handleCancel = (cirugia: Cirugia) => {
    setCirugias(cirugias.map((item) => (
      item.id === cirugia.id ? { ...item, estado: 'Cancelada' } : item
    )))
    setCancelSurgeryId(null)
  }

  const handleSaveEdit = (updatedCirugia: Cirugia) => {
    setCirugias(cirugias.map((c) => (c.id === updatedCirugia.id ? updatedCirugia : c)))
    setViewMode(null)
    setSelectedCirugia(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lista de Cirugias</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestione y programe cirugias en tiempo real</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowProgramarModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus size={16} />
            Nueva cirugía
          </button>
          <button
            type="button"
            onClick={() => setShowWeeklyPlanning(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Sparkles size={16} />
            Generar planificación
          </button>
        </div>
      </div>

      {/* Filtros Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showFilters || activeFiltersCount > 0 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          <ListFilter size={18} />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        )}
        {/* Status quick filters */}
        <div className="flex gap-2 ml-auto">
          {['Pendiente', 'Programada', 'En Curso', 'Completada', 'Cancelada'].map((status) => (
            <button
              key={status}
              onClick={() => setFilters(prev => ({ ...prev, estado: prev.estado === status ? '' : status }))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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

      {/* Panel de filtros expandido */}
      {showFilters && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Estado */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Programada">Programada</option>
                <option value="En Curso">En Curso</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            {/* Quirofano */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Quirofano</label>
              <select
                value={filters.quirofano}
                onChange={(e) => setFilters(prev => ({ ...prev, quirofano: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {mockQuirofanos.map(q => (
                  <option key={q.id} value={q.id}>{q.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha desde</label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha hasta</label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* DNI Paciente */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">DNI Paciente</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  value={filters.dniPaciente}
                  onChange={(e) => setFilters(prev => ({ ...prev, dniPaciente: e.target.value }))}
                  placeholder="Buscar DNI..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Cirujano */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Cirujano</label>
              <select
                value={filters.cirujano}
                onChange={(e) => setFilters(prev => ({ ...prev, cirujano: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {cirujanos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
                  <td className="px-4 py-4 font-medium text-foreground">{formatDateTime(cirugia)}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">{cirugia.paciente}</div>
                    <div className="text-xs text-muted-foreground">DNI {cirugia.dni}</div>
                  </td>
                  <td className="px-4 py-4 text-foreground">{cirugia.especialidad}</td>
                  <td className="px-4 py-4 text-foreground">{cirugia.intervencion || 'Sin intervenciones'}</td>
                  <td className="px-4 py-4 text-foreground">{cirugia.quirofano || 'Sin sala'}</td>
                  <td className="px-4 py-4 text-foreground">{cirugia.anestesia || 'Sin definir'}</td>
                  <td className="px-4 py-4">
                    <SurgeryStatusBadge status={cirugia.estado} />
                  </td>
                  <td className="px-4 py-4 text-foreground">Sin opciones</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCirugia(cirugia)
                          setViewMode('view')
                        }}
                        aria-label="Ver cirugía"
                        title="Ver cirugía"
                        className="inline-flex rounded-md border border-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Eye size={15} />
                      </button>
                      {cirugia.estado === 'Pendiente' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCirugia(cirugia)
                            setViewMode('edit')
                          }}
                          aria-label="Editar cirugía"
                          title="Editar cirugía"
                          className="inline-flex rounded-md border border-blue-200 p-2 text-blue-700 transition-colors hover:bg-blue-50"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                      {canCancel(cirugia.estado) && (
                        <button
                          type="button"
                          onClick={() => setCancelSurgeryId(cirugia.id)}
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
      </div>

      {filteredCirugias.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-3 text-muted-foreground" size={40} />
          <p className="text-muted-foreground">No se encontraron cirugias con los filtros seleccionados</p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Resumen */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredCirugias.length} de {cirugias.length} cirugias</span>
      </div>

      {/* Modales */}
      {viewMode === 'view' && selectedCirugia && (
        <ViewCirugia cirugia={selectedCirugia} onClose={() => {
          setViewMode(null)
          setSelectedCirugia(null)
        }} />
      )}

      {viewMode === 'edit' && selectedCirugia && (
        <EditCirugia 
          cirugia={selectedCirugia} 
          onClose={() => {
            setViewMode(null)
            setSelectedCirugia(null)
          }}
          onSave={handleSaveEdit}
        />
      )}

      {showProgramarModal && (
        <ProgramarModal onClose={() => setShowProgramarModal(false)} />
      )}

      {showWeeklyPlanning && (
        <WeeklyPlanningModal onClose={() => setShowWeeklyPlanning(false)} />
      )}

      {cancelSurgeryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-sm mx-4 border border-border">
            <h2 className="text-lg font-bold mb-4 text-foreground">Cancelar cirugía</h2>
            <p className="text-muted-foreground mb-6">
              ¿Estás seguro de que querés cancelar esta cirugía? La cirugía permanecerá visible con estado Cancelada.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelSurgeryId(null)}
                className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  const cirugia = cirugias.find((c) => c.id === cancelSurgeryId)
                  if (cirugia) handleCancel(cirugia)
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
