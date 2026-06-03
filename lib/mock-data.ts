// ==================== DATOS MOCK ====================
// Pacientes: 20, Cirujanos: 10, Personal: 20, Quirófanos: 5
// Tipos cirugía: 15, Cirugías: 50, Alertas: 10

export interface Paciente {
  id: string
  dni: string
  nombre: string
  edad: number
  obraSocial: string
  historial: string[]
}

export interface Personal {
  id: string
  dni: string
  nombre: string
  email: string
  rol: 'Cirujano' | 'Anestesista' | 'Instrumentador' | 'Ayudante' | 'Enfermero'
  especialidad: string
  estado: boolean
}

export interface Quirofano {
  id: string
  nombre: string
  piso: string
  disponible: boolean
}

export interface TipoCirugia {
  id: string
  nombre: string
  especialidad: string
  complejidad: 'Baja' | 'Media' | 'Alta'
  duracionEstimada: number // minutos
  descripcion: string
  estado: boolean
}

export interface Cirugia {
  id: string
  fecha: string
  hora: string
  horaFin?: string
  pacienteId: string
  paciente: string
  dni: string
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Emergencia'
  servicio: string
  quirofanoId: string
  quirofano: string
  especialidad: string
  intervencion: string
  anestesia: string
  cirujanoId: string
  cirujano: string
  anestesistaId?: string
  anestesista?: string
  instrumentadorId?: string
  instrumentador?: string
  ayudantes?: string[]
  estado: 'Pendiente' | 'Programada' | 'En Curso' | 'Completada' | 'Cancelada'
  insumos?: { nombre: string; cantidad: number }[]
  observaciones?: string
  tiempoEspera?: number // días
}

export interface Alerta {
  id: string
  tipo: 'insumo' | 'conflicto' | 'personal'
  mensaje: string
  cirugiaId?: string
  urgencia: 'baja' | 'media' | 'alta'
  fecha: string
}

export interface Usuario {
  id: string
  email: string
  password: string
  nombre: string
  rol: 'Administrador' | 'Cirujano' | 'Jefe Quirófano' | 'Recepcionista'
  requiereCambioPassword: boolean
  bloqueado: boolean
  personalId?: string
}

// ==================== USUARIOS ====================
export const mockUsuarios: Usuario[] = [
  { id: 'u1', email: 'admin@hospital.com', password: 'admin123', nombre: 'Dr. García', rol: 'Administrador', requiereCambioPassword: false, bloqueado: false },
  { id: 'u2', email: 'cirujano@hospital.com', password: 'cirujano123', nombre: 'Dr. López', rol: 'Cirujano', requiereCambioPassword: true, bloqueado: false, personalId: 'p1' },
  { id: 'u3', email: 'jefe@hospital.com', password: 'jefe123', nombre: 'Dra. Martínez', rol: 'Jefe Quirófano', requiereCambioPassword: false, bloqueado: false },
  { id: 'u4', email: 'recepcion@hospital.com', password: 'recepcion123', nombre: 'María Sánchez', rol: 'Recepcionista', requiereCambioPassword: false, bloqueado: false },
  { id: 'u5', email: 'bloqueado@hospital.com', password: 'blocked123', nombre: 'Dr. Bloqueado', rol: 'Cirujano', requiereCambioPassword: false, bloqueado: true },
]

