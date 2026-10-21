# DracoPyre Strike

**One Realm. Every Game.**
*A DracoPyre Games Production*

A free, browser-based gaming platform. Ten original games, instant play. Accounts are optional — sign in to get leaderboards, cloud saves and progress shared across the whole Dragon Realm (see the repository root README).

---

## Tech stack

- **React 18** + **TypeScript** + **Vite 5**
- **React Router v6** — client-side routing
- **Tailwind CSS v3** — utility styling, driven by a centralized CSS-variable token system
- **lucide-react** — icon set
- **Supabase** (`@supabase/supabase-js`) — accounts, leaderboards, cloud saves. The site itself is still a static build; guests need no backend.

## Getting started

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build       # type-check + production build to dist/
npm run preview     # serve the production build locally
npm run typecheck   # type-check only, no build
```

## Project structure

```
src/
├── components/     # Header, Footer, GameCard, GameGrid, GameHero, SearchBar,
│                   # CategoryCard, FilterBar, EmptyState, Skeletons, ErrorBoundary,
│                   # PageLoader, Logo — shared, reusable UI
├── pages/          # Home, Games, GameDetails, GamePlay, Category, Favorites,
│                   # Search, NotFound, Info (about/help/contact/privacy/terms)
├── games/          # One folder per game + registry.tsx (the lazy-load map)
├── data/           # games.ts (registry), categories.ts, configuration.ts (brand strings)
├── hooks/          # useLocalStorage, usePlayerData (favorites/recent/scores),
│                   # useGameQuery (search+filter+sort+paginate), useDocumentMeta
├── utils/          # format.ts (numbers/time), sound.ts (WebAudio SFX synth)
└── index.css       # design tokens (CSS custom properties) + global styles
```

## Implemented features

- **10 fully playable games** — see below. Every one has real win/lose logic, a restart flow, and (where it makes sense) a locally-tracked best score.
- **Discovery**: home page (hero, trending, popular, categories, new, recently played, recommended), a filterable/sortable Games page, category pages, and full-text search across title/description/category/tags.
- **Accounts (v4.0)** — email + password sign-in shared by all four Dragon Realm sites; guests keep working exactly as before.
- **Leaderboards & Profile** — `/leaderboard` (per game + overall XP) and `/profile` (stats, level, avatar/username).
- **Favorites & Recently Played** — stored in `localStorage`; mirrored to your account when signed in.
- **High scores** — per-game best score/time/attempts, stored locally, direction-aware (a lower time can be "better" than a higher one).
- **Feedback & Ratings (v2.0)** — a star rating plus a categorized feedback form that composes a real email to the studio, with a clipboard fallback. See below.
- **Colorful theme by default, dark mode opt-in** — toggle in the header, persists locally, applied before first paint (no flash of the wrong theme on reload).
- **Responsive, keyboard-accessible UI** with focus states, skip link, and `prefers-reduced-motion` support.
- **Code-split by route and by game** — the homepage never downloads a single game engine; opening a game only fetches that game's ~1–10 KB chunk.
- **Friendly error/empty/loading states** everywhere the spec calls for one (search, favorites, 404, game-not-found, game-crashed, category-with-no-games-yet).

## The 10 games

Seven live in-app; three are separate, independently-built websites that DracoPyre Strike links out to rather than embeds.

| Game | Slug | Category | Hosting |
|---|---|---|---|
| Dragon Strike | `dragon-strike` | Action | in-app |
| Ember Wyrm | `ember-wyrm` | Arcade | **external site ↗** |
| Dragon's Hoard | `dragons-hoard` | Puzzle | in-app |
| Drakebreaker | `drakebreaker` | Action | **external site ↗** |
| Dragon Flight | `dragon-flight` | Arcade | **external site ↗** |
| Dragon's Lair | `dragons-lair` | Strategy | in-app |
| Dragon's Memory | `dragons-memory` | Puzzle | in-app |
| Dragon, Knight & Mage | `dragon-knight-mage` | Casual | in-app |
| Dragon's Realm | `dragons-realm` | Strategy | in-app |
| Dragon's Riddle | `dragons-riddle` | Casual | in-app |

For the 7 in-app games, folder name, route slug, and display title are always identical.

## External games (hub-and-spoke)

Ember Wyrm, Dragon Flight, and Drakebreaker are each a complete, independent website — not React components in this codebase, and not iframes. Every "Play" entry point (card hover overlay, mobile quick-link, hero button, details-page button) opens the game's own URL in a new tab.

- `GameMeta` in `data/games.ts` has an optional `externalUrl`. When set, `hasScore` is `false` (the platform can't observe a score it doesn't render) and the game is *not* in `games/registry.tsx`.
- `GameCard`, `GameHero`, and `GameDetails` render a real `<a href={externalUrl} target="_blank" rel="noopener noreferrer">` instead of an internal `<Link>`. Card thumbnails still link to the in-app details page, so search, filtering, and "You May Also Like" keep working.
- Landing on `/games/:slug/play` for one of these three shows an honest "lives on its own site" card with the same external link.
- Each ships as its own zip (`ember-wyrm-site`, `dragon-flight-site`, `drakebreaker-site`), buildable with `npm install && npm run build`. All use `vite-plugin-singlefile`, so the built site is one self-contained `dist/index.html`. Each has a `DEPLOY.md`.
- **The `externalUrl` values are placeholders** (`https://ember-wyrm.dracopyrestrike.game`, etc.). Update those three lines in `data/games.ts` once each site is deployed — every entry point reads from that one field.

