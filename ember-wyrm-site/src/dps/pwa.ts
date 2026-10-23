import { useSyncExternalStore } from 'react';

/**
 * Install-as-app support shared by every Realm site.
 * A browser can only install the site you are on, so each game is its own installable app, and the hub's Store
 * sends people to a game with `?install=1`, which opens the install sheet there (see InstallPrompt).
 */

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
export interface InstallState {
  /** The browser has offered a one-tap install. */
  canPrompt: boolean;
  /** Running as an installed app already (or just installed). */
  installed: boolean;
  /** iPhone / iPad: no prompt exists, so we show Share -> Add to Home Screen steps. */
  ios: boolean;
  /** The install sheet is open. */
  helpOpen: boolean;
}

const isBrowser = typeof window !== 'undefined';
const isStandalone = () =>
  isBrowser &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);
const isIOS = () =>
  isBrowser && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

let deferred: InstallEvent | null = null;
let state: InstallState = { canPrompt: false, installed: isStandalone(), ios: isIOS(), helpOpen: false };
const subs = new Set<() => void>();
function set(patch: Partial<InstallState>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
}

if (isBrowser) {
  // This fires early (before React renders), so it must be captured at module load.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    set({ canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    set({ canPrompt: false, installed: true });
  });

  // `?install=1` (from the hub's Store): open the install sheet once, then tidy the address bar.
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('install') === '1') {
      url.searchParams.delete('install');
      window.history.replaceState(window.history.state, '', url.toString());
      if (!state.installed) state = { ...state, helpOpen: true };
    }
  } catch {
    /* ignore */
  }

  // Offline support. Production builds only, so local development is never cached.
  const env = (import.meta as unknown as { env?: { PROD?: boolean } }).env;
  if ('serviceWorker' in navigator && env?.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('[dps] service worker not registered:', e));
    });
  }
}

export function usePwaInstall() {
  const s = useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => state,
    () => state,
  );
  return {
    ...s,
    /** One-tap install when the browser allows it; otherwise opens the how-to sheet. */
    install: async (): Promise<'accepted' | 'dismissed' | 'help'> => {
      if (!deferred) {
        set({ helpOpen: true });
        return 'help';
      }
      const ev = deferred;
      deferred = null;
      set({ canPrompt: false });
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      if (outcome === 'accepted') set({ installed: true, helpOpen: false });
      return outcome;
    },
    openHelp: () => set({ helpOpen: true }),
    closeHelp: () => set({ helpOpen: false }),
  };
}

/** Adds `install=1` (and the theme) to a game's address so it opens ready to install. */
export function withInstall(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set('install', '1');
    return u.toString();
  } catch {
    return url;
  }
}
