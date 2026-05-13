-- Add unique constraint for upsert support on user_notes
-- One note per user per scope-target combination
create unique index user_notes_user_session_scope_idx
  on public.user_notes(user_id, session_id, scope)
  where session_id is not null;

create unique index user_notes_user_chapter_scope_idx
  on public.user_notes(user_id, chapter_id, scope)
  where chapter_id is not null;

create unique index user_notes_user_book_scope_idx
  on public.user_notes(user_id, book_id, scope)
  where book_id is not null;

create unique index user_notes_user_global_scope_idx
  on public.user_notes(user_id, scope)
  where scope = 'global';
