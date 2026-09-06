// Reads the CSV that Supabase (PostgREST) returns and turns it into plain objects.
// Why CSV and not JSON: some home content filters (GenTech / Livigent and similar) break long JSON
// answers made of many small identical objects, but let plain text through. CSV works everywhere.
//
// PostgREST CSV rules: booleans are t / f, an empty text value is "" (quoted), a null is an empty field
// (unquoted), timestamps look like 2026-09-06 12:46:30.655873+00, JSON columns are JSON text.

// Splits CSV text into rows of { value, quoted } cells. Handles quotes, doubled quotes, and line breaks inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false, inQuotes = false, i = 0;
  const src = String(text || '');
  const pushField = () => { row.push({ value: field, quoted }); field = ''; quoted = false; };
  const pushRow = () => { rows.push(row); row = []; };
  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i += 2; continue; } inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; quoted = true; i++; continue; }
    if (c === ',') { pushField(); i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { pushField(); pushRow(); i++; continue; }
    field += c; i++;
  }
  if (field !== '' || quoted || row.length) { pushField(); pushRow(); }
  return rows.filter((r) => !(r.length === 1 && r[0].value === '' && !r[0].quoted));
}

const BOOL = new Set(['has_sections', 'in_study', 'combined']);
const INT = new Set(['sort_order', 'item_count', 'first_item']);
const JSONB = new Set(['aliyah_ranges']);
const TIMESTAMP = new Set(['completed_at', 'created_at']);

// "2026-09-06 12:46:30.655873+00" -> "2026-09-06T12:46:30.655873+00:00" (a form every browser can parse)
export function pgTimestampToIso(s) {
  if (!s) return s;
  let v = String(s).replace(' ', 'T');
  // "...12:46:30+00" -> "...12:46:30+00:00"; a plain date like 2026-09-05 is left alone
  if (/T\d{2}:\d{2}(:\d{2}(\.\d+)?)?[+-]\d{2}$/.test(v)) v = `${v}:00`;
  return v;
}

export function coerceCell(column, cell) {
  if (cell == null) return null;
  const { value, quoted } = cell;
  if (value === '' && !quoted) return null; // SQL null
  if (BOOL.has(column)) return value === 't' || value === 'true';
  if (INT.has(column)) return value === '' ? null : Number(value);
  if (JSONB.has(column)) { try { return JSON.parse(value); } catch { return []; } }
  if (TIMESTAMP.has(column)) return pgTimestampToIso(value);
  return value;
}

// CSV text -> array of objects with typed values.
export function csvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map((c) => c.value);
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, coerceCell(h, r[i])])));
}
