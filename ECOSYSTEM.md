# How the sites connect

- **Hub -> game**: catalogue links come from `siteUrl(slug)` in `shared/dps/config.ts` and carry `?theme=`.
- **Game -> hub**: the dock's "Exit to DracoPyre Strike" and each game's own "Realm hub" button (`exitToHub`).
- **Scores**: games call `reportRun(slug, score, meta)`; a database function validates it and updates the leaderboard,
  XP and play counts. Guests' runs are never stored.
- **Saved data**: games use `store.getItem/setItem` (same shape as localStorage). Guests: memory only. Signed in: synced to
  `game_saves` (slot `kv`); the hub's own preferences and every player's theme go in `player_settings.data`.
- **Theme**: `useRealmTheme()` -> `'dragon' | 'classic'`; also sets `<html data-realm-theme>` and the legacy `data-theme`
  (`dark` / `light`).
- **Feedback**: `submitFeedback()` inserts into `feedback` (guests allowed; the database rate-limits per person).
