import { Sfx } from "./audio";
import { DRAGONS, dragonById, type DragonId, type HornStyle, type WingStyle } from "./dragons";
import { levelById, MAX_LEVEL } from "./levels";
import { store } from '../dps';

export type ThemeName = "dark" | "light";
export type BreathPhaseName = "idle" | "inhale" | "blast" | "recover" | "winded";

/* ============================================================ */
/*  Types                                                       */
/* ============================================================ */

export type GamePhase = "menu" | "playing" | "paused" | "gameover" | "victory";
export type GameMode = "endless" | "levels";

export interface BossInfo {
  name: string;
  hp: number;
  max: number;
}

export interface HudState {
  phase: GamePhase;
  score: number;
  hi: number;
  wave: number;
  lives: number;
  power: number;
  shield: boolean;
  boss: BossInfo | null;
  banner: string | null;
  bannerId: number;
  muted: boolean;
  newBest: boolean;
  bossWave: boolean;
  mode: GameMode;
  level: number;
  levelWave: number;
  levelWaves: number;
  activeDragon: DragonId;
  switchCooldown: number;
  /** Realistic breathing: inhale → blast → recover. */
  breathPhase: BreathPhaseName;
  breathStamina: number;
  /** Current exhalation strength, 0..1. */
  breathOutput: number;
  theme: ThemeName;
  totalLevels: number;
}

interface MenuFlyer {
  x: number;
  y: number;
  dir: number;
  size: number;
  t: number;
  spd: number;
  kind: EnemyKind;
}

const MENU_PALETTES: DragonColors[] = [
  { body: "#241238", belly: "#33204f", wing: "#180b28", wingRim: "rgba(150,90,220,0.45)", horn: "#4a2f6b", eye: "#c77dff" },
  { body: "#12301c", belly: "#1b452a", wing: "#0b2415", wingRim: "rgba(90,200,120,0.4)", horn: "#2f5c40", eye: "#8affb0" },
  { body: "#2c2417", belly: "#3f3522", wing: "#1f1a10", wingRim: "rgba(200,160,80,0.4)", horn: "#5c4a2a", eye: "#ffd166" },
];

interface EBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: "fire" | "rock";
  rot: number;
  vr: number;
}
type EnemyKind = "drake" | "wraith" | "brute";
interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  baseX: number;
  targetY: number;
  hp: number;
  r: number;
  t: number;
  amp: number;
  phase: number;
  spd: number;
  fireT: number;
  dir: number;
  size: number;
  flap: number;
  hitT: number;
  value: number;
}
interface Drop {
  kind: "power" | "heal" | "shield";
  x: number;
  y: number;
  t: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  delay: number;
  ring?: boolean;
}
interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  size: number;
}
interface Boss {
  x: number;
  y: number;
  hp: number;
  max: number;
  t: number;
  flap: number;
  atk: number;
  atkT: number;
  hitT: number;
  /** Seconds between attack rotations. */
  pace: number;
  palette: DragonColors;
}
interface Ember {
  x: number;
  y: number;
  spd: number;
  size: number;
  phase: number;
  alpha: number;
}

export type DragonColors = import("./dragons").DragonPalette;

const PALETTES: Record<EnemyKind | "boss", DragonColors> = {
  drake: {
    body: "#7c3aed",
    bodyDark: "#4c1d95",
    belly: "#c4b5fd",
    bellyRidge: "#8b5cf6",
    wing: "#3b0f6f",
    wingInner: "#5b21b6",
    wingRim: "#c084fc",
    horn: "#e6d5ff",
    eye: "#f0abfc",
    glow: "rgba(192, 132, 252, 0.75)",
    energy: "#c084fc",
  },
  wraith: {
    body: "#22c55e",
    bodyDark: "#14532d",
    belly: "#bbf7d0",
    bellyRidge: "#4ade80",
    wing: "#14532d",
    wingInner: "#166534",
    wingRim: "#86efac",
    horn: "#dcfce7",
    eye: "#fef08a",
    glow: "rgba(134, 239, 172, 0.75)",
    energy: "#4ade80",
  },
  brute: {
    body: "#64748b",
    bodyDark: "#334155",
    belly: "#cbd5e1",
    bellyRidge: "#94a3b8",
    wing: "#1e293b",
    wingInner: "#334155",
    wingRim: "#94a3b8",
    horn: "#f1f5f9",
    eye: "#f87171",
    glow: "rgba(248, 113, 113, 0.75)",
    energy: "#ef4444",
  },
  boss: {
    body: "#dc2626",
    bodyDark: "#570c0c",
    belly: "#fecaca",
    bellyRidge: "#b91c1c",
    wing: "#450a0a",
    wingInner: "#7f1d1d",
    wingRim: "#ff8a5c",
    horn: "#fef08a",
    eye: "#ffea2e",
    glow: "rgba(255, 107, 42, 0.9)",
    energy: "#ff5722",
  },
};

const BOSS_NAMES = [
  "EMBERWING TITAN",
  "TEMPEST WYRM",
  "BOGBLIGHT QUEEN",
  "OBSIDIAN MAW",
  "TIDEWRAITH CYCLONE",
  "SOLVARIS BETRAYED",
  "GLACIAL MONARCH",
  "MOUNTAIN THAT WALKS",
  "PYRE MATRIARCH",
  "STARLESS RAVAGER",
  "REAPER SANGUINAR",
  "THE ASHEN ANCIENT",
];

const MAX_LIVES = 5;

/** Every realm's guardian gets its own silhouette colours. */
const BOSS_PALETTES: DragonColors[] = [
  { body: "#dc2626", bodyDark: "#570c0c", belly: "#fecaca", bellyRidge: "#b91c1c", wing: "#450a0a", wingInner: "#7f1d1d", wingRim: "#ff8a5c", horn: "#fef08a", eye: "#ffea2e", glow: "rgba(255,107,42,0.9)", energy: "#ff5722" },
  { body: "#3b82f6", bodyDark: "#0c2d5c", belly: "#dbeafe", bellyRidge: "#2563eb", wing: "#0b2545", wingInner: "#1e3a8a", wingRim: "#7dd3fc", horn: "#eff6ff", eye: "#e0f2fe", glow: "rgba(96,165,250,0.9)", energy: "#38bdf8" },
  { body: "#16a34a", bodyDark: "#0a3d1c", belly: "#dcfce7", bellyRidge: "#15803d", wing: "#0a2e15", wingInner: "#14532d", wingRim: "#86efac", horn: "#f0fdf4", eye: "#bef264", glow: "rgba(74,222,128,0.9)", energy: "#4ade80" },
  { body: "#7c3aed", bodyDark: "#2e1065", belly: "#ede9fe", bellyRidge: "#6d28d9", wing: "#1e0a3c", wingInner: "#3b1378", wingRim: "#c4b5fd", horn: "#f5f3ff", eye: "#f0abfc", glow: "rgba(167,139,250,0.9)", energy: "#a855f7" },
  { body: "#0891b2", bodyDark: "#083344", belly: "#cffafe", bellyRidge: "#0e7490", wing: "#062a35", wingInner: "#0e4a5c", wingRim: "#67e8f9", horn: "#ecfeff", eye: "#a5f3fc", glow: "rgba(34,211,238,0.9)", energy: "#22d3ee" },
  { body: "#eab308", bodyDark: "#713f12", belly: "#fef9c3", bellyRidge: "#ca8a04", wing: "#4a2c05", wingInner: "#854d0e", wingRim: "#fde68a", horn: "#fffbeb", eye: "#fff7cc", glow: "rgba(250,204,21,0.92)", energy: "#facc15" },
  { body: "#38bdf8", bodyDark: "#0c4a6e", belly: "#f0f9ff", bellyRidge: "#0284c7", wing: "#082f49", wingInner: "#0c5a83", wingRim: "#bae6fd", horn: "#ffffff", eye: "#e0f2fe", glow: "rgba(125,211,252,0.9)", energy: "#7dd3fc" },
  { body: "#a16207", bodyDark: "#44280a", belly: "#fef3c7", bellyRidge: "#78350f", wing: "#2c1a06", wingInner: "#52330c", wingRim: "#fcd34d", horn: "#fffbeb", eye: "#fde68a", glow: "rgba(217,119,6,0.9)", energy: "#f59e0b" },
  { body: "#ea580c", bodyDark: "#5c1a05", belly: "#ffedd5", bellyRidge: "#c2410c", wing: "#431407", wingInner: "#7c2d12", wingRim: "#fdba74", horn: "#fff7ed", eye: "#fed7aa", glow: "rgba(249,115,22,0.92)", energy: "#fb923c" },
  { body: "#4c1d95", bodyDark: "#1e0a3c", belly: "#ede9fe", bellyRidge: "#5b21b6", wing: "#150729", wingInner: "#2e1065", wingRim: "#a78bfa", horn: "#f5f3ff", eye: "#c4b5fd", glow: "rgba(139,92,246,0.9)", energy: "#8b5cf6" },
  { body: "#be123c", bodyDark: "#4c0519", belly: "#ffe4e6", bellyRidge: "#9f1239", wing: "#3f0713", wingInner: "#6b0f22", wingRim: "#fda4af", horn: "#fff1f2", eye: "#fecdd3", glow: "rgba(244,63,94,0.9)", energy: "#f43f5e" },
  { body: "#f97316", bodyDark: "#431407", belly: "#ffedd5", bellyRidge: "#b45309", wing: "#1c0a04", wingInner: "#451a03", wingRim: "#fdba74", horn: "#fff7ed", eye: "#fef08a", glow: "rgba(249,115,22,0.95)", energy: "#fdba74" },
];

/* ============================================================ */
/*  Dragon sprite (procedural, no images)                        */
/* ============================================================ */

