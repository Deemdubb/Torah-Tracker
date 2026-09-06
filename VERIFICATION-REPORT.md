# Verification Report – Torah Tracker

Reviewed 2026-09-06. I read all app, database, script, workflow, and test files. No server or browser was used.

## What passed

- `npm test`: 50 tests, all passed. `npm run build`: no errors. `npm run lint`: no warnings. All three still pass after my edits.
- The three language modes work as specified. All screen text comes from `src/lib/i18n.js` or the list rows, with one exception below.
- No component names a specific sefer or category. Lists come only from the database and Admin.
- Totals match the reference data: Tanach 1120, Mishnah 524, Gemara 2696 pages (from daf 2), Aliyos 432. Maftir is left out of Study.
- Supabase code matches `schema.sql` (columns, conflict keys, default user id). Users touch only their own rows; only admins change lists. Deletes cascade; a section's books are removed by app code. `seed.sql` is valid.
- The workflow builds with the `/repo-name/` base path; a test build confirmed the files use it.
- Admin add, edit, reorder, and delete work for all five list types, with unique keys and reordering within siblings.
- Names are wrapped in `<bdi>`, arrows flip with direction, safe-area padding is present, icon-only buttons have `aria-label`s, and the modal closes on Escape.

## What I fixed

- `vite.config.js`: the base path is now read with Vite's `loadEnv`, so `VITE_BASE_PATH` in `.env` works as `.env.example` promises. Before, only the workflow's shell variable worked.
- `src/components/ui.jsx`: form labels are now real `<label>` elements connected to their input, so screen readers announce them.

## Found but not changed

- `src/pages/LoginPage.jsx` line 41: the placeholder `you@example.com` is not translated. It is an example address.
- Some controls are under 40px tall: small buttons and admin row icons 32px (`ui.jsx` line 12, `RowActions.jsx` line 4), language pills about 24px. A design choice.
- Cloud mode queues only Study ticks while offline; saving an aliyah offline shows an error. README line 104 overstates this.
- Cloud "Import lists" and "Reset" delete then re-insert in separate steps; a failure part way leaves lists partly empty.
- A repository named `<you>.github.io` would get the wrong base path.

## Things the owner must do by hand

- Supabase: run `schema.sql` then `seed.sql`; set Site URL and Redirect URLs to the GitHub Pages address; after first sign-in, run the `update public.profiles set role = 'admin'` line with your email.
- GitHub: Settings, Pages, Source: GitHub Actions. Add secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Push to `main`.
- Google Sheet: paste `tools/google-sheets-sync.gs`, set the script properties (service_role key only there), run `syncAll`, then `setupHourlyTrigger`.
- Test the published site: email sign-in (tap Study if "Not found" appears), Add to Home Screen on iPhone, offline ticking.
