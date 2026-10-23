import { store } from '../dps';
import type {
  AIDifficulty,
  BoardSize,
  GameMode,
  GameSettings,
  GameVariant,
  Player,
  SettingsTab,
  ThemeId,
  TurnTimerOption,
} from "../types/game";

export const SETTINGS_STORAGE_KEY = "ttt_settings_v1";
const SETTINGS_TAB_KEY = "ttt_settings_tab_v1";
const LEGACY_NAMES_KEY = "ttt_names_v2";

export const MAX_NAME_LENGTH = 14;

export const DEFAULT_SETTINGS: GameSettings = {
  gameMode: "ai",
  humanSide: "X",
  aiDifficulty: "tactical",
  boardSize: 3,
  variant: "standard",
  turnTimer: 0,
  playerNames: { X: "", O: "" },
  alternateStarter: true,
  theme: "classic",
  showCoordinates: true,
  highlightLastMove: true,
  animations: true,
  confetti: true,
  soundEnabled: true,
  volume: 80,
  hintsEnabled: true,
  undoEnabled: true,
};

export const DIFFICULTY_LABEL: Record<AIDifficulty, string> = {
  casual: "Casual",
  tactical: "Tactical",
  unbeatable: "Master",
};

export const DIFFICULTY_DESCRIPTION: Record<AIDifficulty, string> = {
  casual: "Relaxed opponent that makes friendly mistakes",
  tactical: "Blocks your threats but can slip occasionally",
  unbeatable: "Near-perfect play — bring your best strategy",
};

const SETTINGS_TABS: readonly SettingsTab[] = [
  "gameplay",
  "players",
  "appearance",
  "audio",
  "data",
];

function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function cleanName(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_NAME_LENGTH) : "";
}

/** Validates anything read from storage so a corrupted value can never break the game. */
export function sanitizeSettings(raw: unknown): GameSettings {
  const d = DEFAULT_SETTINGS;
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const names = (
    s.playerNames && typeof s.playerNames === "object" ? s.playerNames : {}
  ) as Record<string, unknown>;
  const volume =
    typeof s.volume === "number" && Number.isFinite(s.volume)
      ? Math.round(Math.min(100, Math.max(0, s.volume)))
      : d.volume;

  return {
    gameMode: pick<GameMode>(s.gameMode, ["ai", "pvp"], d.gameMode),
    humanSide: pick<Player>(s.humanSide, ["X", "O"], d.humanSide),
    aiDifficulty: pick<AIDifficulty>(
      s.aiDifficulty,
      ["casual", "tactical", "unbeatable"],
      d.aiDifficulty
    ),
    boardSize: pick<BoardSize>(s.boardSize, [3, 4, 5], d.boardSize),
    variant: pick<GameVariant>(s.variant, ["standard", "infinite"], d.variant),
    turnTimer: pick<TurnTimerOption>(s.turnTimer, [0, 5, 10, 20], d.turnTimer),
    playerNames: { X: cleanName(names.X), O: cleanName(names.O) },
    alternateStarter: flag(s.alternateStarter, d.alternateStarter),
    theme: pick<ThemeId>(s.theme, ["classic", "dragon"], d.theme),
    showCoordinates: flag(s.showCoordinates, d.showCoordinates),
    highlightLastMove: flag(s.highlightLastMove, d.highlightLastMove),
    animations: flag(s.animations, d.animations),
    confetti: flag(s.confetti, d.confetti),
    soundEnabled: flag(s.soundEnabled, d.soundEnabled),
    volume,
    hintsEnabled: flag(s.hintsEnabled, d.hintsEnabled),
    undoEnabled: flag(s.undoEnabled, d.undoEnabled),
  };
}

export function loadSettings(): GameSettings {
  try {
    const saved = store.getItem(SETTINGS_STORAGE_KEY);
    if (saved) return sanitizeSettings(JSON.parse(saved));
    // Carry over player names saved by earlier versions of the game
    const legacyNames = store.getItem(LEGACY_NAMES_KEY);
    if (legacyNames) return sanitizeSettings({ playerNames: JSON.parse(legacyNames) });
  } catch {
    // Storage unavailable or unreadable — fall back to defaults
  }
  return { ...DEFAULT_SETTINGS, playerNames: { ...DEFAULT_SETTINGS.playerNames } };
}

export function saveSettings(settings: GameSettings): void {
  try {
    store.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be blocked (private mode) — settings still apply for this session
  }
}

export function loadSettingsTab(): SettingsTab {
  try {
    return pick<SettingsTab>(store.getItem(SETTINGS_TAB_KEY), SETTINGS_TABS, "gameplay");
  } catch {
    return "gameplay";
  }
}

export function saveSettingsTab(tab: SettingsTab): void {
  try {
    store.setItem(SETTINGS_TAB_KEY, tab);
  } catch {
    // Ignore storage errors
  }
}

/** Short human-readable chips describing the current match rules. */
export function summarizeMatch(
  s: Pick<
    GameSettings,
    "gameMode" | "aiDifficulty" | "humanSide" | "boardSize" | "variant" | "turnTimer"
  >
): string[] {
  return [
    s.gameMode === "ai" ? `vs ${DIFFICULTY_LABEL[s.aiDifficulty]} AI` : "2 Players",
    ...(s.gameMode === "ai" ? [`You play ${s.humanSide}`] : []),
    `${s.boardSize}×${s.boardSize}`,
    s.variant === "infinite" ? "Infinite" : "Standard",
    s.turnTimer ? `${s.turnTimer}s clock` : "No clock",
  ];
}
