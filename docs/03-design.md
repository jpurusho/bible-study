# Bible Study App - Design Document

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (CDN + Edge)                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js 14 (App Router)               │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │  Pages  │  │   API    │  │  Server Actions  │  │  │
│  │  │  (SSG)  │  │  Routes  │  │  (mutations)     │  │  │
│  │  └─────────┘  └──────────┘  └─────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │   Supabase   │  │   ESV API    │
│   Database   │  │   Storage    │  │  (external)  │
│  (PostgreSQL)│  │  (S3-compat) │  │              │
│              │  │              │  │              │
│  - Users     │  │  - Images    │  │  - Scripture │
│  - Content   │  │  - Audio     │  │    passages  │
│  - Notes     │  │  - Video     │  │              │
│  - Quizzes   │  │  - Slides    │  │              │
│  - Discuss   │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 2. Database Schema

### 2.1 Entity Relationship

```
profiles ──────────────── user_notes
    │                         │
    │                         │
    ├── discussion_posts      │
    │                         │
    ├── quiz_attempts         │
    │                         │
    │                         │
books ─── chapters ─── sessions ─── session_media
                           │
                           ├── quizzes ─── quiz_questions
                           │
                           └── discussion_posts
```

### 2.2 Table Definitions

#### `profiles`
Extends Supabase Auth users with app-specific data.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References auth.users.id |
| email | text | From Google OAuth |
| display_name | text | From Google profile |
| avatar_url | text | From Google profile |
| role | enum('user', 'admin') | Default: 'user' |
| is_approved | boolean | Default: false |
| theme | jsonb | `{mode: 'light', fontSize: 16, fontFamily: 'default'}` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `books`
Top-level study units (e.g., "Acts", "Romans").

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| title | text | e.g., "The Book of Acts" |
| slug | text (unique) | URL-friendly: "acts" |
| description | text | Short overview |
| cover_image_url | text | Optional cover |
| display_order | integer | Sorting |
| is_published | boolean | Draft/published toggle |
| created_at | timestamptz | |

#### `chapters`
Divisions within a book.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| book_id | uuid (FK → books) | |
| title | text | e.g., "Chapter 1: The Ascension" |
| chapter_number | integer | |
| description | text | Brief summary |
| display_order | integer | |
| is_published | boolean | |
| created_at | timestamptz | |

#### `sessions`
Individual study sessions (a chapter may span multiple weeks).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| chapter_id | uuid (FK → chapters) | |
| title | text | e.g., "Week 1: Acts 1:1-11" |
| session_number | integer | |
| scripture_reference | text | e.g., "Acts 1:1-11" |
| content | text | Markdown/HTML study notes |
| display_order | integer | |
| is_published | boolean | |
| published_at | timestamptz | When made visible |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `session_media`
Media files attached to a session.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| session_id | uuid (FK → sessions) | |
| type | enum('image','audio','video','slides') | |
| title | text | Display name |
| url | text | Supabase Storage URL or external URL |
| display_order | integer | |
| created_at | timestamptz | |

#### `user_notes`
Personal notes by users.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| session_id | uuid (FK → sessions, nullable) | |
| chapter_id | uuid (FK → chapters, nullable) | |
| book_id | uuid (FK → books, nullable) | |
| scope | enum('session','chapter','book','global') | |
| content | text | Max 5000 chars enforced |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `user_bookmarks`
Sessions bookmarked by users for quick access.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| session_id | uuid (FK → sessions) | |
| created_at | timestamptz | |
| UNIQUE | (user_id, session_id) | One bookmark per session per user |

#### `user_highlights`
Text highlights saved by users within study notes.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| session_id | uuid (FK → sessions) | |
| start_offset | integer | Character offset start in content |
| end_offset | integer | Character offset end in content |
| text_snippet | text | The highlighted text (for display without re-parsing) |
| color | text | 'yellow', 'green', 'blue', 'pink' |
| note | text (nullable) | Optional short annotation |
| created_at | timestamptz | |

