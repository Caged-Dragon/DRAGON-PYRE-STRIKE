# Dragon Pyre Strike — the Dragon Realm

Five websites, one account, one database.

| App folder | Site | Live URL |
|---|---|---|
| `playx` | **DracoPyre Strike** — the hub (10 games, leaderboards, profile) | https://draco-pyre-strike.vercel.app |
| `dragon-strike-shooter-site` | **Dragon Strike** — dragon shooter, 12 realms, 8 dragons | https://dragon-strike-shooter-site.vercel.app |
| `ember-wyrm-site` | **Ember Wyrm** — top-view dragon arena | https://emberwyrmsite.vercel.app |
| `drakebreaker-site` | **Drakebreaker** — dragon brick breaker | https://dragonbreaker-site.vercel.app |
| `dragon-flight-site` | **Dragon Flight** — celestial-skies flyer | https://dragon-flight-site.vercel.app |

Every app is a self-contained Vite + React + TypeScript project (own `package.json`, own build). The hub is the
front door: its game cards open the other sites in the same tab, and every game has an **Exit to DracoPyre Strike**
button and a floating Realm map.

## One central database
All sites use the **same Supabase project** (`dragon-pyre-strike`). Nothing is stored per-site.

| Data | Where | Written by |
|---|---|---|
| Accounts (email + password, OAuth) | Supabase Auth | every site's login |
| Profile: username, avatar, XP / level | `profiles` | automatic on signup; edit on the hub |
| Best score, plays, last played | `game_stats` | RPC `submit_score` |
| Run history | `score_runs` | RPC `submit_score` |
| Cloud saves / progress | `game_saves` | each game |
| Favorites | `favorites` | hub |
| Achievements | `player_achievements` | RPC `unlock_achievement` |
| Game catalogue (slug, URL, score direction) | `games` | admin |
| Leaderboards | view `leaderboard` | read by everyone |

Row Level Security is enabled on every table; XP, stats and achievements can only be changed through the two RPCs.
The database schema is **not** part of this repository — it lives in Supabase.
The browser only ever uses the public *publishable* key (in `shared/dps/config.ts`); never put a service-role key in this repo.

## Shared module
`shared/dps` is the single source of truth for everything the sites have in common: Supabase client, login modal,
account dock, score/save/achievement API, animated backdrop, and the site registry (`config.ts`).
Each app keeps a copy in `src/dps` so it can be built and deployed from its own folder. After editing `shared/dps`:

```bash
node scripts/sync-dps.mjs        # copy shared/dps into every app
node scripts/check-ecosystem.mjs # verify the sites are wired to each other and to the database
node scripts/check-ecosystem.mjs --live   # …and request every deployed URL
```

## Run an app locally
```bash
cd <app folder>
npm install
npm run dev        # development
npm run build      # production build (dist/)
```
No environment variables are needed.

## Deploy (Vercel)
Create one Vercel project per app. If you deploy from this single repository, set each project's **Root Directory** to
the app folder and keep the Vite preset. (Each folder can also be pushed on its own to a separate repository.)
The hub needs its `vercel.json` SPA rewrite (already included).

## Supabase dashboard settings (Authentication)
- **URL Configuration → Site URL:** `https://draco-pyre-strike.vercel.app`
- **Redirect URLs:** all five live URLs and `http://localhost:5173`
- **Email:** decide whether "Confirm email" is on; use custom SMTP for production volumes.
- **Providers:** Dragon Strike's "Google / Apple / Discord / GitHub" buttons only work once those providers are enabled here.

## Adding a new game
1. `insert into games (...)` in Supabase (slug, title, score direction, external URL).
2. Add it to `ECOSYSTEM_SITES` and `SCORE_DIRECTION` in `shared/dps/config.ts`, and to `playx/src/data/games.ts` with the same `externalUrl`.
3. In the new app: wrap it in `<AuthProvider>`, render `<DragonDock siteSlug="…" />`, call `reportRun(slug, score)` when a run ends,
   `queueCloudSave(...)` for progress and `exitToHub()` from an Exit button.
4. Add the folder to `scripts/sync-dps.mjs` and `scripts/check-ecosystem.mjs`, then run both.

## Notes
- The hub still contains the original built-in Dragon Strike game (`playx/src/games/dragon-strike`). The catalogue now sends
  that card to the standalone Dragon Strike site, so the built-in version is unused and can be deleted.
- Each player signs in once **per site** (browsers keep a separate session per domain) — same email and password everywhere.
  True single sign-on would need all sites on subdomains of one custom domain.
