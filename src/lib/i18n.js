// UI text in Hebrew and English. Torah names are NOT here; they live in the database
// (name_he / name_en on every category, section, book, parashah and aliyah).
//
// Three modes:
//   'he'    Hebrew UI + Hebrew names, right-to-left
//   'en-he' English UI + Hebrew names, left-to-right   (the main mode)
//   'en'    English UI + transliterated names, left-to-right
import { toGematria } from './hebrew.js';

export const LANG_MODES = [
  { mode: 'he', label: 'עב', title: 'עברית' },
  { mode: 'en-he', label: 'EN·עב', title: 'English · Hebrew names' },
  { mode: 'en', label: 'EN', title: 'English' },
];

export const STRINGS = {
  he: {
    brandMain: 'מעקב תורה', brandSub: 'Torah Progress Tracker',
    tabStudy: 'לימוד', tabAliyos: 'עליות', tabAdmin: 'ניהול', settings: 'הגדרות',
    studySubtitle: 'בחר קטגוריה למעקב הלימוד שלך', aliyosSubtitle: 'בחר ספר לרישום העליות שלך',
    notFound: 'לא נמצא', notFoundText: 'הדף הזה לא קיים.', goHome: 'לדף הבית',
    markAll: 'סמן הכל', unmarkAll: 'בטל הכל', comingSoon: 'תוכן יתווסף בקרוב',
    modalDate: 'תאריך', modalSynagogue: 'בית כנסת', modalSynagoguePlaceholder: 'מיקום / בית כנסת',
    modalNotes: 'הערות', modalNotesPlaceholder: 'הערות', modalDelete: 'מחק', modalSave: 'שמור',
    cancel: 'ביטול', close: 'סגור', save: 'שמור', saving: 'שומר…', loading: 'טוען…', back: 'חזרה',
    add: 'הוסף', edit: 'ערוך', delete: 'מחק', moveUp: 'העלה', moveDown: 'הורד', yes: 'כן', no: 'לא',
    error: 'משהו השתבש', retry: 'נסה שוב', done: 'בוצע',
    // login
    welcome: 'ברוך הבא', loginSubtitle: 'הכנס את האימייל שלך ונשלח לך קישור כניסה',
    email: 'אימייל', sendLink: 'שלח קישור כניסה', linkSent: 'הקישור נשלח. בדוק את האימייל שלך.',
    continueWithGoogle: 'המשך עם Google', signOut: 'התנתק', signedInAs: 'מחובר כ',
    // settings
    language: 'שפה', langLegend: 'עב = עברית · EN·עב = אנגלית עם שמות בעברית · EN = אנגלית',
    account: 'חשבון', dataMode: 'שמירת נתונים',
    modeLocal: 'מקומי – הנתונים נשמרים בדפדפן הזה בלבד', modeCloud: 'ענן – הנתונים נשמרים בחשבון שלך',
    localWarning: 'גבה את הנתונים שלך מדי פעם. ניקוי הדפדפן ימחק אותם.',
    exportTitle: 'ייצוא לגיליון', exportStudy: 'הורד התקדמות לימוד (CSV)', exportAliyos: 'הורד יומן עליות (CSV)',
    backupTitle: 'גיבוי ושחזור', backupAll: 'הורד גיבוי מלא (JSON)', restore: 'שחזר מגיבוי',
    restoreDone: 'הגיבוי נטען', installTitle: 'הוספה למסך הבית',
    installText: 'באייפון: פתח בספארי, לחץ על כפתור השיתוף ובחר "הוסף למסך הבית".',
    pendingSync: 'שינויים מחכים לסנכרון', offline: 'לא מחובר לאינטרנט',
    // admin
    adminTitle: 'ניהול', adminSubtitle: 'ערוך את רשימות התורה. השינויים נראים לכל המשתמשים.',
    categories: 'קטגוריות', sections: 'חלקים', books: 'ספרים', parshiyot: 'פרשות', aliyot: 'עליות',
    aliyahNames: 'שמות העליות', dataTools: 'כלי נתונים',
    addCategory: 'הוסף קטגוריה', addSection: 'הוסף חלק', addBook: 'הוסף ספר', addParashah: 'הוסף פרשה', addAliyah: 'הוסף עליה',
    editCategory: 'ערוך קטגוריה', editSection: 'ערוך חלק', editBook: 'ערוך ספר', editParashah: 'ערוך פרשה', editAliyah: 'ערוך עליה',
    nameHe: 'שם בעברית', nameEn: 'שם באנגלית', key: 'מזהה', keyHint: 'נוצר אוטומטית מהשם באנגלית. לא ניתן לשנות.',
    sortOrder: 'סדר', leafType: 'סוג פריט', perek: 'פרק', daf: 'דף', hasSections: 'מחולק לחלקים (למשל תורה / נביאים / כתובים)',
    itemCount: 'מספר אחרון', firstItem: 'מספר ראשון', itemCountHint: 'פרקים: 1 עד המספר. דפים: 2 עד המספר.',
    trackMode: 'שיטת מעקב', modeItems: 'לפי פרק / דף', modeParshiyot: 'לפי פרשה ועליות',
    section: 'חלק', noSection: 'ללא חלק', aliyahRanges: 'טווח פרקים לכל עליה', from: 'מ', to: 'עד',
    inStudy: 'נכלל במעקב הלימוד (לא רק בעליות)',
    resetDefaults: 'אפס לרשימות המקוריות', resetConfirm: 'זה ימחק את כל השינויים ברשימות ויחזיר את הרשימות המקוריות. ההתקדמות שלך לא תימחק. להמשיך?',
    deleteConfirm: 'למחוק? פעולה זו לא ניתנת לביטול.', exportLists: 'הורד רשימות (JSON)', importLists: 'טען רשימות מקובץ',
    noItems: 'אין פריטים עדיין', emptyLists: 'הרשימות ריקות. טען את הרשימות המקוריות כדי להתחיל.', loadDefaults: 'טען רשימות מקוריות',
    total: 'סה״כ', items: 'פריטים',
    sheetTitle: 'גיליון Google חי', sheetIntro: 'צור קישור סודי, הדבק נוסחה קצרה בגיליון Google חדש, והגיליון יתעדכן מעצמו בערך כל שעה.',
    sheetCreate: 'צור את הקישור שלי', sheetRegenerate: 'צור קישור חדש', sheetRegenerateConfirm: 'הקישור הישן יפסיק לעבוד. גיליונות שמשתמשים בו יצטרכו את הנוסחה החדשה. להמשיך?',
    sheetHow: 'פתח גיליון Google חדש, לחץ על התא הראשון (A1) בכל לשונית, והדבק את הנוסחה. כל נוסחה מקבלת לשונית משלה.',
    sheetTabStudy: 'התקדמות לימוד', sheetTabAliyos: 'יומן עליות', sheetTabParashah: 'לפי פרשה',
    sheetWarning: 'כל מי שיש לו את הקישור יכול לראות את הנתונים. אם שיתפת אותו בטעות, צור קישור חדש.',
    sheetCloudOnly: 'גיליון Google חי זמין רק במצב ענן.', copy: 'העתק', copied: 'הועתק', required: 'שדה חובה', notListsFile: 'הקובץ הזה אינו קובץ רשימות',
  },
  en: {
    brandMain: 'Torah Progress Tracker', brandSub: 'מעקב תורה',
    tabStudy: 'Study', tabAliyos: 'Aliyos', tabAdmin: 'Admin', settings: 'Settings',
    studySubtitle: 'Choose a category to track your learning', aliyosSubtitle: 'Choose a sefer to log your aliyos',
    notFound: 'Not found', notFoundText: 'This page does not exist.', goHome: 'Go home',
    markAll: 'Mark all', unmarkAll: 'Unmark all', comingSoon: 'Coming soon',
    modalDate: 'Date', modalSynagogue: 'Synagogue', modalSynagoguePlaceholder: 'Location / Synagogue',
    modalNotes: 'Notes', modalNotesPlaceholder: 'Notes', modalDelete: 'Delete', modalSave: 'Save',
    cancel: 'Cancel', close: 'Close', save: 'Save', saving: 'Saving…', loading: 'Loading…', back: 'Back',
    add: 'Add', edit: 'Edit', delete: 'Delete', moveUp: 'Move up', moveDown: 'Move down', yes: 'Yes', no: 'No',
    error: 'Something went wrong', retry: 'Try again', done: 'Done',
    welcome: 'Welcome', loginSubtitle: 'Enter your email and we will send you a sign-in link',
    email: 'Email', sendLink: 'Send sign-in link', linkSent: 'Link sent. Check your email.',
    continueWithGoogle: 'Continue with Google', signOut: 'Sign out', signedInAs: 'Signed in as',
    language: 'Language', langLegend: 'עב = Hebrew · EN·עב = English with Hebrew names · EN = English',
    account: 'Account', dataMode: 'Data storage',
    modeLocal: 'Local – data is saved in this browser only', modeCloud: 'Cloud – data is saved in your account',
    localWarning: 'Back up your data now and then. Clearing the browser deletes it.',
    exportTitle: 'Export to spreadsheet', exportStudy: 'Download study progress (CSV)', exportAliyos: 'Download aliyos log (CSV)',
    backupTitle: 'Backup and restore', backupAll: 'Download full backup (JSON)', restore: 'Restore from backup',
    restoreDone: 'Backup loaded', installTitle: 'Add to Home Screen',
    installText: 'On iPhone: open in Safari, tap the Share button, then "Add to Home Screen".',
    pendingSync: 'changes waiting to sync', offline: 'You are offline',
    adminTitle: 'Admin', adminSubtitle: 'Edit the Torah lists. Changes are visible to all users.',
    categories: 'Categories', sections: 'Sections', books: 'Sefarim', parshiyot: 'Parshiyos', aliyot: 'Aliyos',
    aliyahNames: 'Aliyah names', dataTools: 'Data tools',
    addCategory: 'Add category', addSection: 'Add section', addBook: 'Add sefer', addParashah: 'Add parashah', addAliyah: 'Add aliyah',
    editCategory: 'Edit category', editSection: 'Edit section', editBook: 'Edit sefer', editParashah: 'Edit parashah', editAliyah: 'Edit aliyah',
    nameHe: 'Hebrew name', nameEn: 'English name', key: 'ID', keyHint: 'Made automatically from the English name. Cannot be changed.',
    sortOrder: 'Order', leafType: 'Item type', perek: 'Perek (chapter)', daf: 'Daf (page)', hasSections: 'Has sections (e.g. Torah / Neviim / Kesuvim)',
    itemCount: 'Last number', firstItem: 'First number', itemCountHint: 'Chapters: 1 to the number. Pages: 2 to the number.',
    trackMode: 'Tracking', modeItems: 'By perek / daf', modeParshiyot: 'By parashah and aliyos',
    section: 'Section', noSection: 'No section', aliyahRanges: 'Perek range for each aliyah', from: 'From', to: 'To',
    inStudy: 'Included in Study tracking (not only in Aliyos)',
    resetDefaults: 'Reset to original lists', resetConfirm: 'This removes all your list changes and restores the original lists. Your progress is not deleted. Continue?',
    deleteConfirm: 'Delete this? This cannot be undone.', exportLists: 'Download lists (JSON)', importLists: 'Load lists from file',
    noItems: 'Nothing here yet', emptyLists: 'The lists are empty. Load the original lists to get started.', loadDefaults: 'Load original lists',
    total: 'Total', items: 'items',
    sheetTitle: 'Live Google Sheet', sheetIntro: 'Create a secret link, paste one short formula into a new Google Sheet, and the sheet refreshes itself about every hour.',
    sheetCreate: 'Create my link', sheetRegenerate: 'Make a new link', sheetRegenerateConfirm: 'The old link will stop working. Sheets that use it will need the new formula. Continue?',
    sheetHow: 'Open a new Google Sheet, click the first cell (A1) of a tab, and paste the formula. Each formula gets its own tab.',
    sheetTabStudy: 'Study progress', sheetTabAliyos: 'Aliyos log', sheetTabParashah: 'By parashah',
    sheetWarning: 'Anyone who has the link can see the data. If you shared it by mistake, make a new link.',
    sheetCloudOnly: 'The live Google Sheet is available in cloud mode only.', copy: 'Copy', copied: 'Copied', required: 'Required', notListsFile: 'This is not a lists file',
  },
};

