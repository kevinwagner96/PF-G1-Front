import StatusBadge from '@/components/status-badge'

export default function SurgeryStatusBadge({ status }: { status: string }) {
  return <StatusBadge kind="surgery" status={status} />
}
