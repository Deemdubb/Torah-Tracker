// Static structural hierarchy for the לימוד (Study) tracker.
// Each category may contain `sections` (which contain `books`) or `books` directly.
// Books carry a `count` = number of leaf items (פרקים or דפים).

import { CHUMASH_PARSHIYOT, CHUMASH_ALIYAH_NAMES } from './chumashAliyotData';

export const STUDY_CATEGORIES = [
  {
    id: 'תנ״ך',
    name: 'תנ״ך',
    sections: [
      { id: 'תורה', name: 'תורה', books: [
        { name: 'בראשית', count: 50 }, { name: 'שמות', count: 40 }, { name: 'ויקרא', count: 27 },
        { name: 'במדבר', count: 36 }, { name: 'דברים', count: 34 },
      ]},
      { id: 'נביאים', name: 'נביאים', books: [
        { name: 'יהושע', count: 24 }, { name: 'שופטים', count: 21 }, { name: 'שמואל א', count: 31 },
        { name: 'שמואל ב', count: 24 }, { name: 'מלכים א', count: 22 }, { name: 'מלכים ב', count: 25 },
        { name: 'ישעיהו', count: 66 }, { name: 'ירמיהו', count: 52 }, { name: 'יחזקאל', count: 48 },
        { name: 'הושע', count: 14 }, { name: 'יואל', count: 4 }, { name: 'עמוס', count: 9 },
        { name: 'עובדיה', count: 1 }, { name: 'יונה', count: 4 }, { name: 'מיכה', count: 7 },
        { name: 'נחום', count: 3 }, { name: 'חבקוק', count: 3 }, { name: 'צפניה', count: 3 },
        { name: 'חגי', count: 2 }, { name: 'זכריה', count: 14 }, { name: 'מלאכי', count: 3 },
      ]},
      { id: 'כתובים', name: 'כתובים', books: [
        { name: 'תהילים', count: 150 }, { name: 'משלי', count: 31 }, { name: 'איוב', count: 42 },
        { name: 'שיר השירים', count: 8 }, { name: 'רות', count: 4 }, { name: 'איכה', count: 5 },
        { name: 'קהלת', count: 12 }, { name: 'אסתר', count: 10 }, { name: 'דניאל', count: 12 },
        { name: 'עזרא', count: 10 }, { name: 'נחמיה', count: 13 }, { name: 'דברי הימים א', count: 29 },
        { name: 'דברי הימים ב', count: 36 },
      ]},
    ],
  },
  {
    id: 'משנה', name: 'משנה',
    sections: [
      { id: 'זרעים', name: 'זרעים', books: [
        { name: 'ברכות', count: 9 }, { name: 'פאה', count: 8 }, { name: 'דמאי', count: 7 },
        { name: 'כלאים', count: 9 }, { name: 'שביעית', count: 10 }, { name: 'תרומות', count: 11 },
        { name: 'מעשרות', count: 5 }, { name: 'מעשר שני', count: 5 }, { name: 'חלה', count: 4 },
        { name: 'ערלה', count: 3 }, { name: 'ביכורים', count: 3 },
      ]},
      { id: 'מועד', name: 'מועד', books: [
        { name: 'שבת', count: 24 }, { name: 'עירובין', count: 10 }, { name: 'פסחים', count: 10 },
        { name: 'שקלים', count: 8 }, { name: 'יומא', count: 8 }, { name: 'סוכה', count: 5 },
        { name: 'ביצה', count: 5 }, { name: 'ראש השנה', count: 4 }, { name: 'תענית', count: 4 },
        { name: 'מגילה', count: 4 }, { name: 'מועד קטן', count: 3 }, { name: 'חגיגה', count: 3 },
      ]},
      { id: 'נשים', name: 'נשים', books: [
        { name: 'יבמות', count: 16 }, { name: 'כתובות', count: 13 }, { name: 'נדרים', count: 11 },
        { name: 'נזיר', count: 9 }, { name: 'סוטה', count: 9 }, { name: 'גיטין', count: 9 },
        { name: 'קידושין', count: 4 },
      ]},
      { id: 'נזיקין', name: 'נזיקין', books: [
        { name: 'בבא קמא', count: 10 }, { name: 'בבא מציעא', count: 10 }, { name: 'בבא בתרא', count: 10 },
        { name: 'סנהדרין', count: 11 }, { name: 'מכות', count: 3 }, { name: 'שבועות', count: 8 },
        { name: 'עדויות', count: 8 }, { name: 'עבודה זרה', count: 5 }, { name: 'אבות', count: 6 },
        { name: 'הוריות', count: 3 },
      ]},
      { id: 'קדשים', name: 'קדשים', books: [
        { name: 'זבחים', count: 14 }, { name: 'מנחות', count: 13 }, { name: 'חולין', count: 12 },
        { name: 'בכורות', count: 9 }, { name: 'ערכין', count: 9 }, { name: 'תמורה', count: 7 },
        { name: 'כריתות', count: 6 }, { name: 'מעילה', count: 6 }, { name: 'תמיד', count: 7 },
        { name: 'מדות', count: 5 }, { name: 'קינים', count: 3 },
      ]},
      { id: 'טהרות', name: 'טהרות', books: [
        { name: 'כלים', count: 30 }, { name: 'אהלות', count: 18 }, { name: 'נגעים', count: 14 },
        { name: 'פרה', count: 12 }, { name: 'טהרות', count: 10 }, { name: 'מקוואות', count: 10 },
        { name: 'נידה', count: 10 }, { name: 'מכשירין', count: 6 }, { name: 'זבים', count: 5 },
        { name: 'טבול יום', count: 4 }, { name: 'ידים', count: 4 }, { name: 'עוקצים', count: 3 },
      ]},
    ],
  },
  {
    id: 'גמרא', name: 'גמרא', leafType: 'דף',
    books: [
      { name: 'ברכות', count: 64 }, { name: 'שבת', count: 157 }, { name: 'עירובין', count: 105 },
      { name: 'פסחים', count: 121 }, { name: 'שקלים', count: 22 }, { name: 'יומא', count: 88 },
      { name: 'סוכה', count: 56 }, { name: 'ביצה', count: 40 }, { name: 'ראש השנה', count: 35 },
      { name: 'תענית', count: 31 }, { name: 'מגילה', count: 32 }, { name: 'מועד קטן', count: 29 },
      { name: 'חגיגה', count: 27 }, { name: 'יבמות', count: 122 }, { name: 'כתובות', count: 112 },
      { name: 'נדרים', count: 91 }, { name: 'נזיר', count: 66 }, { name: 'סוטה', count: 49 },
      { name: 'גיטין', count: 90 }, { name: 'קידושין', count: 82 }, { name: 'בבא קמא', count: 119 },
      { name: 'בבא מציעא', count: 119 }, { name: 'בבא בתרא', count: 176 }, { name: 'סנהדרין', count: 113 },
      { name: 'מכות', count: 24 }, { name: 'שבועות', count: 49 }, { name: 'עבודה זרה', count: 76 },
      { name: 'הוריות', count: 14 }, { name: 'זבחים', count: 120 }, { name: 'מנחות', count: 110 },
      { name: 'חולין', count: 142 }, { name: 'בכורות', count: 61 }, { name: 'ערכין', count: 34 },
      { name: 'תמורה', count: 34 }, { name: 'כריתות', count: 28 }, { name: 'מעילה', count: 22 },
      { name: 'נידה', count: 73 },
    ],
  },
  { id: 'רמב״ם', name: 'רמב״ם', placeholder: true },
  { id: 'שולחן ערוך', name: 'שולחן ערוך', placeholder: true },
  { id: 'ירושלמי', name: 'ירושלמי', placeholder: true },
];

