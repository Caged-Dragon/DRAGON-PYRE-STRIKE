import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Volume2, VolumeX, Pause, Play, Sun, Moon, Trophy, Shield, Zap } from 'lucide-react';
import { DragonSkin, Physics, ThemeMode, GameSettings } from '../types/game';
import { REALMS, DRAGON_VISUAL_LENGTH } from '../data/gameData';
import { drawBackground, drawDragon, drawGate, drawParticles } from '../utils/dragonRenderer';
import { soundManager } from '../utils/audio';
import { reportRun } from '../dps';

const LOGICAL_HEIGHT = 600;
const DRAGON_R = 18;
const GATE_WIDTH = 72;
const REALM_CHANGE_INTERVAL = 8;
const BASE_GATE_GAP = DRAGON_VISUAL_LENGTH * 2; // 2x dragon length

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

function getSettings(score: number): GameSettings {
  const difficulty = Math.min(score / 60, 1);
  return {
    gravity: 1320 + difficulty * 160,
    flapVelocity: -400 - difficulty * 30,
    gateSpeed: 175 + difficulty * 85,
    gateGap: Math.max(130, BASE_GATE_GAP - difficulty * 26),
    gateInterval: 0, // unused - distance-based spawning now
  };
}

// Horizontal distance between consecutive gates
function getGateSpacing(score: number): number {
  const difficulty = Math.min(score / 60, 1);
  return Math.max(230, 300 - difficulty * 70);
}

function initPhysics(): Physics {
  return {
    dragonY: LOGICAL_HEIGHT / 2,
    velocity: 0,
    gates: [],
    particles: [],
    score: 0,
    status: 'ready',
    lastSpawn: 0,
    flame: 0,
    hasShield: false,
    slowTimer: 0,
    currentRealmIndex: 0,
    realmTransitionProgress: 0,
    nextRealmChange: REALM_CHANGE_INTERVAL,
  };
}

