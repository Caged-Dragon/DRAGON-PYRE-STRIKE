import { useSyncExternalStore } from 'react';

/**
 * One theme choice for the whole Dragon Realm.
 *   dragon  = the dark, fiery look (the hub's "Dragonforge")
 *   classic = the clean, light look (the hub's light theme)
 *
 * Every site paints the same two attributes on <html>:
 *   data-realm-theme="dragon|classic"   (use this in new CSS)
 *   data-theme="dark|light"             (legacy name the hub and shooter CSS already read)
 *
 * Where the choice lives:
 *   signed in -> the account (player_settings.data.theme), so it follows you to every site
 *   guest     -> nowhere. It is carried in the link (?theme=classic) when you hop between
 *                sites and is kept in memory only; a fresh visit starts as "dragon".
 */
export type RealmTheme = 'dragon' | 'classic';
export const REALM_THEMES: readonly RealmTheme[] = ['dragon', 'classic'];
export const DEFAULT_THEME: RealmTheme = 'dragon';

export const isRealmTheme = (v: unknown): v is RealmTheme => v === 'dragon' || v === 'classic';

function themeFromUrl(): RealmTheme | null {
  try {
    const v = new URLSearchParams(window.location.search).get('theme');
    return isRealmTheme(v) ? v : null;
  } catch {
    return null;
  }
}

let current: RealmTheme = typeof window !== 'undefined' ? themeFromUrl() ?? DEFAULT_THEME : DEFAULT_THEME;
const subscribers = new Set<() => void>();
let persister: ((t: RealmTheme) => void) | null = null;

function paint(t: RealmTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-realm-theme', t);
  root.setAttribute('data-theme', t === 'dragon' ? 'dark' : 'light');
  root.style.colorScheme = t === 'dragon' ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dragon' ? '#0a080a' : '#fdfaf6');
}

/** Keep the choice in the address bar so a refresh (or a shared link) keeps it — no storage involved. */
function syncUrl(t: RealmTheme): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('theme') === t) return;
    url.searchParams.set('theme', t);
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    /* non-browser or sandboxed — ignore */
  }
}

export function getRealmTheme(): RealmTheme {
  return current;
}

/** Change the theme everywhere on this page. Signed-in players also save it to their account. */
export function setRealmTheme(t: RealmTheme, opts: { persist?: boolean } = {}): void {
  if (!isRealmTheme(t)) return;
  if (t !== current) {
    current = t;
    paint(t);
    syncUrl(t);
    subscribers.forEach((fn) => fn());
  }
  if (opts.persist !== false) persister?.(t);
}

/** Used by the auth layer to save the choice to the account (or stop doing so on sign-out). */
export function registerThemePersister(fn: ((t: RealmTheme) => void) | null): void {
  persister = fn;
}

/** React hook: `[theme, setTheme]`. Re-renders every consumer when the theme changes. */
export function useRealmTheme(): [RealmTheme, (t: RealmTheme) => void] {
  const theme = useSyncExternalStore(
    (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    getRealmTheme,
    () => DEFAULT_THEME,
  );
  return [theme, setRealmTheme];
}

/** Adds the current theme to a link so the next site opens in the same theme (works for guests too). */
export function withTheme(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set('theme', current);
    return u.toString();
  } catch {
    return url;
  }
}

/** onClick/onAuxClick helper for plain <a href> links to other sites: stamps the current theme onto the link. */
export function themeLink(e: { currentTarget: HTMLAnchorElement }): void {
  e.currentTarget.href = withTheme(e.currentTarget.href);
}

paint(current);
