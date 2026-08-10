import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type FeedbackTone = 'error' | 'success' | 'warning' | 'info'

const toneConfig = {
  error: { icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-800' },
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  warning: { icon: TriangleAlert, className: 'border-amber-200 bg-amber-50 text-amber-800' },
  info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-800' },
} satisfies Record<FeedbackTone, { icon: typeof Info; className: string }>

interface FeedbackMessageProps {
  tone?: FeedbackTone
  title?: string
  children: ReactNode
  className?: string
}

export default function FeedbackMessage({ tone = 'info', title, children, className }: FeedbackMessageProps) {
  const config = toneConfig[tone]
  const Icon = config.icon

  return (
    <div role={tone === 'error' ? 'alert' : 'status'} aria-live="polite" className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', config.className, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : undefined}>{children}</div>
      </div>
    </div>
  )
}