interface GameCanvasProps {
  skin: DragonSkin;
  onBackToIntro: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

export function GameCanvas({
  skin,
  onBackToIntro,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  highScore,
  onUpdateHighScore,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<Physics>(initPhysics());
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const gateIdCounterRef = useRef(0);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const shakeRef = useRef(0);
  const [viewSize, setViewSize] = useState({ w: 800, h: 600 });
  const [, forceRender] = useState(0);

  // Logical world width grows with screen aspect ratio:
  // wider screens genuinely reveal more obstacles ahead.
  const logicalWidth = Math.max(420, Math.round(LOGICAL_HEIGHT * (viewSize.w / viewSize.h)));
  const dragonX = Math.max(90, Math.min(logicalWidth * 0.18, 220));

  // Fill the entire available container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewSize({
          w: Math.max(320, Math.floor(rect.width)),
          h: Math.max(320, Math.floor(rect.height)),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      observer.disconnect();
    };
  }, []);

  const flap = useCallback(() => {
    const p = physicsRef.current;
    if (p.status === 'over') return;

    if (p.status === 'ready') {
      p.status = 'playing';
      lastTimeRef.current = null;
    }

    if (p.status === 'playing') {
      const settings = getSettings(p.score);
      p.velocity = settings.flapVelocity;
      p.flame = 1;
      soundManager.play('flap');

      for (let i = 0; i < 4; i++) {
        p.particles.push({
          x: dragonX - 14,
          y: p.dragonY + (Math.random() - 0.5) * 12,
          vx: -60 - Math.random() * 40,
          vy: (Math.random() - 0.5) * 30,
          size: 2.5 + Math.random() * 2,
          color: skin.flameColors[0],
          life: 0.3,
          maxLife: 0.3,
        });
      }
      forceRender((n) => n + 1);
    }
  }, [dragonX, skin]);

  const restart = useCallback(() => {
    gateIdCounterRef.current = 0;
    floatingTextsRef.current = [];
    shakeRef.current = 0;
    physicsRef.current = initPhysics();
    lastTimeRef.current = null;
    forceRender((n) => n + 1);
  }, []);

  const togglePause = useCallback(() => {
    const p = physicsRef.current;
    if (p.status === 'playing') {
      p.status = 'paused';
    } else if (p.status === 'paused') {
      p.status = 'playing';
      lastTimeRef.current = null;
    }
    forceRender((n) => n + 1);
  }, []);

  // Keyboard
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        flap();
      } else if (e.key.toLowerCase() === 'p' || e.code === 'Escape') {
        togglePause();
      } else if (e.key.toLowerCase() === 'r' && physicsRef.current.status === 'over') {
        restart();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flap, togglePause, restart]);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = viewSize.w * dpr;
    canvas.height = viewSize.h * dpr;
    canvas.style.width = `${viewSize.w}px`;
    canvas.style.height = `${viewSize.h}px`;

    // Render scale: logical world -> screen pixels
    const scale = (viewSize.h / LOGICAL_HEIGHT) * dpr;

    const lastSeenStatus = { current: physicsRef.current.status };
    const lastSeenScore = { current: physicsRef.current.score };

    function spawnAmbient(p: Physics, realmIdx: number, dt: number) {
      // Ambient realm particles drifting across the whole wide world
      const realm = REALMS[realmIdx];
      const rate = logicalWidth / 420; // more particles for wider worlds
      if (Math.random() < dt * 6 * rate) {
        const colors: Record<string, string> = {
          ember: '#fb923c',
          crystal: '#7dd3fc',
          spark: '#fde047',
          void: '#d8b4fe',
          leaf: '#4ade80',
        };
        p.particles.push({
          x: logicalWidth + 10,
          y: Math.random() * LOGICAL_HEIGHT,
          vx: -30 - Math.random() * 50,
          vy: realm.particleType === 'ember' ? -20 - Math.random() * 20 : (Math.random() - 0.5) * 24,
          size: 1.2 + Math.random() * 2.2,
          color: colors[realm.particleType],
          life: 6,
          maxLife: 6,
        });
      }
    }

    function step(time: number) {
      const p = physicsRef.current;
      const settings = getSettings(p.score);
      const spacing = getGateSpacing(p.score);
      const last = lastTimeRef.current ?? time;
      const dt = Math.min(0.033, (time - last) / 1000);
      lastTimeRef.current = time;

      const currentRealm = REALMS[p.currentRealmIndex];

      if (p.status === 'playing') {
        const speedMul = p.slowTimer > 0 ? 0.65 : 1.0;
        if (p.slowTimer > 0) p.slowTimer = Math.max(0, p.slowTimer - dt);

        p.velocity += settings.gravity * dt;
        p.dragonY += p.velocity * dt;
        p.flame = Math.max(0, p.flame - dt * 2.8);

        if (p.realmTransitionProgress > 0) {
          p.realmTransitionProgress = Math.max(0, p.realmTransitionProgress - dt * 0.5);
        }

        spawnAmbient(p, p.currentRealmIndex, dt);

        // Distance-based spawning: keep the whole wide world filled with gates.
        // Wider screens => more gates visible simultaneously.
        const rightmostX = p.gates.reduce((max, g) => Math.max(max, g.x), -Infinity);
        if (rightmostX === -Infinity || rightmostX < logicalWidth - spacing) {
          gateIdCounterRef.current += 1;
          const gapY = 82 + Math.random() * (LOGICAL_HEIGHT - 164 - settings.gateGap);

          let item;
          if (Math.random() < 0.25) {
            const types: ('shield' | 'star' | 'slow')[] = ['shield', 'star', 'slow'];
            item = {
              type: types[Math.floor(Math.random() * types.length)],
              y: gapY + settings.gateGap / 2,
              collected: false,
            };
          }

          p.gates.push({
            id: gateIdCounterRef.current,
            x: Math.max(logicalWidth + 10, rightmostX + spacing),
            gapY,
            passed: false,
            item,
          });
        }

        p.gates.forEach((gate) => {
          gate.x -= settings.gateSpeed * speedMul * dt;

          if (!gate.passed && gate.x + GATE_WIDTH < dragonX - DRAGON_R) {
            gate.passed = true;
            p.score += 1;
            soundManager.play('score');
            onUpdateHighScore(p.score);

            floatingTextsRef.current.push({
              x: dragonX + 30,
              y: p.dragonY - 30,
              text: '+1',
              color: '#fef08a',
              life: 0.8,
              maxLife: 0.8,
            });

            if (p.score >= p.nextRealmChange) {
              // Random realm shift (never the same realm twice in a row)
              let nextIdx = Math.floor(Math.random() * REALMS.length);
              if (nextIdx === p.currentRealmIndex) {
                nextIdx = (nextIdx + 1) % REALMS.length;
              }
              p.currentRealmIndex = nextIdx;
              p.nextRealmChange += REALM_CHANGE_INTERVAL;
              p.realmTransitionProgress = 1;
              soundManager.play('levelClear');

              floatingTextsRef.current.push({
                x: logicalWidth / 2,
                y: LOGICAL_HEIGHT / 2 - 80,
                text: REALMS[nextIdx].name,
                color: REALMS[nextIdx].accentColor,
                life: 1.6,
                maxLife: 1.6,
              });
              forceRender((n) => n + 1);
            }
          }

          if (gate.item && !gate.item.collected) {
            const itemX = gate.x + GATE_WIDTH / 2;
            const dist = Math.hypot(dragonX - itemX, p.dragonY - gate.item.y);
            if (dist < DRAGON_R + 14) {
              gate.item.collected = true;
              soundManager.play('powerup');
              if (gate.item.type === 'shield') {
                p.hasShield = true;
                floatingTextsRef.current.push({ x: itemX, y: gate.item.y - 20, text: 'Shield!', color: '#38bdf8', life: 1, maxLife: 1 });
              } else if (gate.item.type === 'star') {
                p.score += 2;
                onUpdateHighScore(p.score);
                floatingTextsRef.current.push({ x: itemX, y: gate.item.y - 20, text: '+2 Bonus!', color: '#facc15', life: 1, maxLife: 1 });
              } else if (gate.item.type === 'slow') {
                p.slowTimer = 4.0;
                floatingTextsRef.current.push({ x: itemX, y: gate.item.y - 20, text: 'Slow-Mo!', color: '#c084fc', life: 1, maxLife: 1 });
              }
            }
          }
        });

        p.gates = p.gates.filter((g) => g.x > -110);

        // Collisions
        const hitBounds = p.dragonY - DRAGON_R < 0 || p.dragonY + DRAGON_R > LOGICAL_HEIGHT;
        const hitGate = p.gates.some(
          (gate) =>
            dragonX + DRAGON_R > gate.x &&
            dragonX - DRAGON_R < gate.x + GATE_WIDTH &&
            (p.dragonY - DRAGON_R < gate.gapY || p.dragonY + DRAGON_R > gate.gapY + settings.gateGap)
        );

        if (hitBounds || hitGate) {
          if (p.hasShield && hitGate && !hitBounds) {
            p.hasShield = false;
            soundManager.play('shieldBreak');
            p.velocity = settings.flapVelocity * 0.7;
            shakeRef.current = 6;
            for (let i = 0; i < 12; i++) {
              p.particles.push({
                x: dragonX,
                y: p.dragonY,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                size: 3 + Math.random() * 3,
                color: '#38bdf8',
                life: 0.5,
                maxLife: 0.5,
              });
            }
          } else {
            p.status = 'over';
            soundManager.play('over');
            onUpdateHighScore(p.score);
            void reportRun('dragon-flight', p.score, { skin: skin.id });
            shakeRef.current = 14;
            // Death burst
            for (let i = 0; i < 24; i++) {
              p.particles.push({
                x: dragonX,
                y: p.dragonY,
                vx: (Math.random() - 0.5) * 320,
                vy: (Math.random() - 0.5) * 320,
                size: 2.5 + Math.random() * 4,
                color: i % 2 === 0 ? skin.flameColors[1] : skin.flameColors[2],
                life: 0.8,
                maxLife: 0.8,
              });
            }
          }
        }

        p.particles.forEach((part) => {
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          part.life -= dt;
        });
        p.particles = p.particles.filter((part) => part.life > 0);
      } else {
        p.flame = Math.max(0.15, Math.sin(time / 250) * 0.15 + 0.25);
        // Keep particles fading out even when over/paused
        if (p.status === 'over') {
          p.particles.forEach((part) => {
            part.x += part.vx * dt;
            part.y += part.vy * dt;
            part.life -= dt;
          });
          p.particles = p.particles.filter((part) => part.life > 0);
        }
      }

      // Floating texts
      floatingTextsRef.current.forEach((t) => {
        t.y -= dt * 40;
        t.life -= dt;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter((t) => t.life > 0);

      // Screen shake decay
      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt * 30);
      }

      // ---- Draw ----
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);

        // Screen shake offset
        if (shakeRef.current > 0.2) {
          ctx.translate(
            (Math.random() - 0.5) * shakeRef.current,
            (Math.random() - 0.5) * shakeRef.current
          );
        }

        drawBackground(ctx, logicalWidth, LOGICAL_HEIGHT, currentRealm, time);

        // Realm transition flash
        if (p.realmTransitionProgress > 0) {
          ctx.fillStyle = currentRealm.accentColor;
          ctx.globalAlpha = p.realmTransitionProgress * 0.35;
          ctx.fillRect(0, 0, logicalWidth, LOGICAL_HEIGHT);
          ctx.globalAlpha = 1;
        }

        p.gates.forEach((gate) => {
          drawGate(ctx, gate, LOGICAL_HEIGHT, currentRealm, settings.gateGap, time);
        });

        drawParticles(ctx, p.particles);
        drawDragon(ctx, dragonX, p.dragonY, p.velocity, p.flame, skin, p.hasShield, time);

        // Floating score texts
        floatingTextsRef.current.forEach((t) => {
          ctx.save();
          ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
          ctx.fillStyle = t.color;
          ctx.font = t.text.length > 4 ? '800 26px sans-serif' : '800 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 12;
          ctx.fillText(t.text, t.x, t.y);
          ctx.restore();
        });

        // Score
        if (p.status === 'playing') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.font = '800 44px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.fillText(String(p.score), logicalWidth / 2, 70);
          ctx.shadowBlur = 0;

          // Progress to next realm shift
          const progress = 1 - (p.nextRealmChange - p.score) / REALM_CHANGE_INTERVAL;
          const barW = 120;
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.roundRect(logicalWidth / 2 - barW / 2, 84, barW, 6, 3);
          ctx.fill();
          ctx.fillStyle = currentRealm.accentColor;
          ctx.beginPath();
          ctx.roundRect(logicalWidth / 2 - barW / 2, 84, barW * Math.max(0, Math.min(1, progress)), 6, 3);
          ctx.fill();
        }

        ctx.restore();
      }

      if (p.status !== lastSeenStatus.current || p.score !== lastSeenScore.current) {
        lastSeenStatus.current = p.status;
        lastSeenScore.current = p.score;
        forceRender((n) => n + 1);
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [viewSize, logicalWidth, dragonX, skin, onUpdateHighScore]);

  const p = physicsRef.current;
  const isLight = theme === 'light';
  const currentRealm = REALMS[p.currentRealmIndex];

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden flex flex-col transition-colors duration-300 ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#07060b] text-orange-50'
      }`}
    >
      {/* HUD Header */}
      <header className={`relative z-20 flex items-center justify-between px-3 py-2 w-full flex-shrink-0 backdrop-blur-md ${
        isLight ? 'bg-white/80 border-b border-slate-200' : 'bg-stone-900/60 border-b border-white/10'
      }`}>
        <button
          onClick={onBackToIntro}
          className={`p-2 rounded-lg border transition ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-orange-200 hover:bg-white/10'}`}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full transition-colors duration-500" style={{ backgroundColor: currentRealm.accentColor }} />
            <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>{currentRealm.name}</span>
          </div>

          {p.hasShield && (
            <span className="flex items-center gap-1 bg-sky-500/20 border border-sky-400/40 text-sky-500 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
              <Shield className="h-3 w-3" /> <span className="hidden sm:inline">Shield</span>
            </span>
          )}
          {p.slowTimer > 0 && (
            <span className="flex items-center gap-1 bg-purple-500/20 border border-purple-400/40 text-purple-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <Zap className="h-3 w-3" /> <span className="hidden sm:inline">Slow</span>
            </span>
          )}

          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isLight ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-black/40 border border-white/10 text-amber-300'}`}>
            <Trophy className="h-3 w-3 text-amber-500" />
            <span>Best {highScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={togglePause} className={`p-1.5 sm:p-2 rounded-lg border transition ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-orange-200 hover:bg-white/10'}`}>
            {p.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button onClick={onToggleTheme} className={`p-1.5 sm:p-2 rounded-lg border transition ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-orange-200 hover:bg-white/10'}`}>
            {isLight ? <Moon className="h-4 w-4 text-indigo-600" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>
          <button onClick={onToggleSound} className={`p-1.5 sm:p-2 rounded-lg border transition ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-orange-200 hover:bg-white/10'}`}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-red-500" />}
          </button>
        </div>
      </header>

      {/* Full-bleed Game Canvas */}
      <main
        ref={containerRef}
        className="relative z-10 flex-1 min-h-0 w-full touch-none select-none"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          flap();
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block" />

        {/* Ready Overlay */}
        {p.status === 'ready' && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm animate-fade-in ${
            isLight ? 'bg-white/75 text-slate-900' : 'bg-black/60 text-white'
          }`}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border border-white/20 mb-4 animate-bounce" style={{ backgroundColor: `${currentRealm.accentColor}33` }}>
              <Play className="h-7 w-7 sm:h-8 sm:w-8 fill-current ml-0.5" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black">Ready to Fly</h3>
            <p className={`text-xs sm:text-sm mt-2 max-w-sm ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              Tap, click, or press Space / W / ↑ to flap.
              <br />
              Realms shift randomly every {REALM_CHANGE_INTERVAL} gates — collect 🛡️ ⭐ ⏳ power-ups!
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); flap(); }}
              className="mt-5 px-8 py-3 rounded-full font-black text-sm sm:text-base text-stone-950 shadow-lg hover:scale-105 transition"
              style={{ backgroundColor: currentRealm.accentColor }}
            >
              START FLIGHT
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {p.status === 'paused' && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm animate-fade-in ${
            isLight ? 'bg-white/85 text-slate-900' : 'bg-black/75 text-white'
          }`}>
            <h3 className="text-3xl font-black">PAUSED</h3>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Score: {p.score} · Realm: {currentRealm.name}</p>
            <div className="flex flex-col gap-2 mt-5 w-44">
              <button onClick={togglePause} className="w-full py-2.5 rounded-xl bg-orange-500 font-bold text-sm text-white hover:bg-orange-600 transition">Resume</button>
              <button onClick={restart} className={`w-full py-2 rounded-xl border font-bold text-xs transition ${isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'}`}>Restart</button>
              <button onClick={onBackToIntro} className={`w-full py-2 rounded-xl border font-bold text-xs transition ${isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'}`}>Menu</button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {p.status === 'over' && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center backdrop-blur-md animate-fade-in ${
            isLight ? 'bg-white/90 text-slate-900' : 'bg-black/80 text-white'
          }`}>
            <span className="text-xs font-black uppercase tracking-widest text-red-500">FLIGHT ENDED</span>
            <h3 className="text-5xl sm:text-6xl font-black mt-2">{p.score}</h3>
            <p className={`text-sm mt-2 ${p.score >= highScore && p.score > 0 ? 'text-emerald-500 font-bold' : isLight ? 'text-slate-500' : 'text-white/60'}`}>
              {p.score >= highScore && p.score > 0 ? '🎉 New Personal Best!' : `Personal Best: ${highScore}`}
            </p>
            <div className="flex flex-col gap-2.5 mt-6 w-52">
              <button onClick={restart} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-black text-sm text-white hover:scale-105 transition shadow-lg shadow-orange-500/30">
                TRY AGAIN (R)
              </button>
              <button onClick={onBackToIntro} className={`w-full py-2.5 rounded-xl border font-bold text-xs transition ${isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'}`}>
                Back to Menu
              </button>
            </div>
          </div>
        )}

        {/* Realm indicator dots */}
        {p.status === 'playing' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
            {REALMS.map((realm, idx) => (
              <div
                key={realm.id}
                className={`h-2 rounded-full transition-all duration-500 ${idx === p.currentRealmIndex ? 'w-5' : 'w-2 opacity-40'}`}
                style={{ backgroundColor: realm.accentColor }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
