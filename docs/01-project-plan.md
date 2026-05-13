# Bible Study App - Project Plan

## Overview

A cloud-hosted Bible study application enabling an admin to share weekly study notes, media, and quizzes with approved users. Users can read beautifully formatted content, make personal notes, participate in discussions, and search across all study material.

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 (App Router) | SSR/SSG, deployed free on Vercel, excellent DX |
| Styling | Tailwind CSS + shadcn/ui | Rapid theming, responsive design, accessible components |
| Database | Supabase (PostgreSQL) | Free tier, Auth, Storage, Realtime, Row Level Security |
| Authentication | Supabase Auth (Google OAuth) | Built-in Google login, session management |
| File Storage | Supabase Storage | Free 1GB, serves images/audio/video |
| Search | PostgreSQL full-text search + pg_trgm | Fuzzy matching without LLM, no extra service |
| Bible API | ESV API (api.esv.org) | Free for non-commercial use, clean JSON responses |
| Deployment | Vercel (free tier) | Auto-deploy from Git, edge functions, preview URLs |

## Phases

### Phase 1: Foundation (Week 1-2)
- Project scaffolding (Next.js 14 + Tailwind + shadcn/ui + Supabase)
- Database schema design and all migrations
- Authentication flow (Google OAuth + admin approval + pending screen)
- Admin dashboard shell with user management
- Basic layout, navigation, responsive skeleton

### Phase 2: Content Management (Week 3-4)
- TipTap rich text editor integration (admin)
- Admin CRUD for books/chapters/sessions
- Media upload (images, audio, PDF slides → Supabase Storage)
- Google Drive video link embedding
- Rich content rendering with custom styling
- Table of contents and breadcrumb navigation

### Phase 3: User Experience (Week 5-6)
- Scripture display (ESV API + caching + translation selector)
- User personal notes (per session/chapter/book/global)
- Theme system (light/dark/sepia) with admin defaults + user overrides
- Font size control
- Responsive polish for mobile and desktop
- Smooth pagination (prev/next session navigation)

### Phase 4: Engagement (Week 7-8)
- Quiz builder (admin: MC, true/false, fill-in-the-blank)
- Quiz taking and scoring (user)
- Discussion threads with moderation
- Announcement/splash screen system
- Search (PostgreSQL full-text + fuzzy via pg_trgm)
- Reading progress tracking

### Phase 5: Offline & Polish (Week 9-10)
- PWA setup (manifest, service worker, installable)
- Offline caching (text content + images)
- Background sync for user notes
- Performance optimization
- Accessibility audit (WCAG 2.1 AA)
- User testing with study group
- Production deployment on Vercel

## Feasibility Assessment

| Concern | Assessment |
|---------|-----------|
| Free infrastructure | Vercel free tier (100GB bandwidth/mo), Supabase free tier (500MB DB, 1GB storage, 50k auth users) — sufficient for a small study group |
| Media hosting | Supabase Storage handles images/audio/video; large videos may need external hosting (YouTube unlisted links) |
| Search without LLM | PostgreSQL `to_tsvector` + `pg_trgm` provides solid fuzzy/full-text search at no cost |
| Discussion | Supabase Realtime enables live comments; simple threaded model works well |
| Mobile experience | Tailwind + responsive design; could add PWA support later |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Supabase free tier storage limits (1GB) | Videos on Google Drive; only images/audio/PDFs in Supabase Storage |
| Vercel serverless cold starts | Use edge runtime where possible; static generation for content pages |
| ESV API rate limits | Cache scripture responses in DB; serve from cache on repeat requests |
| Keynote file format | Export as PDF before upload; rendered via embedded PDF viewer or page images |
| Google Drive embed availability | If Google changes embed policy, fallback to direct links |
| PWA cache size on devices | Limit to text + images (~50MB); audio/video require network |

## Decisions Made

| Question | Decision |
|----------|----------|
| Keynote files | Export as PDF, upload to app. Going forward, author directly in TipTap editor in admin panel |
| Video hosting | Google Drive (shared link), embedded via iframe in app — no Supabase storage used |
| Audio hosting | Google Drive (shared link), played via HTML5 audio player with direct stream URL |
| Group size | ~25-30 users (well within Supabase free tier of 50k MAU) |
| Quiz types | Multiple choice + true/false + fill-in-the-blank (rare) |
| Discussion moderation | Yes — admin can delete/hide comments |
| Offline access | PWA with Service Worker; text + images cached for offline reading |
| Notifications | Announcement splash screen system — admin creates, shown on app launch until dismissed |

## Storage Budget (Free Tier)

| Resource | Limit | Expected Usage |
|----------|-------|---------------|
| Supabase DB | 500 MB | ~50 MB (text content, user data, discussions) |
| Supabase Storage | 1 GB | ~500 MB (images, PDF slides only — audio/video on Google Drive) |
| Supabase Auth | 50k MAU | 30 users |
| Vercel Bandwidth | 100 GB/mo | ~5-10 GB/mo for 30 users |
| Google Drive | 15 GB (free) | Videos stored here, no limit concerns |
