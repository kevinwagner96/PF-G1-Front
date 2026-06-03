'use client'

import { useState } from 'react'
import { Calendar, Clock, Check, X, AlertTriangle, Edit3, ChevronRight, FileText } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { mockCirugias, Cirugia } from '@/lib/mock-data'

interface SolicitudModificacion {
  turnosAfectados: string[]
  accion: 'reprogramar' | 'cancelar' | 'cambiar_equipo'
  nuevoHorario?: string
  nuevaFecha?: string
  justificacion: string
}

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Pendiente':
      return 'bg-amber-50 border-amber-200 text-amber-800'
    case 'Programada':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'En Curso':
      return 'bg-yellow-50 border-yellow-300 text-yellow-800'
    case 'Completada':
      return 'bg-green-50 border-green-200 text-green-800'
    case 'Cancelada':
      return 'bg-red-50 border-red-200 text-red-800'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

export default function MiAgendaCirujano() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'pendientes' | 'programadas' | 'historial'>('pendientes')
  const [showSolicitudModal, setShowSolicitudModal] = useState(false)
  const [solicitud, setSolicitud] = useState<SolicitudModificacion>({
    turnosAfectados: [],
    accion: 'reprogramar',
    nuevoHorario: '',
    nuevaFecha: '',
    justificacion: '',
  })

  // Simular cirugias del cirujano actual (usando p1 como ejemplo)
  const misCirugias = mockCirugias.filter(c => c.cirujanoId === 'p1')
  
  const pendientesAprobacion = misCirugias.filter(c => c.estado === 'Pendiente' || c.estado === 'Programada')
  const programadas = misCirugias.filter(c => c.estado === 'Programada' && c.fecha)
  const historial = misCirugias.filter(c => c.estado === 'Completada' || c.estado === 'Cancelada')

  const handleTurnoToggle = (cirugiaId: string) => {
    setSolicitud(prev => ({
      ...prev,
      turnosAfectados: prev.turnosAfectados.includes(cirugiaId)
        ? prev.turnosAfectados.filter(id => id !== cirugiaId)
        : [...prev.turnosAfectados, cirugiaId]
    }))
  }

  const handleSubmitSolicitud = () => {
    console.log('Solicitud enviada:', solicitud)
    setShowSolicitudModal(false)
    setSolicitud({
      turnosAfectados: [],
      accion: 'reprogramar',
      nuevoHorario: '',
      nuevaFecha: '',
      justificacion: '',
    })
  }

  const tabs = [
    { id: 'pendientes', label: 'Pendientes de Aprobacion', count: pendientesAprobacion.length },
    { id: 'programadas', label: 'Mis Cirugias Programadas', count: programadas.length },
    { id: 'historial', label: 'Historial', count: historial.length },
  ] as const

  const getCurrentCirugias = () => {
    switch (activeTab) {
      case 'pendientes':
        return pendientesAprobacion
      case 'programadas':
        return programadas
      case 'historial':
        return historial
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion de cirugias asignadas a {user?.nombre || 'Dr. Lopez'}
          </p>
        </div>
        <button
          onClick={() => setShowSolicitudModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit3 size={18} />
          Solicitar Modificacion
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de cirugias */}
      <div className="space-y-4">
        {getCurrentCirugias().length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay cirugias en esta seccion</p>
          </div>
        ) : (
          getCurrentCirugias().map((cirugia) => (
            <div
              key={cirugia.id}
              className={`bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground text-lg">{cirugia.paciente}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(cirugia.estado)}`}>
                      {cirugia.estado}
                    </span>
                    {cirugia.prioridad === 'Alta' || cirugia.prioridad === 'Emergencia' ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        cirugia.prioridad === 'Emergencia' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {cirugia.prioridad}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mb-3">{cirugia.intervencion}</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {cirugia.fecha && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {cirugia.fecha}
                      </span>
                    )}
                    {cirugia.hora && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {cirugia.hora}
                      </span>
                    )}
                    {cirugia.quirofano && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        {cirugia.quirofano}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>

              {/* Acciones para pendientes */}
              {activeTab === 'pendientes' && cirugia.estado === 'Programada' && (
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                    <Check size={14} />
                    Aprobar
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors">
                    <Edit3 size={14} />
                    Solicitar Cambio
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                    <X size={14} />
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Solicitud de Modificacion */}
      {showSolicitudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Solicitar Modificacion</h2>
              <p className="text-sm text-muted-foreground mt-1">Complete el formulario para solicitar cambios en sus turnos</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Turnos afectados */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Turnos Afectados *
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-input rounded-lg p-3">
                  {programadas.map(cirugia => (
                    <label key={cirugia.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                      <input
                        type="checkbox"
                        checked={solicitud.turnosAfectados.includes(cirugia.id)}
                        onChange={() => handleTurnoToggle(cirugia.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-foreground">
                        {cirugia.paciente} - {cirugia.fecha} {cirugia.hora}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Accion */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Accion *
                </label>
                <select
                  value={solicitud.accion}
                  onChange={(e) => setSolicitud(prev => ({ ...prev, accion: e.target.value as SolicitudModificacion['accion'] }))}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="reprogramar">Reprogramar</option>
                  <option value="cancelar">Cancelar</option>
                  <option value="cambiar_equipo">Cambiar Equipo Medico</option>
                </select>
              </div>

              {/* Nuevo horario (condicional) */}
              {solicitud.accion === 'reprogramar' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nueva Fecha
                    </label>
                    <input
                      type="date"
                      value={solicitud.nuevaFecha}
                      onChange={(e) => setSolicitud(prev => ({ ...prev, nuevaFecha: e.target.value }))}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nuevo Horario
                    </label>
                    <input
                      type="time"
                      value={solicitud.nuevoHorario}
                      onChange={(e) => setSolicitud(prev => ({ ...prev, nuevoHorario: e.target.value }))}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Justificacion */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Justificacion *
                </label>
                <textarea
                  value={solicitud.justificacion}
                  onChange={(e) => setSolicitud(prev => ({ ...prev, justificacion: e.target.value }))}
                  placeholder="Explique el motivo de la solicitud..."
                  rows={4}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowSolicitudModal(false)}
                  className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitSolicitud}
                  disabled={solicitud.turnosAfectados.length === 0 || !solicitud.justificacion}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  Enviar Solicitud
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
