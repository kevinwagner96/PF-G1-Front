'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, FileText } from 'lucide-react'
import { mockTiposCirugia, TipoCirugia } from '@/lib/mock-data'

const especialidades = [
  'Traumatología', 'Oftalmología', 'Cirugía General', 'Cardiología', 'Neurología',
  'Urología', 'Ortopedia', 'Ginecología', 'Vascular', 'Plástica'
]

const complejidades = ['Baja', 'Media', 'Alta'] as const

export default function TiposCirugiaList() {
  const [tipos, setTipos] = useState<TipoCirugia[]>(mockTiposCirugia)
  const [search, setSearch] = useState('')
  const [filterEspecialidad, setFilterEspecialidad] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<TipoCirugia, 'id'>>({
    nombre: '',
    especialidad: '',
    complejidad: 'Media',
    duracionEstimada: 60,
    descripcion: '',
    estado: true,
  })

  const filteredTipos = tipos.filter(t => {
    if (search && !t.nombre.toLowerCase().includes(search.toLowerCase())) return false
    if (filterEspecialidad && t.especialidad !== filterEspecialidad) return false
    return true
  })

  const handleOpenModal = (t?: TipoCirugia) => {
    if (t) {
      setEditingId(t.id)
      setFormData({
        nombre: t.nombre,
        especialidad: t.especialidad,
        complejidad: t.complejidad,
        duracionEstimada: t.duracionEstimada,
        descripcion: t.descripcion,
        estado: t.estado,
      })
    } else {
      setEditingId(null)
      setFormData({
        nombre: '',
        especialidad: '',
        complejidad: 'Media',
        duracionEstimada: 60,
        descripcion: '',
        estado: true,
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (editingId) {
      setTipos(tipos.map(t => t.id === editingId ? { ...t, ...formData } : t))
    } else {
      setTipos([...tipos, { id: `tc${Date.now()}`, ...formData }])
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Esta seguro de eliminar este tipo de cirugia?')) {
      setTipos(tipos.filter(t => t.id !== id))
    }
  }

  const handleToggleEstado = (id: string) => {
    setTipos(tipos.map(t => t.id === id ? { ...t, estado: !t.estado } : t))
  }

  const getComplejidadColor = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja':
        return 'bg-green-100 text-green-700'
      case 'Media':
        return 'bg-yellow-100 text-yellow-700'
      case 'Alta':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tipos de Cirugia</h1>
          <p className="text-sm text-muted-foreground mt-1">Catalogo de intervenciones quirurgicas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Tipo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterEspecialidad}
          onChange={(e) => setFilterEspecialidad(e.target.value)}
          className="px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las especialidades</option>
          {especialidades.map(esp => (
            <option key={esp} value={esp}>{esp}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Especialidad</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Complejidad</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Duracion Est.</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Descripcion</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Estado</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTipos.map((tipo, idx) => (
              <tr key={tipo.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                <td className="px-4 py-3 text-foreground font-medium">{tipo.nombre}</td>
                <td className="px-4 py-3 text-muted-foreground">{tipo.especialidad}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getComplejidadColor(tipo.complejidad)}`}>
                    {tipo.complejidad}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-foreground">{tipo.duracionEstimada} min</td>
                <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{tipo.descripcion}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleEstado(tipo.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      tipo.estado ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tipo.estado ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => handleOpenModal(tipo)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tipo.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
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

      <p className="text-sm text-muted-foreground">
        Mostrando {filteredTipos.length} de {tipos.length} tipos de cirugia
      </p>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? 'Editar Tipo de Cirugia' : 'Nuevo Tipo de Cirugia'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Apendicectomia"
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Especialidad *</label>
                  <select
                    value={formData.especialidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {especialidades.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Complejidad *</label>
                  <select
                    value={formData.complejidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, complejidad: e.target.value as TipoCirugia['complejidad'] }))}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {complejidades.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Duracion estimada (minutos)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duracionEstimada}
                  onChange={(e) => setFormData(prev => ({ ...prev, duracionEstimada: parseInt(e.target.value) || 60 }))}
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Descripcion</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripcion del procedimiento..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">Estado activo</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, estado: !prev.estado }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.estado ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.estado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.nombre || !formData.especialidad}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium"
                >
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
