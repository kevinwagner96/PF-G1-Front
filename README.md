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

## Scripts disponibles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Usuarios de prueba

La aplicacion utiliza datos mock en `lib/mock-data.ts`.

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

Actualmente no se detectan variables de entorno obligatorias para ejecutar el frontend en modo desarrollo.

## Notas

- El proyecto contiene datos de prueba, incluyendo usuarios y passwords mock. No deben utilizarse como credenciales reales.
- La autenticacion actual funciona del lado del navegador con `localStorage`.
- El archivo `next.config.mjs` ignora errores de TypeScript durante el build. Antes de una entrega final conviene revisar y corregir esos errores si aparecen.
- En produccion se incluye Vercel Analytics.

## Licencia

Proyecto academico desarrollado como parte del Proyecto Final de UTN FRCU.