// ==================== PACIENTES ====================
export const mockPacientes: Paciente[] = [
  { id: 'pac1', dni: '12345678', nombre: 'Juan Martínez', edad: 45, obraSocial: 'OSDE', historial: ['Hipertensión', 'Diabetes tipo 2'] },
  { id: 'pac2', dni: '23456789', nombre: 'María González', edad: 32, obraSocial: 'Swiss Medical', historial: ['Asma'] },
  { id: 'pac3', dni: '34567890', nombre: 'Carlos Ruiz', edad: 58, obraSocial: 'Galeno', historial: ['Cataratas', 'Artritis'] },
  { id: 'pac4', dni: '45678901', nombre: 'Ana López', edad: 28, obraSocial: 'OSDE', historial: [] },
  { id: 'pac5', dni: '56789012', nombre: 'Pedro Sánchez', edad: 67, obraSocial: 'PAMI', historial: ['Cardiopatía', 'EPOC'] },
  { id: 'pac6', dni: '67890123', nombre: 'Laura Fernández', edad: 41, obraSocial: 'Swiss Medical', historial: ['Hipotiroidismo'] },
  { id: 'pac7', dni: '78901234', nombre: 'Roberto García', edad: 55, obraSocial: 'Galeno', historial: ['Hernia discal'] },
  { id: 'pac8', dni: '89012345', nombre: 'Silvia Pérez', edad: 39, obraSocial: 'OSDE', historial: ['Migraña crónica'] },
  { id: 'pac9', dni: '90123456', nombre: 'Martín Díaz', edad: 62, obraSocial: 'PAMI', historial: ['Artrosis', 'Hipertensión'] },
  { id: 'pac10', dni: '01234567', nombre: 'Claudia Moreno', edad: 35, obraSocial: 'Swiss Medical', historial: [] },
  { id: 'pac11', dni: '11223344', nombre: 'Diego Torres', edad: 48, obraSocial: 'Galeno', historial: ['Várices'] },
  { id: 'pac12', dni: '22334455', nombre: 'Patricia Vega', edad: 52, obraSocial: 'OSDE', historial: ['Cálculos biliares'] },
  { id: 'pac13', dni: '33445566', nombre: 'Alejandro Ríos', edad: 44, obraSocial: 'Swiss Medical', historial: ['Apendicitis previa'] },
  { id: 'pac14', dni: '44556677', nombre: 'Natalia Castro', edad: 29, obraSocial: 'Galeno', historial: [] },
  { id: 'pac15', dni: '55667788', nombre: 'Fernando Luna', edad: 71, obraSocial: 'PAMI', historial: ['Próstata', 'Diabetes'] },
  { id: 'pac16', dni: '66778899', nombre: 'Gabriela Mendoza', edad: 36, obraSocial: 'OSDE', historial: ['Endometriosis'] },
  { id: 'pac17', dni: '77889900', nombre: 'Oscar Navarro', edad: 59, obraSocial: 'Swiss Medical', historial: ['Colesterol alto'] },
  { id: 'pac18', dni: '88990011', nombre: 'Verónica Herrera', edad: 43, obraSocial: 'Galeno', historial: ['Fibromialgia'] },
  { id: 'pac19', dni: '99001122', nombre: 'Sergio Romero', edad: 50, obraSocial: 'PAMI', historial: ['Bypass previo'] },
  { id: 'pac20', dni: '10111213', nombre: 'Luciana Ortiz', edad: 33, obraSocial: 'OSDE', historial: [] },
]