## Version history

- **v3.0** — Ember Wyrm, Dragon Flight, and Drakebreaker moved to their own separately-built websites; DracoPyre Strike became the hub linking to them.
- **v2.1** — Ember Wyrm's engine replaced with a 10-level dragon arena game *(superseded by v3.0)*.
- **v2.0** — Feedback & Ratings page, footer quick-rate widget.
- **v1.0** — Initial 10-game launch under the DracoPyre Strike brand.

## Feedback & Ratings (new in v2.0)

`/feedback` — a star rating (1–5, `components/StarRating`) plus a categorized message form (Bug / Suggestion / Praise / General). There's no backend to receive submissions server-side, so this is built honestly around that constraint rather than faking a "Sent!" confirmation:

- **Rating** persists locally (`useRating`, key `dracopyre:rating`) so a returning visitor sees their own previous rating — in the footer widget too, since both read the same hook/key.
- **Submitting** composes a `mailto:` link addressed to the studio with the rating, category, and message pre-filled, and opens it in the person's own email client. A **Copy Instead** button covers devices with no configured mail app — it copies the same formatted text to the clipboard.
- **`useFeedbackStatus`** stores only a local marker (timestamp, category, rating) that feedback was sent from this browser before, so the page can say "thanks again" — the message content itself is never persisted anywhere, client or server.
- The footer carries a compact version of the same star widget for a lower-friction quick-rate, linking to `/feedback` for anyone who wants to add a comment.

## Theme

DracoPyre Strike defaults to a **colorful/light** theme — bright background, vivid gradients, built so the game art pops. **Dark mode is opt-in**, toggled from the sun/moon button in the header, and persists per-browser (`dracopyre:theme` in localStorage). A small inline script in `index.html` applies a stored dark preference before first paint, so returning in dark mode never flashes light first.

Both themes are driven entirely by the CSS custom properties in `src/index.css`: `:root` holds the light/colorful values, `[data-theme="dark"]` overrides all of them. Every component reads color through Tailwind tokens (`bg-surface`, `text-textMuted`, etc.) that resolve to these variables — nothing is hardcoded — so the whole site re-themes from those two blocks. The one deliberate exception: Dragon Strike, the only in-app canvas game, keeps a fixed dark viewport regardless of site theme, the same way a video player does — its in-canvas rendering and ready/game-over overlays are intentionally theme-independent for contrast while playing. (The three external games have their own themes on their own sites.)

## Brand assets

- `public/logo-full.png` — the full illustrated lockup (dragon + monogram + wordmark + tagline), background removed. Used in the footer.
- `public/logo-icon.png` — a cropped, un-padded version (dragon + "DS" monogram only, no wordmark) for the compact header logo.
- `public/favicon.svg` — a separate, simplified vector mark (three claw-slash strokes in a fire gradient). The full illustration doesn't stay legible below ~40px, so favicon and the loading-spinner both use this instead.
- All three read from the same CSS custom properties in `src/index.css` for their fire/ember color palette, so the whole site's theme is still changeable from one file.

