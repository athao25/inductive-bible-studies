-- Supabase's default privileges hand anon and authenticated full DML on every
-- new table in public, leaving RLS as the only thing standing between an
-- anonymous visitor and a DELETE. Strip that back to what each role needs, so
-- a policy mistake is not immediately a data-loss bug.

begin;

revoke all on public.courses, public.units, public.lessons,
  public.profiles, public.lesson_progress, public.quiz_attempts, public.notes,
  public.my_course_progress
  from anon, authenticated;

-- Content: read-only, and readable before sign-in so the catalog can render.
grant select on public.courses, public.units, public.lessons to anon, authenticated;

-- Per-user rows: RLS scopes them to auth.uid(); grants scope the verbs.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert on public.quiz_attempts to authenticated;   -- append-only history
grant select, insert, update, delete on public.notes to authenticated;
grant select on public.my_course_progress to authenticated;

-- Future tables in public inherit the same posture rather than the permissive
-- default; each migration still grants explicitly.
alter default privileges in schema public revoke all on tables from anon, authenticated;

commit;
