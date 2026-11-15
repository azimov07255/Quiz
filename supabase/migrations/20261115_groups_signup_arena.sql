-- Guruhlar (kimga nima ko‘rinadi), taklif kodi bilan ro‘yxatdan o‘tish va musobaqa (arena) xonalari.
-- (Supabase loyihasi "testlar-app"ga qo‘llangan migratsiyaning nusxasi.)

-- 1) Guruhlar: bo‘sh guruh ro‘yxati = hammaga ko‘rinadi
alter table public.profiles add column if not exists groups text[] not null default '{}';
alter table public.catalog_subjects add column if not exists groups text[] not null default '{}';

create or replace function public.my_groups() returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce((select p.groups from public.profiles p where p.user_id = auth.uid()), '{}'::text[]);
$$;
revoke execute on function public.my_groups() from public, anon;
grant execute on function public.my_groups() to authenticated;

drop policy if exists catalog_read_active on public.catalog_subjects;
create policy catalog_read_active on public.catalog_subjects for select to authenticated
  using ((select public.is_active()) and published
         and (cardinality(groups) = 0 or groups && (select public.my_groups())));

create or replace function public.owner_set_groups(p_user uuid, p_groups text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'ruxsat yo''q'; end if;
  update public.profiles set groups = coalesce(
    (select array_agg(distinct lower(trim(g))) from unnest(coalesce(p_groups, '{}'::text[])) g where length(trim(g)) between 1 and 30), '{}'::text[])
  where user_id = p_user and role <> 'owner';
end $$;
revoke execute on function public.owner_set_groups(uuid, text[]) from public, anon;
grant execute on function public.owner_set_groups(uuid, text[]) to authenticated;

-- 2) Ro‘yxatdan o‘tish sozlamalari (faqat owner o‘zgartiradi) va taklif kodi
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  signup_open boolean not null default false,
  signup_code text not null default '',
  signup_days integer not null default 7 check (signup_days between 1 and 3650),
  signup_group text not null default ''
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;
alter table public.app_settings enable row level security;
drop policy if exists settings_owner_all on public.app_settings;
create policy settings_owner_all on public.app_settings for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
revoke all on public.app_settings from anon;

create or replace function public.signup_open() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select signup_open and length(trim(signup_code)) >= 3 from public.app_settings where id = 1), false);
$$;
create or replace function public.check_signup_code(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select signup_open and length(trim(signup_code)) >= 3 and lower(trim(signup_code)) = lower(trim(coalesce(p_code, '')))
                   from public.app_settings where id = 1), false);
