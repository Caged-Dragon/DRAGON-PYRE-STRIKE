import { getLeaderboard, listUnlockedAchievements, supabase, unlockRealmAchievement } from "../dps";
import { store } from '../dps';

const GAME = "dragon-strike";

/* ============================================================ */
/*  Native bridge detection                                      */
/* ============================================================ */

/**
 * When Dragon Strike is shipped inside a native shell (Google Play Games for PC,
 * an Android WebView, or a Cordova/Capacitor build), the host injects a bridge
 * object. We detect the common shapes so the same calls work everywhere.
 */
interface NativePlayGamesBridge {
  signIn: () => Promise<{ id: string; displayName: string }>;
  signOut: () => Promise<void>;
  submitScore: (leaderboardId: string, score: number) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  showLeaderboards: () => Promise<void>;
  showAchievements: () => Promise<void>;
}

declare global {
  interface Window {
    AndroidPlayGames?: NativePlayGamesBridge;
    PlayGamesBridge?: NativePlayGamesBridge;
    webkit?: {
      messageHandlers?: {
        playGames?: { postMessage: (payload: string) => void };
      };
    };
  }
}

function readBridge(): NativePlayGamesBridge | null {
  if (typeof window === "undefined") return null;
  return window.AndroidPlayGames ?? window.PlayGamesBridge ?? null;
}

export function hasNativeBridge() {
  return readBridge() !== null;
}

/** True when running inside the Google Play Games for PC / Android shell. */
export function isPlayGamesEnvironment() {
  if (typeof window === "undefined") return false;
  if (hasNativeBridge()) return true;
  const ua = navigator.userAgent || "";
  return /PlayGames|GooglePlayGames/i.test(ua);
}

/* ============================================================ */
/*  Platform providers                                           */
/* ============================================================ */

export type PlatformId = "google" | "play_games" | "apple" | "discord" | "github";

export interface PlatformSignInResult {
  ok: boolean;
  /** Handled by the native bridge rather than a browser redirect. */
  native?: boolean;
  message?: string;
}

/**
 * Signs in with a platform identity provider.
 *
 * On the web this routes through Supabase OAuth (Google, Apple, Discord, GitHub).
 * Inside a Play Games shell it uses the native bridge instead, so the player
 * never sees a browser redirect.
 */
