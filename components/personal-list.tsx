'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react'
import { mockPersonal, Personal } from '@/lib/mock-data'

const roles = ['Cirujano', 'Anestesista', 'Instrumentador', 'Ayudante', 'Enfermero'] as const
const especialidades = [
  'Traumatología', 'Oftalmología', 'Cirugía General', 'Cardiología', 'Neurología',
  'Urología', 'Ortopedia', 'Ginecología', 'Vascular', 'Plástica', 'Anestesiología', 
  'Instrumentación', 'Enfermería'
]

export default function PersonalList() {
  const [personal, setPersonal] = useState<Personal[]>(mockPersonal)
  const [search, setSearch] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Personal, 'id'>>({
    nombre: '',
    dni: '',
    email: '',
    rol: 'Cirujano',
    especialidad: '',
    estado: true,
  })

  const filteredPersonal = personal.filter(p => {
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.dni.includes(search)) return false
    if (filterRol && p.rol !== filterRol) return false
    return true
  })

  const handleOpenModal = (p?: Personal) => {
    if (p) {
      setEditingId(p.id)
      setFormData({
        nombre: p.nombre,
        dni: p.dni,
        email: p.email,
        rol: p.rol,
        especialidad: p.especialidad,
        estado: p.estado,
      })
    } else {
      setEditingId(null)
      setFormData({
        nombre: '',
        dni: '',
        email: '',
        rol: 'Cirujano',
        especialidad: '',
        estado: true,
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (editingId) {
      setPersonal(personal.map(p => p.id === editingId ? { ...p, ...formData } : p))
    } else {
      setPersonal([...personal, { id: `p${Date.now()}`, ...formData }])
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Esta seguro de eliminar este registro?')) {
      setPersonal(personal.filter(p => p.id !== id))
    }
  }

  const handleToggleEstado = (id: string) => {
    setPersonal(personal.map(p => p.id === id ? { ...p, estado: !p.estado } : p))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Personal Medico</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion del equipo medico y personal</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Personal
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
            placeholder="Buscar por nombre o DNI..."
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value)}
          className="px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los roles</option>
          {roles.map(rol => (
            <option key={rol} value={rol}>{rol}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">DNI</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Rol</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Especialidad</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Estado</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPersonal.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                <td className="px-4 py-3 text-foreground font-medium">{p.nombre}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.dni}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.rol === 'Cirujano' ? 'bg-blue-100 text-blue-700' :
                    p.rol === 'Anestesista' ? 'bg-purple-100 text-purple-700' :
                    p.rol === 'Instrumentador' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {p.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{p.especialidad}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleEstado(p.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      p.estado ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        p.estado ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
        Mostrando {filteredPersonal.length} de {personal.length} registros
      </p>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? 'Editar Personal' : 'Nuevo Personal'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">DNI *</label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Correo electronico *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Rol *</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData(prev => ({ ...prev, rol: e.target.value as Personal['rol'] }))}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(rol => (
                      <option key={rol} value={rol}>{rol}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Especialidad</label>
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
                  disabled={!formData.nombre || !formData.dni || !formData.email}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Personal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