const catPath = (cat) => `/study/${encodeURIComponent(cat.id)}`;
const sectionPath = (cat, sec) => `${catPath(cat)}/${encodeURIComponent(sec.id)}`;
const bookPathInSection = (cat, sec, b) => `${sectionPath(cat, sec)}/${encodeURIComponent(b.name)}`;
const bookPathFlat = (cat, b) => `${catPath(cat)}/${encodeURIComponent(b.name)}`;

// Totals for a single book. Chumash books track progress per-Parshah (7 Aliyot each);
// every other book tracks per-leaf (count of פרקים / דפים).
function bookTotals(cat, sec, book, pm) {
  const parshiyot = CHUMASH_PARSHIYOT[book.name];
  if (parshiyot) {
    const base = `${cat.id}|${sec.id}|${book.name}`;
    let completed = 0;
    Object.keys(parshiyot).forEach(p => { completed += pm[`${base}|${p}`]?.size || 0; });
    return { total: Object.keys(parshiyot).length * 7, completed };
  }
  return { total: book.count, completed: pm[`${cat.id}|${sec.id}|${book.name}`]?.size || 0 };
}

function categoryTotals(cat, pm) {
  let total = 0, completed = 0;
  if (cat.sections) {
    cat.sections.forEach(sec => sec.books.forEach(b => {
      const t = bookTotals(cat, sec, b, pm);
      total += t.total; completed += t.completed;
    }));
  } else if (cat.books) {
    cat.books.forEach(b => { total += b.count; completed += pm[`${cat.id}|${b.name}`]?.size || 0; });
  }
  return { total, completed };
}

