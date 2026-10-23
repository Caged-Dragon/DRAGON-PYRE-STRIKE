import { supabase } from './client';
import { HUB_SLUG } from './config';
import { isRealmTheme, setRealmTheme, getRealmTheme, registerThemePersister, type RealmTheme } from './theme';

/**
 * `store` has the same getItem / setItem / removeItem shape as `localStorage`, so games swap one for
 * the other without restructuring.
 *
 *   guest   -> plain memory. Nothing is written anywhere; a refresh starts clean.
 *   signed in -> the same memory, mirrored to the account:
 *               games -> game_saves   (game_slug = this site, slot 'kv')
 *               hub   -> player_settings.data.hub
 *
 * The auth layer calls hydrateStore() BEFORE the app renders, so reads are always synchronous.
 */

type Bag = Record<string, string>;
type Json = Record<string, unknown>;

const KV_SLOT = 'kv';
const WRITE_DELAY_MS = 800;
const HYDRATE_TIMEOUT_MS = 7000;

let bag: Bag = {};
let settings: Json = {}; // player_settings.data (theme, hub bag)
let uid: string | null = null;
let site = '';
let canSync = false; // false until the account's data loaded OK — never overwrite it with an empty bag
let bagDirty = false;
let settingsDirty = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function toBag(v: unknown): Bag {
  const out: Bag = {};
  if (isObj(v)) for (const [k, val] of Object.entries(v)) if (typeof val === 'string') out[k] = val;
  return out;
}

function schedule(): void {
  if (!uid || !canSync) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flushStore(), WRITE_DELAY_MS);
}

export const store = {
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(bag, key) ? bag[key] : null;
  },
  setItem(key: string, value: string): void {
    const next = String(value);
    if (bag[key] === next) return;
    bag[key] = next;
    bagDirty = true;
    schedule();
  },
  removeItem(key: string): void {
    if (!(key in bag)) return;
    delete bag[key];
    bagDirty = true;
    schedule();
  },
};

/** Write anything pending right now (also runs when the tab is hidden or closed). */
export async function flushStore(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!uid || !canSync) return;
  const userId = uid;
  const writes: PromiseLike<unknown>[] = [];

  if (site === HUB_SLUG && bagDirty) {
    settings = { ...settings, hub: { ...bag } };
    settingsDirty = true;
  }
  if (settingsDirty) {
    settingsDirty = false;
    writes.push(
      supabase
        .from('player_settings')
        .upsert({ user_id: userId, data: settings }, { onConflict: 'user_id' })
        .then(({ error }) => error && console.warn('[dps] settings not saved:', error.message)),
    );
  }
  if (site !== HUB_SLUG && bagDirty) {
    writes.push(
      supabase
        .from('game_saves')
        .upsert({ user_id: userId, game_slug: site, slot: KV_SLOT, version: 1, data: bag }, { onConflict: 'user_id,game_slug,slot' })
        .then(({ error }) => error && console.warn('[dps] game data not saved:', error.message)),
    );
  }
  bagDirty = false;
  await Promise.all(writes);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushStore();
  });
  window.addEventListener('pagehide', () => void flushStore());
}

registerThemePersister((t: RealmTheme) => {
  if (!uid || !canSync) return;
  settings = { ...settings, theme: t };
  settingsDirty = true;
  schedule();
});

/**
 * Load (or clear) the store for this visitor. Called by <AuthProvider> whenever the signed-in user changes.
 * Always resolves within a few seconds; if the account can't be reached the game still runs, just without cloud sync.
 */
export async function hydrateStore(userId: string | null, siteSlug: string): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  uid = userId;
  site = siteSlug;
  bag = {};
  settings = {};
  canSync = false;
  bagDirty = false;
  settingsDirty = false;
  if (!userId) return;

  let timedOut = false;
  const load = (async () => {
    const isHub = siteSlug === HUB_SLUG;
    const [s, k] = await Promise.all([
      supabase.from('player_settings').select('data').eq('user_id', userId).maybeSingle(),
      isHub
        ? Promise.resolve({ data: null, error: null })
        : supabase.from('game_saves').select('data').eq('user_id', userId).eq('game_slug', siteSlug).eq('slot', KV_SLOT).maybeSingle(),
    ]);
    if (timedOut) return;
    if (s.error) throw new Error(s.error.message);
    if (k.error) throw new Error(k.error.message);
    settings = isObj(s.data?.data) ? { ...(s.data!.data as Json) } : {};
    bag = toBag(isHub ? settings.hub : k.data?.data);
    canSync = true;
    // The account's saved theme wins over whatever the link said.
    if (isRealmTheme(settings.theme)) setRealmTheme(settings.theme, { persist: false });
    else if (getRealmTheme() !== 'dragon') {
      // First sign-in after choosing a theme as a guest: keep their choice and save it to the account.
      settings = { ...settings, theme: getRealmTheme() };
      settingsDirty = true;
      schedule();
    }
  })();

  try {
    await Promise.race([
      load,
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), HYDRATE_TIMEOUT_MS)),
    ]);
  } catch (e) {
    timedOut = true;
    canSync = false;
    console.warn('[dps] could not load account data — playing without cloud sync:', (e as Error).message);
  }
}
