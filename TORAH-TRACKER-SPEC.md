# מבט תורה – Torah Progress Tracker: Complete Specification

> **Status (2026-09-06):** the app has been rebuilt in this folder. See `README.md` for how to run, set up Supabase, publish, and export. The Torah lists are now editable from the Admin screen instead of being typed into the code. The Gemara off-by-one from section 8 is fixed (pages run from דף ב to the last daf).

Everything learned from the Base44 app, written down so the app can be rebuilt without Base44.
Captured 2026-09-05 directly from the Base44 editor (code files, database tables, data rows, and the full chat history).

Raw material is saved next to this file:

| What | Where |
|---|---|
| All 45 source files, exactly as Base44 had them | `base44-export/src/…` and `base44-export/*.js|json|html|md` |
| The two database table definitions | `base44-export/entities.json` |
| Your 5 existing data rows as spreadsheets | `base44-export/data/StudyProgress.csv`, `base44-export/data/AliyahLog.csv` |
| Full chat history with Base44 (every request and decision) | `base44-export/chat-history.md` |
| App settings, routes, login methods | `base44-export/app-meta.md` |
| Logo and home-screen screenshot | `base44-export/assets/` |

---

## 1. What the app is

A personal, lifetime tracker for Torah learning and synagogue honors. Two completely separate modules that never share data:

1. **לימוד (Study)** – tick off what you have learned, down to the chapter (פרק), page (דף), or Aliyah, through the whole of Tanach, Mishnah, and Gemara. Rambam, Shulchan Aruch, and Yerushalmi are placeholders for later.
2. **עליות (Aliyos)** – log every time you were called to the Torah: which Parshah, which honor (כהן … מפטיר), the date, the synagogue, and notes.

Every level shows live progress: a fraction (e.g. 6 / 524), a percent, and a ring graphic.

Dark theme. Hebrew first with right-to-left layout. Three language modes.

---

## 2. Screens and navigation

### 2.1 App shell (every screen)

- Sticky header at the top. Left (in RTL, right): logo icon in a rounded green-tinted square, brand text "מעקב תורה" with small subtitle "Torah Progress Tracker" (swapped in English mode).
- Language toggle: a small segmented control with three pills: **עב**, **EN·עב**, **EN**.
- Below it a two-tab switcher in a rounded card: **לימוד** (book icon) and **עליות** (scroll icon). Active tab is solid green with a soft glow.
- Content area is centered, max width 768px, with bottom padding so the last item is never hidden.

### 2.2 Study module (לימוד) – URL `/study/...`

The URL carries the path. Each segment is the Hebrew name, URL-encoded. Examples:

- `/study` – category list
- `/study/תנ״ך` – sections (תורה, נביאים, כתובים)
- `/study/תנ״ך/תורה` – the five books
- `/study/תנ״ך/תורה/בראשית` – list of Parshiyot (Chumash only)
- `/study/תנ״ך/תורה/בראשית/נח` – 7 Aliyot of Parshas Noach (leaf screen)
- `/study/תנ״ך/נביאים/יהושע` – 24 chapters (leaf screen)
- `/study/משנה/זרעים/ברכות` – 9 chapters (leaf screen)
- `/study/גמרא/ברכות` – 64 pages (leaf screen)
- `/study/רמב״ם` – "Coming soon" placeholder

Screen types:

| Type | When | What it shows |
|---|---|---|
| categories | `/study` | Title "לימוד", subtitle "בחר קטגוריה למעקב הלימוד שלך", then 6 pill rows: תנ״ך, משנה, גמרא, רמב״ם, שולחן ערוך, ירושלמי. Each pill: name, "done / total · %", progress ring, chevron. |
| sections | a category with sections | Pills for each section (e.g. תורה / נביאים / כתובים, or the 6 Sedarim). |
| books | a section, or גמרא directly | Pills for each book / tractate. |
| parshiyot | one of the 5 Chumash books | Pills for each Parshah, each out of 7. |
| chumash_aliyot | a Parshah | Big centered title: book name (4xl) above Parshah name (3xl, green). "done / 7 · %" on one side and a "סמן הכל / בטל הכל" button on the other. Then 7 rows: circular checkbox, Aliyah name (xl), small grey subtitle with the perek range e.g. "פרק א–ג". |
| leaves | any non-Chumash book | Title, "done / count · %", "סמן הכל / בטל הכל" button, then a 2-column grid (1 column on phones) of rows: circular checkbox + label "פרק א" … or "דף ב" … |
| placeholder | רמב״ם, שולחן ערוך, ירושלמי | Book icon and "תוכן יתווסף בקרוב" (Coming soon). |

