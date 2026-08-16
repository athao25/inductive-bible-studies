-- Inductive Bible Studies — initial schema.
--
-- Two halves:
--   content  (courses, units, lessons)  world-readable, written only by the seed
--   per-user (profiles, lesson_progress, quiz_attempts, notes)  RLS-scoped to auth.uid()
--
-- The site is static, so the browser talks to PostgREST with the anon key and
-- an end-user JWT. Every policy therefore has to hold on its own: there is no
-- trusted server tier in front of these tables.

begin;

-- ---------------------------------------------------------------- content

create table public.courses (
  id           text primary key,              -- 'john', 'matthew', 'isaiah', 'trinity'
  name         text not null,
  title        text not null,
  initial      text not null,
  tagline      text not null default '',
  epigraph     text not null default '',
  detail       text not null default '',
  status       text not null default 'in progress'
                 check (status in ('in progress', 'complete')),
  position     integer not null,
  created_at   timestamptz not null default now()
);

create table public.units (
  id           bigint generated always as identity primary key,
  course_id    text not null references public.courses (id) on delete cascade,
  title        text not null,
  position     integer not null,
  unique (course_id, position)
);

create index units_course_id_idx on public.units (course_id);

create table public.lessons (
  id           bigint generated always as identity primary key,
  course_id    text not null references public.courses (id) on delete cascade,
  unit_id      bigint references public.units (id) on delete set null,
  slug         text not null,                 -- lesson file name, the client's stable handle
  n            integer not null,              -- lesson number within the course
  title        text not null,
  reference    text not null default '',      -- 'John 6:22-40'
  minutes      integer not null default 30,
  verse_ref    text not null default '',
  verse_text   text not null default '',
  quiz_count   integer not null default 0,
  unique (course_id, slug),
  unique (course_id, n)
);

create index lessons_course_id_n_idx on public.lessons (course_id, n);
create index lessons_unit_id_idx on public.lessons (unit_id);

-- ---------------------------------------------------------------- per-user

create table public.profiles (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null default '',
  fav_verse_ref   text not null default '2 Timothy 2:15',
  fav_verse_text  text not null default
    'Do your best to present yourself to God as one approved, a worker who has no need to be ashamed, rightly handling the word of truth.',
  dark_mode       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.lesson_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  lesson_id    bigint not null references public.lessons (id) on delete cascade,
  section      text not null default '',      -- resume position: Observation / Interpretation / Application
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Resume reads "newest unfinished row for this user".
create index lesson_progress_resume_idx
  on public.lesson_progress (user_id, updated_at desc)
  where completed_at is null;

create index lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

create table public.quiz_attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  lesson_id    bigint not null references public.lessons (id) on delete cascade,
  score        integer not null check (score >= 0),
  total        integer not null check (total > 0),
  created_at   timestamptz not null default now(),
  check (score <= total)
);

-- Every attempt is kept; the dashboard wants the latest per lesson.
create index quiz_attempts_user_lesson_idx
  on public.quiz_attempts (user_id, lesson_id, created_at desc);

create index quiz_attempts_lesson_id_idx on public.quiz_attempts (lesson_id);

create table public.notes (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  lesson_id    bigint not null references public.lessons (id) on delete cascade,
  kind         text not null check (kind in ('observation', 'interpretation', 'application')),
  slot         text check (slot in ('god', 'me', 'do')),
  reference    text not null default '',      -- 'v.14'
  body         text not null,
  clip         text not null default '',      -- passage text, when the line was clipped
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Application lines are one per slot; observation/interpretation are lists.
  constraint notes_slot_matches_kind check (
    (kind = 'application' and slot is not null) or
    (kind <> 'application' and slot is null)
  )
);

create unique index notes_application_slot_idx
  on public.notes (user_id, lesson_id, slot)
  where kind = 'application';

create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_user_lesson_idx on public.notes (user_id, lesson_id);
create index notes_lesson_id_idx on public.notes (lesson_id);

-- ------------------------------------------------------------- timestamps

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger lesson_progress_touch before update on public.lesson_progress
  for each row execute function public.touch_updated_at();
create trigger notes_touch before update on public.notes
  for each row execute function public.touch_updated_at();

-- A profile row must exist the moment an account does, so the dashboard never
-- has to cope with a missing favourite verse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------- RLS

alter table public.courses          enable row level security;
alter table public.units            enable row level security;
alter table public.lessons          enable row level security;
alter table public.profiles         enable row level security;
alter table public.lesson_progress  enable row level security;
alter table public.quiz_attempts    enable row level security;
alter table public.notes            enable row level security;

-- Content is public: the catalog renders before anyone signs in, and lesson
-- prose is already served as static HTML. No client-side writes.
create policy courses_read on public.courses
  for select to anon, authenticated using (true);
create policy units_read on public.units
  for select to anon, authenticated using (true);
create policy lessons_read on public.lessons
  for select to anon, authenticated using (true);

-- Per-user tables: one policy per command, so INSERT gets a WITH CHECK and the
-- read path stays a plain equality on an indexed column.
create policy profiles_select on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy lesson_progress_select on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy lesson_progress_insert on public.lesson_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy lesson_progress_update on public.lesson_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy lesson_progress_delete on public.lesson_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy quiz_attempts_select on public.quiz_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy quiz_attempts_insert on public.quiz_attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy notes_select on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notes_insert on public.notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notes_update on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy notes_delete on public.notes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------ grants

grant usage on schema public to anon, authenticated;

grant select on public.courses, public.units, public.lessons to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert on public.quiz_attempts to authenticated;
grant select, insert, update, delete on public.notes to authenticated;

-- Attempts are an append-only record; nothing may rewrite or erase them.
revoke update, delete on public.quiz_attempts from anon, authenticated;

-- ------------------------------------------------------------------- views

-- Per-course completion for the signed-in user. security_invoker means the
-- lesson_progress rows are filtered by that user's RLS policy, so the view
-- needs no user_id argument and cannot leak another account's counts.
create view public.my_course_progress
with (security_invoker = on) as
  select
    c.id                                                as course_id,
    count(l.id)                                         as total,
    count(lp.completed_at)                              as completed,
    max(lp.updated_at)                                  as last_touched
  from public.courses c
  join public.lessons l on l.course_id = c.id
  left join public.lesson_progress lp
    on lp.lesson_id = l.id and lp.user_id = (select auth.uid())
  group by c.id;

grant select on public.my_course_progress to authenticated;

commit;
