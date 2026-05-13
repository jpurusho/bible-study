-- Helper function to check if user is approved (bypasses RLS on profiles)
create or replace function public.is_approved_user()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_approved = true
  );
$$ language sql security definer stable;

-- Fix books policies
drop policy if exists "Published books visible to approved users" on public.books;
drop policy if exists "Admins full access to books" on public.books;

create policy "Published books visible to approved users"
  on public.books for select
  using (is_published = true and public.is_approved_user());

create policy "Admins full access to books"
  on public.books for all
  using (public.is_admin());

-- Fix chapters policies
drop policy if exists "Published chapters visible to approved users" on public.chapters;
drop policy if exists "Admins full access to chapters" on public.chapters;

create policy "Published chapters visible to approved users"
  on public.chapters for select
  using (is_published = true and public.is_approved_user());

create policy "Admins full access to chapters"
  on public.chapters for all
  using (public.is_admin());

-- Fix sessions policies
drop policy if exists "Published sessions visible to approved users" on public.sessions;
drop policy if exists "Admins full access to sessions" on public.sessions;

create policy "Published sessions visible to approved users"
  on public.sessions for select
  using (is_published = true and public.is_approved_user());

create policy "Admins full access to sessions"
  on public.sessions for all
  using (public.is_admin());

-- Fix session_media policies
drop policy if exists "Media visible to approved users" on public.session_media;
drop policy if exists "Admins full access to media" on public.session_media;

create policy "Media readable by approved users"
  on public.session_media for select
  using (public.is_approved_user());

create policy "Admins manage media"
  on public.session_media for all
  using (public.is_admin());
