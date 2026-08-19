'use client'

import type { ReactNode } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  busy?: boolean
  busyLabel?: string
  tone?: 'danger' | 'primary' | 'success'
  detail?: ReactNode
}

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  busy = false,
  busyLabel = 'Procesando...',
  tone = 'danger',
  detail,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {detail}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Volver</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
            className={cn(
              tone === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600'
                : tone === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            {busy ? busyLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
