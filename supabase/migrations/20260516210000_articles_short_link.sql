-- Custom admin slugs can be shared at /{slug} instead of /a/{slug}
alter table public.articles
  add column if not exists short_link boolean not null default false;

create index if not exists articles_short_link_slug_idx
  on public.articles (slug)
  where short_link = true;
