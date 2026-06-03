'use client'

import { useState, useMemo } from 'react'
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Eye, Trash2, Edit2, Search, Filter, X, Plus, CalendarDays, ListFilter } from 'lucide-react'
import ViewCirugia from './view-cirugia-modal'
import EditCirugia from './edit-cirugia-modal'
import ProgramarModal from './programar-modal'
import WeeklyPlanningModal from './weekly-planning-modal'
import { mockCirugias as initialCirugias, mockQuirofanos, getCirujanos, Cirugia } from '@/lib/mock-data'

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Pendiente':
      return 'bg-gray-50 text-gray-700'
    case 'Programada':
      return 'bg-blue-50 text-blue-700'
    case 'En Curso':
      return 'bg-yellow-50 text-yellow-700'
    case 'Completada':
      return 'bg-green-50 text-green-700'
    case 'Cancelada':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-gray-50 text-gray-700'
  }
}

const getPriorityColor = (prioridad: string) => {
  switch (prioridad) {
    case 'Baja':
      return 'text-green-600'
    case 'Media':
      return 'text-yellow-600'
    case 'Alta':
      return 'text-orange-600'
    case 'Emergencia':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Pendiente':
      return <Clock size={14} />
    case 'Programada':
      return <Calendar size={14} />
    case 'En Curso':
      return <Clock size={14} className="animate-pulse" />
    case 'Completada':
      return <CheckCircle size={14} />
    case 'Cancelada':
      return <XCircle size={14} />
    default:
      return null
  }
}

export default function CirugiasTable() {
  const [cirugias, setCirugias] = useState<Cirugia[]>(initialCirugias)
  const [selectedCirugia, setSelectedCirugia] = useState<Cirugia | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showProgramarModal, setShowProgramarModal] = useState(false)
  const [showWeeklyPlanning, setShowWeeklyPlanning] = useState(false)
  const [showWeeklyView, setShowWeeklyView] = useState(false)

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

  const canDelete = (estado: string) => {
    return estado === 'Programada' || estado === 'Cancelada' || estado === 'Pendiente'
  }

  const handleDelete = (cirugia: Cirugia) => {
    setCirugias(cirugias.filter((c) => c.id !== cirugia.id))
    setShowDeleteConfirm(null)
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
            onClick={() => setShowWeeklyView(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <CalendarDays size={18} />
            Ver Esta Semana
          </button>
          <button
            onClick={() => setShowWeeklyPlanning(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Calendar size={18} />
            Planificacion Semanal
          </button>
          <button
            onClick={() => setShowProgramarModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Programar
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
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Paciente</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">DNI</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Cirujano</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Intervencion</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Fecha</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Hora</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Quirofano</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Prioridad</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Estado</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCirugias.map((cirugia, idx) => (
              <tr key={cirugia.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                <td className="px-4 py-3 text-foreground font-mono text-xs">{cirugia.id}</td>
                <td className="px-4 py-3 text-foreground font-medium">{cirugia.paciente}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{cirugia.dni}</td>
                <td className="px-4 py-3 text-foreground">{cirugia.cirujano}</td>
                <td className="px-4 py-3 text-foreground">{cirugia.intervencion}</td>
                <td className="px-4 py-3 text-foreground">{cirugia.fecha || '-'}</td>
                <td className="px-4 py-3 text-foreground">{cirugia.hora || '-'}</td>
                <td className="px-4 py-3 text-foreground">{cirugia.quirofano || '-'}</td>
                <td className={`px-4 py-3 font-medium ${getPriorityColor(cirugia.prioridad)}`}>
                  {cirugia.prioridad}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(cirugia.estado)}`}>
                    {getStatusIcon(cirugia.estado)}
                    {cirugia.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => {
                        setSelectedCirugia(cirugia)
                        setViewMode('view')
                      }}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                      title="Ver detalle"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCirugia(cirugia)
                        setViewMode('edit')
                      }}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(cirugia.id)}
                      disabled={!canDelete(cirugia.estado)}
                      className={`p-2 rounded-lg transition-colors ${
                        canDelete(cirugia.estado)
                          ? 'hover:bg-red-100 text-red-600 cursor-pointer'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title={canDelete(cirugia.estado) ? 'Eliminar' : 'No se puede eliminar'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {showWeeklyView && (
        <WeeklyPlanningModal onClose={() => setShowWeeklyView(false)} viewOnly={true} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-sm mx-4 border border-border">
            <h2 className="text-lg font-bold mb-4 text-foreground">Confirmar eliminacion</h2>
            <p className="text-muted-foreground mb-6">
              Esta seguro de que desea eliminar esta cirugia? Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const cirugia = cirugias.find((c) => c.id === showDeleteConfirm)
                  if (cirugia) handleDelete(cirugia)
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
