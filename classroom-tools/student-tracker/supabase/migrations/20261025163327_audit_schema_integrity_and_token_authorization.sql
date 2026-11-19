-- Non-destructive fixes verified against the live schema on 2026-10-25.
set lock_timeout = '5s';
set statement_timeout = '60s';

-- RLS does not govern TRUNCATE, REFERENCES or TRIGGER privileges.
revoke truncate, references, trigger on all tables in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

alter policy notes_read on public.student_notes using (owner_id = (select auth.uid()));
alter policy notes_insert on public.student_notes with check (owner_id = (select auth.uid()));

create index class_session_corrections_owner_course_session_idx
  on public.class_session_corrections(owner_id, course_id, class_session_id);
create index classroom_record_corrections_owner_student_idx
  on public.classroom_record_corrections(owner_id, student_id);
create index student_notes_course_student_idx on public.student_notes(course_id, student_id);
create index student_notes_supersession_idx
  on public.student_notes(owner_id, course_id, student_id, supersedes_id);

alter table public.followups
  add constraint followups_course_session_fk foreign key(owner_id, course_id, session_id)
    references public.class_sessions(owner_id, course_id, id) on delete cascade,
  add constraint followups_course_student_fk foreign key(owner_id, course_id, student_id)
    references public.enrollments(owner_id, course_id, student_id);
create index followups_owner_course_session_idx on public.followups(owner_id, course_id, session_id);
create index followups_owner_course_student_idx on public.followups(owner_id, course_id, student_id);

-- Attendance and observations must reference an enrolment in the session's class.
create function public.validate_session_student_enrollment()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.class_sessions s
    join public.enrollments e on e.owner_id=s.owner_id and e.course_id=s.course_id
    where s.id=new.session_id and s.owner_id=new.owner_id and e.student_id=new.student_id
  ) then
    raise exception 'Student does not belong to this classroom' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_session_student_enrollment() from public, anon, authenticated;
create trigger attendance_enrollment_guard before insert or update on public.attendance_records
  for each row execute function public.validate_session_student_enrollment();
create trigger observation_enrollment_guard before insert or update on public.observation_records
  for each row execute function public.validate_session_student_enrollment();

-- Preserve historical duplicates, but reject new date collisions on correction too.
create function public.guard_class_session_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id or new.course_id is distinct from old.course_id then
    raise exception 'Classroom identity cannot be reassigned';
  end if;
  if old.status='completed' and new.status<>'completed' then
    raise exception 'Completed classrooms cannot be reopened by a stale write';
  end if;
  if new.session_date is distinct from old.session_date then
    perform 1 from public.courses where id=new.course_id and owner_id=new.owner_id for update;
    if exists(select 1 from public.class_sessions where owner_id=new.owner_id
      and course_id=new.course_id and session_date=new.session_date and id<>new.id) then
      raise exception 'This class already has a session on that date' using errcode='23505';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_class_session_update() from public, anon, authenticated;
create trigger class_session_update_guard before update on public.class_sessions
  for each row execute function public.guard_class_session_update();

