# Dragon Realm ecosystem

Four sites, one Supabase project (`dragon-pyre-strike`), one account.

| Site | URL | Repo folder |
|---|---|---|
| DracoPyre Strike (hub, 7 built-in games) | https://draco-pyre-strike.vercel.app | `dracopyre-strike/playx` |
| Ember Wyrm | https://emberwyrmsite.vercel.app | `ember-wyrm-site` |
| Drakebreaker | https://dragonbreaker-site.vercel.app | `drakebreaker-site` |
| Dragon Flight | https://dragon-flight-site.vercel.app | `dragon-flight-site` |

## What is shared
Every site contains an identical `src/dps/` folder (the "Dragon Pyre" module):

- `config.ts` – Supabase URL + publishable key, list of sites, score directions. **Edit URLs here** if a domain changes (and copy the folder to all four projects).
- `AuthProvider.tsx` / `AuthModal.tsx` – login, signup, forgot/reset password.
- `DragonDock.tsx` – floating account + "Realm map" button on the game sites.
- `api.ts` – `reportRun()` (leaderboard), cloud saves, favorites, stats, leaderboards.

## Database (see `supabase/001_ecosystem_core_schema.sql`)
`profiles`, `games`, `game_stats`, `score_runs`, `game_saves`, `favorites`, `player_settings`, view `leaderboard`,
RPCs `submit_score` / `touch_game`. Row Level Security is on for every table. Players can never write
XP or stats directly — only through `submit_score`, which validates the game, the score, and rate-limits to one run per game every 3 s.

## Adding a new game to the ecosystem
1. `insert into public.games (slug, title, category, score_direction, score_unit, has_score, external_url, sort_order) values (...)`
2. Add it to `ECOSYSTEM_SITES` and `SCORE_DIRECTION` in `src/dps/config.ts` (all projects).
3. Copy `src/dps/` into the new game, wrap the app in `<AuthProvider>`, render `<DragonDock siteSlug="..." />`,
   call `reportRun('slug', score)` when a run ends, and `queueCloudSave('slug', 'main', data)` for progress.

## Dashboard settings you must set (cannot be done from code)
Supabase → Authentication:
1. **URL Configuration** – Site URL `https://draco-pyre-strike.vercel.app`; add all four site URLs (and `http://localhost:5173`) to *Redirect URLs*. Needed for email-confirmation and password-reset links.
2. **Sign In / Providers → Email** – decide whether "Confirm email" is on. The UI handles both. Supabase's built-in mailer is heavily rate-limited, so configure custom SMTP before a real launch.
3. (Optional) enable Google/Discord etc. – the login modal is email + password today.

## Known limits
- Each site is its own origin, so each keeps its own login session: players sign in once per site (same email + password).
  True single sign-on needs the sites on subdomains of one custom domain (cookie storage). Sharing tokens between origins is not safe with refresh-token rotation.
- Scores are reported by the browser, so a determined player can fake one. Rate limiting and range checks are in place; add server-side validation per game if rankings ever carry prizes.
