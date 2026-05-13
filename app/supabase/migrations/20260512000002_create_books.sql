create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;

create policy "Published books visible to approved users"
  on public.books for select
  using (
    is_published = true
    and exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Admins full access to books"
  on public.books for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
