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

**2. Live Google Sheet, for every user (cloud mode).** No Google sign-in needed. In the app: Settings → Live Google Sheet → "Create my link". The app shows three short formulas. Open a new Google Sheet, click cell A1, paste one formula. Do the same in two more tabs for the other two formulas. Google refreshes the data by itself about once an hour. If the link is ever shared by mistake, press "Make a new link" and the old one stops working.

The formulas call a small piece of server code that runs on Supabase for free. It has to be installed once by the owner (you), not by each user:

1. In Supabase, open **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `sheet-export`. Paste the contents of `supabase/functions/sheet-export/index.ts` and deploy.
3. Open the function's page → **Details / Settings** and turn **off** "Enforce JWT verification" (Google Sheets cannot send a login header; the secret link is the protection instead).
4. Make sure `supabase/schema.sql` has been run; it creates the `sheet_links` table the function reads.

Tab three, "By parashah", is one row per parashah with the aliyos learned and the aliyos received, which is the "page per Torah portion" view.

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
