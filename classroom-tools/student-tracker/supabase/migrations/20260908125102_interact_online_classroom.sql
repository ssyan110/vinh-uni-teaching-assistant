-- Independent tables: do not bootstrap the legacy schema into the teaching database.
create table public.interact_rooms (
 id uuid primary key default gen_random_uuid(),
 teacher_hash text not null,
 title text not null,
 questions jsonb not null default '[]',
 revision integer not null default 0,
 ended boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.interact_responses (
 id uuid primary key,
 room_id uuid not null references public.interact_rooms(id),
 question_id uuid not null,
 participant_hash text not null,
 participant_name text not null,
 value jsonb not null,
 once_only boolean not null,
 created_at timestamptz not null default now()
);
create unique index interact_one_answer on public.interact_responses(room_id,question_id,participant_hash) where once_only;
create index interact_room_answers on public.interact_responses(room_id,created_at);
alter table public.interact_rooms enable row level security;
alter table public.interact_responses enable row level security;
revoke all on public.interact_rooms,public.interact_responses from anon,authenticated;

create function public.interact_classroom(p_action text, p_room uuid default null, p_token text default '', p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
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
 if length(p_token) < 32 or length(p_token) > 128 then raise exception '请刷新页面后重试。'; end if;
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
  if not teacher then raise exception '只有老师可以操作课堂。'; end if;
  if p_action = 'end' then
   update public.interact_rooms set ended=true, revision=revision+1 where id=r.id returning * into r;
  else
   if r.ended then raise exception '课堂已结束。'; end if;
   if (p_data->>'revision')::int is distinct from r.revision then raise exception '课堂已更新，请重试。'; end if;
   qs := p_data->'questions';
   if jsonb_typeof(qs) is distinct from 'array' then raise exception '题目格式错误。'; end if;
   if jsonb_array_length(qs)>200 or octet_length(qs::text)>500000 then raise exception '本堂题目已达上限，请创建新课堂。'; end if;
   for item in select value from jsonb_array_elements(qs) loop
    if item->>'type' not in ('open_response','poll','multiple_choice','true_false','short_answer')
      or item->>'status' not in ('active','stopped')
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
end $$;
revoke all on function public.interact_classroom(text,uuid,text,jsonb) from public;
grant execute on function public.interact_classroom(text,uuid,text,jsonb) to anon,authenticated;

