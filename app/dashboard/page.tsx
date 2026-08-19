'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Stethoscope, 
  AlertCircle,
  Activity
} from 'lucide-react'
import { 
  mockQuirofanos,
  getCirugiasHoy,
  getCirugiasPendientes,
  getAlertasCriticas
} from '@/lib/mock-data'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange, user } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (requiresPasswordChange) {
        router.push('/cambiar-password')
      }
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const cirugiasHoy = getCirugiasHoy()
  const cirugiasPendientes = getCirugiasPendientes()
  const alertasCriticas = getAlertasCriticas()
  const quirofanosLibres = mockQuirofanos.filter(q => q.disponible).length
  const emergenciasHoy = cirugiasHoy.filter(c => c.prioridad === 'Emergencia').length

  const widgets = [
    {
      title: 'Cirugías Hoy',
      value: cirugiasHoy.length,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      subtitle: `${cirugiasHoy.filter(c => c.estado === 'Completada').length} completadas`,
      href: '/cirugias',
    },
    {
      title: 'Pendientes',
      value: cirugiasPendientes.length,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      subtitle: 'Sin asignar',
      href: '/cirugias',
    },
    {
      title: 'Emergencias',
      value: emergenciasHoy,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      subtitle: 'Hoy',
      href: '/emergencias',
    },
    {
      title: 'Quirófanos Libres',
      value: quirofanosLibres,
      icon: Stethoscope,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      subtitle: `de ${mockQuirofanos.length} totales`,
      href: '/quirofanos',
    },
    {
      title: 'Alertas Críticas',
      value: alertasCriticas.length,
      icon: AlertCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      subtitle: 'Requieren atención',
      href: '/cirugias',
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage="dashboard" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <PageHeader className="mb-8" title="Dashboard" description={`Bienvenido/a, ${user?.nombre}. Estas son las tareas y situaciones que requieren atención hoy.`} />

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              {widgets.map((widget, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => router.push(widget.href)}
                  className="rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`${widget.title}: ${widget.value}. ${widget.subtitle}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{widget.title}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{widget.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{widget.subtitle}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${widget.bgColor}`}>
                      <widget.icon className={widget.textColor} size={22} />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cirugías de Hoy */}
              <div className="bg-card rounded-xl border border-border">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    Cirugías de Hoy
                  </h2>
                  <button 
                    onClick={() => router.push('/cirugias')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="p-5">
                  {cirugiasHoy.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay cirugías programadas para hoy</p>
                  ) : (
                    <div className="space-y-3">
                      {cirugiasHoy.slice(0, 5).map((cirugia) => (
                        <div
                          key={cirugia.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push('/cirugias')}
                          onKeyDown={(event) => event.key === 'Enter' && router.push('/cirugias')}
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              cirugia.estado === 'En Curso' ? 'bg-yellow-500 animate-pulse' :
                              cirugia.estado === 'Completada' ? 'bg-green-500' :
                              cirugia.estado === 'Cancelada' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} />
                            <div>
                              <p className="font-medium text-foreground text-sm">{cirugia.paciente}</p>
                              <p className="text-xs text-muted-foreground">{cirugia.intervencion}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{cirugia.hora}</p>
                            <p className="text-xs text-muted-foreground">{cirugia.quirofano}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Alertas Críticas */}
              <div className="bg-card rounded-xl border border-border">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-500" />
                    Alertas Críticas
                  </h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                    {alertasCriticas.length} activas
                  </span>
                </div>
                <div className="p-5">
                  {alertasCriticas.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay alertas críticas</p>
                  ) : (
                    <div className="space-y-3">
                      {alertasCriticas.map((alerta) => (
                        <div
                          key={alerta.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(alerta.tipo === 'insumo' ? '/insumos' : alerta.tipo === 'personal' ? '/personal' : '/cirugias')}
                          onKeyDown={(event) => event.key === 'Enter' && router.push(alerta.tipo === 'insumo' ? '/insumos' : alerta.tipo === 'personal' ? '/personal' : '/cirugias')}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3 hover:border-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">{alerta.mensaje}</p>
                            <p className="text-xs text-red-600 mt-1">
                              {alerta.tipo === 'insumo' ? 'Insumos' : 
                               alerta.tipo === 'conflicto' ? 'Conflicto' : 'Personal'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pendientes de Asignación */}
              <div className="bg-card rounded-xl border border-border">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock size={18} className="text-amber-500" />
                    Pendientes de Asignación
                  </h2>
                  <button 
                    onClick={() => router.push('/cirugias')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Gestionar
                  </button>
                </div>
                <div className="p-5">
                  {cirugiasPendientes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay cirugías pendientes</p>
                  ) : (
                    <div className="space-y-3">
                      {cirugiasPendientes.slice(0, 4).map((cirugia) => (
                        <div
                          key={cirugia.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100"
                        >
                          <div>
                            <p className="font-medium text-amber-900 text-sm">{cirugia.paciente}</p>
                            <p className="text-xs text-amber-700">{cirugia.intervencion}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              cirugia.prioridad === 'Alta' ? 'bg-red-100 text-red-700' :
                              cirugia.prioridad === 'Media' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {cirugia.prioridad}
                            </span>
                            <p className="text-xs text-amber-600 mt-1">{cirugia.tiempoEspera} días espera</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen de Quirófanos */}
              <div className="bg-card rounded-xl border border-border">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Stethoscope size={18} className="text-green-500" />
                    Estado de Quirófanos
                  </h2>
                  <button 
                    onClick={() => router.push('/quirofanos')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="p-5">
                  <div className="space-y-3">
                    {mockQuirofanos.map((quirofano) => {
                      const cirugiaActual = cirugiasHoy.find(
                        c => c.quirofanoId === quirofano.id && c.estado === 'En Curso'
                      )
                      return (
                        <div
                          key={quirofano.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              !quirofano.disponible ? 'bg-red-500' :
                              cirugiaActual ? 'bg-yellow-500 animate-pulse' :
                              'bg-green-500'
                            }`} />
                            <div>
                              <p className="font-medium text-foreground text-sm">{quirofano.nombre}</p>
                              <p className="text-xs text-muted-foreground">Piso {quirofano.piso}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            !quirofano.disponible ? 'bg-red-100 text-red-700' :
                            cirugiaActual ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {!quirofano.disponible ? 'No disponible' :
                             cirugiaActual ? 'En uso' : 'Libre'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
