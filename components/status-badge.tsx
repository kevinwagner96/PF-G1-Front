import { Activity, CalendarClock, CheckCircle2, CircleDashed, Clock3, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

type StatusKind = 'surgery' | 'planning'

const surgeryStatuses: Record<string, { label: string; className: string; icon: typeof Activity }> = {
  Pendiente: { label: 'Pendiente', className: 'border-slate-200 bg-slate-50 text-slate-700', icon: Clock3 },
  Programada: { label: 'Programada', className: 'border-blue-200 bg-blue-50 text-blue-700', icon: CalendarClock },
  'En Curso': { label: 'En curso', className: 'border-amber-200 bg-amber-50 text-amber-800', icon: Activity },
  Completada: { label: 'Completada', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  Cancelada: { label: 'Cancelada', className: 'border-red-200 bg-red-50 text-red-700', icon: XCircle },
}

const planningStatuses: Record<string, { label: string; className: string; icon: typeof Activity }> = {
  planning: { label: 'Planificando', className: 'border-blue-200 bg-blue-50 text-blue-700', icon: Activity },
  pending_approval: { label: 'Pendiente de aprobación', className: 'border-amber-200 bg-amber-50 text-amber-800', icon: Clock3 },
  approved: { label: 'Aprobada', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rechazada', className: 'border-slate-200 bg-slate-50 text-slate-700', icon: XCircle },
  failed: { label: 'Fallida', className: 'border-red-200 bg-red-50 text-red-700', icon: XCircle },
}

export function getStatusMeta(kind: StatusKind, status: string) {
  const statusMap = kind === 'planning' ? planningStatuses : surgeryStatuses
  return statusMap[status] ?? {
    label: status || 'Sin estado',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    icon: CircleDashed,
  }
}

interface StatusBadgeProps {
  kind: StatusKind
  status: string
  className?: string
}

export default function StatusBadge({ kind, status, className }: StatusBadgeProps) {
  const meta = getStatusMeta(kind, status)
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium', meta.className, className)}>
      <Icon size={13} className={kind === 'planning' && status === 'planning' ? 'animate-pulse' : undefined} aria-hidden="true" />
      {meta.label}
    </span>
  )
}
