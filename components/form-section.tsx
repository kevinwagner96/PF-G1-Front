import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export default function FormSection({ title, description, icon, children, className }: FormSectionProps) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="mb-4 flex items-start gap-3">
        {icon && <div className="mt-0.5 text-blue-600">{icon}</div>}
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
