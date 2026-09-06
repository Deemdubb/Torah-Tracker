// i18n data + helpers for the Torah tracker.
// Three modes:
//   'he'    — Hebrew UI, Hebrew titles, RTL
//   'en-he' — English UI, Hebrew titles, LTR
//   'en'    — English UI, transliterated (Ashkenazi) titles, LTR
// Hebrew names are the canonical keys everywhere; TITLES maps them to
// Ashkenazi-style transliteration used only in full-English mode.

import { toGematria } from './hebrew';

export const LANG_MODES = ['he', 'en-he', 'en'];

export const STRINGS = {
  he: {
    brandMain: 'מעקב תורה',
    brandSub: 'Torah Progress Tracker',
    tabStudy: 'לימוד',
    tabAliyos: 'עליות',
    rootStudy: 'לימוד',
    rootAliyos: 'עליות',
    studySubtitle: 'בחר קטגוריה למעקב הלימוד שלך',
    notFound: 'לא נמצא',
    markAll: 'סמן הכל',
    unmarkAll: 'בטל הכל',
    comingSoon: 'תוכן יתווסף בקרוב',
    modalDate: 'תאריך',
    modalSynagogue: 'בית כנסת',
    modalSynagoguePlaceholder: 'מיקום / בית כנסת',
    modalNotes: 'הערות',
    modalNotesPlaceholder: 'הערות',
    modalDelete: 'מחק',
    modalSave: 'שמור',
  },
  en: {
    brandMain: 'Torah Progress Tracker',
    brandSub: 'מעקב תורה',
    tabStudy: 'Study',
    tabAliyos: 'Aliyos',
    rootStudy: 'Study',
    rootAliyos: 'Aliyos',
    studySubtitle: 'Choose a category to track your learning',
    notFound: 'Not found',
    markAll: 'Mark all',
    unmarkAll: 'Unmark all',
    comingSoon: 'Coming soon',
    modalDate: 'Date',
    modalSynagogue: 'Synagogue',
    modalSynagoguePlaceholder: 'Location / Synagogue',
    modalNotes: 'Notes',
    modalNotesPlaceholder: 'Notes',
    modalDelete: 'Delete',
    modalSave: 'Save',
  },
};

