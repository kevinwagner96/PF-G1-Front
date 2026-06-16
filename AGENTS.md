# PF-G1-Front Agent Notes

## Purpose
Frontend web app for SurgiCare, the PF-G1 surgery scheduling project. It provides MVP screens, authentication UX, surgery views, planning approval UI, and basic real-time reports.

## Stack
- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI / shadcn-style components
- Lucide React
- pnpm

## Structure
- `app/`: Next.js routes and pages.
- `components/`: reusable UI and feature components.
- `components/ui/`: base shadcn-style primitives.
- `lib/`: API helper, auth context, utilities, and remaining mock data.
- `public/`: static assets.
- `styles/`: global styles when present.

## Commands
```bash
pnpm dev
pnpm build
pnpm exec tsc --noEmit
pnpm lint
```

## API Configuration
- API base URL comes from `NEXT_PUBLIC_API_BASE_URL`.
- Default local API is `http://127.0.0.1:3010/api/v1`.
- Use `lib/api.ts` for Backend calls instead of ad hoc fetch wrappers.

## MVP Planning Notes
- `/mvp/cirugias` is the real demo screen for surgeries and planning from Back data.
- The surgery list defaults to pending surgeries and supports client-side search, status/specialty filters, and sorting.
- The Front never calls `pf-or-scheduler` directly.
- Planning creation, status, result, delete, and approval should go through `PF-G1-Back`.
- The Scheduler result is displayed from Back persistence, not from Scheduler GET.
- Surgeons review `pending_approval` plannings from the Back and can approve or reject them with a reason.
- `/mvp/reportes` consumes `GET /reports/summary/` and must show only the MVP indicators agreed for the final document: operating room utilization, cancellation rate, and average wait time.
- Auth state lives in `lib/auth-context.tsx` and is stored in `localStorage`.

## Agent Rules
- Keep UI changes consistent with the existing Tailwind/shadcn-style patterns.
- Use Lucide icons for action buttons when an icon exists.
- Use real Back data in all `/mvp/*` routes; keep mock data isolated to legacy/mock screens unless explicitly requested.
- Do not add direct Scheduler URLs, tokens, or calls to client-side code.
- `next.config.mjs` may skip TypeScript validation during build; run `pnpm exec tsc --noEmit` when type safety matters.
- Be aware that some existing non-MVP components may still have TypeScript issues; do not treat those as caused by unrelated MVP edits without checking.
