import { DrakeAudio } from "./audio";
import { LEVELS, realmOf } from "./levels";
import {
  H,
  W,
  type BrickKind,
  type HudState,
  type OverlayKind,
  type OverlayState,
  type PowerKind,
} from "./types";

const PAD_X = 34;
const TOP = 56;
const GAP = 5;
const BRICK_H = 22;
const PADDLE_Y = H - 54;
const BASE_PAD_W = 132;
const WIDE_PAD_W = 204;
const SHRUNK_PAD_W = 84;
const PAD_H = 18;
const BALL_R = 11;
const BASE_SPEED = 5.0;
const MAX_PARTICLES = 420;
import { queueCloudSave, reportRun } from "../dps";

const HS_KEY = "drakebreaker-hs";
const PROGRESS_KEY = "drakebreaker-unlocked";
const AIM_MIN = 18;
const AIM_MAX = 162;
const GUIDE_LEN = 340;
const RAGE_SECONDS = 6.5;
const BOOST_MULT = 1.6;

export type Toast = { id: number; text: string };
type ReadyReason = "level" | "life" | "catch";

type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BrickKind;
  hp: number;
  maxHp: number;
  points: number;
  alive: boolean;
  flash: number;
  phase: number;
};

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  stuck: boolean;
  stuckOff: number;
  autoLaunch: number;
  trail: { x: number; y: number; a: number }[];
};

type Drop = { x: number; y: number; kind: PowerKind; vy: number; rot: number };
type Beam = { x: number; y: number; w: number; h: number; vy: number };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  g: number;
  kind: "ember" | "spark" | "shard" | "smoke" | "star";
};
type Floater = { x: number; y: number; text: string; life: number; color: string };
type Pt = { x: number; y: number };
type EffectMap = Partial<Record<PowerKind, number>>;

const CELL_KIND: Record<string, BrickKind> = {
  e: "ember",
  s: "scale",
  c: "crystal",
  g: "gold",
  m: "magma",
  o: "obsidian",
  r: "rune",
  b: "bone",
  f: "frost",
  v: "venom",
};

const BRICK_HP: Record<BrickKind, number> = {
  ember: 1,
  scale: 2,
  crystal: 3,
  gold: 1,
  magma: 1,
  obsidian: 999,
  rune: 4,
  bone: 1,
  frost: 2,
  venom: 1,
};

const BRICK_PTS: Record<BrickKind, number> = {
  ember: 50,
  scale: 80,
  crystal: 120,
  gold: 260,
  magma: 110,
  obsidian: 0,
  rune: 200,
  bone: 40,
  frost: 90,
  venom: 70,
};

const BRICK_PAL: Record<BrickKind, [string, string, string]> = {
  ember: ["#ff9a4a", "#ea580c", "#7c2d12"],
  scale: ["#6ee7b7", "#059669", "#064e3b"],
  crystal: ["#93c5fd", "#2563eb", "#1e3a8a"],
  gold: ["#fde68a", "#d97706", "#78350f"],
  magma: ["#fb7185", "#e11d48", "#7f1d1d"],
  obsidian: ["#52525b", "#18181b", "#09090b"],
  rune: ["#e9d5ff", "#7c3aed", "#3b0764"],
  bone: ["#fffbeb", "#d6d3d1", "#57534e"],
  frost: ["#ecfeff", "#22d3ee", "#155e75"],
  venom: ["#d9f99d", "#4d7c0f", "#1a2e05"],
};

const DROP_GLYPH: Record<PowerKind, string> = {
  multi: "●●",
  wide: "━",
  laser: "▲",
  pierce: "✦",
  slow: "❄",
  life: "♥",
  sticky: "◉",
  rage: "☠",
  shrink: "▼",
};

const DROP_COLOR: Record<PowerKind, string> = {
  multi: "#ffb347",
  wide: "#5eead4",
  laser: "#fb7185",
  pierce: "#fde68a",
  slow: "#93c5fd",
  life: "#f43f5e",
  sticky: "#fbbf24",
  rage: "#ff4500",
  shrink: "#a3e635",
};

