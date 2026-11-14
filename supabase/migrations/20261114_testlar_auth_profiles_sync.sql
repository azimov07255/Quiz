-- Testlar ilovasi: profil/rol, natijalar holati va savol banki sinxronizatsiyasi
-- (Supabase loyihasi "testlar-app"ga qo‘llangan migratsiyaning nusxasi.)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  name text not null default '',
  role text not null default 'user' check (role in ('owner','user')),
  lifetime boolean not null default false,
  expires_at timestamptz,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  rev integer not null default 0,
  updated_at timestamptz not null default now()
);
create table public.quiz_banks (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  name text not null default '',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);
alter table public.profiles enable row level security;
alter table public.app_state enable row level security;
alter table public.quiz_banks enable row level security;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'owner');
$$;
create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.user_id = auth.uid() and not p.blocked
    and (p.role = 'owner' or p.lifetime or p.expires_at is null or p.expires_at > now()));
$$;
revoke execute on function public.is_owner() from public, anon;
revoke execute on function public.is_active() from public, anon;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_active() to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_select_owner on public.profiles for select to authenticated using ((select public.is_owner()));
create policy profiles_update_own on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (name) on public.profiles to authenticated;

create policy app_state_own on public.app_state for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active()))
  with check (user_id = (select auth.uid()) and (select public.is_active()));
create policy quiz_banks_own on public.quiz_banks for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active()))
  with check (user_id = (select auth.uid()) and (select public.is_active()));

-- Yangi foydalanuvchi: profil avtomatik. brodyagayou1999@gmail.com BIRINCHI bo‘lib ro‘yxatdan o‘tsa — owner.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare is_own boolean;
begin
  is_own := lower(coalesce(new.email,'')) = 'brodyagayou1999@gmail.com'
            and not exists (select 1 from public.profiles where role = 'owner');
  insert into public.profiles (user_id, email, name, role, lifetime)
  values (new.id, coalesce(new.email,''),
          coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(coalesce(new.email,''), '@', 1)),
          case when is_own then 'owner' else 'user' end, is_own);
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.owner_set_user(p_user uuid, p_blocked boolean, p_lifetime boolean, p_expires timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'ruxsat yo''q'; end if;
  update public.profiles set blocked = p_blocked, lifetime = p_lifetime, expires_at = p_expires
   where user_id = p_user and role <> 'owner';
end $$;
create or replace function public.owner_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_owner() then raise exception 'ruxsat yo''q'; end if;
  if exists (select 1 from public.profiles where user_id = p_user and role = 'owner') then raise exception 'ownerni o''chirib bo''lmaydi'; end if;
  delete from auth.users where id = p_user;
end $$;
revoke execute on function public.owner_set_user(uuid, boolean, boolean, timestamptz) from public, anon;
revoke execute on function public.owner_delete_user(uuid) from public, anon;
grant execute on function public.owner_set_user(uuid, boolean, boolean, timestamptz) to authenticated;
grant execute on function public.owner_delete_user(uuid) to authenticated;
