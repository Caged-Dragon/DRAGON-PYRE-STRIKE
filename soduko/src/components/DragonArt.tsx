import { useMemo } from "react";
import { cn } from "../utils/cn";
import type { Difficulty } from "../lib/sudoku";

/* ---------------- Brand Emblems ---------------- */
export function ClassicGridEmblem({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="6"
        fill="#eff6ff"
        stroke="#2563eb"
        strokeWidth="2"
      />
      <path
        d="M11.66 4v24M20.33 4v24M4 11.66h24M4 20.33h24"
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeOpacity="0.65"
      />
      <rect x="12.5" y="12.5" width="7" height="7" rx="1.5" fill="#2563eb" />
    </svg>
  );
}

export function DragonCrestEmblem({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="crestGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Horns & Crown */}
      <path
        d="M8 5L13 13L18 7L23 13L28 5L26 16C26 22.5 22.5 27.5 18 31C13.5 27.5 10 22.5 10 16L8 5Z"
        fill="url(#crestGold)"
      />
      {/* Inner brow & snout carve */}
      <path
        d="M18 11L15 17H21L18 11ZM13.2 19.5L16.5 21.5L13.8 23.2L13.2 19.5ZM22.8 19.5L19.5 21.5L22.2 23.2L22.8 19.5Z"
        fill="#1c0907"
      />
      {/* Glowing eyes */}
      <circle cx="14.6" cy="20.8" r="1.15" fill="#fffbeb" />
      <circle cx="21.4" cy="20.8" r="1.15" fill="#fffbeb" />
    </svg>
  );
}

/* ---------------- Difficulty Vector Emblems ---------------- */
export function DifficultyEmblem({
  difficulty,
  isDragon,
  className = "h-8 w-8",
}: {
  difficulty: Difficulty;
  isDragon: boolean;
  className?: string;
}) {
  if (!isDragon) {
    const colorMap: Record<Difficulty, { main: string; soft: string }> = {
      easy: { main: "#10b981", soft: "#d1fae5" },
      medium: { main: "#2563eb", soft: "#dbeafe" },
      hard: { main: "#f59e0b", soft: "#fef3c7" },
      expert: { main: "#e11d48", soft: "#ffe4e6" },
    };
    const { main, soft } = colorMap[difficulty];
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <rect x="3" y="3" width="30" height="30" rx="9" fill={soft} />
        {difficulty === "easy" && (
          <path d="M18 10L25 18L18 26L11 18L18 10Z" fill={main} />
        )}
        {difficulty === "medium" && (
          <>
            <path d="M14.5 11L21 18L14.5 25L8 18L14.5 11Z" fill={main} opacity="0.55" />
            <path d="M21.5 11L28 18L21.5 25L15 18L21.5 11Z" fill={main} />
          </>
        )}
        {difficulty === "hard" && (
          <>
            <polygon points="18,8 27,24 9,24" fill={main} opacity="0.28" />
            <polygon points="18,12 24.5,24 11.5,24" fill={main} />
          </>
        )}
        {difficulty === "expert" && (
          <path
            d="M18 8L20.9 15.1L28 18L20.9 20.9L18 28L15.1 20.9L8 18L15.1 15.1L18 8Z"
            fill={main}
          />
        )}
      </svg>
    );
  }

  // Dragon themed crests
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`dg-${difficulty}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="52%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="#1b0907"
        stroke="rgba(245,158,11,0.45)"
        strokeWidth="1.4"
      />
      {difficulty === "easy" && (
        /* Hatchling: Dragon egg with glowing ember crack */
        <>
          <path
            d="M20 8C14.5 8 11 14.5 11 21.5C11 27.3 15 31 20 31C25 31 29 27.3 29 21.5C29 14.5 25.5 8 20 8Z"
            fill={`url(#dg-${difficulty})`}
          />
          <path
            d="M15 19L18.5 22L21.5 18L25 21"
            stroke="#1b0907"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {difficulty === "medium" && (
        /* Wyrmling: Coiled serpent crest */
        <path
          d="M25 11C18 10 12 14 12 20C12 26 17.5 30 23.5 28.5C27.5 27.5 29 23.5 26 21C23.5 19 19 20 18.5 23C16.5 21.5 16.5 17 20.5 15.5L23 17.5L28 13L25 11Z"
          fill={`url(#dg-${difficulty})`}
        />
      )}
      {difficulty === "hard" && (
        /* Fire Drake: Spread dragon wings & flame */
        <path
          d="M20 9C17.5 12.5 17 15.5 18.5 18C14.5 14 10.5 13 7.5 15C10.5 17.5 12 21 12.5 25.5C15 23.5 17.5 23.5 20 29C22.5 23.5 25 23.5 27.5 25.5C28 21 29.5 17.5 32.5 15C29.5 13 25.5 14 21.5 18C23 15.5 22.5 12.5 20 9Z"
          fill={`url(#dg-${difficulty})`}
        />
      )}
      {difficulty === "expert" && (
        /* Elder Wyrm: Horned Dragon Crown & Fangs */
        <>
          <path
            d="M9 10L14 17L20 9L26 17L31 10L28.5 22C28.5 26.5 24.5 30 20 32C15.5 30 11.5 26.5 11.5 22L9 10Z"
            fill={`url(#dg-${difficulty})`}
          />
          <circle cx="16.5" cy="21.5" r="1.4" fill="#1b0907" />
          <circle cx="23.5" cy="21.5" r="1.4" fill="#1b0907" />
        </>
      )}
    </svg>
  );
}

