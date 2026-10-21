import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ *
 *  Hand-drawn, animated SVG creatures for every tile.                 *
 *  Egg ➜ Cracking Egg ➜ Hatchling ➜ Wyrmling ➜ Whelp ➜ Drakes ➜ Lord   *
 *  All art lives in a 100×100 viewBox. Animations are CSS (index.css) *
 * ------------------------------------------------------------------ */

type Pal = {
  body: string;
  shade: string;
  belly: string;
  bellyLine: string;
  line: string;
  wing: string;
  wingShade: string;
  horn: string;
  iris: string;
  cheek: string;
};

type Fx = "tailflame" | "smoke" | "snow" | "storm" | "wisps" | "sparkle" | "fireaura" | "rays" | "stars" | "starwings";

type DragonLook = {
  kind: "dragon";
  age: "baby" | "adult";
  pal: Pal;
  wings: "nub" | "small" | "large" | "grand";
  horns: "nub" | "small" | "curved" | "crystal" | "long" | "royal";
  eyes: "cute" | "fierce" | "glow";
  fx: Fx[];
  spikes?: boolean;
  crown?: boolean;
  gem?: boolean;
  halo?: boolean;
  shell?: boolean;
  flap?: number; // seconds per wing beat
};

type Look = { kind: "egg" } | { kind: "crack" } | { kind: "hatch"; pal: Pal } | DragonLook;

const PAL = {
  hatch: { body: "#8bdc5e", shade: "#5fb143", belly: "#dcf8bd", bellyLine: "#a8dc86", line: "#1d3b12", wing: "#5fb143", wingShade: "#3f8a2b", horn: "#fff1cf", iris: "#2a1a10", cheek: "#ff93b2" },
  wyrm: { body: "#4fd3b6", shade: "#2ca58c", belly: "#d4fbef", bellyLine: "#8fd9c5", line: "#0d3a32", wing: "#33b89c", wingShade: "#1f8a73", horn: "#fff1cf", iris: "#1b1020", cheek: "#ff93b2" },
  whelp: { body: "#6ca9ff", shade: "#4a83e2", belly: "#e1edff", bellyLine: "#a9c4f2", line: "#0f234d", wing: "#9cc7ff", wingShade: "#4a83e2", horn: "#fff1cf", iris: "#1b1020", cheek: "#ff9fc0" },
  drake: { body: "#ff8a3d", shade: "#de6229", belly: "#ffe3bf", bellyLine: "#efb684", line: "#471505", wing: "#ffb46b", wingShade: "#d6532a", horn: "#fff1cf", iris: "#ffe14d", cheek: "#ff9fa0" },
  frost: { body: "#a6e3ff", shade: "#6cc3ef", belly: "#f1fbff", bellyLine: "#b3dff4", line: "#0a2c49", wing: "#d9f4ff", wingShade: "#79c8ee", horn: "#eefcff", iris: "#2f8fff", cheek: "#ffb3d0" },
  storm: { body: "#a386ff", shade: "#7a5be6", belly: "#ece6ff", bellyLine: "#c3b5f5", line: "#1c0f49", wing: "#c6b4ff", wingShade: "#6747d4", horn: "#f5f1ff", iris: "#ffe14d", cheek: "#ffa3d6" },
  shadow: { body: "#4a3f70", shade: "#332a52", belly: "#6e62a0", bellyLine: "#54497f", line: "#0a0714", wing: "#5b4d8a", wingShade: "#2a2145", horn: "#231c38", iris: "#ff4fd8", cheek: "#ff4fd8" },
  gold: { body: "#ffd257", shade: "#e3a72a", belly: "#fff3c4", bellyLine: "#efcf7a", line: "#4a2f00", wing: "#ffe48c", wingShade: "#d7981d", horn: "#fffaf0", iris: "#e5361c", cheek: "#ffab8a" },
  lord: { body: "#ff4b5d", shade: "#d32a40", belly: "#ffd8b2", bellyLine: "#efa98a", line: "#3b0510", wing: "#ff7d8a", wingShade: "#a5102a", horn: "#fff1cf", iris: "#ffd23f", cheek: "#ffb0a0" },
  ancient: { body: "#e6e0fd", shade: "#b4a7f4", belly: "#ffffff", bellyLine: "#d2cbf5", line: "#1a1040", wing: "#2b2573", wingShade: "#7d72e8", horn: "#fff7d1", iris: "#6ff7ff", cheek: "#ffc4f0" },
} satisfies Record<string, Pal>;

