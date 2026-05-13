# Bible Study App - Requirements Document

## 1. Functional Requirements

### 1.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|------------|----------|
| AUTH-1 | Users sign up via Google OAuth | Must |
| AUTH-2 | Admin pre-approves users by email address | Must |
| AUTH-3 | Unapproved users see a "pending approval" screen after sign-up | Must |
| AUTH-4 | Admin can revoke access at any time | Must |
| AUTH-5 | Admin can promote other users to admin role | Should |
| AUTH-6 | Session persists across browser restarts (remember me) | Must |
| AUTH-7 | Admin can view list of all registered users and their approval status | Must |

### 1.2 Content Management (Admin)

| ID | Requirement | Priority |
|----|------------|----------|
| CM-1 | Admin can create/edit/delete books (e.g., "Acts") | Must |
| CM-2 | Admin can create/edit/delete chapters within a book | Must |
| CM-3 | Admin can create/edit/delete sessions within a chapter (for multi-week chapters) | Must |
| CM-4 | Admin can upload study notes as rich text (markdown or WYSIWYG) | Must |
| CM-5 | Admin can upload images and embed them in notes | Must |
| CM-6 | Admin can upload audio files (MP3) per session | Must |
| CM-7 | Admin can link video files via Google Drive share URL per session | Must |
| CM-8 | Admin can upload converted keynote slides (as images/PDF) | Should |
| CM-9 | Admin can set the display order of books, chapters, sessions | Must |
| CM-10 | Admin can publish/unpublish content (draft mode) | Should |
| CM-11 | Admin can set the scripture reference for each session | Must |

### 1.3 Content Display (User)

| ID | Requirement | Priority |
|----|------------|----------|
| CD-1 | Users see a landing page with available books | Must |
| CD-2 | Clicking a book shows its chapters | Must |
| CD-3 | Clicking a chapter shows its sessions/notes | Must |
| CD-4 | Study notes render as beautifully styled HTML | Must |
| CD-5 | Images display inline within notes | Must |
| CD-6 | Audio player embedded for MP3 files | Must |
| CD-7 | Video player embedded or linked | Must |
| CD-8 | Scripture passage displayed alongside or within notes | Must |
| CD-9 | Table of contents navigation within long notes | Must |
| CD-10 | Smooth pagination between sessions/chapters | Must |
| CD-11 | "Back to top" and "Back to TOC" quick navigation | Must |
| CD-12 | Breadcrumb navigation (Book > Chapter > Session) | Must |

### 1.4 User Notes

| ID | Requirement | Priority |
|----|------------|----------|
| UN-1 | Users can create personal notes per session | Must |
| UN-2 | Users can create personal notes per chapter | Must |
| UN-3 | Users can create a global notebook | Should |
| UN-4 | Notes are text-only (no media upload) | Must |
| UN-5 | Notes have a character limit (e.g., 5000 chars per note) | Must |
| UN-6 | Users can edit and delete their own notes | Must |
| UN-7 | Notes are private (only visible to the note author) | Must |

### 1.5 Bookmarks & Highlights

| ID | Requirement | Priority |
|----|------------|----------|
| BH-1 | Users can highlight/select a section of study notes and save it | Must |
| BH-2 | Users can choose a highlight color (e.g., yellow, green, blue, pink) | Must |
| BH-3 | Users can bookmark a session for quick access later | Must |
| BH-4 | Highlights are stored with the text range and associated session | Must |
| BH-5 | Users can view all their bookmarks in one place | Must |
| BH-6 | Users can view all their highlights per session or across all sessions | Must |
| BH-7 | Users can add a short note to a highlight | Should |
| BH-8 | Users can remove bookmarks and highlights | Must |
| BH-9 | Bookmarks and highlights are private to each user | Must |

### 1.6 Quizzes


| ID | Requirement | Priority |
|----|------------|----------|
| QZ-1 | Admin can create a quiz for any session or chapter | Must |
| QZ-2 | Quiz supports multiple choice questions | Must |
| QZ-3 | Quiz supports true/false questions | Must |
| QZ-4 | Quiz supports fill-in-the-blank questions | Should |
| QZ-5 | Admin sets correct answers | Must |
| QZ-6 | Users can take the quiz and see their score | Must |
| QZ-7 | Users can retake quizzes | Must |
| QZ-8 | Admin can view quiz results for all users | Must |
| QZ-9 | Quiz appears at the end of a session/chapter | Must |

