-- FACT classroom marks are independent; old rubric and observation columns remain intact.
create function public.valid_randomizer_fact_marks(marks jsonb)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case when jsonb_typeof(marks) = 'object' then
    not exists (
      select 1 from jsonb_each(marks) as item(key, value)
      where key not in ('F', 'A', 'C', 'T')
        or value not in ('0'::jsonb, '1'::jsonb, '2'::jsonb, '3'::jsonb, '4'::jsonb, '"na"'::jsonb, '"insufficient"'::jsonb)
    )
  else false end;
$$;

alter table public.randomizer_attempts
  add column fact_marks jsonb,
  add column fact_version text,
  add column assistance boolean,
  add constraint randomizer_attempts_fact_marks_check check (
    (fact_marks is null and fact_version is null)
    or (fact_marks is not null and fact_version is not null and fact_version = '1.0'
      and public.valid_randomizer_fact_marks(fact_marks))
  ),
  add constraint randomizer_attempts_fact_complete_check check (
    fact_marks is null or assessment_status not in ('observed', 'scored')
    or fact_marks ?& array['F', 'A', 'C', 'T']
  );

alter table public.randomizer_attempts
  drop constraint randomizer_attempts_observation_required_check,
  add constraint randomizer_attempts_observation_required_check check (
    assessment_status <> 'observed'
    or (score is null and (
      (performance_level is not null and observation_version is not null)
      or (fact_marks is not null and fact_version is not null and fact_marks ?& array['F', 'A', 'C', 'T'])
    ))
  );
-- Existing scores_check still requires legacy score columns NULL for observed rows.
-- No row update, no total of FACT, no RLS or ownership changes.
