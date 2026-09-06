/**
 * Torah Tracker -> Google Sheets sync (Google Apps Script).
 *
 * What it does: copies your progress and aliyos log from Supabase into this spreadsheet,
 * with readable Hebrew and English names. Runs on a timer (every hour) once you set it up.
 *
 * Setup (one time, about 5 minutes):
 *  1. Open a new Google Sheet -> Extensions -> Apps Script. Delete the sample code, paste this file.
 *  2. In Supabase: Project Settings -> API. Copy the "Project URL" and the "service_role" secret key.
 *     The service_role key can read everything, so it must live ONLY here, never in the app.
 *  3. In Apps Script: Project Settings (gear icon) -> Script properties -> add two properties:
 *        SUPABASE_URL          = https://xxxx.supabase.co
 *        SUPABASE_SERVICE_KEY  = eyJ...   (the service_role key)
 *     Optional: USER_EMAIL = you@example.com   (only sync one user's rows; default = all users)
 *  4. Choose the function "syncAll" at the top and press Run. Approve the permissions.
 *  5. Run "setupHourlyTrigger" once. From then on the sheet refreshes itself every hour.
 */

const props = PropertiesService.getScriptProperties();
const SUPABASE_URL = props.getProperty('SUPABASE_URL');
const SERVICE_KEY = props.getProperty('SUPABASE_SERVICE_KEY');
const USER_EMAIL = props.getProperty('USER_EMAIL') || '';
const TAB_PER_PARASHAH = (props.getProperty('TAB_PER_PARASHAH') || 'false') === 'true';

// Supabase returns at most 1000 rows per request, so read the table in pages until it is all in.
const PAGE = 1000;
const LIST_TABLES = ['categories', 'sections', 'books', 'parshiyot', 'aliyot'];
function fetchTable(table, query) {
  const orderBy = LIST_TABLES.indexOf(table) >= 0 ? 'key' : 'id';
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = SUPABASE_URL + '/rest/v1/' + table + '?select=*&order=' + orderBy + '&limit=' + PAGE + '&offset=' + offset + (query ? '&' + query : '');
    const res = UrlFetchApp.fetch(url, { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY }, muteHttpExceptions: true });
    if (res.getResponseCode() >= 300) throw new Error(table + ': ' + res.getContentText());
    const rows = JSON.parse(res.getContentText());
    for (let i = 0; i < rows.length; i++) out.push(rows[i]);
    if (rows.length < PAGE) return out;
  }
}
const byKey = (rows) => Object.fromEntries(rows.map((r) => [r.key, r]));
const HEB = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'], TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'], HUN = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
function gematria(n) { n = Number(n); if (!n) return ''; const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10; const low = t === 1 && o === 5 ? 'טו' : t === 1 && o === 6 ? 'טז' : TENS[t] + HEB[o]; return (HUN[h] || '') + low; }

function writeSheet(name, header, rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  const data = [header].concat(rows.length ? rows : [[]]);
  sh.getRange(1, 1, data.length, header.length).setValues(data.map((r) => header.map((_, i) => (r[i] == null ? '' : r[i]))));
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
}