$$;
revoke execute on function public.signup_open() from public;
revoke execute on function public.check_signup_code(text) from public;
grant execute on function public.signup_open() to anon, authenticated;
grant execute on function public.check_signup_code(text) to anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare is_own boolean; ok boolean; st public.app_settings;
begin
  is_own := lower(coalesce(new.email,'')) = 'brodyagayou1999@gmail.com'
            and not exists (select 1 from public.profiles where role = 'owner');
  select * into st from public.app_settings where id = 1;
  ok := not is_own and coalesce(st.signup_open, false) and length(trim(coalesce(st.signup_code, ''))) >= 3
        and lower(trim(st.signup_code)) = lower(trim(coalesce(new.raw_user_meta_data->>'code', '')));
  insert into public.profiles (user_id, email, name, role, lifetime, pending, expires_at, groups)
  values (new.id, coalesce(new.email,''),
          coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(coalesce(new.email,''), '@', 1)),
          case when is_own then 'owner' else 'user' end, is_own,
          case when is_own or ok then false else true end,
          case when is_own then null when ok then now() + make_interval(days => st.signup_days) else now() end,
          case when ok and length(trim(st.signup_group)) > 0 then array[lower(trim(st.signup_group))] else '{}'::text[] end);
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3) Musobaqa (arena): xonalar va o‘yinchilar
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  qids jsonb not null,
  secs integer not null default 20 check (secs between 8 and 90),
  status text not null default 'lobby' check (status in ('lobby','running','finished')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create table if not exists public.room_players (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  score integer not null default 0,
  answered integer not null default 0,
  correct integer not null default 0,
  finished boolean not null default false,
  finished_at timestamptz,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
drop policy if exists rooms_read on public.rooms;
drop policy if exists room_players_read on public.room_players;
create policy rooms_read on public.rooms for select to authenticated using ((select public.is_active()));
create policy room_players_read on public.room_players for select to authenticated using ((select public.is_active()));
revoke insert, update, delete on public.rooms from anon, authenticated;
revoke insert, update, delete on public.room_players from anon, authenticated;
revoke all on public.rooms from anon;
revoke all on public.room_players from anon;

create or replace function public._room_code() returns text language plpgsql as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; r text; i int;
begin
  loop
    r := '';
    for i in 1..5 loop r := r || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from public.rooms where code = r);
  end loop;
  return r;
end $$;
revoke execute on function public._room_code() from public, anon, authenticated;

create or replace function public.room_create(p_title text, p_qids jsonb, p_secs integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; rc text; nm text;
begin
  if not public.is_active() then raise exception 'hisob faol emas'; end if;
  if jsonb_typeof(p_qids) <> 'array' or jsonb_array_length(p_qids) not between 3 and 60 then raise exception 'savollar soni 3 dan 60 gacha bo''lsin'; end if;
  delete from public.rooms where created_at < now() - interval '2 days';
  select coalesce(nullif(name, ''), split_part(email, '@', 1)) into nm from public.profiles where user_id = auth.uid();
  rc := public._room_code();
  insert into public.rooms (code, host, title, qids, secs) values (rc, auth.uid(), left(coalesce(p_title, ''), 80), p_qids, coalesce(p_secs, 20)) returning id into rid;
  insert into public.room_players (room_id, user_id, name) values (rid, auth.uid(), left(coalesce(nm, ''), 40));
  return jsonb_build_object('id', rid, 'code', rc);
end $$;

create or replace function public.room_join(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare r public.rooms; nm text;
begin
  if not public.is_active() then raise exception 'hisob faol emas'; end if;
  select * into r from public.rooms where code = upper(trim(coalesce(p_code, '')));
  if not found then raise exception 'xona topilmadi'; end if;
  if r.status = 'finished' then raise exception 'musobaqa tugagan'; end if;
  if r.status = 'running' and not exists (select 1 from public.room_players where room_id = r.id and user_id = auth.uid()) then
    raise exception 'musobaqa allaqachon boshlangan';
  end if;
  select coalesce(nullif(name, ''), split_part(email, '@', 1)) into nm from public.profiles where user_id = auth.uid();
  insert into public.room_players (room_id, user_id, name) values (r.id, auth.uid(), left(coalesce(nm, ''), 40)) on conflict do nothing;
  return r.id;
end $$;

create or replace function public.room_start(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.rooms set status = 'running', started_at = now() where id = p_room and host = auth.uid() and status = 'lobby';
  if not found then raise exception 'boshlab bo''lmadi'; end if;
end $$;

create or replace function public.room_end(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.rooms set status = 'finished', finished_at = now() where id = p_room and host = auth.uid() and status <> 'finished';
end $$;

create or replace function public.room_report(p_room uuid, p_answered integer, p_correct integer, p_score integer, p_finished boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r public.rooms; n integer;
begin
  select * into r from public.rooms where id = p_room;
  if not found or r.status <> 'running' then return; end if;
  n := jsonb_array_length(r.qids);
  if p_answered < 0 or p_answered > n or p_correct < 0 or p_correct > p_answered or p_score < 0 or p_score > p_correct * 160 then raise exception 'qiymat noto''g''ri'; end if;
  update public.room_players set answered = greatest(answered, p_answered), correct = greatest(correct, p_correct), score = greatest(score, p_score),
         finished = finished or coalesce(p_finished, false) or p_answered >= n,
         finished_at = case when finished_at is null and (coalesce(p_finished, false) or p_answered >= n) then now() else finished_at end,
         updated_at = now()
   where room_id = p_room and user_id = auth.uid();
end $$;

revoke execute on function public.room_create(text, jsonb, integer) from public, anon;
revoke execute on function public.room_join(text) from public, anon;
revoke execute on function public.room_start(uuid) from public, anon;
revoke execute on function public.room_end(uuid) from public, anon;
revoke execute on function public.room_report(uuid, integer, integer, integer, boolean) from public, anon;
grant execute on function public.room_create(text, jsonb, integer) to authenticated;
grant execute on function public.room_join(text) to authenticated;
grant execute on function public.room_start(uuid) to authenticated;
grant execute on function public.room_end(uuid) to authenticated;
grant execute on function public.room_report(uuid, integer, integer, integer, boolean) to authenticated;

alter function public._room_code() set search_path = public;
