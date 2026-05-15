create table public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  unique(user_id, session_id)
);

create index reading_progress_user_id_idx on public.reading_progress(user_id);

alter table public.reading_progress enable row level security;

create policy "Users own their reading progress"
  on public.reading_progress for all
  using (user_id = auth.uid());
