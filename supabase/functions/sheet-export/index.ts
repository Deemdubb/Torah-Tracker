// Torah Tracker – "live Google Sheet" link.
//
// Google Sheets calls this address with a formula such as
//   =IMPORTDATA("https://<project>.supabase.co/functions/v1/sheet-export?token=...&lang=en-he&tz=America/New_York")
// and gets that user's data back as a spreadsheet (CSV). Google refreshes IMPORTDATA about once an hour.
//
// Address parameters:
//   token  the user's secret (made in the app under Settings)
//   type   all      (default) one row per thing that happened: what was learned or received, how many times, first and last time
//          study    one row per single completion
//          aliyos   one row per aliyah entry
//          parashah one row per parashah: what was learned and received in it
//          books    one row per sefer: totals and percent
//   lang   en-he (default) English headers with Hebrew names | he Hebrew headers and names | en English headers, transliterated names
//   tz     the user's time zone, e.g. America/New_York, so a late-night entry lands on the right day (default UTC)
//
// Dates are written as text, e.g. "2026-09-06 · כ״ד אלול תשפ״ו". Google would otherwise show a bare day number like 46271.
//
// Deploy from the Supabase dashboard (Edge Functions -> Deploy a new function -> "Via Editor"), name it sheet-export,
// paste this file, and turn OFF "Enforce JWT verification" (Google cannot send a login header).
// Or with the CLI:  npx supabase functions deploy sheet-export --no-verify-jwt
// When this file changes, paste the new version over the old one in the dashboard and deploy again.
//
// Safety: the token is a long random secret that only the owner knows. The user can make a new one at any time
// in Settings, which makes the old link stop working. Only reading is possible through this address.
import { createClient } from 'npm:@supabase/supabase-js@2';

// Supabase fills these in automatically. Newer projects call the admin key SUPABASE_SECRET_KEY, older ones SUPABASE_SERVICE_ROLE_KEY.
const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
const sb = createClient(Deno.env.get('SUPABASE_URL')!, adminKey);

type Row = Record<string, any>;
type Names = 'he' | 'en';

// ---------- words that appear in the sheet ----------
const WORDS = {
  he: {
    type: 'סוג', category: 'קטגוריה', section: 'חלק', sefer: 'ספר', parashah: 'פרשה', item: 'פריט', times: 'פעמים',
    first: 'פעם ראשונה', last: 'פעם אחרונה', details: 'פרטים', learned: 'לימוד', aliyah: 'עלייה', date: 'תאריך',
    synagogue: 'בית כנסת', notes: 'הערות', combined: 'פרשה כפולה', yes: 'כן', totalItems: 'סה״כ פריטים',
    learnedOnce: 'נלמדו לפחות פעם אחת', percent: 'אחוז', full: 'הושלם במלואו (פעמים)', completions: 'סה״כ השלמות',
    learnedCount: 'נלמדו', receivedCount: 'התקבלו', learnedPrefix: 'נלמד', receivedPrefix: 'התקבל',
  },
  en: {
    type: 'Type', category: 'Category', section: 'Section', sefer: 'Sefer', parashah: 'Parashah', item: 'Item', times: 'Times',
    first: 'First time', last: 'Last time', details: 'Details', learned: 'Learned', aliyah: 'Aliyah', date: 'Date',
    synagogue: 'Synagogue', notes: 'Notes', combined: 'Double parashah', yes: 'yes', totalItems: 'Total items',
    learnedOnce: 'Learned at least once', percent: 'Percent', full: 'Learned in full (times)', completions: 'Total completions',
    learnedCount: 'Learned', receivedCount: 'Received', learnedPrefix: 'learned', receivedPrefix: 'received',
  },
};