Behaviors:

- Tapping a row toggles it immediately (optimistic), then saves. If saving fails it reverts.
- "סמן הכל" marks every item in the book. If every item is already marked, the button reads "בטל הכל" and clears them all.
- Progress rolls up instantly to every parent pill.
- Breadcrumb at the top of every non-root screen: arrow + "לימוד", then "/ תנ״ך / תורה / …". Each crumb is a link.
- Gemara labels start at דף ב (page 2), because printed Gemara starts on page 2. Chapters start at פרק א.
- Chapter and page numbers are shown as Hebrew letters (gematria) in Hebrew title mode: א, ב … טו, טז … ק, קא…

### 2.3 Aliyos module (עליות) – URL `/aliyos/...`

- `/aliyos` – 5 pills, one per Sefer, each out of (number of Parshiyot × 8).
- `/aliyos/בראשית` – pills for each Parshah, each out of 8.
- `/aliyos/בראשית/נח` – leaf screen: big centered Sefer title above Parshah title (green). "done / 8 · %" and a "סמן הכל" button. Then 8 rows: כהן, לוי, שלישי, רביעי, חמישי, שישי, שביעי, מפטיר. Each row: circular checkbox, honor name, and if logged, a small grey line "synagogue · date".

Tapping a row opens a **modal dialog**:

- Title: the honor name (2xl). Under it "Sefer · Parshah" in grey.
- Fields: תאריך (date picker), בית כנסת (text, placeholder "מיקום / בית כנסת"), הערות (3-line text area).
- Buttons: שמור (Save). If the row was already logged, also מחק (Delete, red).
- Saving with no date is allowed. The row counts as done as soon as a record exists.

"סמן הכל" creates records for every honor not yet logged, with empty date/synagogue/notes.

**Update 2026-09-07 (rebuild):** each honor is a preset range of pesukim (perek:pasuk to perek:pasuk) and shows its length in pesukim. An entry may carry its own range ("Different pesukim") for a split aliyah, and a ninth row, **הוספה / Hosafah**, records an extra aliyah with a required custom range; hosafos are shown but not counted in the 8. The Dashboard sums pesukim across all aliyos and counts the distinct pesukim of the Torah covered (out of 5,846). Data: `src/data/torahStructure.json` (Sefaria + Hebcal), columns `books.pesukim`, `parshiyot.aliyah_pesukim`, `aliyot.is_extra`, `aliyah_log.from_perek/from_pasuk/to_perek/to_pasuk`.

### 2.4 Language modes

| Mode | Pill | UI text | Book / Parshah / honor names | Direction |
|---|---|---|---|---|
| he | עב | Hebrew | Hebrew | RTL |
| en-he | EN·עב | English | Hebrew | LTR |
| en | EN | English | English, Ashkenazi transliteration (Bereishis, Noach, Kohen, Shabbos…) | LTR |

- Choice is remembered on the device (localStorage key `torah_lang_mode`). Default is Hebrew.
- Direction flips live. Chevrons and breadcrumb arrows flip with it.
- Chapter labels: Hebrew mode "פרק א", English mode "Chapter 1". Pages: "דף ב" / "Page 2". Ranges: "פרק א–ג" / "Ch. 1–3".
- Full translation table is in `base44-export/src/lib/i18n.js` (about 170 names). Keep Hebrew as the permanent key everywhere; English is display-only.

UI strings (Hebrew / English):
brandMain מעקב תורה / Torah Progress Tracker · tabStudy לימוד / Study · tabAliyos עליות / Aliyos · studySubtitle בחר קטגוריה למעקב הלימוד שלך / Choose a category to track your learning · notFound לא נמצא / Not found · markAll סמן הכל / Mark all · unmarkAll בטל הכל / Unmark all · comingSoon תוכן יתווסף בקרוב / Coming soon · modalDate תאריך / Date · modalSynagogue בית כנסת / Synagogue · modalSynagoguePlaceholder מיקום / בית כנסת / Location / Synagogue · modalNotes הערות / Notes · modalDelete מחק / Delete · modalSave שמור / Save.

---

## 3. Design system

