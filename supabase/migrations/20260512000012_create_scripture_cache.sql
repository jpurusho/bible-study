create table public.scripture_cache (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  translation text not null default 'ESV',
  content text not null,
  cached_at timestamptz not null default now(),
  unique(reference, translation)
);

alter table public.scripture_cache enable row level security;

create policy "Anyone can read scripture cache"
  on public.scripture_cache for select
  using (true);

create policy "Admins can manage scripture cache"
  on public.scripture_cache for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