// ==================== PERSONAL MÉDICO ====================
export const mockPersonal: Personal[] = [
  // Cirujanos (10)
  { id: 'p1', dni: '20111111', nombre: 'Dr. López', email: 'lopez@hospital.com', rol: 'Cirujano', especialidad: 'Traumatología', estado: true },
  { id: 'p2', dni: '20222222', nombre: 'Dra. Fernández', email: 'fernandez@hospital.com', rol: 'Cirujano', especialidad: 'Oftalmología', estado: true },
  { id: 'p3', dni: '20333333', nombre: 'Dr. Rodríguez', email: 'rodriguez@hospital.com', rol: 'Cirujano', especialidad: 'Cirugía General', estado: true },
  { id: 'p4', dni: '20444444', nombre: 'Dra. Martínez', email: 'martinez@hospital.com', rol: 'Cirujano', especialidad: 'Cardiología', estado: true },
  { id: 'p5', dni: '20555555', nombre: 'Dr. Gómez', email: 'gomez@hospital.com', rol: 'Cirujano', especialidad: 'Neurología', estado: true },
  { id: 'p6', dni: '20666666', nombre: 'Dra. Silva', email: 'silva@hospital.com', rol: 'Cirujano', especialidad: 'Urología', estado: true },
  { id: 'p7', dni: '20777777', nombre: 'Dr. Vargas', email: 'vargas@hospital.com', rol: 'Cirujano', especialidad: 'Ortopedia', estado: true },
  { id: 'p8', dni: '20888888', nombre: 'Dra. Rojas', email: 'rojas@hospital.com', rol: 'Cirujano', especialidad: 'Ginecología', estado: false },
  { id: 'p9', dni: '20999999', nombre: 'Dr. Castro', email: 'castro@hospital.com', rol: 'Cirujano', especialidad: 'Vascular', estado: true },
  { id: 'p10', dni: '21000000', nombre: 'Dra. Morales', email: 'morales@hospital.com', rol: 'Cirujano', especialidad: 'Plástica', estado: true },
  // Anestesistas (4)
  { id: 'p11', dni: '21111111', nombre: 'Dr. Paz', email: 'paz@hospital.com', rol: 'Anestesista', especialidad: 'Anestesiología', estado: true },
  { id: 'p12', dni: '21222222', nombre: 'Dra. Luna', email: 'luna@hospital.com', rol: 'Anestesista', especialidad: 'Anestesiología', estado: true },
  { id: 'p13', dni: '21333333', nombre: 'Dr. Soto', email: 'soto@hospital.com', rol: 'Anestesista', especialidad: 'Anestesiología', estado: true },
  { id: 'p14', dni: '21444444', nombre: 'Dra. Vega', email: 'vega@hospital.com', rol: 'Anestesista', especialidad: 'Anestesiología', estado: false },
  // Instrumentadores (3)
  { id: 'p15', dni: '21555555', nombre: 'Lic. Torres', email: 'torres@hospital.com', rol: 'Instrumentador', especialidad: 'Instrumentación', estado: true },
  { id: 'p16', dni: '21666666', nombre: 'Lic. Ramos', email: 'ramos@hospital.com', rol: 'Instrumentador', especialidad: 'Instrumentación', estado: true },
  { id: 'p17', dni: '21777777', nombre: 'Lic. Herrera', email: 'herrera@hospital.com', rol: 'Instrumentador', especialidad: 'Instrumentación', estado: true },
  // Ayudantes/Enfermeros (3)
  { id: 'p18', dni: '21888888', nombre: 'Enf. Molina', email: 'molina@hospital.com', rol: 'Ayudante', especialidad: 'Enfermería', estado: true },
  { id: 'p19', dni: '21999999', nombre: 'Enf. Ríos', email: 'rios@hospital.com', rol: 'Ayudante', especialidad: 'Enfermería', estado: true },
  { id: 'p20', dni: '22000000', nombre: 'Enf. Campos', email: 'campos@hospital.com', rol: 'Enfermero', especialidad: 'Enfermería', estado: true },
]

// ==================== QUIRÓFANOS ====================
export const mockQuirofanos: Quirofano[] = [
  { id: 'qf1', nombre: 'Quirófano A', piso: '2', disponible: true },
  { id: 'qf2', nombre: 'Quirófano B', piso: '2', disponible: true },
  { id: 'qf3', nombre: 'Quirófano C', piso: '3', disponible: true },
  { id: 'qf4', nombre: 'Quirófano D', piso: '3', disponible: false },
  { id: 'qf5', nombre: 'Quirófano E - Emergencias', piso: '1', disponible: true },
]

