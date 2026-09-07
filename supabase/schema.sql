-- Torah Tracker – database setup for Supabase.
-- Run this ONCE in your Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Then run seed.sql to load the Torah lists.

create extension if not exists pgcrypto;

-- ---------- users ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Torah lists (edited from the Admin screen) ----------
create table if not exists public.categories (
  key text primary key,
  name_he text not null,
  name_en text not null default '',
  leaf_type text not null default 'perek' check (leaf_type in ('perek', 'daf')),
  has_sections boolean not null default true,
  sort_order integer not null default 0
);
create table if not exists public.sections (
  key text primary key,
  category_key text not null references public.categories(key) on delete cascade,
  name_he text not null,
  name_en text not null default '',
  sort_order integer not null default 0
);
create table if not exists public.books (
  key text primary key,
  category_key text not null references public.categories(key) on delete cascade,
  section_key text not null default '',
  name_he text not null,
  name_en text not null default '',
  item_count integer not null default 0,
  first_item integer not null default 1,
  track_mode text not null default 'items' check (track_mode in ('items', 'parshiyot')),
  sort_order integer not null default 0,
  pesukim jsonb                                -- Chumash only: how many pesukim each perek has, e.g. [31, 25, 24, ...]
);
create table if not exists public.parshiyot (
  key text primary key,
  book_key text not null references public.books(key) on delete cascade,
  name_he text not null,
  name_en text not null default '',
  sort_order integer not null default 0,
  aliyah_ranges jsonb not null default '[]'::jsonb,
  pair_key text not null default '',           -- the other half of a double parashah, e.g. vayakhel <-> pekudei
  aliyah_pesukim jsonb not null default '{}'::jsonb  -- where each aliyah starts and ends: {"kohen": [fromPerek, fromPasuk, toPerek, toPasuk], ...}
);
create table if not exists public.aliyot (
  key text primary key,
  name_he text not null,
  name_en text not null default '',
  sort_order integer not null default 0,
  in_study boolean not null default true,
  is_extra boolean not null default false      -- a hosafah: shown, but not counted in "all aliyos", and always with its own pesukim range
);

-- ---------- each user's own data ----------
create table if not exists public.study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_key text not null,
  parashah_key text not null default '',
  item text not null,
  completed_at timestamptz not null default now()
  -- one row per completion: learning the same daf twice = two rows
);
create index if not exists study_progress_user_idx on public.study_progress (user_id, book_key);
create index if not exists study_progress_item_idx on public.study_progress (user_id, book_key, parashah_key, item);

create table if not exists public.aliyah_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_key text not null,
  parashah_key text not null,
  aliyah_key text not null,
  date date,
  synagogue text not null default '',
  notes text not null default '',
  combined boolean not null default false,     -- the week was read as a double parashah
  from_perek integer, from_pasuk integer,      -- filled in for a custom range (a hosafah, or an aliyah that was split); empty = the usual range
  to_perek integer, to_pasuk integer,
  created_at timestamptz not null default now()
  -- several entries per honor are allowed (received the same aliyah in different years)
);
create index if not exists aliyah_log_user_idx on public.aliyah_log (user_id);

-- ---------- security: who may see and change what ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.sections enable row level security;
alter table public.books enable row level security;
alter table public.parshiyot enable row level security;
alter table public.aliyot enable row level security;
alter table public.study_progress enable row level security;
alter table public.aliyah_log enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: admin update" on public.profiles;
create policy "profiles: admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['categories', 'sections', 'books', 'parshiyot', 'aliyot'] loop
    execute format('drop policy if exists "%1$s: read" on public.%1$I', t);
    execute format('create policy "%1$s: read" on public.%1$I for select to authenticated using (true)', t);
    execute format('drop policy if exists "%1$s: admin write" on public.%1$I', t);
    execute format('create policy "%1$s: admin write" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  foreach t in array array['study_progress', 'aliyah_log'] loop
    execute format('drop policy if exists "%1$s: own rows" on public.%1$I', t);
    execute format('create policy "%1$s: own rows" on public.%1$I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ---------- make yourself the admin ----------
-- 1. Sign in to the app once (this creates your profile row).
-- 2. Run this line with your own email:
-- update public.profiles set role = 'admin' where email = 'you@example.com';

-- ---------- live Google Sheet links ----------
-- Each user can create one secret link. Google Sheets pulls their data through it (see supabase/functions/sheet-export).
create table if not exists public.sheet_links (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);
alter table public.sheet_links enable row level security;
drop policy if exists "sheet_links: own row" on public.sheet_links;
create policy "sheet_links: own row" on public.sheet_links for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
