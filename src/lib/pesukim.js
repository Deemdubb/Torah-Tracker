// Pasuk-level ranges for aliyos. No React here, so it is easy to test.
//
// A range is [fromPerek, fromPasuk, toPerek, toPasuk], all 1-based numbers.
// book.pesukim          = [31, 25, 24, ...]  how many pesukim each perek has (Chumash sefarim only)
// parashah.aliyah_pesukim = { kohen: [1, 1, 2, 3], levi: [2, 4, 2, 19], ..., maftir: [6, 5, 6, 8] }
// An aliyah entry may carry its own range (from_perek, from_pasuk, to_perek, to_pasuk): a hosafah, or an
// aliyah that was split that week. Without one, the usual range of the honor applies.
import { toGematria } from './hebrew.js';
import { titleLang } from './i18n.js';

export const isRange = (r) => Array.isArray(r) && r.length === 4 && r.every((n) => Number.isInteger(n) && n > 0);
const customOf = (entry) => [entry?.from_perek, entry?.from_pasuk, entry?.to_perek, entry?.to_pasuk].map((n) => (n == null || n === '' ? NaN : Number(n)));

export function presetRange(parashah, aliyahKey) {
  const r = parashah?.aliyah_pesukim?.[aliyahKey];
  return isRange(r) ? r.map(Number) : null;
}
export const hasCustomRange = (entry) => isRange(customOf(entry));
// The range an entry stands for: its own if it has one, otherwise the usual range of the honor.
export function entryRange(entry, parashah) {
  const c = customOf(entry);
  return isRange(c) ? c : presetRange(parashah, entry?.aliyah_key);
}
// From the start of the first study aliyah to the end of the last one.
export function parashahRange(parashah, studyAliyot) {
  const ranges = (studyAliyot || []).map((a) => presetRange(parashah, a.key)).filter(Boolean);
  if (!ranges.length) return null;
  return [ranges[0][0], ranges[0][1], ranges[ranges.length - 1][2], ranges[ranges.length - 1][3]];
}

export const hasPesukim = (book) => Array.isArray(book?.pesukim) && book.pesukim.length > 0;
// 1-based position of a pasuk inside its sefer, or null when that perek or pasuk does not exist.
export function pasukOrdinal(book, perek, pasuk) {
  if (!hasPesukim(book)) return null;
  const lens = book.pesukim;
  if (!Number.isInteger(perek) || !Number.isInteger(pasuk) || perek < 1 || perek > lens.length || pasuk < 1 || pasuk > Number(lens[perek - 1])) return null;
  let n = 0;
  for (let i = 0; i < perek - 1; i++) n += Number(lens[i]) || 0;
  return n + pasuk;
}
// Why a range cannot be used: 'incomplete' (numbers missing), 'outside' (no such perek or pasuk), 'order' (end before start), or null when it is fine.
export function rangeProblem(book, range) {
  if (!isRange(range)) return 'incomplete';
  const a = pasukOrdinal(book, range[0], range[1]), b = pasukOrdinal(book, range[2], range[3]);
  if (a == null || b == null) return 'outside';
  if (b < a) return 'order';
  return null;
}
// How many pesukim a range covers, or null when it cannot be counted (no perek lengths, or a bad range).
export function countPesukim(book, range) {
  if (rangeProblem(book, range)) return null;
  return pasukOrdinal(book, range[2], range[3]) - pasukOrdinal(book, range[0], range[1]) + 1;
}
// "א:א–ב:ג" in Hebrew modes, "1:1–2:3" in English.
export function rangeText(mode, range) {
  if (!isRange(range)) return '';
  const num = (n) => (titleLang(mode) === 'en' ? String(n) : toGematria(n));
  const [fp, fv, tp, tv] = range;
  return `${num(fp)}:${num(fv)}–${num(tp)}:${num(tv)}`;
}
// Total pesukim of the Torah according to the lists (5,846 with the standard perek lengths).
export const torahTotal = (idx) => idx.torahBooks().reduce((s, b) => s + (hasPesukim(b) ? b.pesukim.reduce((x, y) => x + (Number(y) || 0), 0) : 0), 0);

// Across all aliyah entries: pesukim in total (every entry counted) and how many different pesukim of the Torah were covered.
export function pesukimStats(entries, idx) {
  let total = 0, counted = 0;
  const seen = new Set();
  for (const e of entries || []) {
    const book = idx.book[e.book_key], par = idx.par[e.parashah_key];
    const range = entryRange(e, par);
    const n = range ? countPesukim(book, range) : null;
    if (n == null) continue;
    total += n; counted++;
    const from = pasukOrdinal(book, range[0], range[1]);
    for (let i = 0; i < n; i++) seen.add(`${e.book_key}|${from + i}`);
  }
  return { total, counted, distinct: seen.size, torahTotal: torahTotal(idx) };
}