// ==================== TIPOS DE CIRUGÍA ====================
export const mockTiposCirugia: TipoCirugia[] = [
  { id: 'tc1', nombre: 'Apendicectomía', especialidad: 'Cirugía General', complejidad: 'Media', duracionEstimada: 60, descripcion: 'Extirpación del apéndice', estado: true },
  { id: 'tc2', nombre: 'Colecistectomía', especialidad: 'Cirugía General', complejidad: 'Media', duracionEstimada: 90, descripcion: 'Extirpación de vesícula biliar', estado: true },
  { id: 'tc3', nombre: 'Hernioplastia inguinal', especialidad: 'Cirugía General', complejidad: 'Baja', duracionEstimada: 45, descripcion: 'Reparación de hernia inguinal', estado: true },
  { id: 'tc4', nombre: 'Artroscopia de rodilla', especialidad: 'Traumatología', complejidad: 'Media', duracionEstimada: 60, descripcion: 'Cirugía mínimamente invasiva de rodilla', estado: true },
  { id: 'tc5', nombre: 'Prótesis de cadera', especialidad: 'Traumatología', complejidad: 'Alta', duracionEstimada: 180, descripcion: 'Reemplazo total de cadera', estado: true },
  { id: 'tc6', nombre: 'Fractura de tibia', especialidad: 'Traumatología', complejidad: 'Media', duracionEstimada: 120, descripcion: 'Reducción y fijación de fractura', estado: true },
  { id: 'tc7', nombre: 'Cirugía de cataratas', especialidad: 'Oftalmología', complejidad: 'Baja', duracionEstimada: 30, descripcion: 'Facoemulsificación con lente intraocular', estado: true },
  { id: 'tc8', nombre: 'Bypass coronario', especialidad: 'Cardiología', complejidad: 'Alta', duracionEstimada: 300, descripcion: 'Revascularización miocárdica', estado: true },
  { id: 'tc9', nombre: 'Marcapasos', especialidad: 'Cardiología', complejidad: 'Media', duracionEstimada: 90, descripcion: 'Implante de marcapasos', estado: true },
  { id: 'tc10', nombre: 'Craneotomía', especialidad: 'Neurología', complejidad: 'Alta', duracionEstimada: 240, descripcion: 'Apertura del cráneo para acceso cerebral', estado: true },
  { id: 'tc11', nombre: 'Prostatectomía', especialidad: 'Urología', complejidad: 'Media', duracionEstimada: 120, descripcion: 'Extirpación de próstata', estado: true },
  { id: 'tc12', nombre: 'Cesárea', especialidad: 'Ginecología', complejidad: 'Media', duracionEstimada: 60, descripcion: 'Parto por cesárea', estado: true },
  { id: 'tc13', nombre: 'Histerectomía', especialidad: 'Ginecología', complejidad: 'Media', duracionEstimada: 120, descripcion: 'Extirpación del útero', estado: true },
  { id: 'tc14', nombre: 'Safenectomía', especialidad: 'Vascular', complejidad: 'Baja', duracionEstimada: 60, descripcion: 'Extirpación de vena safena', estado: true },
  { id: 'tc15', nombre: 'Rinoplastia', especialidad: 'Plástica', complejidad: 'Media', duracionEstimada: 120, descripcion: 'Cirugía estética de nariz', estado: false },
]

// ==================== CIRUGÍAS ====================
const hoy = new Date()
const formatDate = (date: Date) => date.toISOString().split('T')[0]

