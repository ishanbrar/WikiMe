-- WikiMe shared articles (no auth; server writes via service role)
create table public.articles (
  id text primary key,
  slug text not null unique,
  article_json jsonb not null,
  mode text not null check (mode in ('realism', 'creative')),
  intake jsonb not null default '{}'::jsonb,
  headshot_data_url text,
  extracted_facts jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_slug_idx on public.articles (slug);
create index articles_created_at_idx on public.articles (created_at desc);

alter table public.articles enable row level security;

-- No anon/authenticated policies: reads and writes go through Next.js API using service role.

create or replace function public.set_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_updated_at
  before update on public.articles
  for each row
  execute function public.set_articles_updated_at();