- **Theme:** dark only. Background very dark blue-grey `hsl(222 22% 9%)`. Cards `hsl(222 20% 12%)`. Borders `hsl(222 16% 20%)`. Text near-white `hsl(210 25% 96%)`. Muted text `hsl(220 14% 62%)`.
- **Accent (primary):** emerald green `hsl(152 56% 48%)`. Used for checked circles, active tab, progress rings, Parshah titles.
- **Destructive:** red `hsl(0 70% 55%)` for the Delete button.
- **Radius:** large, 1.1rem. Pills and rows use `rounded-2xl`; tabs `rounded-xl`; buttons pill-shaped `rounded-full`.
- **Fonts (Google Fonts):** Heebo for body/UI; Frank Ruhl Libre for display titles, book names, chapter labels. `theme-color` meta is `#0e1116`.
- **Icons:** lucide-react (BookOpen, ScrollText, Check, ChevronLeft/Right, ArrowLeft/Right, Loader2, BookMarked).
- **Progress ring:** 42px SVG circle, 4px stroke, muted track, green arc, animated 700ms.
- **Circular checkbox:** 28px circle, 2px border. Unchecked: faint grey border. Checked: filled green with a white check mark.
- **Pill row:** name (lg, display font, bold), under it "done / total · %" in xs grey, ring on the end, chevron after it. Hover: green-tinted border.
- Mark-all button: pill, translucent green background, green border and text.
- Loading state: centered spinning loader. Not-found: grey centered text.

---

## 4. Data model

### 4.1 Tables that existed in Base44

**StudyProgress** – one row per book (or per Parshah for Chumash), owned by the user.

| Column | Type | Meaning |
|---|---|---|
| path_key | text | Pipe-joined path. Examples: `תנ״ך|נביאים|יהושע`, `משנה|זרעים|ברכות`, `גמרא|ברכות`, `תנ״ך|תורה|בראשית|נח` |
| completed | array | For chapters/pages: numbers 1…count. For Chumash Parshiyot: Aliyah names as strings (כהן, לוי, …). |

**AliyahLog** – one row per honor received.

| Column | Type | Meaning |
|---|---|---|
| sefer | text | e.g. בראשית |
| parashah | text | e.g. נח |
| aliyah | text | one of כהן/לוי/שלישי/רביעי/חמישי/שישי/שביעי/מפטיר |
| date | date | optional |
| synagogue | text | optional |
| notes | text | optional |

Both tables had owner-only security: each user reads and writes only rows they created. Base44 added `id`, `created_date`, `updated_date`, `created_by` automatically.

### 4.2 Recommended shape for the Supabase rebuild

Keep the same idea but make it spreadsheet-friendly (one fact per row). Suggested tables:

**study_progress**
| column | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | who owns it |
| category | text | תנ״ך / משנה / גמרא / … |
| section | text | תורה / זרעים / … (empty for גמרא) |
| book | text | בראשית / ברכות / … |
| parashah | text | only for Chumash |
| item | text | "1", "2", … or "כהן", "לוי", … |
| completed_at | timestamp | when it was ticked |

One row per ticked item. Untick = delete the row. This exports to a Sheet directly and a per-Parshah tab is a simple filter.

**aliyah_log** – same six columns as AliyahLog plus id, user_id, created_at.

**Reference lists** (books, counts, Parshiyot, Aliyah ranges, transliterations) stay in code as static data, exactly as they are now in `src/lib/*.js`. They are not user data.

### 4.3 Your existing data (5 rows)

See `base44-export/data/`. Summary: all of Mishnah Avos (6 chapters) is ticked; two Aliyos are logged (דברים / שופטים / שלישי on 2026-08-17 at Neuman shul, and דברים / וילך / שביעי on 2026-09-05 at Jackson 21).

---

## 5. The reference lists (the Torah structure)

These are the exact lists in the app. Counts are what Base44 used. See section 8 for things to double-check.

### 5.1 תנ״ך

**תורה** (tracked by Parshah → 7 Aliyot, not by chapter)

| Book | Chapters | Parshiyot (count) |
|---|---|---|
| בראשית | 50 | בראשית, נח, לך לך, וירא, חיי שרה, תולדות, ויצא, וישלח, וישב, מקץ, ויגש, ויחי (12) |
| שמות | 40 | שמות, וארא, בא, בשלח, יתרו, משפטים, תרומה, תצוה, כי תשא, ויקהל, פקודי (11) |
| ויקרא | 27 | ויקרא, צו, שמיני, תזריע, מצורע, אחרי מות, קדושים, אמור, בהר, בחוקותי (10) |
| במדבר | 36 | במדבר, נשא, בהעלותך, שלח לך, קרח, חקת, בלק, פינחס, מטות, מסעי (10) |
| דברים | 34 | דברים, ואתחנן, עקב, ראה, שופטים, כי תצא, כי תבא, נצבים, וילך, האזינו, וזאת הברכה (11) |

