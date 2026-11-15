-- Musobaqani faqat owner va owner tanlaganlar ochadi; haftalik umumiy reyting.
-- (Supabase loyihasi "testlar-app"ga qo‘llangan migratsiyaning nusxasi.)
alter table public.profiles add column if not exists can_host boolean not null default false;

create or replace function public.owner_set_host(p_user uuid, p_val boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'ruxsat yo''q'; end if;
  update public.profiles set can_host = coalesce(p_val, false) where user_id = p_user and role <> 'owner';
end $$;
revoke execute on function public.owner_set_host(uuid, boolean) from public, anon;
grant execute on function public.owner_set_host(uuid, boolean) to authenticated;

create or replace function public.room_create(p_title text, p_qids jsonb, p_secs integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; rc text; nm text;
begin
  if not public.is_active() then raise exception 'hisob faol emas'; end if;
  if not (public.is_owner() or exists (select 1 from public.profiles where user_id = auth.uid() and can_host)) then raise exception 'musobaqa ochish huquqi sizda yo''q'; end if;
  if jsonb_typeof(p_qids) <> 'array' or jsonb_array_length(p_qids) not between 3 and 60 then raise exception 'savollar soni 3 dan 60 gacha bo''lsin'; end if;
  delete from public.rooms where created_at < now() - interval '2 days';
  select coalesce(nullif(name, ''), split_part(email, '@', 1)) into nm from public.profiles where user_id = auth.uid();
  rc := public._room_code();
  insert into public.rooms (code, host, title, qids, secs) values (rc, auth.uid(), left(coalesce(p_title, ''), 80), p_qids, coalesce(p_secs, 20)) returning id into rid;
  insert into public.room_players (room_id, user_id, name) values (rid, auth.uid(), left(coalesce(nm, ''), 40));
  return jsonb_build_object('id', rid, 'code', rc);
end $$;

-- Haftalik statistika (hafta dushanba 00:00 Toshkent vaqti bilan boshlanadi). Hamma kirish serverdagi funksiyalar orqali.
create table if not exists public.weekly_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  week date not null,
  answered integer not null default 0,
  correct integer not null default 0,
  arena integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);
alter table public.weekly_stats enable row level security;
revoke all on public.weekly_stats from anon, authenticated;

create or replace function public._week_start() returns date
language sql stable set search_path = public as $$
  select (date_trunc('week', now() at time zone 'Asia/Tashkent'))::date;
$$;
revoke execute on function public._week_start() from public, anon, authenticated;

create or replace function public.week_add(p_answered integer, p_correct integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active() then return; end if;
  if p_answered < 0 or p_answered > 300 or p_correct < 0 or p_correct > p_answered then raise exception 'qiymat noto''g''ri'; end if;
  insert into public.weekly_stats (user_id, week, answered, correct) values (auth.uid(), public._week_start(), p_answered, p_correct)
  on conflict (user_id, week) do update set answered = least(public.weekly_stats.answered + excluded.answered, 5000),
    correct = least(public.weekly_stats.correct + excluded.correct, 5000), updated_at = now();
end $$;
revoke execute on function public.week_add(integer, integer) from public, anon;
grant execute on function public.week_add(integer, integer) to authenticated;

create or replace function public.room_report(p_room uuid, p_answered integer, p_correct integer, p_score integer, p_finished boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r public.rooms; n integer; old integer; d integer;
begin
  select * into r from public.rooms where id = p_room;
  if not found or r.status <> 'running' then return; end if;
  n := jsonb_array_length(r.qids);
  if p_answered < 0 or p_answered > n or p_correct < 0 or p_correct > p_answered or p_score < 0 or p_score > p_correct * 160 then raise exception 'qiymat noto''g''ri'; end if;
  select score into old from public.room_players where room_id = p_room and user_id = auth.uid();
  if not found then return; end if;
  d := greatest(0, p_score - old);
  update public.room_players set answered = greatest(answered, p_answered), correct = greatest(correct, p_correct), score = greatest(score, p_score),
         finished = finished or coalesce(p_finished, false) or p_answered >= n,
         finished_at = case when finished_at is null and (coalesce(p_finished, false) or p_answered >= n) then now() else finished_at end,
         updated_at = now()
   where room_id = p_room and user_id = auth.uid();
  if d > 0 then
    insert into public.weekly_stats (user_id, week, arena) values (auth.uid(), public._week_start(), d)
    on conflict (user_id, week) do update set arena = least(public.weekly_stats.arena + excluded.arena, 50000), updated_at = now();
  end if;
end $$;

-- Reyting: faqat o‘z guruhingdagilar (owner hammani ko‘radi). ball = 10 × to‘g‘ri javob + musobaqa ballari.
create or replace function public.week_board(p_offset integer default 0)
returns table (user_id uuid, name text, answered integer, correct integer, arena integer, points integer, me boolean)
language plpgsql stable security definer set search_path = public as $$
declare w date; mg text[];
begin
  if not public.is_active() then raise exception 'hisob faol emas'; end if;
  w := public._week_start() - 7 * greatest(0, least(coalesce(p_offset, 0), 8));
  mg := public.my_groups();
  return query
    select s.user_id, coalesce(nullif(p.name, ''), split_part(p.email, '@', 1)), s.answered, s.correct, s.arena, s.correct * 10 + s.arena, s.user_id = auth.uid()
      from public.weekly_stats s join public.profiles p on p.user_id = s.user_id
     where s.week = w and not p.blocked and (s.correct * 10 + s.arena) > 0
       and (p.role <> 'owner' or s.user_id = auth.uid())
       and (s.user_id = auth.uid() or public.is_owner() or p.groups && mg or (cardinality(p.groups) = 0 and cardinality(mg) = 0))
     order by (s.correct * 10 + s.arena) desc, s.updated_at asc
     limit 100;
end $$;
revoke execute on function public.week_board(integer) from public, anon;
grant execute on function public.week_board(integer) to authenticated;