-- This endpoint intentionally serves students without Supabase accounts.
-- Reject SQL NULL before comparing the independent teacher capability token.
CREATE OR REPLACE FUNCTION public.interact_classroom(p_action text, p_room uuid DEFAULT NULL::uuid, p_token text DEFAULT ''::text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
 r public.interact_rooms;
 token_hash text;
 teacher boolean;
 q jsonb;
 item jsonb;
 v jsonb;
 qs jsonb;
 result_answers jsonb;
begin
 if p_token is null or length(p_token) < 32 or length(p_token) > 128 then raise exception '请刷新页面后重试。'; end if;
 token_hash := encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if p_action = 'create' then
  if length(btrim(coalesce(p_data->>'title',''))) not between 1 and 120 then raise exception '课堂名称须为 1 至 120 个字。'; end if;
  insert into public.interact_rooms(teacher_hash,title) values(token_hash,btrim(p_data->>'title')) returning * into r;
 else
  -- Serialize writes against stopping/launching; submissions never replace other answers.
  if p_action = 'read' then select * into r from public.interact_rooms where id=p_room;
  else select * into r from public.interact_rooms where id=p_room for update; end if;
  if r.id is null then raise exception '找不到这个课堂，请重新扫描二维码。'; end if;
 end if;
 teacher := r.teacher_hash = token_hash;
 if p_action in ('update','end') then
  if teacher is not true then raise exception '只有老师可以操作课堂。'; end if;
  if p_action = 'end' then
   update public.interact_rooms set ended=true, revision=revision+1 where id=r.id returning * into r;
  else
   if r.ended then raise exception '课堂已结束。'; end if;
   if (p_data->>'revision')::int is distinct from r.revision then raise exception '课堂已更新，请重试。'; end if;
   qs := p_data->'questions';
   if jsonb_typeof(qs) is distinct from 'array' then raise exception '题目格式错误。'; end if;
   if jsonb_array_length(qs)>200 or octet_length(qs::text)>500000 then raise exception '本堂题目已达上限，请创建新课堂。'; end if;
   for item in select value from jsonb_array_elements(qs) loop
    if coalesce(item->>'type', '') not in ('open_response','poll','multiple_choice','true_false','short_answer')
      or coalesce(item->>'status', '') not in ('active','stopped')
      or length(btrim(coalesce(item->>'promptText',''))) not between 1 and 4000
      or jsonb_typeof(item->'options') is distinct from 'array'
      or jsonb_typeof(item->'correctAnswers') is distinct from 'array'
      or jsonb_typeof(item->'allowMultiple') is distinct from 'boolean'
      or item->>'id' is null then raise exception '题目格式错误。'; end if;
    perform (item->>'id')::uuid;
   end loop;
   if (select count(*) from jsonb_array_elements(qs) x where x->>'status'='active')>1 then raise exception '一次只能开放一道题。'; end if;
   update public.interact_rooms set questions=qs,revision=revision+1 where id=r.id returning * into r;
  end if;
 elsif p_action = 'answer' then
  if r.ended then raise exception '课堂已结束。'; end if;
  select value into q from jsonb_array_elements(r.questions) where value->>'id'=p_data->>'questionId' and value->>'status'='active';
  if q is null then raise exception '老师已停止作答，请等待下一题。'; end if;
  if length(btrim(coalesce(p_data->>'name',''))) not between 1 and 80 then raise exception '请输入姓名（最多 80 个字）。'; end if;
  v := p_data->'value';
  if q->>'type' in ('open_response','short_answer') then
   if jsonb_typeof(v) is distinct from 'string' or length(btrim(v#>>'{}')) not between 1 and 2000 then raise exception '请输入答案（最多 2000 个字）。'; end if;
  elsif (q->>'allowMultiple')::boolean then
   if jsonb_typeof(v) is distinct from 'array' then raise exception '请选择答案。'; end if;
   if jsonb_array_length(v)<1 or jsonb_array_length(v)>jsonb_array_length(q->'options') then raise exception '请选择有效选项。'; end if;
   if exists(select 1 from jsonb_array_elements(v) a where jsonb_typeof(a) <> 'string' or not (q->'options' @> jsonb_build_array(a))) then raise exception '请选择有效选项。'; end if;
   if (select count(distinct a) from jsonb_array_elements(v) a)<>jsonb_array_length(v) then raise exception '选项不能重复。'; end if;
  else
   if jsonb_typeof(v) is distinct from 'string' or not(q->'options' @> jsonb_build_array(v)) then raise exception '请选择有效选项。'; end if;
  end if;
  -- Reusing a request ID makes a network retry safe for repeatable responses.
  if not exists(select 1 from public.interact_responses where id=(p_data->>'id')::uuid and room_id=r.id and participant_hash=token_hash) then
   if exists(select 1 from public.interact_responses where room_id=r.id and participant_hash=token_hash and created_at>now()-interval '1 second') then raise exception '请稍候再提交。'; end if;
   begin
    insert into public.interact_responses(id,room_id,question_id,participant_hash,participant_name,value,once_only)
     values((p_data->>'id')::uuid,r.id,(q->>'id')::uuid,token_hash,btrim(p_data->>'name'),v,q->>'type'<>'open_response');
   exception when unique_violation then raise exception '这道题已提交答案。'; end;
  end if;
 elsif p_action not in ('read','create') then raise exception '不支持的操作。';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'questionId',question_id,'participantId',participant_hash,'participantName',participant_name,'value',value,'submittedAt',created_at) order by created_at),'[]') into result_answers
 from public.interact_responses where room_id=r.id and (teacher or participant_hash=token_hash);
 select coalesce(jsonb_agg(case when teacher then x else x || jsonb_build_object('correctAnswers','[]'::jsonb) end),'[]') into qs from jsonb_array_elements(r.questions) x;
 return jsonb_build_object('title',r.title,'code',r.id,'createdAt',r.created_at,'questions',qs,'answers',result_answers,'revision',r.revision,'ended',r.ended);
end $function$