export const mockCirugias: Cirugia[] = [
  // Cirugías de hoy
  { id: 'c1', fecha: formatDate(hoy), hora: '08:00', horaFin: '10:00', pacienteId: 'pac1', paciente: 'Juan Martínez', dni: '12345678', prioridad: 'Media', servicio: 'Traumatología', quirofanoId: 'qf1', quirofano: 'Quirófano A', especialidad: 'Traumatología', intervencion: 'Fractura de tibia', anestesia: 'General', cirujanoId: 'p1', cirujano: 'Dr. López', anestesistaId: 'p11', anestesista: 'Dr. Paz', instrumentadorId: 'p15', instrumentador: 'Lic. Torres', estado: 'En Curso', insumos: [{ nombre: 'Placa de titanio', cantidad: 1 }, { nombre: 'Tornillos', cantidad: 6 }] },
  { id: 'c2', fecha: formatDate(hoy), hora: '10:30', horaFin: '11:30', pacienteId: 'pac2', paciente: 'María González', dni: '23456789', prioridad: 'Alta', servicio: 'Cirugía General', quirofanoId: 'qf2', quirofano: 'Quirófano B', especialidad: 'Cirugía General', intervencion: 'Apendicectomía', anestesia: 'General', cirujanoId: 'p3', cirujano: 'Dr. Rodríguez', anestesistaId: 'p12', anestesista: 'Dra. Luna', estado: 'Programada' },
  { id: 'c3', fecha: formatDate(hoy), hora: '09:00', horaFin: '09:30', pacienteId: 'pac3', paciente: 'Carlos Ruiz', dni: '34567890', prioridad: 'Baja', servicio: 'Oftalmología', quirofanoId: 'qf3', quirofano: 'Quirófano C', especialidad: 'Oftalmología', intervencion: 'Cirugía de cataratas', anestesia: 'Local', cirujanoId: 'p2', cirujano: 'Dra. Fernández', estado: 'Completada' },
  { id: 'c4', fecha: formatDate(hoy), hora: '14:00', horaFin: '16:00', pacienteId: 'pac5', paciente: 'Pedro Sánchez', dni: '56789012', prioridad: 'Alta', servicio: 'Cardiología', quirofanoId: 'qf1', quirofano: 'Quirófano A', especialidad: 'Cardiología', intervencion: 'Marcapasos', anestesia: 'Local', cirujanoId: 'p4', cirujano: 'Dra. Martínez', estado: 'Programada' },
  { id: 'c5', fecha: formatDate(hoy), hora: '16:30', horaFin: '18:00', pacienteId: 'pac6', paciente: 'Laura Fernández', dni: '67890123', prioridad: 'Media', servicio: 'Cirugía General', quirofanoId: 'qf2', quirofano: 'Quirófano B', especialidad: 'Cirugía General', intervencion: 'Colecistectomía', anestesia: 'General', cirujanoId: 'p3', cirujano: 'Dr. Rodríguez', estado: 'Programada' },
  
  // Cirugías mañana
  { id: 'c6', fecha: formatDate(new Date(hoy.getTime() + 86400000)), hora: '08:00', pacienteId: 'pac7', paciente: 'Roberto García', dni: '78901234', prioridad: 'Media', servicio: 'Traumatología', quirofanoId: 'qf1', quirofano: 'Quirófano A', especialidad: 'Traumatología', intervencion: 'Artroscopia de rodilla', anestesia: 'Regional', cirujanoId: 'p7', cirujano: 'Dr. Vargas', estado: 'Programada' },
  { id: 'c7', fecha: formatDate(new Date(hoy.getTime() + 86400000)), hora: '10:00', pacienteId: 'pac8', paciente: 'Silvia Pérez', dni: '89012345', prioridad: 'Baja', servicio: 'Neurología', quirofanoId: 'qf3', quirofano: 'Quirófano C', especialidad: 'Neurología', intervencion: 'Craneotomía', anestesia: 'General', cirujanoId: 'p5', cirujano: 'Dr. Gómez', estado: 'Programada' },
  
  // Cirugías pasadas (ayer)
  { id: 'c8', fecha: formatDate(new Date(hoy.getTime() - 86400000)), hora: '09:00', pacienteId: 'pac9', paciente: 'Martín Díaz', dni: '90123456', prioridad: 'Media', servicio: 'Urología', quirofanoId: 'qf2', quirofano: 'Quirófano B', especialidad: 'Urología', intervencion: 'Prostatectomía', anestesia: 'General', cirujanoId: 'p6', cirujano: 'Dra. Silva', estado: 'Completada' },
  { id: 'c9', fecha: formatDate(new Date(hoy.getTime() - 86400000)), hora: '14:00', pacienteId: 'pac10', paciente: 'Claudia Moreno', dni: '01234567', prioridad: 'Baja', servicio: 'Vascular', quirofanoId: 'qf3', quirofano: 'Quirófano C', especialidad: 'Vascular', intervencion: 'Safenectomía', anestesia: 'Regional', cirujanoId: 'p9', cirujano: 'Dr. Castro', estado: 'Completada' },
  
  // Cirugías canceladas
  { id: 'c10', fecha: formatDate(hoy), hora: '11:00', pacienteId: 'pac11', paciente: 'Diego Torres', dni: '11223344', prioridad: 'Media', servicio: 'Vascular', quirofanoId: 'qf3', quirofano: 'Quirófano C', especialidad: 'Vascular', intervencion: 'Safenectomía', anestesia: 'Regional', cirujanoId: 'p9', cirujano: 'Dr. Castro', estado: 'Cancelada', observaciones: 'Paciente con fiebre' },
  
  // Pendientes de asignación (sin fecha/hora definitiva)
  { id: 'c11', fecha: '', hora: '', pacienteId: 'pac12', paciente: 'Patricia Vega', dni: '22334455', prioridad: 'Media', servicio: 'Cirugía General', quirofanoId: '', quirofano: '', especialidad: 'Cirugía General', intervencion: 'Colecistectomía', anestesia: 'General', cirujanoId: 'p3', cirujano: 'Dr. Rodríguez', estado: 'Pendiente', tiempoEspera: 5 },
  { id: 'c12', fecha: '', hora: '', pacienteId: 'pac13', paciente: 'Alejandro Ríos', dni: '33445566', prioridad: 'Baja', servicio: 'Cirugía General', quirofanoId: '', quirofano: '', especialidad: 'Cirugía General', intervencion: 'Hernioplastia inguinal', anestesia: 'Regional', cirujanoId: 'p3', cirujano: 'Dr. Rodríguez', estado: 'Pendiente', tiempoEspera: 12 },
  { id: 'c13', fecha: '', hora: '', pacienteId: 'pac14', paciente: 'Natalia Castro', dni: '44556677', prioridad: 'Alta', servicio: 'Ginecología', quirofanoId: '', quirofano: '', especialidad: 'Ginecología', intervencion: 'Cesárea', anestesia: 'Regional', cirujanoId: 'p8', cirujano: 'Dra. Rojas', estado: 'Pendiente', tiempoEspera: 2 },
  { id: 'c14', fecha: '', hora: '', pacienteId: 'pac15', paciente: 'Fernando Luna', dni: '55667788', prioridad: 'Media', servicio: 'Urología', quirofanoId: '', quirofano: '', especialidad: 'Urología', intervencion: 'Prostatectomía', anestesia: 'General', cirujanoId: 'p6', cirujano: 'Dra. Silva', estado: 'Pendiente', tiempoEspera: 8 },

  // Más cirugías programadas esta semana
  { id: 'c15', fecha: formatDate(new Date(hoy.getTime() + 2 * 86400000)), hora: '08:30', pacienteId: 'pac16', paciente: 'Gabriela Mendoza', dni: '66778899', prioridad: 'Media', servicio: 'Ginecología', quirofanoId: 'qf2', quirofano: 'Quirófano B', especialidad: 'Ginecología', intervencion: 'Histerectomía', anestesia: 'General', cirujanoId: 'p8', cirujano: 'Dra. Rojas', estado: 'Programada' },
  { id: 'c16', fecha: formatDate(new Date(hoy.getTime() + 2 * 86400000)), hora: '11:00', pacienteId: 'pac17', paciente: 'Oscar Navarro', dni: '77889900', prioridad: 'Alta', servicio: 'Cardiología', quirofanoId: 'qf1', quirofano: 'Quirófano A', especialidad: 'Cardiología', intervencion: 'Bypass coronario', anestesia: 'General', cirujanoId: 'p4', cirujano: 'Dra. Martínez', estado: 'Programada' },
  { id: 'c17', fecha: formatDate(new Date(hoy.getTime() + 3 * 86400000)), hora: '09:00', pacienteId: 'pac18', paciente: 'Verónica Herrera', dni: '88990011', prioridad: 'Baja', servicio: 'Oftalmología', quirofanoId: 'qf3', quirofano: 'Quirófano C', especialidad: 'Oftalmología', intervencion: 'Cirugía de cataratas', anestesia: 'Local', cirujanoId: 'p2', cirujano: 'Dra. Fernández', estado: 'Programada' },
  { id: 'c18', fecha: formatDate(new Date(hoy.getTime() + 3 * 86400000)), hora: '14:00', pacienteId: 'pac19', paciente: 'Sergio Romero', dni: '99001122', prioridad: 'Alta', servicio: 'Cardiología', quirofanoId: 'qf1', quirofano: 'Quirófano A', especialidad: 'Cardiología', intervencion: 'Marcapasos', anestesia: 'Local', cirujanoId: 'p4', cirujano: 'Dra. Martínez', estado: 'Programada' },
  { id: 'c19', fecha: formatDate(new Date(hoy.getTime() + 4 * 86400000)), hora: '08:00', pacienteId: 'pac20', paciente: 'Luciana Ortiz', dni: '10111213', prioridad: 'Media', servicio: 'Traumatología', quirofanoId: 'qf1', quirofano: 'Quirófano A', especialidad: 'Traumatología', intervencion: 'Prótesis de cadera', anestesia: 'General', cirujanoId: 'p7', cirujano: 'Dr. Vargas', estado: 'Programada' },
  { id: 'c20', fecha: formatDate(new Date(hoy.getTime() + 4 * 86400000)), hora: '15:00', pacienteId: 'pac4', paciente: 'Ana López', dni: '45678901', prioridad: 'Baja', servicio: 'Plástica', quirofanoId: 'qf2', quirofano: 'Quirófano B', especialidad: 'Plástica', intervencion: 'Rinoplastia', anestesia: 'General', cirujanoId: 'p10', cirujano: 'Dra. Morales', estado: 'Programada' },
]

