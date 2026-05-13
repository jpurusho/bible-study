create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  title text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'fill_blank')),
  options jsonb,
  correct_answer text not null,
  display_order integer not null default 0
);

create index quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}',
  score integer not null default 0,
  total integer not null default 0,
  completed_at timestamptz not null default now()
);

create index quiz_attempts_user_id_idx on public.quiz_attempts(user_id);

-- RLS for quizzes
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "Published quizzes visible to approved users"
  on public.quizzes for select
  using (
    is_published = true
    and exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Admins full access to quizzes"
  on public.quizzes for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Questions visible to approved users"
  on public.quiz_questions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
  );

create policy "Admins full access to questions"
  on public.quiz_questions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users own their quiz attempts"
  on public.quiz_attempts for all
  using (user_id = auth.uid());

create policy "Admins can read all quiz attempts"
  on public.quiz_attempts for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
