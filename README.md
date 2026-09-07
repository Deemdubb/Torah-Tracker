# מעקב תורה · Torah Progress Tracker

A personal app for tracking your learning through Tanach, Mishnah and Gemara, and for logging every aliyah you receive. Works on a phone or a computer. Free to run.

Everything the app knows about the Torah (categories, sefarim, chapter counts, parshiyos, aliyos) is a list you can edit from the **Admin** screen inside the app. Nothing is typed into the code.

## What is in this folder

| Folder / file | What it is |
|---|---|
| `src/` | The app itself (React + Vite + Tailwind). |
| `src/data/referenceData.json` | The starting Torah lists. Used the first time the app runs and by the "Reset to original lists" button. |
| `supabase/schema.sql` | Sets up the database tables and security in Supabase. Run once. |
| `supabase/seed.sql` | Loads the Torah lists into Supabase. Run once after schema.sql. |
| `supabase/functions/sheet-export/` | Server code that lets a Google Sheet pull a user's data through a secret link. |
| `tools/google-sheets-sync.gs` | Optional owner-only Apps Script that copies all data into one Google Sheet every hour. |
| `.github/workflows/deploy.yml` | Publishes the app to GitHub Pages every time you push to `main`. |
| `base44-export/` | The original Base44 app, kept for reference. Not used by the new app. |
| `TORAH-TRACKER-SPEC.md` | The full description of every screen and feature. |

## Two ways to store data

**Local mode** (default, zero setup). Data is saved inside the browser on that one device. Good for trying it out. Clearing the browser deletes the data, so use Settings → Backup now and then.

**Cloud mode** (Supabase, free). You sign in with an email link. Data is saved in your own Supabase project and follows you across devices. Other people can sign up too and only ever see their own data. Turn it on by filling in `.env` (see below).

The app switches automatically: if `.env` has the two Supabase values, it is in cloud mode. Otherwise it is in local mode.

## Run it on this computer

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Language modes

The toggle in the header has three options.

| Button | Interface | Torah names | Layout |
|---|---|---|---|
| עב | Hebrew | Hebrew | right-to-left |
| EN·עב | English | Hebrew | left-to-right |
| EN | English | English (Ashkenazi spelling, e.g. Bereishis, Brachos) | left-to-right |

The choice is remembered on the device.

## The Admin screen

Only admins see the **Admin** tab. In local mode you are always the admin. In cloud mode, see "Make yourself admin" below.

- **Categories** → tap one to see its sections and sefarim → tap a sefer to edit it or its parshiyos.
- Every row has arrows to reorder, a pencil to edit, and a trash can to delete.
- A sefer is either tracked **by perek / daf** (you set the first and last number) or **by parashah and aliyos** (you add parshiyos, each with the perek range of its aliyos).
- **Aliyah names** lets you rename the honors or add one. Untick "Included in Study tracking" for honors that only belong in the Aliyos log (like מפטיר).
- **Data tools** exports the lists as a file, imports a lists file, or resets everything to the original lists. Your progress is never touched by these.

Changes are visible to all users right away.

## Learning something more than once

Every tap on a perek, a daf, or an aliyah adds one completion. The circle shows a check the first time and a number from the second time on. The small minus next to it takes one away. A sefer shows "×2" once every item in it was learned twice. At the top of a sefer, "Mark all" fills in everything not yet learned; once everything is learned once, it becomes "Learned again (+1 all)" and "Clear all".

An aliyah can be received more than once. Tap the honor to see every entry, edit one, delete one, or "Add another". For the seven double parshiyos (Vayakhel-Pekudei and the others) each entry has a "This week was combined with …" choice, because the reading is different in those years. Admins connect or disconnect parshiyos in Admin → sefer → parashah → "Connected with".

**Already set up Supabase before 2026-09-06?** Run `supabase/migrations/2026-09-06_repeats_and_connected_parshiyos.sql` once in the SQL Editor. It removes the old one-per-item rule and adds the new columns. New installs get all of this from `schema.sql` directly.