// ==================== ALERTAS ====================
export const mockAlertas: Alerta[] = [
  { id: 'a1', tipo: 'insumo', mensaje: 'Stock bajo de placas de titanio', cirugiaId: 'c1', urgencia: 'alta', fecha: formatDate(hoy) },
  { id: 'a2', tipo: 'conflicto', mensaje: 'Solapamiento de horario en Quirófano A', cirugiaId: 'c4', urgencia: 'alta', fecha: formatDate(hoy) },
  { id: 'a3', tipo: 'personal', mensaje: 'Dra. Rojas no disponible - Licencia médica', urgencia: 'media', fecha: formatDate(hoy) },
  { id: 'a4', tipo: 'insumo', mensaje: 'Marcapasos pendiente de entrega', cirugiaId: 'c4', urgencia: 'alta', fecha: formatDate(hoy) },
  { id: 'a5', tipo: 'conflicto', mensaje: 'Dr. Rodríguez con 3 cirugías el mismo día', urgencia: 'media', fecha: formatDate(hoy) },
  { id: 'a6', tipo: 'personal', mensaje: 'Anestesista Dra. Vega de vacaciones', urgencia: 'baja', fecha: formatDate(hoy) },
  { id: 'a7', tipo: 'insumo', mensaje: 'Suturas especiales agotadas', urgencia: 'media', fecha: formatDate(hoy) },
  { id: 'a8', tipo: 'conflicto', mensaje: 'Quirófano D fuera de servicio - mantenimiento', urgencia: 'alta', fecha: formatDate(hoy) },
  { id: 'a9', tipo: 'personal', mensaje: 'Falta instrumentador para cirugía c7', cirugiaId: 'c7', urgencia: 'alta', fecha: formatDate(new Date(hoy.getTime() + 86400000)) },
  { id: 'a10', tipo: 'insumo', mensaje: 'Lentes intraoculares por debajo del mínimo', urgencia: 'media', fecha: formatDate(hoy) },
]