const LOOKS: Record<number, Look> = {
  2: { kind: "egg" },
  4: { kind: "crack" },
  8: { kind: "hatch", pal: PAL.hatch },
  16: { kind: "dragon", age: "baby", pal: PAL.wyrm, wings: "nub", horns: "nub", eyes: "cute", fx: [], shell: true, flap: 1.4 },
  32: { kind: "dragon", age: "baby", pal: PAL.whelp, wings: "small", horns: "small", eyes: "cute", fx: [], flap: 0.55 },
  64: { kind: "dragon", age: "adult", pal: PAL.drake, wings: "large", horns: "curved", eyes: "fierce", fx: ["tailflame", "smoke"] },
  128: { kind: "dragon", age: "adult", pal: PAL.frost, wings: "large", horns: "crystal", spikes: true, eyes: "fierce", fx: ["snow"] },
  256: { kind: "dragon", age: "adult", pal: PAL.storm, wings: "large", horns: "long", spikes: true, eyes: "fierce", fx: ["storm"] },
  512: { kind: "dragon", age: "adult", pal: PAL.shadow, wings: "grand", horns: "long", spikes: true, eyes: "glow", fx: ["wisps"] },
  1024: { kind: "dragon", age: "adult", pal: PAL.gold, wings: "grand", horns: "royal", gem: true, eyes: "fierce", fx: ["sparkle"] },
  2048: { kind: "dragon", age: "adult", pal: PAL.lord, wings: "grand", horns: "long", crown: true, eyes: "fierce", fx: ["rays", "fireaura", "smoke"] },
  4096: { kind: "dragon", age: "adult", pal: PAL.ancient, wings: "grand", horns: "royal", halo: true, gem: true, eyes: "glow", fx: ["rays", "stars", "starwings"] },
};

/* ---------------------------- helpers ----------------------------- */

/** mirror an absolute-coordinate path across x = 50 */
function m(d: string) {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = parseFloat(n);
    const out = i++ % 2 === 0 ? 100 - v : v;
    return String(+out.toFixed(2));
  });
}

const og = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const dl = (s: number, extra?: CSSProperties): CSSProperties => ({
  animationDelay: `calc(var(--d, 0) * -1s - ${s}s)`,
  ...extra,
});

function flame(x: number, y: number, s: number) {
  const p = (dx: number, dy: number) => `${+(x + dx * s).toFixed(2)} ${+(y + dy * s).toFixed(2)}`;
  return `M${p(0, 0)} C${p(-4.6, -2)} ${p(-5.2, -8)} ${p(-1.4, -14)} C${p(-1, -10)} ${p(1.6, -10)} ${p(1.3, -12.6)} C${p(4.6, -8.6)} ${p(5.2, -2.6)} ${p(0, 0)} Z`;
}

function star4(x: number, y: number, r: number) {
  const q = r * 0.28;
  return `M${x} ${y - r} L${x + q} ${y - q} L${x + r} ${y} L${x + q} ${y + q} L${x} ${y + r} L${x - q} ${y + q} L${x - r} ${y} L${x - q} ${y - q} Z`;
}

function flake(x: number, y: number, r: number) {
  const a = r * 0.5;
  const b = r * 0.866;
  return `M${x - r} ${y} L${x + r} ${y} M${x - a} ${y - b} L${x + a} ${y + b} M${x - a} ${y + b} L${x + a} ${y - b}`;
}

/* ------------------------------ eggs ------------------------------ */

const SHELL = { mid: "#f3dcae", dark: "#cf9f62", speck: "#a56a33", line: "#3d2614" };
const EGG = "M50 14 C66 14 78 40 78 60 C78 77 66 88 50 88 C34 88 22 77 22 60 C22 40 34 14 50 14 Z";
const EGG_SHADE = "M63 21 C73 33 78 47 78 60 C78 77 66 88 50 88 C42 88 35 85 30 80 C45 84 61 79 67 65 C72 53 70 35 63 21 Z";
const SPECKS: [number, number, number][] = [
  [58, 38, 3], [45, 54, 2.4], [63, 62, 3.4], [36, 68, 2], [55, 76, 2.6], [47, 29, 1.7], [67, 48, 1.6], [39, 45, 1.4],
];
const CRACK = "M23 55 L30 49 L36 56 L44 47 L50 55 L57 46 L64 54 L70 48 L77 52 M57 46 L61 39 L58 33";
const NEST_BACK = "M9 80 C20 70 80 70 91 80 C80 85 20 85 9 80 Z";
const NEST_FRONT = "M8 79 C22 89 78 89 92 79 C90 91 75 98 50 98 C25 98 10 91 8 79 Z";
const STRAW = "M16 87 L30 91 M27 93 L43 90 M41 95 L58 92 M55 91 L71 95 M68 90 L84 87";