function syncAll() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Script properties first.');
  const cats = byKey(fetchTable('categories')), secs = byKey(fetchTable('sections')), books = byKey(fetchTable('books'));
  const pars = byKey(fetchTable('parshiyot')), alis = byKey(fetchTable('aliyot'));
  const profiles = fetchTable('profiles');
  const emailOf = Object.fromEntries(profiles.map((p) => [p.id, p.email]));
  let userFilter = '';
  if (USER_EMAIL) { const p = profiles.find((x) => (x.email || '').toLowerCase() === USER_EMAIL.toLowerCase()); if (!p) throw new Error('No user with email ' + USER_EMAIL); userFilter = 'user_id=eq.' + p.id; }

  const progress = fetchTable('study_progress', userFilter);
  const studyRows = progress.map((r) => {
    const b = books[r.book_key] || {}, c = cats[b.category_key] || {}, s = secs[b.section_key] || {}, p = pars[r.parashah_key] || {}, a = alis[r.item];
    const itemHe = a ? a.name_he : (c.leaf_type === 'daf' ? 'דף ' : 'פרק ') + gematria(r.item);
    const itemEn = a ? a.name_en : (c.leaf_type === 'daf' ? 'Daf ' : 'Perek ') + r.item;
    return [emailOf[r.user_id] || '', c.name_he || '', c.name_en || '', s.name_he || '', s.name_en || '', b.name_he || '', b.name_en || '', p.name_he || '', p.name_en || '', itemHe, itemEn, r.completed_at ? r.completed_at.slice(0, 10) : ''];
  }).sort((x, y) => x.join('|').localeCompare(y.join('|')));
  writeSheet('Study Progress', ['user', 'category_he', 'category_en', 'section_he', 'section_en', 'book_he', 'book_en', 'parashah_he', 'parashah_en', 'item_he', 'item_en', 'completed_at'], studyRows);

  const log = fetchTable('aliyah_log', userFilter);
  const logRows = log.map((r) => { const b = books[r.book_key] || {}, p = pars[r.parashah_key] || {}, a = alis[r.aliyah_key] || {}; return [emailOf[r.user_id] || '', b.name_he || '', b.name_en || '', p.name_he || '', p.name_en || '', a.name_he || '', a.name_en || '', r.date || '', r.synagogue || '', r.notes || '']; })
    .sort((x, y) => String(x[7]).localeCompare(String(y[7])));
  writeSheet('Aliyos Log', ['user', 'sefer_he', 'sefer_en', 'parashah_he', 'parashah_en', 'aliyah_he', 'aliyah_en', 'date', 'synagogue', 'notes'], logRows);

  // One row per parashah: which aliyos were learned (Study) and which were received (Aliyos).
  const aliList = Object.values(alis).sort((a, b) => a.sort_order - b.sort_order);
  const parList = Object.values(pars).sort((a, b) => (books[a.book_key] || {}).sort_order - (books[b.book_key] || {}).sort_order || a.sort_order - b.sort_order);
  const learned = new Set(progress.map((r) => r.parashah_key + '|' + r.item));
  const received = Object.fromEntries(log.map((r) => [r.parashah_key + '|' + r.aliyah_key, r]));
  const header = ['sefer_he', 'sefer_en', 'parashah_he', 'parashah_en'].concat(aliList.map((a) => 'learned: ' + a.name_en)).concat(aliList.map((a) => 'received: ' + a.name_en));
  const parRows = parList.map((p) => { const b = books[p.book_key] || {}; return [b.name_he || '', b.name_en || '', p.name_he, p.name_en].concat(aliList.map((a) => (learned.has(p.key + '|' + a.key) ? '✓' : ''))).concat(aliList.map((a) => { const r = received[p.key + '|' + a.key]; return r ? (r.date || '✓') + (r.synagogue ? ' · ' + r.synagogue : '') : ''; })); });
  writeSheet('By Parashah', header, parRows);

  if (TAB_PER_PARASHAH) {
    parList.forEach((p) => {
      const rows = aliList.map((a) => { const r = received[p.key + '|' + a.key]; return [a.name_he, a.name_en, learned.has(p.key + '|' + a.key) ? '✓' : '', r ? r.date || '✓' : '', r ? r.synagogue || '' : '', r ? r.notes || '' : '']; });
      writeSheet(p.name_he, ['aliyah_he', 'aliyah_en', 'learned', 'received_date', 'synagogue', 'notes'], rows);
    });
  }
}

function setupHourlyTrigger() {
  ScriptApp.getProjectTriggers().forEach((t) => { if (t.getHandlerFunction() === 'syncAll') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncAll').timeBased().everyHours(1).create();
}
