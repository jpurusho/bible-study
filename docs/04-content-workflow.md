# Bible Study App - Content Workflow

## Content Authoring Strategy

### Recommended Approach: Markdown in Admin Panel

For going forward, the best method is a **rich text editor built into the admin dashboard** that stores content as Markdown. This gives you:

- Write directly in the app (no external tool needed)
- WYSIWYG editing with formatting toolbar
- Drag-and-drop image embedding
- Preview exactly how users will see it
- Version history built-in

### Editor: TipTap (recommended)

[TipTap](https://tiptap.dev) is a headless rich text editor for the web:

| Feature | Benefit |
|---------|---------|
| Free & open source | No cost |
| Markdown import/export | Paste markdown or export later |
| Extensible | Custom blocks for scripture, audio embeds |
| Collaborative-ready | Could add real-time co-editing later |
| Image uploads | Drag-and-drop to Supabase Storage |

### Content Production Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Admin Content Creation                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Option A: Write directly in admin editor               │
│  ┌──────────────────────────────────────┐               │
│  │  TipTap Editor (in-app)             │               │
│  │  - Rich text toolbar                │               │
│  │  - Drag/drop images                 │               │
│  │  - Embed audio player               │               │
│  │  - Insert scripture reference        │               │
│  │  - Preview mode                     │               │
│  └──────────────────────────────────────┘               │
│                                                         │
│  Option B: Import from external source                  │
│  ┌──────────────────────────────────────┐               │
│  │  1. Write in any Markdown editor:   │               │
│  │     - Obsidian (recommended)         │               │
│  │     - Notion (export as MD)          │               │
│  │     - Typora                        │               │
│  │     - VS Code                       │               │
│  │  2. Paste/import into admin editor   │               │
│  │  3. Add media attachments           │               │
│  │  4. Set scripture reference          │               │
│  │  5. Publish                         │               │
│  └──────────────────────────────────────┘               │
│                                                         │
│  Option C: Existing Keynote/PDF                         │
│  ┌──────────────────────────────────────┐               │
│  │  1. Export Keynote → PDF             │               │
│  │  2. Upload PDF as slides attachment  │               │
│  │  3. Optionally add text notes above  │               │
│  │  4. Publish                         │               │
│  └──────────────────────────────────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Upload Flow

```
Admin creates new session:
    │
    ├── 1. Set title, chapter, session number
    ├── 2. Set scripture reference (e.g., "Acts 2:1-13")
    ├── 3. Write/paste study notes in editor
    ├── 4. Attach media:
    │       ├── Images → upload to Supabase Storage
    │       ├── Audio (MP3) → upload to Supabase Storage
    │       ├── Video → paste Google Drive share link
    │       └── PDF slides → upload to Supabase Storage
    ├── 5. Preview rendering
    ├── 6. Save as draft OR publish immediately
    └── 7. (Optional) Create announcement splash
```

## Media Handling

### Images
- Upload directly in editor (drag-and-drop)
- Auto-compressed to WebP on upload
- Stored in Supabase Storage: `media/images/{session_id}/{filename}`
- Served via Supabase CDN

### Audio (MP3)
- Upload via media attachment panel
- Stored in Supabase Storage: `media/audio/{session_id}/{filename}`
- Custom audio player rendered inline
- Supports playback speed control (0.5x - 2x)

### Video (Google Drive)
- Admin pastes a Google Drive shareable link
- App extracts file ID and renders embedded player
- No storage consumed on Supabase
- Embed format: `https://drive.google.com/file/d/{FILE_ID}/preview`
- Requirement: video must be shared as "Anyone with the link can view"

### PDF Slides (from Keynote)
- Export Keynote → PDF
- Upload PDF via admin panel
- Rendered using embedded PDF viewer (or converted to page-by-page images)
- Alternative: export Keynote slides as individual PNG/JPG images for smoother mobile experience

## Content Structure Example

A typical weekly session publish would include:

```markdown
# Acts Chapter 2 - Week 1: The Day of Pentecost

## Scripture: Acts 2:1-13

[Auto-rendered ESV passage appears here]

## Study Notes

### Context & Background
When the day of Pentecost arrived, the disciples were
all together in one place...

### Key Themes
1. **The Promise Fulfilled** — Jesus had promised the Holy Spirit...
2. **Unity of Believers** — They were "all together"...
3. **Supernatural Signs** — Wind, fire, tongues...

### Discussion Points
- Why do you think God chose Pentecost for this event?
- What does "speaking in tongues" mean in this context?

## Media
- 🎧 Audio teaching (45 min)
- 📊 Slide presentation (PDF)
- 🎬 Video supplement

## Quiz
[Appears after user has scrolled through content]
```

## Recommended Workflow for Weekly Prep

1. **During the week**: Prepare notes in the admin editor (save as draft)
2. **Before session**: Add any final media, review formatting
3. **After session**: Publish + create announcement splash
4. **Optional**: Add quiz for the session
5. **Optional**: Monitor discussion thread for questions