// ==================== INSUMOS DISPONIBLES ====================
export const mockInsumos = [
  { id: 'ins1', nombre: 'Placa de titanio', stock: 5 },
  { id: 'ins2', nombre: 'Tornillos ortopédicos', stock: 50 },
  { id: 'ins3', nombre: 'Suturas absorbibles', stock: 100 },
  { id: 'ins4', nombre: 'Suturas no absorbibles', stock: 80 },
  { id: 'ins5', nombre: 'Malla quirúrgica', stock: 20 },
  { id: 'ins6', nombre: 'Marcapasos', stock: 3 },
  { id: 'ins7', nombre: 'Lente intraocular', stock: 15 },
  { id: 'ins8', nombre: 'Prótesis de cadera', stock: 4 },
  { id: 'ins9', nombre: 'Clips hemostáticos', stock: 200 },
  { id: 'ins10', nombre: 'Drenajes', stock: 30 },
]

// ==================== HELPERS ====================
export const getCirujanos = () => mockPersonal.filter(p => p.rol === 'Cirujano' && p.estado)
export const getAnestesistas = () => mockPersonal.filter(p => p.rol === 'Anestesista' && p.estado)
export const getInstrumentadores = () => mockPersonal.filter(p => p.rol === 'Instrumentador' && p.estado)
export const getAyudantes = () => mockPersonal.filter(p => (p.rol === 'Ayudante' || p.rol === 'Enfermero') && p.estado)
export const getQuirofanosDisponibles = () => mockQuirofanos.filter(q => q.disponible)
export const getTiposCirugiaActivos = () => mockTiposCirugia.filter(t => t.estado)
export const getCirugiasHoy = () => mockCirugias.filter(c => c.fecha === formatDate(new Date()))
export const getCirugiasPendientes = () => mockCirugias.filter(c => c.estado === 'Pendiente')
export const getAlertasCriticas = () => mockAlertas.filter(a => a.urgencia === 'alta')
