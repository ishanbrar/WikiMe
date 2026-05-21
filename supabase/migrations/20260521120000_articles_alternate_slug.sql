-- Link Realism ↔ Creative pairs (each row points at the other article slug).
alter table public.articles
  add column if not exists alternate_slug text;

create index if not exists articles_alternate_slug_idx
  on public.articles (alternate_slug)
  where alternate_slug is not null;
