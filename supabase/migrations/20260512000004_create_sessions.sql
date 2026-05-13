create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  session_number integer not null,
  scripture_reference text,
  content text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_chapter_id_idx on public.sessions(chapter_id);

create trigger sessions_updated_at
  before update on public.sessions
  for each row execute function public.update_updated_at();

alter table public.sessions enable row level security;

create policy "Published sessions visible to approved users"
  on public.sessions for select
  using (
    is_published = true
    and exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Admins full access to sessions"
  on public.sessions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
