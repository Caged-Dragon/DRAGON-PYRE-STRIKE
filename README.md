# Dragon Realm — hub + 7 game sites

One hub and seven games. Every site is its own app, deployed as its own Vercel project, and all of them share one
Supabase project (accounts, scores, saves, favorites, feedback).

| Folder | Site | Slug |
|---|---|---|
| `Dragon-pyre-strike` | **Hub** (DracoPyre Strike): catalogue, leaderboards, profile, feedback | `hub` |
| `dragon-strike-shooter-site` | Dragon Strike | `dragon-strike` |
| `ember-wyrm-site` | Ember Wyrm | `ember-wyrm` |
| `drakebreaker-site` | Drakebreaker | `drakebreaker` |
| `dragon-flight-site` | Dragon Flight | `dragon-flight` |
| `2042` | Dragon 2048 | `dragon-2048` |
| `soduko` | Dragon Sudoku | `dragon-sudoku` |
| `tictactoe` | Dragon Tic-Tac-Toe | `dragon-tictactoe` |

`shared/dps` is the one shared module (login, theme, saved data, feedback, navigation). It is copied into every app's
`src/dps` so each app deploys on its own. **Edit `shared/dps` only**, then run `node scripts/sync-dps.mjs`.

## How it behaves

- **Login / sign-up** is Supabase Auth itself (email + password, password reset, Google/Apple where enabled in Supabase).
  The apps contain no auth server code; a database trigger creates the profile.
- **Guest**: nothing is stored anywhere (no cookies, no browser storage, no database rows). Settings, progress and theme
  live in the open page only.
- **Signed in**: theme, settings, game progress, favorites, scores and XP are saved to the account and follow the player
  to every site.
- **Two themes, everywhere** (hub included): **Dragon** (dark, fiery) and **Classic** (light, clean). One switch in the
  Dragon dock on every game and in the hub header. Signed-in players keep the choice in their account; guests carry it in
  the link when moving between sites (`?theme=classic`).
- **Feedback**: "Send feedback" in every game's dock opens a form (idea / problem / praise, 1-5 stars, message, optional
  email). The hub has a full page at `/feedback` (pick any game) and a "Rate & give feedback" button on each game page.
  Guests and players can both send it. It is saved to the `feedback` table.

## Install as apps (PWA) and the Realm Store

Every site is an installable app: web manifest, icons, and an offline service worker (open it once online, then it keeps
working offline). A browser can only install the site you are on, so:

- The hub's **Realm Store** (`/store`, also in the nav) lists every game with **Install**, **Open** and **Details**.
  **Install** opens the game's own site with `?install=1`, which pops up that game's install sheet (one tap where the browser
  allows it; Share -> Add to Home Screen steps on iPhone/iPad).
- The hub itself is installable too and acts as the launcher; every game's dock also has an **Install app** row.
- On Android, links from the hub to an already-installed game usually open the installed app.
- Files per site: `public/manifest.webmanifest`, `public/sw.js`, `public/icons/*`, plus `vercel.json` headers. They are
  generated: `node scripts/sync-pwa.mjs` (and `python3 scripts/pwa/make_icons.py` for icons). Five games use generated
  monogram icons; drop your own PNGs into `<app>/public/icons` (same file names) to replace them.

## Environment variables

All eight sites use the **same** variables (copy `.env.example`, which is in every folder). They are optional: set them in
every Vercel project only when a site's real address differs from the default. Vite reads them at build time, so redeploy
after changing them. Locally, copy `.env.example` to `.env`.

## Deploy (GitHub -> Vercel)

1. Push this repository to GitHub as is.
2. In Vercel, **Add New -> Project** and import the repo **eight times**. For each, set **Root Directory** to the folder in the
   table above. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist` (defaults).
3. Note each project's address (e.g. `https://dragon-sudoku-site.vercel.app`).
4. The sites find each other through the addresses in `.env.example`. Add that same list (hub address + all seven game
   addresses, using each project's real Vercel address) to **every** one of the eight projects, then redeploy.

5. In **Supabase -> Authentication -> URL Configuration**, add all eight addresses to **Redirect URLs** (and set the hub as
   Site URL). Password-reset and email-confirmation links return to the site that asked for them.
6. Supabase needs the shared tables (profiles, games, scores, saves, favorites, settings, achievements) and the `feedback`
   table. The first time, create the `feedback` table (see the database note you were given).
7. Check the whole thing: `node scripts/check-ecosystem.mjs` (and `--live` once deployed).

Sign-in is per site (each address is a separate origin), with the same email and password everywhere. Putting the sites on
subdomains of one domain would allow a single shared session later.

## Local development

```
cd <folder> && npm ci && npm run dev
```