## How the game registry works

`src/data/games.ts` holds every game's metadata (title, description, category, tags, controls, how-to-play copy, rating/play-count demo stats, scoring direction/unit). `src/games/registry.tsx` maps each game's `slug` to a `React.lazy()` import of its component. The platform — cards, grids, search, the details page, the play page — is built entirely from this data; no page has a game's name hardcoded into its UI.

### Adding a new game

1. Create `src/games/your-game/index.tsx`, default-exporting a component with the shape `({ onScore, soundOn }) => JSX`.
2. Add one entry to `GAME_COMPONENTS` in `src/games/registry.tsx`.
3. Add one metadata object to `GAMES` in `src/data/games.ts`.

That's it — the game now has a card, a details page, a play page, shows up in search/category/sort, and can be favorited, all automatically.

## Favorites, Recently Played, High Scores

All three are plain `localStorage`-backed React hooks in `src/hooks/usePlayerData.ts`, namespaced under the `dracopyre:` prefix:

- `dracopyre:favorites` — array of slugs
- `dracopyre:recent` — array of `{ slug, playedAt }`, capped at 12, most recent first
- `dracopyre:scores` — `{ [slug]: number }`, updated only when a new value is actually better (direction-aware)

## Architecture notes for a future backend

Nothing in the UI assumes local data. `src/data/games.ts` and `src/data/categories.ts` are the only files that would need to start returning `fetch()`ed data instead of static arrays; every component consumes them the same way either way. The same is true of the three `localStorage` hooks — swapping their internals for API calls (`POST /api/favorites`, `GET /api/profile`, etc.) wouldn't require touching a single page or component, since they already return the same `{ value, actions }` shape a server-backed version would.

## Multiplayer, later

Dragon's Realm and Dragon, Knight & Mage are local (pass-and-play / vs-CPU) today by design (Section 39 of the brief). Nothing about their state shape blocks adding a WebSocket-backed room/matchmaking layer later — the "Multiplayer" category exists in `categories.ts` today specifically as a placeholder for that.

## Known limitations

- **Demo data**: ratings and play counts in `games.ts` are structured placeholders, not live analytics — clearly commented as such in the file.
- **No account system**: by design for v1 (per the brief). All personalization is per-browser.
- **The 3 external games' `externalUrl` values are placeholders** until each site is deployed and those 3 lines in `games.ts` are updated; until then their Play links don't resolve.
- **Canvas rendering isn't DPR-aware**: Dragon Strike (the one remaining in-app canvas game) renders at a fixed internal resolution rather than scaling for device pixel ratio, so they can look slightly soft on very high-DPI displays.
- **4 categories are intentionally empty** (Adventure, Racing, Sports, Multiplayer) — there's no game in them yet, and the empty state says so honestly rather than faking content.
- **No automated test suite ships in the repo.** The build was verified via a clean TypeScript compile, a clean production build, and a scripted runtime smoke test (mounting every route, including all 10 play pages and an actual theme-toggle click, in a real React root) during development — but that harness wasn't included here, since it wasn't part of the spec.
- **Theme colors were verified by code review and a DOM-level smoke test (data-theme attribute + localStorage), not a real rendered screenshot** — this sandbox has no working headless browser (Chromium here is a snap-only package with no snapd, and Puppeteer/Playwright's own browser downloads aren't reachable on this network). The color values were chosen for solid contrast on paper; if anything reads too light/too saturated in practice, it's a one-block fix in `src/index.css`.

## Recommended next steps

1. Wire `data/games.ts` to a real `/api/games` endpoint (schema is already shaped for it).
2. Add DPR-aware canvas scaling for crisper rendering on high-density screens.
3. Server-validate high scores before any public leaderboard ships (never trust client scores for that).
4. Expand categories that are currently empty as new games are added.
5. Add automated tests (the smoke-test approach used during development — mounting each route in jsdom — is a reasonable starting point for a real suite).
