-- Umumiy katalog: owner bir marta yuklaydi, faol obunachilarning hammasida o‘zi paydo bo‘ladi.
create table public.catalog_subjects (
  subject_id text primary key check (length(subject_id) between 1 and 64),
  name text not null,
  category text not null default '',
  sort integer not null default 0,
  published boolean not null default true,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.catalog_subjects enable row level security;

create policy catalog_read_active on public.catalog_subjects for select to authenticated
  using ((select public.is_active()) and published);
create policy catalog_owner_all on public.catalog_subjects for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
revoke all on public.catalog_subjects from anon;
