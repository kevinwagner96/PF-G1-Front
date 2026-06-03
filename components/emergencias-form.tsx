'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, Clock, User, Stethoscope, Activity, ChevronRight, Plus, X, CheckCircle2 } from 'lucide-react'
import { mockQuirofanos, mockPersonal, mockTiposCirugia, mockPacientes, Cirugia, getCirugiasHoy } from '@/lib/mock-data'

const prioridades = ['Alta', 'Emergencia'] as const
const tiposAnestesia = ['General', 'Regional', 'Local', 'Sedación']

export default function EmergenciasForm() {
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    // Paso 1: Paciente
    pacienteExistente: true,
    pacienteId: '',
    nombrePaciente: '',
    dniPaciente: '',
    edadPaciente: '',
    obraSocial: '',
    // Paso 2: Intervención
    tipoCirugiaId: '',
    intervencion: '',
    especialidad: '',
    prioridad: 'Emergencia' as typeof prioridades[number],
    diagnostico: '',
    // Paso 3: Equipo y Quirófano
    quirofanoId: '',
    cirujanoId: '',
    anestesistaId: '',
    anestesia: 'General',
    // Paso 4: Confirmación
    observaciones: '',
  })

  const cirugiasHoy = getCirugiasHoy()
  
  // Quirófanos disponibles (sin cirugía en curso)
  const quirofanosDisponibles = useMemo(() => {
    return mockQuirofanos.filter(q => {
      if (!q.disponible) return false
      const enUso = cirugiasHoy.some(c => c.quirofanoId === q.id && c.estado === 'En Curso')
      return !enUso
    })
  }, [cirugiasHoy])

  // Personal disponible por rol
  const cirujanos = mockPersonal.filter(p => p.rol === 'Cirujano' && p.estado)
  const anestesistas = mockPersonal.filter(p => p.rol === 'Anestesista' && p.estado)
  const tiposCirugia = mockTiposCirugia.filter(t => t.estado)

  // Paciente seleccionado
  const pacienteSeleccionado = mockPacientes.find(p => p.id === formData.pacienteId)

  // Tipo de cirugía seleccionado
  const tipoCirugiaSeleccionado = tiposCirugia.find(t => t.id === formData.tipoCirugiaId)

  // Quirófano seleccionado
  const quirofanoSeleccionado = mockQuirofanos.find(q => q.id === formData.quirofanoId)

  // Cirujano seleccionado
  const cirujanoSeleccionado = cirujanos.find(c => c.id === formData.cirujanoId)

  // Anestesista seleccionado
  const anestesistaSeleccionado = anestesistas.find(a => a.id === formData.anestesistaId)

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    // Simular guardado
    console.log('Emergencia registrada:', formData)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      // Reset form
      setStep(1)
      setFormData({
        pacienteExistente: true,
        pacienteId: '',
        nombrePaciente: '',
        dniPaciente: '',
        edadPaciente: '',
        obraSocial: '',
        tipoCirugiaId: '',
        intervencion: '',
        especialidad: '',
        prioridad: 'Emergencia',
        diagnostico: '',
        quirofanoId: '',
        cirujanoId: '',
        anestesistaId: '',
        anestesia: 'General',
        observaciones: '',
      })
    }, 3000)
  }

  const isStep1Valid = formData.pacienteExistente 
    ? !!formData.pacienteId 
    : (!!formData.nombrePaciente && !!formData.dniPaciente)

  const isStep2Valid = !!formData.intervencion && !!formData.especialidad

  const isStep3Valid = !!formData.quirofanoId && !!formData.cirujanoId

  const canProceed = () => {
    switch (step) {
      case 1: return isStep1Valid
      case 2: return isStep2Valid
      case 3: return isStep3Valid
      default: return true
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-100 rounded-xl">
          <AlertTriangle className="text-red-600" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro de Emergencia</h1>
          <p className="text-muted-foreground mt-1">Formulario rápido para cirugías de emergencia</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        {[
          { num: 1, label: 'Paciente', icon: User },
          { num: 2, label: 'Intervención', icon: Activity },
          { num: 3, label: 'Equipo', icon: Stethoscope },
          { num: 4, label: 'Confirmar', icon: CheckCircle2 },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step > s.num ? 'bg-green-500 text-white' :
                step === s.num ? 'bg-red-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {step > s.num ? <CheckCircle2 size={20} /> : <s.icon size={20} />}
              </div>
              <span className={`font-medium hidden sm:block ${
                step >= s.num ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
            </div>
            {idx < 3 && (
              <ChevronRight className="mx-4 text-muted-foreground hidden sm:block" size={20} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {/* Step 1: Paciente */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <User size={22} className="text-red-500" />
              Datos del Paciente
            </h2>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, pacienteExistente: true, nombrePaciente: '', dniPaciente: '', edadPaciente: '', obraSocial: '' }))}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  formData.pacienteExistente 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-border bg-background text-foreground hover:border-muted-foreground'
                }`}
              >
                <div className="font-medium">Paciente Existente</div>
                <div className="text-sm opacity-70">Buscar en el sistema</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, pacienteExistente: false, pacienteId: '' }))}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  !formData.pacienteExistente 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-border bg-background text-foreground hover:border-muted-foreground'
                }`}
              >
                <div className="font-medium">Paciente Nuevo</div>
                <div className="text-sm opacity-70">Ingreso manual</div>
              </button>
            </div>

            {formData.pacienteExistente ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Buscar paciente *
                </label>
                <select
                  value={formData.pacienteId}
                  onChange={(e) => setFormData(prev => ({ ...prev, pacienteId: e.target.value }))}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Seleccione un paciente...</option>
                  {mockPacientes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} - DNI: {p.dni} - {p.obraSocial}
                    </option>
                  ))}
                </select>

                {pacienteSeleccionado && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="ml-2 text-foreground font-medium">{pacienteSeleccionado.nombre}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">DNI:</span>
                        <span className="ml-2 text-foreground font-medium">{pacienteSeleccionado.dni}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Edad:</span>
                        <span className="ml-2 text-foreground font-medium">{pacienteSeleccionado.edad} años</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Obra Social:</span>
                        <span className="ml-2 text-foreground font-medium">{pacienteSeleccionado.obraSocial}</span>
                      </div>
                      {pacienteSeleccionado.historial.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Historial:</span>
                          <span className="ml-2 text-foreground">{pacienteSeleccionado.historial.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombrePaciente}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombrePaciente: e.target.value }))}
                    placeholder="Nombre y apellido"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    DNI *
                  </label>
                  <input
                    type="text"
                    value={formData.dniPaciente}
                    onChange={(e) => setFormData(prev => ({ ...prev, dniPaciente: e.target.value }))}
                    placeholder="12345678"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Edad
                  </label>
                  <input
                    type="number"
                    value={formData.edadPaciente}
                    onChange={(e) => setFormData(prev => ({ ...prev, edadPaciente: e.target.value }))}
                    placeholder="45"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Obra Social
                  </label>
                  <input
                    type="text"
                    value={formData.obraSocial}
                    onChange={(e) => setFormData(prev => ({ ...prev, obraSocial: e.target.value }))}
                    placeholder="OSDE, Swiss Medical, etc."
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Intervención */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Activity size={22} className="text-red-500" />
              Datos de la Intervención
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de cirugía (catálogo)
              </label>
              <select
                value={formData.tipoCirugiaId}
                onChange={(e) => {
                  const tipo = tiposCirugia.find(t => t.id === e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    tipoCirugiaId: e.target.value,
                    intervencion: tipo?.nombre || prev.intervencion,
                    especialidad: tipo?.especialidad || prev.especialidad,
                  }))
                }}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleccione o ingrese manualmente...</option>
                {tiposCirugia.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} - {t.especialidad} ({t.duracionEstimada} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Intervención *
                </label>
                <input
                  type="text"
                  value={formData.intervencion}
                  onChange={(e) => setFormData(prev => ({ ...prev, intervencion: e.target.value }))}
                  placeholder="Nombre de la intervención"
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Especialidad *
                </label>
                <select
                  value={formData.especialidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Seleccione...</option>
                  {['Traumatología', 'Cirugía General', 'Cardiología', 'Neurología', 'Urología', 'Ginecología', 'Vascular', 'Oftalmología'].map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Prioridad *
              </label>
              <div className="flex gap-4">
                {prioridades.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, prioridad: p }))}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      formData.prioridad === p
                        ? p === 'Emergencia' 
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-border bg-background text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <div className="font-medium">{p}</div>
                    <div className="text-xs opacity-70">
                      {p === 'Emergencia' ? 'Inmediata' : 'Urgente < 4h'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Diagnóstico / Motivo
              </label>
              <textarea
                value={formData.diagnostico}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
                placeholder="Descripción del diagnóstico o motivo de emergencia..."
                rows={3}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Equipo y Quirófano */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Stethoscope size={22} className="text-red-500" />
              Equipo Médico y Quirófano
            </h2>

            {/* Quirófano */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quirófano disponible *
              </label>
              {quirofanosDisponibles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quirofanosDisponibles.map(q => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quirofanoId: q.id }))}
                      className={`p-4 rounded-lg border-2 transition-colors text-left ${
                        formData.quirofanoId === q.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-border bg-background hover:border-muted-foreground'
                      }`}
                    >
                      <div className="font-medium text-foreground">{q.nombre}</div>
                      <div className="text-sm text-muted-foreground">Piso {q.piso}</div>
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                        Disponible
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                  <AlertTriangle className="inline mr-2" size={18} />
                  No hay quirófanos disponibles en este momento. Todos están en uso o no disponibles.
                </div>
              )}
            </div>

            {/* Cirujano */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cirujano principal *
              </label>
              <select
                value={formData.cirujanoId}
                onChange={(e) => setFormData(prev => ({ ...prev, cirujanoId: e.target.value }))}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleccione un cirujano...</option>
                {cirujanos
                  .filter(c => !formData.especialidad || c.especialidad === formData.especialidad || c.especialidad === 'Cirugía General')
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} - {c.especialidad}
                    </option>
                  ))}
              </select>
              {formData.especialidad && (
                <p className="text-xs text-muted-foreground mt-1">
                  Mostrando cirujanos de {formData.especialidad} y Cirugía General
                </p>
              )}
            </div>

            {/* Anestesista */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Anestesista
              </label>
              <select
                value={formData.anestesistaId}
                onChange={(e) => setFormData(prev => ({ ...prev, anestesistaId: e.target.value }))}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleccione un anestesista...</option>
                {anestesistas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            {/* Tipo de anestesia */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de anestesia
              </label>
              <div className="flex flex-wrap gap-2">
                {tiposAnestesia.map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, anestesia: tipo }))}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.anestesia === tipo
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border bg-background text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmación */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 size={22} className="text-red-500" />
              Confirmar Emergencia
            </h2>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-red-600" size={24} />
                <span className="text-lg font-semibold text-red-800">Resumen de la Emergencia</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-red-600 font-medium">Paciente:</span>
                    <p className="text-red-900 font-semibold">
                      {formData.pacienteExistente 
                        ? pacienteSeleccionado?.nombre 
                        : formData.nombrePaciente}
                    </p>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">DNI:</span>
                    <p className="text-red-900">
                      {formData.pacienteExistente 
                        ? pacienteSeleccionado?.dni 
                        : formData.dniPaciente}
                    </p>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Intervención:</span>
                    <p className="text-red-900 font-semibold">{formData.intervencion}</p>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Especialidad:</span>
                    <p className="text-red-900">{formData.especialidad}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-red-600 font-medium">Quirófano:</span>
                    <p className="text-red-900 font-semibold">{quirofanoSeleccionado?.nombre}</p>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Cirujano:</span>
                    <p className="text-red-900">{cirujanoSeleccionado?.nombre}</p>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Anestesista:</span>
                    <p className="text-red-900">{anestesistaSeleccionado?.nombre || 'No asignado'}</p>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Anestesia:</span>
                    <p className="text-red-900">{formData.anestesia}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-red-200">
                <span className="text-red-600 font-medium">Prioridad:</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${
                  formData.prioridad === 'Emergencia' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-orange-500 text-white'
                }`}>
                  {formData.prioridad}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Observaciones adicionales
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Notas adicionales para el equipo..."
                rows={3}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
              <span className="text-yellow-800 text-sm">
                Al confirmar, se notificará automáticamente al equipo médico y se bloqueará el quirófano seleccionado.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={step === 1}
          className="px-6 py-3 rounded-lg bg-muted text-foreground hover:bg-muted/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={!canProceed()}
            className="px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Siguiente
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold flex items-center gap-2 animate-pulse"
          >
            <AlertTriangle size={20} />
            CONFIRMAR EMERGENCIA
          </button>
        )}
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Emergencia Registrada</h3>
            <p className="text-muted-foreground mb-4">
              Se ha notificado al equipo médico y el quirófano ha sido reservado.
            </p>
            <div className="text-sm text-muted-foreground">
              Redirigiendo en unos segundos...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
