create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  title text not null,
  chapter_number integer not null,
  description text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index chapters_book_id_idx on public.chapters(book_id);

alter table public.chapters enable row level security;

create policy "Published chapters visible to approved users"
  on public.chapters for select
  using (
    is_published = true
    and exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Admins full access to chapters"
  on public.chapters for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
