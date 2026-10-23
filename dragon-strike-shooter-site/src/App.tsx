import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Engine, drawDragon, type GameMode, type HudState } from "./game/engine";
import { DRAGONS, dragonById, RARITY_LABEL, type DragonDefinition, type DragonId } from "./game/dragons";
import { LEVELS, MAX_LEVEL, starsForScore } from "./game/levels";
import { useAuth } from "./lib/useAuth";
import { DragonDock, exitToHub } from "./dps";
import { useTheme } from "./lib/theme";
import { store } from './dps';
import {
  loadCloudProgress,
  readLocalProgress,
  saveDragonChoice,
  saveRun,
  syncProgress,
  type PlayerProgress,
} from "./lib/progress";
import {
  ACHIEVEMENTS,
  fetchLeaderboard,
  isPlayGamesEnvironment,
  signInWithPlatform,
  submitScore,
  syncAchievements,
  unlockAchievement,
  type LeaderboardRow,
  type PlatformId,
} from "./lib/playGames";

type MenuScreen = "home" | "auth" | "hangar" | "modes" | "levels" | "records";

const INITIAL_HUD: HudState = {
  phase: "menu",
  score: 0,
  hi: 0,
  wave: 0,
  lives: 3,
  power: 1,
  shield: false,
  boss: null,
  banner: null,
  bannerId: 0,
  muted: false,
  newBest: false,
  bossWave: false,
  mode: "endless",
  level: 1,
  levelWave: 0,
  levelWaves: 3,
  activeDragon: "ember",
  switchCooldown: 0,
  breathPhase: "idle",
  breathStamina: 1,
  breathOutput: 0,
  theme: "dark",
  totalLevels: MAX_LEVEL,
};

/* ---------------- shared glyphs ---------------- */

function FlameMark({ color = "#ff8a2a", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C9.1 7.2 5.8 9.4 6.1 14a5.9 5.9 0 0011.8 0C18.2 9.7 15 7 12 2z" fill={color} stroke="#3d1505" />
      <path d="M12 9c-1.6 2.4-3 3.5-3 5.7a3 3 0 006 0c0-2.2-1.4-3.3-3-5.7z" fill="#fff3c4" />
    </svg>
  );
}

function StarGlyph({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"
        fill={filled ? "#ffc94d" : "none"}
        stroke={filled ? "#8a5a10" : "currentColor"}
        strokeWidth="1.5"
        opacity={filled ? 1 : 0.4}
      />
    </svg>
  );
}

function SoundGlyph({ muted }: { muted: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 9h4l5-5v16l-5-5H4z" fill="currentColor" stroke="none" />
      {muted ? <path d="M16 9l6 6m0-6l-6 6" /> : <><path d="M16.5 8.5a5 5 0 010 7" /><path d="M19 6a9 9 0 010 12" /></>}
    </svg>
  );
}

function ShieldGlyph({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className={active ? "opacity-100" : "opacity-25"} aria-hidden="true">
      <path d="M12 2l9 4v6c0 5.5-3.5 8.8-9 10-5.5-1.2-9-4.5-9-10V6z" fill={active ? "#2dd4bf" : "#71807d"} stroke="#ccfbf1" strokeWidth="1.2" />
    </svg>
  );
}

function SunGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" fill="currentColor" stroke="none" />
      <path d="M12 1.8v2.4M12 19.8v2.4M4.2 12H1.8M22.2 12h-2.4M6.3 6.3L4.6 4.6M19.4 19.4l-1.7-1.7M17.7 6.3l1.7-1.7M4.6 19.4l1.7-1.7" />
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.4 14.9A8.9 8.9 0 019.1 3.6 9 9 0 1020.4 14.9z" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.6-.2-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.3 3.8l-.1.1 3.4 2.6.2.1c2.1-2 3.3-4.9 3.3-8.6z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.6-2.8c-1 .7-2.3 1.2-4 1.2-3.1 0-5.7-2-6.6-4.8l-.1.1-3.6 2.7.1.2C3.7 21.3 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.8c-.3-.8-.4-1.6-.4-2.4s.2-1.7.4-2.4V9.9L1.7 7.2l-.1.1C.6 9.3 0 11 0 12.8s.6 3.5 1.6 5.5l3.8-3.5z" />
      <path fill="#EA4335" d="M12 4.7c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.7 1.3 15.1 0 12 0 7.5 0 3.7 2.4 1.6 5.9l3.8 3c.9-2.8 3.5-4.2 6.6-4.2z" />
    </svg>
  );
}

function PlayGamesGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#34A853" d="M3.6 2.4L14.2 12 3.6 21.6c-.4-.2-.6-.7-.6-1.3V3.7c0-.6.2-1.1.6-1.3z" />
      <path fill="#4285F4" d="M17.4 8.5l3.3 1.9c.8.5.8 1.5 0 2l-3.3 1.9L14.2 12z" />
      <path fill="#EA4335" d="M17.4 8.5L6.8 2.6 14.2 12z" opacity=".9" />
      <path fill="#FBBC05" d="M6.8 2.6c-.4-.2-.9 0-1.1.4L14.2 12z" opacity=".6" />
      <path fill="#EA4335" d="M6.8 21.4L17.4 15.5 14.2 12z" opacity=".7" />
      <path fill="#34A853" d="M5.7 21c.2.4.7.6 1.1.4l8.5-8.4L6.8 21.4z" opacity=".5" />
    </svg>
  );
}

/* ---------------- animated dragon preview ---------------- */

function DragonPreview({ dragon, compact = false }: { dragon: DragonDefinition; compact?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = compact ? 110 : 260;
    const height = compact ? 92 : 190;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    let phase = 0;
    let output = 0;
    let charge = 0;
    const started = performance.now();

    // Idle loop: the dragon periodically breathes so its element is obvious.
    const draw = (now: number) => {
      const elapsed = (now - started) / 1000;
      const cycle = elapsed % 3.4;
      if (cycle < 0.5) charge = cycle / 0.5;
      else if (cycle < 1.0) output = 1 - (cycle - 0.5) / 0.5;
      else {
        charge = 0;
        output = 0;
      }
      phase += 0.02;

      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height * 0.48 + Math.sin(elapsed * 1.5) * 4);
      context.shadowColor = dragon.fireColor;
      context.shadowBlur = compact ? 10 : 22;
      drawDragon(context, compact ? 19 : 38, elapsed * 4, dragon.palette, {
        glowEye: 14,
        spikes: dragon.id === "void" || dragon.id === "venom" || dragon.id === "stone",
        wingStyle: dragon.wingStyle,
        hornStyle: dragon.hornStyle,
        breathing: charge > 0.05 || output > 0.05,
        jawOpen: charge > 0.05 ? 0.4 + charge * 0.3 : output,
        lungGlow: charge > 0.05 ? charge : output * 0.7,
        breathPhase: phase,
      });
      context.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [compact, dragon]);

  return <canvas ref={ref} className={compact ? "h-[72px] w-[86px]" : "h-[150px] w-full max-w-[240px]"} />;
}

