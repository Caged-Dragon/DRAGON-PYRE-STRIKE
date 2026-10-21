import { useEffect, useRef, useState } from "react";
import Embers from "./components/Embers";
import { DragonDock, exitToHub, loadCloudSave, queueCloudSave, reportRun, useAuth } from "./dps";
import GameCanvas from "./components/GameCanvas";
import { loadUnlocked, resetUnlocked } from "./game/engine";
import { LEVELS, LEVEL_COUNT, REALMS, REALM_SIZE, levelBrickCount } from "./game/levels";
import { BRICK_META, POWER_META, type BrickKind, type PowerKind } from "./game/types";
import lair from "../public/images/lair.jpg";
import dragon from "../public/images/dragon.png";

type Screen = "menu" | "how" | "select" | "game";

const HIGH = () => Number(localStorage.getItem("drakebreaker-hs") || 0);

type DrakeSave = { high: number; unlocked: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [high, setHigh] = useState(HIGH);
  const [unlocked, setUnlocked] = useState(loadUnlocked);
  const [startLevel, setStartLevel] = useState(0);
  const { user } = useAuth();
  const uid = user?.id;

  // On sign-in: merge local + cloud progress (best of both), then keep both in sync.
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void (async () => {
      const cloud = await loadCloudSave<DrakeSave>("drakebreaker", "main");
      if (!alive) return;
      const high = Math.max(HIGH(), cloud?.data.high ?? 0);
      const unlockedMax = Math.min(LEVEL_COUNT, Math.max(loadUnlocked(), cloud?.data.unlocked ?? 1));
      try {
        localStorage.setItem("drakebreaker-hs", String(high));
        localStorage.setItem("drakebreaker-unlocked", String(unlockedMax));
      } catch {
        /* storage unavailable */
      }
      setHigh(high);
      setUnlocked(unlockedMax);
      queueCloudSave("drakebreaker", "main", { high, unlocked: unlockedMax }, 1, 500);
      // First time on the leaderboard? Post the best score earned before the account existed.
      if (!cloud && high > 0) void reportRun("drakebreaker", high, { source: "local-best" });
    })();
    return () => {
      alive = false;
    };
  }, [uid]);

  const refresh = () => {
    setHigh(HIGH());
    setUnlocked(loadUnlocked());
  };

  const play = (idx: number) => {
    setStartLevel(idx);
    setScreen("game");
  };

  const rootRef = useRef<HTMLDivElement>(null);
  // Gentle mouse parallax on the cave background (mouse only, skipped for reduced motion).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--px", x.toFixed(3));
      el.style.setProperty("--py", y.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative min-h-screen select-none overflow-x-hidden overflow-y-auto text-amber-100">
      <div className="db-bg fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${lair})` }} />
      <div className="vignette fixed inset-0 bg-black/55" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
      <Embers />
      <DragonDock siteSlug="drakebreaker" position="bottom-left" />

      <div key={screen} className="db-screen relative z-10 flex min-h-screen flex-col items-center">
        {screen === "menu" && (
          <Menu
            high={high}
            unlocked={unlocked}
            onContinue={() => play(unlocked - 1)}
            onSelect={() => setScreen("select")}
            onHow={() => setScreen("how")}
          />
        )}
        {screen === "how" && <HowTo onBack={() => setScreen("menu")} />}
        {screen === "select" && (
          <ChapterSelect
            unlocked={unlocked}
            onPick={play}
            onBack={() => setScreen("menu")}
            onReset={() => {
              resetUnlocked();
              setUnlocked(1);
              queueCloudSave("drakebreaker", "main", { high: HIGH(), unlocked: 1 }, 1, 500);
            }}
          />
        )}
        {screen === "game" && (
          <GameCanvas
            startLevel={startLevel}
            onExit={() => {
              refresh();
              setScreen("select");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Menu({
  high,
  unlocked,
  onContinue,
  onSelect,
  onHow,
}: {
  high: number;
  unlocked: number;
  onContinue: () => void;
  onSelect: () => void;
  onHow: () => void;
}) {
  const next = LEVELS[Math.min(unlocked, LEVEL_COUNT) - 1];
  return (
    <div className="db-wrap">
    <div className="db-hero">
      <div className="db-art relative">
        <img
          src={dragon}
          alt="Elder drake"
          className="animate-floaty w-full rounded-sm object-cover opacity-95"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      <div className="db-copy db-stagger">
        <p className="font-cinzel animate-flicker text-xs tracking-[0.55em] text-orange-400/90">
          A DRAGON'S BRICK BREAKER
        </p>
        <h1 className="font-display gold-text mt-3 text-[length:clamp(2.6rem,1.4rem+5vw,5rem)] leading-tight">
          Drake
          <br />
          breaker
        </h1>
        <p className="mt-5 max-w-md text-lg italic text-amber-100/80">
          Fifty chambers of the wyrm's hoard. Take aim, loose the fireball, and do not let the flame die.
        </p>

        <div className="db-chips mt-6 flex flex-wrap gap-2">
          <div className="gold-border ornate-panel inline-block rounded-sm px-4 py-2 font-cinzel text-[11px] tracking-[0.26em] text-amber-200/80">
            GREATEST HOARD · {high.toLocaleString()}
          </div>
          <div className="gold-border ornate-panel inline-block rounded-sm px-4 py-2 font-cinzel text-[11px] tracking-[0.26em] text-amber-200/80">
            CHAPTERS OPENED · {unlocked}/{LEVEL_COUNT}
          </div>
        </div>

        <div className="db-btns mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="btn-ember gold-border font-cinzel rounded-sm px-[clamp(1.1rem,0.7rem+1.6vw,2rem)] py-[clamp(0.6rem,0.5rem+0.4vw,0.8rem)] text-[length:clamp(0.72rem,0.68rem+0.2vw,0.875rem)]"
          >
            {unlocked > 1 ? `CONTINUE · CH. ${unlocked}` : "BEGIN THE HUNT"}
          </button>
          <button
            type="button"
            onClick={onSelect}
            className="btn-ghost gold-border font-cinzel rounded-sm px-[clamp(1.1rem,0.7rem+1.6vw,2rem)] py-[clamp(0.6rem,0.5rem+0.4vw,0.8rem)] text-[length:clamp(0.72rem,0.68rem+0.2vw,0.875rem)]"
          >
            CHOOSE CHAPTER
          </button>
          <button
            type="button"
            onClick={onHow}
            className="btn-ghost gold-border font-cinzel rounded-sm px-[clamp(1.1rem,0.7rem+1.6vw,2rem)] py-[clamp(0.6rem,0.5rem+0.4vw,0.8rem)] text-[length:clamp(0.72rem,0.68rem+0.2vw,0.875rem)]"
          >
            THE LORE
          </button>
          <button
            type="button"
            onClick={() => void exitToHub()}
            className="btn-ghost gold-border font-cinzel rounded-sm px-[clamp(1.1rem,0.7rem+1.6vw,2rem)] py-[clamp(0.6rem,0.5rem+0.4vw,0.8rem)] text-[length:clamp(0.72rem,0.68rem+0.2vw,0.875rem)]"
          >
            EXIT TO DRACOPYRE STRIKE
          </button>
        </div>
        {next && (
          <p className="mt-6 text-sm italic text-amber-200/50">
            Next: <span className="text-amber-100/80">{next.name}</span> — {next.flavor}
          </p>
        )}
      </div>
    </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ChapterSelect({
  unlocked,
  onPick,
  onBack,
  onReset,
}: {
  unlocked: number;
  onPick: (idx: number) => void;
  onBack: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex w-full max-w-6xl flex-1 flex-col px-[clamp(1rem,0.5rem+2.4vw,2.5rem)] py-[clamp(1.25rem,0.8rem+2vw,2.25rem)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-cinzel text-xs tracking-[0.4em] text-orange-400">THE DESCENT</p>
          <h2 className="font-display gold-text mt-1 text-[length:clamp(1.8rem,1.2rem+2.6vw,3rem)]">Choose a Chapter</h2>
          <p className="mt-2 text-base italic text-amber-100/70">
            {unlocked} of {LEVEL_COUNT} chambers opened. Clear a chamber to unseal the next.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="btn-ghost gold-border font-cinzel rounded-sm px-5 py-2 text-xs"
          >
            RETURN
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Forget all progress and seal the chambers again?")) onReset();
            }}
            className="btn-ghost gold-border font-cinzel rounded-sm px-5 py-2 text-xs opacity-70"
          >
            FORGET PROGRESS
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {REALMS.map((realm, ri) => {
          const from = ri * REALM_SIZE;
          const chunk = LEVELS.slice(from, from + REALM_SIZE);
          const opened = Math.max(0, Math.min(REALM_SIZE, unlocked - from));
          return (
            <section key={realm.name} className="gold-border ornate-panel rounded-sm p-4 md:p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl md:text-2xl" style={{ color: realm.accent }}>
                    Realm {["I", "II", "III", "IV", "V"][ri]} · {realm.name}
                  </h3>
                  <p className="text-sm italic text-amber-100/60">{realm.tagline}</p>
                </div>
                <span className="font-cinzel text-[10px] tracking-[0.3em] text-amber-200/50">
                  {opened}/{REALM_SIZE} OPENED
                </span>
              </div>
              <div className="grid gap-[clamp(0.4rem,0.25rem+0.6vw,0.65rem)] grid-cols-[repeat(auto-fill,minmax(clamp(4.1rem,2.6rem+5vw,6.4rem),1fr))]">
                {chunk.map((lv, li) => {
                  const idx = from + li;
                  const open = idx < unlocked;
                  const bricks = levelBrickCount(lv);
                  const heat = Math.min(5, 1 + Math.floor(bricks / 22));
                  return (
                    <button
                      key={lv.id}
                      type="button"
                      disabled={!open}
                      onClick={() => onPick(idx)}
                      title={open ? lv.flavor : "Sealed"}
                      className={`db-tile group relative flex aspect-square flex-col items-center justify-center rounded-sm border p-1 text-center transition ${
                        open
                          ? "border-amber-500/50 bg-gradient-to-b from-orange-950/70 to-black/70 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_0_18px_rgba(255,140,40,0.35)]"
                          : "cursor-not-allowed border-stone-800 bg-black/50 opacity-50"
                      }`}
                      style={{ ["--i" as string]: li, ...(open ? { boxShadow: `inset 0 -3px 0 ${realm.accent}55` } : {}) }}
                    >
                      <span className="font-display text-xl leading-none" style={{ color: open ? realm.accent : "#57534e" }}>
                        {lv.id}
                      </span>
                      <span className="font-cinzel mt-1 line-clamp-2 px-0.5 text-[9px] leading-tight tracking-wider text-amber-100/80">
                        {open ? lv.name : "Sealed"}
                      </span>
                      {open ? (
                        <span className="mt-1 flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className="block h-1 w-1 rounded-full"
                              style={{ background: i < heat ? realm.accent : "rgba(255,255,255,0.12)" }}
                            />
                          ))}
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] text-stone-500">🔒</span>
                      )}
                      {idx === unlocked - 1 && (
                        <span className="font-cinzel absolute -top-2 rounded-sm bg-orange-600 px-1.5 py-0.5 text-[8px] tracking-widest text-white shadow">
                          NEXT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HowTo({ onBack }: { onBack: () => void }) {
  const items = [
    {
      t: "Take Aim",
      d: "Nothing fires by itself. While the fireball rests on the drake, point with your mouse or finger, tap ◀ ▶, or roll the wheel to set the arrow — then release, click, or press Space to loose it.",
    },
    {
      t: "Boost & Pace",
      d: "If the fireball settles into a dull loop, hold the BOOST button (or Shift) to drive it faster. Set a permanent pace of ×1, ×1.5 or ×2 with the buttons or keys 1–3.",
    },
    {
      t: "The Hoard",
      d: "Fifty chambers across five realms, each laid out by hand: serpents, skulls, crowns, mazes and moons. Clear a chamber to unseal the next; progress is remembered.",
    },
    {
      t: "Dragon Rage",
      d: "Fill the rage meter by shattering bricks. When it peaks the drake roars and your fireball burns straight through the hoard for a few seconds.",
    },
  ];
  const bricks = Object.keys(BRICK_META) as BrickKind[];
  const powers = (Object.keys(POWER_META) as PowerKind[]).filter((k) => k !== "rage");
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-12">
      <div className="gold-border ornate-panel rounded-sm p-[clamp(1.1rem,0.6rem+2.4vw,2.5rem)]">
        <p className="font-cinzel text-xs tracking-[0.4em] text-orange-400">CODEX</p>
        <h2 className="font-display gold-text mt-2 text-[length:clamp(1.7rem,1.2rem+2.2vw,2.5rem)]">How the hunt is done</h2>
        <div className="mt-8 grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
          {items.map((it) => (
            <div key={it.t} className="border-l-2 border-amber-700/60 pl-4">
              <h3 className="font-cinzel text-sm tracking-[0.2em] text-amber-200">{it.t}</h3>
              <p className="mt-1 text-base text-amber-100/75">{it.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-cinzel mt-10 text-xs tracking-[0.35em] text-amber-200/60">THE STONES OF THE HOARD</h3>
        <div className="mt-3 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
          {bricks.map((k) => {
            const m = BRICK_META[k];
            return (
              <div key={k} className="flex items-center gap-3">
                <span
                  className="h-4 w-8 shrink-0 rounded-sm"
                  style={{ background: m.color, boxShadow: `0 0 10px ${m.color}` }}
                />
                <span className="font-cinzel text-[11px] tracking-widest text-amber-100/90">{m.label}</span>
                <span className="text-sm italic text-amber-100/60">{m.note}</span>
              </div>
            );
          })}
        </div>

        <h3 className="font-cinzel mt-8 text-xs tracking-[0.35em] text-amber-200/60">RELICS THAT FALL</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {powers.map((k) => {
            const m = POWER_META[k];
            return (
              <span
                key={k}
                className="font-cinzel rounded-sm border px-2 py-1 text-[10px] tracking-widest"
                style={{ borderColor: m.color, color: m.color, borderStyle: m.bad ? "dashed" : "solid" }}
              >
                {m.glyph} {m.label}
                {m.bad ? " · avoid" : ""}
              </span>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="btn-ember gold-border font-cinzel mt-8 rounded-sm px-6 py-2.5 text-xs"
        >
          RETURN
        </button>
      </div>
    </div>
  );
}
