-- Bookmarks: quick-access saved sessions
create table public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, session_id)
);

create index user_bookmarks_user_id_idx on public.user_bookmarks(user_id);

-- Highlights: text selections within study notes
create table public.user_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  start_offset integer not null,
  end_offset integer not null,
  text_snippet text not null,
  color text not null default 'yellow' check (color in ('yellow', 'green', 'blue', 'pink')),
  note text,
  created_at timestamptz not null default now()
);

create index user_highlights_user_id_idx on public.user_highlights(user_id);
create index user_highlights_session_id_idx on public.user_highlights(session_id);

-- RLS
alter table public.user_bookmarks enable row level security;
alter table public.user_highlights enable row level security;

create policy "Users own their bookmarks"
  on public.user_bookmarks for all
  using (user_id = auth.uid());

create policy "Users own their highlights"
  on public.user_highlights for all
  using (user_id = auth.uid());
