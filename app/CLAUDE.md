# CCISR Bible Study App

## Tech Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI variant, NOT Radix)
- Supabase: @supabase/ssr for auth + PostgreSQL + RLS
- next-themes for dark/light/sepia + material dark themes
- TipTap for admin content editing
- ESV API for scripture lookups (cached in scripture_cache table)
- Lucide React for icons

## Project Structure
```
src/
  app/(auth)/       — Login, pending approval, OAuth callback
  app/(main)/       — Authenticated user pages (home, books, notes, bookmarks, search, settings)
  app/admin/        — Admin dashboard (users, preapproved, content, quizzes, announcements)
  app/api/bible/    — ESV scripture API route
  components/ui/    — shadcn/ui components (Base UI, NOT Radix)
  components/       — App-level components (header, footer, media-player, etc.)
  components/editor/ — TipTap editor + toolbar
  lib/              — Utilities (supabase clients, markdown-to-html)
  types/database.ts — Supabase DB types (manually maintained)
supabase/migrations/ — SQL migration files (001-018)
```

## Commands
- `npm run dev` — Start dev server (from app/ directory)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `supabase db push` — Push migrations to cloud (from project root)
- `supabase db reset` — Reset local DB with migrations + seed

## Key Notes
- shadcn/ui uses @base-ui/react, NOT @radix-ui. No `asChild` prop — use `render` prop or native elements
- AppHeader is a SERVER component. Only SignOutButton is client-side. Do not add complex client components to the header (they cause hydration crashes)
- Root page.tsx redirects to /home. All authenticated pages are under (main)/ route group
- Middleware handles auth session refresh; public routes defined in src/middleware.ts
- Profile auto-created on signup via Supabase trigger; checks preapproved_emails for auto-approval
- Database types require `Relationships` array on each table definition
- Content is stored as HTML in sessions.content column
- Scripture references use ScriptureExpander component (calls /api/bible)
- Videos: thumbnail + "Play Video" link on mobile, iframe embed on desktop
- Deploy from app/ directory: `vercel --prod --scope jpurushos-projects`

## Content Flow
- Admin writes study notes in vim as Markdown
- Paste into admin editor via "Import Markdown" button (converts to HTML)
- Or use TipTap visual editor directly
- Audio/Video hosted on Google Drive (embedded via /preview or thumbnail)
- Images via Google Drive thumbnail URL format
- "Publish & Announce" button publishes session + creates announcement in one click
