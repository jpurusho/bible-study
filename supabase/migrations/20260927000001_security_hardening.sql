begin;

-- Reconcile a production table that previously had no checked-in migration.
create table if not exists public.preapproved_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  added_by uuid,
  created_at timestamptz not null default now()
);
create unique index if not exists preapproved_emails_lower_email_idx
  on public.preapproved_emails (lower(email));
alter table public.preapproved_emails enable row level security;
drop policy if exists "Admins manage preapproved emails" on public.preapproved_emails;
drop policy if exists "Admins can manage preapproved emails" on public.preapproved_emails;
create policy "Admins manage preapproved emails" on public.preapproved_emails for all
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.preapproved_emails to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, is_approved)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    exists (
      select 1 from public.preapproved_emails
      where lower(email) = lower(coalesce(new.email, ''))
    )
  );
  return new;
end;
$$;

-- Security-definer helpers must resolve only explicitly qualified objects.
alter function public.is_admin() set search_path = '';
alter function public.is_approved_user() set search_path = '';
alter function public.handle_new_user() set search_path = '';

-- A user may edit presentation preferences, never authorization fields.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, theme) on public.profiles to authenticated;

create or replace function public.admin_update_profile(
  target_user_id uuid,
  new_role text default null,
  new_is_approved boolean default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if target_user_id = auth.uid() and (new_role is not null or new_is_approved is not null) then
    raise exception 'Administrators cannot change their own access';
  end if;

  if new_role is not null and new_role not in ('user', 'admin') then
    raise exception 'Invalid role';
  end if;

  update public.profiles
  set role = coalesce(new_role, role),
      is_approved = coalesce(new_is_approved, is_approved)
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, boolean) from public;
grant execute on function public.admin_update_profile(uuid, text, boolean) to authenticated;

