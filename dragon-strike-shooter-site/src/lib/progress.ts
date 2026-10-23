import { loadCloudSave, queueCloudSave, reportRun, writeCloudSave } from "../dps";

const GAME = "dragon-strike";
const SLOT = "progress";
import { isDragonId, type DragonId } from "../game/dragons";
import type { GameMode } from "../game/engine";
import { MAX_LEVEL } from "../game/levels";
import { store } from '../dps';

export interface PlayerProgress {
  highScore: number;
  /** Highest campaign realm the player may enter. */
  highestLevel: number;
  selectedDragon: DragonId;
  totalRuns: number;
  /** Best score per realm, keyed by level id — drives the star ratings. */
  levelScores: Record<string, number>;
}

export interface RunRecord {
  mode: GameMode;
  score: number;
  wave: number;
  level: number;
  dragonId: DragonId;
  result: "fallen" | "victory";
}

const EMPTY: PlayerProgress = {
  highScore: 0,
  highestLevel: 1,
  selectedDragon: "ember",
  totalRuns: 0,
  levelScores: {},
};

const LOCAL_KEY = "dragon-strike-progress-v3";

function clampLevel(value: unknown) {
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(value) || 1)));
}

function readScores(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const level = Number(key);
    const score = Number(value);
    if (Number.isFinite(level) && Number.isFinite(score) && score > 0) out[String(level)] = score;
  }
  return out;
}

export function readLocalProgress(): PlayerProgress {
  try {
    const raw = JSON.parse(store.getItem(LOCAL_KEY) || "{}") as Partial<PlayerProgress>;
    const legacyHighScore = Number(store.getItem("dragon-strike-hi") || 0) || 0;
    return {
      highScore: Math.max(0, legacyHighScore, Number(raw.highScore) || 0),
      highestLevel: clampLevel(raw.highestLevel),
      selectedDragon: isDragonId(raw.selectedDragon) ? raw.selectedDragon : "ember",
      totalRuns: Math.max(0, Number(raw.totalRuns) || 0),
      levelScores: readScores(raw.levelScores),
    };
  } catch {
    return { ...EMPTY, levelScores: {} };
  }
}

export function writeLocalProgress(progress: PlayerProgress) {
  try {
    store.setItem(LOCAL_KEY, JSON.stringify(progress));
  } catch {
    // A private browser may deny storage; gameplay still works for the session.
  }
}

/** Progress lives in the central `game_saves` table (slot "progress"); scores go to the shared leaderboard. */
export async function loadCloudProgress(_userId: string): Promise<PlayerProgress | null> {
  const cloud = await loadCloudSave<Partial<PlayerProgress>>(GAME, SLOT);
  if (!cloud) return null;
  const data = cloud.data ?? {};
  return {
    highScore: Number(data.highScore) || 0,
    highestLevel: clampLevel(data.highestLevel),
    selectedDragon: isDragonId(data.selectedDragon) ? data.selectedDragon : "ember",
    totalRuns: Number(data.totalRuns) || 0,
    levelScores: readScores(data.levelScores),
  };
}

export async function saveRun(userId: string | null, current: PlayerProgress, run: RunRecord): Promise<PlayerProgress> {
  const previousBest = current.levelScores?.[String(run.level)] ?? 0;
  const levelScores = { ...(current.levelScores ?? {}) };
  if (run.mode === "levels") {
    levelScores[String(run.level)] = Math.max(previousBest, run.score);
  }

  const next: PlayerProgress = {
    highScore: Math.max(current.highScore, run.score),
    highestLevel:
      run.mode === "levels" && run.result === "victory"
        ? Math.min(MAX_LEVEL, Math.max(current.highestLevel, run.level + 1))
        : current.highestLevel,
    selectedDragon: run.dragonId,
    totalRuns: current.totalRuns + 1,
    levelScores,
  };
  writeLocalProgress(next);

  // One call records the run on the central leaderboard (guests are posted after they sign in).
  if (run.score > 0) {
    void reportRun(GAME, run.score, { mode: run.mode, wave: run.wave, level: run.level, dragonId: run.dragonId, result: run.result });
  }
  if (userId) await writeCloudSave(GAME, SLOT, next);
  return next;
}

export async function saveDragonChoice(userId: string | null, progress: PlayerProgress, dragonId: DragonId) {
  const next = { ...progress, selectedDragon: dragonId };
  writeLocalProgress(next);
  if (userId) queueCloudSave(GAME, SLOT, next);
  return next;
}

export async function syncProgress(userId: string, progress: PlayerProgress) {
  writeLocalProgress(progress);
  if (userId) await writeCloudSave(GAME, SLOT, progress);
}
