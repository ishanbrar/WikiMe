-- Admin-visible logs for article generation runs (service role only).
create table public.generation_runs (
  id text primary key,
  created_at timestamptz not null default now(),
  user_email text,
  mode text not null,
  success boolean not null default false,
  error_message text,
  logs jsonb not null default '[]'::jsonb,
  steps jsonb,
  metrics jsonb
);

create index generation_runs_created_at_idx
  on public.generation_runs (created_at desc);

alter table public.generation_runs enable row level security;

revoke all on table public.generation_runs from anon, authenticated;
