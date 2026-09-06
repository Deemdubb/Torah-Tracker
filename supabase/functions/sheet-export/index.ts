// Torah Tracker – "live Google Sheet" link.
// Google Sheets calls this address with =IMPORTDATA("https://<project>.supabase.co/functions/v1/sheet-export?token=...&type=study")
// and gets that user's data back as a spreadsheet (CSV). Google refreshes IMPORTDATA about once an hour.
//
// Deploy from the Supabase dashboard (Edge Functions -> Deploy a new function -> "Via Editor"), name it sheet-export,
// paste this file, and turn OFF "Enforce JWT verification" (Google cannot send a login header).
// Or with the CLI:  npx supabase functions deploy sheet-export --no-verify-jwt
//
// Safety: the token is a long random secret that only the owner knows. The user can make a new one at any time
// in Settings, which makes the old link stop working. Only reading is possible through this address.
import { createClient } from 'npm:@supabase/supabase-js@2';

// Supabase fills these in automatically. Newer projects call the admin key SUPABASE_SECRET_KEY, older ones SUPABASE_SERVICE_ROLE_KEY.
const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
const sb = createClient(Deno.env.get('SUPABASE_URL')!, adminKey);

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
function gematria(num: unknown): string {
  const n0 = Number(num);
  if (!n0 || n0 <= 0) return '';
  const h = Math.floor(n0 / 100), rest = n0 % 100, t = Math.floor(rest / 10), o = rest % 10;
  const lower = t === 1 && o === 5 ? 'טו' : t === 1 && o === 6 ? 'טז' : TENS[t] + ONES[o];
  return (HUNDREDS[Math.min(h, 9)] || '') + lower;
}
const leafHe = (leafType: string, n: string) => `${leafType === 'daf' ? 'דף' : 'פרק'} ${gematria(n)}`;
const leafEn = (leafType: string, n: string) => `${leafType === 'daf' ? 'Daf' : 'Perek'} ${n}`;

function csv(headers: string[], rows: unknown[][]): string {
  const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '﻿' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}

type Row = Record<string, any>;
const byKey = (rows: Row[]) => Object.fromEntries(rows.map((r) => [r.key, r]));
const bySort = (a: Row, b: Row) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

async function all(table: string, userId?: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select('*').range(from, from + 999);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const type = url.searchParams.get('type') || 'study';
  if (!/^[a-f0-9]{32,128}$/.test(token)) return new Response('Missing or invalid token', { status: 400 });

  const { data: link } = await sb.from('sheet_links').select('user_id').eq('token', token).maybeSingle();
  if (!link) return new Response('This link is not valid any more. Make a new one in the app under Settings.', { status: 404 });

  const [cats, secs, books, pars, alis] = await Promise.all(['categories', 'sections', 'books', 'parshiyot', 'aliyot'].map((t) => all(t)));
  const cat = byKey(cats), sec = byKey(secs), book = byKey(books), par = byKey(pars), ali = byKey(alis);
  const aliyot = [...alis].sort(bySort);

  let body = '';
  if (type === 'aliyos') {
    const log = await all('aliyah_log', link.user_id);
    const rows = log.map((r) => { const b = book[r.book_key] || {}, p = par[r.parashah_key] || {}, a = ali[r.aliyah_key] || {};
      return [b.name_he || '', b.name_en || '', p.name_he || '', p.name_en || '', a.name_he || '', a.name_en || '', r.date || '', r.synagogue || '', r.notes || '']; })
      .sort((x, y) => String(x[6]).localeCompare(String(y[6])));
    body = csv(['sefer_he', 'sefer_en', 'parashah_he', 'parashah_en', 'aliyah_he', 'aliyah_en', 'date', 'synagogue', 'notes'], rows);
  } else if (type === 'parashah') {
    const [progress, log] = await Promise.all([all('study_progress', link.user_id), all('aliyah_log', link.user_id)]);
    const learned = new Set(progress.map((r) => `${r.parashah_key}|${r.item}`));
    const received: Record<string, Row> = Object.fromEntries(log.map((r) => [`${r.parashah_key}|${r.aliyah_key}`, r]));
    const study = aliyot.filter((a) => a.in_study !== false);
    const parList = [...pars].sort((a, b) => ((book[a.book_key] || {}).sort_order ?? 0) - ((book[b.book_key] || {}).sort_order ?? 0) || bySort(a, b));
    const headers = ['sefer_he', 'sefer_en', 'parashah_he', 'parashah_en', 'learned_count', ...study.map((a) => `learned: ${a.name_en}`), 'received_count', ...aliyot.map((a) => `received: ${a.name_en}`)];
    const rows = parList.map((p) => { const b = book[p.book_key] || {};
      const l = study.map((a) => (learned.has(`${p.key}|${a.key}`) ? '✓' : ''));
      const rec = aliyot.map((a) => { const r = received[`${p.key}|${a.key}`]; return r ? (r.date || '✓') + (r.synagogue ? ` · ${r.synagogue}` : '') : ''; });
      return [b.name_he || '', b.name_en || '', p.name_he, p.name_en, l.filter(Boolean).length, ...l, rec.filter(Boolean).length, ...rec]; });
    body = csv(headers, rows);
  } else {
    const progress = await all('study_progress', link.user_id);
    const rows = progress.map((r) => { const b = book[r.book_key] || {}, c = cat[b.category_key] || {}, s = sec[b.section_key] || {}, p = par[r.parashah_key] || {}, a = ali[r.item];
      return [c.name_he || '', c.name_en || '', s.name_he || '', s.name_en || '', b.name_he || '', b.name_en || '', p.name_he || '', p.name_en || '',
        a ? a.name_he : leafHe(c.leaf_type, r.item), a ? a.name_en : leafEn(c.leaf_type, r.item), r.item, String(r.completed_at || '').slice(0, 10)]; })
      .sort((x, y) => `${x[5]}|${x[7]}`.localeCompare(`${y[5]}|${y[7]}`) || (Number(x[10]) || 0) - (Number(y[10]) || 0));
    body = csv(['category_he', 'category_en', 'section_he', 'section_en', 'book_he', 'book_en', 'parashah_he', 'parashah_en', 'item_he', 'item_en', 'item', 'completed_at'], rows);
  }
  return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'no-store' } });
});