54 Parshiyot × 7 Aliyot = 378 study items for Torah.

**נביאים** (chapters): יהושע 24, שופטים 21, שמואל א 31, שמואל ב 24, מלכים א 22, מלכים ב 25, ישעיהו 66, ירמיהו 52, יחזקאל 48, הושע 14, יואל 4, עמוס 9, עובדיה 1, יונה 4, מיכה 7, נחום 3, חבקוק 3, צפניה 3, חגי 2, זכריה 14, מלאכי 3. Total 380.

**כתובים** (chapters): תהילים 150, משלי 31, איוב 42, שיר השירים 8, רות 4, איכה 5, קהלת 12, אסתר 10, דניאל 12, עזרא 10, נחמיה 13, דברי הימים א 29, דברי הימים ב 36. Total 362.

Tanach total shown in the app: 378 + 380 + 362 = **1120**.

### 5.2 משנה (chapters per tractate)

| Seder | Tractates |
|---|---|
| זרעים | ברכות 9, פאה 8, דמאי 7, כלאים 9, שביעית 10, תרומות 11, מעשרות 5, מעשר שני 5, חלה 4, ערלה 3, ביכורים 3 |
| מועד | שבת 24, עירובין 10, פסחים 10, שקלים 8, יומא 8, סוכה 5, ביצה 5, ראש השנה 4, תענית 4, מגילה 4, מועד קטן 3, חגיגה 3 |
| נשים | יבמות 16, כתובות 13, נדרים 11, נזיר 9, סוטה 9, גיטין 9, קידושין 4 |
| נזיקין | בבא קמא 10, בבא מציעא 10, בבא בתרא 10, סנהדרין 11, מכות 3, שבועות 8, עדויות 8, עבודה זרה 5, אבות 6, הוריות 3 |
| קדשים | זבחים 14, מנחות 13, חולין 12, בכורות 9, ערכין 9, תמורה 7, כריתות 6, מעילה 6, תמיד 7, מדות 5, קינים 3 |
| טהרות | כלים 30, אהלות 18, נגעים 14, פרה 12, טהרות 10, מקוואות 10, נידה 10, מכשירין 6, זבים 5, טבול יום 4, ידים 4, עוקצים 3 |

Total shown in the app: **524**.

### 5.3 גמרא (pages per tractate, labeled from דף ב)

ברכות 64, שבת 157, עירובין 105, פסחים 121, שקלים 22, יומא 88, סוכה 56, ביצה 40, ראש השנה 35, תענית 31, מגילה 32, מועד קטן 29, חגיגה 27, יבמות 122, כתובות 112, נדרים 91, נזיר 66, סוטה 49, גיטין 90, קידושין 82, בבא קמא 119, בבא מציעא 119, בבא בתרא 176, סנהדרין 113, מכות 24, שבועות 49, עבודה זרה 76, הוריות 14, זבחים 120, מנחות 110, חולין 142, בכורות 61, ערכין 34, תמורה 34, כריתות 28, מעילה 22, נידה 73.

Total shown in the app: **2733**. No sections; the tractates sit directly under גמרא.

### 5.4 Placeholders

רמב״ם, שולחן ערוך, ירושלמי exist on the main menu with 0 / 0 and show "Coming soon".

### 5.5 Aliyah names

- Study module (Chumash): 7 honors: כהן, לוי, שלישי, רביעי, חמישי, שישי, שביעי.
- Aliyos module: 8 honors: the same plus מפטיר.

### 5.6 Perek range for every Aliyah of every Parshah

Reference-only labels shown in grey under each Aliyah in the Study module. Stored in `base44-export/src/lib/chumashAliyotData.js` as `[startChapter, endChapter]` pairs, 7 per Parshah, for all 54 Parshiyot. Example, Parshas נח: כהן ו–ז, לוי ז, שלישי ז–ח, רביעי ח–ט, חמישי ט, שישי ט–י, שביעי יא.

**Update 2026-09-07 (rebuild):** the Base44 perek ranges turned out to be rough for many parshiyot (for example נח: כהן is ו:ט–ו:כב, so perek ו only). They were replaced by pasuk-level ranges from Sefaria, checked against Hebcal, and the perek ranges are now derived from those.