function StatLine({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[9px] font-bold tracking-[.18em] opacity-60">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/25" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,.4)" }}>
        {/* segment notches */}
        <span className="pointer-events-none absolute inset-0" style={{ background: "repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(0,0,0,.35) calc(10% - 1px) 10%)" }} />
        <div className="h-full rounded-full" style={{ width: `${value * 10}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 65%, #000), ${color})`, boxShadow: `0 0 10px ${color}` }} />
      </div>
    </div>
  );
}

function MenuBack({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="menu-link flex items-center gap-2 text-sm font-bold tracking-[.16em]">
      <span aria-hidden="true">&larr;</span> BACK
    </button>
  );
}

/** Ornamental heading with flanking molten rules and a rune. */
function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5" aria-hidden="true">
        <span className="h-px w-7" style={{ background: "linear-gradient(90deg, transparent, var(--ds-ember))" }} />
        <FlameMark color="var(--ds-ember)" size={13} />
        <span className="hud-label text-[9px] font-bold tracking-[.28em] opacity-75">{eyebrow}</span>
      </div>
      <h2 className="mt-1.5 font-display text-4xl leading-[.85] sm:text-6xl" style={{ color: "var(--ds-gold)", textShadow: "0 2px 18px rgba(255,120,30,.35)" }}>
        {title}
      </h2>
      {sub && <p className="mt-2 max-w-lg text-sm opacity-70">{sub}</p>}
    </div>
  );
}

function Lives({ count }: { count: number }) {
  return (
    <div className="flex gap-1" aria-label={`${count} lives`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <FlameMark key={index} size={15} color={index < count ? "#ff8a2a" : "#4c3b35"} />
      ))}
    </div>
  );
}

/* ---------------- breath meter ---------------- */

function BreathMeter({ hud }: { hud: HudState }) {
  const pct = Math.round(hud.breathStamina * 100);
  const state =
    hud.breathPhase === "winded"
      ? "is-winded"
      : hud.breathPhase === "inhale"
      ? "is-inhaling"
      : hud.breathOutput > 0.05
      ? "is-blasting"
      : "";
  return (
    <div className="hud-chip flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="hud-label text-[8px] font-bold opacity-70">LUNGS</span>
        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
          {hud.breathPhase === "winded" ? "WINDED" : hud.breathPhase === "inhale" ? "INHALING" : hud.breathPhase === "blast" ? "BLAST" : "READY"}
        </span>
      </div>
      <div className="breath-meter">
        <div className={`breath-meter-fill ${state}`} style={{ width: `${pct}%` }} />
        <div className="breath-meter-output" style={{ opacity: hud.breathOutput }} />
      </div>
    </div>
  );
}

/* ---------------- achievements ---------------- */

interface ToastState {
  id: number;
  name: string;
  description: string;
  points: number;
}

