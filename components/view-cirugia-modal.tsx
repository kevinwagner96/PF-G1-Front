import { X } from 'lucide-react'

interface Cirugia {
  id: string
  fecha: string
  hora: string
  paciente: string
  prioridad: 'Normal' | 'Urgente' | 'Emergencia'
  servicio: string
  sala: string
  especialidad: string
  intervencion: string
  anestesia: string
  cirujano: string
  estado: 'Programada' | 'En Curso' | 'Completada' | 'Cancelada'
  quirofano: string
}

export default function ViewCirugia({ cirugia, onClose }: { cirugia: Cirugia; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-foreground">Detalles de Cirugía</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Paciente</label>
              <p className="text-lg text-foreground">{cirugia.paciente}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Prioridad</label>
              <p className="text-lg text-foreground">{cirugia.prioridad}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Fecha y Hora</label>
              <p className="text-lg text-foreground">{cirugia.fecha} {cirugia.hora}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Estado</label>
              <p className="text-lg text-foreground">{cirugia.estado}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Servicio</label>
              <p className="text-lg text-foreground">{cirugia.servicio}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Sala</label>
              <p className="text-lg text-foreground">{cirugia.sala}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Especialidad</label>
              <p className="text-lg text-foreground">{cirugia.especialidad}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Intervención</label>
              <p className="text-lg text-foreground">{cirugia.intervencion}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Anestesia</label>
              <p className="text-lg text-foreground">{cirugia.anestesia}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Cirujano</label>
              <p className="text-lg text-foreground">{cirugia.cirujano}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Quirófano</label>
              <p className="text-lg text-foreground">{cirugia.quirofano}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
