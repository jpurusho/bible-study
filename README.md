# Bible Study App

A web application for church members (~30 users) to access weekly Bible study materials, take notes, participate in discussions, and take quizzes.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (Base UI)
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Editor:** TipTap (admin content authoring)
- **Deployment:** Vercel (frontend) + Supabase Cloud (backend)

## Architecture

```mermaid
graph TB
    subgraph Client
        A[Next.js App<br/>React 19 + TypeScript]
        B[TipTap Editor<br/>Admin Content]
        C[Content Renderer<br/>Pastel Theme]
    end

    subgraph Supabase
        D[Auth<br/>Google OAuth]
        E[PostgreSQL<br/>16 Tables + RLS]
        F[Storage<br/>Images + PDFs]
        G[Realtime<br/>Discussions]
    end

    subgraph External
        H[Google Drive<br/>Video + Audio]
        I[ESV API<br/>Scripture]
    end

    A --> D
    A --> E
    A --> F
    A --> G
    B --> E
    C --> H
    C --> I
```

## Database Schema

```mermaid
erDiagram
    profiles ||--o{ user_bookmarks : has
    profiles ||--o{ user_highlights : has
    profiles ||--o{ user_notes : has
    profiles ||--o{ discussion_posts : writes
    profiles ||--o{ quiz_attempts : takes

    books ||--o{ chapters : contains
    chapters ||--o{ sessions : contains
    sessions ||--o{ session_media : has
    sessions ||--o{ user_bookmarks : bookmarked_by
    sessions ||--o{ user_highlights : highlighted_in
    sessions ||--o{ discussion_posts : discussed_in

    quizzes ||--o{ quiz_questions : has
    quizzes ||--o{ quiz_attempts : attempted

    announcements ||--o{ announcement_dismissals : dismissed_by

    profiles {
        uuid id PK
        text email
        text display_name
        text role
        bool is_approved
    }
    books {
        uuid id PK
        text title
        text slug UK
        int display_order
        bool is_published
    }
    chapters {
        uuid id PK
        uuid book_id FK
        text title
        int chapter_number
        bool is_published
    }
    sessions {
        uuid id PK
        uuid chapter_id FK
        text title
        text content
        text scripture_reference
        bool is_published
    }
```

## Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as Next.js
    participant Auth as Supabase Auth
    participant DB as PostgreSQL

    U->>App: Click "Sign in with Google"
    App->>Auth: OAuth redirect
    Auth->>App: Callback with code
    App->>Auth: Exchange code for session
    Auth->>DB: Trigger: create profile
    App->>DB: Check profile.is_approved
    alt Approved
        App->>U: Redirect to home
    else Not Approved
        App->>U: Show "Pending Approval" screen
    end
```

## Project Structure

```
bible_study/
├── app/                    # Next.js application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── (auth)/    # Login, pending, callback
│   │   │   ├── (main)/    # User-facing pages
│   │   │   └── admin/     # Admin dashboard
│   │   ├── components/    # UI components
│   │   │   ├── ui/        # shadcn components
│   │   │   └── editor/    # TipTap editor
│   │   ├── lib/           # Utilities (Supabase clients)
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── .env.local         # Local env vars (not committed)
├── supabase/              # Supabase configuration
│   ├── config.toml        # Local dev config
│   ├── migrations/        # SQL migrations (001-013)
│   └── seed.sql           # Test data
├── docs/                  # Planning & design docs
├── scripts/               # Utility scripts
├── .github/workflows/     # CI/CD pipeline
└── README.md
```

## Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop (for local Supabase)
- Supabase CLI (`brew install supabase/tap/supabase`)

### Setup

```bash
# 1. Start local Supabase (from project root)
supabase start

# 2. Apply migrations and seed data
supabase db reset

# 3. Install app dependencies
cd app && npm install

# 4. Start dev server
npm run dev
```

The app will be available at http://localhost:3000

### Local Services

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Supabase API | http://127.0.0.1:54321 |
| Mailpit (emails) | http://127.0.0.1:54324 |

### Test Credentials

- **Email:** admin@bible-study.local
- **Password:** admin123

For local development, you can also sign in via the Supabase Studio dashboard.

## CI/CD

GitHub Actions runs on every push to `main` and on PRs:
- TypeScript type checking
- ESLint
- Production build

## Deployment

1. Create a Supabase Cloud project
2. Link: `supabase link --project-ref <ref>`
3. Push migrations: `supabase db push`
4. Deploy frontend to Vercel with env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Phases

- [x] **Phase 1:** Scaffolding, auth, database schema, admin users
- [x] **Phase 2:** TipTap editor, content CRUD, content renderer, media embedding
- [x] **Phase 3:** User notes (auto-save), theme system (light/dark/sepia + font size), bookmarks
- [x] **Phase 4:** Quizzes (builder + taker), discussions (threaded), announcements, full-text search, highlights
- [x] **Phase 5:** Mobile nav, loading skeletons, error handling, back-to-top, footer
- [ ] **Phase 6:** PWA/offline, production deploy (Vercel + Supabase Cloud)