function useAchievements() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  const refresh = useCallback(() => {
    setUnlocked(ACHIEVEMENTS.filter((a) => {
      try {
        return store.getItem(`ds-ach-${a.id}`) === "1";
      } catch {
        return false;
      }
    }).map((a) => a.id));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = useCallback(async (id: string) => {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    let already = false;
    try {
      already = store.getItem(`ds-ach-${id}`) === "1";
    } catch {
      already = false;
    }
    if (already) return;
    try {
      store.setItem(`ds-ach-${id}`, "1");
    } catch {
      // Ignore storage failures.
    }
    setUnlocked((current) => (current.includes(id) ? current : [...current, id]));
    setToast({ id: Date.now(), name: def.name, description: def.description, points: def.points });
    await unlockAchievement(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return { unlocked, unlock, toast, refresh };
}

/* ============================================================ */
/*  App                                                          */
/* ============================================================ */

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const runSerial = useRef(0);
  const savedSerial = useRef(0);

  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [screen, setScreen] = useState<MenuScreen>("home");
  const [progress, setProgress] = useState<PlayerProgress>(() => readLocalProgress());
  const [selectedDragon, setSelectedDragon] = useState<DragonId>(() => readLocalProgress().selectedDragon);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const achievements = useAchievements();
  const playGamesEnv = useMemo(() => isPlayGamesEnvironment(), []);

  // Keep the canvas in step with the selected theme.
  useEffect(() => {
    engineRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new Engine(canvas, setHud);
    engine.setHighScore(progress.highScore);
    engine.setTheme(theme);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setHighScore(progress.highScore);
  }, [progress.highScore]);

  // Merge cloud progress on sign-in.
  useEffect(() => {
    if (!auth.user) return;
    const userId = auth.user.id;
    let cancelled = false;
    void loadCloudProgress(userId).then((cloud) => {
      if (cancelled) return;
      const local = readLocalProgress();
      const merged: PlayerProgress = cloud
        ? {
            highScore: Math.max(local.highScore, cloud.highScore),
            highestLevel: Math.max(local.highestLevel, cloud.highestLevel),
            selectedDragon: cloud.selectedDragon,
            totalRuns: Math.max(local.totalRuns, cloud.totalRuns),
            // Keep the best score for each realm from either device.
            levelScores: Object.fromEntries(
              Array.from(new Set([...Object.keys(local.levelScores), ...Object.keys(cloud.levelScores)])).map((key) => [
                key,
                Math.max(local.levelScores[key] ?? 0, cloud.levelScores[key] ?? 0),
              ])
            ),
          }
        : local;
      setProgress(merged);
      setSelectedDragon(merged.selectedDragon);
      void syncProgress(userId, merged);
      void syncAchievements().then(() => achievements.refresh());
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.id]);

  const dragon = dragonById(selectedDragon);
  const inSession = hud.phase === "playing" || hud.phase === "paused";
  const bossPercent = hud.boss ? Math.max(0, Math.round((hud.boss.hp / hud.boss.max) * 100)) : 0;

  /** Best score achieved on a specific realm, which is what stars are rated against. */
  const levelBest = useCallback(
    (levelId: number) => progress.levelScores?.[String(levelId)] ?? 0,
    [progress.levelScores]
  );

  const earnedStars = useMemo(() => {
    let total = 0;
    for (const level of LEVELS) total += starsForScore(level.id, levelBest(level.id));
    return total;
  }, [levelBest]);

  function startRun(mode: GameMode, level = 1) {
    runSerial.current += 1;
    setSelectedLevel(level);
    engineRef.current?.startGame(mode, selectedDragon, level);
    void achievements.unlock("first_flight");
  }

  function returnHome() {
    engineRef.current?.toMenu();
    setScreen("home");
  }

  function chooseDragon(id: DragonId, duringRun = false) {
    if (duringRun && hud.switchCooldown > 0) return;
    setSelectedDragon(id);
    setProgress((current) => {
      const next = { ...current, selectedDragon: id };
      void saveDragonChoice(auth.user?.id ?? null, current, id);
      return next;
    });
    if (duringRun) engineRef.current?.switchDragon(id);
  }

  // Persist each finished run, unlock achievements, publish the score.
  useEffect(() => {
    if ((hud.phase !== "gameover" && hud.phase !== "victory") || savedSerial.current === runSerial.current || runSerial.current === 0) {
      return;
    }
    savedSerial.current = runSerial.current;
    void saveRun(auth.user?.id ?? null, progress, {
      mode: hud.mode,
      score: hud.score,
      wave: hud.wave,
      level: hud.level,
      dragonId: hud.activeDragon,
      result: hud.phase === "victory" ? "victory" : "fallen",
    }).then((next) => {
      setProgress(next);
      engineRef.current?.setHighScore(next.highScore);
    });

    void submitScore(hud.score);
    void achievements.unlock("hoard_10k");
    if (hud.score >= 50000) void achievements.unlock("hoard_50k");
    if (hud.wave >= 5) void achievements.unlock("wave_five");
    if (hud.wave >= 10) void achievements.unlock("wave_ten");
    if (hud.phase === "victory") {
      void achievements.unlock("boss_first");
      if (starsForScore(hud.level, hud.score) >= 3) void achievements.unlock("three_stars");
      if (hud.level >= MAX_LEVEL) void achievements.unlock("boss_all");
    }
    if (LEVELS.every((entry) => starsForScore(entry.id, progress.levelScores?.[String(entry.id)] ?? 0) >= 3)) {
      void achievements.unlock("all_stars");
    }
    if (DRAGONS.every((entry) => !entry.unlockLevel || progress.highestLevel >= entry.unlockLevel)) {
      void achievements.unlock("full_roster");
    }
  }, [achievements, auth.user?.id, hud, progress]);

  useEffect(() => {
    if (screen === "records") void fetchLeaderboard().then(setLeaderboard);
  }, [screen]);

  async function handlePlatformSignIn(platform: PlatformId) {
    setAuthBusy(true);
    setAuthMessage("");
    const result = await signInWithPlatform(platform);
    setAuthBusy(false);
    if (!result.ok) setAuthMessage(result.message || "That provider did not respond.");
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");
    const result = authMode === "signin" ? await auth.signIn(email, password) : await auth.signUp(email, password, callsign);
    setAuthBusy(false);
    if (!result.ok) {
      setAuthMessage(result.message || "The gate did not open.");
      return;
    }
    if (result.confirmationRequired) {
      setAuthMessage("Check your email to confirm your clan account, then return to sign in.");
      setAuthMode("signin");
      return;
    }
    setScreen("home");
  }

  const panelMotion = {
    initial: { opacity: 0, y: 22, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -14, scale: 0.99 },
    transition: { duration: 0.28 },
  };

  const unlockedCount = DRAGONS.filter((entry) => !entry.unlockLevel || progress.highestLevel >= entry.unlockLevel).length;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <canvas ref={canvasRef} className="game-canvas absolute inset-0 h-full w-full" style={{ cursor: hud.phase === "playing" ? "crosshair" : "default" }} />
      {hud.phase === "menu" && <DragonDock siteSlug="dragon-strike" position="bottom-left" />}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, transparent 15%, var(--ds-overlay) 82%)" }} />

      {/* Achievement toast */}
      <AnimatePresence>
        {achievements.toast && (
          <motion.div
            key={achievements.toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className="achievement-toast"
          >
            <FlameMark color="#ffc94d" size={26} />
            <div className="min-w-0">
              <small>ACHIEVEMENT UNLOCKED · {achievements.toast.points} PTS</small>
              <div className="font-display text-lg leading-tight">{achievements.toast.name}</div>
              <p className="truncate text-[11px] opacity-75">{achievements.toast.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hud.phase === "menu" && (
        <div className="absolute inset-0 z-20 flex flex-col">
          <header className="menu-header flex shrink-0 items-center justify-between px-4 py-3 sm:px-7 lg:px-10">
            <button onClick={() => setScreen("home")} className="font-display text-2xl tracking-wider sm:text-3xl" style={{ color: "var(--ds-gold)" }}>
              DRAGON STRIKE
            </button>
            <nav className="hidden items-center gap-7 md:flex">
              <button onClick={() => setScreen("home")} className="menu-link">HOME</button>
              <button onClick={() => setScreen("hangar")} className="menu-link">DRAGON ROOST</button>
              <button onClick={() => setScreen("modes")} className="menu-link">PLAY</button>
              <button onClick={() => setScreen("records")} className="menu-link">RECORDS</button>
              <button onClick={() => void exitToHub()} className="menu-link">REALM HUB</button>
            </nav>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                {theme === "dark" ? <SunGlyph /> : <MoonGlyph />}
                <span className="hidden sm:inline">{theme === "dark" ? "DAY" : "NIGHT"}</span>
              </button>
              <button onClick={() => setScreen("auth")} className="account-button max-w-[38vw] truncate">
                {auth.loading ? "OPENING..." : auth.user ? auth.displayName : "SIGN IN / GUEST"}
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              {/* ---------- HOME ---------- */}
              {screen === "home" && (
                <motion.section key="home" {...panelMotion} className="menu-stage mx-auto grid min-h-full w-full max-w-[1380px] items-center gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1.25fr_.75fr] lg:px-14">
                  <div className="relative flex flex-col items-start">
                    {/* Ornamental crest */}
                    <div className="mb-3 flex items-center gap-2" aria-hidden="true">
                      <span className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, var(--ds-ember))" }} />
                      <FlameMark color="var(--ds-ember)" size={16} />
                      <span className="hud-label text-[9px] font-bold tracking-[.3em] opacity-75 sm:text-[11px]">EIGHT DRAGONS · TWELVE REALMS</span>
                      <span className="h-px w-8" style={{ background: "linear-gradient(270deg, transparent, var(--ds-ember))" }} />
                    </div>
                    <h1 className="title-ember relative text-[clamp(3.4rem,11vw,9rem)] leading-[.74]">
                      DRAGON<br />STRIKE
                      {/* Under-title molten underline */}
                      <span className="mt-3 block h-[3px] w-40 sm:w-64" style={{ background: "linear-gradient(90deg, var(--ds-ember), var(--ds-gold), transparent)", boxShadow: "0 0 16px rgba(255,140,40,.6)" }} />
                    </h1>
                    <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed opacity-85 sm:text-lg">
                      A dragon does not shoot bullets. It inhales, blasts, and must catch its breath — learn the rhythm of the lungs and the sky is yours.
                    </p>
                    <div
                      className="group mt-5 flex items-center gap-4 rounded-lg border px-4 py-2.5 transition-all duration-200"
                      style={{
                        borderColor: `color-mix(in srgb, ${dragon.accent} 45%, var(--ds-border-soft))`,
                        background: "var(--ds-input-bg)",
                        boxShadow: `0 0 24px color-mix(in srgb, ${dragon.accent} 22%, transparent)`,
                      }}
                    >
                      <div className="flex h-[76px] w-[90px] items-center justify-center rounded" style={{ background: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${dragon.accent} 26%, transparent), transparent 68%)` }}>
                        <DragonPreview dragon={dragon} compact />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[.18em]" style={{ color: dragon.accent }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: dragon.fireColor, boxShadow: `0 0 8px ${dragon.fireColor}` }} />
                          SELECTED DRAGON
                        </div>
                        <div className="font-display text-2xl leading-none" style={{ color: "var(--ds-gold)" }}>{dragon.name}</div>
                        <div className="mt-0.5 text-xs font-semibold" style={{ color: dragon.fireColor }}>{dragon.power}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold tracking-widest opacity-70">
                      <span>BEST HOARD {progress.highScore.toLocaleString()}</span>
                      <span aria-hidden="true" className="opacity-40">◆</span>
                      <span>REALMS {progress.highestLevel - 1}/{MAX_LEVEL} CLEARED</span>
                      <span aria-hidden="true" className="opacity-40">◆</span>
                      <span>ROSTER {unlockedCount}/8</span>
                      <span aria-hidden="true" className="opacity-40">◆</span>
                      <span>{theme === "dark" ? "NIGHT MODE" : "DAY MODE"}</span>
                    </div>
                  </div>

                  <div className="menu-actions flex w-full max-w-lg flex-col justify-self-end">
                    <button onClick={() => setScreen("modes")} className="primary-menu-action group">
                      <span className="text-left"><small>ENTER THE SKIES</small><strong>PLAY</strong></span>
                      <span className="action-arrow">&rarr;</span>
                    </button>
                    <button onClick={() => setScreen("hangar")} className="secondary-menu-action">
                      <span><small>ACTIVE DRAGON</small><strong>{dragon.name}</strong></span>
                      <span className="text-sm font-bold" style={{ color: dragon.accent }}>{dragon.power}</span>
                    </button>
                    <button onClick={() => setScreen("levels")} className="secondary-menu-action">
                      <span><small>CAMPAIGN</small><strong>REALM MAP</strong></span>
                      <span className="text-xs font-bold tracking-widest opacity-70">{progress.highestLevel}/{MAX_LEVEL} OPEN</span>
                    </button>
                    <button onClick={() => setScreen("records")} className="secondary-menu-action">
                      <span><small>ACHIEVEMENTS &amp; RANKS</small><strong>RECORDS</strong></span>
                      <span className="text-xs font-bold tracking-widest opacity-70">{achievements.unlocked.length}/{ACHIEVEMENTS.length}</span>
                    </button>
                    <button onClick={() => void exitToHub()} className="secondary-menu-action">
                      <span><small>DRAGON REALM</small><strong>EXIT TO DRACOPYRE STRIKE</strong></span>
                      <span className="text-xs font-bold tracking-widest opacity-70">HUB</span>
                    </button>
                    <button onClick={() => setScreen("auth")} className="secondary-menu-action">
                      <span><small>CLAN RECORD</small><strong>{auth.user ? auth.displayName : "PLAY AS GUEST"}</strong></span>
                      <span className="text-xs font-bold tracking-widest opacity-70">{auth.user ? auth.provider?.toUpperCase() : "SIGN IN"}</span>
                    </button>
                  </div>
                </motion.section>
              )}

              {/* ---------- DRAGON ROOST ---------- */}
              {screen === "hangar" && (
                <motion.section key="hangar" {...panelMotion} className="mx-auto flex min-h-full w-full max-w-[1380px] flex-col px-4 py-5 sm:px-8 lg:px-12">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <MenuBack onClick={() => setScreen("home")} />
                      <div className="mt-3">
                        <SectionHeading eyebrow="SELECT YOUR RIDE" title="DRAGON ROOST" sub="Eight dragons, eight elements, eight breathing rhythms. Switch again mid-battle." />
                      </div>
                    </div>
                    <button onClick={() => setScreen("modes")} className="btn-ember hidden px-6 py-3 text-xl sm:block">FLY WITH {dragon.name.toUpperCase()}</button>
                  </div>

                  <div className="roost-grid mt-5">
                    {DRAGONS.map((item, index) => {
                      const active = item.id === selectedDragon;
                      const locked = Boolean(item.unlockLevel && progress.highestLevel < item.unlockLevel);
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => !locked && chooseDragon(item.id)}
                          disabled={locked}
                          className={`roost-card ${active ? "is-active" : ""} ${locked ? "is-locked" : ""}`}
                          style={{ "--dragon-accent": item.fireColor } as React.CSSProperties}
                          initial={{ opacity: 0, y: 22 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={locked ? undefined : { y: -5 }}
                        >
                          <span className="rarity-tag">{RARITY_LABEL[item.rarity]}</span>
                          <div className="relative flex min-h-[150px] items-center justify-center">
                            <DragonPreview dragon={item} />
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-bold tracking-[.22em]" style={{ color: item.accent }}>{item.title.toUpperCase()}</span>
                            <h3 className="font-display text-3xl leading-none">{item.name}</h3>
                            <div className="breath-tag mt-1"><FlameMark color={item.fireColor} size={13} /> {item.power}</div>
                            <p className="mt-2 text-[11px] leading-relaxed opacity-70">{item.description}</p>
                            <div className="mt-3 grid gap-1.5">
                              <StatLine label="FORCE" value={item.stats.force} color={item.fireColor} />
                              <StatLine label="SPEED" value={item.stats.speed} color={item.fireColor} />
                              <StatLine label="AIM" value={item.stats.control} color={item.fireColor} />
                              <StatLine label="LUNGS" value={Math.round((1 - item.breath.drain) * 12)} color={item.fireColor} />
                            </div>
                            {locked && (
                              <p className="mt-2 text-[10px] font-bold tracking-widest" style={{ color: "var(--ds-ember)" }}>
                                CLEAR REALM {item.unlockLevel} TO AWAKEN
                              </p>
                            )}
                          </div>
                          {active && <span className="selected-rune">ACTIVE</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                  <button onClick={() => setScreen("modes")} className="btn-ember mt-4 px-6 py-3 text-xl sm:hidden">FLY WITH {dragon.name.toUpperCase()}</button>
                </motion.section>
              )}

              {/* ---------- MODE SELECT ---------- */}
              {screen === "modes" && (
                <motion.section key="modes" {...panelMotion} className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-5 py-6 sm:px-8">
                  <MenuBack onClick={() => setScreen("home")} />
                  <div className="mt-3">
                    <SectionHeading eyebrow="SELECT FLIGHT PATH" title="CHOOSE YOUR WAR" />
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <motion.button whileHover={{ y: -6 }} onClick={() => startRun("endless")} className="mode-choice mode-endless">
                      <div className="mode-number">01</div>
                      <div>
                        <span className="hud-label text-[10px] font-bold text-[#ffb347]">CLASSIC MODE</span>
                        <h3 className="font-display text-4xl sm:text-5xl">ENDLESS SWARM</h3>
                        <p>Survive escalating waves. A guardian descends every fourth wave. The run ends only when your clan falls.</p>
                      </div>
                      <span className="mode-cta">BEGIN ENDLESS RUN &rarr;</span>
                    </motion.button>
                    <motion.button whileHover={{ y: -6 }} onClick={() => setScreen("levels")} className="mode-choice mode-levels">
                      <div className="mode-number">02</div>
                      <div>
                        <span className="hud-label text-[10px] font-bold text-[#c16cff]">CAMPAIGN MODE</span>
                        <h3 className="font-display text-4xl sm:text-5xl">TWELVE REALMS</h3>
                        <p>Designed waves per realm, then a unique guardian. Three-star every realm to awaken all eight dragons.</p>
                      </div>
                      <span className="mode-cta">OPEN REALM MAP &rarr;</span>
                    </motion.button>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs opacity-70" style={{ borderColor: "var(--ds-border-soft)" }}>
                    <span>Flying as <strong style={{ color: dragon.accent }}>{dragon.name}</strong></span>
                    <button onClick={() => setScreen("hangar")} className="font-bold tracking-widest" style={{ color: "var(--ds-gold)" }}>CHANGE DRAGON</button>
                  </div>
                </motion.section>
              )}

              {/* ---------- REALM MAP ---------- */}
              {screen === "levels" && (
                <motion.section key="levels" {...panelMotion} className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
                  <MenuBack onClick={() => setScreen("modes")} />
                  <div className="mt-3">
                    <SectionHeading eyebrow="CAMPAIGN" title="THE TWELVE REALMS" sub="Defeat each guardian to open the next sky. Some guardians awaken new dragons." />
                  </div>
                  {/* Campaign progress rail */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/30" style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,.5)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((progress.highestLevel - 1) / (MAX_LEVEL - 1)) * 100}%`,
                          background: "linear-gradient(90deg, var(--ds-ember), var(--ds-gold))",
                          boxShadow: "0 0 12px rgba(255,140,40,.7)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest opacity-70">{progress.highestLevel - 1}/{MAX_LEVEL - 1} CONQUERED</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {LEVELS.map((item) => {
                      const unlocked = item.id <= progress.highestLevel;
                      const stars = starsForScore(item.id, levelBest(item.id));
                      const reward = item.reward ? DRAGONS.find((entry) => entry.id === item.reward) : null;
                      return (
                        <button
                          key={item.id}
                          disabled={!unlocked}
                          onClick={() => unlocked && startRun("levels", item.id)}
                          className={`realm-card ${unlocked ? "" : "is-locked"}`}
                          style={{ "--level-color": item.theme.skyLow } as React.CSSProperties}
                        >
                          <div className="flex items-start justify-between">
                            <span className="realm-index">{String(item.id).padStart(2, "0")}</span>
                            <span className="realm-stars">
                              {[1, 2, 3].map((star) => <StarGlyph key={star} filled={star <= stars} size={13} />)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <strong className="block font-display text-xl leading-tight">{item.name}</strong>
                            <em className="block truncate text-[10px] not-italic opacity-60">{item.realm}</em>
                          </div>
                          <p className="truncate text-[10px] font-bold tracking-wide" style={{ color: "var(--ds-gold)" }}>
                            {unlocked ? item.boss : "SEALED"}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[9px] font-bold opacity-70">
                            <span>{item.waves} WAVES</span>
                            {reward && <span style={{ color: reward.fireColor }}>◈ {reward.name}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {/* ---------- RECORDS ---------- */}
              {screen === "records" && (
                <motion.section key="records" {...panelMotion} className="mx-auto grid min-h-full w-full max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-2">
                  <div>
                    <MenuBack onClick={() => setScreen("home")} />
                    <div className="mt-3">
                      <SectionHeading eyebrow="FEATS OF GLORY" title="ACHIEVEMENTS" sub={playGamesEnv ? "Google Play Games connected" : "Synced to your clan account"} />
                    </div>
                    {/* Achievement progress bar */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/30" style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,.5)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(achievements.unlocked.length / ACHIEVEMENTS.length) * 100}%`,
                            background: "linear-gradient(90deg, var(--ds-ember), var(--ds-gold))",
                            boxShadow: "0 0 12px rgba(255,140,40,.7)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold tracking-widest opacity-70">{achievements.unlocked.length}/{ACHIEVEMENTS.length}</span>
                    </div>
                    <div className="mt-4 grid max-h-[46vh] gap-2 overflow-y-auto pr-1">
                      {ACHIEVEMENTS.map((entry) => {
                        const got = achievements.unlocked.includes(entry.id);
                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-3 border p-3 transition-all"
                            style={{
                              borderColor: got ? "var(--ds-border)" : "var(--ds-border-soft)",
                              background: got
                                ? "linear-gradient(90deg, color-mix(in srgb, var(--ds-ember) 12%, var(--ds-chip)), var(--ds-chip))"
                                : "transparent",
                              boxShadow: got ? "0 0 18px rgba(255,140,40,.14)" : "none",
                              opacity: got ? 1 : 0.5,
                            }}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded" style={{ background: got ? "color-mix(in srgb, var(--ds-ember) 20%, transparent)" : "rgba(0,0,0,.2)", boxShadow: got ? "0 0 12px rgba(255,140,40,.4)" : "none" }}>
                              <FlameMark color={got ? "#ffc94d" : "#6b5a4a"} size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 font-display text-lg leading-tight">
                                {entry.name}
                                {got && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ds-gold)", boxShadow: "0 0 8px var(--ds-gold)" }} />}
                              </div>
                              <p className="truncate text-[11px] opacity-70">{entry.description}</p>
                            </div>
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black tracking-widest"
                              style={{
                                color: got ? "var(--ds-gold)" : "var(--ds-text-faint)",
                                background: got ? "color-mix(in srgb, var(--ds-ember) 16%, transparent)" : "rgba(0,0,0,.2)",
                                border: `1px solid ${got ? "var(--ds-border)" : "transparent"}`,
                              }}
                            >
                              {entry.points} PTS
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="mt-9">
                      <SectionHeading eyebrow="RANKINGS" title="HALL OF SOVEREIGNS" sub={auth.user ? "Endless Sky · cloud synced" : "Endless Sky · local best only"} />
                    </div>
                    <div className="mt-4 grid gap-2">
                      {leaderboard.map((row) => {
                        const top = row.rank <= 3;
                        const medal = row.rank === 1 ? "#ffc94d" : row.rank === 2 ? "#d6dbe3" : row.rank === 3 ? "#d98a3d" : "var(--ds-gold)";
                        return (
                          <div
                            key={`${row.rank}-${row.username}`}
                            className="flex items-center justify-between border p-3 text-sm"
                            style={{
                              borderColor: row.isYou ? "var(--ds-ember)" : top ? `color-mix(in srgb, ${medal} 45%, var(--ds-border-soft))` : "var(--ds-border-soft)",
                              background: row.isYou
                                ? "linear-gradient(90deg, color-mix(in srgb, var(--ds-ember) 14%, var(--ds-chip)), var(--ds-chip))"
                                : "transparent",
                              boxShadow: row.isYou ? "0 0 18px rgba(255,140,40,.18)" : "none",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="flex h-7 w-7 items-center justify-center rounded font-display text-base"
                                style={{
                                  color: top ? "#1a0d05" : "var(--ds-gold)",
                                  background: top ? medal : "color-mix(in srgb, var(--ds-ember) 14%, transparent)",
                                  boxShadow: top ? `0 0 14px color-mix(in srgb, ${medal} 60%, transparent)` : "none",
                                }}
                              >
                                {row.rank}
                              </span>
                              <span className="font-bold">{row.username}</span>
                              {row.isYou && <span className="rounded px-1.5 py-0.5 text-[8px] font-black tracking-widest" style={{ background: "var(--ds-ember)", color: "#fff" }}>YOU</span>}
                            </div>
                            <span className="font-display text-lg">{row.score.toLocaleString()}</span>
                          </div>
                        );
                      })}
                      {leaderboard.length === 0 && <p className="text-sm opacity-60">No scores published yet.</p>}
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="hud-chip p-3"><small className="hud-label block text-[9px] opacity-60">BEST HOARD</small><strong className="font-display text-2xl" style={{ color: "var(--ds-gold)" }}>{progress.highScore.toLocaleString()}</strong></div>
                      <div className="hud-chip p-3"><small className="hud-label block text-[9px] opacity-60">REALMS OPEN</small><strong className="font-display text-2xl" style={{ color: "var(--ds-gold)" }}>{progress.highestLevel}/{MAX_LEVEL}</strong></div>
                      <div className="hud-chip p-3"><small className="hud-label block text-[9px] opacity-60">STARS</small><strong className="font-display text-2xl" style={{ color: "var(--ds-gold)" }}>{earnedStars}/{MAX_LEVEL * 3}</strong></div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ---------- AUTH ---------- */}
              {screen === "auth" && (
                <motion.section key="auth" {...panelMotion} className="mx-auto grid min-h-full w-full max-w-5xl items-center gap-8 px-5 py-6 md:grid-cols-[.9fr_1.1fr] md:px-8">
                  <div>
                    <MenuBack onClick={() => setScreen("home")} />
                    <h2 className="mt-5 font-display text-5xl sm:text-7xl" style={{ color: "var(--ds-gold)" }}>CLAN GATE</h2>
                    <p className="mt-3 max-w-sm leading-relaxed opacity-75">
                      Sign in to sync high scores, unlocked realms, selected dragons and every achievement across all your devices.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-bold tracking-widest opacity-60">
                      <span>CLOUD SAVE</span><span>ACHIEVEMENTS</span><span>LEADERBOARDS</span><span>ALL DEVICES</span>
                    </div>
                  </div>

                  <div className="panel-arcane p-5 sm:p-7">
                    {auth.user ? (
                      <div className="text-center">
                        <span className="hud-label text-[10px] opacity-60">SIGNED IN AS</span>
                        <p className="mt-2 font-display text-3xl" style={{ color: "var(--ds-gold)" }}>{auth.displayName}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest opacity-60">via {auth.provider ?? "email"}</p>
                        <p className="mt-3 text-sm opacity-70">Your progress is synchronised with the cloud.</p>
                        <button type="button" onClick={() => void auth.signOut()} className="btn-stone mt-6 w-full py-3 text-xl">SIGN OUT</button>
                      </div>
                    ) : (
                      <>
                        <p className="hud-label mb-3 text-[10px] font-bold opacity-60">CONTINUE WITH A PLATFORM</p>
                        <div className="grid gap-2">
                          <button type="button" onClick={() => void handlePlatformSignIn("play_games")} disabled={authBusy} className="platform-button">
                            <PlayGamesGlyph /> <span>GOOGLE PLAY GAMES</span>
                          </button>
                          <button type="button" onClick={() => void handlePlatformSignIn("google")} disabled={authBusy} className="platform-button">
                            <GoogleGlyph /> <span>GOOGLE ACCOUNT</span>
                          </button>
                          <button type="button" onClick={() => void handlePlatformSignIn("apple")} disabled={authBusy} className="platform-button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6 0 0-2.5-1-2.6-3.8zM14.2 5.6c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1 0 2.2-.6 2.8-1.4z" /></svg>
                            <span>APPLE</span>
                          </button>
                          <button type="button" onClick={() => void handlePlatformSignIn("discord")} disabled={authBusy} className="platform-button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.3 4.5A17 17 0 0016 3.2l-.3.6a12.7 12.7 0 013.7 1.9 12.4 12.4 0 00-11-1.5c-.4.1-.9.3-1.3.5.5-.4 1.2-.8 1.9-1.1L8.9 3.2A17 17 0 004.6 4.5C2 8.3 1.3 12 1.6 15.7a17 17 0 005.2 2.6l.6-1a11 11 0 01-1.8-.9l.4-.3a12.2 12.2 0 0010.3 0l.4.3c-.6.3-1.2.6-1.8.9l.6 1a17 17 0 005.2-2.6c.4-4.3-.6-8-2.4-11.2zM8.9 13.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.2 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" /></svg>
                            <span>DISCORD</span>
                          </button>
                        </div>

                        <div className="my-5 flex items-center gap-3 text-[10px] font-bold tracking-widest opacity-45">
                          <span className="h-px flex-1" style={{ background: "var(--ds-border-soft)" }} /> OR EMAIL <span className="h-px flex-1" style={{ background: "var(--ds-border-soft)" }} />
                        </div>

                        <form onSubmit={submitAuth} className="auth-form">
                          <div className="mb-5 flex border-b" style={{ borderColor: "var(--ds-border-soft)" }}>
                            <button type="button" onClick={() => { setAuthMode("signin"); setAuthMessage(""); }} className={authMode === "signin" ? "auth-tab active" : "auth-tab"}>SIGN IN</button>
                            <button type="button" onClick={() => { setAuthMode("signup"); setAuthMessage(""); }} className={authMode === "signup" ? "auth-tab active" : "auth-tab"}>CREATE CLAN ID</button>
                          </div>
                          {authMode === "signup" && (
                            <label className="auth-label">CALLSIGN<input value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="Skyfang" minLength={2} /></label>
                          )}
                          <label className="auth-label">EMAIL<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dragon@clan.com" required /></label>
                          <label className="auth-label">PASSWORD<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 or more characters" minLength={8} required /></label>
                          {authMessage && <p className="auth-message">{authMessage}</p>}
                          <button disabled={authBusy || !auth.configured} className="btn-ember mt-5 w-full py-3 text-2xl disabled:cursor-not-allowed disabled:opacity-40">
                            {authBusy ? "OPENING GATE..." : authMode === "signin" ? "ENTER CLAN" : "FORGE CLAN ID"}
                          </button>
                          <button type="button" onClick={() => setScreen("home")} className="mt-3 w-full py-2 text-xs font-bold tracking-[.2em] opacity-70">CONTINUE AS GUEST</button>
                        </form>
                      </>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          <footer className="menu-footer hidden shrink-0 items-center justify-between px-7 py-2 text-[10px] font-bold tracking-[.18em] opacity-60 sm:flex">
            <span>MOVE: WASD / DRAG &nbsp; BREATHE: HOLD SPACE / HOLD SCREEN &nbsp; SWITCH: Q / E</span>
            <span>RUNS {progress.totalRuns} &nbsp; {auth.user ? "CLOUD ONLINE" : "LOCAL GUEST"} &nbsp; {theme.toUpperCase()}</span>
          </footer>
        </div>
      )}

      {/* ---------- IN-SESSION HUD ---------- */}
      {inSession && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-[max(.65rem,env(safe-area-inset-top))] sm:p-4">
            <div className="hud-chip min-w-[108px] px-3 py-2 sm:min-w-[145px] sm:px-4">
              <span className="hud-label block text-[8px] font-bold opacity-60 sm:text-[10px]">HOARD</span>
              <strong className="font-display text-2xl sm:text-3xl" style={{ color: "var(--ds-gold)" }}>{hud.score.toLocaleString()}</strong>
              <span className="block text-[9px] opacity-45 sm:text-[11px]">BEST {hud.hi.toLocaleString()}</span>
            </div>
            <div className="hud-chip flex flex-col items-center px-3 py-2">
              <span className="hud-label text-[8px] font-bold opacity-60 sm:text-[10px]">{hud.mode === "endless" ? "ENDLESS SKY" : `REALM ${hud.level}`}</span>
              <strong className="font-display text-xl sm:text-2xl" style={{ color: "var(--ds-ember)" }}>
                {hud.boss ? "BOSS" : `WAVE ${hud.levelWave}${hud.mode === "levels" ? `/${hud.levelWaves}` : ""}`}
              </strong>
            </div>
            <div className="flex items-start gap-2">
              <div className="hidden sm:block"><BreathMeter hud={hud} /></div>
              <div className="hud-chip hidden px-3 py-2 md:block">
                <span className="hud-label text-[9px] font-bold opacity-60">CLAN</span>
                <Lives count={hud.lives} />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] font-bold opacity-50">POWER {hud.power}</span>
                  <ShieldGlyph active={hud.shield} />
                </div>
              </div>
              <div className="pointer-events-auto flex gap-1.5 sm:flex-col">
                <button aria-label="Pause" onClick={() => engineRef.current?.togglePause()} className="hud-icon"><span className="text-lg">II</span></button>
                <button aria-label="Toggle sound" onClick={() => engineRef.current?.toggleMute()} className="hud-icon"><SoundGlyph muted={hud.muted} /></button>
                <button aria-label="Toggle theme" onClick={toggleTheme} className="hud-icon">{theme === "dark" ? <SunGlyph /> : <MoonGlyph />}</button>
              </div>
            </div>
          </div>

          {/* Mobile lung meter */}
          <div className="pointer-events-none absolute left-3 top-[70px] z-10 flex flex-col gap-1.5 sm:hidden">
            <BreathMeter hud={hud} />
            <div className="hud-chip flex items-center gap-2 px-2.5 py-1.5">
              <Lives count={hud.lives} />
              <ShieldGlyph active={hud.shield} />
            </div>
          </div>

          {hud.boss && (
            <div className="pointer-events-none absolute inset-x-0 top-[122px] z-10 flex justify-center px-16 sm:top-[92px]">
              <div className="w-full max-w-xl">
                <div className="mb-1 flex justify-between font-bold">
                  <span className="font-display text-sm tracking-wider text-[#ff6b4a] sm:text-lg">{hud.boss.name}</span>
                  <span className="text-[10px] text-[#ffb347] sm:text-xs">{bossPercent}%</span>
                </div>
                <div className="boss-bar-pulse h-2.5 border border-[#ff8a5c]/60 bg-[#1a0606] sm:h-3.5">
                  <div className="h-full transition-[width] duration-150" style={{ width: `${bossPercent}%`, background: "linear-gradient(90deg,#7f1d1d,#ef3e2d,#ff8a4a)" }} />
                </div>
              </div>
            </div>
          )}

          {/* Dragon switcher — 8 dragons */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-[max(.5rem,env(safe-area-inset-bottom))] z-10 flex justify-center px-2">
            <div className="dragon-switcher">
              <button onClick={() => engineRef.current?.cycleDragon(-1)} disabled={hud.switchCooldown > 0} className="switch-arrow" aria-label="Previous dragon">&lsaquo;</button>
              {DRAGONS.map((item) => {
                const active = item.id === hud.activeDragon;
                const locked = Boolean(item.unlockLevel && progress.highestLevel < item.unlockLevel);
                if (locked) return null;
                return (
                  <button
                    key={item.id}
                    onClick={() => chooseDragon(item.id, true)}
                    disabled={hud.switchCooldown > 0 && !active}
                    className={`switch-dragon ${active ? "active" : ""}`}
                    style={{ "--dragon-accent": item.fireColor } as React.CSSProperties}
                  >
                    <FlameMark color={item.fireColor} size={16} />
                    <span>{item.name}</span>
                    {active && <small>{item.power}</small>}
                  </button>
                );
              })}
              <button onClick={() => engineRef.current?.cycleDragon(1)} disabled={hud.switchCooldown > 0} className="switch-arrow" aria-label="Next dragon">&rsaquo;</button>
              {hud.switchCooldown > 0 && <div className="switch-cooldown" style={{ width: `${(hud.switchCooldown / 2.5) * 100}%` }} />}
            </div>
          </div>

          {/* Hold-to-breathe button */}
          {hud.phase === "playing" && (
            <button
              type="button"
              className="mobile-fire-button"
              style={{ "--breath-color": dragon.fireColor } as React.CSSProperties}
              aria-label={`Hold to breathe ${dragon.power}`}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                engineRef.current?.setFireHeld(true);
              }}
              onPointerUp={() => engineRef.current?.setFireHeld(false)}
              onPointerCancel={() => engineRef.current?.setFireHeld(false)}
              onLostPointerCapture={() => engineRef.current?.setFireHeld(false)}
            >
              <FlameMark color={dragon.fireColor} size={22} />
              <span>HOLD TO BREATHE</span>
            </button>
          )}
        </>
      )}

      {hud.phase === "playing" && hud.banner && (
        <div key={hud.bannerId} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className={`banner-pop px-5 text-center font-display text-4xl sm:text-7xl ${hud.banner.includes("APPROACHES") ? "title-blood" : "title-ember"}`}>{hud.banner}</div>
        </div>
      )}

      {/* ---------- PAUSE ---------- */}
      <AnimatePresence>
        {hud.phase === "paused" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "var(--ds-overlay)" }}>
            <motion.div initial={{ scale: .92, y: 20 }} animate={{ scale: 1, y: 0 }} className="panel-arcane w-full max-w-2xl p-5 text-center sm:p-7">
              <span className="hud-label text-[10px] opacity-60">FLIGHT SUSPENDED</span>
              <h2 className="title-ember text-5xl sm:text-6xl">PAUSED</h2>
              <p className="mt-2 text-sm opacity-70">Change dragon or switch between night and day.</p>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {DRAGONS.map((item) => {
                  const locked = Boolean(item.unlockLevel && progress.highestLevel < item.unlockLevel);
                  return (
                    <button
                      key={item.id}
                      onClick={() => !locked && chooseDragon(item.id, true)}
                      disabled={locked}
                      className={`pause-dragon ${hud.activeDragon === item.id ? "active" : ""} ${locked ? "opacity-40" : ""}`}
                      style={{ "--dragon-accent": item.fireColor } as React.CSSProperties}
                    >
                      <FlameMark color={item.fireColor} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                  {theme === "dark" ? <SunGlyph /> : <MoonGlyph />}
                  <span>{theme === "dark" ? "DAY MODE" : "NIGHT MODE"}</span>
                </button>
              </div>
              <button onClick={() => engineRef.current?.togglePause()} className="btn-ember mt-5 w-full py-3 text-2xl">RESUME FLIGHT</button>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={() => startRun(hud.mode, hud.level)} className="btn-stone py-2.5 text-base">RESTART</button>
                <button onClick={() => setScreen("levels")} className="btn-stone py-2.5 text-base">REALMS</button>
                <button onClick={returnHome} className="btn-stone py-2.5 text-base">MENU</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- GAME OVER / VICTORY ---------- */}
      <AnimatePresence>
        {(hud.phase === "gameover" || hud.phase === "victory") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto p-4" style={{ background: "var(--ds-overlay)" }}>
            <motion.div initial={{ scale: .8, y: 35 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 17 }} className="panel-arcane w-full max-w-lg p-6 text-center sm:p-8">
              <span className="hud-label text-[10px] font-bold opacity-60">{hud.phase === "victory" ? `REALM ${hud.level} CONQUERED` : "THE SKY GROWS COLD"}</span>
              <h2 className={hud.phase === "victory" ? "title-ember text-5xl sm:text-6xl" : "title-blood text-5xl sm:text-6xl"}>
                {hud.phase === "victory" ? "VICTORY" : "DRAGON FALLEN"}
              </h2>
              <p className="mt-2 text-sm opacity-70">
                {hud.phase === "victory" ? `${LEVELS[hud.level - 1]?.boss} has been defeated.` : `Your clan reached wave ${hud.wave}.`}
              </p>
              {hud.phase === "victory" && (
                <div className="mt-3 flex justify-center gap-1.5">
                  {[1, 2, 3].map((star) => (
                    <StarGlyph key={star} filled={star <= starsForScore(hud.level, Math.max(hud.score, levelBest(hud.level)))} size={30} />
                  ))}
                </div>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="hud-chip p-3"><small className="hud-label block text-[9px] opacity-50">FINAL HOARD</small><strong className="font-display text-3xl" style={{ color: "var(--ds-gold)" }}>{hud.score.toLocaleString()}</strong></div>
                <div className="hud-chip p-3"><small className="hud-label block text-[9px] opacity-50">BEST HOARD</small><strong className="font-display text-3xl" style={{ color: "var(--ds-gold)" }}>{Math.max(hud.score, hud.hi).toLocaleString()}</strong></div>
              </div>
              {hud.newBest && <div className="ember-pulse mt-3 text-sm font-bold tracking-[.2em]" style={{ color: "var(--ds-gold)" }}>NEW CLAN RECORD</div>}
              {hud.phase === "victory" && hud.level < MAX_LEVEL ? (
                <button onClick={() => startRun("levels", hud.level + 1)} className="btn-ember mt-6 w-full py-3 text-2xl">ENTER NEXT REALM</button>
              ) : (
                <button onClick={() => startRun(hud.mode, selectedLevel)} className="btn-ember mt-6 w-full py-3 text-2xl">FLY AGAIN</button>
              )}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={() => { engineRef.current?.toMenu(); setScreen("hangar"); }} className="btn-stone py-2.5 text-base">ROOST</button>
                <button onClick={() => { engineRef.current?.toMenu(); setScreen("records"); }} className="btn-stone py-2.5 text-base">RECORDS</button>
                <button onClick={returnHome} className="btn-stone py-2.5 text-base">MENU</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
