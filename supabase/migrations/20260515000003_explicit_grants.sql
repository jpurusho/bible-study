-- Explicit GRANTs for Data API access (required after Oct 30, 2026)
-- This ensures supabase-js, PostgREST, and GraphQL can access all tables.

-- Service role gets full access to everything
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Anon role: read-only on published content (RLS handles actual filtering)
GRANT SELECT ON public.books TO anon;
GRANT SELECT ON public.chapters TO anon;
GRANT SELECT ON public.sessions TO anon;
GRANT SELECT ON public.session_media TO anon;
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT ON public.app_settings TO anon;

-- Authenticated role: read + write where appropriate (RLS enforces per-user access)
GRANT SELECT ON public.books TO authenticated;
GRANT SELECT ON public.chapters TO authenticated;
GRANT SELECT ON public.sessions TO authenticated;
GRANT SELECT ON public.session_media TO authenticated;
GRANT SELECT ON public.quizzes TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT SELECT ON public.announcements TO authenticated;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.scripture_cache TO authenticated;
GRANT SELECT ON public.preapproved_emails TO authenticated;
GRANT SELECT ON public.discussion_posts TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_highlights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT SELECT, INSERT ON public.announcement_dismissals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussion_posts TO authenticated;

GRANT UPDATE ON public.profiles TO authenticated;

-- Admin operations (RLS with is_admin() already enforces who can do these)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_media TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preapproved_emails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT INSERT ON public.scripture_cache TO authenticated;
