-- Link articles to authenticated users; keep public share links readable
alter table public.articles
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists is_public boolean not null default true;

create index if not exists articles_user_id_idx on public.articles (user_id);
create index if not exists articles_user_created_idx on public.articles (user_id, created_at desc);

-- Public read for share URLs; owners can read private drafts
drop policy if exists "articles_select_public_or_owner" on public.articles;
create policy "articles_select_public_or_owner"
  on public.articles
  for select
  to authenticated, anon
  using (is_public = true or auth.uid() = user_id);

-- Owners manage their own rows (client-side saves when logged in)
drop policy if exists "articles_insert_own" on public.articles;
create policy "articles_insert_own"
  on public.articles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "articles_update_own" on public.articles;
create policy "articles_update_own"
  on public.articles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "articles_delete_own" on public.articles;
create policy "articles_delete_own"
  on public.articles
  for delete
  to authenticated
  using (auth.uid() = user_id);