function Nest({ front }: { front?: boolean }) {
  if (!front) return <path d={NEST_BACK} fill="#3a2312" />;
  return (
    <>
      <path d={NEST_FRONT} fill="#7d5028" stroke={SHELL.line} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={STRAW} stroke="#c58c4c" strokeWidth={1.7} strokeLinecap="round" fill="none" />
    </>
  );
}

function EggArt({ cracked }: { cracked: boolean }) {
  return (
    <>
      {cracked && <circle cx={50} cy={52} r={40} fill="#ffb23f" opacity={0.18} className="cr-glow" />}
      <Nest />
      <g className={cracked ? "cr-shake" : "cr-wobble"} style={og(50, 88)}>
        <path d={EGG} fill={cracked ? "#f5d7a2" : SHELL.mid} />
        <path d={EGG_SHADE} fill={SHELL.dark} opacity={0.55} />
        {SPECKS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={SHELL.speck} opacity={0.75} />
        ))}
        <ellipse cx={39} cy={34} rx={5.5} ry={10} transform="rotate(-22 39 34)" fill="#fff" opacity={0.6} />
        {cracked && (
          <>
            <path d={CRACK} className="cr-glow" stroke="#ffa51f" strokeWidth={8} opacity={0.55} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={CRACK} stroke="#fff6c2" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={CRACK} stroke={SHELL.line} strokeWidth={1} opacity={0.35} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        <path d={EGG} fill="none" stroke={SHELL.line} strokeWidth={2.6} />
        {cracked && (
          <g className="cr-glow" stroke="#ffd36b" strokeWidth={2.2} strokeLinecap="round">
            <path d="M18 56 L9 57 M19 50 L11 45 M82 52 L91 53 M81 46 L89 40 M61 30 L64 22" />
          </g>
        )}
      </g>
      <Nest front />
    </>
  );
}

/* ---------------------------- hatchling ---------------------------- */

const HATCH_HEAD = "M27 50 C25 33 36 23 50 23 C64 23 75 33 73 50 C72 60 62 66 50 66 C38 66 28 60 27 50 Z";
const HATCH_SHADE = "M29 54 C35 62 65 62 71 54 C69 62 61 66 50 66 C39 66 31 62 29 54 Z";
const HATCH_CAP = "M32 31 C33 18 43 11 52 12 C61 13 68 20 67 30 L62 26 L58 32 L53 26 L48 32 L43 26 L38 32 Z";
const HATCH_FIN = "M29 44 L18 39 L21 47 L28 52 Z";
const SHELL_BOTTOM = "M20 62 L27 55 L33 62 L40 55 L46 62 L52 55 L58 62 L64 55 L70 62 L76 55 L80 62 C80 79 67 90 50 90 C33 90 20 79 20 62 Z";
const SHELL_BOTTOM_SHADE = "M79 66 C79 80 67 90 50 90 C40 90 33 86 28 80 C43 85 62 82 70 70 C73 66 76 64 79 66 Z";

function CuteEyes({ y, dx, p }: { y: number; dx: number; p: Pal }) {
  return (
    <>
      {[-1, 1].map((s) => {
        const x = 50 + s * dx;
        return (
          <g key={s} className="cr-blink" style={dl(0)}>
            <ellipse cx={x} cy={y} rx={6.3} ry={7.3} fill="#fff" stroke={p.line} strokeWidth={1.6} />
            <ellipse cx={x} cy={y + 0.9} rx={4.1} ry={5.1} fill={p.iris} />
            <circle cx={x + 1.6} cy={y - 1.6} r={1.8} fill="#fff" />
            <circle cx={x - 1.4} cy={y + 3.2} r={0.9} fill="#fff" opacity={0.9} />
          </g>
        );
      })}
    </>
  );
}