export async function signInWithPlatform(platform: PlatformId): Promise<PlatformSignInResult> {
  const bridge = readBridge();

  if (platform === "play_games" && bridge) {
    try {
      await bridge.signIn();
      return { ok: true, native: true };
    } catch {
      return { ok: false, message: "Google Play Games sign-in was cancelled." };
    }
  }

  if (!supabase) {
    return {
      ok: false,
      message: "Cloud sign-in needs Supabase keys. Local progress is still saved on this device.",
    };
  }

  // Supabase OAuth provider mapped from the platform id.
  const provider = platform === "play_games" ? "google" : platform;
  const redirectTo = `${window.location.origin}${window.location.pathname}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, scopes: platform === "google" ? "email profile" : undefined },
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/* ============================================================ */
/*  Achievements                                                 */
/* ============================================================ */

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  /** Points, in the Google Play Games style. */
  points: number;
  icon: string;
  /** Google Play Games achievement id, used when the native bridge exists. */
  nativeId?: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_flight", name: "First Flight", description: "Take to the skies for the first time.", points: 10, icon: "flame" },
  { id: "wave_five", name: "Sky Warden", description: "Reach wave 5 in Endless mode.", points: 20, icon: "shield" },
  { id: "wave_ten", name: "Storm Rider", description: "Reach wave 10 in Endless mode.", points: 40, icon: "storm" },
  { id: "slayer_100", name: "Drake Slayer", description: "Destroy 100 enemy drakes.", points: 20, icon: "sword" },
  { id: "slayer_500", name: "Brood Breaker", description: "Destroy 500 enemy drakes.", points: 50, icon: "sword" },
  { id: "boss_first", name: "Titan Feller", description: "Defeat your first realm guardian.", points: 30, icon: "crown" },
  { id: "boss_five", name: "Realm Breaker", description: "Defeat 5 realm guardians.", points: 60, icon: "crown" },
  { id: "boss_all", name: "Ancient Slayer", description: "Defeat all 12 realm guardians.", points: 120, icon: "crown" },
  { id: "perfect_breath", name: "Perfect Lungs", description: "Finish a realm without ever becoming winded.", points: 40, icon: "wind" },
  { id: "full_roster", name: "Dragon Lord", description: "Awaken all 8 dragons.", points: 100, icon: "dragon" },
  { id: "three_stars", name: "Flawless Victory", description: "Earn 3 stars on any realm.", points: 40, icon: "star" },
  { id: "all_stars", name: "Constellation Complete", description: "Earn 3 stars on every realm.", points: 200, icon: "star" },
  { id: "hoard_10k", name: "Hoard Keeper", description: "Bank a single-run score of 10,000.", points: 30, icon: "coin" },
  { id: "hoard_50k", name: "Vault of Ash", description: "Bank a single-run score of 50,000.", points: 90, icon: "coin" },
];

const UNLOCKED_KEY = "dragon-strike-achievements";

export function readUnlockedAchievements(): string[] {
  try {
    const raw = store.getItem(UNLOCKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeUnlockedAchievements(ids: string[]) {
  try {
    store.setItem(UNLOCKED_KEY, JSON.stringify(ids));
  } catch {
    // Ignore write failures.
  }
}

/** Unlocks an achievement. Returns true when this call was the one that unlocked it. */
export async function unlockAchievement(id: string): Promise<boolean> {
  const def = ACHIEVEMENTS.find((achievement) => achievement.id === id);
  if (!def) return false;

  const unlocked = readUnlockedAchievements();
  if (unlocked.includes(id)) return false;
  unlocked.push(id);
  writeUnlockedAchievements(unlocked);

  // Route to the platform the player is signed in on.
  const bridge = readBridge();
  if (bridge && def.nativeId) {
    try {
      await bridge.unlockAchievement(def.nativeId);
    } catch {
      // Non-fatal: the achievement is still recorded locally.
    }
    return true;
  }

  // Central account: first unlock awards Realm XP; guests are synced after sign-in (syncAchievements).
  void unlockRealmAchievement(GAME, id);

  return true;
}

/* ============================================================ */
/*  Leaderboards                                                 */
/* ============================================================ */

export const LEADERBOARD_ID = "dragon_strike_endless";

/** Native Play Games score submit. The cloud (central) score is recorded by saveRun() with full run details. */
export async function submitScore(score: number) {
  if (score <= 0) return;
  const bridge = readBridge();
  if (!bridge) return;
  try {
    await bridge.submitScore(LEADERBOARD_ID, Math.round(score));
  } catch {
    // The central leaderboard already has the score.
  }
}

/** After sign-in: merge locally-unlocked achievements with the account (both directions). */
export async function syncAchievements(): Promise<void> {
  const cloud = await listUnlockedAchievements(GAME);
  const cloudSet = new Set(cloud);
  for (const def of ACHIEVEMENTS) {
    let local = false;
    try {
      local = store.getItem(`ds-ach-${def.id}`) === "1";
    } catch {
      local = false;
    }
    if (cloudSet.has(def.id) && !local) {
      try {
        store.setItem(`ds-ach-${def.id}`, "1");
      } catch {
        // Ignore storage failures.
      }
    } else if (local && !cloudSet.has(def.id)) {
      await unlockRealmAchievement(GAME, def.id);
    }
  }
}

export async function showLeaderboards() {
  const bridge = readBridge();
  if (bridge) {
    try {
      await bridge.showLeaderboards();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function showAchievements() {
  const bridge = readBridge();
  if (bridge) {
    try {
      await bridge.showAchievements();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export interface LeaderboardRow {
  rank: number;
  username: string;
  score: number;
  isYou?: boolean;
}

/** Central Dragon Realm leaderboard with an offline fallback so the board is never empty. */
export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const rows = await getLeaderboard(GAME, 12);
    if (rows.length > 0) {
      const { data } = await supabase.auth.getSession();
      const me = data.session?.user?.id;
      return rows.map((row) => ({
        rank: Number(row.rank),
        username: row.display_name || row.username || "Sky Lord",
        score: Number(row.best_score) || 0,
        isYou: row.user_id === me,
      }));
    }
  } catch {
    // Fall through to the local board.
  }

  const local = Number(store.getItem("dragon-strike-hi") || 0);
  const seed: LeaderboardRow[] = [
    { rank: 1, username: "Ignis-Bane", score: 68400 },
    { rank: 2, username: "FrostWyrm_99", score: 52100 },
    { rank: 3, username: "StormCaller", score: 41800 },
    { rank: 4, username: "AcidClaw", score: 32900 },
    { rank: 5, username: "VoidKnight", score: 25400 },
  ];
  if (local > 0) {
    seed.push({ rank: 0, username: "You", score: local, isYou: true });
    seed.sort((a, b) => b.score - a.score);
    seed.forEach((row, index) => {
      row.rank = index + 1;
    });
  }
  return seed;
}
