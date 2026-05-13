create table public.session_media (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  type text not null check (type in ('image', 'audio', 'video', 'slides')),
  title text,
  url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index session_media_session_id_idx on public.session_media(session_id);

alter table public.session_media enable row level security;

create policy "Media visible to approved users"
  on public.session_media for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Admins full access to media"
  on public.session_media for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