// ---------- Hebrew numbers and dates ----------
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
// 24 -> כד, 786 -> תשפו (plain letters, the way the app shows perek and daf numbers)
function gematria(num: unknown): string {
  const n = Number(num);
  if (!n || n <= 0) return '';
  const h = Math.floor(n / 100), rest = n % 100, t = Math.floor(rest / 10), o = rest % 10;
  const lower = t === 1 && o === 5 ? 'טו' : t === 1 && o === 6 ? 'טז' : TENS[t] + ONES[o];
  return (HUNDREDS[Math.min(h, 9)] || '') + lower;
}
// With the usual marks, for dates: כ״ד, תשפ״ו, ה׳
function gematriaMarked(num: unknown): string {
  const s = gematria(num);
  return s.length > 1 ? `${s.slice(0, -1)}״${s.slice(-1)}` : s ? `${s}׳` : '';
}
// Month names as Intl's Hebrew calendar spells them, in Hebrew and in the app's transliteration
const HE_MONTHS: Record<string, string> = { Tishri: 'תשרי', Heshvan: 'חשון', Kislev: 'כסלו', Tevet: 'טבת', Shevat: 'שבט', 'Adar I': 'אדר א׳', Adar: 'אדר', 'Adar II': 'אדר ב׳', Nisan: 'ניסן', Iyar: 'אייר', Sivan: 'סיון', Tamuz: 'תמוז', Av: 'אב', Elul: 'אלול' };
const EN_MONTHS: Record<string, string> = { Tishri: 'Tishrei', Heshvan: 'Cheshvan', Tevet: 'Teves', Nisan: 'Nissan', Tamuz: 'Tammuz' };

function safeTimeZone(tz: string): string {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch { return 'UTC'; }
}

// Makes a function that turns a date into text like "2026-09-06 · כ״ד אלול תשפ״ו" (or "2026-09-06 · 24 Elul 5786").
// Text on purpose: Google Sheets would otherwise show a bare day number such as 46271.
function makeDateText(names: Names, tz: string) {
  const parts = (f: Intl.DateTimeFormat, d: Date) => Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]));
  const cache = new Map<string, { civil: Intl.DateTimeFormat; hebrew: Intl.DateTimeFormat | null; weekday: Intl.DateTimeFormat }>();
  const formats = (zone: string) => {
    let f = cache.get(zone);
    if (!f) {
      const civil = new Intl.DateTimeFormat('en', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
      const weekday = new Intl.DateTimeFormat(names === 'he' ? 'he' : 'en', { timeZone: zone, weekday: 'short' });
      let hebrew: Intl.DateTimeFormat | null = null;
      try {
        const h = new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: zone, day: 'numeric', month: 'long', year: 'numeric' });
        if (h.resolvedOptions().calendar === 'hebrew') hebrew = h;
      } catch { hebrew = null; } // no Hebrew calendar on this server: show the weekday next to the civil date instead
      f = { civil, hebrew, weekday };
      cache.set(zone, f);
    }
    return f;
  };
  return (value: unknown): string => {
    if (!value) return '';
    const s = String(value);
    const plainDay = /^\d{4}-\d{2}-\d{2}$/.test(s); // an aliyah date is a calendar day: keep it as it is
    const d = plainDay ? new Date(`${s}T12:00:00Z`) : new Date(s);
    if (isNaN(d.getTime())) return s;
    const f = formats(plainDay ? 'UTC' : tz);
    const c = parts(f.civil, d);
    const civil = `${c.year}-${c.month}-${c.day}`;
    if (!f.hebrew) return `${civil} (${f.weekday.format(d)})`;
    const h = parts(f.hebrew, d);
    const hebrewDate = names === 'he'
      ? `${gematriaMarked(h.day)} ${HE_MONTHS[h.month] || h.month} ${gematriaMarked(Number(h.year) % 1000)}`
      : `${h.day} ${EN_MONTHS[h.month] || h.month} ${h.year}`;
    return `${civil} · ${hebrewDate}`;
  };
}

// ---------- helpers ----------
function csv(headers: string[], rows: unknown[][]): string {
  const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '\uFEFF' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}