function HatchArt({ p }: { p: Pal }) {
  return (
    <>
      <g className="cr-peek" style={dl(0)}>
        <path d={HATCH_FIN} fill={p.shade} stroke={p.line} strokeWidth={2} strokeLinejoin="round" />
        <path d={m(HATCH_FIN)} fill={p.shade} stroke={p.line} strokeWidth={2} strokeLinejoin="round" />
        <path d={HATCH_HEAD} fill={p.body} stroke={p.line} strokeWidth={2.6} />
        <path d={HATCH_SHADE} fill={p.shade} opacity={0.5} />
        <ellipse cx={50} cy={55.5} rx={12} ry={7} fill={p.belly} />
        <ellipse cx={46} cy={54} rx={1.6} ry={1.1} fill={p.line} />
        <ellipse cx={54} cy={54} rx={1.6} ry={1.1} fill={p.line} />
        <path d="M46 59.5 Q50 62.5 54 59.5" stroke={p.line} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <CuteEyes y={43.5} dx={9.5} p={p} />
        <ellipse cx={33} cy={53} rx={3.6} ry={2.2} fill={p.cheek} opacity={0.6} />
        <ellipse cx={67} cy={53} rx={3.6} ry={2.2} fill={p.cheek} opacity={0.6} />
        <g transform="rotate(-14 50 22)">
          <path d={HATCH_CAP} fill={SHELL.mid} stroke={SHELL.line} strokeWidth={2.2} strokeLinejoin="round" />
          <circle cx={46} cy={19} r={1.8} fill={SHELL.speck} opacity={0.7} />
          <circle cx={57} cy={17} r={1.3} fill={SHELL.speck} opacity={0.7} />
          <ellipse cx={42} cy={20} rx={2} ry={3.5} transform="rotate(-30 42 20)" fill="#fff" opacity={0.55} />
        </g>
      </g>
      <path d={SHELL_BOTTOM} fill={SHELL.mid} />
      <path d={SHELL_BOTTOM_SHADE} fill={SHELL.dark} opacity={0.55} />
      <circle cx={36} cy={72} r={2.2} fill={SHELL.speck} opacity={0.75} />
      <circle cx={57} cy={80} r={2.8} fill={SHELL.speck} opacity={0.75} />
      <circle cx={66} cy={68} r={1.8} fill={SHELL.speck} opacity={0.75} />
      <path d={SHELL_BOTTOM} fill="none" stroke={SHELL.line} strokeWidth={2.6} strokeLinejoin="round" />
      <ellipse cx={33} cy={58.5} rx={5} ry={3.8} fill={p.body} stroke={p.line} strokeWidth={2} />
      <ellipse cx={67} cy={58.5} rx={5} ry={3.8} fill={p.body} stroke={p.line} strokeWidth={2} />
    </>
  );
}

/* ----------------------------- dragons ----------------------------- */

const BABY = {
  head: "M26 40 C25 25 36 17 50 17 C64 17 75 25 74 40 C73 52 63 58 50 58 C37 58 27 52 26 40 Z",
  headShade: "M28 46 C34 54 66 54 72 46 C70 54 62 58 50 58 C38 58 30 54 28 46 Z",
  body: "M35 75 C35 63 42 57 50 57 C58 57 65 63 65 75 C65 86 59 91 50 91 C41 91 35 86 35 75 Z",
  bodyShade: "M36 80 C40 88 60 88 64 80 C62 88 57 91 50 91 C43 91 38 88 36 80 Z",
  belly: [50, 76, 9.5, 11.5],
  bellyLines: "M43 70 Q50 72 57 70 M41.5 76 Q50 78 58.5 76 M43 82 Q50 84 57 82",
  arm: [37.5, 72, 3.6, 5.6, 25],
  foot: [41, 90, 7, 4.2],
  tail: "M60 85 C71 92 84 89 86 79 C87 72 83 67 78 67",
  tailTip: "M79 61.5 L69.5 67 L79 72.5 L76.5 67 Z",
  tailOrigin: [60, 85],
  tailW: [10, 6.5],
  fin: "M28 34 L15 28 L19 37 L14 44 L28 43 Z",
  snout: [50, 47, 13, 8.5],
  nostrils: [46, 54, 45.5],
  mouth: "M45 51 Q50 54.5 55 51",
  eyeY: 35,
  eyeDx: 10,
};

const ADULT = {
  head: "M31 36 C30 23 39 15 50 15 C61 15 70 23 69 36 C68 46 60 52 50 52 C40 52 32 46 31 36 Z",
  headShade: "M33 41 C38 49 62 49 67 41 C65 48 58 52 50 52 C42 52 35 48 33 41 Z",
  body: "M33 77 C32 63 40 53 50 53 C60 53 68 63 67 77 C66 87 59 92 50 92 C41 92 34 87 33 77 Z",
  bodyShade: "M35 82 C40 90 60 90 65 82 C63 89 57 92 50 92 C43 92 37 89 35 82 Z",
  belly: [50, 75, 10.5, 14],
  bellyLines: "M41.5 67 Q50 69 58.5 67 M39.8 73 Q50 75 60.2 73 M40 79 Q50 81 60 79 M42.8 85 Q50 87 57.2 85",
  arm: [36.5, 72, 3.8, 6, 20],
  foot: [40, 91, 7.5, 4.3],
  tail: "M61 86 C74 93 88 87 88 74 C88 66 84 60 78 58",
  tailTip: "M80.5 52 L70 55 L77 63.5 L77.5 58 Z",
  tailOrigin: [61, 86],
  tailW: [11, 7.5],
  fin: "M33 29 L19 22 L23 31 L17 38 L33 38 Z",
  snout: [50, 44, 11.5, 7.5],
  nostrils: [46.5, 53.5, 42],
  mouth: "M44.5 48 Q50 50.5 55.5 48",
  eyeY: 31,
  eyeDx: 8.5,
};

