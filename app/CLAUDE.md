# Bible Study App

## Tech Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI variant)
- Supabase: @supabase/ssr for auth + PostgreSQL
- next-themes for dark/light/sepia mode
- Lucide React for icons

## Project Structure
```
src/
  app/(auth)/       — Login, pending approval, OAuth callback
  app/(main)/       — Authenticated user pages (books, notes, search, settings)
  app/admin/        — Admin dashboard (users, content, announcements)
  components/ui/    — shadcn/ui components (Base UI, NOT Radix)
  components/       — App-level components
  lib/supabase/     — client.ts, server.ts, middleware.ts
  types/database.ts — Supabase DB types (manually maintained)
supabase/migrations/ — SQL migration files (001-012)
```

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Key Notes
- shadcn/ui here uses @base-ui/react, NOT @radix-ui. No `asChild` prop — use `render` prop or wrap with native elements.
- Middleware handles auth session refresh; public routes defined in src/middleware.ts
- Profile auto-created on signup via Supabase trigger; admin must approve (`is_approved`)
- Database types require `Relationships` array on each table definition

## Content Flow
- Admin writes study notes via TipTap editor (to be implemented)
- Alternatively: write Markdown locally, paste into admin editor
- Audio/Video hosted on Google Drive (embedded in app)
- Images/PDFs stored in Supabase Storage
