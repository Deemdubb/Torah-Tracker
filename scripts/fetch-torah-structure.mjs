// Downloads the structure of the Torah once and saves it as src/data/torahStructure.json:
//   - how many pesukim each perek has (Sefaria, https://www.sefaria.org/api/shape/<book>)
//   - where each of the seven aliyos of every parashah starts and ends (Sefaria index, alt structure "Parasha")
//   - the maftir of every parashah (Hebcal leyning API, https://www.hebcal.com/leyning)
// Run: node scripts/fetch-torah-structure.mjs      (needs internet; the result is committed, so this is rarely needed)
// Then: node scripts/gen-reference-data.mjs && node scripts/gen-seed-sql.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
const get = async (url) => { const r = await fetch(url, { headers: { 'user-agent': 'torah-tracker-data/1.0 (github.com/Deemdubb/Torah-Tracker)' } }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); };
// "Genesis 2:4-2:19" or "Genesis 2:4-19" -> [2, 4, 2, 19]
function parseRef(ref) {
  const m = String(ref).match(/(\d+):(\d+)[-–](?:(\d+):)?(\d+)$/); // Sefaria uses "-" and sometimes "–"
  if (!m) throw new Error(`cannot read ref ${ref}`);
  const fp = Number(m[1]), fv = Number(m[2]), tp = m[3] ? Number(m[3]) : fp, tv = Number(m[4]);
  return [fp, fv, tp, tv];
}
const parseHebcal = (a) => { const [fp, fv] = a.b.split(':').map(Number), [tp, tv] = a.e.split(':').map(Number); return [fp, fv, tp, tv]; };
const ordinal = (chapters, perek, pasuk) => chapters.slice(0, perek - 1).reduce((s, n) => s + n, 0) + pasuk;
const count = (chapters, [fp, fv, tp, tv]) => ordinal(chapters, tp, tv) - ordinal(chapters, fp, fv) + 1;

const books = [];
for (const b of BOOKS) {
  const shape = (await get(`https://www.sefaria.org/api/shape/${b}`))[0];
  const index = await get(`https://www.sefaria.org/api/v2/index/${b}`);
  const nodes = index.alts.Parasha.nodes;
  books.push({ title: b, chapters: shape.chapters, parshiyot: nodes.map((n) => ({ title: n.title, aliyot: n.refs.map(parseRef), maftir: null })) });
}
// Hebcal: several years, Israel and diaspora, in half-year pieces (the API caps the range), so every parashah is found read on its own.
const items = [];
for (let y = 2018; y <= 2040; y++) for (const half of [['01-01', '06-30'], ['07-01', '12-31']]) for (const i of ['on', 'off']) {
  const j = await get(`https://www.hebcal.com/leyning?cfg=json&start=${y}-${half[0]}&end=${y}-${half[1]}&i=${i}&triennial=off`);
  items.push(...(j.items || []));
}
const COMBINED = new Set(['Vayakhel-Pekudei', 'Tazria-Metzora', 'Achrei Mot-Kedoshim', 'Behar-Bechukotai', 'Chukat-Balak', 'Matot-Masei', 'Nitzavim-Vayeilech']);
const all = books.flatMap((b) => b.parshiyot.map((p) => ({ book: b, p })));
if (all.length !== 54) throw new Error(`expected 54 parshiyot, got ${all.length}`);
const problems = [], notes = [];
for (const it of items) {
  if (!it.fullkriyah || !it.parshaNum || COMBINED.has(it.name.en) || it.reason?.M) continue; // combined week, or a special maftir that week
  const { book, p } = all[it.parshaNum - 1];
  if (p.maftir) continue;
  const k = it.fullkriyah;
  if (k['1']?.k !== book.title) { problems.push(`${it.name.en}: hebcal book ${k['1']?.k}`); continue; }
  for (let n = 1; n <= 7; n++) {
    const h = parseHebcal(k[String(n)]);
    if (h.join() !== p.aliyot[n - 1].join()) { notes.push(`${p.title} aliyah ${n}: Sefaria ${p.aliyot[n - 1].join(':')} vs Hebcal ${h.join(':')} (Hebcal used)`); p.aliyot[n - 1] = h; }
    if (count(book.chapters, h) !== k[String(n)].v) notes.push(`${p.title} aliyah ${n}: ${count(book.chapters, h)} pesukim by Sefaria's perek lengths, Hebcal counts ${k[String(n)].v} (editions differ on a split pasuk)`);
  }
  if (!k.M || k.M.k !== book.title) { problems.push(`${p.title}: no regular maftir`); continue; }
  p.maftir = parseHebcal(k.M);
  p.hebcalName = it.name.en;
}
// V'Zot HaBerachah is read on Simchas Torah, where the maftir comes from a different sefer, so it has no usual maftir range here.
const missing = all.filter((x) => !x.p.maftir && x.p.title !== "V'Zot HaBerachah").map((x) => x.p.title);
if (missing.length) problems.push(`no maftir found for: ${missing.join(', ')}`);
if (notes.length) console.log(notes.join('\n'));
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
const out = { source: 'Sefaria (perek lengths, aliyos) and Hebcal (maftir), fetched ' + new Date().toISOString().slice(0, 10), books };
writeFileSync(`${root}src/data/torahStructure.json`, JSON.stringify(out));
for (const b of books) console.log(b.title, 'perakim', b.chapters.length, 'pesukim', b.chapters.reduce((a, c) => a + c, 0), 'parshiyot', b.parshiyot.length, 'e.g.', b.parshiyot[0].title, JSON.stringify(b.parshiyot[0].aliyot[0]), 'maftir', JSON.stringify(b.parshiyot[0].maftir));
console.log('wrote src/data/torahStructure.json');