// Hebrew canonical name → Ashkenazi transliteration.
export const TITLES = {
  // Categories
  'תנ״ך': 'Tanach', 'משנה': 'Mishnah', 'גמרא': 'Gemara', 'רמב״ם': 'Rambam',
  'שולחן ערוך': 'Shulchan Aruch', 'ירושלמי': 'Yerushalmi',
  // Sections
  'תורה': 'Torah', 'נביאים': "Nevi'im", 'כתובים': 'Ketuvim',
  'זרעים': 'Zeraim', 'מועד': 'Moed', 'נשים': 'Nashim', 'נזיקין': 'Nezikin',
  'קדשים': 'Kodashim', 'טהרות': 'Teharos',
  // Chumash
  'בראשית': 'Bereishis', 'שמות': 'Shemos', 'ויקרא': 'Vayikra', 'במדבר': 'Bamidbar', 'דברים': 'Devarim',
  // Nevi'im
  'יהושע': 'Yehoshua', 'שופטים': 'Shoftim', 'שמואל א': 'Shmuel Alef', 'שמואל ב': 'Shmuel Beis',
  'מלכים א': 'Melachim Alef', 'מלכים ב': 'Melachim Beis', 'ישעיהו': 'Yeshayahu',
  'ירמיהו': 'Yirmiyahu', 'יחזקאל': 'Yechezkel', 'הושע': 'Hoshea', 'יואל': 'Yoel',
  'עמוס': 'Amos', 'עובדיה': 'Ovadiah', 'יונה': 'Yonah', 'מיכה': 'Michah',
  'נחום': 'Nachum', 'חבקוק': 'Chabakuk', 'צפניה': 'Tzefaniah', 'חגי': 'Chagai',
  'זכריה': 'Zecharya', 'מלאכי': 'Malachi',
  // Ketuvim
  'תהילים': 'Tehillim', 'משלי': 'Mishlei', 'איוב': 'Iyov', 'שיר השירים': 'Shir Hashirim',
  'רות': 'Rus', 'איכה': 'Eicha', 'קהלת': 'Koheles', 'אסתר': 'Esther', 'דניאל': 'Daniel',
  'עזרא': 'Ezra', 'נחמיה': 'Nechemia', 'דברי הימים א': 'Divrei Hayamim Alef',
  'דברי הימים ב': 'Divrei Hayamim Beis',
  // Mishnah / Gemara tractates
  'ברכות': 'Brachos', 'פאה': 'Peah', 'דמאי': 'Demai', 'כלאים': 'Kilayim', 'שביעית': 'Sheviis',
  'תרומות': 'Terumos', 'מעשרות': 'Maasros', 'מעשר שני': 'Maaser Sheni', 'חלה': 'Challah',
  'ערלה': 'Orlah', 'ביכורים': 'Bikurim', 'שבת': 'Shabbos', 'עירובין': 'Eiruvin',
  'פסחים': 'Pesachim', 'שקלים': 'Shekalim', 'יומא': 'Yoma', 'סוכה': 'Sukkah', 'ביצה': 'Beitzah',
  'ראש השנה': 'Rosh Hashanah', 'תענית': 'Taanis', 'מגילה': 'Megillah', 'מועד קטן': 'Moed Katan',
  'חגיגה': 'Chagigah', 'יבמות': 'Yevamos', 'כתובות': 'Kesubos', 'נדרים': 'Nedarim',
  'נזיר': 'Nazir', 'סוטה': 'Sotah', 'גיטין': 'Gittin', 'קידושין': 'Kiddushin',
  'בבא קמא': 'Bava Kamma', 'בבא מציעא': 'Bava Metzia', 'בבא בתרא': 'Bava Basra',
  'סנהדרין': 'Sanhedrin', 'מכות': 'Makkos', 'שבועות': 'Shevuos', 'עדויות': 'Eduyos',
  'עבודה זרה': 'Avodah Zarah', 'אבות': 'Avos', 'הוריות': 'Horayos', 'זבחים': 'Zevachim',
  'מנחות': 'Menachos', 'חולין': 'Chullin', 'בכורות': 'Bechoros', 'ערכין': 'Arachin',
  'תמורה': 'Temurah', 'כריתות': 'Krisos', 'מעילה': 'Meilah', 'תמיד': 'Tamid',
  'מדות': 'Midos', 'קינים': 'Kinim', 'כלים': 'Keilim', 'אהלות': 'Ohalos', 'נגעים': 'Negaim',
  'פרה': 'Parah', 'מקוואות': 'Mikvaos', 'נידה': 'Niddah',
  'מכשירין': 'Machshirin', 'זבים': 'Zavim', 'טבול יום': 'Tevul Yom', 'ידים': 'Yadayim',
  'עוקצים': 'Uktzin',
  // Parshiyot
  'נח': 'Noach', 'לך לך': 'Lech Lecha', 'וירא': 'Vayeira', 'חיי שרה': 'Chayei Sarah',
  'תולדות': 'Toldos', 'ויצא': 'Vayetzei', 'וישלח': 'Vayishlach', 'וישב': 'Vayeshev',
  'מקץ': 'Mikeitz', 'ויגש': 'Vayigash', 'ויחי': 'Vayechi', 'וארא': 'Vaera', 'בא': 'Bo',
  'בשלח': 'Beshalach', 'יתרו': 'Yisro', 'משפטים': 'Mishpatim', 'תרומה': 'Terumah',
  'תצוה': 'Tetzaveh', 'כי תשא': 'Ki Sisa', 'ויקהל': 'Vayakhel', 'פקודי': 'Pekudei',
  'צו': 'Tzav', 'שמיני': 'Shmini', 'תזריע': 'Tazria', 'מצורע': 'Metzora',
  'אחרי מות': 'Acharei Mos', 'קדושים': 'Kedoshim', 'אמור': 'Emor', 'בהר': 'Behar',
  'בחוקותי': 'Bechukosai', 'נשא': 'Naso', 'בהעלותך': 'Behaaloscha', 'שלח לך': 'Shelach',
  'קרח': 'Korach', 'חקת': 'Chukas', 'בלק': 'Balak', 'פינחס': 'Pinchas', 'מטות': 'Matos',
  'מסעי': 'Masei', 'ואתחנן': 'Vaeschanan', 'עקב': 'Eikev', 'ראה': 'Reeh',
  'כי תצא': 'Ki Seitzei', 'כי תבא': 'Ki Savo', 'נצבים': 'Nitzavim', 'וילך': 'Vayeilech',
  'האזינו': 'Haazinu', 'וזאת הברכה': 'Vzos Habrachah',
  // Aliyos
  'כהן': 'Kohen', 'לוי': 'Levi', 'שלישי': 'Shlishi', 'רביעי': "Revi'i", 'חמישי': 'Chamishi',
  'שישי': 'Shishi', 'שביעי': "Shvi'i", 'מפטיר': 'Maftir',
};

export function translateTitle(titleLang, hebrewName) {
  if (titleLang === 'en') return TITLES[hebrewName] || hebrewName;
  return hebrewName;
}

// Leaf label (פרק/דף) — follows TITLE language.
export function leafLabel(titleLang, leafType, idx) {
  if (titleLang === 'en') {
    return leafType === 'דף' ? `Page ${idx + 1}` : `Chapter ${idx}`;
  }
  return leafType === 'דף' ? `דף ${toGematria(idx + 1)}` : `פרק ${toGematria(idx)}`;
}

// Perek range subtitle — follows TITLE language.
export function rangeLabel(titleLang, s, e) {
  if (titleLang === 'en') return `Ch. ${s}${s !== e ? `–${e}` : ''}`;
  return `פרק ${toGematria(s)}${s !== e ? `–${toGematria(e)}` : ''}`;
}