export function uiLang(mode) { return mode === 'he' ? 'he' : 'en'; }
export function titleLang(mode) { return mode === 'en' ? 'en' : 'he'; }
export function dirOf(mode) { return mode === 'he' ? 'rtl' : 'ltr'; }

export function t(mode, key) {
  const ui = uiLang(mode);
  return STRINGS[ui][key] ?? STRINGS.en[key] ?? key;
}

// Display name of any list row ({name_he, name_en}) for the current mode.
export function displayName(mode, row) {
  if (!row) return '';
  return titleLang(mode) === 'he' ? (row.name_he || row.name_en || '') : (row.name_en || row.name_he || '');
}

// "פרק א" / "דף ב" / "Perek 1" / "Daf 2"
export function leafLabel(mode, leafType, n) {
  const num = Number(n);
  if (titleLang(mode) === 'en') return `${leafType === 'daf' ? 'Daf' : 'Perek'} ${num}`;
  return `${leafType === 'daf' ? 'דף' : 'פרק'} ${toGematria(num)}`;
}

// "פרק א–ג" / "Perek 1–3"
export function rangeLabel(mode, s, e) {
  if (s == null || e == null) return '';
  if (titleLang(mode) === 'en') return `Perek ${s}${s !== e ? `–${e}` : ''}`;
  return `פרק ${toGematria(s)}${s !== e ? `–${toGematria(e)}` : ''}`;
}