export function drawDragon(
  ctx: CanvasRenderingContext2D,
  s: number,
  flap: number,
  c: DragonColors,
  opts: {
    flip?: boolean;
    spikes?: boolean;
    glowEye?: number;
    wingStyle?: WingStyle;
    hornStyle?: HornStyle;
    /** Jaw is open and the throat is lit — used for inhale and blast frames. */
    breathing?: boolean;
    /** How far open the jaw is, 0..1. */
    jawOpen?: number;
    /** Glow strength of the chest while lungs fill, 0..1. */
    lungGlow?: number;
    breathPhase?: number;
  } = {}
 ) {
  ctx.save();
  if (opts.flip) ctx.scale(1, -1);
  const w = Math.sin(flap); // -1..1 wing phase
  const lift = 0.5 + 0.5 * w; // 0..1
  const bodyDark = c.bodyDark ?? c.body;
  const wingInner = c.wingInner ?? c.wing;
  const bellyRidge = c.bellyRidge ?? c.body;
  const energy = c.energy ?? c.eye;

  // ---- ambient dragon aura / glow ----
  if (c.glow && s > 18) {
    ctx.save();
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = s * 0.45;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0.3 * s, 0.4 * s, 0.7 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ---- segmented tail with armor plating & flame spade ----
  const sway = Math.sin(flap * 0.6) * 0.42 * s;
  const tx = sway * 0.55;
  const ty = 2.15 * s;

  // Tail base glow / shadow
  ctx.strokeStyle = bodyDark;
  ctx.lineCap = "round";
  ctx.lineWidth = 0.22 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0.7 * s);
  ctx.quadraticCurveTo(sway * 1.1, 1.45 * s, tx, ty);
  ctx.stroke();

  // Tail spine core
  ctx.strokeStyle = c.body;
  ctx.lineWidth = 0.14 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0.7 * s);
  ctx.quadraticCurveTo(sway * 1.05, 1.45 * s, tx, ty);
  ctx.stroke();

  // Tail segments/rings
  for (let i = 1; i <= 3; i++) {
    const tRatio = i / 4;
    const px = (1 - tRatio) * (1 - tRatio) * 0 + 2 * (1 - tRatio) * tRatio * (sway * 1.05) + tRatio * tRatio * tx;
    const py = (1 - tRatio) * (1 - tRatio) * (0.7 * s) + 2 * (1 - tRatio) * tRatio * (1.45 * s) + tRatio * tRatio * ty;
    ctx.fillStyle = bellyRidge;
    ctx.beginPath();
    ctx.arc(px, py, (0.09 - i * 0.015) * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tail tip spear / spade with energy rune
  ctx.save();
  ctx.translate(tx, ty);
  ctx.fillStyle = c.wing;
  ctx.beginPath();
  ctx.moveTo(0, 0.38 * s);
  ctx.quadraticCurveTo(0.24 * s, 0.05 * s, 0.3 * s, -0.22 * s);
  ctx.lineTo(0, -0.38 * s);
  ctx.lineTo(-0.3 * s, -0.22 * s);
  ctx.quadraticCurveTo(-0.24 * s, 0.05 * s, 0, 0.38 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.wingRim;
  ctx.lineWidth = Math.max(1, 0.04 * s);
  ctx.stroke();

  // Tail glowing gem / rune
  ctx.fillStyle = energy;
  ctx.shadowColor = energy;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 0.06 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ---- wings (multi-layer, stylized membranes with skeletal bones) ----
  const wingStyle = opts.wingStyle ?? "classic";
  for (const dir of [-1, 1] as const) {
    ctx.save();
    const spanMult =
      wingStyle === "rift" || wingStyle === "spectral"
        ? 1.45
        : wingStyle === "feathered"
        ? 1.35
        : wingStyle === "crystal"
        ? 1.28
        : wingStyle === "plated"
        ? 1.18
        : 1.22;
    const tipX = dir * s * (spanMult + 0.32 * w);
    const tipY = -0.32 * s - 0.48 * s * lift;
    const elbowX = dir * s * (0.72 + 0.16 * w);
    const elbowY = -0.74 * s - 0.36 * s * lift;

    // Wing outer membrane
    ctx.beginPath();
    ctx.moveTo(0.12 * s * dir, -0.2 * s);
    ctx.quadraticCurveTo(elbowX * 0.9, elbowY, tipX, tipY);

    if (wingStyle === "feathered") {
      // Storm eagle-dragon scalloped wing blades
      ctx.lineTo(tipX - dir * 0.15 * s, tipY + 0.25 * s);
      ctx.quadraticCurveTo(dir * s * 1.1, tipY + 0.45 * s, dir * s * 0.85, 0.2 * s);
      ctx.quadraticCurveTo(dir * s * 0.65, 0.48 * s, 0.3 * s * dir, 0.72 * s);
    } else if (wingStyle === "spiked") {
      // Mirefang thorn hooks on trailing edge
      ctx.lineTo(tipX * 0.9, tipY + 0.3 * s);
      ctx.lineTo(tipX * 0.95 - dir * 0.08 * s, tipY + 0.28 * s);
      ctx.quadraticCurveTo(dir * s * 0.95, 0.3 * s, dir * s * 0.75, 0.42 * s);
      ctx.lineTo(dir * s * 0.82, 0.46 * s);
      ctx.quadraticCurveTo(dir * s * 0.5, 0.62 * s, 0.3 * s * dir, 0.78 * s);
    } else if (wingStyle === "rift") {
      // Nyxara astral rift wings with cosmic tendril cutouts
      ctx.quadraticCurveTo(dir * s * 1.15, tipY + 0.35 * s, dir * s * 0.9, 0.3 * s);
      ctx.lineTo(dir * s * 1.05, 0.4 * s);
      ctx.quadraticCurveTo(dir * s * 0.7, 0.65 * s, 0.32 * s * dir, 0.82 * s);
    } else if (wingStyle === "crystal") {
      // Cryonax — faceted ice shelves with hard angular notches
      ctx.lineTo(tipX - dir * 0.1 * s, tipY + 0.34 * s);
      ctx.lineTo(dir * s * 1.02, tipY + 0.4 * s);
      ctx.lineTo(dir * s * 0.78, 0.34 * s);
      ctx.lineTo(dir * s * 0.86, 0.44 * s);
      ctx.lineTo(dir * s * 0.52, 0.68 * s);
      ctx.lineTo(dir * s * 0.34, 0.62 * s);
      ctx.quadraticCurveTo(dir * s * 0.26, 0.76 * s, 0.3 * s * dir, 0.84 * s);
    } else if (wingStyle === "plated") {
      // Terraxis — heavy stone slabs, blunt and armoured
      ctx.lineTo(dir * s * 0.98, tipY + 0.38 * s);
      ctx.lineTo(dir * s * 0.92, 0.26 * s);
      ctx.lineTo(dir * s * 0.8, 0.36 * s);
      ctx.lineTo(dir * s * 0.74, 0.5 * s);
      ctx.lineTo(dir * s * 0.56, 0.6 * s);
      ctx.quadraticCurveTo(dir * s * 0.36, 0.78 * s, 0.3 * s * dir, 0.8 * s);
    } else if (wingStyle === "spectral") {
      // Sanguinar — trailing ethereal wisps off the trailing edge
      ctx.quadraticCurveTo(dir * s * 1.2, tipY + 0.3 * s, dir * s * 0.94, 0.28 * s);
      ctx.quadraticCurveTo(dir * s * 1.12, 0.46 * s, dir * s * 0.82, 0.44 * s);
      ctx.quadraticCurveTo(dir * s * 1.0, 0.64 * s, dir * s * 0.62, 0.62 * s);
      ctx.quadraticCurveTo(dir * s * 0.42, 0.8 * s, 0.3 * s * dir, 0.8 * s);
    } else {
      // Classic scalloped bat dragon wings
      const scallop1X = dir * s * (0.95 + 0.2 * w);
      const scallop1Y = tipY + 0.42 * s;
      const scallop2X = dir * s * 0.65;
      const scallop2Y = 0.52 * s;
      ctx.quadraticCurveTo(tipX * 0.95, tipY + 0.2 * s, scallop1X, scallop1Y);
      ctx.quadraticCurveTo(dir * s * 0.8, scallop1Y - 0.08 * s, scallop2X, scallop2Y);
      ctx.quadraticCurveTo(dir * s * 0.48, 0.45 * s, 0.3 * s * dir, 0.78 * s);
    }

    ctx.quadraticCurveTo(0.12 * s * dir, 0.35 * s, 0.12 * s * dir, -0.2 * s);
    ctx.closePath();

    // Fill membrane with gradient-like multi-pass
    ctx.fillStyle = c.wing;
    ctx.fill();

    // Inner wing secondary fold / translucency
    ctx.fillStyle = wingInner;
    ctx.beginPath();
    ctx.moveTo(0.12 * s * dir, -0.15 * s);
    ctx.quadraticCurveTo(elbowX * 0.75, elbowY * 0.85, tipX * 0.82, tipY + 0.15 * s);
    ctx.quadraticCurveTo(dir * s * 0.55, 0.25 * s, 0.24 * s * dir, 0.55 * s);
    ctx.closePath();
    ctx.fill();

    // Wing ribs / struts
    ctx.strokeStyle = c.wingRim;
    ctx.lineWidth = Math.max(1, 0.05 * s);
    ctx.beginPath();
    // Arm bone (shoulder to elbow)
    ctx.moveTo(0.12 * s * dir, -0.2 * s);
    ctx.lineTo(elbowX, elbowY);
    // Forearm (elbow to tip)
    ctx.lineTo(tipX, tipY);
    // Finger 1
    ctx.moveTo(elbowX, elbowY);
    ctx.quadraticCurveTo(dir * s * 0.9, tipY + 0.25 * s, dir * s * 0.75, 0.35 * s);
    // Finger 2
    ctx.moveTo(elbowX, elbowY);
    ctx.quadraticCurveTo(dir * s * 0.6, 0.2 * s, dir * s * 0.45, 0.6 * s);
    ctx.stroke();

    // Claw/talon on wing elbow joint
    ctx.fillStyle = c.horn;
    ctx.beginPath();
    ctx.moveTo(elbowX - dir * 0.04 * s, elbowY - 0.04 * s);
    ctx.lineTo(elbowX + dir * 0.12 * s, elbowY - 0.16 * s);
    ctx.lineTo(elbowX + dir * 0.04 * s, elbowY + 0.04 * s);
    ctx.closePath();
    ctx.fill();

    // Glowing energy vein along main wing bone
    if (s > 20) {
      ctx.strokeStyle = energy;
      ctx.shadowColor = energy;
      ctx.shadowBlur = 8;
      ctx.lineWidth = Math.max(1, 0.025 * s);
      ctx.beginPath();
      ctx.moveTo(0.12 * s * dir, -0.18 * s);
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // ---- spine ridge spikes (dynamic styling) ----
  const spikeCount = opts.spikes ? 5 : 3;
  ctx.fillStyle = c.horn;
  for (let i = 0; i < spikeCount; i++) {
    const yy = (-0.2 + i * 0.24) * s;
    const spikeH = (0.24 - Math.abs(i - 2) * 0.04) * s;
    ctx.beginPath();
    ctx.moveTo(-0.14 * s, yy - spikeH * 0.4);
    ctx.lineTo(0.14 * s, yy - spikeH * 0.4);
    ctx.lineTo(0, yy + spikeH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = bodyDark;
    ctx.lineWidth = Math.max(0.8, 0.02 * s);
    ctx.stroke();
  }

  // ---- main body core (muscular torso & flank plates) ----
  ctx.fillStyle = bodyDark;
  ctx.beginPath();
  ctx.ellipse(0, 0.35 * s, 0.42 * s, 0.78 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.ellipse(0, 0.33 * s, 0.37 * s, 0.72 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulder and hip scale armor ridges
  for (const dir of [-1, 1] as const) {
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.ellipse(dir * 0.32 * s, 0.15 * s, 0.12 * s, 0.22 * s, dir * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- belly plate plating (segmented armored scales) ----
  ctx.fillStyle = c.belly;
  ctx.beginPath();
  ctx.ellipse(0, 0.45 * s, 0.2 * s, 0.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly ridges / horizontal bands
  ctx.strokeStyle = bellyRidge;
  ctx.lineWidth = Math.max(1, 0.035 * s);
  for (let i = 0; i < 5; i++) {
    const by = (0.18 + i * 0.14) * s;
    const bw = (0.16 - Math.abs(i - 2) * 0.025) * s;
    ctx.beginPath();
    ctx.moveTo(-bw, by);
    ctx.quadraticCurveTo(0, by + 0.05 * s, bw, by);
    ctx.stroke();
  }

  // ---- lung glow: the chest lights up as the dragon draws breath ----
  if (opts.lungGlow && opts.lungGlow > 0.01) {
    const fill = Math.max(0, Math.min(1, opts.lungGlow));
    const chest = ctx.createRadialGradient(0, 0.18 * s, 0, 0, 0.18 * s, (0.3 + fill * 0.34) * s);
    chest.addColorStop(0, energy);
    chest.addColorStop(0.55, c.glow ?? "rgba(255,255,255,0.3)");
    chest.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.16 + fill * 0.5;
    ctx.fillStyle = chest;
    ctx.beginPath();
    ctx.ellipse(0, 0.2 * s, (0.2 + fill * 0.12) * s, (0.3 + fill * 0.2) * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // ---- legs and talons ----
  for (const dir of [-1, 1] as const) {
    // Thigh
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.ellipse(dir * 0.44 * s, 0.76 * s, 0.14 * s, 0.24 * s, dir * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.ellipse(dir * 0.43 * s, 0.75 * s, 0.11 * s, 0.2 * s, dir * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Talons / claws
    ctx.fillStyle = c.horn;
    for (let cIdx = -1; cIdx <= 1; cIdx++) {
      ctx.beginPath();
      const talonX = dir * 0.45 * s + cIdx * 0.05 * s;
      const talonY = 0.94 * s;
      ctx.moveTo(talonX - 0.025 * s, talonY);
      ctx.lineTo(talonX + 0.025 * s, talonY);
      ctx.lineTo(talonX, talonY + 0.11 * s);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ---- neck and head (sculpted dragon skull) ----
  // Muscular neck
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(-0.22 * s, 0.05 * s);
  ctx.quadraticCurveTo(-0.28 * s, -0.4 * s, -0.19 * s, -0.68 * s);
  ctx.lineTo(0.19 * s, -0.68 * s);
  ctx.quadraticCurveTo(0.28 * s, -0.4 * s, 0.22 * s, 0.05 * s);
  ctx.closePath();
  ctx.fill();

  // Head base
  ctx.fillStyle = bodyDark;
  ctx.beginPath();
  ctx.ellipse(0, -0.73 * s, 0.32 * s, 0.34 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.ellipse(0, -0.74 * s, 0.29 * s, 0.31 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jaw / muzzle
  ctx.beginPath();
  ctx.moveTo(-0.18 * s, -0.85 * s);
  ctx.quadraticCurveTo(-0.15 * s, -1.36 * s, 0, -1.42 * s);
  ctx.quadraticCurveTo(0.15 * s, -1.36 * s, 0.18 * s, -0.85 * s);
  ctx.closePath();
  ctx.fill();

  // Nostrils with ember glow
  ctx.fillStyle = energy;
  ctx.beginPath();
  ctx.arc(-0.06 * s, -1.26 * s, 0.025 * s, 0, Math.PI * 2);
  ctx.arc(0.06 * s, -1.26 * s, 0.025 * s, 0, Math.PI * 2);
  ctx.fill();

  // The illuminated open jaw makes each stream read as dragon breath, not a muzzle flash.
  if (opts.breathing) {
    const open = Math.max(0, Math.min(1, opts.jawOpen ?? 1));
    const pulse = 0.5 + Math.sin((opts.breathPhase ?? flap) * 18) * 0.5;
    // The lower jaw hinges down proportionally to how hard the dragon is exhaling.
    const drop = 0.02 + open * 0.2;
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(-0.15 * s, -1.12 * s);
    ctx.quadraticCurveTo(0, (-1.04 + drop * 0.4) * s, 0.15 * s, -1.12 * s);
    ctx.quadraticCurveTo(0.1 * s, (-1.3 - drop * 0.55) * s, 0, (-1.34 - drop * 0.7) * s);
    ctx.quadraticCurveTo(-0.1 * s, (-1.3 - drop * 0.55) * s, -0.15 * s, -1.12 * s);
    ctx.closePath();
    ctx.fill();

    const throat = ctx.createRadialGradient(0, -1.2 * s, 0, 0, -1.2 * s, 0.2 * s + open * 0.1 * s);
    throat.addColorStop(0, "#fff8c7");
    throat.addColorStop(0.38, energy);
    throat.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = (0.4 + open * 0.6) * (0.75 + pulse * 0.25);
    ctx.fillStyle = throat;
    ctx.beginPath();
    ctx.ellipse(0, (-1.21 - drop * 0.3) * s, (0.1 + open * 0.06) * s, (0.09 + open * 0.06) * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Small ivory fangs frame the glowing throat.
    ctx.fillStyle = c.horn;
    for (const dir of [-1, 1] as const) {
      ctx.beginPath();
      ctx.moveTo(dir * 0.095 * s, -1.1 * s);
      ctx.lineTo(dir * 0.11 * s, -1.2 * s);
      ctx.lineTo(dir * 0.055 * s, -1.13 * s);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Brow ridges
  ctx.strokeStyle = bodyDark;
  ctx.lineWidth = Math.max(1, 0.045 * s);
  ctx.beginPath();
  ctx.moveTo(-0.25 * s, -0.84 * s);
  ctx.quadraticCurveTo(-0.12 * s, -0.92 * s, 0, -0.85 * s);
  ctx.quadraticCurveTo(0.12 * s, -0.92 * s, 0.25 * s, -0.84 * s);
  ctx.stroke();

  // ---- horns (distinctive styles per dragon archetype) ----
  const hornStyle = opts.hornStyle ?? "curved";
  ctx.fillStyle = c.horn;
  for (const dir of [-1, 1] as const) {
    ctx.save();
    if (hornStyle === "bladed") {
      // Zephyrax twin lightning daggers
      ctx.beginPath();
      ctx.moveTo(dir * 0.18 * s, -0.86 * s);
      ctx.lineTo(dir * 0.65 * s, -1.38 * s);
      ctx.lineTo(dir * 0.45 * s, -1.48 * s);
      ctx.lineTo(dir * 0.12 * s, -1.05 * s);
      ctx.closePath();
      ctx.fill();
      // Secondary mini crest
      ctx.beginPath();
      ctx.moveTo(dir * 0.26 * s, -0.74 * s);
      ctx.lineTo(dir * 0.58 * s, -0.95 * s);
      ctx.lineTo(dir * 0.28 * s, -0.88 * s);
      ctx.closePath();
      ctx.fill();
    } else if (hornStyle === "crowned") {
      // Mirefang thorn crown
      ctx.beginPath();
      ctx.moveTo(dir * 0.16 * s, -0.88 * s);
      ctx.lineTo(dir * 0.45 * s, -1.4 * s);
      ctx.lineTo(dir * 0.28 * s, -1.22 * s);
      ctx.lineTo(dir * 0.52 * s, -1.18 * s);
      ctx.lineTo(dir * 0.18 * s, -0.98 * s);
      ctx.closePath();
      ctx.fill();
    } else if (hornStyle === "rift") {
      // Nyxara floating crystalline void horns
      ctx.shadowColor = energy;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(dir * 0.2 * s, -0.88 * s);
      ctx.lineTo(dir * 0.58 * s, -1.52 * s);
      ctx.lineTo(dir * 0.22 * s, -1.12 * s);
      ctx.closePath();
      ctx.fill();
      // Inner rift shard
      ctx.fillStyle = energy;
      ctx.beginPath();
      ctx.moveTo(dir * 0.1 * s, -0.95 * s);
      ctx.lineTo(dir * 0.28 * s, -1.4 * s);
      ctx.lineTo(dir * 0.18 * s, -1.02 * s);
      ctx.closePath();
      ctx.fill();
    } else if (hornStyle === "antler") {
      // Cryonax — branching frozen antlers
      ctx.beginPath();
      ctx.moveTo(dir * 0.18 * s, -0.86 * s);
      ctx.lineTo(dir * 0.42 * s, -1.34 * s);
      ctx.lineTo(dir * 0.3 * s, -1.28 * s);
      ctx.lineTo(dir * 0.5 * s, -1.5 * s);
      ctx.lineTo(dir * 0.2 * s, -1.16 * s);
      ctx.lineTo(dir * 0.28 * s, -1.08 * s);
      ctx.lineTo(dir * 0.12 * s, -1.0 * s);
      ctx.closePath();
      ctx.fill();
      // Lower tine
      ctx.beginPath();
      ctx.moveTo(dir * 0.2 * s, -0.86 * s);
      ctx.lineTo(dir * 0.44 * s, -1.04 * s);
      ctx.lineTo(dir * 0.22 * s, -0.94 * s);
      ctx.closePath();
      ctx.fill();
    } else if (hornStyle === "crest") {
      // Solvaris — radiant sun crown
      ctx.beginPath();
      ctx.moveTo(dir * 0.16 * s, -0.88 * s);
      ctx.lineTo(dir * 0.62 * s, -1.3 * s);
      ctx.lineTo(dir * 0.5 * s, -1.36 * s);
      ctx.lineTo(dir * 0.68 * s, -1.6 * s);
      ctx.lineTo(dir * 0.14 * s, -1.02 * s);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = energy;
      ctx.shadowBlur = 8;
      ctx.fillStyle = energy;
      ctx.beginPath();
      ctx.moveTo(dir * 0.2 * s, -0.9 * s);
      ctx.lineTo(dir * 0.52 * s, -1.18 * s);
      ctx.lineTo(dir * 0.24 * s, -1.02 * s);
      ctx.closePath();
      ctx.fill();
    } else if (hornStyle === "tusk") {
      // Terraxis — thick forward-jutting tusks
      ctx.beginPath();
      ctx.moveTo(dir * 0.2 * s, -0.84 * s);
      ctx.quadraticCurveTo(dir * 0.62 * s, -0.92 * s, dir * 0.74 * s, -1.28 * s);
      ctx.quadraticCurveTo(dir * 0.4 * s, -1.02 * s, dir * 0.14 * s, -1.0 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(dir * 0.26 * s, -0.68 * s);
      ctx.lineTo(dir * 0.5 * s, -0.84 * s);
      ctx.lineTo(dir * 0.2 * s, -0.58 * s);
      ctx.closePath();
      ctx.fill();
    } else {
      // Ignivar curved sweeping ram-horns
      ctx.beginPath();
      ctx.moveTo(dir * 0.18 * s, -0.84 * s);
      ctx.quadraticCurveTo(dir * 0.6 * s, -1.15 * s, dir * 0.58 * s, -1.45 * s);
      ctx.quadraticCurveTo(dir * 0.4 * s, -1.35 * s, dir * 0.12 * s, -1.02 * s);
      ctx.closePath();
      ctx.fill();
      // Cheek spur
      ctx.beginPath();
      ctx.moveTo(dir * 0.28 * s, -0.72 * s);
      ctx.lineTo(dir * 0.48 * s, -0.8 * s);
      ctx.lineTo(dir * 0.24 * s, -0.6 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- eyes (fierce glowing slit pupils) ----
  ctx.save();
  ctx.fillStyle = c.eye;
  ctx.shadowColor = energy;
  ctx.shadowBlur = opts.glowEye ?? 10;
  for (const dir of [-1, 1] as const) {
    ctx.beginPath();
    ctx.ellipse(dir * 0.14 * s, -0.78 * s, 0.075 * s, 0.05 * s, dir * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Slit pupil
    ctx.fillStyle = "#0a040b";
    ctx.beginPath();
    ctx.ellipse(dir * 0.14 * s, -0.78 * s, 0.02 * s, 0.05 * s, dir * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.eye;
  }
  ctx.restore();

  ctx.restore();
}

/* ============================================================ */
/*  Engine                                                      */
/* ============================================================ */

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHud: (h: HudState) => void;
  private raf = 0;
  private last = 0;
  private time = 0;

  W = 960;
  H = 640;
  private dpr = 1;
  private bg: HTMLCanvasElement | null = null;

  phase: GamePhase = "menu";
  private score = 0;
  private hi = 0;
  private newBest = false;
  private wave = 0;
  private lives = 3;
  private power = 1;
  private shield = false;
  private mode: GameMode = "endless";
  private level = 1;
  private readonly levelWaves = 3;
  private levelComplete = false;
  private activeDragon: DragonId = "ember";
  private switchCd = 0;
  private switchFx = 0;
  private theme: ThemeName = "dark";

  /**
   * Realistic fire breathing. A dragon cannot exhale continuously: it draws a
   * breath, blasts, then must pause and refill its lungs. Holding the button
   * produces rhythmic pulses of flame with audible breaks between them.
   */
  private breath = {
    phase: "idle" as BreathPhaseName,
    t: 0,
    stamina: 1,
    /** Envelope of the current exhalation, 0..1. */
    output: 0,
    /** Rising glow while the lungs fill, 0..1. */
    charge: 0,
    /** True once the player has released, letting the tail of the blast finish. */
    released: false,
  };
  private breathActive = false;

  private p = { x: 480, y: 520, fireCd: 0, inv: 0, flap: 0, trailT: 0 };

  private ebullets: EBullet[] = [];
  private enemies: Enemy[] = [];
  private drops: Drop[] = [];
  private parts: Particle[] = [];
  private popups: Popup[] = [];
  private embers: Ember[] = [];
  private boss: Boss | null = null;

  private spawnQueue: { t: number; fn: () => void }[] = [];
  private waveGap = 0;
  private clearedFlag = false;
  private overAt = 0;

  private shake = 0;
  private shakeT = 0;
  private shakeMag = 0;
  private flash = 0;

  private banner = "";
  private bannerT = 0;
  private bannerId = 0;

  private keys: Record<string, boolean> = {};
  private pointer = { down: false, x: 0, y: 0 };
  private fireButtonHeld = false;
  private sfx = new Sfx();
  private lastHud = "";
  private destroyed = false;
  private menuFlyers: MenuFlyer[] = [];
  private flyerT = 0;
  private bossWaveNow = false;

  constructor(canvas: HTMLCanvasElement, onHud: (h: HudState) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    this.ctx = ctx;
    this.onHud = onHud;
    try {
      this.hi = Number(store.getItem("dragon-strike-hi") || 0) || 0;
    } catch {
      this.hi = 0;
    }
    this.resize();
    this.seedEmbers();
    this.bind();
    this.last = performance.now();
    const loop = (ts: number) => {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min((ts - this.last) / 1000, 0.05);
      this.last = ts;
      this.time += dt;
      if (this.phase === "playing") this.update(dt);
      this.updateAmbient(dt);
      this.render();
      this.pushHud();
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.destroyed = true;
    this.sfx.stopBreath();
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.kd);
    window.removeEventListener("keyup", this.ku);
    this.canvas.removeEventListener("pointerdown", this.pd);
    window.removeEventListener("pointermove", this.pm);
    window.removeEventListener("pointerup", this.pu);
    window.removeEventListener("pointercancel", this.pu);
    window.removeEventListener("blur", this.blur);
    window.removeEventListener("resize", this.resize);
  }

  /* ---------------- input ---------------- */

  private kd = (e: KeyboardEvent) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    this.keys[e.code] = true;
    this.sfx.ensure();
    if (e.code === "KeyP" || e.code === "Escape") {
      if (this.phase === "playing" || this.phase === "paused") this.togglePause();
    }
    if (e.code === "KeyM") this.toggleMute();
    if (this.phase === "playing" && (e.code === "KeyQ" || e.code === "KeyE")) {
      this.cycleDragon(e.code === "KeyE" ? 1 : -1);
    }
    if ((e.code === "Space" || e.code === "Enter") && (this.phase === "gameover" || this.phase === "victory")) {
      if (this.phase === "gameover" && this.time - this.overAt < 0.8) return;
      this.startGame();
    }
  };
  private ku = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.code === "Space" && !this.pointer.down && !this.fireButtonHeld) this.sfx.stopBreath();
  };
  private pd = (e: PointerEvent) => {
    this.sfx.ensure();
    this.pointer.down = true;
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  };
  private pm = (e: PointerEvent) => {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  };
  private pu = () => {
    this.pointer.down = false;
    if (!this.keys["Space"] && !this.fireButtonHeld) this.sfx.stopBreath();
  };
  private blur = () => {
    this.pointer.down = false;
    this.fireButtonHeld = false;
    this.resetBreath();
    for (const code of Object.keys(this.keys)) this.keys[code] = false;
  };

  private bind() {
    window.addEventListener("keydown", this.kd);
    window.addEventListener("keyup", this.ku);
    this.canvas.addEventListener("pointerdown", this.pd);
    window.addEventListener("pointermove", this.pm);
    window.addEventListener("pointerup", this.pu);
    window.addEventListener("pointercancel", this.pu);
    window.addEventListener("blur", this.blur);
    window.addEventListener("resize", this.resize);
  }

  private resize = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.canvas.style.width = this.W + "px";
    this.canvas.style.height = this.H + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.p.x = Math.min(Math.max(this.p.x, 40), this.W - 40);
    this.p.y = Math.min(Math.max(this.p.y, this.H * 0.35), this.H - 70);
    this.makeBg();
    this.seedEmbers();
  };

  /* ---------------- public controls ---------------- */

  startGame(mode = this.mode, dragonId = this.activeDragon, level = this.level) {
    this.sfx.ensure();
    this.sfx.click();
    this.score = 0;
    this.wave = 0;
    this.lives = 3;
    this.power = 1;
    this.shield = false;
    this.mode = mode;
    this.level = Math.min(MAX_LEVEL, Math.max(1, level));
    this.activeDragon = dragonId;
    this.levelComplete = false;
    this.switchCd = 0;
    this.newBest = false;
    this.resetBreath();
    this.fireButtonHeld = false;
    this.pointer.down = false;
    this.keys["Space"] = false;
    this.makeBg();
    this.ebullets = [];
    this.enemies = [];
    this.drops = [];
    this.popups = [];
    this.boss = null;
    this.spawnQueue = [];
    this.waveGap = 1.0;
    this.clearedFlag = false;
    this.p.x = this.W / 2;
    this.p.y = this.H - 110;
    this.p.inv = 1.2;
    this.p.fireCd = 0;
    this.shake = 0;
    this.flash = 0;
    this.phase = "playing";
    this.nextWave();
  }

  setHighScore(value: number) {
    this.hi = Math.max(this.hi, value);
  }

  setFireHeld(held: boolean) {
    this.fireButtonHeld = held;
    if (held) this.sfx.ensure();
  }

  setTheme(theme: ThemeName) {
    if (this.theme === theme) return;
    this.theme = theme;
    this.makeBg();
  }

  /** Restores lung capacity — called when a run begins or is resumed. */
  private resetBreath() {
    this.breath.phase = "idle";
    this.breath.t = 0;
    this.breath.stamina = 1;
    this.breath.output = 0;
    this.breath.charge = 0;
    this.breath.released = false;
    this.breathActive = false;
    this.sfx.stopBreath();
  }

  /**
   * Advances the inhale → blast → recover cycle. Damage and visuals are both
   * driven by the resulting envelope, so the flame visibly and audibly pulses
   * rather than running as an unbroken hose of fire.
   */
  private updateBreath(dt: number, fireHeld: boolean) {
    const b = this.breath;
    const dragon = dragonById(this.activeDragon);
    const profile = dragon.breath;

    if (!fireHeld) b.released = true;
    else b.released = false;

    switch (b.phase) {
      case "idle": {
        b.output = Math.max(0, b.output - dt * 6);
        b.charge = Math.max(0, b.charge - dt * 3);
        b.stamina = Math.min(1, b.stamina + profile.refill * 1.6 * dt);
        if (fireHeld && b.stamina > 0.12) {
          b.phase = "inhale";
          b.t = 0;
          this.sfx.breathInhale(dragon.fire);
        }
        break;
      }

      case "inhale": {
        b.t += dt;
        b.stamina = Math.min(1, b.stamina + profile.refill * 0.7 * dt);
        // Chest swells as air is drawn in.
        b.charge = Math.min(1, b.t / profile.inhale);
        b.output = Math.max(0, b.output - dt * 8);
        if (b.t >= profile.inhale) {
          b.phase = "blast";
          b.t = 0;
          b.output = 0.35;
          this.sfx.breathBlast(dragon.fire);
          this.shakePulse(2.4, 0.1);
        } else if (!fireHeld) {
          // Released mid-breath: abort without firing.
          b.phase = "recover";
          b.t = 0;
          b.charge = 0;
        }
        break;
      }

      case "blast": {
        b.t += dt;
        const progress = b.t / profile.blast;
        // Fast attack, sustained middle, tapering tail.
        let envelope: number;
        if (progress < 0.16) envelope = 0.35 + (progress / 0.16) * 0.65;
        else if (progress < 0.62) envelope = 1 - (progress - 0.16) * 0.12;
        else envelope = Math.max(0, 0.87 * (1 - (progress - 0.62) / 0.38));
        // Lungs running dry weakens the tail of the blast.
        const dryness = b.stamina < 0.25 ? 0.45 + b.stamina * 2.2 : 1;
        b.output = envelope * dryness;
        b.charge = Math.max(0, 1 - progress * 1.4);
        b.stamina = Math.max(0, b.stamina - profile.drain * dt);

        if (b.t >= profile.blast || b.stamina <= 0) {
          b.phase = "recover";
          b.t = 0;
          if (b.stamina <= 0.001) {
            b.phase = "winded";
            b.t = 0;
            this.sfx.breathWinded();
            this.popup(this.p.x, this.p.y - 46, "WINDED", "#ffb347", 13);
          } else {
            this.sfx.breathRecover(dragon.fire);
          }
        }
        break;
      }

      case "recover": {
        b.t += dt;
        b.output = Math.max(0, b.output - dt * 4.2);
        b.charge = Math.max(0, b.charge - dt * 2);
        b.stamina = Math.min(1, b.stamina + profile.refill * dt);
        if (b.t >= profile.recover) {
          b.phase = fireHeld && !b.released ? "inhale" : "idle";
          b.t = 0;
          if (b.phase === "inhale") this.sfx.breathInhale(dragon.fire);
        }
        break;
      }

      case "winded": {
        b.t += dt;
        b.output = Math.max(0, b.output - dt * 3);
        b.charge = 0;
        b.stamina = Math.min(1, b.stamina + profile.refill * 0.85 * dt);
        const ready = b.t >= profile.winded && b.stamina > 0.45;
        if (ready) {
          b.phase = "idle";
          b.t = 0;
        }
        break;
      }
    }

    this.breathActive = b.output > 0.02;
  }

  switchDragon(dragonId: DragonId) {
    if ((this.phase !== "playing" && this.phase !== "paused") || this.switchCd > 0 || dragonId === this.activeDragon) return;
    this.activeDragon = dragonId;
    this.switchCd = 2.5;
    this.switchFx = 0.65;
    this.p.inv = Math.max(this.p.inv, 0.55);
    const dragon = dragonById(dragonId);
    this.spawnBurst(this.p.x, this.p.y, dragon.fireColor, 24, 250, 4);
    this.popup(this.p.x, this.p.y - 48, dragon.power.toUpperCase(), dragon.accent, 16);
    this.sfx.powerup();
  }

  cycleDragon(direction: 1 | -1) {
    const current = DRAGONS.findIndex((dragon) => dragon.id === this.activeDragon);
    const next = (current + direction + DRAGONS.length) % DRAGONS.length;
    this.switchDragon(DRAGONS[next].id);
  }

  toMenu() {
    this.sfx.click();
    this.sfx.stopBreath();
    this.breathActive = false;
    this.fireButtonHeld = false;
    this.pointer.down = false;
    this.phase = "menu";
    this.ebullets = [];
    this.enemies = [];
    this.drops = [];
    this.boss = null;
    this.spawnQueue = [];
  }

  togglePause() {
    if (this.phase === "playing") {
      this.sfx.stopBreath();
      this.breathActive = false;
      this.fireButtonHeld = false;
      this.pointer.down = false;
      this.keys["Space"] = false;
      this.phase = "paused";
      this.sfx.click();
    } else if (this.phase === "paused") {
      this.phase = "playing";
      this.sfx.click();
    }
  }

  toggleMute() {
    this.sfx.ensure();
    this.sfx.muted = !this.sfx.muted;
    if (this.sfx.muted) this.sfx.stopBreath();
  }

  /* ---------------- background & ambience ---------------- */

  private seedEmbers() {
    this.embers = [];
    const n = Math.floor((this.W * this.H) / 26000);
    for (let i = 0; i < n; i++) {
      this.embers.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        spd: 12 + Math.random() * 34,
        size: 0.8 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.55,
      });
    }
  }

  private updateAmbient(dt: number) {
    if (this.phase === "menu") {
      this.flyerT -= dt;
      if (this.flyerT <= 0 && this.menuFlyers.length < 6) {
        this.flyerT = 1.3;
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.menuFlyers.push({
          x: dir === 1 ? -70 : this.W + 70,
          y: this.H * (0.05 + Math.random() * 0.78),
          dir,
          size: 15 + Math.random() * 15,
          t: Math.random() * 6,
          spd: 34 + Math.random() * 55,
          kind: (["drake", "wraith", "brute"] as EnemyKind[])[Math.floor(Math.random() * 3)],
        });
      }
      const keep: MenuFlyer[] = [];
      for (const f of this.menuFlyers) {
        f.x += f.dir * f.spd * dt;
        f.t += dt;
        if (f.x > -90 && f.x < this.W + 90) keep.push(f);
      }
      this.menuFlyers = keep;
    }
    for (const e of this.embers) {
      e.y -= e.spd * dt;
      e.x += Math.sin(this.time * 0.8 + e.phase) * 12 * dt;
      if (e.y < -10) {
        e.y = this.H + 10;
        e.x = Math.random() * this.W;
      }
    }
    // particles (run in every phase so menu / gameover look alive)
    const alive: Particle[] = [];
    for (const pt of this.parts) {
      if (pt.delay > 0) {
        pt.delay -= dt;
        if (pt.delay <= 0) this.spawnBurst(pt.x, pt.y, pt.color, 14, 260, 4);
        alive.push(pt);
        continue;
      }
      pt.life -= dt;
      if (pt.life <= 0) continue;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 1 - 2.2 * dt;
      pt.vy *= 1 - 2.2 * dt;
      alive.push(pt);
    }
    this.parts = alive.slice(-420);
    const pops: Popup[] = [];
    for (const pp of this.popups) {
      pp.life -= dt;
      pp.y -= 34 * dt;
      if (pp.life > 0) pops.push(pp);
    }
    this.popups = pops;
    this.shakeT = Math.max(0, this.shakeT - dt);
    this.shake = this.shakeT > 0 ? this.shakeMag * (this.shakeT / 0.5) : 0;
    this.flash = Math.max(0, this.flash - dt * 1.8);
  }

  private makeBg() {
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.floor(this.W));
    c.height = Math.max(2, Math.floor(this.H));
    const g = c.getContext("2d");
    if (!g) return;
    const W = this.W;
    const H = this.H;

    // Each realm paints its own sky, and light mode lifts the whole palette.
    const realm = levelById(this.level);
    const light = this.theme === "light";
    const sky = g.createLinearGradient(0, 0, 0, H);
    if (light) {
      sky.addColorStop(0, "#7fb6e0");
      sky.addColorStop(0.42, "#c9d9e6");
      sky.addColorStop(0.72, "#f0dcc4");
      sky.addColorStop(1, "#f6cfa6");
    } else if (this.mode === "levels") {
      sky.addColorStop(0, realm.theme.skyTop);
      sky.addColorStop(0.45, realm.theme.skyMid);
      sky.addColorStop(0.78, realm.theme.skyLow);
      sky.addColorStop(1, realm.theme.skyLow);
    } else {
      sky.addColorStop(0, "#05030a");
      sky.addColorStop(0.45, "#180a1f");
      sky.addColorStop(0.78, "#2d0f1d");
      sky.addColorStop(1, "#48150e");
    }
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // sun or moon, tinted per realm
    const moonTint = light ? "255,250,235" : this.mode === "levels" ? realm.theme.moon : "255,96,44";
    const mx = W * (light ? 0.22 : 0.8);
    const my = H * (light ? 0.14 : 0.16);
    const mr = Math.min(W, H) * (light ? 0.075 : 0.09);
    const moon = g.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 2.4);
    moon.addColorStop(0, `rgba(${moonTint},${light ? 0.5 : 0.22})`);
    moon.addColorStop(0.4, `rgba(${moonTint},${light ? 0.18 : 0.08})`);
    moon.addColorStop(1, `rgba(${moonTint},0)`);
    g.fillStyle = moon;
    g.fillRect(mx - mr * 2.4, my - mr * 2.4, mr * 4.8, mr * 4.8);
    g.fillStyle = `rgba(${moonTint},${light ? 0.9 : 0.16})`;
    g.beginPath();
    g.arc(mx, my, mr, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = `rgba(${moonTint},${light ? 0.6 : 0.3})`;
    g.lineWidth = 2;
    g.stroke();

    // stars, or drifting day clouds
    if (!light) {
      for (let i = 0; i < 110; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H * 0.6;
        g.fillStyle = `rgba(255,${180 + Math.floor(Math.random() * 60)},120,${0.15 + Math.random() * 0.5})`;
        g.fillRect(x, y, Math.random() < 0.15 ? 2 : 1, Math.random() < 0.15 ? 2 : 1);
      }
    } else {
      for (let i = 0; i < 16; i++) {
        const cx = Math.random() * W;
        const cy = Math.random() * H * 0.55;
        const cw = 60 + Math.random() * 190;
        const ch = 12 + Math.random() * 22;
        const cloud = g.createLinearGradient(0, cy - ch, 0, cy + ch);
        cloud.addColorStop(0, "rgba(255,255,255,0.85)");
        cloud.addColorStop(1, "rgba(255,255,255,0.25)");
        g.fillStyle = cloud;
        g.beginPath();
        g.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
        g.fill();
      }
    }

    // far ridge
    g.fillStyle = light ? "#8fa6bd" : this.mode === "levels" ? realm.theme.ridge : "#0c0514";
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = H * 0.68 + Math.sin(x * 0.006 + 2) * 34 + Math.sin(x * 0.017 + 5) * 16;
      g.lineTo(x, y);
    }
    g.lineTo(W, H);
    g.closePath();
    g.fill();

    // near ridge with rim light
    g.fillStyle = light ? "#6f8497" : this.mode === "levels" ? realm.theme.ridge : "#120818";
    g.beginPath();
    g.moveTo(0, H);
    const nearPts: [number, number][] = [];
    for (let x = 0; x <= W; x += 6) {
      const y = H * 0.82 + Math.sin(x * 0.004 + 8) * 40 + Math.sin(x * 0.011 + 1) * 22;
      nearPts.push([x, y]);
      g.lineTo(x, y);
    }
    g.lineTo(W, H);
    g.closePath();
    g.fill();
    g.strokeStyle = light
      ? "rgba(255,255,255,0.55)"
      : this.mode === "levels"
      ? realm.theme.ridgeRim
      : "rgba(255,107,26,0.28)";
    g.lineWidth = 2;
    g.beginPath();
    nearPts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.stroke();

    // horizon haze — warm realm glow, or soft daylight bloom
    const haze = light ? "rgba(255,246,224,0.55)" : this.mode === "levels" ? realm.theme.haze : "rgba(255,110,30,0.5)";
    const glow = g.createRadialGradient(W / 2, H * 1.05, 10, W / 2, H * 1.05, W * 0.7);
    glow.addColorStop(0, haze);
    glow.addColorStop(0.5, light ? "rgba(255,255,255,0.2)" : "rgba(255,60,20,0.16)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow;
    g.fillRect(0, H * 0.5, W, H * 0.5);

    // vignette — heavy in dark mode, barely there in daylight
    const vig = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, light ? "rgba(40,60,90,0.22)" : "rgba(0,0,0,0.55)");
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);

    this.bg = c;
  }

  /* ---------------- waves & spawning ---------------- */

  private setBanner(text: string) {
    this.banner = text;
    this.bannerT = 2.3;
    this.bannerId++;
  }

  private nextWave() {
    this.wave++;
    this.clearedFlag = false;
    this.bossWaveNow = this.mode === "levels" ? this.wave >= this.currentWaves() : this.wave % 4 === 0;
    if (this.bossWaveNow) {
      this.setBanner(this.bossName() + " APPROACHES");
      this.spawnBoss();
      this.sfx.roar();
      this.shakePulse(10, 0.5);
    } else {
      this.setBanner(this.mode === "levels" ? `LEVEL ${this.level} / WAVE ${this.wave}` : "WAVE " + this.wave);
      this.sfx.wave();
      this.buildWaveQueue();
    }
  }

  private buildWaveQueue() {
    const realm = levelById(this.level);
    const difficulty = this.mode === "levels" ? realm.difficulty : 1;
    const n = this.wave + (this.mode === "levels" ? (this.level - 1) * 2 : 0);
    const count = Math.min(6 + n * 2, 26);
    const margin = Math.max(70, this.W * 0.08);
    const usable = this.W - margin * 2;
    const cols = Math.min(8, 3 + Math.floor(n / 2));
    let i = 0;
    let delay = 0.6;
    while (i < count) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = margin + (usable * col) / Math.max(1, cols - 1) + (Math.random() - 0.5) * 26;
      const ty = 90 + row * 52 + Math.random() * 24;
      let kind: EnemyKind = "drake";
      if (n >= 3 && i % 5 === 4) kind = "brute";
      else if (n >= 2 && i % 3 === 2) kind = "wraith";
      this.spawnQueue.push({ t: delay, fn: () => this.spawnEnemy(kind, bx, ty) });
      delay += (kind === "wraith" ? 0.5 : 0.24) / difficulty;
      i++;
    }
  }

  private spawnEnemy(kind: EnemyKind, bx: number, ty: number) {
    if (this.phase !== "playing") return;
    const base: Enemy = {
      kind,
      x: bx,
      y: -50,
      baseX: bx,
      targetY: ty,
      hp: 1,
      r: 18,
      t: 0,
      amp: 55,
      phase: Math.random() * Math.PI * 2,
      spd: 1.1 + Math.random() * 0.7,
      fireT: 1 + Math.random() * 2,
      dir: 1,
      size: 19,
      flap: Math.random() * 6,
      hitT: 0,
      value: 100,
    };
    if (kind === "wraith") {
      base.dir = Math.random() < 0.5 ? -1 : 1;
      base.x = base.dir === 1 ? -50 : this.W + 50;
      base.baseX = base.x;
      base.targetY = 70 + Math.random() * this.H * 0.3;
      base.hp = 1;
      base.r = 15;
      base.size = 15;
      base.spd = (170 + this.wave * 6) / 150;
      base.value = 150;
    } else if (kind === "brute") {
      base.hp = 5;
      base.r = 28;
      base.size = 29;
      base.amp = 26;
      base.spd = 0.4;
      base.value = 250;
    } else {
      base.hp = 1;
      base.r = 17;
      base.size = 19;
      base.amp = 42 + Math.random() * 44;
      base.value = 100;
    }
    this.enemies.push(base);
  }

  private spawnBoss() {
    const level = levelById(this.level);
    const max = this.mode === "levels" ? level.bossHp : 60 + this.wave * 6;
    // Later realms give the guardian a faster, tighter attack rotation.
    const pace = this.mode === "levels" ? Math.max(0.7, 1.5 - level.difficulty * 0.32) : 1.4;
    this.boss = {
      x: this.W / 2,
      y: -140,
      hp: max,
      max,
      t: 0,
      flap: 0,
      atk: 0,
      atkT: 2.2,
      hitT: 0,
      pace,
      palette: BOSS_PALETTES[(this.level - 1) % BOSS_PALETTES.length],
    };
  }

  private bossName() {
    if (this.mode === "levels") return levelById(this.level).boss;
    return BOSS_NAMES[Math.floor(this.wave / 4 - 1) % BOSS_NAMES.length];
  }

  private currentWaves() {
    return this.mode === "levels" ? levelById(this.level).waves : this.levelWaves;
  }

  private firePlayer() {
    const p = this.p;
    const dragon = dragonById(this.activeDragon);
    const kind = dragon.fire;
    const strength = this.breath.output;
    p.fireCd = 0.045;

    // Loose motes tear away from the edge of the blast while it is live.
    const moteCount = Math.round((kind === "lightning" ? 5 : kind === "arcane" ? 6 : 4) * strength);
    for (let i = 0; i < moteCount; i++) {
      this.parts.push({
        x: p.x + (Math.random() - 0.5) * 16 * strength,
        y: p.y - 35,
        vx: (Math.random() - 0.5) * (kind === "venom" ? 110 : 80) * strength,
        vy: (-110 - Math.random() * 190) * strength,
        life: 0.18 + Math.random() * 0.16,
        max: 0.34,
        size: (1.4 + Math.random() * (kind === "arcane" ? 4 : 3)) * (0.5 + strength * 0.5),
        color: dragon.fireColor,
        delay: 0,
      });
    }
  }

  private enemyShot(x: number, y: number, vx: number, vy: number, kind: EBullet["kind"], r: number) {
    this.ebullets.push({ x, y, vx, vy, r, kind, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8 });
  }

  private aimedShot(x: number, y: number, speed: number, kind: EBullet["kind"], r: number, spread = 0) {
    const dx = this.p.x - x;
    const dy = this.p.y - y;
    const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
    this.enemyShot(x, y, Math.cos(a) * speed, Math.sin(a) * speed, kind, r);
  }

  /* ---------------- update ---------------- */

  private update(dt: number) {
    const p = this.p;
    const fireHeld = this.keys["Space"] || this.pointer.down || this.fireButtonHeld;
    this.updateBreath(dt, fireHeld);
    this.switchCd = Math.max(0, this.switchCd - dt);
    this.switchFx = Math.max(0, this.switchFx - dt);

    /* player */
    const speed = 430;
    let mx = 0;
    let my = 0;
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) mx -= 1;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) mx += 1;
    if (this.keys["ArrowUp"] || this.keys["KeyW"]) my -= 1;
    if (this.keys["ArrowDown"] || this.keys["KeyS"]) my += 1;
    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }
    if (this.pointer.down) {
      const dx = this.pointer.x - p.x;
      const dy = this.pointer.y - 40 - p.y;
      if (Math.abs(dx) > 6) p.x += Math.sign(dx) * Math.min(Math.abs(dx), 520 * dt);
      if (Math.abs(dy) > 6) p.y += Math.sign(dy) * Math.min(Math.abs(dy), 460 * dt);
    } else {
      p.x += mx * speed * dt;
      p.y += my * speed * dt;
    }
    p.x = Math.min(Math.max(p.x, 34), this.W - 34);
    p.y = Math.min(Math.max(p.y, this.H * 0.34), this.H - 64);
    p.flap += dt * (Math.abs(mx) + Math.abs(my) > 0 ? 13 : 7);
    p.inv = Math.max(0, p.inv - dt);
    p.fireCd -= dt;

    // ember trail
    p.trailT -= dt;
    if (p.trailT <= 0) {
      p.trailT = 0.045;
      this.parts.push({
        x: p.x + (Math.random() - 0.5) * 10,
        y: p.y + 26,
        vx: (Math.random() - 0.5) * 30,
        vy: 60 + Math.random() * 50,
        life: 0.35,
        max: 0.35,
        size: 2.5,
        color: dragonById(this.activeDragon).fireColor,
        delay: 0,
      });
    }

    // Ember motes only leave the mouth while the dragon is actually exhaling.
    if (this.breath.output > 0.05 && p.fireCd <= 0) {
      this.firePlayer();
    }

    /* spawn queue */
    const q: { t: number; fn: () => void }[] = [];
    for (const s of this.spawnQueue) {
      s.t -= dt;
      if (s.t <= 0) s.fn();
      else q.push(s);
    }
    this.spawnQueue = q;

    const eb: EBullet[] = [];
    for (const b of this.ebullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      if (b.y > this.H + 40 || b.y < -60 || b.x < -60 || b.x > this.W + 60) continue;
      // hit player?
      if (p.inv <= 0 && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 15) {
        this.hitPlayer();
        continue;
      }
      eb.push(b);
    }
    this.ebullets = eb;

    /* enemies */
    const es: Enemy[] = [];
    for (const e of this.enemies) {
      e.t += dt;
      e.flap += dt * 9;
      e.hitT = Math.max(0, e.hitT - dt);
      if (e.kind === "wraith") {
        e.x += e.dir * 170 * e.spd * dt;
        e.y = e.targetY + Math.sin(e.t * 2.2 + e.phase) * 36;
        e.fireT -= dt;
        if (e.fireT <= 0 && e.x > 40 && e.x < this.W - 40) {
          e.fireT = 1.5 + Math.random();
          this.enemyShot(e.x, e.y + 16, 0, 250, "fire", 6);
        }
        if (e.x < -70 || e.x > this.W + 70) continue; // flew off
      } else {
        e.y += (e.targetY - e.y) * Math.min(1, dt * 1.6);
        e.x = e.baseX + Math.sin(e.t * e.spd + e.phase) * e.amp;
        e.fireT -= dt;
        if (e.fireT <= 0) {
          if (e.kind === "drake") {
            e.fireT = 2.4 + Math.random() * 1.8;
            this.aimedShot(e.x, e.y + 14, 230 + this.wave * 8, "fire", 6, 0.2);
          } else {
            e.fireT = 2.3 + Math.random();
            const baseA = Math.atan2(p.y - e.y, p.x - e.x);
            for (const off of [-0.32, 0, 0.32]) {
              this.enemyShot(e.x, e.y + 18, Math.cos(baseA + off) * 190, Math.sin(baseA + off) * 190, "rock", 10);
            }
          }
        }
      }
      // ram player
      if (p.inv <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 15) {
        this.hitPlayer();
        this.killEnemy(e, true);
        continue;
      }
      es.push(e);
    }
    this.enemies = es;

    /* boss */
    if (this.boss) {
      const b = this.boss;
      b.t += dt;
      b.flap += dt * 3.2;
      b.hitT = Math.max(0, b.hitT - dt);
      b.y += (this.H * 0.17 - b.y) * Math.min(1, dt * 1.2);
      b.x = this.W / 2 + Math.sin(b.t * 0.45) * this.W * 0.32;
      const enraged = b.hp < b.max / 2;
      b.atkT -= dt;
      if (b.atkT <= 0 && b.y > 0) {
        b.atk = (b.atk + 1) % 3;
        b.atkT = enraged ? b.pace * 0.68 : b.pace;
        if (b.atk === 0) {
          for (let i = -3; i <= 3; i++) {
            const a = Math.PI / 2 + i * 0.21;
            this.enemyShot(b.x, b.y + 40, Math.cos(a) * 250, Math.sin(a) * 250, "fire", 7);
          }
        } else if (b.atk === 1) {
          this.aimedShot(b.x, b.y + 40, 330, "rock", 11, 0.1);
          this.enemyShot(b.x - 60, b.y + 30, -60, 220, "fire", 7);
          this.enemyShot(b.x + 60, b.y + 30, 60, 220, "fire", 7);
        } else {
          if (this.enemies.length < 6) {
            this.spawnEnemy("drake", b.x - 90, 160);
            this.spawnEnemy("drake", b.x + 90, 160);
          } else {
            for (let i = -2; i <= 2; i++) {
              const a = Math.PI / 2 + i * 0.26;
              this.enemyShot(b.x, b.y + 40, Math.cos(a) * 270, Math.sin(a) * 270, "rock", 9);
            }
          }
        }
        this.sfx.enemyHit();
      }
      // boss body vs player
      if (p.inv <= 0 && Math.hypot(b.x - p.x, b.y - p.y) < 66 + 15) this.hitPlayer();
    }

    if (fireHeld) this.damageBreath(dt);

    /* drops */
    const dr: Drop[] = [];
    for (const d of this.drops) {
      d.t += dt;
      d.y += 92 * dt;
      if (d.y > this.H + 30) continue;
      if (Math.hypot(d.x - p.x, d.y - p.y) < 30) {
        this.applyDrop(d);
        continue;
      }
      dr.push(d);
    }
    this.drops = dr;

    /* wave clear */
    this.bannerT = Math.max(0, this.bannerT - dt);
    if (!this.boss && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      if (!this.clearedFlag) {
        this.clearedFlag = true;
        const bonus = this.wave * 50;
        this.score += bonus;
        this.popup(this.W / 2, this.H * 0.4, "WAVE CLEARED  +" + bonus, "#ffc94d", 20);
        this.waveGap = 2.1;
      } else {
        this.waveGap -= dt;
        if (this.waveGap <= 0) {
          if (this.mode === "levels" && this.levelComplete) {
            this.phase = "victory";
            this.sfx.stopBreath();
            this.breathActive = false;
            this.overAt = this.time;
            this.setBanner("REALM CONQUERED");
            this.sfx.wave();
          } else {
            this.nextWave();
          }
        }
      }
    }

    if (this.score > this.hi) {
      this.hi = this.score;
      this.newBest = true;
    }
  }

  /* ---------------- combat helpers ---------------- */

  private breathRange() {
    return Math.min(this.H * 0.76, 540);
  }

  private breathShapeAt(t: number, kind = dragonById(this.activeDragon).fire) {
    const spread =
      kind === "inferno"
        ? 54
        : kind === "venom"
        ? 82
        : kind === "quake"
        ? 92
        : kind === "frost"
        ? 30
        : kind === "arcane"
        ? 26
        : kind === "solar"
        ? 40
        : kind === "sanguine"
        ? 62
        : 34; // lightning
    const powerScale = 1 + (this.power - 1) * 0.15;
    const swayAmount = kind === "lightning" ? 13 : kind === "sanguine" ? 12 : kind === "quake" ? 4 : 8;
    const sway = Math.sin(this.time * 5.4 + t * 11) * t * swayAmount;
    return {
      centerX: this.p.x + sway,
      halfWidth: 5 + spread * powerScale * Math.sin(Math.min(1, t) * Math.PI * 0.48),
    };
  }

  /** Continuous cone damage keeps the attack behaving like a breath weapon rather than a gun. */
  private damageBreath(dt: number) {
    // Nothing is burnt while the dragon is inhaling or catching its breath.
    if (this.breath.output <= 0.02) return;

    const dragon = dragonById(this.activeDragon);
    const range = this.breathRange() * (0.6 + this.breath.output * 0.4);
    const mouthY = this.p.y - 35;
    const powerScale = 1 + (this.power - 1) * 0.22;
    const dps = dragon.breath.dps * this.breath.output;

    for (const enemy of this.enemies) {
      const depth = mouthY - enemy.y;
      if (depth < 0 || depth > range) continue;
      const shape = this.breathShapeAt(depth / range, dragon.fire);
      if (Math.abs(enemy.x - shape.centerX) > shape.halfWidth + enemy.r * 0.55) continue;

      enemy.hp -= dps * powerScale * dt;
      if (enemy.hitT <= 0) {
        this.spark(enemy.x, enemy.y, dragon.fireColor);
        enemy.hitT = 0.1;
      }
    }

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.hp > 0) return true;
      this.killEnemy(enemy, false);
      return false;
    });

    if (this.boss) {
      const boss = this.boss;
      const depth = mouthY - boss.y;
      if (depth >= 0 && depth <= range) {
        const shape = this.breathShapeAt(depth / range, dragon.fire);
        if (Math.abs(boss.x - shape.centerX) < shape.halfWidth + 45) {
          boss.hp -= dps * powerScale * 0.92 * dt * this.breath.output;
          if (boss.hitT <= 0) {
            this.spark(boss.x, boss.y + 15, dragon.fireColor);
            boss.hitT = 0.12;
          }
          if (boss.hp <= 0) this.killBoss();
        }
      }
    }
  }

  private spark(x: number, y: number, color: string) {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 140;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.22, max: 0.22, size: 2.6, color, delay: 0 });
    }
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed: number, size: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.85);
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.4 + Math.random() * 0.5,
        max: 0.9,
        size: size * (0.6 + Math.random()),
        color: Math.random() < 0.35 ? "#ffc94d" : color,
        delay: 0,
      });
    }
  }

  private killEnemy(e: Enemy, byRam: boolean) {
    const c = PALETTES[e.kind];
    this.spawnBurst(e.x, e.y, c.body, e.kind === "brute" ? 26 : 16, e.kind === "brute" ? 320 : 230, 3.4);
    this.sfx.explode(e.kind === "brute");
    if (!byRam) {
      this.score += e.value;
      this.popup(e.x, e.y, "+" + e.value, "#ffc94d", 15);
      if (Math.random() < 0.13) this.drop(e.x, e.y);
    }
    this.shakePulse(e.kind === "brute" ? 6 : 2.5, 0.18);
  }

  private killBoss() {
    const b = this.boss;
    if (!b) return;
    this.boss = null;
    if (this.mode === "levels") this.levelComplete = true;
    this.score += 2500;
    this.popup(b.x, b.y, "+2500", "#ffc94d", 26);
    this.drop(b.x - 40, b.y, "power");
    this.drop(b.x + 40, b.y, "heal");
    // staged mega explosion
    for (let i = 0; i < 8; i++) {
      this.parts.push({
        x: b.x + (Math.random() - 0.5) * 160,
        y: b.y + (Math.random() - 0.5) * 90,
        vx: 0,
        vy: 0,
        life: 0,
        max: 0,
        size: 5,
        color: i % 2 ? "#ff5a3c" : "#ffc94d",
        delay: i * 0.13,
      });
    }
    this.ebullets = [];
    this.sfx.explode(true);
    this.shakePulse(20, 0.8);
    this.flash = 0.4;
  }

  private drop(x: number, y: number, force?: Drop["kind"]) {
    const r = Math.random();
    const kind: Drop["kind"] = force ?? (r < 0.45 ? "power" : r < 0.75 ? "heal" : "shield");
    this.drops.push({ kind, x: Math.min(Math.max(x, 30), this.W - 30), y, t: 0 });
  }

  private applyDrop(d: Drop) {
    this.sfx.powerup();
    if (d.kind === "power") {
      this.power = Math.min(3, this.power + 1);
      this.popup(this.p.x, this.p.y - 40, this.power === 3 ? "TRIPLE FLAME" : "DOUBLE FLAME", "#ff9a2a", 16);
    } else if (d.kind === "heal") {
      this.lives = Math.min(MAX_LIVES, this.lives + 1);
      this.popup(this.p.x, this.p.y - 40, "+1 LIFE", "#7dff5e", 16);
    } else {
      this.shield = true;
      this.popup(this.p.x, this.p.y - 40, "AEGIS SHIELD", "#5eead4", 16);
    }
    this.spawnBurst(d.x, d.y, "#ffc94d", 12, 180, 3);
  }

  private hitPlayer() {
    const p = this.p;
    if (p.inv > 0) return;
    if (this.shield) {
      this.shield = false;
      p.inv = 1.1;
      this.sfx.shieldBreak();
      this.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 60, color: "#5eead4", delay: 0, ring: true });
      this.shakePulse(8, 0.3);
      return;
    }
    this.lives -= 1;
    this.sfx.hurt();
    this.shakePulse(14, 0.45);
    this.flash = 0.3;
    this.spawnBurst(p.x, p.y, "#ff6b1a", 26, 300, 3.6);
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      p.inv = 2.2;
    }
  }

  private gameOver() {
    this.sfx.stopBreath();
    this.breathActive = false;
    this.fireButtonHeld = false;
    this.pointer.down = false;
    this.keys["Space"] = false;
    this.phase = "gameover";
    this.overAt = this.time;
    this.sfx.over();
    this.sfx.explode(true);
    this.spawnBurst(this.p.x, this.p.y, "#ff5a3c", 60, 380, 5);
    this.shakePulse(22, 0.9);
    this.flash = 0.5;
    if (this.score >= this.hi) {
      try {
        store.setItem("dragon-strike-hi", String(this.hi));
      } catch {
        /* ignore */
      }
    }
  }

  private popup(x: number, y: number, text: string, color: string, size: number) {
    this.popups.push({ x, y, text, life: 1.1, color, size });
  }

  private shakePulse(mag: number, t: number) {
    this.shakeMag = Math.max(this.shakeMag * (this.shakeT / 0.5 || 0), mag);
    this.shakeT = Math.max(this.shakeT, t);
    this.shake = mag;
  }

  /* ---------------- render ---------------- */

  private renderBreath(ctx: CanvasRenderingContext2D) {
    if (!this.breathActive || this.phase !== "playing") return;

    const dragon = dragonById(this.activeDragon);
    const output = this.breath.output;
    if (output <= 0.02) return;
    const originX = this.p.x;
    const originY = this.p.y - 35;
    // The plume reaches further at the peak of the blast and shrinks as it tapers.
    const tipY = Math.max(0, originY - this.breathRange() * (0.45 + output * 0.55));
    const kind = dragon.fire;
    const tNow = this.time;
    const reach = (tipY - originY) / (this.breathRange() || 1);

    const plume = (
      scale: number,
      fill: CanvasGradient | string,
      alpha: number,
      phase: number
    ) => {
      const left: [number, number][] = [];
      const right: [number, number][] = [];
      const steps = 28;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const shape = this.breathShapeAt(t, kind);
        const flicker = Math.sin(tNow * 18 + t * 21 + phase) * (2 + t * 8);
        const center = shape.centerX + flicker;
        const radius =
          shape.halfWidth * scale * output * (0.92 + Math.sin(tNow * 12 + t * 8 + phase) * 0.07) * (0.35 + t * 0.65);
        const y = originY + (tipY - originY) * t;
        left.push([center - radius, y]);
        right.push([center + radius, y]);
      }

      ctx.beginPath();
      left.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
      ctx.closePath();
      ctx.globalAlpha = alpha * (0.35 + output * 0.65);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const makeGradient = (stops: [number, string][]) => {
      const gradient = ctx.createLinearGradient(0, originY, 0, tipY);
      for (const [stop, color] of stops) gradient.addColorStop(stop, color);
      return gradient;
    };

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    if (kind === "inferno") {
      const haze = makeGradient([
        [0, "rgba(255,246,196,0.34)"],
        [0.18, "rgba(255,174,50,0.38)"],
        [0.72, "rgba(255,73,15,0.2)"],
        [1, "rgba(255,55,15,0)"],
      ]);
      const core = makeGradient([
        [0, "rgba(255,255,225,0.95)"],
        [0.14, "rgba(255,237,153,0.94)"],
        [0.48, "rgba(255,162,35,0.74)"],
        [0.83, "rgba(255,75,15,0.35)"],
        [1, "rgba(255,65,10,0)"],
      ]);
      ctx.shadowColor = dragon.fireColor;
      ctx.shadowBlur = 32;
      plume(1.48, haze, 0.9, 0);
      plume(0.72, core, 0.97, 1.2);

      // Curling tongues make the stream flicker like living flame.
      for (let tongue = 0; tongue < 7; tongue++) {
        const lane = (tongue - 3) / 3;
        const endT = 0.56 + (tongue % 3) * 0.12;
        ctx.beginPath();
        ctx.moveTo(originX + lane * 4, originY - 4);
        for (let i = 1; i <= 8; i++) {
          const t = (i / 8) * endT;
          const shape = this.breathShapeAt(t, kind);
          const wave = Math.sin(tNow * 16 + tongue * 2.7 + t * 18) * (3 + t * 17);
          ctx.lineTo(shape.centerX + lane * shape.halfWidth * 0.76 + wave, originY + (tipY - originY) * t);
        }
        ctx.strokeStyle = tongue % 2 ? "rgba(255,236,142,0.65)" : "rgba(255,104,27,0.72)";
        ctx.lineWidth = 2 + (tongue % 3);
        ctx.shadowBlur = 14;
        ctx.stroke();
      }
    } else if (kind === "lightning") {
      const cloud = makeGradient([
        [0, "rgba(205,248,255,0.44)"],
        [0.42, "rgba(55,190,255,0.33)"],
        [1, "rgba(55,190,255,0)"],
      ]);
      plume(1.32, cloud, 0.62, 0.4);
      for (let bolt = 0; bolt < 4; bolt++) {
        ctx.beginPath();
        const lane = (bolt - 1.5) * 0.24;
        ctx.moveTo(originX + lane * 9, originY);
        for (let i = 1; i <= 17; i++) {
          const t = i / 17;
          const shape = this.breathShapeAt(t, kind);
          const jitter = Math.sin(tNow * 42 + i * 11 + bolt * 7) * (4 + t * 13);
          ctx.lineTo(shape.centerX + lane * shape.halfWidth + jitter, originY + (tipY - originY) * t);
        }
        ctx.strokeStyle = bolt === 0 ? "rgba(255,255,255,0.95)" : "rgba(93,218,255,0.85)";
        ctx.lineWidth = bolt === 0 ? 3.5 : 1.7;
        ctx.shadowColor = dragon.fireColor;
        ctx.shadowBlur = 18;
        ctx.stroke();
      }
    } else if (kind === "venom") {
      const fumes = makeGradient([
        [0, "rgba(221,255,158,0.56)"],
        [0.25, "rgba(92,240,75,0.42)"],
        [0.76, "rgba(50,174,65,0.23)"],
        [1, "rgba(50,174,65,0)"],
      ]);
      ctx.shadowColor = dragon.fireColor;
      ctx.shadowBlur = 28;
      plume(1.62, fumes, 0.7, 0.2);
      for (let bubble = 0; bubble < 18; bubble++) {
        const t = (tNow * 0.36 + bubble * 0.173) % 1;
        const shape = this.breathShapeAt(t, kind);
        const side = Math.sin(tNow * 4 + bubble * 5.3) * shape.halfWidth * 0.74;
        const y = originY + (tipY - originY) * t;
        const radius = 1.4 + (bubble % 4) * 0.8;
        ctx.globalAlpha = 0.42 + 0.28 * Math.sin(tNow * 8 + bubble);
        ctx.strokeStyle = bubble % 2 ? "#d4ff9c" : "#57ea49";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(shape.centerX + side, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (kind === "frost") {
      // Cryonax — a hard, narrow cone of supercooled vapour with crystal shards.
      const mist = makeGradient([
        [0, "rgba(240,253,255,0.8)"],
        [0.3, "rgba(127,220,255,0.55)"],
        [1, "rgba(127,220,255,0)"],
      ]);
      ctx.shadowColor = dragon.fireColor;
      ctx.shadowBlur = 26;
      plume(1.12, mist, 0.85, 0.3);
      for (let shard = 0; shard < 9; shard++) {
        const t = ((tNow * 1.5 + shard * 0.111) % 1) * reach;
        const shape = this.breathShapeAt(t, kind);
        const y = originY - this.breathRange() * t;
        const side = Math.sin(tNow * 3 + shard * 2.2) * shape.halfWidth * 0.7;
        const size = (2 + (shard % 3)) * output;
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(tNow * 7 + shard);
        ctx.strokeStyle = shard % 2 ? "#ffffff" : "#a7ecff";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(shape.centerX + side - size, y);
        ctx.lineTo(shape.centerX + side + size, y - size * 1.3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (kind === "solar") {
      // Solvaris — short searing flashes with radiating rays.
      const beam = makeGradient([
        [0, "rgba(255,255,240,0.95)"],
        [0.25, "rgba(255,220,110,0.8)"],
        [1, "rgba(255,190,60,0)"],
      ]);
      ctx.shadowColor = dragon.fireColor;
      ctx.shadowBlur = 40;
      plume(0.9, beam, 0.95, 0.1);
      for (let ray = 0; ray < 8; ray++) {
        const lane = (ray - 3.5) / 3.5;
        ctx.beginPath();
        ctx.moveTo(originX + lane * 6, originY - 2);
        const shape = this.breathShapeAt(reach, kind);
        ctx.lineTo(shape.centerX + lane * shape.halfWidth * 0.95, tipY + 10);
        ctx.strokeStyle = ray % 2 ? "rgba(255,250,220,0.9)" : "rgba(255,205,80,0.8)";
        ctx.lineWidth = 2.2 - (ray % 3) * 0.4;
        ctx.stroke();
      }
      // Screen-flash at the moment of release.
      ctx.globalAlpha = output * 0.22;
      ctx.fillStyle = "#fff3c4";
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.globalAlpha = 1;
    } else if (kind === "quake") {
      // Terraxis — a heavy gravel-laden concussion cone.
      const debris = makeGradient([
        [0, "rgba(255,226,186,0.8)"],
        [0.22, "rgba(217,142,74,0.6)"],
        [0.8, "rgba(120,74,32,0.3)"],
        [1, "rgba(120,74,32,0)"],
      ]);
      ctx.shadowColor = dragon.fireColor;
      ctx.shadowBlur = 22;
      plume(1.75, debris, 0.8, 0.5);
      for (let chunk = 0; chunk < 14; chunk++) {
        const t = ((tNow * 0.9 + chunk * 0.071) % 1) * reach;
        const shape = this.breathShapeAt(t, kind);
        const y = originY - this.breathRange() * t;
        const side = Math.sin(tNow * 5 + chunk * 3.1) * shape.halfWidth * 0.8;
        ctx.globalAlpha = 0.4 + 0.4 * Math.cos(tNow * 6 + chunk);
        ctx.fillStyle = chunk % 3 === 0 ? "#ffd9ac" : "#a97a45";
        ctx.beginPath();
        ctx.arc(shape.centerX + side, y, (1.6 + (chunk % 4)) * output, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (kind === "sanguine") {
      // Sanguinar — a living crimson torrent that whips as it travels.
      const gout = makeGradient([
        [0, "rgba(255,240,244,0.9)"],
        [0.2, "rgba(255,77,109,0.75)"],
        [0.75, "rgba(150,10,40,0.4)"],
        [1, "rgba(150,10,40,0)"],
      ]);
      ctx.shadowColor = dragon.fireColor;
      ctx.shadowBlur = 30;
      plume(1.35, gout, 0.85, 0.6);
      for (let wisp = 0; wisp < 6; wisp++) {
        ctx.beginPath();
        for (let i = 0; i <= 18; i++) {
          const t = (i / 18) * reach;
          const shape = this.breathShapeAt(t, kind);
          const swirl = Math.sin(tNow * 9 + t * 20 + wisp * 1.7) * shape.halfWidth * 0.8;
          const x = shape.centerX + swirl;
          const y = originY - this.breathRange() * t;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wisp % 2 ? "rgba(255,190,205,0.85)" : "rgba(255,60,90,0.8)";
        ctx.lineWidth = wisp % 3 === 0 ? 3 : 1.6;
        ctx.stroke();
      }
    } else {
      const astral = makeGradient([
        [0, "rgba(248,226,255,0.88)"],
        [0.2, "rgba(207,119,255,0.7)"],
        [0.7, "rgba(116,45,198,0.38)"],
        [1, "rgba(116,45,198,0)"],
      ]);
      plume(1.55, astral, 0.62, 0.8);
      for (let ribbon = 0; ribbon < 3; ribbon++) {
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i / 24;
          const shape = this.breathShapeAt(t, kind);
          const helix = Math.sin(tNow * 5 + t * 25 + ribbon * 2.1) * shape.halfWidth * 0.62;
          const x = shape.centerX + helix;
          const y = originY + (tipY - originY) * t;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ribbon === 1 ? "rgba(255,255,255,0.9)" : "rgba(221,160,255,0.72)";
        ctx.lineWidth = ribbon === 1 ? 3 : 1.5;
        ctx.shadowColor = dragon.fireColor;
        ctx.shadowBlur = 20;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private render() {
    const ctx = this.ctx;
    const W = this.W;
    const H = this.H;
    ctx.clearRect(0, 0, W, H);
    const sx = (Math.random() - 0.5) * this.shake * 2;
    const sy = (Math.random() - 0.5) * this.shake * 2;
    ctx.save();
    ctx.translate(sx, sy);

    if (this.bg) ctx.drawImage(this.bg, 0, 0, W, H);
    else {
      ctx.fillStyle = "#0b0710";
      ctx.fillRect(0, 0, W, H);
    }

    // ambient embers
    ctx.globalCompositeOperation = "lighter";
    for (const e of this.embers) {
      const tw = 0.6 + 0.4 * Math.sin(this.time * 2 + e.phase);
      ctx.fillStyle = `rgba(255,150,60,${(e.alpha * tw).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    if (this.phase === "menu") {
      this.renderMenuFlyers(ctx);
      ctx.restore();
      return;
    }

    /* drops */
    for (const d of this.drops) {
      const bob = Math.sin(d.t * 5) * 3;
      const y = d.y + bob;
      const pulse = 1 + 0.12 * Math.sin(d.t * 6);
      const col = d.kind === "power" ? "#ff9a2a" : d.kind === "heal" ? "#ffd166" : "#5eead4";
      ctx.save();
      ctx.translate(d.x, y);
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 13 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = col;
      if (d.kind === "power") {
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(7, -2, 4, 5);
        ctx.quadraticCurveTo(2, 9, 0, 9);
        ctx.quadraticCurveTo(-2, 9, -4, 5);
        ctx.quadraticCurveTo(-7, -2, 0, -8);
        ctx.fill();
      } else if (d.kind === "heal") {
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.bezierCurveTo(-9, 0, -7, -8, 0, -3.5);
        ctx.bezierCurveTo(7, -8, 9, 0, 0, 7);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    /* enemies */
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      drawDragon(ctx, e.size, e.flap, PALETTES[e.kind], {
        flip: true,
        spikes: e.kind === "brute",
        wingStyle: e.kind === "wraith" ? "feathered" : e.kind === "brute" ? "spiked" : "classic",
        hornStyle: e.kind === "brute" ? "crowned" : e.kind === "wraith" ? "bladed" : "curved",
      });
      if (e.hitT > 0) {
        ctx.globalAlpha = Math.min(1, e.hitT * 9);
        drawDragon(ctx, e.size, e.flap, { body: "#fff", belly: "#fff", wing: "#fff", wingRim: "#fff", horn: "#fff", eye: "#fff" }, { flip: true });
      }
      ctx.restore();
    }

    /* boss */
    if (this.boss) {
      const b = this.boss;
      ctx.save();
      ctx.translate(b.x, b.y);
      const rage = b.hp < b.max / 2;
      ctx.shadowColor = rage ? "#ff3d2e" : "#ff6b1a";
      ctx.shadowBlur = 30;
      drawDragon(ctx, 60, b.flap, b.palette, {
        flip: true,
        spikes: true,
        glowEye: 20,
        wingStyle: this.level % 3 === 1 ? "spiked" : this.level % 3 === 2 ? "plated" : "rift",
        hornStyle: this.level % 2 === 0 ? "crowned" : "tusk",
      });
      ctx.shadowBlur = 0;
      if (b.hitT > 0) {
        ctx.globalAlpha = Math.min(1, b.hitT * 10);
        drawDragon(ctx, 60, b.flap, { body: "#fff", belly: "#fff", wing: "#fff", wingRim: "#fff", horn: "#fff", eye: "#fff" }, { flip: true, spikes: true });
      }
      ctx.restore();
    }

    /* enemy bullets */
    for (const b of this.ebullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      if (b.kind === "fire") {
        ctx.shadowColor = "#7dff5e";
        ctx.shadowBlur = 10;
        const g = ctx.createRadialGradient(0, 0, 0.5, 0, 0, b.r + 3);
        g.addColorStop(0, "#eaffcc");
        g.addColorStop(0.5, "#7dff5e");
        g.addColorStop(1, "rgba(125,255,94,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, b.r + 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.rotate(b.rot);
        ctx.fillStyle = "#c2410c";
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff9a5a";
        ctx.beginPath();
        ctx.arc(-b.r * 0.25, -b.r * 0.25, b.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,150,80,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-b.r * 0.6, 0);
        ctx.lineTo(b.r * 0.6, 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    this.renderBreath(ctx);

    /* particles */
    for (const pt of this.parts) {
      if (pt.delay > 0) continue;
      const a = Math.max(0, pt.life / pt.max);
      if (pt.ring) {
        ctx.strokeStyle = `rgba(94,234,212,${a.toFixed(3)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (1.6 - a * 0.6), 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (0.5 + a * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    /* player dragon */
    const p = this.p;
    const blink = p.inv > 0 && Math.floor(this.time * 18) % 2 === 0;
    if (this.phase !== "gameover") {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (blink) ctx.globalAlpha = 0.35;
      const active = dragonById(this.activeDragon);
      ctx.shadowColor = active.fireColor;
      ctx.shadowBlur = 18;
      drawDragon(ctx, 26, p.flap, active.palette, {
        glowEye: 12,
        spikes: this.activeDragon === "void" || this.activeDragon === "venom" || this.activeDragon === "stone",
        wingStyle: active.wingStyle,
        hornStyle: active.hornStyle,
        // The jaw hinges open on the exhale and the chest glows while inhaling.
        breathing: this.breath.phase === "inhale" || this.breath.output > 0.02,
        jawOpen: this.breath.phase === "inhale" ? 0.35 + this.breath.charge * 0.25 : this.breath.output,
        lungGlow: this.breath.phase === "inhale" ? this.breath.charge : this.breath.output * 0.7,
        breathPhase: this.time,
      });
      ctx.shadowBlur = 0;
      if (this.switchFx > 0) {
        ctx.globalAlpha = Math.min(1, this.switchFx * 2);
        ctx.strokeStyle = active.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 42 + (0.65 - this.switchFx) * 90, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (this.shield) {
        ctx.strokeStyle = "rgba(94,234,212,0.85)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#5eead4";
        ctx.shadowBlur = 12;
        const r = 40 + Math.sin(this.time * 5) * 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + this.time;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    /* popups */
    ctx.textAlign = "center";
    for (const pp of this.popups) {
      const a = Math.min(1, pp.life / 0.4);
      ctx.font = `800 ${pp.size}px "Alegreya Sans", sans-serif`;
      ctx.fillStyle = "rgba(0,0,0," + (a * 0.6).toFixed(3) + ")";
      ctx.fillText(pp.text, pp.x + 1.5, pp.y + 1.5);
      ctx.globalAlpha = a;
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    /* hurt flash */
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,150,60,${(this.flash * 0.4).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  private renderMenuFlyers(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.menuFlyers.length; i++) {
      const f = this.menuFlyers[i];
      ctx.save();
      ctx.translate(f.x, f.y + Math.sin(f.t * 1.4) * 14);
      ctx.globalAlpha = 0.6;
      const pal = MENU_PALETTES[i % MENU_PALETTES.length];
      drawDragon(ctx, f.size, f.t * 7, pal, { flip: true, spikes: f.kind === "brute", glowEye: 8 });
      ctx.restore();
    }
  }

  /* ---------------- HUD sync ---------------- */

  private pushHud() {
    const h: HudState = {
      phase: this.phase,
      score: this.score,
      hi: this.hi,
      wave: this.wave,
      lives: this.lives,
      power: this.power,
      shield: this.shield,
      boss: this.boss ? { name: this.bossName(), hp: Math.max(0, this.boss.hp), max: this.boss.max } : null,
      banner: this.bannerT > 0 ? this.banner : null,
      bannerId: this.bannerId,
      muted: this.sfx.muted,
      newBest: this.newBest,
      bossWave: this.bossWaveNow,
      mode: this.mode,
      level: this.level,
      levelWave: this.wave,
      levelWaves: this.currentWaves(),
      activeDragon: this.activeDragon,
      switchCooldown: Math.ceil(this.switchCd * 10) / 10,
      breathPhase: this.breath.phase,
      breathStamina: Math.round(this.breath.stamina * 100) / 100,
      breathOutput: Math.round(this.breath.output * 100) / 100,
      theme: this.theme,
      totalLevels: MAX_LEVEL,
    };
    const s = JSON.stringify(h);
    if (s !== this.lastHud) {
      this.lastHud = s;
      this.onHud(h);
    }
  }
}
