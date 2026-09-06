-- Update for projects created before 2026-09-06. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- 1. Items can be learned more than once (one row per completion), so the "one row per item" rule goes away.
-- 2. An aliyah can be received more than once, so the "one entry per honor" rule goes away.
-- 3. Aliyah entries can be marked as a combined (double parashah) week.
-- 4. Parshiyos know their partner for the seven double parshiyos.

do $$
declare c record;
begin
  for c in
    select conname, conrelid::regclass as tbl
    from pg_constraint
    where contype = 'u' and conrelid in ('public.study_progress'::regclass, 'public.aliyah_log'::regclass)
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

create index if not exists study_progress_item_idx on public.study_progress (user_id, book_key, parashah_key, item);

alter table public.aliyah_log add column if not exists combined boolean not null default false;
alter table public.parshiyot add column if not exists pair_key text not null default '';

update public.parshiyot set pair_key = 'pekudei'      where key = 'vayakhel';
update public.parshiyot set pair_key = 'vayakhel'     where key = 'pekudei';
update public.parshiyot set pair_key = 'metzora'      where key = 'tazria';
update public.parshiyot set pair_key = 'tazria'       where key = 'metzora';
update public.parshiyot set pair_key = 'kedoshim'     where key = 'acharei-mos';
update public.parshiyot set pair_key = 'acharei-mos'  where key = 'kedoshim';
update public.parshiyot set pair_key = 'bechukosai'   where key = 'behar';
update public.parshiyot set pair_key = 'behar'        where key = 'bechukosai';
update public.parshiyot set pair_key = 'balak'        where key = 'chukas';
update public.parshiyot set pair_key = 'chukas'       where key = 'balak';
update public.parshiyot set pair_key = 'masei'        where key = 'matos';
update public.parshiyot set pair_key = 'matos'        where key = 'masei';
update public.parshiyot set pair_key = 'vayeilech'    where key = 'nitzavim';
update public.parshiyot set pair_key = 'nitzavim'     where key = 'vayeilech';
