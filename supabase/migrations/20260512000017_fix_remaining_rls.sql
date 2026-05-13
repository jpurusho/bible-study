-- Fix quiz, discussion, announcements, notes, bookmarks/highlights RLS
-- to use helper functions instead of direct profiles subqueries

-- Quizzes
drop policy if exists "Published quizzes visible to approved users" on public.quizzes;
drop policy if exists "Admins full access to quizzes" on public.quizzes;
create policy "Published quizzes readable" on public.quizzes for select
  using (is_published = true and public.is_approved_user());
create policy "Admins manage quizzes" on public.quizzes for all
  using (public.is_admin());

-- Quiz questions
drop policy if exists "Questions visible to approved users" on public.quiz_questions;
drop policy if exists "Admins full access to questions" on public.quiz_questions;
create policy "Questions readable" on public.quiz_questions for select
  using (public.is_approved_user());
create policy "Admins manage questions" on public.quiz_questions for all
  using (public.is_admin());

-- Quiz attempts (user owns + admin reads)
drop policy if exists "Users own their quiz attempts" on public.quiz_attempts;
drop policy if exists "Admins can read all quiz attempts" on public.quiz_attempts;
create policy "Users own quiz attempts" on public.quiz_attempts for all
  using (user_id = auth.uid());
create policy "Admins read quiz attempts" on public.quiz_attempts for select
  using (public.is_admin());

-- Discussion posts
drop policy if exists "Users can read discussions" on public.discussion_posts;
drop policy if exists "Approved users read discussions" on public.discussion_posts;
drop policy if exists "Users post and edit own comments" on public.discussion_posts;
drop policy if exists "Admins moderate discussions" on public.discussion_posts;

create policy "Discussions readable" on public.discussion_posts for select
  using (public.is_approved_user());
create policy "Users post comments" on public.discussion_posts for insert
  with check (user_id = auth.uid());
create policy "Users edit own comments" on public.discussion_posts for update
  using (user_id = auth.uid());
create policy "Admins moderate" on public.discussion_posts for update
  using (public.is_admin());
create policy "Admins delete discussions" on public.discussion_posts for delete
  using (public.is_admin());

-- Announcements
drop policy if exists "Active announcements visible" on public.announcements;
drop policy if exists "Admins full access to announcements" on public.announcements;
create policy "Announcements readable" on public.announcements for select
  using (public.is_approved_user());
create policy "Admins manage announcements" on public.announcements for all
  using (public.is_admin());

-- Announcement dismissals
drop policy if exists "Users own their dismissals" on public.announcement_dismissals;
create policy "Users manage dismissals" on public.announcement_dismissals for all
  using (user_id = auth.uid());
