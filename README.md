# SurgiCare - Proyecto Final Grupo 1 UTN FRCU

Frontend del Proyecto Final desarrollado por el Grupo 1 de la Universidad Tecnologica Nacional, Facultad Regional Concepcion del Uruguay.

## Descripcion

SurgiCare es una aplicacion web para la gestion de turnos quirurgicos. Incluye pantallas para cirugias, agenda, quirofanos, personal, tipos de cirugia, emergencias y autenticacion con usuarios de prueba.

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

El compose principal esta en el repo backend (`PF-G1-Back`) y espera que ambos repos esten como carpetas hermanas:

```text
proyecto_final_workspace/
  PF-G1-Back/
  PF-G1-Front/
```

Desde `PF-G1-Back`:

```bash
docker compose up --build
```

Luego abrir:

```text
http://localhost:3000
```

## Conexion con backend

El login consume la API REST del backend. Para desarrollo local:

```bash
cp .env.local.example .env.local
```

Por defecto apunta a:

```text
http://127.0.0.1:3010/api/v1
```

## Scripts disponibles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Usuarios de prueba

La autenticacion consulta los usuarios cargados en la tabla `users` del backend.

| Rol | Email | Password |
| --- | --- | --- |
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

## Notas

- El proyecto conserva datos mock para las pantallas funcionales, pero el login ya consulta al backend.
- La sesion autenticada se conserva del lado del navegador con `localStorage`.
- El archivo `next.config.mjs` ignora errores de TypeScript durante el build. Antes de una entrega final conviene revisar y corregir esos errores si aparecen.
- En produccion se incluye Vercel Analytics.

## Licencia

Proyecto academico desarrollado como parte del Proyecto Final de UTN FRCU.
