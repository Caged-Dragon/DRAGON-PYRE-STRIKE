import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { DrakeGame, type Toast } from "../game/engine";
import { LEVEL_COUNT } from "../game/levels";
import {
  EMPTY_HUD,
  POWER_META,
  type HudState,
  type OverlayState,
  type PowerKind,
} from "../game/types";

type Props = {
  startLevel: number;
  onExit: () => void;
};

const TIERS: { v: number; label: string }[] = [
  { v: 1, label: "×1" },
  { v: 1.5, label: "×1.5" },
  { v: 2, label: "×2" },
];

export default function GameCanvas({ startLevel, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<DrakeGame | null>(null);
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [overlay, setOverlay] = useState<OverlayState>({ kind: "ready" });
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const game = new DrakeGame(canvas, {
      onHud: setHud,
      onOverlay: setOverlay,
      onToast: (t) => {
        setToasts((prev) => [...prev.slice(-3), t]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id));
        }, 2200);
      },
    });
    gameRef.current = game;
    game.start(startLevel);

    const toWorld = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((clientX - r.left) / r.width) * 960,
        y: ((clientY - r.top) / r.height) * 640,
      };
    };

    const onMove = (e: PointerEvent) => {
      const p = toWorld(e.clientX, e.clientY);
      game.pointerMove(p.x, p.y);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const p = toWorld(e.clientX, e.clientY);
      game.pointerDown(p.x, p.y);
    };
    const onUp = () => game.pointerUp();
    const onWheel = (e: WheelEvent) => {
      if (game.aiming) {
        e.preventDefault();
        game.wheel(Math.sign(e.deltaY));
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "Spacebar"].includes(e.key)) e.preventDefault();
      if (e.repeat && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      game.keyDown(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => game.keyUp(e.key);
    const onResize = () => game.fit();
    const onBlur = () => {
      game.setBoost(false);
      game.keyUp("ArrowLeft");
      game.keyUp("ArrowRight");
    };
    const onMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onMenu);
    wrap.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
    window.addEventListener("blur", onBlur);

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onMenu);
      wrap.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", onBlur);
      game.destroy();
      gameRef.current = null;
    };
  }, [startLevel]);

  const g = () => gameRef.current;
  const introKey = `${hud.level}-${overlay.title ?? ""}`;

  return (
    <div className="flex w-full flex-col gap-3 px-3 py-4" style={{ maxWidth: 643 }}>
      <HudBar
        hud={hud}
        onMute={() => {
          g()?.audio.toggleMute();
          setHud((h) => ({ ...h, muted: !h.muted }));
        }}
        onPause={() => {
          if (overlay.kind === "paused") g()?.resume();
          else g()?.pause();
        }}
        onExit={onExit}
      />

      <div
        ref={wrapRef}
        className="gold-border relative mx-auto w-full touch-none overflow-hidden rounded-sm bg-black"
        style={{ maxWidth: 643, aspectRatio: "960 / 640" }}
      >
        <div className="pointer-events-none absolute inset-0 z-10 border-[3px] border-amber-700/40" />
        <Corner />
        <canvas
          ref={canvasRef}
          className={`relative z-0 h-full w-full touch-none ${hud.aiming ? "cursor-crosshair" : "cursor-none"}`}
        />

        <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="font-cinzel rounded border border-amber-500/50 bg-black/70 px-3 py-1 text-xs tracking-[0.18em] text-amber-200 shadow-lg"
            >
              {t.text}
            </div>
          ))}
        </div>

        {overlay.kind === "ready" && overlay.title && (
          <IntroCard key={introKey} title={overlay.title} body={overlay.body ?? ""} chapter={hud.level} realm={hud.realm} />
        )}

        {overlay.kind !== "none" && overlay.kind !== "playing" && overlay.kind !== "ready" && (
          <OverlayCard
            overlay={overlay}
            hud={hud}
            onResume={() => g()?.resume()}
            onNext={() => g()?.nextLevel()}
            onRestart={() => g()?.restart(overlay.kind === "victory")}
            onExit={onExit}
          />
        )}
      </div>

      <ControlBar
        hud={hud}
        onTier={(t) => g()?.setSpeedTier(t)}
        onBoost={(on) => g()?.setBoost(on)}
        onAim={(dir, on) => g()?.setAimKey(dir, on)}
        onFire={() => {
          g()?.audio.unlock();
          g()?.fire();
        }}
        onRage={() => g()?.activateRage()}
      />

      <p className="font-cinzel text-center text-[10px] leading-relaxed tracking-[0.22em] text-amber-200/50 md:text-xs">
        Aim · pointer, ◀ ▶ or wheel &nbsp;·&nbsp; Fire · release, Space or ↑ &nbsp;·&nbsp; Move · pointer or A D &nbsp;·&nbsp;
        Boost · hold Shift &nbsp;·&nbsp; Pace · 1 2 3 &nbsp;·&nbsp; Pause · P
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HudBar({
  hud,
  onMute,
  onPause,
  onExit,
}: {
  hud: HudState;
  onMute: () => void;
  onPause: () => void;
  onExit: () => void;
}) {
  return (
    <div className="gold-border ornate-panel grid grid-cols-2 items-center gap-3 rounded-sm px-4 py-3 md:grid-cols-[1.3fr_1fr_1.1fr_auto]">
      <div>
        <div className="font-display gold-text text-lg leading-none md:text-2xl">Drakebreaker</div>
        <div className="font-cinzel mt-1 text-[10px] tracking-[0.22em] text-amber-200/70 md:text-xs">
          {hud.realm} · Chapter {hud.level}/{LEVEL_COUNT}
        </div>
        <div className="truncate text-sm italic text-amber-100/70">{hud.levelName}</div>
      </div>
      <div className="text-right md:text-center">
        <div className="font-cinzel text-[10px] tracking-[0.3em] text-amber-200/50">SCORE</div>
        <div className="font-display text-xl text-amber-100 md:text-2xl">{hud.score.toLocaleString()}</div>
        <div className="text-[10px] tracking-widest text-amber-200/40">Best {hud.high.toLocaleString()}</div>
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 md:col-span-1 md:justify-center">
        <div>
          <div className="font-cinzel text-[10px] tracking-[0.3em] text-amber-200/50">EGGS</div>
          <div className="mt-0.5 flex gap-1">
            {Array.from({ length: Math.max(3, hud.lives) }).map((_, i) => (
              <span
                key={i}
                className={`inline-block h-3.5 w-2.5 rounded-full border ${
                  i < hud.lives
                    ? "border-amber-400 bg-gradient-to-b from-amber-200 to-orange-700 shadow-[0_0_8px_#fb923c]"
                    : "border-stone-700 bg-stone-900"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="min-w-[140px] flex-1">
          <div className="font-cinzel flex justify-between text-[10px] tracking-[0.3em] text-amber-200/50">
            <span>RAGE</span>
            {hud.combo > 1 && <span className="text-orange-400">x{hud.combo}</span>}
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/60 ring-1 ring-amber-700/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-800 via-orange-500 to-amber-300 transition-all duration-200"
              style={{ width: `${hud.rage}%`, boxShadow: hud.rage > 90 ? "0 0 12px #ff4500" : undefined }}
            />
          </div>
        </div>
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 md:col-span-1">
        {hud.effects.map((e) => (
          <EffectChip key={e.kind} kind={e.kind} remaining={e.remaining} />
        ))}
        <button
          type="button"
          onClick={onMute}
          className="btn-ghost gold-border rounded-sm px-2 py-1 font-cinzel text-[10px] tracking-widest"
        >
          {hud.muted ? "SOUND OFF" : "SOUND ON"}
        </button>
        <button
          type="button"
          onClick={onPause}
          className="btn-ghost gold-border rounded-sm px-2 py-1 font-cinzel text-[10px] tracking-widest"
        >
          PAUSE
        </button>
        <button
          type="button"
          onClick={onExit}
          className="btn-ghost gold-border rounded-sm px-2 py-1 font-cinzel text-[10px] tracking-widest"
        >
          FLEE
        </button>
      </div>
    </div>
  );
}

function EffectChip({ kind, remaining }: { kind: PowerKind; remaining: number }) {
  const meta = POWER_META[kind];
  return (
    <div
      className="font-cinzel hidden items-center gap-1 rounded-sm border px-2 py-1 text-[10px] tracking-widest sm:flex"
      style={{ borderColor: meta.color, color: meta.color, borderStyle: meta.bad ? "dashed" : "solid" }}
      title={meta.label}
    >
      <span>{meta.glyph}</span>
      <span>{Math.max(0, Math.ceil(remaining))}s</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ControlBar({
  hud,
  onTier,
  onBoost,
  onAim,
  onFire,
  onRage,
}: {
  hud: HudState;
  onTier: (t: number) => void;
  onBoost: (on: boolean) => void;
  onAim: (dir: -1 | 1, on: boolean) => void;
  onFire: () => void;
  onRage: () => void;
}) {
  const hold =
    (start: () => void, stop: () => void) =>
    ({
      onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      },
      onPointerUp: stop,
      onPointerCancel: stop,
      onLostPointerCapture: stop,
      onContextMenu: (e: ReactPointerEvent<HTMLButtonElement>) => e.preventDefault(),
    }) as const;

  const rageReady = hud.rage >= 100 && !hud.effects.some((e) => e.kind === "rage");

  return (
    <div className="gold-border ornate-panel mx-auto flex w-full max-w-[643px] flex-wrap items-stretch justify-between gap-3 rounded-sm px-3 py-3 md:px-4">
      {/* pace */}
      <div className="flex items-center gap-2">
        <div className="font-cinzel mr-1 text-[10px] tracking-[0.3em] text-amber-200/60">PACE</div>
        <div className="flex overflow-hidden rounded-sm border border-amber-600/50">
          {TIERS.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => onTier(t.v)}
              className={`seg font-cinzel px-3 py-2 text-xs tracking-widest ${
                hud.speedTier === t.v ? "seg-active" : ""
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* boost */}
      <button
        type="button"
        {...hold(
          () => onBoost(true),
          () => onBoost(false)
        )}
        className={`boost-btn gold-border font-cinzel order-last w-full select-none rounded-sm px-5 py-3 text-xs tracking-[0.28em] md:order-none md:w-auto md:min-w-[200px] ${
          hud.boosting ? "on" : ""
        }`}
      >
        <span className="mr-2 text-base leading-none">🔥</span>
        {hud.boosting ? "BOOSTING" : "HOLD TO BOOST"}
        <span className="ml-2 text-[9px] tracking-[0.2em] text-amber-100/60">SHIFT</span>
      </button>

      {/* aim + fire */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...hold(
            () => onAim(-1, true),
            () => onAim(-1, false)
          )}
          className="btn-ghost gold-border font-cinzel touch-none select-none rounded-sm px-4 py-2 text-sm"
          title={hud.aiming ? "Rotate aim left" : "Move left"}
        >
          ◀
        </button>
        <button
          type="button"
          {...hold(
            () => onAim(1, true),
            () => onAim(1, false)
          )}
          className="btn-ghost gold-border font-cinzel touch-none select-none rounded-sm px-4 py-2 text-sm"
          title={hud.aiming ? "Rotate aim right" : "Move right"}
        >
          ▶
        </button>
        {rageReady ? (
          <button
            type="button"
            onClick={onRage}
            className="btn-ember gold-border font-cinzel animate-[pulse-glow_1.2s_ease-in-out_infinite] rounded-sm px-5 py-2 text-xs"
          >
            RAGE
          </button>
        ) : (
          <button
            type="button"
            onClick={onFire}
            disabled={!hud.aiming}
            className={`font-cinzel gold-border rounded-sm px-5 py-2 text-xs transition ${
              hud.aiming ? "btn-ember" : "btn-ghost opacity-40"
            }`}
          >
            {hud.aiming ? "FIRE ↑" : "IN FLIGHT"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function IntroCard({
  title,
  body,
  chapter,
  realm,
}: {
  title: string;
  body: string;
  chapter: number;
  realm: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[57%] z-30 flex justify-center px-4">
      <div className="animate-intro gold-border ornate-panel max-w-lg rounded-sm px-8 py-3 text-center shadow-2xl">
        <div className="font-cinzel text-[10px] tracking-[0.4em] text-orange-400">
          {realm.toUpperCase()} · CHAPTER {chapter}
        </div>
        <h2 className="font-display gold-text mt-1 text-2xl md:text-3xl">{title}</h2>
        <p className="mt-1 text-sm italic text-amber-100/75">{body}</p>
        <p className="font-cinzel mt-2 text-[10px] tracking-[0.22em] text-amber-200/60">
          Take aim, then release to loose the fireball
        </p>
      </div>
    </div>
  );
}

function OverlayCard({
  overlay,
  hud,
  onResume,
  onNext,
  onRestart,
  onExit,
}: {
  overlay: OverlayState;
  hud: HudState;
  onResume: () => void;
  onNext: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={() => {
        if (overlay.kind === "paused") onResume();
      }}
    >
      <div
        className="gold-border ornate-panel max-w-md rounded-sm px-8 py-7 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-cinzel text-[10px] tracking-[0.4em] text-amber-200/60">
          {overlay.kind === "paused" && "PAUSED"}
          {overlay.kind === "levelclear" && `CHAPTER ${hud.level} CLEARED`}
          {overlay.kind === "gameover" && "DEFEAT"}
          {overlay.kind === "victory" && "VICTORY"}
        </div>
        <h2 className="font-display gold-text mt-2 text-3xl md:text-4xl">{overlay.title}</h2>
        <p className="mt-3 text-base italic text-amber-100/80">{overlay.body}</p>
        {overlay.score != null && (
          <p className="font-cinzel mt-4 text-sm tracking-[0.2em] text-amber-200">
            Score · {overlay.score.toLocaleString()}
            {hud.score >= hud.high && overlay.kind !== "levelclear" ? " · New hoard record" : ""}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {overlay.kind === "paused" && (
            <button type="button" onClick={onResume} className="btn-ember gold-border font-cinzel rounded-sm px-6 py-2.5 text-xs">
              RESUME
            </button>
          )}
          {overlay.kind === "levelclear" && (
            <button type="button" onClick={onNext} className="btn-ember gold-border font-cinzel rounded-sm px-6 py-2.5 text-xs">
              {hud.level >= LEVEL_COUNT ? "CLAIM THE HOARD" : `DESCEND TO CHAPTER ${hud.level + 1}`}
            </button>
          )}
          {(overlay.kind === "gameover" || overlay.kind === "victory") && (
            <>
              <button type="button" onClick={onRestart} className="btn-ember gold-border font-cinzel rounded-sm px-6 py-2.5 text-xs">
                {overlay.kind === "victory" ? "BURN IT ALL AGAIN" : `RETRY CHAPTER ${hud.level}`}
              </button>
              <button type="button" onClick={onExit} className="btn-ghost gold-border font-cinzel rounded-sm px-6 py-2.5 text-xs">
                LEAVE THE LAIR
              </button>
            </>
          )}
          {overlay.kind === "paused" && (
            <button type="button" onClick={onExit} className="btn-ghost gold-border font-cinzel rounded-sm px-6 py-2.5 text-xs">
              CHAPTER SELECT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Corner() {
  return (
    <>
      <span className="pointer-events-none absolute left-1 top-1 z-20 h-6 w-6 border-l-2 border-t-2 border-amber-400/70" />
      <span className="pointer-events-none absolute right-1 top-1 z-20 h-6 w-6 border-r-2 border-t-2 border-amber-400/70" />
      <span className="pointer-events-none absolute bottom-1 left-1 z-20 h-6 w-6 border-b-2 border-l-2 border-amber-400/70" />
      <span className="pointer-events-none absolute bottom-1 right-1 z-20 h-6 w-6 border-b-2 border-r-2 border-amber-400/70" />
    </>
  );
}