function sectionTotals(cat, sec, pm) {
  let total = 0, completed = 0;
  sec.books.forEach(b => { const t = bookTotals(cat, sec, b, pm); total += t.total; completed += t.completed; });
  return { total, completed };
}

export function resolveStudyPath(parts, pm) {
  if (parts.length === 0) {
    return {
      type: 'categories', title: 'לימוד', breadcrumbs: [],
      items: STUDY_CATEGORIES.map(cat => ({ name: cat.name, path: catPath(cat), ...categoryTotals(cat, pm) })),
    };
  }
  const cat = STUDY_CATEGORIES.find(c => c.id === parts[0]);
  if (!cat) return null;
  if (cat.placeholder) return { type: 'placeholder', title: cat.name, breadcrumbs: [] };

  if (parts.length === 1) {
    if (cat.sections) {
      return {
        type: 'sections', title: cat.name, breadcrumbs: [],
        items: cat.sections.map(sec => ({ name: sec.name, path: sectionPath(cat, sec), ...sectionTotals(cat, sec, pm) })),
      };
    }
    if (cat.books) {
      return {
        type: 'books', title: cat.name, breadcrumbs: [],
        items: cat.books.map(b => ({ name: b.name, path: bookPathFlat(cat, b), total: b.count, completed: pm[`${cat.id}|${b.name}`]?.size || 0 })),
      };
    }
  }

  if (cat.sections) {
    const sec = cat.sections.find(s => s.id === parts[1]);
    if (!sec) return null;
    if (parts.length === 2) {
      return {
        type: 'books', title: sec.name, breadcrumbs: [{ name: cat.name, path: catPath(cat) }],
        items: sec.books.map(b => { const t = bookTotals(cat, sec, b, pm); return { name: b.name, path: bookPathInSection(cat, sec, b), total: t.total, completed: t.completed }; }),
      };
    }
    const book = sec.books.find(b => b.name === parts[2]);
    if (!book) return null;
    const baseCrumbs = [{ name: cat.name, path: catPath(cat) }, { name: sec.name, path: sectionPath(cat, sec) }];
    const parshiyot = CHUMASH_PARSHIYOT[book.name];
    if (parshiyot) {
      const bookKeyBase = `${cat.id}|${sec.id}|${book.name}`;
      if (parts.length === 3) {
        return {
          type: 'parshiyot', title: book.name, sefer: book.name, breadcrumbs: baseCrumbs,
          items: Object.keys(parshiyot).map(p => ({
            name: p, path: `${bookPathInSection(cat, sec, book)}/${encodeURIComponent(p)}`,
            total: 7, completed: pm[`${bookKeyBase}|${p}`]?.size || 0,
          })),
        };
      }
      const parashah = parts[3];
      const ranges = parshiyot[parashah];
      if (!ranges) return null;
      return {
        type: 'chumash_aliyot', title: parashah, sefer: book.name, parashah,
        aliyot: CHUMASH_ALIYAH_NAMES, ranges,
        bookKey: `${bookKeyBase}|${parashah}`,
        breadcrumbs: [...baseCrumbs, { name: book.name, path: bookPathInSection(cat, sec, book) }],
      };
    }
    return {
      type: 'leaves', title: book.name, leafType: 'פרק', count: book.count,
      bookKey: `${cat.id}|${sec.id}|${book.name}`,
      breadcrumbs: baseCrumbs,
    };
  } else {
    const book = cat.books.find(b => b.name === parts[1]);
    if (!book) return null;
    return {
      type: 'leaves', title: book.name, leafType: cat.leafType || 'דף', count: book.count,
      bookKey: `${cat.id}|${book.name}`,
      breadcrumbs: [{ name: cat.name, path: catPath(cat) }],
    };
  }
}
