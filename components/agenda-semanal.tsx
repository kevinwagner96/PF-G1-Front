'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, User, Stethoscope, AlertTriangle } from 'lucide-react'
import { mockCirugias, mockQuirofanos, getCirugiasPendientes, Cirugia } from '@/lib/mock-data'

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Pendiente':
      return 'bg-gray-100 border-gray-300 text-gray-700'
    case 'Programada':
      return 'bg-blue-100 border-blue-300 text-blue-800'
    case 'En Curso':
      return 'bg-yellow-100 border-yellow-400 text-yellow-800'
    case 'Completada':
      return 'bg-green-100 border-green-300 text-green-800'
    case 'Cancelada':
      return 'bg-red-100 border-red-300 text-red-800'
    default:
      return 'bg-gray-100 border-gray-300 text-gray-700'
  }
}

const getPriorityBadge = (prioridad: string) => {
  switch (prioridad) {
    case 'Emergencia':
      return 'bg-red-500 text-white'
    case 'Alta':
      return 'bg-orange-500 text-white'
    case 'Media':
      return 'bg-yellow-500 text-white'
    default:
      return 'bg-gray-400 text-white'
  }
}

export default function AgendaSemanal() {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Get week dates
  const getWeekDates = (date: Date) => {
    const week = []
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    start.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      week.push(d)
    }
    return week
  }

  const weekDates = getWeekDates(currentDate)
  const pendientes = getCirugiasPendientes()

  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const getCirugiasForDate = (date: Date) => {
    const dateStr = formatDate(date)
    return mockCirugias.filter(c => c.fecha === dateStr && c.estado !== 'Pendiente')
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setCurrentDate(newDate)
  }

  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda Semanal</h1>
          <p className="text-sm text-muted-foreground mt-1">Vista de calendario de cirugias programadas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-foreground min-w-[200px] text-center">
            {weekDates[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Calendario semanal */}
        <div className="flex-1">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Headers de dias */}
            <div className="grid grid-cols-7 border-b border-border">
              {weekDates.map((date, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 text-center border-r border-border last:border-r-0 ${
                    isToday(date) ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase">{dayNames[idx]}</p>
                  <p className={`text-lg font-bold mt-1 ${
                    isToday(date) ? 'text-blue-600' : 'text-foreground'
                  }`}>
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Celdas de cirugias */}
            <div className="grid grid-cols-7 min-h-[500px]">
              {weekDates.map((date, idx) => {
                const cirugias = getCirugiasForDate(date)
                return (
                  <div 
                    key={idx} 
                    className={`border-r border-border last:border-r-0 p-2 ${
                      isToday(date) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      {cirugias
                        .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
                        .map((cirugia) => (
                        <div
                          key={cirugia.id}
                          className={`p-2 rounded-lg border-l-4 text-xs cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(cirugia.estado)}`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Clock size={12} />
                            <span className="font-semibold">{cirugia.hora}</span>
                            {cirugia.prioridad !== 'Baja' && (
                              <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(cirugia.prioridad)}`}>
                                {cirugia.prioridad === 'Emergencia' ? '!' : cirugia.prioridad[0]}
                              </span>
                            )}
                          </div>
                          <p className="font-medium truncate">{cirugia.paciente}</p>
                          <p className="text-muted-foreground truncate flex items-center gap-1">
                            <User size={10} />
                            {cirugia.cirujano}
                          </p>
                          <p className="text-muted-foreground truncate flex items-center gap-1">
                            <Stethoscope size={10} />
                            {cirugia.quirofano}
                          </p>
                        </div>
                      ))}
                      {cirugias.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Sin cirugias
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Panel de pendientes */}
        <div className="w-80 shrink-0">
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Pendientes de Asignacion
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{pendientes.length} cirugias sin programar</p>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {pendientes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay cirugias pendientes
                </p>
              ) : (
                pendientes.map((cirugia) => (
                  <div
                    key={cirugia.id}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-amber-900 text-sm">{cirugia.paciente}</p>
                        <p className="text-xs text-amber-700">{cirugia.intervencion}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityBadge(cirugia.prioridad)}`}>
                        {cirugia.prioridad}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-amber-600">
                        <Clock size={12} className="inline mr-1" />
                        {cirugia.tiempoEspera} dias de espera
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        Asignar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