#### `quizzes`
Quiz definitions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| session_id | uuid (FK → sessions, nullable) | |
| chapter_id | uuid (FK → chapters, nullable) | |
| title | text | |
| description | text | |
| is_published | boolean | |
| created_at | timestamptz | |

#### `quiz_questions`
Individual quiz questions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| quiz_id | uuid (FK → quizzes) | |
| question_text | text | |
| question_type | enum('multiple_choice','true_false','fill_blank') | |
| options | jsonb | `["option A", "option B", ...]` (null for fill_blank) |
| correct_answer | text | Index for MC/TF, or accepted text for fill_blank |
| display_order | integer | |

#### `quiz_attempts`
User quiz submissions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| quiz_id | uuid (FK → quizzes) | |
| user_id | uuid (FK → profiles) | |
| answers | jsonb | `{questionId: selectedIndex, ...}` |
| score | integer | Number correct |
| total | integer | Total questions |
| completed_at | timestamptz | |

#### `discussion_posts`
Threaded discussion per session/chapter.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| session_id | uuid (FK → sessions, nullable) | |
| chapter_id | uuid (FK → chapters, nullable) | |
| user_id | uuid (FK → profiles) | |
| parent_id | uuid (FK → discussion_posts, nullable) | For threading |
| content | text | Max 2000 chars |
| is_deleted | boolean | Soft delete for moderation |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `scripture_cache`
Cached Bible text to reduce ESV API calls.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| reference | text | e.g., "Acts 1:1-11" |
| translation | text | e.g., "ESV" |
| content | text | Full scripture text |
| cached_at | timestamptz | |

#### `announcements`
Admin-created splash screens / notifications.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| title | text | Headline |
| content | text | Body (markdown) |
| priority | enum('info','important','urgent') | Styling/behavior |
| starts_at | timestamptz | When to start showing |
| ends_at | timestamptz (nullable) | Auto-expire (null = manual) |
| is_active | boolean | Admin can deactivate |
| created_at | timestamptz | |

#### `announcement_dismissals`
Tracks which users have dismissed which announcements.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| announcement_id | uuid (FK → announcements) | |
| user_id | uuid (FK → profiles) | |
| dismissed_at | timestamptz | |
| UNIQUE | (announcement_id, user_id) | One dismissal per user |

#### `app_settings`
Global admin settings.

| Column | Type | Notes |
|--------|------|-------|
| key | text (PK) | e.g., "esv_api_key", "default_theme" |
| value | jsonb | Setting value |
| updated_at | timestamptz | |

### 2.3 Full-Text Search Setup

```sql
-- Add tsvector column to sessions for search
ALTER TABLE sessions ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX sessions_search_idx ON sessions USING GIN (search_vector);

-- Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX sessions_title_trgm_idx ON sessions USING GIN (title gin_trgm_ops);
```

## 3. Authentication Flow

```
User clicks "Sign in with Google"
        │
        ▼
Supabase Auth → Google OAuth consent
        │
        ▼
User authenticated → profile created/updated
        │
        ▼
Check profiles.is_approved
        │
    ┌───┴───┐
    │       │
    ▼       ▼
  true    false
    │       │
    ▼       ▼
  App    "Pending Approval"
  Home    waiting screen
```

## 4. Page Structure / Routes

```
/                           → Landing / marketing page
/login                      → Google sign-in
/pending                    → Awaiting approval screen
/app                        → Dashboard (latest sessions, progress)
/app/books                  → All books list
/app/books/[slug]           → Book overview (chapters list)
/app/books/[slug]/[chapter] → Chapter view (sessions list)
/app/books/[slug]/[chapter]/[session] → Session content view
/app/search                 → Search page
/app/notes                  → User's personal notes
/app/settings               → User preferences (theme, font, translation)
/admin                      → Admin dashboard
/admin/users                → User management
/admin/content              → Content management (books/chapters/sessions)
/admin/content/new-session  → Session editor (rich text + media upload)
/admin/quizzes              → Quiz management
/admin/settings             → App settings (ESV API key, defaults)
```