## Aliyos by pesukim (hosafos and split aliyos)

Every aliyah of every parashah knows where it starts and ends, by perek and pasuk, and every Chumash sefer knows how many pesukim each perek has. So the app can say how many pesukim an aliyah covers: under each honor you see something like `א:א–ב:ג · 34 pesukim`.

Kohen, Levi, Shlishi and the rest are simply presets for a fixed range of pesukim. When you log an aliyah you can tick "Different pesukim" and type your own range: from perek and pasuk, to perek and pasuk. Use it when the aliyah was split that week, or for a **hosafah**, the extra aliyah that is added on some Shabbosos. Hosafah is its own row at the bottom of every parashah; it always asks for the range, can be logged as often as you like, and does not count towards the "all 8 aliyos" total. The app checks that the range exists in that sefer and shows the number of pesukim as you type.

The Dashboard adds up the pesukim of all your aliyos and shows how many different pesukim of the Torah you were called up for, out of 5,846. The Google Sheet shows the range and the count for every aliyah entry.

Where the data comes from: `scripts/fetch-torah-structure.mjs` downloads the perek lengths and the seven aliyos of every parashah from Sefaria and the maftir of every parashah from Hebcal, checks them against each other, and saves `src/data/torahStructure.json`. `scripts/gen-reference-data.mjs` then folds it into the lists. The tests check that the aliyos of every parashah follow each other with no gaps and cover each sefer from its first pasuk to its last. Admins can correct any range in Admin → sefer → parashah, and the perek lengths in Admin → sefer → Edit. V'Zos Habrachah has no usual maftir range, because on Simchas Torah the maftir is read from Bamidbar.

**Already set up Supabase before 2026-09-07?** Run `supabase/migrations/2026-09-07_pesukim.sql` once in the SQL Editor. It adds the new columns, the Hosafah row, and the pesukim data for all 54 parshiyos. Until then the app shows the aliyos without pesukim and cannot save a custom range.

## Home content filters (GenTech, Livigent, TAG, Netspark and similar)

Many users run a content filter that inspects every web response. Testing showed such a filter breaks long JSON answers from Supabase but lets plain text through, so the app loads all its data as plain-text CSV. If a filter still blocks the app, ask the filter company to allow `*.supabase.co` and the app's address.

## Set up cloud mode (Supabase)

1. Go to https://supabase.com, create a free account and a new project. Pick a strong database password and save it somewhere.
2. In the project, open **SQL Editor** → New query. Paste the contents of `supabase/schema.sql` and press Run.
3. New query again. Paste `supabase/seed.sql` and Run. This loads the Torah lists.
4. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
5. In this folder, copy `.env.example` to `.env` and paste the two values in.
6. Turn on email sign-in: **Authentication → Providers → Email** is on by default. To also allow Google sign-in, follow the Google provider guide there (optional).
7. Run `npm run dev`, open the app, and sign in with your email. A sign-in link arrives by email.

**Make yourself admin.** After your first sign-in, back in SQL Editor run this with your email:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Reload the app. The Admin tab appears.

**Move your local data to the cloud.** Before switching, in local mode open Settings → "Download full backup". After signing in to cloud mode, Settings → "Restore from backup" and pick that file.

Free tier notes: the project pauses after 7 days without use. Opening the app wakes it up in about a minute. The hourly Google Sheet sync also keeps it awake.

## Publish it (GitHub Pages, free)

1. Create a new repository on GitHub (any name, for example `torah-tracker`).
2. In the repository: **Settings → Pages → Source: GitHub Actions**.
3. If you use cloud mode: **Settings → Secrets and variables → Actions → New repository secret**. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In Supabase: **Authentication → URL Configuration**. Set Site URL to `https://<your-github-name>.github.io/<repo-name>/` and add the same address to Redirect URLs.
5. Upload this folder to the repository and push to `main`. The workflow builds and publishes the app. The address is shown under Settings → Pages.

Commands, if you use the terminal:

```bash
git init
git add .
git commit -m "Torah tracker"
git branch -M main
git remote add origin https://github.com/<your-github-name>/<repo-name>.git
git push -u origin main
```