/* ---------------- Subtle Dragon Crest Behind Cell Numerals ---------------- */
export function DragonDigitFiligree({ isGiven }: { isGiven: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-[10%] h-[80%] w-[80%] opacity-25"
    >
      <path
        d="M20 4L24 9H16L20 4ZM20 36L24 31H16L20 36ZM6 20L10 16V24L6 20ZM34 20L30 16V24L34 20Z"
        fill={isGiven ? "#f59e0b" : "#fb923c"}
      />
    </svg>
  );
}

/* ---------------- Flying Dragon Silhouette ---------------- */
export function FlyingDragon({
  className,
  scale = 1,
}: {
  className?: string;
  scale?: number;
}) {
  return (
    <svg
      viewBox="0 0 200 90"
      className={className}
      style={{ width: 200 * scale, height: 90 * scale }}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dragBodyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="55%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#1c0a0a" />
        </linearGradient>
      </defs>
      <path
        d="M12 58c18-4 30-10 44-16 12-5 24-8 36-8 10 0 18 2 25 6 6 3 12 5 18 5 8 0 14-3 20-8-4 10-13 16-24 17-7 1-13 0-19-2-6-2-12-4-19-4-11 0-21 4-31 9-13 6-28 11-50 1z"
        fill="url(#dragBodyGrad)"
      />
      <path
        d="M150 42c7-1 13-4 18-9 2 4 1 9-2 12 5 0 9-2 12-5-1 6-6 11-12 13-5 1-11 0-16-3z"
        fill="#7c2d12"
      />
      <path d="M160 33l10-9-2 10z" fill="#d97706" />
      <circle cx="158" cy="40" r="1.8" fill="#fef08a" />
      <g className="anim-wing">
        <path
          d="M92 34C78 10 56 2 34 6c16 4 28 14 36 28-14-6-28-6-40 0 14-2 28 2 40 12 6 5 14 7 22 5z"
          fill="#7c2d12"
          opacity="0.92"
        />
        <path
          d="M104 36c6-18 20-28 38-30-12 6-20 16-24 30 10-6 20-8 30-6-10 2-20 8-28 16-5 5-11 7-16 6z"
          fill="#9a3412"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

/* ---------------- Board Center Dragon Sigil Watermark ---------------- */
export function DragonHeadWatermark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" aria-hidden="true">
      <circle
        cx="200"
        cy="200"
        r="166"
        stroke="#f59e0b"
        strokeOpacity="0.22"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      <circle
        cx="200"
        cy="200"
        r="142"
        stroke="#f59e0b"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <path
        d="M200 72L152 134L96 84L118 168C118 232 154 282 200 320C246 282 282 232 282 168L304 84L248 134L200 72Z"
        stroke="#fbbf24"
        strokeOpacity="0.28"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M148 196L182 214L154 228Z"
        fill="#f59e0b"
        fillOpacity="0.32"
      />
      <path
        d="M252 196L218 214L246 228Z"
        fill="#f59e0b"
        fillOpacity="0.32"
      />
    </svg>
  );
}

