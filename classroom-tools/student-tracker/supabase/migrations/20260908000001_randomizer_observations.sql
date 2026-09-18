-- Add descriptive observations without rewriting historical rubric scores.
alter table public.randomizer_attempts
  add column performance_level text,
  add column observation_version text,
  add column task_prompt text,
  add constraint randomizer_attempts_performance_level_check
    check (performance_level is null or performance_level in ('needs_support', 'mostly_complete', 'complete')),
  add constraint randomizer_attempts_observation_version_check
    check (observation_version is null or observation_version = '1.0'),
  add constraint randomizer_attempts_task_prompt_check
    check (task_prompt is null or char_length(task_prompt) <= 500);

alter table public.randomizer_attempts
  drop constraint randomizer_attempts_assessment_status_check,
  drop constraint randomizer_attempts_outcome_status_check,
  add constraint randomizer_attempts_assessment_status_check
    check (assessment_status in ('scored', 'observed', 'pending', 'not_applicable')),
  add constraint randomizer_attempts_outcome_status_check check (
    (outcome = 'answered' and assessment_status in ('scored', 'observed', 'pending'))
    or (outcome in ('pending', 'not_answered', 'undone') and assessment_status = 'not_applicable')
  ),
  add constraint randomizer_attempts_observation_required_check check (
    assessment_status <> 'observed'
    or (performance_level is not null and observation_version is not null and score is null)
  );
-- Existing scores_check requires all score columns NULL for observed records.
-- RLS, ownership, foreign keys and old rows remain unchanged.