const WINGS = {
  nub: { d: "M39 62 C36 57 32 55 27 56 C29 58 29 61 28 63 C31 63 33 64 34 67 C36 65 38 65 39 66 Z", bones: "", sx: 39, sy: 63, amp: 1 },
  small: { d: "M40 63 C34 53 26 47 14 46 C17 51 17 56 14 60 C20 60 22 62 23 67 C27 64 31 65 33 70 C35 67 38 66 40 68 Z", bones: "M39 64 L15.5 59.5 M39 65 L23.5 66.5", sx: 39, sy: 64, amp: 1 },
  large: { d: "M38 58 C31 41 20 27 6 21 C10 30 10 38 7 46 C14 45 17 48 18 54 C23 52 27 54 28 60 C32 58 35 59 37 63 Z", bones: "M37 59 L8.5 45.5 M37 60 L18.5 53.5 M37 61 L28.5 59.5", sx: 37, sy: 60, amp: 0.6 },
  grand: { d: "M38 57 C30 37 17 21 2 14 C6 24 6 33 3 42 C10 41 14 44 14 51 C19 49 23 51 24 57 C28 55 32 56 35 62 Z", bones: "M37 58 L4.5 41.5 M37 59 L14.5 50.5 M37 60 L24.5 56.5", sx: 37, sy: 59, amp: 0.5 },
};

const HORNS = {
  nub: "M39 21 Q37 15 39 11 Q43 15 45 19 Z",
  small: "M38 22 Q34 13 35 7 Q42 12 45 19 Z",
  curved: "M40 20 C37 12 32 7 25 6 C30 10 33 16 35 23 Z",
  crystal: "M41 20 L37 2 L34 12 L27 6 L34 24 Z",
  long: "M40 19 C36 9 28 3 17 2 C24 7 29 14 34 23 Z",
  royal: "M40 19 C35 8 27 3 16 3 C22 7 25 10 26 13 C23 12 20 13 18 15 C24 16 30 19 34 23 Z",
};

