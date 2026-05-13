create table public.discussion_posts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.discussion_posts(id) on delete cascade,
  content text not null check (char_length(content) <= 2000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index discussion_posts_session_id_idx on public.discussion_posts(session_id);
create index discussion_posts_parent_id_idx on public.discussion_posts(parent_id);

create trigger discussion_posts_updated_at
  before update on public.discussion_posts
  for each row execute function public.update_updated_at();

alter table public.discussion_posts enable row level security;

create policy "Approved users can read discussions"
  on public.discussion_posts for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Approved users can create posts"
  on public.discussion_posts for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Users can update own posts"
  on public.discussion_posts for update
  using (user_id = auth.uid());

create policy "Admins can update all posts"
  on public.discussion_posts for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete posts"
  on public.discussion_posts for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
