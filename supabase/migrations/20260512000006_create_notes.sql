create table public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  scope text not null check (scope in ('session', 'chapter', 'book', 'global')),
  content text not null default '' check (char_length(content) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_notes_user_id_idx on public.user_notes(user_id);
create index user_notes_session_id_idx on public.user_notes(session_id);

create trigger user_notes_updated_at
  before update on public.user_notes
  for each row execute function public.update_updated_at();

alter table public.user_notes enable row level security;

create policy "Users own their notes"
  on public.user_notes for all
  using (user_id = auth.uid());