function FierceEyes({ y, dx, p, glow }: { y: number; dx: number; p: Pal; glow?: boolean }) {
  return (
    <>
      {[-1, 1].map((s) => {
        const cx = 50 + s * dx;
        const lx = 50 - dx; // shapes are authored for the left eye, then mirrored
        const w = 6;
        const left = `M${lx - w} ${y - 1} Q${lx} ${y - 6.5} ${lx + w} ${y + 1} Q${lx} ${y + 5} ${lx - w} ${y - 1} Z`;
        const brow = `M${lx - w - 1} ${y - 6.5} Q${lx} ${y - 7.5} ${lx + w + 0.5} ${y - 3.5}`;
        const eye = s < 0 ? left : m(left);
        const br = s < 0 ? brow : m(brow);
        return (
          <g key={s}>
            {glow && <circle cx={cx} cy={y} r={7.5} fill={p.iris} opacity={0.45} className="cr-pulse" style={dl(0)} />}
            <g className="cr-blink" style={dl(0.2)}>
              <path d={eye} fill={p.iris} stroke={p.line} strokeWidth={1.5} strokeLinejoin="round" />
              <ellipse cx={cx + s * -0.4} cy={y} rx={1.3} ry={3.3} fill={glow ? "#fff" : "#160b10"} />
              {!glow && <circle cx={cx + 1.8} cy={y - 1.7} r={0.95} fill="#fff" />}
            </g>
            <path d={br} stroke={p.line} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
    </>
  );
}

function Flame({ x, y, s, delay = 0 }: { x: number; y: number; s: number; delay?: number }) {
  return (
    <g className="cr-flicker" style={dl(delay)}>
      <path d={flame(x, y, s)} fill="#ff6a1a" />
      <path d={flame(x, y - 0.5 * s, s * 0.62)} fill="#ffd23f" />
    </g>
  );
}

function Rays({ color }: { color: string }) {
  const d = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const w = (6 * Math.PI) / 180;
    const R = 76;
    const x1 = 50 + R * Math.cos(a - w);
    const y1 = 50 + R * Math.sin(a - w);
    const x2 = 50 + R * Math.cos(a + w);
    const y2 = 50 + R * Math.sin(a + w);
    return `M50 50 L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
  }).join(" ");
  return <path d={d} fill={color} opacity={0.16} className="cr-spin" style={og(50, 50)} />;
}

function DragonArt({ L }: { L: DragonLook }) {
  const p = L.pal;
  const A = L.age === "adult" ? ADULT : BABY;
  const W = WINGS[L.wings];
  const lw = 2.4;
  const has = (f: Fx) => L.fx.includes(f);
  const flap = L.flap ?? 1.6;
  const [bx, by, brx, bry] = A.belly;
  const [ax, ay, arx, ary, arot] = A.arm;
  const [fx, fy, frx, fry] = A.foot;
  const [sx, sy, srx, sry] = A.snout;
  const [n1, n2, ny] = A.nostrils;

  const wingStars: ReactNode =
    has("starwings") &&
    [
      [12, 30, 0.9], [18, 38, 0.7], [9, 36, 0.6], [22, 46, 0.9], [14, 46, 0.6], [27, 52, 0.7], [20, 28, 0.6],
    ].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.9} />);

  return (
    <>
      {/* ---------- background effects ---------- */}
      {has("rays") && <Rays color={L.halo ? "#bdf8ff" : "#ffe08a"} />}
      {has("fireaura") && (
        <>
          <circle cx={50} cy={56} r={44} fill="#ff6a1a" opacity={0.18} className="cr-pulse" style={dl(0)} />
          <Flame x={9} y={97} s={1.7} delay={0} />
          <Flame x={21} y={100} s={2.1} delay={0.2} />
          <Flame x={79} y={100} s={2.1} delay={0.1} />
          <Flame x={91} y={97} s={1.7} delay={0.3} />
        </>
      )}
      {has("wisps") && <circle cx={50} cy={54} r={44} fill="#b25cff" opacity={0.22} className="cr-pulse" style={dl(0)} />}
      {has("wisps") &&
        [
          [22, 74, 6, 0], [78, 72, 6, 0.8], [28, 46, 4.5, 1.5], [72, 44, 4.5, 2.2], [50, 12, 4, 1.1],
        ].map(([x, y, r, d], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#a35cff" opacity={0.4} className="cr-wisp" style={dl(d)} />
        ))}
      {L.halo && <circle cx={50} cy={50} r={46} fill="#8ff3ff" opacity={0.12} className="cr-pulse" style={dl(0)} />}

      <g className="cr-breathe" style={dl(0, og(50, 92))}>
        {/* ---------- wings ---------- */}
        <g className="cr-flapL" style={dl(0, { ...og(W.sx, W.sy), animationDuration: `${flap}s`, ["--amp" as string]: W.amp })}>
          <path d={W.d} fill={p.wing} stroke={p.line} strokeWidth={lw} strokeLinejoin="round" />
          {W.bones && <path d={W.bones} stroke={p.wingShade} strokeWidth={1.3} strokeLinecap="round" fill="none" />}
          {wingStars}
        </g>
        <g className="cr-flapR" style={dl(0, { ...og(100 - W.sx, W.sy), animationDuration: `${flap}s`, ["--amp" as string]: W.amp })}>
          <path d={m(W.d)} fill={p.wing} stroke={p.line} strokeWidth={lw} strokeLinejoin="round" />
          {W.bones && <path d={m(W.bones)} stroke={p.wingShade} strokeWidth={1.3} strokeLinecap="round" fill="none" />}
          {has("starwings") &&
            [
              [12, 30, 0.9], [18, 38, 0.7], [9, 36, 0.6], [22, 46, 0.9], [14, 46, 0.6], [27, 52, 0.7], [20, 28, 0.6],
            ].map(([x, y, r], i) => <circle key={i} cx={100 - x} cy={y} r={r} fill="#fff" opacity={0.9} />)}
        </g>

        {/* ---------- tail ---------- */}
        <g className="cr-wag" style={dl(0, og(A.tailOrigin[0], A.tailOrigin[1]))}>
          <path d={A.tail} stroke={p.line} strokeWidth={A.tailW[0]} fill="none" strokeLinecap="round" />
          <path d={A.tail} stroke={p.body} strokeWidth={A.tailW[1]} fill="none" strokeLinecap="round" />
          {has("tailflame") ? (
            <Flame x={78} y={61} s={1.45} />
          ) : (
            <path d={A.tailTip} fill={p.shade} stroke={p.line} strokeWidth={2} strokeLinejoin="round" />
          )}
        </g>

        {/* ---------- body ---------- */}
        <path d={A.body} fill={p.body} stroke={p.line} strokeWidth={lw} />
        <path d={A.bodyShade} fill={p.shade} opacity={0.5} />
        <ellipse cx={bx} cy={by} rx={brx} ry={bry} fill={p.belly} />
        <path d={A.bellyLines} stroke={p.bellyLine} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <ellipse cx={ax} cy={ay} rx={arx} ry={ary} transform={`rotate(${arot} ${ax} ${ay})`} fill={p.body} stroke={p.line} strokeWidth={2} />
        <ellipse cx={100 - ax} cy={ay} rx={arx} ry={ary} transform={`rotate(${-arot} ${100 - ax} ${ay})`} fill={p.body} stroke={p.line} strokeWidth={2} />
        <ellipse cx={fx} cy={fy} rx={frx} ry={fry} fill={p.body} stroke={p.line} strokeWidth={2} />
        <ellipse cx={100 - fx} cy={fy} rx={frx} ry={fry} fill={p.body} stroke={p.line} strokeWidth={2} />
        {L.age === "adult" &&
          [-4, 0, 4].map((o) => (
            <g key={o}>
              <path d={`M${fx + o - 1.2} ${fy + 2.6} L${fx + o} ${fy + 5.4} L${fx + o + 1.2} ${fy + 2.6} Z`} fill="#fff" />
              <path d={`M${100 - fx + o - 1.2} ${fy + 2.6} L${100 - fx + o} ${fy + 5.4} L${100 - fx + o + 1.2} ${fy + 2.6} Z`} fill="#fff" />
            </g>
          ))}

        {/* ---------- head ---------- */}
        <path d={A.fin} fill={p.shade} stroke={p.line} strokeWidth={2} strokeLinejoin="round" />
        <path d={m(A.fin)} fill={p.shade} stroke={p.line} strokeWidth={2} strokeLinejoin="round" />
        <path d={HORNS[L.horns]} fill={p.horn} stroke={p.line} strokeWidth={2} strokeLinejoin="round" />
        <path d={m(HORNS[L.horns])} fill={p.horn} stroke={p.line} strokeWidth={2} strokeLinejoin="round" />
        {L.horns === "crystal" && (
          <path d="M38.5 19 L36.8 7 M61.5 19 L63.2 7" stroke="#ffffff" strokeWidth={1.2} strokeLinecap="round" opacity={0.9} />
        )}
        {L.spikes && (
          <path d="M44.5 17 L47 9.5 L49.5 16 M50.5 16 L53 9.5 L55.5 17" fill={p.shade} stroke={p.line} strokeWidth={1.8} strokeLinejoin="round" />
        )}
        <path d={A.head} fill={p.body} stroke={p.line} strokeWidth={lw} />
        <path d={A.headShade} fill={p.shade} opacity={0.45} />
        <ellipse cx={sx} cy={sy} rx={srx} ry={sry} fill={p.belly} />
        <ellipse cx={n1} cy={ny} rx={1.7} ry={1.15} fill={p.line} />
        <ellipse cx={n2} cy={ny} rx={1.7} ry={1.15} fill={p.line} />
        <path d={A.mouth} stroke={p.line} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        {L.age === "adult" && (
          <>
            <path d="M46.6 48.7 L47.4 51.4 L48.5 49.2 Z" fill="#fff" />
            <path d="M53.4 48.7 L52.6 51.4 L51.5 49.2 Z" fill="#fff" />
          </>
        )}
        {L.eyes === "cute" ? (
          <>
            <CuteEyes y={A.eyeY} dx={A.eyeDx} p={p} />
            <ellipse cx={32} cy={45} rx={4} ry={2.4} fill={p.cheek} opacity={0.55} />
            <ellipse cx={68} cy={45} rx={4} ry={2.4} fill={p.cheek} opacity={0.55} />
          </>
        ) : (
          <FierceEyes y={A.eyeY} dx={A.eyeDx} p={p} glow={L.eyes === "glow"} />
        )}
        {L.gem && (
          <>
            <path d="M50 18.5 L53.2 23 L50 27.5 L46.8 23 Z" fill={L.halo ? "#6ff7ff" : "#ff3b5c"} stroke={p.line} strokeWidth={1.2} strokeLinejoin="round" />
            <path d="M50 20 L51.6 22.6 L50 23.4 Z" fill="#fff" opacity={0.8} />
          </>
        )}
        {L.crown && (
          <g>
            <path d="M37.5 18.5 L35.5 6 L43.5 11.5 L50 2.5 L56.5 11.5 L64.5 6 L62.5 18.5 Z" fill="#ffd23f" stroke={p.line} strokeWidth={1.8} strokeLinejoin="round" />
            <path d="M38 15 L62 15" stroke="#e09a00" strokeWidth={2} />
            <circle cx={50} cy={10.5} r={1.9} fill="#ff2d55" stroke={p.line} strokeWidth={0.8} />
            <circle cx={43.5} cy={15.8} r={1.3} fill="#3bc7ff" />
            <circle cx={56.5} cy={15.8} r={1.3} fill="#5bff8a" />
            <circle cx={35.5} cy={6} r={1.5} fill="#fff4a8" />
            <circle cx={50} cy={2.5} r={1.5} fill="#fff4a8" />
            <circle cx={64.5} cy={6} r={1.5} fill="#fff4a8" />
          </g>
        )}
        {L.shell && (
          <g>
            <path d="M12 93 C12 86 16 82 21 82 L23 86 L26 83 L29 87 L32 84 C34 86 35 89 35 93 Z" fill={SHELL.mid} stroke={SHELL.line} strokeWidth={1.8} strokeLinejoin="round" />
            <circle cx={20} cy={89} r={1.4} fill={SHELL.speck} opacity={0.75} />
          </g>
        )}
        {has("smoke") && (
          <>
            <circle cx={n1} cy={ny - 1} r={2.4} fill="#efe6dc" className="cr-puffL" style={dl(0)} />
            <circle cx={n2} cy={ny - 1} r={2.4} fill="#efe6dc" className="cr-puffR" style={dl(1.1)} />
          </>
        )}
      </g>

      {/* ---------- foreground effects ---------- */}
      {L.halo && (
        <g className="cr-halo" style={dl(0)}>
          <ellipse cx={50} cy={7} rx={15} ry={3.6} fill="none" stroke="#fff3a8" strokeWidth={5} opacity={0.3} />
          <ellipse cx={50} cy={7} rx={15} ry={3.6} fill="none" stroke="#fff3a8" strokeWidth={2.2} />
        </g>
      )}
      {has("snow") &&
        [
          [12, 8, 0], [30, 3, 0.6], [70, 4, 1.2], [88, 9, 1.8], [8, 40, 2.3], [92, 36, 2.8],
        ].map(([x, y, d], i) => (
          <path key={i} d={flake(x, y, 2.8)} stroke="#ffffff" strokeWidth={1.3} strokeLinecap="round" className="cr-snow" style={dl(d)} />
        ))}
      {has("storm") && (
        <>
          {[0, 1].map((k) => {
            const bolt = "M17 3 L10 17 L16 17 L9 31";
            const d = k ? m(bolt) : bolt;
            return (
              <g key={k} className="cr-bolt" style={dl(k * 1.3)}>
                <path d={d} stroke="#ffe14d" strokeWidth={5.5} opacity={0.35} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <path d={d} stroke="#fffbd6" strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}
          {[
            [24, 70, 0.4], [76, 66, 1.6], [50, 6, 0.9],
          ].map(([x, y, d], i) => (
            <path key={i} d={star4(x, y, 3)} fill="#fff6a8" className="cr-twinkle" style={dl(d)} />
          ))}
        </>
      )}
      {has("sparkle") &&
        [
          [11, 13, 5, 0], [89, 17, 4, 0.7], [14, 62, 3.5, 1.3], [87, 60, 4.5, 0.4], [50, 4, 3, 1.0],
        ].map(([x, y, r, d], i) => <path key={i} d={star4(x, y, r)} fill="#fff7c2" className="cr-twinkle" style={dl(d)} />)}
      {has("stars") &&
        [
          [8, 8, 3.5, 0], [92, 12, 3, 0.8], [6, 66, 2.5, 1.4], [94, 64, 3, 0.4], [30, 4, 2, 1.1], [70, 3, 2.2, 1.7],
        ].map(([x, y, r, d], i) => <path key={i} d={star4(x, y, r)} fill="#ffffff" className="cr-twinkle" style={dl(d)} />)}
    </>
  );
}

/* ------------------------------ public ----------------------------- */

export default function Creature({
  value,
  seed = 0,
  still = false,
  className = "",
  style,
}: {
  value: number;
  seed?: number;
  still?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const look = LOOKS[value] ?? LOOKS[4096];
  const offset = ((seed * 0.618) % 1) * 3;
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`cr ${still ? "cr-still" : ""} ${className}`}
      style={{ ["--d" as string]: offset.toFixed(2), ...style }}
    >
      {look.kind === "egg" && <EggArt cracked={false} />}
      {look.kind === "crack" && <EggArt cracked />}
      {look.kind === "hatch" && <HatchArt p={look.pal} />}
      {look.kind === "dragon" && <DragonArt L={look} />}
    </svg>
  );
}
