'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Stethoscope, Search } from 'lucide-react'
import { mockQuirofanos, Quirofano, getCirugiasHoy } from '@/lib/mock-data'

export default function QuirofanosList() {
  const quirofanos = mockQuirofanos
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'disponibles' | 'no-disponibles'>('todos')
  const [formData, setFormData] = useState<Omit<Quirofano, 'id'>>({
    nombre: '',
    piso: '',
    disponible: true,
  })

  const cirugiasHoy = getCirugiasHoy()

  const getQuirofanoStatus = (quirofano: Quirofano) => {
    if (!quirofano.disponible) return { status: 'no-disponible', label: 'No disponible', color: 'bg-red-100 text-red-700 border-red-200' }
    
    const cirugiaEnCurso = cirugiasHoy.find(c => c.quirofanoId === quirofano.id && c.estado === 'En Curso')
    if (cirugiaEnCurso) return { status: 'en-uso', label: 'En uso', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    
    const cirugiaProxima = cirugiasHoy.find(c => c.quirofanoId === quirofano.id && c.estado === 'Programada')
    if (cirugiaProxima) return { status: 'programado', label: 'Programado', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    
    return { status: 'libre', label: 'Libre', color: 'bg-green-100 text-green-700 border-green-200' }
  }

  const handleOpenModal = (q?: Quirofano) => {
    if (q) {
      setEditingId(q.id)
      setFormData({ nombre: q.nombre, piso: q.piso, disponible: q.disponible })
    } else {
      setEditingId(null)
      setFormData({ nombre: '', piso: '', disponible: true })
    }
    setShowModal(true)
  }

  const handleSave = () => setShowModal(false)

  const filteredQuirofanos = quirofanos.filter(q => {
    if (search && !q.nombre.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'disponibles' && !q.disponible) return false
    if (filter === 'no-disponibles' && q.disponible) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quirofanos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion y estado de quirofanos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Quirofano
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre..." className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background" /></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="px-4 py-2.5 border border-input rounded-lg bg-background"><option value="todos">Todos los estados</option><option value="disponibles">Disponibles</option><option value="no-disponibles">No disponibles</option></select>
      </div>

      {/* Grid de quirofanos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuirofanos.map((quirofano) => {
          const statusInfo = getQuirofanoStatus(quirofano)
          const cirugiaActual = cirugiasHoy.find(c => c.quirofanoId === quirofano.id && c.estado === 'En Curso')
          const proximaCirugia = cirugiasHoy.find(c => c.quirofanoId === quirofano.id && c.estado === 'Programada')

          return (
            <div
              key={quirofano.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    statusInfo.status === 'libre' ? 'bg-green-100' :
                    statusInfo.status === 'en-uso' ? 'bg-yellow-100' :
                    statusInfo.status === 'programado' ? 'bg-blue-100' :
                    'bg-red-100'
                  }`}>
                    <Stethoscope size={24} className={
                      statusInfo.status === 'libre' ? 'text-green-600' :
                      statusInfo.status === 'en-uso' ? 'text-yellow-600' :
                      statusInfo.status === 'programado' ? 'text-blue-600' :
                      'text-red-600'
                    } />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{quirofano.nombre}</h3>
                    <p className="text-sm text-muted-foreground">Piso {quirofano.piso}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Info de cirugia actual */}
              {cirugiaActual && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-medium text-yellow-700 mb-1">En curso ahora</p>
                  <p className="text-sm text-yellow-900 font-medium">{cirugiaActual.paciente}</p>
                  <p className="text-xs text-yellow-700">{cirugiaActual.intervencion} - {cirugiaActual.cirujano}</p>
                </div>
              )}

              {/* Info de proxima cirugia */}
              {!cirugiaActual && proximaCirugia && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 mb-1">Proxima cirugia: {proximaCirugia.hora}</p>
                  <p className="text-sm text-blue-900 font-medium">{proximaCirugia.paciente}</p>
                  <p className="text-xs text-blue-700">{proximaCirugia.intervencion}</p>
                </div>
              )}

              {/* Controles */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Disponible:</span>
                  <button
                    type="button"
                    aria-label={`Disponibilidad de ${quirofano.nombre}`}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      quirofano.disponible ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        quirofano.disponible ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(quirofano)}
                    aria-label={`Editar ${quirofano.nombre}`}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${quirofano.nombre}`}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? 'Editar Quirofano' : 'Nuevo Quirofano'}
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
                  placeholder="Ej: Quirofano A"
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ubicacion / Piso (opcional)</label>
                <input
                  type="text"
                  value={formData.piso}
                  onChange={(e) => setFormData(prev => ({ ...prev, piso: e.target.value }))}
                  placeholder="Ej: 2"
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">Disponible</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, disponible: !prev.disponible }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.disponible ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.disponible ? 'translate-x-6' : 'translate-x-1'
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
