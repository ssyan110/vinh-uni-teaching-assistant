BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','57815aa8-6671-44e8-a4cf-ad0dd2ccde2d',true);
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.courses WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.students WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.enrollments WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.class_sessions WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.attendance_records WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.observation_records WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.followups WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.learning_events WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.randomizer_attempts WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.student_notes WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.classroom_record_corrections WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT * FROM public.attendance_exceptions WHERE owner_id=auth.uid() ORDER BY id LIMIT 1000) t;
COMMIT;

