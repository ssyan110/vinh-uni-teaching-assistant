-- Classroom records are evidence for the teacher's later review. They are not
-- the university's official grade calculation and never replace attendance.

alter table public.randomizer_attempts
  add column if not exists event_order integer,
  add column if not exists event_type text,
  add column if not exists opportunity_status text,
  add column if not exists response_status text,
  add column if not exists no_response_reason text,
  add column if not exists answer_context text,
  add column if not exists attendance_status text,
  add column if not exists score smallint,
  add column if not exists record_status text,
  add column if not exists correction_note text,
  add column if not exists corrected_at timestamptz,
  add column if not exists counted_for_summary boolean;

update public.randomizer_attempts
set
  event_order = coalesce(event_order, row_number_value),
  event_type = coalesce(event_type, case when selection_method = 'volunteer' then 'voluntary_speaking' else 'random_call' end),
  opportunity_status = coalesce(opportunity_status, case when selection_method = 'volunteer' then 'volunteered' else 'called' end),
  response_status = coalesce(response_status, case when outcome = 'answered' then 'answered' when outcome = 'not_answered' then 'no_response' else 'unobserved' end),
  no_response_reason = case when outcome = 'not_answered' then coalesce(no_response_reason, 'other') else null end,
  answer_context = coalesce(answer_context, 'unknown'),
  score = coalesce(score, total_score),
  record_status = coalesce(record_status, case when outcome = 'undone' then 'voided' else 'valid' end),
  counted_for_summary = coalesce(counted_for_summary, counted_for_grade, true)
from (
  select id, row_number() over (partition by randomizer_session_id order by drawn_at, id) as row_number_value
  from public.randomizer_attempts
) ordered
where public.randomizer_attempts.id = ordered.id;

alter table public.randomizer_attempts
  alter column event_order set default 1,
  alter column event_order set not null,
  alter column event_type set default 'random_call',
  alter column event_type set not null,
  alter column opportunity_status set default 'called',
  alter column opportunity_status set not null,
  alter column response_status set default 'unobserved',
  alter column response_status set not null,
  alter column answer_context set default 'unknown',
  alter column answer_context set not null,
  alter column record_status set default 'valid',
  alter column record_status set not null,
  alter column counted_for_summary set default true,
  alter column counted_for_summary set not null;

alter table public.randomizer_attempts
  add constraint randomizer_attempts_event_order_check check (event_order > 0),
  add constraint randomizer_attempts_event_type_check check (event_type in ('random_call', 'voluntary_speaking')),
  add constraint randomizer_attempts_opportunity_status_check check (opportunity_status in ('called', 'volunteered', 'not_selected', 'absent', 'excused', 'technical_issue')),
  add constraint randomizer_attempts_response_status_check check (response_status in ('answered', 'partial', 'no_response', 'declined', 'peer_supported', 'unobserved')),
  add constraint randomizer_attempts_no_response_reason_check check (no_response_reason is null or no_response_reason in ('unprepared', 'unclear_prompt', 'forgot', 'anxious_unwell', 'time_insufficient', 'chose_skip', 'other')),
  add constraint randomizer_attempts_answer_context_check check (answer_context in ('prepared', 'unprepared', 'unknown')),
  add constraint randomizer_attempts_attendance_status_check check (attendance_status is null or attendance_status in ('unconfirmed', 'present', 'late', 'absent', 'excused')),
  add constraint randomizer_attempts_record_status_check check (record_status in ('valid', 'corrected', 'voided')),
  add constraint randomizer_attempts_no_response_required_check check (outcome <> 'not_answered' or no_response_reason is not null),
  add constraint randomizer_attempts_score_check check (score is null or score between 0 and 12),
  add constraint randomizer_attempts_response_outcome_check check (
    (outcome = 'answered' and response_status in ('answered', 'partial', 'peer_supported'))
    or (outcome = 'not_answered' and response_status = 'no_response')
    or (outcome in ('pending', 'undone') and response_status = 'unobserved')
  );

create index if not exists randomizer_attempts_owner_course_lesson_student_idx
  on public.randomizer_attempts(owner_id, course_id, textbook_id, lesson_id, student_id, drawn_at desc);

alter table public.learning_events
  add column if not exists event_order integer,
  add column if not exists opportunity_status text,
  add column if not exists response_status text,
  add column if not exists no_response_reason text,
  add column if not exists answer_context text,
  add column if not exists attendance_status text,
  add column if not exists score smallint,
  add column if not exists record_status text,
  add column if not exists teacher_note text,
  add column if not exists correction_note text,
  add column if not exists corrected_at timestamptz,
  add column if not exists counted_for_summary boolean;

update public.learning_events
set
  response_status = coalesce(response_status, 'answered'),
  answer_context = coalesce(answer_context, 'unknown'),
  record_status = coalesce(record_status, 'valid'),
  score = coalesce(score, task_completion + comprehensibility + language_control + interaction),
  counted_for_summary = coalesce(counted_for_summary, counted_for_grade, true);

alter table public.learning_events
  alter column response_status set default 'answered',
  alter column response_status set not null,
  alter column answer_context set default 'unknown',
  alter column answer_context set not null,
  alter column record_status set default 'valid',
  alter column record_status set not null,
  alter column counted_for_summary set default true,
  alter column counted_for_summary set not null;

alter table public.learning_events
  add constraint learning_events_event_order_check check (event_order is null or event_order > 0),
  add constraint learning_events_opportunity_status_check check (opportunity_status is null or opportunity_status in ('called', 'volunteered', 'not_selected', 'absent', 'excused', 'technical_issue')),
  add constraint learning_events_response_status_check check (response_status in ('answered', 'partial', 'no_response', 'declined', 'peer_supported', 'unobserved')),
  add constraint learning_events_no_response_reason_check check (no_response_reason is null or no_response_reason in ('unprepared', 'unclear_prompt', 'forgot', 'anxious_unwell', 'time_insufficient', 'chose_skip', 'other')),
  add constraint learning_events_answer_context_check check (answer_context in ('prepared', 'unprepared', 'unknown')),
  add constraint learning_events_attendance_status_check check (attendance_status is null or attendance_status in ('unconfirmed', 'present', 'late', 'absent', 'excused')),
  add constraint learning_events_score_check check (score is null or score between 0 and 12),
  add constraint learning_events_record_status_check check (record_status in ('valid', 'corrected', 'voided'));
