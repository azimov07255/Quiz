-- Podkast transkriptlari keshi: bir marta transkripsiya qilingan audio boshqa foydalanuvchilarga ham tayyor (AI limiti tejaladi).
create table if not exists public.ielts_transcripts (
  key text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.ielts_transcripts enable row level security;
revoke all on public.ielts_transcripts from anon, authenticated;
