'use client'

import { useState } from 'react'
import { X, Zap } from 'lucide-react'

interface WeeklySurgery {
  id: string
  dia: string
  fecha: string
  hora: string
  paciente: string
  especialidad: string
  cirujano: string
  sala: string
  estado: 'Programada' | 'Confirmada' | 'Tentativa'
}

const mockWeeklySurgeries: WeeklySurgery[] = [
  {
    id: '1',
    dia: 'Lunes',
    fecha: '2025-11-17',
    hora: '08:00',
    paciente: 'Juan Martínez',
    especialidad: 'Ortopedia',
    cirujano: 'Dr. López',
    sala: 'Quirófano A',
    estado: 'Confirmada',
  },
  {
    id: '2',
    dia: 'Lunes',
    fecha: '2025-11-17',
    hora: '10:30',
    paciente: 'Laura Sánchez',
    especialidad: 'Oftalmología',
    cirujano: 'Dra. Fernández',
    sala: 'Quirófano C',
    estado: 'Confirmada',
  },
  {
    id: '3',
    dia: 'Martes',
    fecha: '2025-11-18',
    hora: '09:00',
    paciente: 'Roberto Díaz',
    especialidad: 'Cirugía General',
    cirujano: 'Dr. Rodríguez',
    sala: 'Quirófano B',
    estado: 'Programada',
  },
  {
    id: '4',
    dia: 'Miércoles',
    fecha: '2025-11-19',
    hora: '14:00',
    paciente: 'Ana García',
    especialidad: 'Urología',
    cirujano: 'Dr. Martínez',
    sala: 'Quirófano A',
    estado: 'Tentativa',
  },
  {
    id: '5',
    dia: 'Viernes',
    fecha: '2025-11-21',
    hora: '11:00',
    paciente: 'Carlos Ruiz',
    especialidad: 'Traumatología',
    cirujano: 'Dr. López',
    sala: 'Quirófano D',
    estado: 'Confirmada',
  },
]

const getDaysOfWeek = () => {
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
}

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Confirmada':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'Programada':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'Tentativa':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

interface WeeklyPlanningModalProps {
  onClose: () => void
  viewOnly?: boolean
}

export default function WeeklyPlanningModal({ onClose, viewOnly = false }: WeeklyPlanningModalProps) {
  const [surgeries, setSurgeries] = useState<WeeklySurgery[]>(viewOnly ? mockWeeklySurgeries : [])
  const [planningGenerated, setPlanningGenerated] = useState(viewOnly)
  const [selectedDayForPlanning, setSelectedDayForPlanning] = useState<string | null>(null)
  const [isAutoPlanning, setIsAutoPlanning] = useState(false)
  const [formData, setFormData] = useState({
    hora: '',
    paciente: '',
    especialidad: '',
    cirujano: '',
    sala: '',
  })

  const daysOfWeek = getDaysOfWeek()

  const groupedByDay = daysOfWeek.reduce(
    (acc, day) => {
      acc[day] = surgeries.filter((s) => s.dia === day)
      return acc
    },
    {} as Record<string, WeeklySurgery[]>
  )

  const handleGeneratePlanning = () => {
    setIsAutoPlanning(true)
    
    // Simulate automatic distribution of surgeries
    const pendingSurgeries = [
      { paciente: 'María López', especialidad: 'Cirugía General', cirujano: 'Dr. García', sala: 'Quirófano B' },
      { paciente: 'Pedro Gómez', especialidad: 'Ortopedia', cirujano: 'Dr. López', sala: 'Quirófano A' },
      { paciente: 'Sofia Martín', especialidad: 'Oftalmología', cirujano: 'Dra. Fernández', sala: 'Quirófano C' },
      { paciente: 'Diego Torres', especialidad: 'Urología', cirujano: 'Dr. Martínez', sala: 'Quirófano D' },
      { paciente: 'Elena Rodríguez', especialidad: 'Traumatología', cirujano: 'Dr. López', sala: 'Quirófano A' },
    ]

    const horasDisponibles = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00']
    const newSurgeries: WeeklySurgery[] = []

    pendingSurgeries.forEach((surgery, index) => {
      const dayIndex = index % 5
      const horaIndex = Math.floor(index / 5)
      const day = daysOfWeek[dayIndex]
      
      newSurgeries.push({
        id: `auto-${index}`,
        dia: day,
        fecha: `2025-11-${17 + dayIndex}`,
        hora: horasDisponibles[horaIndex] || '08:00',
        paciente: surgery.paciente,
        especialidad: surgery.especialidad,
        cirujano: surgery.cirujano,
        sala: surgery.sala,
        estado: 'Programada',
      })
    })

    setSurgeries(newSurgeries)
    setPlanningGenerated(true)
    
    setTimeout(() => {
      setIsAutoPlanning(false)
    }, 500)
  }

  const handleAddSurgery = () => {
    if (selectedDayForPlanning && !viewOnly) {
      console.log('Adding surgery for', selectedDayForPlanning, formData)
      setFormData({ hora: '', paciente: '', especialidad: '', cirujano: '', sala: '' })
      setSelectedDayForPlanning(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {viewOnly ? 'Cirugías de Esta Semana' : 'Planificación Semanal'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">17-21 de Noviembre, 2025 (Lunes a Viernes)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!planningGenerated ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Planificación Vacía</h3>
                <p className="text-gray-600 mb-6">Presiona el botón "Generar Planificación Semanal" para comenzar</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96"
                >
                  <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
                    {day}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {groupedByDay[day].map((surgery) => (
                      <div
                        key={surgery.id}
                        className={`p-3 rounded-lg border-l-4 text-sm ${getStatusColor(surgery.estado)}`}
                      >
                        <div className="font-semibold">{surgery.hora}</div>
                        <div className="text-xs mt-1">{surgery.paciente}</div>
                        <div className="text-xs opacity-75 mt-1">{surgery.especialidad}</div>
                        <div className="text-xs opacity-75">{surgery.sala}</div>
                      </div>
                    ))}
                  </div>

                  {!viewOnly && (
                    <button
                      onClick={() => setSelectedDayForPlanning(day)}
                      className="w-full py-2 text-sm border-2 border-dashed border-gray-300 text-gray-600 rounded hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      + Agregar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
          {!viewOnly && (
            <div className="flex gap-2">
              <button
                onClick={handleGeneratePlanning}
                disabled={isAutoPlanning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Zap size={18} />
                {isAutoPlanning ? 'Generando...' : 'Generar Planificación Semanal'}
              </button>
              {planningGenerated && (
                <button
                  onClick={handleAddSurgery}
                  disabled={!selectedDayForPlanning}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  Guardar Cambios
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
