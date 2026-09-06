# Base44 app metadata (captured 2026-09-05)

- App name: מבט תורה (Torah Progress Tracker)
- Base44 app id: 6a83431b45d417f48875beee
- Slug / preview URL: https://torah-track-path.base44.app (never published, "not_deployed")
- Created: 2026-08-17 by meir@vivideyemedia.com
- Description (Hebrew): אפליקציה מקיפה למעקב אחר לימוד תורה יומי וניהול עליות לתורה בבית הכנסת. מציעה ממשק נוח בעברית למעקב מדויק אחר התקדמות בלימוד דפים ופרקים, לצד יומן עליות אישי ומפורט.
- Logo: https://media.base44.com/images/public/6a83431b45d417f48875beee/ad6694641_logo.png
- Preview screenshot: https://media.base44.com/images/public/screenshots/6a83431b45d417f48875beee/88ccd8648_home_preview.png
- Public setting: public_without_login (but /study/* and /aliyos/* routes require auth)
- Login methods enabled: username+password, Google, Microsoft, Facebook, Apple
- Categories: Education, Community, Lifestyle & Hobbies

## Routes
| Path | Component | Needs login |
|---|---|---|
| / | StudyModule | no |
| /study/* | StudyModule | yes |
| /aliyos/* | AliyosModule | yes |
| /login, /register, /forgot-password, /reset-password | Base44 built-in auth pages | no |

## Entities (tables)
See entities.json. Two tables: StudyProgress, AliyahLog. Both have owner-only row-level security.
