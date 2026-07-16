import { Activity, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'

const statusStyles: Record<string, string> = {
  Pendiente: 'bg-slate-100 text-slate-700',
  Programada: 'bg-blue-50 text-blue-700',
  'En Curso': 'bg-amber-50 text-amber-700',
  Completada: 'bg-emerald-50 text-emerald-700',
  Cancelada: 'bg-red-50 text-red-700',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'Pendiente') return <Clock size={13} />
  if (status === 'Programada') return <Calendar size={13} />
  if (status === 'En Curso') return <Activity size={13} className="animate-pulse" />
  if (status === 'Completada') return <CheckCircle size={13} />
  if (status === 'Cancelada') return <XCircle size={13} />
  return <Clock size={13} />
}

export default function SurgeryStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        statusStyles[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      <StatusIcon status={status} />
      {status}
    </span>
  )
}