## Put it on your iPhone

Open the published address in Safari. Tap the Share button, then **Add to Home Screen**. It opens full screen with its own icon. In cloud mode, ticks you make while offline are saved and sent when you are back online. Logging an aliyah needs a connection.

## Export to a spreadsheet

Three ways, from simplest to most automatic.

**1. Download a file.** Settings → "Download study progress (CSV)" or "Download aliyos log (CSV)". Opens in Excel or Google Sheets, with Hebrew and English names side by side. Works in local mode and cloud mode.

**2. Live Google Sheet, for every user (cloud mode).** No Google sign-in needed. In the app: Settings → Live Google Sheet → "Create my link". The app shows one formula. Open a new Google Sheet, click cell A1, paste the formula, press Enter. In a few seconds the tab fills with one row per thing that happened: what was learned or which aliyah was received, how many times, the first and last time, and details. Google refreshes it by itself about once an hour. Dates are written as text with the Hebrew date next to them (for example `2026-09-06 · כ״ד אלול תשפ״ו`), because Google would otherwise show a bare day number such as 46271. Under "More views" the app offers extra formulas, one tab each: progress by sefer, by parashah, every single completion, and aliyos only. If the link is ever shared by mistake, press "Make a new link" and the old one stops working.

The formulas call a small piece of server code that runs on Supabase for free. It has to be installed once by the owner (you), not by each user:

1. In Supabase, open **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `sheet-export`. Paste the contents of `supabase/functions/sheet-export/index.ts` and deploy.
3. Open the function's page → **Details / Settings** and turn **off** "Enforce JWT verification" (Google Sheets cannot send a login header; the secret link is the protection instead).
4. Make sure `supabase/schema.sql` has been run; it creates the `sheet_links` table the function reads.
5. When `index.ts` changes later, open the function → Code in the dashboard, paste the new file over the old one, and deploy again. The old version keeps running until you do.

**One button instead of a paste (the template, optional).** Make a Google Sheet once and share it as a template. Users press one button in the app, get their own copy, paste their link into one cell, and the tabs fill themselves. Build it like this:

1. New Google Sheet. Name the first tab `Setup`. In A1 write "Paste your link from the app here:" and leave B1 empty (color it yellow).
2. Add a tab named `Torah Tracker`. In its cell A1 paste:

```
=IF(Setup!B1="","Paste your link in Setup!B1",IMPORTDATA(Setup!B1&"&type=all&lang=en-he"))
```

   Optional extra tabs use the same formula with `type=books`, `type=parashah`, `type=study` or `type=aliyos`.

3. Share → "Anyone with the link" → Viewer. Copy the sheet's address.
4. Put that address in `.env` as `VITE_SHEET_TEMPLATE_URL` (and as a GitHub repository secret with the same name), then republish. The app's Settings screen now shows "Open the sheet template", which opens Google's "Make a copy" page for the user.

The address also accepts `lang=he` (Hebrew headers and names), `lang=en` (English headers, transliterated names) or `lang=en-he` (English headers, Hebrew names), and `tz=` with the user's time zone so late-night entries land on the right day. The app fills both in automatically. "By parashah" is one row per parashah with the aliyos learned and received, which is the "page per Torah portion" view.

**3. Owner's power-user sync (optional).** `tools/google-sheets-sync.gs` is a Google Apps Script that copies everyone's data into one spreadsheet every hour using the Supabase service key. Setup steps are at the top of that file. Only for the owner.

## Later: the App Store

The same code can be wrapped into a real iPhone app with Capacitor when you want to publish it. That needs an Apple Developer account ($99 per year). Nothing in the app has to be rebuilt for that.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Run locally with live reload |
| `npm run build` | Build the production files into `dist/` |
| `npm run lint` | Check the code for mistakes |
| `npm run gen:data` | Rebuild `src/data/referenceData.json` from the Base44 export |
| `npm run gen:seed` | Rebuild `supabase/seed.sql` from the reference data |