/* ---------------- Forged Gilded Corner Clasp ---------------- */
export function ClawCorner({
  className,
  flipX,
  flipY,
}: {
  className?: string;
  flipX?: boolean;
  flipY?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{
        transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
      }}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 44C4 20 20 4 44 4L36 14C22 16 16 22 14 36L4 44Z"
        fill="#b45309"
        stroke="#fcd34d"
        strokeWidth="1.5"
      />
      <circle cx="14" cy="14" r="4" fill="#fbbf24" />
      <circle cx="14" cy="14" r="1.8" fill="#fffbeb" />
    </svg>
  );
}

/* ---------------- Atmospheric Dragon Cave Backdrop ---------------- */
export function DragonCave() {
  const embers = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: ((i * 37) % 96) + 2,
        size: 2 + ((i * 7) % 4),
        delay: (i * 1.3) % 14,
        duration: 13 + ((i * 5) % 12),
        drift: ((i % 7) - 3) * 32,
        hue: i % 2 === 0 ? "#fb923c" : "#fbbf24",
      })),
    []
  );

  const stalactites = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: i * 7.5 + 2,
        h: 8 + ((i * 13) % 14),
        w: 3.2 + ((i * 3) % 3),
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Deep basalt cavern radial base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,#57190a_0%,#240907_40%,#110505_72%,#080303_100%)]" />

      {/* Molten magma glow along cave floor */}
      <div className="absolute inset-x-0 bottom-0 h-60">
        <div className="anim-lava absolute inset-x-[-8%] bottom-[-110px] h-64 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.52)_0%,rgba(185,28,28,0.28)_42%,transparent_72%)] blur-2xl" />
      </div>

      {/* Cave ceiling arch & stalactites */}
      <svg
        className="absolute inset-x-0 top-0 h-[22vh] w-full opacity-90"
        viewBox="0 0 100 26"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="caveTopGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#070202" />
            <stop offset="100%" stopColor="#120505" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100" height="26" fill="url(#caveTopGrad)" />
        {stalactites.map((s) => (
          <polygon
            key={s.id}
            points={`${s.x - s.w / 2},0 ${s.x + s.w / 2},0 ${s.x},${s.h}`}
            fill="#0b0303"
          />
        ))}
      </svg>

      {/* Distant jagged cavern ridge & magma veins on floor */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[16vh] w-full"
        viewBox="0 0 120 24"
        preserveAspectRatio="none"
      >
        <path
          d="M0 24L0 15L14 10L29 16L46 9L64 15L83 8L102 14L120 9L120 24Z"
          fill="#0c0303"
        />
        <path
          d="M16 22Q28 17 41 22M74 22Q88 16 103 21"
          stroke="#ea580c"
          strokeOpacity="0.35"
          strokeWidth="0.6"
          fill="none"
        />
      </svg>

      {/* Gliding wyvern high in the cavern */}
      <div className="anim-dragon-fly absolute top-[10%]">
        <FlyingDragon scale={0.78} />
      </div>

      {/* Slumbering dragon eyes watching softly from cavern alcove */}
      <div className="anim-eye-blink hidden xl:flex fixed right-[5%] bottom-[14%] gap-5 opacity-65">
        <span className="h-2 w-6 -rotate-6 rounded-full bg-amber-400 shadow-[0_0_16px_4px_rgba(251,191,36,0.5)]" />
        <span className="h-2 w-6 rotate-6 rounded-full bg-amber-400 shadow-[0_0_16px_4px_rgba(251,191,36,0.5)]" />
      </div>

      {/* Rising golden embers */}
      {embers.map((e) => (
        <span
          key={e.id}
          className="anim-ember absolute bottom-[-12px] rounded-full"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            background: e.hue,
            boxShadow: `0 0 ${e.size * 2.5}px ${e.hue}`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            ["--drift" as string]: `${e.drift}px`,
          }}
        />
      ))}

      {/* Subtle edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.62)_100%)]" />
    </div>
  );
}

/* ---------------- Elder Rune Ring ---------------- */
export function RuneRing({ className }: { className?: string }) {
  const runes = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ".split("");
  return (
    <div className={cn("anim-rune", className)} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="#f59e0b"
          strokeOpacity="0.24"
          strokeWidth="1"
        />
        <circle
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke="#f59e0b"
          strokeOpacity="0.16"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        {runes.map((r, i) => {
          const a = (i / runes.length) * Math.PI * 2;
          return (
            <text
              key={i}
              x={100 + Math.cos(a) * 81.5}
              y={100 + Math.sin(a) * 81.5}
              fill="#fbbf24"
              fillOpacity="0.34"
              fontSize="9.5"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {r}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
