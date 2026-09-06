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
    tabDashboard: 'סטטיסטיקה', dashboardTitle: 'סטטיסטיקה', dashboardSubtitle: 'מבט על הלימוד והעליות שלך',
    statLearnedTotal: 'פריטים שנלמדו', statLast7: '7 ימים אחרונים', statLast30: '30 ימים אחרונים', statThisYear: 'השנה', statStreak: 'ימים ברצף', days: 'ימים',
    progressByCategory: 'התקדמות לפי קטגוריה', recentActivity: 'פעילות אחרונה', noActivity: 'עדיין אין פעילות. סמן משהו בלשונית לימוד.',
    aliyosStats: 'עליות', statAliyosTotal: 'עליות שנרשמו', statParshiyotCovered: 'פרשות עם עליה', byHonor: 'לפי עליה', byYear: 'לפי שנה', bySynagogue: 'לפי בית כנסת', recentAliyos: 'עליות אחרונות', noDate: 'ללא תאריך',
    studySubtitle: 'בחר קטגוריה למעקב הלימוד שלך', aliyosSubtitle: 'בחר ספר לרישום העליות שלך',
    notFound: 'לא נמצא', notFoundText: 'הדף הזה לא קיים.', goHome: 'לדף הבית',
    markAll: 'סמן הכל', unmarkAll: 'בטל הכל', comingSoon: 'תוכן יתווסף בקרוב',
    learnAgain: 'למדתי שוב (+1 לכולם)', clearAll: 'נקה הכל', removeOne: 'הסר פעם אחת', timesFull: 'פעמים במלואו',
    confirmLearnAgain: 'להוסיף פעם אחת נוספת לכל הפריטים כאן?', confirmClearAll: 'למחוק את כל הסימונים כאן? פעולה זו לא ניתנת לביטול.',
    addAnother: 'הוסף עוד אחת', entries: 'רישומים', editEntry: 'עריכת רישום', newEntry: 'רישום חדש',
    combinedWith: 'השבוע היה מחובר עם', combinedHint: 'בשנים שבהן שתי הפרשות נקראות יחד', combinedTag: 'מחובר', canCombineWith: 'לעיתים מחוברת עם',
    pairLabel: 'מחוברת עם (פרשה כפולה)', pairNone: 'לא מחוברת', statCompletions: 'סה״כ השלמות', sheetTabBooks: 'סיכום ספרים',
    modalDate: 'תאריך', modalSynagogue: 'בית כנסת', modalSynagoguePlaceholder: 'מיקום / בית כנסת',
    modalNotes: 'הערות', modalNotesPlaceholder: 'הערות', modalDelete: 'מחק', modalSave: 'שמור',
    cancel: 'ביטול', close: 'סגור', save: 'שמור', saving: 'שומר…', loading: 'טוען…', back: 'חזרה',
    add: 'הוסף', edit: 'ערוך', delete: 'מחק', moveUp: 'העלה', moveDown: 'הורד', yes: 'כן', no: 'לא',
    error: 'משהו השתבש', retry: 'נסה שוב', done: 'בוצע',
    connectionCheck: 'בדיקת חיבור', connectionHint: 'אם משהו לא נטען, הרץ את הבדיקה ושלח את התוצאה.', runCheck: 'הרץ בדיקה', copyReport: 'העתק דוח', version: 'גרסה',
    areYouSure: 'האם אתה בטוח?', dbNeedsUpdate: 'מסד הנתונים עדיין עם החוקים הישנים. הרץ ב-Supabase (SQL Editor) את קובץ העדכון supabase/migrations/2026-09-06_repeats_and_connected_parshiyos.sql ואז טען מחדש.',
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
    offlineCached: 'אין חיבור לאינטרנט. מוצגים הנתונים השמורים במכשיר.', forgotPassword: 'שכחת סיסמה?', enterEmailFirst: 'הכנס את האימייל קודם', resetSent: 'שלחנו לך קישור במייל. אחרי הלחיצה עליו, הגדר סיסמה חדשה בהגדרות.',
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
    sheetCloudOnly: 'גיליון Google חי זמין רק במצב ענן.', copy: 'העתק', copied: 'הועתק',
    sheetYourLink: 'הקישור הסודי שלך', sheetTemplateBtn: 'פתח את תבנית הגיליון (יוצר עותק אצלך)', sheetTemplateHow: 'בעותק שנפתח, הדבק את הקישור שלך בתא הצהוב בלשונית Setup. כל הלשוניות יתמלאו לבד ויתעדכנו כל שעה.', sheetManual: 'הצג את הנוסחאות (הדבקה ידנית, אחת לכל לשונית)',
    password: 'סיסמה', signIn: 'כניסה', createAccount: 'צור חשבון', loginSubtitlePassword: 'הכנס אימייל וסיסמה',
    useMagicLink: 'שלח לי קישור כניסה במייל במקום', usePassword: 'כניסה עם סיסמה במקום',
    passwordTooShort: 'הסיסמה צריכה להיות באורך 6 תווים לפחות', checkEmailConfirm: 'החשבון נוצר. בדוק את האימייל כדי לאשר אותו, ואז היכנס.',
    setPassword: 'הגדר או שנה סיסמה', newPassword: 'סיסמה חדשה', confirmPassword: 'אימות סיסמה', passwordMismatch: 'הסיסמאות לא זהות',
    passwordSaved: 'הסיסמה נשמרה. מעכשיו אפשר להיכנס עם אימייל וסיסמה בכל מכשיר.', savePassword: 'שמור סיסמה',
    noAccountYet: 'חדש כאן? צור חשבון', haveAccount: 'יש לך כבר חשבון? היכנס', createAccountSubtitle: 'בחר אימייל וסיסמה',
    verifyWaiting: 'מחכים שתאשר את האימייל שלך. שלחנו קישור אל', verifyThenSignIn: 'אחרי שתלחץ על הקישור, היכנס כאן.', resend: 'שלח שוב', required: 'שדה חובה', notListsFile: 'הקובץ הזה אינו קובץ רשימות',
  },
  en: {
    brandMain: 'Torah Progress Tracker', brandSub: 'מעקב תורה',
    tabStudy: 'Study', tabAliyos: 'Aliyos', tabAdmin: 'Admin', settings: 'Settings',
    tabDashboard: 'Dashboard', dashboardTitle: 'Dashboard', dashboardSubtitle: 'A look at your learning and your aliyos',
    statLearnedTotal: 'Items learned', statLast7: 'Last 7 days', statLast30: 'Last 30 days', statThisYear: 'This year', statStreak: 'Day streak', days: 'days',
    progressByCategory: 'Progress by category', recentActivity: 'Recent activity', noActivity: 'Nothing yet. Tick something in the Study tab.',
    aliyosStats: 'Aliyos', statAliyosTotal: 'Aliyos logged', statParshiyotCovered: 'Parshiyos with an aliyah', byHonor: 'By honor', byYear: 'By year', bySynagogue: 'By synagogue', recentAliyos: 'Recent aliyos', noDate: 'no date',
    studySubtitle: 'Choose a category to track your learning', aliyosSubtitle: 'Choose a sefer to log your aliyos',
    notFound: 'Not found', notFoundText: 'This page does not exist.', goHome: 'Go home',
    markAll: 'Mark all', unmarkAll: 'Unmark all', comingSoon: 'Coming soon',
    learnAgain: 'Learned again (+1 all)', clearAll: 'Clear all', removeOne: 'Remove one', timesFull: 'times in full',
    confirmLearnAgain: 'Add one more time to every item here?', confirmClearAll: 'Remove all marks here? This cannot be undone.',
    addAnother: 'Add another', entries: 'entries', editEntry: 'Edit entry', newEntry: 'New entry',
    combinedWith: 'This week was combined with', combinedHint: 'In years when the two parshiyos are read together', combinedTag: 'combined', canCombineWith: 'Sometimes combined with',
    pairLabel: 'Connected with (double parashah)', pairNone: 'Not connected', statCompletions: 'Total completions', sheetTabBooks: 'Sefarim summary',
    modalDate: 'Date', modalSynagogue: 'Synagogue', modalSynagoguePlaceholder: 'Location / Synagogue',
    modalNotes: 'Notes', modalNotesPlaceholder: 'Notes', modalDelete: 'Delete', modalSave: 'Save',
    cancel: 'Cancel', close: 'Close', save: 'Save', saving: 'Saving…', loading: 'Loading…', back: 'Back',
    add: 'Add', edit: 'Edit', delete: 'Delete', moveUp: 'Move up', moveDown: 'Move down', yes: 'Yes', no: 'No',
    error: 'Something went wrong', retry: 'Try again', done: 'Done',
    connectionCheck: 'Connection check', connectionHint: 'If something does not load, run this and send the result.', runCheck: 'Run check', copyReport: 'Copy report', version: 'Version',
    areYouSure: 'Are you sure?', dbNeedsUpdate: 'Your database still has the old rules. In Supabase (SQL Editor) run the update file supabase/migrations/2026-09-06_repeats_and_connected_parshiyos.sql, then reload.',
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
    offlineCached: 'No internet. Showing the data saved on this device.', forgotPassword: 'Forgot password?', enterEmailFirst: 'Enter your email first', resetSent: 'We emailed you a link. After you click it, set a new password in Settings.',
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
    sheetCloudOnly: 'The live Google Sheet is available in cloud mode only.', copy: 'Copy', copied: 'Copied',
    sheetYourLink: 'Your secret link', sheetTemplateBtn: 'Open the sheet template (makes your own copy)', sheetTemplateHow: 'In the copy that opens, paste your link into the yellow cell on the Setup tab. Every tab fills itself and refreshes about every hour.', sheetManual: 'Show the formulas (paste one per tab by hand)',
    password: 'Password', signIn: 'Sign in', createAccount: 'Create account', loginSubtitlePassword: 'Enter your email and password',
    useMagicLink: 'Email me a sign-in link instead', usePassword: 'Sign in with a password instead',
    passwordTooShort: 'The password needs at least 6 characters', checkEmailConfirm: 'Account created. Check your email to confirm it, then sign in.',
    setPassword: 'Set or change password', newPassword: 'New password', confirmPassword: 'Confirm password', passwordMismatch: 'The passwords do not match',
    passwordSaved: 'Password saved. From now on you can sign in with email and password on any device.', savePassword: 'Save password',
    noAccountYet: 'New here? Create an account', haveAccount: 'Already have an account? Sign in', createAccountSubtitle: 'Choose an email and a password',
    verifyWaiting: 'Waiting for you to verify your email. We sent a link to', verifyThenSignIn: 'After you click it, sign in here.', resend: 'Resend', required: 'Required', notListsFile: 'This is not a lists file',
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