### 5.7 English transliterations

Ashkenazi style, full table in `base44-export/src/lib/i18n.js`. Examples: Bereishis, Shemos, Vayikra, Bamidbar, Devarim; Brachos, Shabbos, Kesubos, Bava Basra; Noach, Lech Lecha, Chayei Sarah, Toldos, Yisro, Ki Sisa, Bechukosai, Behaaloscha, Vaeschanan, Ki Seitzei, Ki Savo, Vzos Habrachah; Kohen, Levi, Shlishi, Revi'i, Chamishi, Shishi, Shvi'i, Maftir.

---

## 6. Technical notes from the original build

- **Stack:** React 18, Vite 6, Tailwind CSS 3, shadcn/ui components (new-york style, neutral base), lucide-react icons, react-router-dom 6, TanStack Query. All reusable in the rebuild.
- **Files worth copying almost unchanged:** `lib/studyData.js`, `lib/chumashAliyotData.js`, `lib/aliyosData.js`, `lib/hebrew.js`, `lib/i18n.js`, `lib/LanguageContext.jsx`, all of `components/` (AppLayout, Breadcrumb, CircularCheckbox, LanguageToggle, ProgressPill, ProgressRing, StudyModule, AliyosModule, AliyahModal), `index.css`, `tailwind.config.js`, `index.html`.
- **Files to replace:** everything that talks to Base44 (`api/base44Client.js`, `lib/AuthContext.jsx`, `lib/app-params.js`, `components/ProtectedRoute.jsx`, the pages in `pages/`). These become Supabase login and a small data layer. Only the calls `StudyProgress.list/create/update` and `AliyahLog.list/create/update/delete/bulkCreate` need a replacement.
- **Routing:** `/` redirects to `/study`. `/study/*` and `/aliyos/*` require login. `*` shows a 404 page.
- `index.html` links to `/manifest.json`, but no manifest file existed. The PWA (home-screen app) part was never actually built.

---

## 7. Decisions made during the Base44 build (so we do not re-argue them)

1. Torah books in the Study module are tracked by **Parshah → Aliyah**, not by chapter. Chapter numbers appear only as a grey reference under each Aliyah.
2. Study progress and Aliyos logs are **completely separate**. Ticking an Aliyah in Study does not create an Aliyos log and vice versa.
3. Three language modes, with **Ashkenazi transliteration** and **LTR layout in English modes**.
4. Per-user data with owner-only security from day one.
5. Progress updates are optimistic (instant), with rollback on failure.

---

## 8. Things to double-check or fix in the rebuild

1. **Gemara page counts.** Labels run from דף ב up to דף (count + 1). For ברכות (count 64) that shows דף ב … דף סה, but Berachos ends at דף סד. Either store the last page number and show pages 2…last, or store (last − 1). Verify each tractate against a standard source (Sefaria has this list). The app total 2733 does not match the commonly quoted 2711 dapim of Shas.
2. **Mishnah chapter count.** App total is 524. Standard count is 525. Compare tractate by tractate.
3. **Parshah spelling.** The original request said כי תבוא; the code uses כי תבא. Pick one and keep it everywhere (it is a database key).
4. **Perek ranges** in `chumashAliyotData.js` were generated by the AI, not from a source. Spot-check a few Parshiyot.
5. **No manifest / PWA.** Must be added for "Add to Home Screen" on iPhone: manifest.json, icons, and a service worker for offline.
6. **No export.** Nothing in the old app exported data. New app needs a CSV export button and the Google Sheet sync.
7. **No search.** Base44 offered a search box to jump to a book; never built.
8. **Never published.** The Base44 app was only ever in the editor preview.

---

## 9. Ideas that were suggested but never built

- Search box to jump straight to a ספר or מסכת by name.
- Calendar view (הוסף תצוגת לוח שנה).
- Quick search (הוסף חיפוש מהיר).
- Weekly learning summary (סכם למידה שבועית).
- Filling in רמב״ם, שולחן ערוך, and ירושלמי.
- Your own additions from the planning session: CSV export, live Google Sheet with a tab per Torah portion, iPhone home-screen app, offline use, later App Store via Capacitor.

---

## 10. Source of truth checklist

- [x] All source files copied (45 files)
- [x] Table definitions copied
- [x] Existing data rows copied (5 rows)
- [x] Full chat history copied
- [x] App settings and routes copied
- [ ] Gemara / Mishnah counts verified against a standard source
- [ ] Perek ranges spot-checked
