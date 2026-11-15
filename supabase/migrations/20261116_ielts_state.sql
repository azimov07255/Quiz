-- IELTS ilovasi (ielts/) holati: har foydalanuvchining shaxsiy JSON qatori. Faqat owner va "ielts" guruhidagilar.
create table if not exists public.ielts_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  rev integer not null default 0,
  updated_at timestamptz not null default now()
);
create or replace function public.can_ielts() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_active() and (public.is_owner() or 'ielts' = any(public.my_groups()));
$$;
revoke execute on function public.can_ielts() from public, anon;
grant execute on function public.can_ielts() to authenticated;
alter table public.ielts_state enable row level security;
drop policy if exists ielts_state_own on public.ielts_state;
create policy ielts_state_own on public.ielts_state for all to authenticated
  using (user_id = (select auth.uid()) and (select public.can_ielts()))
  with check (user_id = (select auth.uid()) and (select public.can_ielts()));
revoke all on public.ielts_state from anon;