create or replace function public.reorder_books(ordered_book_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if array_length(ordered_book_ids, 1) is null then return; end if;

  update public.books as book
  set display_order = requested.position::integer
  from unnest(ordered_book_ids) with ordinality as requested(id, position)
  where book.id = requested.id;
end;
$$;
revoke all on function public.reorder_books(uuid[]) from public;
grant execute on function public.reorder_books(uuid[]) to authenticated;

-- Secrets and internal counters are never public configuration.
drop policy if exists "Anyone can read settings" on public.app_settings;
revoke all on public.app_settings from anon;

create table if not exists public.api_rate_limits (
  user_id uuid not null,
  action text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  primary key (user_id, action)
);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(
  limit_action text,
  max_requests integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if auth.uid() is null or max_requests < 1 or window_seconds < 1 then return false; end if;

  insert into public.api_rate_limits (user_id, action, window_started_at, request_count)
  values (auth.uid(), limit_action, now(), 1)
  on conflict (user_id, action) do update
  set request_count = case
        when public.api_rate_limits.window_started_at < now() - make_interval(secs => window_seconds)
          then 1 else public.api_rate_limits.request_count + 1 end,
      window_started_at = case
        when public.api_rate_limits.window_started_at < now() - make_interval(secs => window_seconds)
          then now() else public.api_rate_limits.window_started_at end
  returning request_count into current_count;

  return current_count <= max_requests;
end;
$$;
revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;

-- Remove duplicate permissive discussion policies and rebuild least privilege.
drop policy if exists "Approved users can read discussions" on public.discussion_posts;
drop policy if exists "Approved users can create posts" on public.discussion_posts;
drop policy if exists "Users can update own posts" on public.discussion_posts;
drop policy if exists "Admins can update all posts" on public.discussion_posts;
drop policy if exists "Admins can delete posts" on public.discussion_posts;
drop policy if exists "Users can read discussions" on public.discussion_posts;
drop policy if exists "Approved users read discussions" on public.discussion_posts;
drop policy if exists "Users post and edit own comments" on public.discussion_posts;
drop policy if exists "Admins moderate discussions" on public.discussion_posts;
drop policy if exists "Discussions readable" on public.discussion_posts;
drop policy if exists "Users post comments" on public.discussion_posts;
drop policy if exists "Users edit own comments" on public.discussion_posts;
drop policy if exists "Admins moderate" on public.discussion_posts;
drop policy if exists "Admins delete discussions" on public.discussion_posts;

create policy "Approved users read discussions"
  on public.discussion_posts for select
  using (public.is_approved_user());
create policy "Approved users create discussions"
  on public.discussion_posts for insert
  with check (public.is_approved_user() and user_id = auth.uid());
create policy "Users update own discussions"
  on public.discussion_posts for update
  using (public.is_approved_user() and user_id = auth.uid())
  with check (public.is_approved_user() and user_id = auth.uid());
create policy "Admins update discussions"
  on public.discussion_posts for update
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete discussions"
  on public.discussion_posts for delete
  using (public.is_admin());

-- Quiz questions are delivered without answers; scoring happens in the database.
drop policy if exists "Questions visible to approved users" on public.quiz_questions;
drop policy if exists "Questions readable" on public.quiz_questions;
drop policy if exists "Admins full access to questions" on public.quiz_questions;
drop policy if exists "Admins manage questions" on public.quiz_questions;
create policy "Admins manage questions" on public.quiz_questions for all
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.get_published_quiz_questions(target_quiz_id uuid)
returns table (
  id uuid,
  question_text text,
  question_type text,
  options jsonb,
  display_order integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select q.id, q.question_text, q.question_type, q.options, q.display_order
  from public.quiz_questions q
  join public.quizzes z on z.id = q.quiz_id
  where q.quiz_id = target_quiz_id
    and z.is_published = true
    and public.is_approved_user()
  order by q.display_order;
$$;

create or replace function public.submit_quiz(target_quiz_id uuid, submitted_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  question record;
  given_answer text;
  is_correct boolean;
  score_count integer := 0;
  total_count integer := 0;
  answer_details jsonb := '{}'::jsonb;
begin
  if submitted_answers is null
     or jsonb_typeof(submitted_answers) <> 'object'
     or pg_column_size(submitted_answers) > 65536 then
    raise exception 'Invalid quiz submission';
  end if;

  if not public.is_approved_user() or not exists (
    select 1 from public.quizzes where id = target_quiz_id and is_published = true
  ) then
    raise exception 'Quiz is unavailable';
  end if;

  for question in
    select id, question_type, correct_answer
    from public.quiz_questions
    where quiz_id = target_quiz_id
    order by display_order
  loop
    total_count := total_count + 1;
    given_answer := trim(coalesce(submitted_answers ->> question.id::text, ''));
    is_correct := case
      when question.question_type = 'fill_blank'
        then lower(given_answer) = lower(trim(question.correct_answer))
      else given_answer = trim(question.correct_answer)
    end;
    if is_correct then score_count := score_count + 1; end if;
    answer_details := answer_details || jsonb_build_object(
      question.id::text,
      jsonb_build_object(
        'given', given_answer,
        'correct', question.correct_answer,
        'isCorrect', is_correct
      )
    );
  end loop;

  if total_count = 0 then raise exception 'Quiz has no questions'; end if;

  insert into public.quiz_attempts (quiz_id, user_id, answers, score, total, completed_at)
  values (target_quiz_id, auth.uid(), submitted_answers, score_count, total_count, now());

  return jsonb_build_object('score', score_count, 'total', total_count, 'answers', answer_details);
end;
$$;

revoke all on function public.get_published_quiz_questions(uuid) from public;
revoke all on function public.submit_quiz(uuid, jsonb) from public;
grant execute on function public.get_published_quiz_questions(uuid) to authenticated;
grant execute on function public.submit_quiz(uuid, jsonb) to authenticated;
revoke insert, update, delete on public.quiz_attempts from authenticated;
grant select on public.quiz_attempts to authenticated;

drop policy if exists "Users own their quiz attempts" on public.quiz_attempts;
drop policy if exists "Users own quiz attempts" on public.quiz_attempts;
create policy "Users read own quiz attempts" on public.quiz_attempts for select
  using (user_id = auth.uid());

commit;
