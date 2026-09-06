// Builds src/data/referenceData.json from the original Base44 files in base44-export/.
// Run: node scripts/gen-reference-data.mjs
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'base44-export/src/lib');
const tmp = mkdtempSync(join(tmpdir(), 'tt-'));
for (const f of ['studyData.js', 'chumashAliyotData.js', 'aliyosData.js', 'hebrew.js', 'i18n.js']) {
  let code = readFileSync(join(src, f), 'utf8');
  code = code.replace(/from '\.\/(\w+)'/g, "from './$1.js'");
  writeFileSync(join(tmp, f), code);
}
const { STUDY_CATEGORIES } = await import(pathToFileURL(join(tmp, 'studyData.js')).href);
const { CHUMASH_PARSHIYOT } = await import(pathToFileURL(join(tmp, 'chumashAliyotData.js')).href);
const { ALIYOT, ALIYAH_NAMES } = await import(pathToFileURL(join(tmp, 'aliyosData.js')).href);
const { TITLES } = await import(pathToFileURL(join(tmp, 'i18n.js')).href);

const slug = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const en = (he) => TITLES[he] || he;

// The seven pairs that are read together in some years (Israel and the diaspora can differ).
const PAIRS = [['ויקהל', 'פקודי'], ['תזריע', 'מצורע'], ['אחרי מות', 'קדושים'], ['בהר', 'בחוקותי'], ['חקת', 'בלק'], ['מטות', 'מסעי'], ['נצבים', 'וילך']];
const pairOf = (he) => { for (const [a, b] of PAIRS) { if (he === a) return b; if (he === b) return a; } return ''; };

const categories = [], sections = [], books = [], parshiyot = [], aliyot = [];
STUDY_CATEGORIES.forEach((cat, ci) => {
  const catKey = slug(en(cat.id));
  categories.push({
    key: catKey, name_he: cat.name, name_en: en(cat.id),
    leaf_type: cat.leafType === 'דף' ? 'daf' : 'perek',
    has_sections: !!cat.sections, sort_order: ci + 1,
  });
  const addBook = (b, bi, secKey) => {
    const isChumash = !!CHUMASH_PARSHIYOT[b.name] && secKey === 'torah';
    books.push({
      key: `${catKey}-${slug(en(b.name))}`, category_key: catKey, section_key: secKey || '',
      name_he: b.name, name_en: en(b.name), item_count: b.count,
      first_item: cat.leafType === 'דף' ? 2 : 1,
      track_mode: isChumash ? 'parshiyot' : 'items', sort_order: bi + 1,
    });
    if (isChumash) {
      const bookKey = `${catKey}-${slug(en(b.name))}`;
      Object.entries(CHUMASH_PARSHIYOT[b.name]).forEach(([p, ranges], pi) => {
        parshiyot.push({ key: slug(en(p)), book_key: bookKey, name_he: p, name_en: en(p), sort_order: pi + 1, aliyah_ranges: ranges, pair_key: pairOf(p) ? slug(en(pairOf(p))) : '' });
      });
    }
  };
  if (cat.sections) {
    cat.sections.forEach((sec, si) => {
      const secKey = slug(en(sec.id));
      sections.push({ key: secKey, category_key: catKey, name_he: sec.name, name_en: en(sec.id), sort_order: si + 1 });
      sec.books.forEach((b, bi) => addBook(b, bi, secKey));
    });
  } else if (cat.books) {
    cat.books.forEach((b, bi) => addBook(b, bi, ''));
  }
});
ALIYAH_NAMES.forEach((a, i) => aliyot.push({ key: slug(en(a)), name_he: a, name_en: en(a), sort_order: i + 1, in_study: a !== 'מפטיר' }));

// sanity: aliyos module parshiyot list must match study parshiyot
const fromAliyos = ALIYOT.flatMap(s => s.parshiyot);
const fromStudy = parshiyot.map(p => p.name_he);
const missing = fromAliyos.filter(p => !fromStudy.includes(p));
if (missing.length) throw new Error('Parshiyot mismatch: ' + missing.join(', '));

const out = { generated_from: 'base44-export (2026-09-05)', categories, sections, books, parshiyot, aliyot };
writeFileSync(join(root, 'src/data/referenceData.json'), JSON.stringify(out, null, 2));
console.log({ categories: categories.length, sections: sections.length, books: books.length, parshiyot: parshiyot.length, aliyot: aliyot.length });
console.log('keys sample:', books.slice(0, 3).map(b => b.key), parshiyot.slice(0, 3).map(p => p.key), aliyot.map(a => a.key));
const dup = (arr) => arr.filter((k, i) => arr.indexOf(k) !== i);
console.log('pairs:', parshiyot.filter(p => p.pair_key).map(p => `${p.key}->${p.pair_key}`));
console.log('duplicate keys:', dup(books.map(b => b.key)), dup(parshiyot.map(p => p.key)), dup(sections.map(s => s.key)));
