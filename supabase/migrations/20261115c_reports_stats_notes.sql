-- Savol xabarlari, savollar statistikasi, so‘nggi kirish va konspektlar.
-- (Supabase loyihasi "testlar-app"ga qo‘llangan migratsiyaning nusxasi.)

-- 1) Savol xabarlari
create table if not exists public.question_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  reporter text not null default '',
  subject_id text not null,
  topic_id text not null,
  q_id text not null,
  q_text text not null default '',
  reason text not null default 'boshqa',
  note text not null default '',
  status text not null default 'open' check (status in ('open','fixed','dismissed')),
  created_at timestamptz not null default now()
);
create unique index if not exists question_reports_one_open on public.question_reports (user_id, subject_id, topic_id, q_id) where status = 'open';
alter table public.question_reports enable row level security;
drop policy if exists qreports_owner_read on public.question_reports;
create policy qreports_owner_read on public.question_reports for select to authenticated using ((select public.is_owner()));
revoke insert, update, delete on public.question_reports from anon, authenticated;
revoke all on public.question_reports from anon;

create or replace function public.report_question(p_subject text, p_topic text, p_q text, p_text text, p_reason text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if not public.is_active() then raise exception 'hisob faol emas'; end if;
  if length(coalesce(p_subject,'')) not between 1 and 80 or length(coalesce(p_topic,'')) not between 1 and 80 or length(coalesce(p_q,'')) not between 1 and 80 then raise exception 'savol aniqlanmadi'; end if;
  if (select count(*) from public.question_reports where user_id = auth.uid() and created_at > now() - interval '1 day') >= 40 then raise exception 'bugungi xabarlar limiti tugadi'; end if;
  select coalesce(nullif(name, ''), split_part(email, '@', 1)) into nm from public.profiles where user_id = auth.uid();
  insert into public.question_reports (user_id, reporter, subject_id, topic_id, q_id, q_text, reason, note)
  values (auth.uid(), left(coalesce(nm, ''), 40), p_subject, p_topic, p_q, left(coalesce(p_text, ''), 400), left(coalesce(nullif(trim(p_reason), ''), 'boshqa'), 30), left(coalesce(p_note, ''), 400))
  on conflict (user_id, subject_id, topic_id, q_id) where status = 'open' do nothing;
end $$;
revoke execute on function public.report_question(text, text, text, text, text, text) from public, anon;
grant execute on function public.report_question(text, text, text, text, text, text) to authenticated;

create or replace function public.owner_report_resolve(p_subject text, p_topic text, p_q text, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'ruxsat yo''q'; end if;
  if p_status not in ('fixed','dismissed') then raise exception 'holat noto''g''ri'; end if;
  update public.question_reports set status = p_status where subject_id = p_subject and topic_id = p_topic and q_id = p_q and status = 'open';
end $$;
revoke execute on function public.owner_report_resolve(text, text, text, text) from public, anon;
grant execute on function public.owner_report_resolve(text, text, text, text) to authenticated;

-- 2) Savollar bo‘yicha umumiy statistika va so‘nggi kirish
create table if not exists public.question_stats (
  subject_id text not null,
  topic_id text not null,
  q_id text not null,
  seen integer not null default 0,
  wrong integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (subject_id, topic_id, q_id)
);
alter table public.question_stats enable row level security;
drop policy if exists qstats_owner_read on public.question_stats;
create policy qstats_owner_read on public.question_stats for select to authenticated using ((select public.is_owner()));
revoke insert, update, delete on public.question_stats from anon, authenticated;
revoke all on public.question_stats from anon;

create or replace function public.stats_add(p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  if not public.is_active() then return; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 120 then raise exception 'qiymat noto''g''ri'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    if length(coalesce(it->>'s','')) between 1 and 80 and length(coalesce(it->>'t','')) between 1 and 80 and length(coalesce(it->>'q','')) between 1 and 80 then
      insert into public.question_stats (subject_id, topic_id, q_id, seen, wrong)
      values (it->>'s', it->>'t', it->>'q', 1, case when (it->>'w')::boolean then 1 else 0 end)
      on conflict (subject_id, topic_id, q_id) do update set seen = public.question_stats.seen + 1, wrong = public.question_stats.wrong + excluded.wrong, updated_at = now();
    end if;
  end loop;
end $$;
revoke execute on function public.stats_add(jsonb) from public, anon;
grant execute on function public.stats_add(jsonb) to authenticated;

alter table public.profiles add column if not exists last_seen timestamptz;
create or replace function public.ping() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set last_seen = now() where user_id = auth.uid() and (last_seen is null or last_seen < now() - interval '5 minutes');
end $$;
revoke execute on function public.ping() from public, anon;
grant execute on function public.ping() to authenticated;

-- 3) Konspektlar (mavzu bo‘yicha). Ko‘rinish fan ko‘rinishiga bog‘liq (guruhlar ham).
create table if not exists public.catalog_notes (
  subject_id text not null,
  topic_id text not null,
  title text not null,
  body text not null,
  sort integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (subject_id, topic_id)
);
alter table public.catalog_notes enable row level security;
drop policy if exists notes_read on public.catalog_notes;
drop policy if exists notes_owner_all on public.catalog_notes;
create policy notes_read on public.catalog_notes for select to authenticated
  using ((select public.is_active()) and exists (select 1 from public.catalog_subjects c where c.subject_id = catalog_notes.subject_id));
create policy notes_owner_all on public.catalog_notes for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
revoke all on public.catalog_notes from anon;
