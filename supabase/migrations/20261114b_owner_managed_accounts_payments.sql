-- Hisoblarni faqat owner ochib beradi; o‘zi ro‘yxatdan o‘tganlar "faollashtirilmagan" (kira olmaydi); to‘lovlar hisobi.
alter table public.profiles add column if not exists pending boolean not null default false;

create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text not null default '',
  amount bigint not null default 0 check (amount >= 0),
  days integer not null default 0 check (days >= 0),
  lifetime boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy payments_select_owner on public.payments for select to authenticated using ((select public.is_owner()));
revoke insert, update, delete on public.payments from anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare is_own boolean;
begin
  is_own := lower(coalesce(new.email,'')) = 'brodyagayou1999@gmail.com'
            and not exists (select 1 from public.profiles where role = 'owner');
  insert into public.profiles (user_id, email, name, role, lifetime, pending, expires_at)
  values (new.id, coalesce(new.email,''),
          coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(coalesce(new.email,''), '@', 1)),
          case when is_own then 'owner' else 'user' end, is_own, not is_own,
          case when is_own then null else now() end);
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.owner_grant(p_user uuid, p_days integer, p_lifetime boolean, p_amount bigint)
returns void language plpgsql security definer set search_path = public as $$
declare pr public.profiles;
begin
  if not public.is_owner() then raise exception 'ruxsat yo''q'; end if;
  if coalesce(p_amount,0) < 0 or coalesce(p_days,0) < 0 or coalesce(p_days,0) > 3650 then raise exception 'qiymat noto''g''ri'; end if;
  if not p_lifetime and coalesce(p_days,0) = 0 then raise exception 'kun yoki umrbod tanlang'; end if;
  select * into pr from public.profiles where user_id = p_user for update;
  if not found then raise exception 'foydalanuvchi topilmadi'; end if;
  if pr.role = 'owner' then raise exception 'ownerga obuna kerak emas'; end if;
  if p_lifetime then
    update public.profiles set lifetime = true, pending = false, expires_at = null where user_id = p_user;
  elsif pr.lifetime then
    null;
  else
    update public.profiles set pending = false,
      expires_at = greatest(coalesce(pr.expires_at, now()), now()) + make_interval(days => p_days) where user_id = p_user;
  end if;
  insert into public.payments (user_id, email, amount, days, lifetime) values (p_user, pr.email, coalesce(p_amount,0), coalesce(p_days,0), coalesce(p_lifetime,false));
end $$;
revoke execute on function public.owner_grant(uuid, integer, boolean, bigint) from public, anon;
grant execute on function public.owner_grant(uuid, integer, boolean, bigint) to authenticated;

create or replace function public.owner_set_user(p_user uuid, p_blocked boolean, p_lifetime boolean, p_expires timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'ruxsat yo''q'; end if;
  update public.profiles set blocked = p_blocked, lifetime = p_lifetime, expires_at = p_expires,
         pending = case when p_lifetime or p_expires is null then false else pending end
   where user_id = p_user and role <> 'owner';
end $$;
