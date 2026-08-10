import { FlaskConical } from 'lucide-react'

export default function MockDataNotice() {
  return (
    <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-6 py-2 text-xs text-blue-800" role="status">
      <FlaskConical size={14} aria-hidden="true" />
      <span><strong>Datos simulados:</strong> los cambios se restablecen al recargar la página.</span>
    </div>
  )
}