## 5. UI Components

### 5.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Logo | Navigation | Search | User Avatar   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─── Sidebar (desktop) ───┐  ┌─── Main ────────┐  │
│  │                         │  │                  │  │
│  │  Table of Contents      │  │  Content Area    │  │
│  │  - Book title           │  │                  │  │
│  │  - Chapter list         │  │  Study notes     │  │
│  │  - Session list         │  │  Media           │  │
│  │                         │  │  Scripture       │  │
│  │  (collapsible on        │  │  Quiz            │  │
│  │   mobile → hamburger)   │  │  Discussion      │  │
│  │                         │  │                  │  │
│  └─────────────────────────┘  └──────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer: © | Links                                  │
└─────────────────────────────────────────────────────┘
```

### 5.2 Mobile Layout

```
┌──────────────────────┐
│  ☰  Logo  🔍  👤    │
├──────────────────────┤
│                      │
│  Breadcrumbs         │
│  Acts > Ch.1 > Wk.1 │
│                      │
│  ┌────────────────┐  │
│  │  Content       │  │
│  │  (full width)  │  │
│  │                │  │
│  │  ...           │  │
│  └────────────────┘  │
│                      │
│  ← Prev    Next →   │
│                      │
├──────────────────────┤
│  📖 Notes 💬 Quiz   │
│  (bottom tab bar)    │
└──────────────────────┘
```

### 5.3 Key Components

| Component | Description |
|-----------|-------------|
| `ContentRenderer` | Renders markdown/HTML with proper styling, headings, images |
| `AudioPlayer` | Custom styled MP3 player with playback speed control |
| `VideoPlayer` | Embedded video with controls |
| `ScriptureBlock` | Displays Bible passage with verse numbers, styled distinctly |
| `QuizCard` | Interactive quiz with immediate feedback |
| `DiscussionThread` | Threaded comments with reply capability |
| `NoteEditor` | Simple text editor with character count |
| `SearchBar` | Global search with live results dropdown |
| `ThemeSwitcher` | Light/dark/sepia toggle |
| `FontSizeControl` | Increase/decrease font size slider |
| `TOCSidebar` | Table of contents navigation |
| `BreadcrumbNav` | Hierarchical navigation trail |
| `AdminContentEditor` | Rich text editor for admin (TipTap or similar) |

## 6. Theming System

### 6.1 Theme Variables

```css
:root {
  /* Admin-configurable defaults */
  --font-family: 'Inter', system-ui, sans-serif;
  --font-family-serif: 'Merriweather', Georgia, serif;
  --font-size-base: 16px;
  
  /* Light theme */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #1a1a1a;
  --text-secondary: #4a5568;
  --accent: #2563eb;
  --border: #e2e8f0;
}

[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #e2e8f0;
  --text-secondary: #a0aec0;
  --accent: #60a5fa;
  --border: #2d3748;
}

[data-theme="sepia"] {
  --bg-primary: #f4ecd8;
  --bg-secondary: #ede3cc;
  --text-primary: #3d2c1e;
  --text-secondary: #5c4a3a;
  --accent: #8b4513;
  --border: #d4c5a9;
}
```

### 6.2 Font Size Scale

Users adjust a multiplier (0.8x to 1.4x) applied to base size:
- Small: 0.85x (≈14px)
- Default: 1.0x (16px)
- Large: 1.15x (≈18px)
- Extra Large: 1.3x (≈21px)

## 7. Search Implementation

### 7.1 Search Strategy

1. **Primary**: PostgreSQL full-text search (`to_tsvector` + `plainto_tsquery`)
2. **Fuzzy fallback**: `pg_trgm` similarity when full-text returns no results
3. **Ranking**: `ts_rank` with weight on title (A) > content (B)
4. **Snippets**: `ts_headline` for context around matches

### 7.2 Search Query (example)

```sql
-- Full-text with fuzzy fallback
WITH fts AS (
  SELECT id, title, ts_rank(search_vector, query) AS rank,
         ts_headline('english', content, query, 'MaxFragments=2') AS snippet
  FROM sessions, plainto_tsquery('english', $1) query
  WHERE search_vector @@ query
  ORDER BY rank DESC
  LIMIT 20
)
SELECT * FROM fts
UNION ALL
SELECT id, title, similarity(title, $1) AS rank, 
       substring(content, 1, 200) AS snippet
