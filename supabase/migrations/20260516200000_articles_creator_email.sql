-- Denormalized creator email for admin article log (set on save via service role)
alter table public.articles
  add column if not exists creator_email text;

create index if not exists articles_created_at_desc_idx
  on public.articles (created_at desc);