const byKey = (rows: Row[]) => Object.fromEntries(rows.map((r) => [r.key, r]));
const bySort = (a: Row, b: Row) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
const compareKeys = (x: number[], y: number[]) => { for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
const when = (r: Row) => r.date || r.created_at || '';
const groupBy = (rows: Row[], keyOf: (r: Row) => string) => { const m = new Map<string, Row[]>(); for (const r of rows) { const k = keyOf(r); m.set(k, [...(m.get(k) || []), r]); } return m; };

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

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type' };
const respond = (body: string, status = 200, type = 'text/plain; charset=utf-8') =>
  new Response(body, { status, headers: { ...CORS, 'content-type': type, 'cache-control': 'no-store' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const type = url.searchParams.get('type') || 'all';
  const lang = url.searchParams.get('lang') || 'en-he';
  const names: Names = lang === 'en' ? 'en' : 'he';    // names of sefarim, parshiyos and aliyos
  const W = WORDS[lang === 'he' ? 'he' : 'en'];         // column headers and words such as "Learned"
  const dateText = makeDateText(names, safeTimeZone(url.searchParams.get('tz') || 'UTC'));
  if (!/^[a-f0-9]{32,128}$/.test(token)) return respond('Missing or invalid token', 400);

  const { data: link } = await sb.from('sheet_links').select('user_id').eq('token', token).maybeSingle();
  if (!link) return respond('This link is not valid any more. Make a new one in the app under Settings.', 404);

  const [cats, secs, books, pars, alis] = await Promise.all(['categories', 'sections', 'books', 'parshiyot', 'aliyot'].map((t) => all(t)));
  const cat = byKey(cats), sec = byKey(secs), book = byKey(books), par = byKey(pars), ali = byKey(alis);
  const aliyot = [...alis].sort(bySort);
  const study = aliyot.filter((a) => a.in_study !== false); // the aliyos that count as learning a parashah

  const nm = (r?: Row) => (r ? (names === 'he' ? r.name_he || r.name_en : r.name_en || r.name_he) || '' : '');
  const leaf = (leafType: string, n: unknown) => (names === 'he' ? `${leafType === 'daf' ? 'דף' : 'פרק'} ${gematria(n)}` : `${leafType === 'daf' ? 'Daf' : 'Perek'} ${n}`);
  // Where something sits in the Torah order: category, section, sefer, parashah, item. Used to sort the rows.
  const position = (bookKey: string, parKey: string, item: string) => {
    const b = book[bookKey] || {}, p = par[parKey] || {}, a = ali[item];
    return [(cat[b.category_key] || {}).sort_order ?? 0, (sec[b.section_key] || {}).sort_order ?? 0, b.sort_order ?? 0, p.sort_order ?? 0, a ? a.sort_order ?? 0 : Number(item) || 0];
  };
  // The perakim an aliyah covers, e.g. "פרק א–ב" / "Perek 1–2"
  const rangeText = (p: Row | undefined, aliyahKey: string) => {
    const r = (p?.aliyah_ranges || [])[study.findIndex((a) => a.key === aliyahKey)];
    if (!r || !r[0]) return '';
    const num = (n: unknown) => (names === 'he' ? gematria(n) : String(n));
    return `${leaf('perek', r[0])}${r[1] && r[1] !== r[0] ? `–${num(r[1])}` : ''}`;
  };
  const rows: { key: number[]; cells: unknown[] }[] = [];
  const emit = (key: number[], cells: unknown[]) => rows.push({ key, cells });
  let headers: string[] = [];

  if (type === 'aliyos') {
    const log = await all('aliyah_log', link.user_id);
    headers = [W.sefer, W.parashah, W.aliyah, W.date, W.synagogue, W.combined, W.notes];
    for (const r of log) emit([Date.parse(when(r)) || 0, ...position(r.book_key, r.parashah_key, r.aliyah_key)],
      [nm(book[r.book_key]), nm(par[r.parashah_key]), nm(ali[r.aliyah_key]) || r.aliyah_key, dateText(when(r)), r.synagogue || '', r.combined ? W.yes : '', r.notes || '']);
  } else if (type === 'study') {
    const progress = await all('study_progress', link.user_id);
    headers = [W.category, W.section, W.sefer, W.parashah, W.item, W.date];
    for (const r of progress) {
      const b = book[r.book_key] || {}, c = cat[b.category_key] || {}, a = ali[r.item];
      emit([...position(r.book_key, r.parashah_key || '', String(r.item)), Date.parse(r.completed_at) || 0],
        [nm(c), nm(sec[b.section_key]), nm(b), nm(par[r.parashah_key]), a ? nm(a) : leaf(c.leaf_type, r.item), dateText(r.completed_at)]);
    }
  } else if (type === 'books') {
    // one row per sefer: how much of it was learned, and how many times in full
    const progress = await all('study_progress', link.user_id);
    const counts = new Map<string, number>();
    for (const r of progress) { const k = `${r.book_key}|${r.parashah_key || ''}|${r.item}`; counts.set(k, (counts.get(k) || 0) + 1); }
    headers = [W.category, W.section, W.sefer, W.totalItems, W.learnedOnce, W.percent, W.full, W.completions];
    for (const b of books) {
      const keys: string[] = [];
      if (b.track_mode === 'parshiyot') { for (const p of pars.filter((p) => p.book_key === b.key)) for (const a of study) keys.push(`${b.key}|${p.key}|${a.key}`); }
      else { for (let n = Number(b.first_item) || 1; n <= (Number(b.item_count) || 0); n++) keys.push(`${b.key}||${n}`); }
      const cs = keys.map((k) => counts.get(k) || 0);
      const learned = cs.filter((x) => x > 0).length, full = cs.length ? Math.min(...cs) : 0, completions = cs.reduce((x, y) => x + y, 0);
      emit(position(b.key, '', ''), [nm(cat[b.category_key]), nm(sec[b.section_key]), nm(b), keys.length, learned, keys.length ? Math.round((learned / keys.length) * 100) : 0, full, completions]);
    }
  } else if (type === 'parashah') {
    // one row per parashah: how many times each aliyah was learned, and each aliyah received
    const [progress, log] = await Promise.all([all('study_progress', link.user_id), all('aliyah_log', link.user_id)]);
    const learned = new Map<string, number>();
    for (const r of progress) if (r.parashah_key) { const k = `${r.parashah_key}|${r.item}`; learned.set(k, (learned.get(k) || 0) + 1); }
    const received = groupBy(log, (r) => `${r.parashah_key}|${r.aliyah_key}`);
    headers = [W.sefer, W.parashah, W.learnedCount, ...study.map((a) => `${W.learnedPrefix}: ${nm(a)}`), W.receivedCount, ...aliyot.map((a) => `${W.receivedPrefix}: ${nm(a)}`)];
    for (const p of pars) {
      const l = study.map((a) => learned.get(`${p.key}|${a.key}`) || 0);
      const rec = aliyot.map((a) => (received.get(`${p.key}|${a.key}`) || []).sort((x, y) => when(x).localeCompare(when(y)))
        .map((r) => [dateText(when(r)), r.synagogue, r.combined ? W.combined : ''].filter(Boolean).join(' · ')).join('; '));
      emit(position(p.book_key, p.key, ''), [nm(book[p.book_key]), nm(p), l.filter(Boolean).length, ...l.map((n) => n || ''), rec.filter(Boolean).length, ...rec]);
    }
  } else {
    // "all": one row per thing that happened, with how many times and when. Learning first, then aliyos received.
    const [progress, log] = await Promise.all([all('study_progress', link.user_id), all('aliyah_log', link.user_id)]);
    headers = [W.type, W.category, W.section, W.sefer, W.parashah, W.item, W.times, W.first, W.last, W.details];
    for (const [k, list] of groupBy(progress, (r) => `${r.book_key}|${r.parashah_key || ''}|${r.item}`)) {
      const [bookKey, parKey, item] = k.split('|');
      const b = book[bookKey] || {}, c = cat[b.category_key] || {}, p = par[parKey], a = ali[item];
      const dates = list.map((r) => String(r.completed_at || '')).sort();
      emit([0, ...position(bookKey, parKey, item)],
        [W.learned, nm(c), nm(sec[b.section_key]), nm(b), nm(p), a ? nm(a) : leaf(c.leaf_type, item), list.length, dateText(dates[0]), dateText(dates[dates.length - 1]), a ? rangeText(p, item) : '']);
    }
    for (const [k, list] of groupBy(log, (r) => `${r.book_key}|${r.parashah_key}|${r.aliyah_key}`)) {
      const [bookKey, parKey, aliyahKey] = k.split('|');
      const b = book[bookKey] || {}, p = par[parKey], a = ali[aliyahKey];
      const sorted = list.sort((x, y) => when(x).localeCompare(when(y)));
      const detail = (r: Row, withDate: boolean) => [withDate ? dateText(when(r)) : '', r.synagogue, r.combined ? W.combined : '', r.notes].filter(Boolean).join(' · ');
      emit([1, ...position(bookKey, parKey, aliyahKey)],
        [W.aliyah, nm(cat[b.category_key]), nm(sec[b.section_key]), nm(b), nm(p), a ? nm(a) : aliyahKey, sorted.length, dateText(when(sorted[0])), dateText(when(sorted[sorted.length - 1])),
          sorted.length === 1 ? detail(sorted[0], false) : sorted.map((r) => detail(r, true)).join('; ')]);
    }
  }
  return respond(csv(headers, rows.sort((x, y) => compareKeys(x.key, y.key)).map((r) => r.cells)), 200, 'text/csv; charset=utf-8');
});
