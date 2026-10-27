-- Teacher corrections keep the original classroom record and remove it from
-- descriptive answer counts. This is not a grade or an assessment score.
update public.randomizer_attempts
set counted_for_summary = false
where record_status = 'corrected' and counted_for_summary is distinct from false;

update public.learning_events
set counted_for_summary = false
where record_status = 'corrected' and counted_for_summary is distinct from false;

create or replace function public.keep_corrected_classroom_records_out_of_summary()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.record_status = 'corrected' then
    new.counted_for_summary := false;
  end if;
  return new;
end;
$$;

revoke all on function public.keep_corrected_classroom_records_out_of_summary() from public, anon, authenticated;
create trigger randomizer_attempts_corrected_summary_guard
  before insert or update on public.randomizer_attempts
  for each row execute function public.keep_corrected_classroom_records_out_of_summary();
create trigger learning_events_corrected_summary_guard
  before insert or update on public.learning_events
  for each row execute function public.keep_corrected_classroom_records_out_of_summary();

alter table public.randomizer_attempts
  add constraint randomizer_attempts_corrected_not_counted_check
  check (record_status <> 'corrected' or counted_for_summary = false);

alter table public.learning_events
  add constraint learning_events_corrected_not_counted_check
  check (record_status <> 'corrected' or counted_for_summary = false);

create table public.classroom_record_corrections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record_type text not null check (record_type in ('randomizer_attempt', 'learning_event')),
  record_id uuid not null,
  course_id uuid not null,
  student_id uuid,
  previous_record_status text not null check (previous_record_status in ('valid', 'corrected', 'voided')),
  next_record_status text not null default 'corrected' check (next_record_status = 'corrected'),
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  constraint classroom_record_corrections_owner_course_fk
    foreign key (owner_id, course_id) references public.courses(owner_id, id) on delete restrict,
  constraint classroom_record_corrections_owner_student_fk
    foreign key (owner_id, student_id) references public.students(owner_id, id) on delete restrict,
  constraint classroom_record_corrections_unique_record
    unique (owner_id, record_type, record_id)
);

create index classroom_record_corrections_owner_course_idx
  on public.classroom_record_corrections(owner_id, course_id, created_at desc);
create index classroom_record_corrections_owner_record_idx
  on public.classroom_record_corrections(owner_id, record_type, record_id);

alter table public.classroom_record_corrections enable row level security;
revoke all on public.classroom_record_corrections from anon, authenticated;
grant select on public.classroom_record_corrections to authenticated;
create policy classroom_record_corrections_owner_select
  on public.classroom_record_corrections for select to authenticated
  using ((select auth.uid()) = owner_id);

create or replace function public.correct_classroom_record(
  p_record_type text,
  p_record_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_course_id uuid;
  v_student_id uuid;
  v_previous_status text;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_owner_id is null then
    raise exception '請先登入。';
  end if;
  if p_record_type is null or p_record_type not in ('randomizer_attempt', 'learning_event') then
    raise exception '回答紀錄類型不正確。';
  end if;
  if p_record_id is null then
    raise exception '找不到要修正的回答紀錄。';
  end if;
  if char_length(v_reason) not between 1 and 500 then
    raise exception '請說明修正原因，最多 500 字。';
  end if;

  if p_record_type = 'randomizer_attempt' then
    select course_id, student_id, record_status
      into v_course_id, v_student_id, v_previous_status
    from public.randomizer_attempts
    where id = p_record_id and owner_id = v_owner_id
    for update;

    if not found then
      raise exception '找不到這筆回答紀錄。';
    end if;
    if v_previous_status = 'corrected' then
      raise exception '這筆回答紀錄已更正。';
    end if;
    if v_previous_status = 'voided' then
      raise exception '這筆回答紀錄已撤銷。';
    end if;

    update public.randomizer_attempts
    set record_status = 'corrected',
        counted_for_summary = false,
        correction_note = v_reason,
        corrected_at = now()
    where id = p_record_id and owner_id = v_owner_id;
  else
    select course_id, student_id, record_status
      into v_course_id, v_student_id, v_previous_status
    from public.learning_events
    where id = p_record_id and owner_id = v_owner_id
    for update;

    if not found then
      raise exception '找不到這筆回答紀錄。';
    end if;
    if v_previous_status = 'corrected' then
      raise exception '這筆回答紀錄已更正。';
    end if;
    if v_previous_status = 'voided' then
      raise exception '這筆回答紀錄已撤銷。';
    end if;

    update public.learning_events
    set record_status = 'corrected',
        counted_for_summary = false,
        correction_note = v_reason,
        corrected_at = now()
    where id = p_record_id and owner_id = v_owner_id;
  end if;

  insert into public.classroom_record_corrections (
    owner_id, record_type, record_id, course_id, student_id,
    previous_record_status, next_record_status, reason
  ) values (
    v_owner_id, p_record_type, p_record_id, v_course_id, v_student_id,
    v_previous_status, 'corrected', v_reason
  );
end;
$$;

revoke all on function public.correct_classroom_record(text, uuid, text) from public, anon;
grant execute on function public.correct_classroom_record(text, uuid, text) to authenticated;