### 1.7 Scripture Integration

| ID | Requirement | Priority |
|----|------------|----------|
| SC-1 | Display ESV scripture for admin-specified references | Must |
| SC-2 | Admin configures ESV API key in settings | Must |
| SC-3 | Users can select alternate Bible translations | Should |
| SC-4 | Scripture text is styled consistently with study notes | Must |
| SC-5 | Cache scripture responses to reduce API calls | Should |

### 1.8 Search

| ID | Requirement | Priority |
|----|------------|----------|
| SR-1 | Global search across all study content | Must |
| SR-2 | Fuzzy matching (handles typos) | Must |
| SR-3 | Search results show context snippets | Must |
| SR-4 | Search results link to the relevant session | Must |
| SR-5 | Search within a specific book or chapter | Should |
| SR-6 | Search user's own notes | Should |

### 1.9 Discussion

| ID | Requirement | Priority |
|----|------------|----------|
| DS-1 | Discussion thread per session/chapter | Must |
| DS-2 | Users can post comments | Must |
| DS-3 | Users can reply to comments (threaded) | Must |
| DS-4 | Admin can delete inappropriate comments | Must |
| DS-5 | Admin can edit/hide comments (moderation) | Must |
| DS-6 | Timestamp and author shown on each comment | Must |
| DS-7 | Real-time updates (new comments appear without refresh) | Should |

### 1.10 Announcements & Notifications

| ID | Requirement | Priority |
|----|------------|----------|
| AN-1 | Admin can create announcement/splash screen | Must |
| AN-2 | Splash appears on app launch for users who haven't dismissed it | Must |
| AN-3 | Users can dismiss the announcement | Must |
| AN-4 | Admin can set announcement priority (info, important, urgent) | Should |
| AN-5 | Admin can schedule announcement start/end dates | Should |
| AN-6 | New content indicator (badge/dot) on books/chapters with new material | Must |
| AN-7 | Admin can push multiple announcements (queue, show latest undismissed) | Should |

### 1.11 Theming & Personalization

| ID | Requirement | Priority |
|----|------------|----------|
| TH-1 | Admin sets default font family and color scheme | Must |
| TH-2 | Users can override font size | Must |
| TH-3 | Users can switch between light/dark/sepia themes | Must |
| TH-4 | Theme preference persists across sessions | Must |
| TH-5 | Reading progress tracked per user | Should |
| TH-6 | Users can set a "reading preference" (e.g., compact vs. spacious) | Could |

### 1.12 Admin Dashboard

| ID | Requirement | Priority |
|----|------------|----------|
| AD-1 | Admin can manage users (approve, revoke, promote) | Must |
| AD-2 | Admin can manage content (CRUD for books/chapters/sessions) | Must |
| AD-3 | Admin can manage quizzes | Must |
| AD-4 | Admin can configure ESV API key | Must |
| AD-5 | Admin can set global theme defaults | Must |
| AD-6 | Admin can view basic analytics (active users, quiz scores) | Could |

---

## 2. Non-Functional Requirements

### 2.1 Performance
- Page load under 2 seconds on 4G connection
- Content pages statically generated where possible
- Images optimized (WebP, lazy loading)
- Audio/video streaming (not full download before play)

### 2.2 Scalability
- Support 5-50 concurrent users on free tier
- Content grows over time (book by book); schema supports unlimited books

### 2.3 Security
- Row Level Security (RLS) on all Supabase tables
- Users can only see their own notes
- Admin-only routes protected server-side
- No sensitive data in client bundle
- CSRF protection via Supabase Auth

### 2.4 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigable
- Screen reader compatible
- Sufficient color contrast in all themes

### 2.5 Responsiveness
- Mobile-first design
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- Touch-friendly navigation and controls
- No horizontal scrolling on any viewport

### 2.6 Reliability & Offline
- Graceful handling of API failures (ESV API down, Supabase outage)
- PWA with Service Worker for offline reading (cached content available without network)
- Content pre-cached on device when user visits a session
- Auto-save for user notes (debounced, synced when online)

### 2.7 Cost Constraints
- All infrastructure must fit within free tiers
- No paid services required for core functionality
- Vercel: free tier (hobby)
- Supabase: free tier (500MB DB, 1GB storage, 50k MAU)
