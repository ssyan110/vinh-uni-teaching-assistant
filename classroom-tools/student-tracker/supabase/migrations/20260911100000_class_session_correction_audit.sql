-- Keep an auditable history whenever a teacher corrects a class date or ordinal.
create table if not exists public.class_session_corrections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null,
  class_session_id uuid not null,
  previous_session_date date not null,
  next_session_date date not null,
  previous_session_number integer,
  next_session_number integer,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  constraint class_session_corrections_session_fk
    foreign key (owner_id, course_id, class_session_id)
    references public.class_sessions(owner_id, course_id, id) on delete cascade
);

alter table public.class_session_corrections enable row level security;
revoke all on public.class_session_corrections from anon, authenticated;
grant select on public.class_session_corrections to authenticated;
create policy class_session_corrections_owner_select on public.class_session_corrections
  for select to authenticated using ((select auth.uid()) = owner_id);

create or replace function public.correct_class_session(
  p_session_id uuid,
  p_session_date date,
  p_session_number integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.class_sessions%rowtype;
begin
  if auth.uid() is null then
    raise exception '請先登入。';
  end if;
  if p_session_date is null then
    raise exception '請填寫有效上課日期。';
  end if;
  if p_session_number is not null and (p_session_number < 1 or p_session_number > 999) then
    raise exception '上課次數必須是 1 到 999 的整數。';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 1 and 500 then
    raise exception '請說明修正原因，最多 500 字。';
  end if;

  select * into v_current
  from public.class_sessions
  where id = p_session_id and owner_id = auth.uid()
  for update;

  if not found then
    raise exception '找不到這堂課。';
  end if;

  if p_session_number is not null and exists (
    select 1
    from public.class_sessions
    where owner_id = auth.uid()
      and course_id = v_current.course_id
      and session_number = p_session_number
      and id <> p_session_id
  ) then
    raise exception '這個班級已有相同的上課次數。';
  end if;

  if v_current.session_date is not distinct from p_session_date
     and v_current.session_number is not distinct from p_session_number then
    return;
  end if;

  insert into public.class_session_corrections (
    owner_id, course_id, class_session_id,
    previous_session_date, next_session_date,
    previous_session_number, next_session_number, reason
  ) values (
    auth.uid(), v_current.course_id, v_current.id,
    v_current.session_date, p_session_date,
    v_current.session_number, p_session_number, btrim(p_reason)
  );

  update public.class_sessions
  set session_date = p_session_date,
      session_number = p_session_number
  where id = v_current.id and owner_id = auth.uid();
end;
$$;

revoke all on function public.correct_class_session(uuid, date, integer, text) from anon, public;
grant execute on function public.correct_class_session(uuid, date, integer, text) to authenticated;
