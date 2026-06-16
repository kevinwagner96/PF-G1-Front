'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  Percent,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface MetricValue {
  value: number
  unit: 'percent' | 'days'
  label: string
}

interface OperatingRoomDetail {
  room: string
  scheduled_minutes: number
  available_minutes: number
  utilization_percentage: number
}

interface StatusDetail {
  estado: string
  count: number
}

interface WaitBySpecialtyDetail {
  specialty: string
  average_wait_days: number
  surgeries_count: number
}

interface ReportsSummaryResponse {
  generated_at: string
  range: {
    date_from: string
    date_to: string
  }
  operating_room_utilization: MetricValue
  cancellation_rate: MetricValue
  average_wait_days: MetricValue
  details: {
    operating_rooms: OperatingRoomDetail[]
    statuses: StatusDetail[]
    wait_by_specialty: WaitBySpecialtyDetail[]
  }
}

function toInputDate(value: Date) {
  return value.toISOString().split('T')[0]
}

function getDefaultDateRange() {
  const dateTo = new Date()
  const dateFrom = new Date()
  dateFrom.setDate(dateTo.getDate() - 29)
  return {
    dateFrom: toInputDate(dateFrom),
    dateTo: toInputDate(dateTo),
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatMetric(metric: MetricValue) {
  if (metric.unit === 'percent') return `${metric.value.toFixed(2)}%`
  if (metric.unit === 'days') return `${metric.value.toFixed(1)} días`
  return String(metric.value)
}

function formatMinutes(value: number) {
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`
}

export default function MvpReportesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth()
  const initialRange = getDefaultDateRange()
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom)
  const [dateTo, setDateTo] = useState(initialRange.dateTo)
  const [report, setReport] = useState<ReportsSummaryResponse | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (requiresPasswordChange) {
        router.push('/cambiar-password')
      }
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router])

  const fetchReport = async () => {
    setIsFetching(true)
    setError(null)
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
      const data = await apiRequest<ReportsSummaryResponse>(`/reports/summary/?${params}`)
      setReport(data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar los reportes')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || requiresPasswordChange) return
    fetchReport()
  }, [isAuthenticated, requiresPasswordChange])

  const metricCards = report ? [
    {
      title: report.operating_room_utilization.label,
      value: formatMetric(report.operating_room_utilization),
      description: 'Tiempo programado sobre capacidad disponible',
      icon: Percent,
      accent: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      title: report.cancellation_rate.label,
      value: formatMetric(report.cancellation_rate),
      description: 'Cirugías canceladas sobre total del período',
      icon: XCircle,
      accent: 'text-red-700',
      bg: 'bg-red-50',
    },
    {
      title: report.average_wait_days.label,
      value: formatMetric(report.average_wait_days),
      description: 'Días entre registro y programación',
      icon: Clock,
      accent: 'text-amber-700',
      bg: 'bg-amber-50',
    },
  ] : []

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage="reportes" navigationMode="mvp" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
                <p className="mt-1 text-muted-foreground">
                  Indicadores clave de gestión quirúrgica en tiempo real.
                </p>
              </div>
              {report && (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Generado: {formatDateTime(report.generated_at)}
                </div>
              )}
            </div>

            <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Desde
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-blue-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Hasta
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-blue-500"
                />
              </label>
              <button
                type="button"
                onClick={fetchReport}
                disabled={isFetching}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                {isFetching ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isFetching && !report ? (
              <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                Cargando indicadores...
              </div>
            ) : report ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {metricCards.map((card) => (
                    <div key={card.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-600">{card.title}</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-950">{card.value}</p>
                          <p className="mt-2 text-xs text-slate-500">{card.description}</p>
                        </div>
                        <div className={`rounded-lg p-3 ${card.bg}`}>
                          <card.icon size={22} className={card.accent} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <Activity size={18} className="text-blue-600" />
                        Utilización por quirófano
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Quirófano</th>
                            <th className="px-4 py-3">Uso</th>
                            <th className="px-4 py-3">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.details.operating_rooms.length > 0 ? report.details.operating_rooms.map((room) => (
                            <tr key={room.room}>
                              <td className="px-4 py-3 font-medium text-slate-900">{room.room}</td>
                              <td className="px-4 py-3 text-slate-600">{formatMinutes(room.scheduled_minutes)}</td>
                              <td className="px-4 py-3 text-slate-900">{room.utilization_percentage.toFixed(2)}%</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-slate-500">Sin datos de quirófanos</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <BarChart3 size={18} className="text-blue-600" />
                        Cirugías por estado
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.details.statuses.length > 0 ? report.details.statuses.map((status) => (
                            <tr key={status.estado}>
                              <td className="px-4 py-3 font-medium text-slate-900">{status.estado}</td>
                              <td className="px-4 py-3 text-slate-600">{status.count}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={2} className="px-4 py-6 text-center text-slate-500">Sin cirugías en el rango</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <CalendarDays size={18} className="text-blue-600" />
                        Espera por especialidad
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Especialidad</th>
                            <th className="px-4 py-3">Espera</th>
                            <th className="px-4 py-3">Casos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.details.wait_by_specialty.length > 0 ? report.details.wait_by_specialty.map((specialty) => (
                            <tr key={specialty.specialty}>
                              <td className="px-4 py-3 font-medium text-slate-900">{specialty.specialty}</td>
                              <td className="px-4 py-3 text-slate-600">{specialty.average_wait_days.toFixed(1)} días</td>
                              <td className="px-4 py-3 text-slate-600">{specialty.surgeries_count}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-slate-500">Sin cirugías programadas</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                No hay datos de reportes para mostrar.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