function rand(a = 0, b = 1) {
  return a + Math.random() * (b - a);
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function hypot(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}
function circleRect(x: number, y: number, r: number, b: Brick) {
  const nx = clamp(x, b.x, b.x + b.w);
  const ny = clamp(y, b.y, b.y + b.h);
  const dx = x - nx;
  const dy = y - ny;
  return dx * dx + dy * dy <= r * r;
}

export function loadUnlocked(): number {
  const n = Number(localStorage.getItem(PROGRESS_KEY) || 1);
  return clamp(Number.isFinite(n) ? n : 1, 1, LEVELS.length);
}

export function resetUnlocked() {
  localStorage.removeItem(PROGRESS_KEY);
}

export type EngineCallbacks = {
  onHud: (h: HudState) => void;
  onOverlay: (o: OverlayState) => void;
  onToast: (t: Toast) => void;
};

export class DrakeGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  audio = new DrakeAudio();
  cbs: EngineCallbacks;

  bricks: Brick[] = [];
  balls: Ball[] = [];
  drops: Drop[] = [];
  beams: Beam[] = [];
  particles: Particle[] = [];
  floaters: Floater[] = [];
  bgEmbers: Particle[] = [];

  paddle = {
    x: W / 2 - BASE_PAD_W / 2,
    y: PADDLE_Y,
    w: BASE_PAD_W,
    h: PAD_H,
    targetX: W / 2 - BASE_PAD_W / 2,
    facing: 1,
    lastX: W / 2,
  };

  score = 0;
  lives = 3;
  level = 0;
  combo = 0;
  comboTimer = 0;
  rage = 0;
  rageActive = 0;
  effects: EffectMap = {};
  high = Number(localStorage.getItem(HS_KEY) || 0);
  unlocked = loadUnlocked();
  overlay: OverlayKind = "ready";
  readyReason: ReadyReason = "level";
  running = false;
  raf = 0;
  lastT = 0;
  hudAcc = 0;
  laserAcc = 0;
  keys = { left: false, right: false };
  aimKeys = { left: false, right: false };
  shake = 0;
  time = 0;
  toastId = 1;

  // aiming
  aimAngle = 90;
  aimPressed = false;
  aimLock = 0;

  // pacing
  speedTier = 1;
  boosting = false;

  constructor(canvas: HTMLCanvasElement, cbs: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    this.ctx = ctx;
    this.cbs = cbs;
    this.fit();
    for (let i = 0; i < 55; i++) this.spawnBgEmber(true);
  }

  /* ---------- lifecycle ---------- */

  fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start(levelIdx = 0) {
    this.running = true;
    this.loadLevel(clamp(levelIdx, 0, LEVELS.length - 1));
    this.lastT = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      const dt = clamp((t - this.lastT) / 16.666, 0.2, 2.1);
      this.lastT = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.audio.destroy();
  }

  get aiming() {
    return this.overlay === "ready" && this.balls.length > 0 && this.balls.every((b) => b.stuck);
  }

  private loadLevel(idx: number) {
    this.level = idx;
    const def = LEVELS[idx];
    const cols = def.cols;
    const brickW = (W - PAD_X * 2 - GAP * (cols - 1)) / cols;
    this.bricks = [];
    def.rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const kind = CELL_KIND[row[c]];
        if (!kind) continue;
        const hp = BRICK_HP[kind];
        this.bricks.push({
          x: PAD_X + c * (brickW + GAP),
          y: TOP + r * (BRICK_H + GAP),
          w: brickW,
          h: BRICK_H,
          kind,
          hp,
          maxHp: hp,
          points: BRICK_PTS[kind],
          alive: true,
          flash: 0,
          phase: rand(0, Math.PI * 2),
        });
      }
    });
    this.drops = [];
    this.beams = [];
    this.particles = [];
    this.floaters = [];
    this.effects = {};
    this.paddle.w = BASE_PAD_W;
    this.rageActive = 0;
    this.combo = 0;
    this.boosting = false;
    this.resetBalls();
    this.readyReason = "level";
    this.enterAim();
  }

  private resetBalls() {
    this.balls = [
      {
        x: this.paddle.x + this.paddle.w / 2,
        y: this.paddle.y - BALL_R - 1,
        vx: 0,
        vy: 0,
        r: BALL_R,
        stuck: true,
        stuckOff: this.paddle.w / 2,
        autoLaunch: 0,
        trail: [],
      },
    ];
  }

  private enterAim() {
    this.overlay = "ready";
    this.aimPressed = false;
    this.aimLock = 0.35;
    this.pushOverlay();
  }

  private levelSpeed() {
    return BASE_SPEED + Math.min(this.level, 30) * 0.075;
  }

  private currentSpeed() {
    let s = this.levelSpeed();
    if ((this.effects.slow ?? 0) > 0) s *= 0.62;
    if (this.rageActive > 0) s *= 1.12;
    s *= this.speedTier;
    if (this.boosting) s *= BOOST_MULT;
    return s;
  }

  /* ---------- input ---------- */

  pointerMove(x: number, y: number) {
    if (this.aiming) {
      this.aimTo(x, y);
    } else {
      this.paddle.targetX = x - this.paddle.w / 2;
    }
  }

  pointerDown(x: number, y: number) {
    this.audio.unlock();
    if (this.overlay === "paused") {
      this.resume();
      return;
    }
    if (this.aiming) {
      this.aimPressed = true;
      this.aimTo(x, y);
    }
  }

  pointerUp() {
    if (this.aiming && this.aimPressed) this.fire();
    this.aimPressed = false;
  }

  wheel(dir: number) {
    if (!this.aiming) return;
    this.aimAngle = clamp(this.aimAngle - dir * 4, AIM_MIN, AIM_MAX);
  }

  private aimTo(px: number, py: number) {
    const b = this.balls.find((k) => k.stuck);
    if (!b) return;
    const dx = px - b.x;
    const dy = b.y - py;
    if (dy <= 4) {
      this.aimAngle = dx >= 0 ? AIM_MIN : AIM_MAX;
      return;
    }
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    this.aimAngle = clamp(deg, AIM_MIN, AIM_MAX);
  }

  setAimKey(dir: -1 | 1, on: boolean) {
    if (dir < 0) this.aimKeys.left = on;
    else this.aimKeys.right = on;
  }

  setBoost(on: boolean) {
    if (this.boosting === on) return;
    this.boosting = on;
    if (this.overlay === "playing") this.audio.boost(on);
    this.pushHud();
  }

  setSpeedTier(t: number) {
    const tier = clamp(t, 1, 2);
    if (tier === this.speedTier) return;
    this.speedTier = tier;
    this.toast(`Pace ×${tier}`);
    this.pushHud();
  }

  keyDown(e: string) {
    this.audio.unlock();
    const k = e.toLowerCase();
    if (k === "arrowleft" || k === "a") this.keys.left = true;
    if (k === "arrowright" || k === "d") this.keys.right = true;
    if (k === "shift") this.setBoost(true);
    if (k === "1") this.setSpeedTier(1);
    if (k === "2") this.setSpeedTier(1.5);
    if (k === "3") this.setSpeedTier(2);
    if (k === " " || k === "spacebar" || k === "arrowup" || k === "w" || k === "enter") {
      if (this.aiming) this.fire();
      else if (k === " " || k === "spacebar") {
        if (this.overlay === "playing") this.pause();
        else if (this.overlay === "paused") this.resume();
      }
    }
    if (k === "p" || k === "escape") {
      if (this.overlay === "playing") this.pause();
      else if (this.overlay === "paused") this.resume();
    }
    if (k === "f" && this.rage >= 100 && this.overlay === "playing") this.activateRage();
    if (k === "m") {
      this.audio.toggleMute();
      this.pushHud();
    }
  }

  keyUp(e: string) {
    const k = e.toLowerCase();
    if (k === "arrowleft" || k === "a") this.keys.left = false;
    if (k === "arrowright" || k === "d") this.keys.right = false;
    if (k === "shift") this.setBoost(false);
  }

  /* ---------- flow ---------- */

  fire() {
    if (!this.aiming || this.aimLock > 0) return;
    this.launch(this.aimAngle);
  }

  private launch(angleDeg: number) {
    const stuck = this.balls.filter((b) => b.stuck);
    if (!stuck.length) return;
    for (const b of stuck) this.releaseBall(b, angleDeg);
    this.audio.launch();
    this.aimPressed = false;
    this.paddle.targetX = this.paddle.x;
    const b0 = stuck[0];
    for (let i = 0; i < 14; i++) {
      this.spawnParticle({
        x: b0.x,
        y: b0.y,
        vx: rand(-2.2, 2.2),
        vy: rand(-3.5, 0.5),
        life: 22,
        max: 22,
        size: rand(1.5, 3.5),
        color: i % 2 ? "#fde68a" : "#ff7a2e",
        g: 0.05,
        kind: "spark",
      });
    }
    if (this.overlay === "ready") {
      this.overlay = "playing";
      this.pushOverlay();
    }
  }

  private releaseBall(ball: Ball, angleDeg: number) {
    const rad = (clamp(angleDeg, AIM_MIN, AIM_MAX) * Math.PI) / 180;
    const spd = this.currentSpeed();
    ball.stuck = false;
    ball.autoLaunch = 0;
    ball.vx = Math.cos(rad) * spd;
    ball.vy = -Math.sin(rad) * spd;
  }

  pause() {
    if (this.overlay !== "playing") return;
    this.overlay = "paused";
    this.pushOverlay();
  }

  resume() {
    if (this.overlay !== "paused") return;
    this.overlay = this.balls.some((b) => b.stuck) && this.balls.every((b) => b.stuck) ? "ready" : "playing";
    this.aimLock = 0.3;
    this.pushOverlay();
  }

  nextLevel() {
    if (this.level + 1 >= LEVELS.length) {
      this.victory();
      return;
    }
    this.loadLevel(this.level + 1);
    this.audio.level();
  }

  restart(fromStart = false) {
    this.score = 0;
    this.lives = 3;
    this.rage = 0;
    this.combo = 0;
    this.effects = {};
    this.loadLevel(fromStart ? 0 : this.level);
  }

  private victory() {
    this.overlay = "victory";
    this.saveHigh();
    this.audio.victory();
    this.pushOverlay();
  }

  private saveHigh() {
    if (this.score > this.high) {
      this.high = this.score;
      localStorage.setItem(HS_KEY, String(this.high));
    }
    if (this.score > 0) {
      // Shared leaderboard (posted after login if the player is a guest).
      void reportRun("drakebreaker", this.score, { level: this.level + 1 });
      queueCloudSave("drakebreaker", "main", { high: this.high, unlocked: this.unlocked });
    }
  }

  private unlock(count: number) {
    if (count > this.unlocked) {
      this.unlocked = clamp(count, 1, LEVELS.length);
      localStorage.setItem(PROGRESS_KEY, String(this.unlocked));
      queueCloudSave("drakebreaker", "main", { high: this.high, unlocked: this.unlocked });
    }
  }

  private toast(text: string) {
    this.cbs.onToast({ id: this.toastId++, text });
  }

  private pushHud() {
    const def = LEVELS[this.level];
    const effects: HudState["effects"] = [];
    for (const k of Object.keys(this.effects) as PowerKind[]) {
      const rem = this.effects[k] ?? 0;
      if (rem > 0 && k !== "multi" && k !== "life") effects.push({ kind: k, remaining: rem });
    }
    if (this.rageActive > 0) effects.push({ kind: "rage", remaining: this.rageActive });
    this.cbs.onHud({
      score: this.score,
      lives: this.lives,
      level: this.level + 1,
      levelName: def.name,
      flavor: def.flavor,
      realm: realmOf(this.level).name,
      combo: this.combo,
      rage: this.rage,
      high: this.high,
      effects,
      speedTier: this.speedTier,
      boosting: this.boosting,
      aiming: this.aiming,
      balls: this.balls.length,
      muted: this.audio.muted,
    });
  }

  private pushOverlay() {
    const def = LEVELS[this.level];
    let o: OverlayState;
    switch (this.overlay) {
      case "ready":
        if (this.readyReason === "level") o = { kind: "ready", title: def.name, body: def.flavor };
        else if (this.readyReason === "life")
          o = { kind: "ready", title: "The flame rekindles", body: "Take aim, then release." };
        else o = { kind: "ready" };
        break;
      case "paused":
        o = { kind: "paused", title: "The flame stills", body: "Press P or Space to resume." };
        break;
      case "levelclear":
        o = {
          kind: "levelclear",
          title: "Hoard shattered",
          body: `${def.name} falls in cinders.`,
          score: this.score,
        };
        break;
      case "gameover":
        o = {
          kind: "gameover",
          title: "The wyrm sleeps",
          body: "Your fireball guttered in the dark.",
          score: this.score,
        };
        break;
      case "victory":
        o = {
          kind: "victory",
          title: "The Elder Drake falls",
          body: "Fifty chapters burned. The hoard sings your name.",
          score: this.score,
        };
        break;
      default:
        o = { kind: "none" };
    }
    this.cbs.onOverlay(o);
    this.pushHud();
  }

  /* ---------- update ---------- */

  private update(dt: number) {
    this.time += dt;
    this.aimLock = Math.max(0, this.aimLock - dt / 60);
    this.updateBg(dt);
    this.updateParticles(dt);
    this.shake = Math.max(0, this.shake - dt * 0.45);

    const frozen =
      this.overlay === "paused" ||
      this.overlay === "levelclear" ||
      this.overlay === "gameover" ||
      this.overlay === "victory";
    if (frozen) return;

    this.updatePaddle(dt);
    this.tickEffects(dt);
    this.updateBalls(dt);
    this.updateDrops(dt);
    this.updateBeams(dt);
    this.updateFloaters(dt);

    if ((this.effects.laser ?? 0) > 0 && this.overlay === "playing") {
      this.laserAcc += dt;
      if (this.laserAcc > 18) {
        this.laserAcc = 0;
        this.fireBreath();
      }
    }

    this.comboTimer -= dt;
    if (this.rageActive <= 0 && this.comboTimer < -90) {
      this.rage = Math.max(0, this.rage - 0.04 * dt);
    }

    this.hudAcc += dt;
    if (this.hudAcc > 4) {
      this.hudAcc = 0;
      this.pushHud();
    }

    if (
      (this.overlay === "playing" || this.overlay === "ready") &&
      this.breakableLeft() === 0
    ) {
      this.onLevelClear();
    }
  }

  private breakableLeft() {
    let n = 0;
    for (const b of this.bricks) if (b.alive && b.kind !== "obsidian") n++;
    return n;
  }

  private onLevelClear() {
    const bonus = 600 + 120 * (this.level + 1) + this.lives * 150 + this.combo * 20;
    this.score += bonus;
    this.saveHigh();
    this.unlock(this.level + 2);
    this.boosting = false;
    this.toast(`+${bonus} hoard bonus`);
    if (this.level + 1 >= LEVELS.length) {
      this.victory();
      return;
    }
    this.overlay = "levelclear";
    this.audio.level();
    this.pushOverlay();
  }

  private updatePaddle(dt: number) {
    const left = this.keys.left || this.aimKeys.left;
    const right = this.keys.right || this.aimKeys.right;
    if (this.aiming) {
      const rot = (left ? 1 : 0) - (right ? 1 : 0);
      if (rot) this.aimAngle = clamp(this.aimAngle + rot * 2.2 * dt, AIM_MIN, AIM_MAX);
    } else {
      const steer = (right ? 1 : 0) - (left ? 1 : 0);
      if (steer) this.paddle.targetX += steer * 9.6 * dt;
    }

    const shrunk = (this.effects.shrink ?? 0) > 0;
    const wide = (this.effects.wide ?? 0) > 0;
    const desired = shrunk ? SHRUNK_PAD_W : wide ? WIDE_PAD_W : BASE_PAD_W;
    const prevW = this.paddle.w;
    this.paddle.w += (desired - this.paddle.w) * 0.18;
    this.paddle.x -= (this.paddle.w - prevW) / 2;
    this.paddle.targetX = clamp(this.paddle.targetX, 8, W - this.paddle.w - 8);
    this.paddle.x += (this.paddle.targetX - this.paddle.x) * Math.min(1, 0.38 * dt);
    this.paddle.x = clamp(this.paddle.x, 8, W - this.paddle.w - 8);

    const dx = this.paddle.x - this.paddle.lastX;
    if (dx > 0.35) this.paddle.facing = 1;
    else if (dx < -0.35) this.paddle.facing = -1;
    this.paddle.lastX = this.paddle.x;

    if (Math.abs(dx) > 0.4 && Math.random() < 0.4) {
      this.spawnParticle({
        x: this.paddle.x + this.paddle.w / 2 + rand(-20, 20),
        y: this.paddle.y + 10,
        vx: rand(-0.3, 0.3),
        vy: rand(0.2, 0.8),
        life: 20,
        max: 20,
        size: rand(1.5, 3),
        color: "#ff7a2e",
        g: 0,
        kind: "ember",
      });
    }
  }

  private tickEffects(dt: number) {
    for (const k of Object.keys(this.effects) as PowerKind[]) {
      const v = this.effects[k];
      if (v == null) continue;
      this.effects[k] = v - dt / 60;
      if ((this.effects[k] ?? 0) <= 0) delete this.effects[k];
    }
    if (this.rageActive > 0) {
      this.rageActive -= dt / 60;
      this.rage = (this.rageActive / RAGE_SECONDS) * 100;
      if (this.rageActive <= 0) {
        this.rageActive = 0;
        this.rage = 0;
        this.toast("Rage fades");
      }
    }
  }

  private updateBalls(dt: number) {
    const pierce = this.rageActive > 0 || (this.effects.pierce ?? 0) > 0;
    for (const ball of this.balls) {
      if (ball.stuck) {
        ball.stuckOff = clamp(ball.stuckOff, 16, this.paddle.w - 16);
        ball.x = this.paddle.x + ball.stuckOff;
        ball.y = this.paddle.y - ball.r - 1;
        ball.vx = 0;
        ball.vy = 0;
        if (ball.autoLaunch > 0) {
          ball.autoLaunch -= dt;
          if (ball.autoLaunch <= 0) {
            const hit = clamp((ball.stuckOff - this.paddle.w / 2) / (this.paddle.w / 2), -1, 1);
            this.releaseBall(ball, 90 - hit * 55);
          }
        }
        this.pushTrail(ball);
        continue;
      }

      const v = hypot(ball.vx, ball.vy);
      const steps = Math.max(1, Math.ceil((v * dt) / 8));
      const sdt = dt / steps;
      for (let i = 0; i < steps; i++) {
        this.moveBall(ball, sdt);
        if (ball.stuck) break;
      }
      if (!ball.stuck) this.regulateSpeed(ball);
      this.pushTrail(ball);

      if ((pierce || this.boosting) && Math.random() < 0.5) {
        this.spawnParticle({
          x: ball.x + rand(-3, 3),
          y: ball.y + rand(-3, 3),
          vx: rand(-0.6, 0.6),
          vy: rand(-0.6, 0.6),
          life: 16,
          max: 16,
          size: rand(2, 4),
          color: this.rageActive > 0 ? "#ff4500" : this.boosting ? "#fff7ed" : "#fde68a",
          g: -0.02,
          kind: "spark",
        });
      }
    }

    const before = this.balls.length;
    this.balls = this.balls.filter((b) => b.y < H + 40);
    if (before > 0 && this.balls.length === 0) this.loseLife();
  }

  private moveBall(ball: Ball, dt: number) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.r < 8) {
      ball.x = 8 + ball.r;
      ball.vx = Math.abs(ball.vx);
      this.audio.wall();
    }
    if (ball.x + ball.r > W - 8) {
      ball.x = W - 8 - ball.r;
      ball.vx = -Math.abs(ball.vx);
      this.audio.wall();
    }
    if (ball.y - ball.r < 8) {
      ball.y = 8 + ball.r;
      ball.vy = Math.abs(ball.vy);
      this.audio.wall();
    }

    this.collidePaddle(ball);
    if (!ball.stuck) this.collideBricks(ball);
  }

  private regulateSpeed(ball: Ball) {
    const target = this.currentSpeed();
    const v = hypot(ball.vx, ball.vy);
    if (v < 0.01) return;
    const lo = target * 0.9;
    const hi = target * 1.2;
    let n = v;
    if (v < lo) n = v + (lo - v) * 0.25;
    else if (v > hi) n = v + (hi - v) * 0.25;
    ball.vx = (ball.vx / v) * n;
    ball.vy = (ball.vy / v) * n;
    const minVy = n * 0.22;
    if (Math.abs(ball.vy) < minVy) {
      ball.vy = minVy * Math.sign(ball.vy || -1);
      const s = Math.sign(ball.vx || 1);
      ball.vx = s * Math.sqrt(Math.max(0, n * n - minVy * minVy));
    }
  }

  private pushTrail(ball: Ball) {
    ball.trail.push({ x: ball.x, y: ball.y, a: 1 });
    const max = this.boosting ? 20 : 14;
    while (ball.trail.length > max) ball.trail.shift();
    ball.trail.forEach((t, i) => {
      t.a = (i + 1) / ball.trail.length;
    });
  }

  private collidePaddle(ball: Ball) {
    const p = this.paddle;
    if (ball.vy < 0) return;
    if (ball.y + ball.r < p.y) return;
    if (ball.y - ball.r > p.y + p.h + 8) return;
    if (ball.x < p.x - 8 || ball.x > p.x + p.w + 8) return;

    if ((this.effects.sticky ?? 0) > 0) {
      ball.stuck = true;
      ball.stuckOff = clamp(ball.x - p.x, 16, p.w - 16);
      ball.vx = 0;
      ball.vy = 0;
      this.audio.paddle();
      if (this.balls.every((b) => b.stuck)) {
        this.readyReason = "catch";
        this.enterAim();
      } else {
        ball.autoLaunch = 50;
      }
      return;
    }

    const hit = clamp((ball.x - (p.x + p.w / 2)) / (p.w / 2), -1, 1);
    const angle = hit * 1.15;
    const spd = Math.max(this.currentSpeed(), hypot(ball.vx, ball.vy) * 1.02);
    ball.vx = Math.sin(angle) * spd;
    ball.vy = -Math.abs(Math.cos(angle) * spd);
    ball.y = p.y - ball.r - 0.5;
    this.audio.paddle();
    for (let i = 0; i < 8; i++) {
      this.spawnParticle({
        x: ball.x,
        y: p.y,
        vx: rand(-2, 2),
        vy: rand(-3, -0.5),
        life: 18,
        max: 18,
        size: rand(1.5, 3),
        color: "#ffb347",
        g: 0.08,
        kind: "spark",
      });
    }
  }

  private bounceOff(ball: Ball, nx: number, ny: number, dx: number, dy: number) {
    if (dx === 0 && dy === 0) {
      if (Math.abs(ball.vx) > Math.abs(ball.vy)) ball.vx *= -1;
      else ball.vy *= -1;
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      const s = dx >= 0 ? 1 : -1;
      ball.vx = Math.abs(ball.vx) * s;
      ball.x = nx + s * (ball.r + 0.6);
    } else {
      const s = dy >= 0 ? 1 : -1;
      ball.vy = Math.abs(ball.vy) * s;
      ball.y = ny + s * (ball.r + 0.6);
    }
  }

  private collideBricks(ball: Ball) {
    const pierce = this.rageActive > 0 || (this.effects.pierce ?? 0) > 0;
    const dmg = this.rageActive > 0 ? 2 : 1;
    for (const br of this.bricks) {
      if (!br.alive) continue;
      const nx = clamp(ball.x, br.x, br.x + br.w);
      const ny = clamp(ball.y, br.y, br.y + br.h);
      const dx = ball.x - nx;
      const dy = ball.y - ny;
      if (dx * dx + dy * dy > ball.r * ball.r) continue;

      if (br.kind === "obsidian") {
        this.bounceOff(ball, nx, ny, dx, dy);
        br.flash = 1;
        this.audio.brick("obsidian");
        this.spawnHitSparks(nx, ny, "obsidian");
        return;
      }

      this.damageBrick(br, dmg, nx, ny);
      if (!pierce) {
        this.bounceOff(ball, nx, ny, dx, dy);
        return;
      }
    }
  }

  private damageBrick(br: Brick, dmg: number, hx: number, hy: number) {
    if (!br.alive) return;
    br.hp -= dmg;
    br.flash = 1;
    this.audio.brick(br.kind);
    this.spawnHitSparks(hx, hy, br.kind);
    if (br.hp > 0) return;
    br.alive = false;
    this.onBrickBreak(br);
  }

  private onBrickBreak(br: Brick) {
    this.combo += 1;
    this.comboTimer = 180;
    const mult = 1 + Math.min(12, this.combo) * 0.08;
    const pts = Math.round(br.points * mult);
    this.score += pts;
    this.floaters.push({
      x: br.x + br.w / 2,
      y: br.y,
      text: `+${pts}`,
      life: 40,
      color: br.kind === "gold" ? "#fde68a" : "#ffd7a0",
    });
    const rageGain =
      br.kind === "gold" ? 10 : br.kind === "magma" ? 14 : br.kind === "rune" ? 9 : br.kind === "bone" ? 3 : 5;
    this.addRage(rageGain);
    this.burst(br.x + br.w / 2, br.y + br.h / 2, br.kind);
    this.maybeDrop(br);
    if (br.kind === "magma") this.explodeMagma(br);
    if (br.kind === "frost") {
      this.effects.slow = Math.max(this.effects.slow ?? 0, 2.5);
      this.floaters.push({ x: br.x + br.w / 2, y: br.y + 14, text: "chilled", life: 30, color: "#a5f3fc" });
    }
    if (this.combo === 8) this.toast("Combo burning");
    if (this.combo === 16) this.toast("Inferno combo!");
  }

  private explodeMagma(src: Brick) {
    this.shake = 7;
    this.audio.explode();
    const cx = src.x + src.w / 2;
    const cy = src.y + src.h / 2;
    for (const br of this.bricks) {
      if (!br.alive || br === src) continue;
      const bx = br.x + br.w / 2;
      const by = br.y + br.h / 2;
      if (Math.abs(bx - cx) <= br.w + GAP * 2.2 && Math.abs(by - cy) <= br.h + GAP * 2.2) {
        if (br.kind === "obsidian") {
          br.flash = 1;
          continue;
        }
        this.damageBrick(br, 1, bx, by);
      }
    }
  }

  private addRage(n: number) {
    if (this.rageActive > 0) return;
    const was = this.rage;
    this.rage = clamp(this.rage + n, 0, 100);
    if (was < 100 && this.rage >= 100) this.activateRage();
  }

  activateRage() {
    if (this.rage < 100 && this.rageActive <= 0) return;
    this.rageActive = RAGE_SECONDS;
    this.audio.roar();
    this.shake = 10;
    this.toast("DRAGON RAGE");
    for (let i = 0; i < 40; i++) {
      this.spawnParticle({
        x: W / 2 + rand(-80, 80),
        y: H - 80,
        vx: rand(-4, 4),
        vy: rand(-8, -2),
        life: 40,
        max: 40,
        size: rand(2, 6),
        color: Math.random() > 0.5 ? "#ff4500" : "#fde68a",
        g: 0.12,
        kind: "ember",
      });
    }
  }

  private maybeDrop(br: Brick) {
    if (br.kind === "venom") {
      if (Math.random() < 0.55) this.spawnDrop(br, "shrink");
      return;
    }
    if (br.kind === "bone") return;
    const chance =
      br.kind === "gold" ? 0.32 : br.kind === "magma" ? 0.26 : br.kind === "rune" ? 0.24 : br.kind === "frost" ? 0.1 : 0.14;
    if (Math.random() > chance) return;
    const pool: PowerKind[] = ["multi", "wide", "laser", "pierce", "slow", "sticky"];
    if (this.lives < 5 && Math.random() < 0.22) pool.push("life");
    const kind = pool[Math.floor(Math.random() * pool.length)];
    this.spawnDrop(br, kind);
  }

  private spawnDrop(br: Brick, kind: PowerKind) {
    this.drops.push({
      x: br.x + br.w / 2,
      y: br.y + br.h / 2,
      kind,
      vy: 2.1,
      rot: rand(0, Math.PI),
    });
  }

  private updateDrops(dt: number) {
    for (const d of this.drops) {
      d.y += d.vy * dt;
      d.vy += 0.035 * dt;
      d.rot += 0.04 * dt;
      const p = this.paddle;
      if (d.y + 12 > p.y && d.y < p.y + p.h + 8 && d.x > p.x - 8 && d.x < p.x + p.w + 8) {
        this.collect(d);
        d.y = H + 100;
      }
    }
    this.drops = this.drops.filter((d) => d.y < H + 20);
  }

  private collect(d: Drop) {
    const labels: Record<PowerKind, string> = {
      multi: "Hatchlings unleashed",
      wide: "Wyrmscale armor",
      laser: "Fire breath",
      pierce: "White-hot fireball",
      slow: "Frost breath",
      life: "A dragon egg hatches",
      sticky: "Amber grip",
      rage: "Dragon rage",
      shrink: "Cursed! The drake shrinks",
    };
    if (d.kind === "shrink") this.audio.curse();
    else this.audio.power();
    this.toast(labels[d.kind]);
    switch (d.kind) {
      case "multi":
        this.spawnHatchlings();
        break;
      case "life":
        this.lives = Math.min(6, this.lives + 1);
        break;
      case "wide":
        this.effects.wide = 14;
        delete this.effects.shrink;
        break;
      case "shrink":
        this.effects.shrink = 8;
        delete this.effects.wide;
        break;
      case "laser":
        this.effects.laser = 11;
        this.fireBreath();
        break;
      case "pierce":
        this.effects.pierce = 9;
        break;
      case "slow":
        this.effects.slow = 8;
        break;
      case "sticky":
        this.effects.sticky = 10;
        break;
      default:
        break;
    }
    this.pushHud();
  }

  private spawnHatchlings() {
    if (this.balls.length >= 7) return;
    const base = this.balls.find((b) => !b.stuck) ?? this.balls[0];
    if (!base) return;
    const n = Math.min(2, 7 - this.balls.length);
    const s = this.currentSpeed();
    for (let i = 0; i < n; i++) {
      const a = -0.7 + i * 0.5 + rand(-0.1, 0.1);
      this.balls.push({
        x: base.x,
        y: base.stuck ? base.y - 4 : base.y,
        vx: Math.sin(a) * s,
        vy: -Math.abs(Math.cos(a) * s),
        r: BALL_R,
        stuck: false,
        stuckOff: 0,
        autoLaunch: 0,
        trail: [],
      });
    }
    if (this.overlay === "ready") {
      this.overlay = "playing";
      this.pushOverlay();
    }
  }

  private fireBreath() {
    const p = this.paddle;
    const xs = [p.x + 18, p.x + p.w / 2, p.x + p.w - 18];
    for (const x of xs) this.beams.push({ x: x - 3, y: p.y - 16, w: 6, h: 18, vy: -13 });
    this.audio.laser();
  }

  private updateBeams(dt: number) {
    for (const b of this.beams) {
      b.y += b.vy * dt;
      b.h += 2 * dt;
      for (const br of this.bricks) {
        if (!br.alive) continue;
        if (b.x + b.w < br.x || b.x > br.x + br.w || b.y + 20 < br.y || b.y > br.y + br.h) continue;
        if (br.kind === "obsidian") {
          br.flash = 1;
          b.y = -100;
          break;
        }
        this.damageBrick(br, 1, br.x + br.w / 2, br.y + br.h);
        b.y = -100;
        break;
      }
      if (Math.random() < 0.8) {
        this.spawnParticle({
          x: b.x + 3,
          y: b.y,
          vx: rand(-0.8, 0.8),
          vy: rand(0.4, 1.4),
          life: 12,
          max: 12,
          size: rand(1.5, 3),
          color: "#ff9a4a",
          g: 0,
          kind: "ember",
        });
      }
    }
    this.beams = this.beams.filter((b) => b.y + b.h > -10);
  }

  private loseLife() {
    this.lives -= 1;
    this.combo = 0;
    this.effects = {};
    this.rageActive = 0;
    this.boosting = false;
    this.audio.lifeLost();
    this.shake = 8;
    if (this.lives <= 0) {
      this.overlay = "gameover";
      this.saveHigh();
      this.audio.gameOver();
      this.pushOverlay();
      return;
    }
    this.resetBalls();
    this.readyReason = "life";
    this.toast("The fireball is rekindled");
    this.enterAim();
  }

  private updateFloaters(dt: number) {
    for (const f of this.floaters) {
      f.y -= 0.55 * dt;
      f.life -= dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }

  /* ---------- particles ---------- */

  private spawnParticle(p: Particle) {
    if (this.particles.length > MAX_PARTICLES) this.particles.shift();
    this.particles.push(p);
  }

  private spawnHitSparks(x: number, y: number, kind: BrickKind) {
    const pal = BRICK_PAL[kind];
    for (let i = 0; i < 7; i++) {
      this.spawnParticle({
        x,
        y,
        vx: rand(-2.8, 2.8),
        vy: rand(-3, 1.4),
        life: rand(12, 22),
        max: 22,
        size: rand(1.2, 2.8),
        color: pal[i % 3],
        g: 0.12,
        kind: "spark",
      });
    }
  }

  private burst(x: number, y: number, kind: BrickKind) {
    const pal = BRICK_PAL[kind];
    const n = kind === "magma" ? 28 : kind === "gold" ? 22 : 14;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(0.6, 4.2);
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(16, 34),
        max: 34,
        size: rand(1.4, 4),
        color: pal[i % 3],
        g: 0.07,
        kind: i % 3 === 0 ? "shard" : "ember",
      });
    }
  }

  private spawnBgEmber(anywhere = false) {
    const realm = realmOf(this.level);
    this.bgEmbers.push({
      x: rand(0, W),
      y: anywhere ? rand(0, H) : H + rand(0, 40),
      vx: rand(-0.25, 0.25),
      vy: rand(-1.1, -0.25),
      life: rand(80, 220),
      max: 220,
      size: rand(1, 2.6),
      color: Math.random() > 0.7 ? realm.spark : realm.ember,
      g: 0,
      kind: "ember",
    });
  }

  private updateBg(dt: number) {
    if (this.bgEmbers.length < 55) this.spawnBgEmber();
    for (const e of this.bgEmbers) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.life -= dt;
    }
    this.bgEmbers = this.bgEmbers.filter((e) => e.life > 0 && e.y > -10);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  /* ---------- aim guide ---------- */

  private computeGuide(): { pts: Pt[]; hit: Pt | null } {
    const b = this.balls.find((k) => k.stuck);
    if (!b) return { pts: [], hit: null };
    const rad = (this.aimAngle * Math.PI) / 180;
    let dx = Math.cos(rad);
    const dy = -Math.sin(rad);
    let x = b.x;
    let y = b.y;
    const pts: Pt[] = [{ x, y }];
    let hit: Pt | null = null;
    const step = 4;
    let traveled = 0;
    while (traveled < GUIDE_LEN) {
      x += dx * step;
      y += dy * step;
      traveled += step;
      let bounced = false;
      if (x - b.r < 8) {
        x = 8 + b.r;
        dx = Math.abs(dx);
        bounced = true;
      }
      if (x + b.r > W - 8) {
        x = W - 8 - b.r;
        dx = -Math.abs(dx);
        bounced = true;
      }
      if (y - b.r < 8) {
        y = 8 + b.r;
        hit = { x, y };
        break;
      }
      if (bounced) pts.push({ x, y });
      let blocked = false;
      for (const br of this.bricks) {
        if (br.alive && circleRect(x, y, b.r, br)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        hit = { x, y };
        break;
      }
    }
    pts.push({ x, y });
    return { pts, hit };
  }

  /* ---------- draw ---------- */

  draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
    this.drawWorld();
    ctx.restore();
  }

  private drawWorld() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    this.drawCave();
    this.drawBgEmbers();
    for (const br of this.bricks) if (br.alive) this.drawBrick(br);
    this.drawBeams();
    this.drawDrops();
    this.drawAim();
    this.drawPaddle();
    this.drawBalls();
    this.drawParticles();
    this.drawFloaters();
    if (this.rageActive > 0) {
      ctx.fillStyle = `rgba(255, 40, 0, ${0.07 + Math.sin(this.time * 0.2) * 0.03})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.boosting && this.overlay === "playing") this.drawSpeedLines();
    this.drawVignette();
  }

  private drawCave() {
    const ctx = this.ctx;
    const realm = realmOf(this.level);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, realm.bg[0]);
    g.addColorStop(0.45, realm.bg[1]);
    g.addColorStop(1, realm.bg[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const magma = ctx.createRadialGradient(W / 2, H + 40, 20, W / 2, H, 420);
    magma.addColorStop(0, realm.glow);
    magma.addColorStop(0.5, "rgba(0,0,0,0)");
    magma.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = magma;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    for (let i = 0; i < 16; i++) {
      const x = i * 64 + 10;
      const h = 16 + ((i * 37) % 28);
      ctx.beginPath();
      ctx.moveTo(x - 10, 0);
      ctx.lineTo(x + 12, 0);
      ctx.lineTo(x + 1, h);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    for (let i = 0; i < 24; i++) {
      const x = (i * 97 + Math.sin(this.time * 0.01 + i) * 8) % W;
      const y = 80 + ((i * 53) % 220);
      const a = 0.35 + 0.35 * Math.sin(this.time * 0.08 + i);
      ctx.globalAlpha = a * 0.45;
      ctx.fillStyle = realm.spark;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(224, 180, 74, 0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.strokeStyle = "rgba(224, 180, 74, 0.08)";
    ctx.strokeRect(10, 10, W - 20, H - 20);
  }

  private drawBgEmbers() {
    const ctx = this.ctx;
    for (const e of this.bgEmbers) {
      ctx.globalAlpha = clamp(e.life / e.max, 0, 1) * 0.7;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawBrick(br: Brick) {
    const ctx = this.ctx;
    const pal = BRICK_PAL[br.kind];
    const pulse = br.kind === "magma" ? 0.55 + 0.45 * Math.sin(this.time * 0.12 + br.phase) : 1;
    const r = 5;

    ctx.save();
    if (br.kind === "gold" || br.kind === "magma" || br.kind === "frost") {
      ctx.shadowColor = pal[0];
      ctx.shadowBlur = 10 * pulse;
    }
    const grd = ctx.createLinearGradient(br.x, br.y, br.x, br.y + br.h);
    grd.addColorStop(0, pal[0]);
    grd.addColorStop(0.45, pal[1]);
    grd.addColorStop(1, pal[2]);
    ctx.fillStyle = grd;
    round(ctx, br.x, br.y, br.w, br.h, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    round(ctx, br.x + 2, br.y + 1.5, br.w - 4, br.h * 0.34, 3);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (br.kind === "obsidian") {
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.strokeStyle = "rgba(167,139,250,0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      const sheen = ((this.time * 3 + br.x) % (br.w + 40)) - 20;
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(br.x + Math.max(0, sheen), br.y, Math.min(10, br.w - Math.max(0, sheen)), br.h);
    } else if (br.kind === "rune") {
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.strokeStyle = "rgba(237, 213, 255, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(250,245,255,0.8)";
      ctx.font = "11px Cinzel, serif";
      ctx.fillText("ᛟ", br.x + br.w / 2, br.y + br.h / 2 + 1);
    } else if (br.kind === "gold") {
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.strokeStyle = "rgba(255, 236, 180, 0.8)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,230,0.9)";
      ctx.font = "10px Cinzel, serif";
      ctx.fillText("◆", br.x + br.w / 2, br.y + br.h / 2 + 1);
    } else if (br.kind === "bone") {
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.strokeStyle = "rgba(120,113,108,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(87,83,78,0.55)";
      ctx.beginPath();
      ctx.arc(br.x + br.w * 0.3, br.y + br.h / 2, 2.2, 0, Math.PI * 2);
      ctx.arc(br.x + br.w * 0.7, br.y + br.h / 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (br.kind === "frost") {
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.strokeStyle = "rgba(236,254,255,0.75)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "11px serif";
      ctx.fillText("❄", br.x + br.w / 2, br.y + br.h / 2 + 1);
    } else if (br.kind === "venom") {
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.strokeStyle = "rgba(190,242,100,0.6)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(217,249,157,0.85)";
      ctx.beginPath();
      const bx = br.x + br.w / 2;
      const by = br.y + br.h / 2;
      ctx.moveTo(bx, by - 6);
      ctx.quadraticCurveTo(bx + 5, by + 2, bx, by + 6);
      ctx.quadraticCurveTo(bx - 5, by + 2, bx, by - 6);
      ctx.fill();
    } else {
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (br.maxHp > 1 && br.hp < br.maxHp && br.kind !== "obsidian") {
      ctx.strokeStyle = "rgba(20,8,8,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(br.x + 8, br.y + 6);
      ctx.lineTo(br.x + br.w * 0.45, br.y + br.h - 5);
      ctx.moveTo(br.x + br.w * 0.6, br.y + 4);
      ctx.lineTo(br.x + br.w - 10, br.y + br.h - 6);
      if (br.hp <= 1) {
        ctx.moveTo(br.x + 4, br.y + br.h * 0.5);
        ctx.lineTo(br.x + br.w * 0.7, br.y + 8);
      }
      ctx.stroke();
    }

    if (br.maxHp > 1 && br.kind !== "obsidian") {
      const pips = br.maxHp;
      const tw = pips * 5 + (pips - 1) * 2;
      let px = br.x + br.w / 2 - tw / 2;
      for (let i = 0; i < pips; i++) {
        ctx.fillStyle = i < br.hp ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.35)";
        ctx.fillRect(px, br.y + br.h - 5, 5, 2);
        px += 7;
      }
    }

    if (br.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${br.flash * 0.45})`;
      round(ctx, br.x, br.y, br.w, br.h, r);
      ctx.fill();
      br.flash *= 0.78;
    }
    ctx.restore();
  }

  private drawAim() {
    if (!this.aiming) return;
    const b = this.balls.find((k) => k.stuck);
    if (!b) return;
    const { pts, hit } = this.computeGuide();
    if (pts.length < 2) return;
    const ctx = this.ctx;
    ctx.save();

    // allowed arc
    const toRad = Math.PI / 180;
    ctx.strokeStyle = "rgba(224,180,74,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 44, -AIM_MAX * toRad, -AIM_MIN * toRad);
    ctx.stroke();
    ctx.fillStyle = "rgba(224,180,74,0.45)";
    for (const deg of [30, 60, 90, 120, 150]) {
      const rr = deg === 90 ? 3 : 1.6;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(deg * toRad) * 44, b.y - Math.sin(deg * toRad) * 44, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    // guide line
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.setLineDash([10, 9]);
    ctx.lineDashOffset = -this.time * 1.4;
    ctx.strokeStyle = this.aimPressed ? "rgba(255,244,214,0.95)" : "rgba(255,176,64,0.82)";
    ctx.shadowColor = "#ff6a1a";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.setLineDash([]);

    // arrowhead
    const a = pts[pts.length - 2];
    const e = pts[pts.length - 1];
    const ang = Math.atan2(e.y - a.y, e.x - a.x);
    ctx.fillStyle = this.aimPressed ? "#fff4d6" : "#ffb040";
    ctx.beginPath();
    ctx.moveTo(e.x + Math.cos(ang) * 12, e.y + Math.sin(ang) * 12);
    ctx.lineTo(e.x + Math.cos(ang + 2.5) * 10, e.y + Math.sin(ang + 2.5) * 10);
    ctx.lineTo(e.x + Math.cos(ang - 2.5) * 10, e.y + Math.sin(ang - 2.5) * 10);
    ctx.closePath();
    ctx.fill();

    if (hit) {
      const pulse = 6 + Math.sin(this.time * 0.25) * 2;
      ctx.strokeStyle = "rgba(255,220,150,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hit.x, hit.y, pulse + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.font = "600 11px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,225,160,0.85)";
    const label = this.aimPressed
      ? "RELEASE TO LOOSE THE FIREBALL"
      : "AIM WITH POINTER OR ◀ ▶  ·  CLICK, TAP OR SPACE TO FIRE";
    ctx.fillText(label, W / 2, H - 15);
    ctx.fillStyle = "rgba(255,225,160,0.55)";
    ctx.font = "600 10px Cinzel, serif";
    ctx.fillText(`${Math.round(this.aimAngle)}°`, b.x, b.y - 58);
    ctx.restore();
  }

  private drawPaddle() {
    const ctx = this.ctx;
    const { x, y, w, h, facing } = this.paddle;
    const t = this.time;
    const shrunk = (this.effects.shrink ?? 0) > 0;
    ctx.save();

    const glow = ctx.createRadialGradient(x + w / 2, y, 6, x + w / 2, y + 8, w * 0.62);
    glow.addColorStop(0, this.boosting ? "rgba(255,200,80,0.6)" : "rgba(255,120,30,0.5)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 30, y - 16, w + 60, h + 50);

    const body = ctx.createLinearGradient(x, y, x, y + h);
    body.addColorStop(0, shrunk ? "#4d7c0f" : "#9a3412");
    body.addColorStop(0.4, shrunk ? "#365314" : "#7f1d1d");
    body.addColorStop(1, "#1c0a0a");
    ctx.fillStyle = body;
    round(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = "#e0b44a";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,180,80,0.18)";
    for (let i = 10; i < w - 8; i += 11) {
      ctx.beginPath();
      ctx.arc(x + i, y + h * 0.55, 5, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = "#1c0a0a";
    for (let i = 16; i < w - 10; i += 18) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + 2);
      ctx.lineTo(x + i + 5, y - 7 - Math.sin(t * 0.15 + i) * 1.5);
      ctx.lineTo(x + i + 10, y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#e0b44a";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    const hx = facing > 0 ? x + w : x;
    const dir = facing;
    ctx.beginPath();
    ctx.moveTo(hx, y);
    ctx.lineTo(hx + dir * 26, y + h * 0.38);
    ctx.quadraticCurveTo(hx + dir * 30, y + h * 0.7, hx + dir * 14, y + h + 2);
    ctx.lineTo(hx, y + h);
    ctx.closePath();
    const hg = ctx.createLinearGradient(hx, y, hx + dir * 26, y + h);
    hg.addColorStop(0, "#c2410c");
    hg.addColorStop(1, "#431407");
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = "#e0b44a";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hx + dir * 4, y + 2);
    ctx.lineTo(hx + dir * 10, y - 12);
    ctx.lineTo(hx + dir * 16, y + 4);
    ctx.closePath();
    ctx.fillStyle = "#1c0a0a";
    ctx.fill();
    ctx.strokeStyle = "#e0b44a";
    ctx.stroke();

    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(hx + dir * 10, y + h * 0.38, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.arc(hx + dir * 10.6, y + h * 0.38, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff6a1a";
    ctx.beginPath();
    ctx.arc(hx + dir * 22, y + h * 0.42, 1.4, 0, Math.PI * 2);
    ctx.fill();

    const tx = facing > 0 ? x : x + w;
    ctx.beginPath();
    ctx.moveTo(tx, y + 4);
    ctx.quadraticCurveTo(tx - dir * 28, y + 6, tx - dir * 36, y + h * 0.2);
    ctx.quadraticCurveTo(tx - dir * 22, y + h, tx, y + h - 3);
    ctx.closePath();
    ctx.fillStyle = "#7f1d1d";
    ctx.fill();
    ctx.strokeStyle = "#e0b44a";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if ((this.effects.laser ?? 0) > 0) {
      ctx.fillStyle = "rgba(255,80,20,0.35)";
      ctx.fillRect(x + 10, y - 8, w - 20, 4);
    }
    if ((this.effects.wide ?? 0) > 0) {
      round(ctx, x, y, w, h, 8);
      ctx.strokeStyle = "rgba(94,234,212,0.7)";
      ctx.stroke();
    }
    if ((this.effects.sticky ?? 0) > 0) {
      round(ctx, x + 2, y - 2, w - 4, 5, 2);
      ctx.fillStyle = "rgba(251,191,36,0.55)";
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBalls() {
    const ctx = this.ctx;
    for (const b of this.balls) {
      ctx.save();
      const hot = this.rageActive > 0 ? "#ff4500" : this.boosting ? "#ffd27a" : "#ff7a2e";
      for (let i = 0; i < b.trail.length; i++) {
        const tr = b.trail[i];
        ctx.globalAlpha = tr.a * 0.35;
        ctx.fillStyle = hot;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, b.r * (0.4 + tr.a * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowColor = "#ff6a1a";
      ctx.shadowBlur = 18;
      const grd = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.r + 2);
      grd.addColorStop(0, "#fff7ed");
      grd.addColorStop(0.35, "#fde68a");
      grd.addColorStop(0.7, "#ff6a1a");
      grd.addColorStop(1, "#7c2d12");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(b.x - 3, b.y - 3.2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawDrops() {
    const ctx = this.ctx;
    for (const d of this.drops) {
      const bad = d.kind === "shrink";
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(Math.sin(d.rot) * 0.2);
      ctx.shadowColor = DROP_COLOR[d.kind];
      ctx.shadowBlur = 12;
      const g = ctx.createLinearGradient(-12, -12, 12, 12);
      g.addColorStop(0, bad ? "#1a2e05" : "#3f1d0c");
      g.addColorStop(1, bad ? "#0a1202" : "#1a0a08");
      ctx.fillStyle = g;
      round(ctx, -13, -13, 26, 26, bad ? 13 : 6);
      ctx.fill();
      ctx.strokeStyle = DROP_COLOR[d.kind];
      ctx.lineWidth = 1.6;
      if (bad) ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.fillStyle = DROP_COLOR[d.kind];
      ctx.font = "12px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(DROP_GLYPH[d.kind], 0, 1);
      ctx.restore();
    }
  }

  private drawBeams() {
    const ctx = this.ctx;
    for (const b of this.beams) {
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 40);
      g.addColorStop(0, "#fff7ed");
      g.addColorStop(0.3, "#ff6a1a");
      g.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(b.x, b.y - 80, b.w, 90);
      ctx.fillStyle = "rgba(255,255,220,0.7)";
      ctx.fillRect(b.x + 2, b.y - 80, 2, 90);
    }
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.kind === "shard") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.vx);
        ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawFloaters() {
    const ctx = this.ctx;
    ctx.font = "700 13px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const f of this.floaters) {
      ctx.globalAlpha = clamp(f.life / 40, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawSpeedLines() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(255,230,180,0.08)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) {
      const x = ((i * 137 + this.time * 9) % (W + 60)) - 30;
      const y = (i * 71) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 40, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawVignette() {
    const ctx = this.ctx;
    const v = ctx.createRadialGradient(W / 2, H / 2, 220, W / 2, H / 2, 560);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
