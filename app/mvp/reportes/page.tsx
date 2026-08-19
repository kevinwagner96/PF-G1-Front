'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  Download,
  Percent,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Sidebar from '@/components/sidebar'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import FeedbackMessage from '@/components/feedback-message'
import PageHeader from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'

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

interface SurgeriesBySpecialtyDetail {
  specialty: string
  count: number
}

interface SurgeriesByDayDetail {
  date: string
  count: number
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
    surgeries_by_specialty: SurgeriesBySpecialtyDetail[]
    surgeries_by_day: SurgeriesByDayDetail[]
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

function formatShortDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year.slice(2)}`
}

const SURGERY_STATUS_COLORS: Record<string, string> = {
  Pendiente: '#94a3b8',
  Programada: '#3b82f6',
  'En Curso': '#f59e0b',
  Completada: '#10b981',
  Cancelada: '#ef4444',
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#94a3b8']

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      {text}
    </div>
  )
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
  const isDateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo)

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
    if (isDateRangeInvalid) return
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
    <div className="flex h-screen bg-background print:block print:h-auto">
      <div className="print:hidden">
        <Sidebar activePage="reportes" navigationMode="mvp" />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <main className="flex-1 overflow-auto print:overflow-visible">
          <div className="p-6 md:p-8 print:p-0">
            <PageHeader
              className="mb-6"
              eyebrow="MVP · Datos reales"
              title="Reportes"
              description="Indicadores clave de gestión quirúrgica calculados en tiempo real para el período seleccionado."
              actions={report && (
                <>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 print:hidden"
                  >
                    <Download size={16} />
                    Descargar PDF
                  </button>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 print:hidden">
                    Generado: {formatDateTime(report.generated_at)}
                  </div>
                </>
              )}
            />

            {report && (
              <div className="hidden print:mb-6 print:block">
                <p className="text-sm font-medium text-slate-600">
                  Período: {new Intl.DateTimeFormat('es-AR').format(new Date(`${report.range.date_from}T12:00:00`))} al {new Intl.DateTimeFormat('es-AR').format(new Date(`${report.range.date_to}T12:00:00`))} · Generado: {formatDateTime(report.generated_at)}
                </p>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 print:hidden">
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
                disabled={isFetching || isDateRangeInvalid}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                {isFetching ? 'Actualizando...' : 'Actualizar'}
              </button>
              {report && (
                <p className="ml-auto text-xs text-slate-500">
                  Período mostrado: {new Intl.DateTimeFormat('es-AR').format(new Date(`${report.range.date_from}T12:00:00`))} al {new Intl.DateTimeFormat('es-AR').format(new Date(`${report.range.date_to}T12:00:00`))}
                </p>
              )}
            </div>

            {isDateRangeInvalid && (
              <FeedbackMessage className="mb-6" tone="error" title="Rango de fechas inválido">
                La fecha “Desde” debe ser anterior o igual a la fecha “Hasta”.
              </FeedbackMessage>
            )}

            {error && (
              <FeedbackMessage className="mb-6" tone="error" title="No se pudieron actualizar los reportes">
                <div className="flex flex-wrap items-center gap-3"><span>{error}</span><button type="button" onClick={fetchReport} className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-red-50">Reintentar</button></div>
              </FeedbackMessage>
            )}

            {isFetching && !report ? (
              <div className="space-y-6" aria-label="Cargando indicadores">
                <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="rounded-lg border border-slate-200 bg-white p-5"><Skeleton className="h-4 w-36" /><Skeleton className="mt-4 h-9 w-24" /><Skeleton className="mt-4 h-3 w-52" /></div>)}</div>
                <div className="grid gap-6 xl:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-56 rounded-lg" />)}</div>
              </div>
            ) : report ? (
              <div className={`space-y-6 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`} aria-busy={isFetching}>
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

                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                      <Activity size={18} className="text-blue-600" />
                      Evolutivo de cirugías por día
                    </h2>
                  </div>
                  <div className="h-72 p-4">
                    {report.details.surgeries_by_day.some((item) => item.count > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={report.details.surgeries_by_day} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} minTickGap={24} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip labelFormatter={(label) => formatShortDate(String(label))} />
                          <Legend />
                          <Line type="monotone" dataKey="count" name="Cirugías" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <ChartEmpty text="Sin cirugías en el período" />
                    )}
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <CalendarDays size={18} className="text-blue-600" />
                        Cirugías por especialidad
                      </h2>
                    </div>
                    <div className="h-72 p-4">
                      {report.details.surgeries_by_specialty.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={report.details.surgeries_by_specialty} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="specialty" width={130} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" name="Cirugías" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartEmpty text="Sin cirugías en el período" />
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <Clock size={18} className="text-blue-600" />
                        Espera por especialidad
                      </h2>
                    </div>
                    <div className="h-72 p-4">
                      {report.details.wait_by_specialty.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={report.details.wait_by_specialty} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="specialty" width={130} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => [`${value} días`, 'Espera promedio']} />
                            <Bar dataKey="average_wait_days" name="Espera promedio" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartEmpty text="Sin cirugías programadas" />
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <Percent size={18} className="text-blue-600" />
                        Utilización por quirófano
                      </h2>
                    </div>
                    <div className="h-72 p-4">
                      {report.details.operating_rooms.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={report.details.operating_rooms} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
                            <YAxis type="category" dataKey="room" width={130} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Utilización']} />
                            <Bar dataKey="utilization_percentage" name="Utilización" fill="#10b981" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartEmpty text="Sin datos de quirófanos" />
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <BarChart3 size={18} className="text-blue-600" />
                        Cirugías por estado
                      </h2>
                    </div>
                    <div className="h-72 p-4">
                      {report.details.statuses.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={report.details.statuses}
                              dataKey="count"
                              nameKey="estado"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={2}
                            >
                              {report.details.statuses.map((entry, index) => (
                                <Cell key={entry.estado} fill={SURGERY_STATUS_COLORS[entry.estado] ?? CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartEmpty text="Sin cirugías en el rango" />
                      )}
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
