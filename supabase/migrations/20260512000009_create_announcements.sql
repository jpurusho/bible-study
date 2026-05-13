create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  priority text not null default 'info' check (priority in ('info', 'important', 'urgent')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.announcement_dismissals (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  unique(announcement_id, user_id)
);

alter table public.announcements enable row level security;
alter table public.announcement_dismissals enable row level security;

create policy "Approved users can read active announcements"
  on public.announcements for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Admins full access to announcements"
  on public.announcements for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can manage own dismissals"
  on public.announcement_dismissals for all
  using (user_id = auth.uid());