FROM sessions
WHERE similarity(title, $1) > 0.3
  AND id NOT IN (SELECT id FROM fts)
ORDER BY rank DESC
LIMIT 20;
```

## 8. Content Styling

Study notes will be stored as Markdown and rendered with custom styles:

- Headings: distinct sizes with decorative left border
- Scripture quotes: indented block with serif font, muted background
- Key points: highlighted with accent color
- Lists: clean spacing, custom bullet style
- Images: responsive with optional captions
- Audio: inline player below relevant section

## 9. Security Model (Row Level Security)

```sql
-- Users can only read published content
CREATE POLICY "Published content visible to approved users"
  ON sessions FOR SELECT
  USING (is_published = true AND auth.uid() IN (
    SELECT id FROM profiles WHERE is_approved = true
  ));

-- Users can only access their own notes
CREATE POLICY "Users own their notes"
  ON user_notes FOR ALL
  USING (user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin full access"
  ON sessions FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
```

## 10. API Integration (ESV)

### Request
```
GET https://api.esv.org/v3/passage/text/
  ?q=Acts+1:1-11
  &include-headings=true
  &include-footnotes=false
  &include-verse-numbers=true
  &include-passage-references=true
```

### Caching Strategy
- Cache response in `scripture_cache` table
- Cache TTL: 30 days (scripture text doesn't change)
- Serve from cache on subsequent requests for same reference
- Background refresh if cache is stale

## 11. Video Embedding (Google Drive)

### Strategy
Videos are hosted on Google Drive (shared folder). Admin pastes the share link in the session editor.

### Embed Flow
```
Admin pastes: https://drive.google.com/file/d/ABC123/view?usp=sharing
       │
       ▼
App extracts file ID: ABC123
       │
       ▼
Rendered as: <iframe src="https://drive.google.com/file/d/ABC123/preview"
              width="100%" height="auto" allow="autoplay" />
```

### Requirements
- Video must be shared as "Anyone with the link can view"
- Google Drive preview player handles streaming, quality adaptation
- No Supabase storage consumed for video
- Note: Google Drive embeds do NOT work offline (acceptable trade-off)

## 12. Progressive Web App (PWA) & Offline

### Service Worker Strategy

```
┌─────────────────────────────────────────────┐
│           Caching Strategy                   │
├─────────────────────────────────────────────┤
│                                             │
│  App Shell (cache-first):                   │
│  - HTML pages, JS bundles, CSS              │
│  - UI components, icons, fonts              │
│                                             │
│  Content (stale-while-revalidate):          │
│  - Study notes (text/HTML)                  │
│  - Scripture passages                       │
│  - User's own notes                         │
│  - Images (session media)                   │
│                                             │
│  Network-only (not cached):                 │
│  - Video (Google Drive embed)              │
│  - Audio (too large for reliable cache)     │
│  - Discussion threads (realtime)            │
│  - Quiz submissions                         │
│                                             │
│  Background sync:                           │
│  - User notes saved offline → synced later  │
│                                             │
└─────────────────────────────────────────────┘
```

### PWA Manifest
- Installable on iOS/Android home screen
- Custom app icon and splash screen
- Standalone display mode (no browser chrome)
- Theme color matches current user theme

### Implementation
- `next-pwa` package or `@serwist/next` for Next.js integration
- Workbox for service worker generation
- IndexedDB for offline note storage (syncs on reconnect)
- Cache limit: ~50MB per device (covers text + images for all sessions)

## 13. Announcement System

### Flow

```
Admin creates announcement
       │
       ▼
Announcement saved with starts_at, priority
       │
       ▼
User opens app → check for active, undismissed announcements
       │
       ▼
┌──────────────────────────────────────┐
│         SPLASH OVERLAY               │
│                                      │
│  ┌────────────────────────────┐      │
│  │  🔔 New This Week!         │      │
│  │                            │      │
│  │  Acts Chapter 5 study      │      │
│  │  notes are now available.  │      │
│  │  We also have a new quiz!  │      │
│  │                            │      │
│  │  [Go to Session]  [Dismiss]│      │
│  └────────────────────────────┘      │
│                                      │
└──────────────────────────────────────┘
       │
       ▼
User dismisses → record in announcement_dismissals
       │
       ▼
Won't show again for this user
```

### Priority Styling
- **info**: subtle card, muted colors, easy to dismiss
- **important**: prominent card, accent border, larger text
- **urgent**: full-screen overlay, requires acknowledgment, strong colors

## 14. Admin Content Editor (TipTap)

### Editor Features
- Bold, italic, underline, strikethrough
- Headings (H1-H3)
- Ordered and unordered lists
- Block quotes (styled as scripture quotes)
- Code blocks (for Greek/Hebrew transliteration)
- Image upload (drag-and-drop → Supabase Storage)
- Audio file attachment
- Video link embed (Google Drive URL)
- Scripture reference insertion (auto-fetches from ESV API)
- Table support
- Markdown paste support (paste MD, renders as rich text)
- Preview mode (see exactly how users will read it)
- Auto-save drafts

### Custom Extensions
- `ScriptureReference` node: inline reference that renders the passage
- `AudioEmbed` node: inline audio player
- `VideoEmbed` node: Google Drive video embed

## 15. File Structure

```
bible-study-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── pending/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx          (sidebar + header)
│   │   │   ├── page.tsx            (dashboard)
│   │   │   ├── books/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [chapter]/
│   │   │   │           ├── page.tsx
│   │   │   │           └── [session]/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── notes/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── content/
│   │   │   │   ├── page.tsx
│   │   │   │   └── editor/page.tsx
│   │   │   ├── quizzes/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── scripture/route.ts
│   │   │   └── search/route.ts
│   │   ├── manifest.ts              (PWA manifest)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     (shadcn components)
│   │   ├── content-renderer.tsx
│   │   ├── audio-player.tsx
│   │   ├── video-player.tsx        (Google Drive embed)
│   │   ├── scripture-block.tsx
│   │   ├── quiz-card.tsx
│   │   ├── discussion-thread.tsx
│   │   ├── note-editor.tsx
│   │   ├── search-bar.tsx
│   │   ├── theme-switcher.tsx
│   │   ├── toc-sidebar.tsx
│   │   ├── breadcrumb-nav.tsx
│   │   ├── announcement-splash.tsx
│   │   └── admin/
│   │       ├── tiptap-editor.tsx   (rich text editor)
│   │       ├── media-uploader.tsx
│   │       └── quiz-builder.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── esv.ts
│   │   ├── search.ts
│   │   ├── offline.ts              (IndexedDB + sync)
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-theme.ts
│   │   ├── use-auth.ts
│   │   ├── use-search.ts
│   │   └── use-offline.ts
│   └── types/
│       └── index.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_books.sql
│   │   ├── 003_create_chapters.sql
│   │   ├── 004_create_sessions.sql
│   │   ├── 005_create_media.sql
│   │   ├── 006_create_notes.sql
│   │   ├── 007_create_quizzes.sql
│   │   ├── 008_create_discussions.sql
│   │   ├── 009_create_announcements.sql
│   │   ├── 010_create_search.sql
│   │   └── 011_create_rls_policies.sql
│   └── seed.sql
├── public/
│   ├── icons/                      (PWA icons)
│   └── sw.js                       (service worker)
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── .env.local.example
```
