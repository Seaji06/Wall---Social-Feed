-- Wall posts. Run once in the Supabase SQL editor.
-- Safe to run again: policies are replaced, and the sample wall is only
-- inserted when the table is still empty.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0 and char_length(name) <= 80),
  body text not null check (char_length(btrim(body)) > 0 and char_length(body) <= 280),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.posts to anon, authenticated;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
  on public.posts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can create posts" on public.posts;
create policy "Anyone can create posts"
  on public.posts
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(body)) > 0
    and char_length(body) <= 280
    and char_length(btrim(name)) > 0
    and char_length(name) <= 80
  );

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception
  when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public)
values ('wall-photos', 'wall-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read wall photos" on storage.objects;
create policy "Public read wall photos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'wall-photos');

drop policy if exists "Anyone can upload wall photos" on storage.objects;
create policy "Anyone can upload wall photos"
  on storage.objects
  for insert
  to public
  with check (bucket_id = 'wall-photos');

insert into public.posts (name, body, created_at)
select seed.name, seed.body, seed.created_at
from (
  values
    ('Marco'::text, 'Cedric, the CTU lab wifi actually survived your last push. I checked twice.'::text, now() - interval '2 hours'),
    ('Liza'::text, 'Carcar traffic was kinder than our capstone deadline. Save me a seat in the lab tomorrow.'::text, now() - interval '3 hours'),
    ('Paolo'::text, 'Cedric, I left notes on the repo. The login page finally stops reloading itself.'::text, now() - interval '4 hours'),
    ('Bea'::text, 'That suit photo is doing more for the group than the documentation. Just saying.'::text, now() - interval '5 hours'),
    ('Rico'::text, 'Cedric, trivia at 7 near campus. Loser buys the sisig.'::text, now() - interval '6 hours'),
    ('Nina'::text, 'The robotics printer jammed again. The error log just said Cedric and then gave up.'::text, now() - interval '8 hours')
) as seed(name, body, created_at)
where not exists (select 1 from public.posts);
