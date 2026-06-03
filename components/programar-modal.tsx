'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, Trash2 } from 'lucide-react'
import { 
  mockPacientes, 
  mockPersonal, 
  mockTiposCirugia,
  mockInsumos,
  getCirujanos,
  getAnestesistas,
  getInstrumentadores,
  getAyudantes,
  getTiposCirugiaActivos,
  Paciente
} from '@/lib/mock-data'

interface FormData {
  // Paciente
  pacienteId: string
  pacienteDni: string
  pacienteNombre: string
  pacienteEdad: number | null
  pacienteObraSocial: string
  // Medica
  cirujanoId: string
  intervenciones: string[]
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Emergencia'
  // Equipo
  anestesistaId: string
  instrumentadorId: string
  ayudantes: string[]
  // Insumos
  insumos: { insumoId: string; nombre: string; cantidad: number }[]
  // Observaciones
  observaciones: string
}

interface ProgramarModalProps {
  onClose: () => void
  onSave?: (data: FormData) => void
}

export default function ProgramarModal({ onClose, onSave }: ProgramarModalProps) {
  const [formData, setFormData] = useState<FormData>({
    pacienteId: '',
    pacienteDni: '',
    pacienteNombre: '',
    pacienteEdad: null,
    pacienteObraSocial: '',
    cirujanoId: '',
    intervenciones: [],
    prioridad: 'Media',
    anestesistaId: '',
    instrumentadorId: '',
    ayudantes: [],
    insumos: [],
    observaciones: '',
  })

  const [dniSearch, setDniSearch] = useState('')
  const [showPacienteResults, setShowPacienteResults] = useState(false)
  const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([])
  const [insumoSearch, setInsumoSearch] = useState('')
  const [insumoQuantity, setInsumoQuantity] = useState(1)

  const cirujanos = getCirujanos()
  const anestesistas = getAnestesistas()
  const instrumentadores = getInstrumentadores()
  const ayudantes = getAyudantes()
  const tiposCirugia = getTiposCirugiaActivos()

  // Buscar paciente por DNI
  useEffect(() => {
    if (dniSearch.length >= 2) {
      const filtered = mockPacientes.filter(p => 
        p.dni.includes(dniSearch) || p.nombre.toLowerCase().includes(dniSearch.toLowerCase())
      )
      setFilteredPacientes(filtered)
      setShowPacienteResults(true)
    } else {
      setFilteredPacientes([])
      setShowPacienteResults(false)
    }
  }, [dniSearch])

  const handleSelectPaciente = (paciente: Paciente) => {
    setFormData(prev => ({
      ...prev,
      pacienteId: paciente.id,
      pacienteDni: paciente.dni,
      pacienteNombre: paciente.nombre,
      pacienteEdad: paciente.edad,
      pacienteObraSocial: paciente.obraSocial,
    }))
    setDniSearch(paciente.dni)
    setShowPacienteResults(false)
  }

  const handleIntervencionToggle = (intervencionId: string) => {
    setFormData(prev => ({
      ...prev,
      intervenciones: prev.intervenciones.includes(intervencionId)
        ? prev.intervenciones.filter(i => i !== intervencionId)
        : [...prev.intervenciones, intervencionId]
    }))
  }

  const handleAyudanteToggle = (ayudanteId: string) => {
    setFormData(prev => ({
      ...prev,
      ayudantes: prev.ayudantes.includes(ayudanteId)
        ? prev.ayudantes.filter(a => a !== ayudanteId)
        : [...prev.ayudantes, ayudanteId]
    }))
  }

  const handleAddInsumo = () => {
    const insumo = mockInsumos.find(i => 
      i.nombre.toLowerCase().includes(insumoSearch.toLowerCase())
    )
    if (insumo && !formData.insumos.some(i => i.insumoId === insumo.id)) {
      setFormData(prev => ({
        ...prev,
        insumos: [...prev.insumos, { insumoId: insumo.id, nombre: insumo.nombre, cantidad: insumoQuantity }]
      }))
      setInsumoSearch('')
      setInsumoQuantity(1)
    }
  }

  const handleRemoveInsumo = (insumoId: string) => {
    setFormData(prev => ({
      ...prev,
      insumos: prev.insumos.filter(i => i.insumoId !== insumoId)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Turno programado:', formData)
    onSave?.(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Crear Turno</h2>
            <p className="text-sm text-muted-foreground mt-1">Complete los datos para programar una cirugia</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Seccion Paciente */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
              Datos del Paciente
            </h3>
            <div className="space-y-4">
              {/* Busqueda por DNI */}
              <div className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Buscar por DNI o Nombre *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    value={dniSearch}
                    onChange={(e) => setDniSearch(e.target.value)}
                    placeholder="Ingrese DNI o nombre del paciente"
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Resultados de busqueda */}
                {showPacienteResults && filteredPacientes.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredPacientes.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPaciente(p)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-foreground">{p.nombre}</p>
                          <p className="text-sm text-muted-foreground">DNI: {p.dni}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{p.obraSocial}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Datos readonly del paciente */}
              {formData.pacienteId && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre</label>
                    <p className="text-foreground font-medium">{formData.pacienteNombre}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">DNI</label>
                    <p className="text-foreground">{formData.pacienteDni}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Edad</label>
                    <p className="text-foreground">{formData.pacienteEdad} anos</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Obra Social</label>
                    <p className="text-foreground">{formData.pacienteObraSocial}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Seccion Medica */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
              Informacion Medica
            </h3>
            <div className="space-y-4">
              {/* Cirujano */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cirujano Principal *</label>
                <select
                  value={formData.cirujanoId}
                  onChange={(e) => setFormData(prev => ({ ...prev, cirujanoId: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un cirujano</option>
                  {cirujanos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} - {c.especialidad}</option>
                  ))}
                </select>
              </div>

              {/* Intervenciones (multiselect) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Intervenciones *</label>
                <div className="border border-input rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {tiposCirugia.map(tipo => (
                    <label key={tipo.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.intervenciones.includes(tipo.id)}
                        onChange={() => handleIntervencionToggle(tipo.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-foreground">{tipo.nombre}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{tipo.especialidad}</span>
                    </label>
                  ))}
                </div>
                {formData.intervenciones.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.intervenciones.length} seleccionada(s)
                  </p>
                )}
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Prioridad *</label>
                <div className="flex gap-2 flex-wrap">
                  {(['Baja', 'Media', 'Alta', 'Emergencia'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, prioridad: p }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.prioridad === p
                          ? p === 'Emergencia' ? 'bg-red-600 text-white' :
                            p === 'Alta' ? 'bg-orange-500 text-white' :
                            p === 'Media' ? 'bg-yellow-500 text-white' :
                            'bg-green-500 text-white'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Seccion Equipo Medico */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
              Equipo Medico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anestesista */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Anestesista</label>
                <select
                  value={formData.anestesistaId}
                  onChange={(e) => setFormData(prev => ({ ...prev, anestesistaId: e.target.value }))}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un anestesista</option>
                  {anestesistas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Instrumentador */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Instrumentador</label>
                <select
                  value={formData.instrumentadorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, instrumentadorId: e.target.value }))}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un instrumentador</option>
                  {instrumentadores.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Ayudantes (multiselect) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Ayudantes</label>
                <div className="flex flex-wrap gap-2">
                  {ayudantes.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAyudanteToggle(a.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        formData.ayudantes.includes(a.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {a.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Seccion Insumos */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
              Insumos Requeridos
            </h3>
            <div className="space-y-4">
              {/* Agregar insumo */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={insumoSearch}
                    onChange={(e) => setInsumoSearch(e.target.value)}
                    placeholder="Buscar insumo..."
                    list="insumos-list"
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="insumos-list">
                    {mockInsumos.map(i => (
                      <option key={i.id} value={i.nombre} />
                    ))}
                  </datalist>
                </div>
                <input
                  type="number"
                  min="1"
                  value={insumoQuantity}
                  onChange={(e) => setInsumoQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <button
                  type="button"
                  onClick={handleAddInsumo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Lista de insumos agregados */}
              {formData.insumos.length > 0 && (
                <div className="space-y-2">
                  {formData.insumos.map(insumo => (
                    <div key={insumo.insumoId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-foreground">{insumo.nombre}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Cantidad: {insumo.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInsumo(insumo.insumoId)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Seccion Observaciones */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">5</span>
              Observaciones
            </h3>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Notas adicionales, alergias, consideraciones especiales..."
              rows={4}
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </section>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.pacienteId || !formData.cirujanoId || formData.intervenciones.length === 0}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              Crear Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
