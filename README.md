# SurgiCare - Proyecto Final Grupo 1 UTN FRCU

Frontend del Proyecto Final desarrollado por el Grupo 1 de la Universidad Tecnologica Nacional, Facultad Regional Concepcion del Uruguay.

## Descripcion

SurgiCare es una aplicacion web para la gestion de turnos quirurgicos. Incluye pantallas para cirugias, agenda, quirofanos, personal, tipos de cirugia, emergencias, reportes basicos y autenticacion con usuarios de prueba.

## Institucion

- Universidad: Universidad Tecnologica Nacional
- Facultad: Facultad Regional Concepcion del Uruguay
- Instancia: Proyecto Final
- Grupo: Grupo 1

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI / shadcn-style components
- Lucide React
- pnpm

## Requisitos previos

- Node.js instalado
- pnpm instalado

Si no se tiene pnpm instalado, se puede instalar con:

```bash
npm install -g pnpm
```

## Instalacion

Instalar las dependencias:

```bash
pnpm install
```

## Ejecucion en desarrollo

Levantar el servidor local:

```bash
pnpm dev
```

Luego abrir la URL indicada por la terminal. Normalmente es:

```text
http://localhost:3000
```

## Ejecucion con Docker

El compose principal esta en el repo `PF-G1-Demo` y espera que los proyectos esten como carpetas hermanas:

```text
proyecto_final_workspace/
  PF-G1-Demo/
  PF-G1-Back-Django/
  PF-G1-Front/
  pf-or-scheduler/
```

Desde `PF-G1-Demo`:

```bash
docker compose up --build
```

Luego abrir:

```text
http://localhost:3000
```

## Conexion con backend

El login y las pantallas MVP consumen la API REST de `PF-G1-Back-Django`. Para desarrollo local:

```bash
cp .env.local.example .env.local
```

Por defecto apunta a:

```text
http://127.0.0.1:3010/api/v1
```

## Pantallas MVP reales

- `/mvp/cirugias`: listado real de cirugias desde el Back Django. Por defecto muestra cirugias `Pendiente` y permite buscar, filtrar por estado/especialidad y ordenar por prioridad, fecha o paciente.
- `/mvp/cirugias`: tambien concentra el flujo de planificacion semanal. El administrador genera la planificacion, el cirujano revisa la planificacion pendiente y puede aprobarla o rechazarla con motivo.
- `/mvp/reportes`: muestra indicadores en tiempo real desde PostgreSQL/Django, sin mocks: utilizacion de quirofanos, tasa de cancelacion y tiempo promedio de espera.

## Scripts disponibles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm validate:reports
```

## Validation test de reportes

Para medir la duracion de generacion de reportes MVP, primero sembrar datos en el Back:

```bash
cd ../PF-G1-Back-Django
.venv/bin/python manage.py seed_report_validation --year 2026 --surgeries-per-month 500
```

Luego ejecutar el runner desde el Front:

```bash
pnpm validate:reports -- --year 2026 --surgeries-per-month 500
```

El script mide 10 reportes mensuales y 10 reportes anuales contra `GET /reports/summary/`, con 2 warmups no contados, y muestra promedio, minimo y maximo por grupo.

Al terminar la validacion, limpiar los datos tecnicos para volver a la demo MVP normal:

```bash
cd ../PF-G1-Back-Django
.venv/bin/python manage.py seed_report_validation --clear
```

## Usuarios de prueba

La autenticacion consulta los usuarios cargados en la tabla `users` del backend.

| Rol | Email | Password |
| --- | --- | --- |
| System Admin | sysadmin@hospital.com | sysadmin123 |
| Administrador | admin@hospital.com | admin123 |
| Cirujano | cirujano@hospital.com | cirujano123 |
| Jefe Quirofano | jefe@hospital.com | jefe123 |
| Recepcionista | recepcion@hospital.com | recepcion123 |
| Usuario bloqueado | bloqueado@hospital.com | blocked123 |

## Estructura principal

```text
app/          Rutas y paginas de Next.js
components/   Componentes de interfaz
components/ui Componentes base reutilizables
hooks/        Hooks personalizados
lib/          Utilidades, contexto de autenticacion y datos mock
public/       Archivos publicos
styles/       Estilos globales adicionales
```

## Variables de entorno

| Variable | Descripcion |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL base de la API REST. Por defecto: `http://127.0.0.1:3010/api/v1` |
| `NEXT_PUBLIC_ADMIN_URL` | URL del Django Admin para el acceso de System Admin. Por defecto: `http://127.0.0.1:3010/admin/` |

## Notas

- El proyecto conserva datos mock para pantallas no MVP; las rutas `/mvp/*` deben consumir datos reales del Back Django.
- La sesion autenticada usa cookies de sesion Django y CSRF.
- El archivo `next.config.mjs` ignora errores de TypeScript durante el build. Antes de una entrega final conviene revisar y corregir esos errores si aparecen.
- En produccion se incluye Vercel Analytics.

## Licencia

Proyecto academico desarrollado como parte del Proyecto Final de UTN FRCU.
