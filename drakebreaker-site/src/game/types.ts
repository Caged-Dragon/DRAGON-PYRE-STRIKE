export const W = 960;
export const H = 640;

export type BrickKind =
  | "ember"
  | "scale"
  | "crystal"
  | "gold"
  | "magma"
  | "obsidian"
  | "rune"
  | "bone"
  | "frost"
  | "venom";

export type PowerKind =
  | "multi"
  | "wide"
  | "laser"
  | "pierce"
  | "slow"
  | "life"
  | "sticky"
  | "rage"
  | "shrink";

export type OverlayKind =
  | "none"
  | "ready"
  | "playing"
  | "paused"
  | "levelclear"
  | "gameover"
  | "victory";

export type HudState = {
  score: number;
  lives: number;
  level: number;
  levelName: string;
  flavor: string;
  realm: string;
  combo: number;
  rage: number;
  high: number;
  effects: { kind: PowerKind; remaining: number }[];
  speedTier: number;
  boosting: boolean;
  aiming: boolean;
  balls: number;
  muted: boolean;
};

export type OverlayState = {
  kind: OverlayKind;
  title?: string;
  body?: string;
  score?: number;
};

export const EMPTY_HUD: HudState = {
  score: 0,
  lives: 3,
  level: 1,
  levelName: "",
  flavor: "",
  realm: "",
  combo: 0,
  rage: 0,
  high: 0,
  effects: [],
  speedTier: 1,
  boosting: false,
  aiming: true,
  balls: 1,
  muted: false,
};

export const POWER_META: Record<
  PowerKind,
  { label: string; glyph: string; color: string; bad?: boolean }
> = {
  multi: { label: "Hatchlings", glyph: "●●●", color: "#ffb347" },
  wide: { label: "Wyrmscale", glyph: "━", color: "#5eead4" },
  laser: { label: "Fire Breath", glyph: "▲", color: "#fb7185" },
  pierce: { label: "White-Hot", glyph: "✦", color: "#fde68a" },
  slow: { label: "Frost Breath", glyph: "❄", color: "#93c5fd" },
  life: { label: "Dragon Egg", glyph: "♥", color: "#f43f5e" },
  sticky: { label: "Amber Grip", glyph: "◉", color: "#fbbf24" },
  rage: { label: "Dragon Rage", glyph: "☠", color: "#ff4500" },
  shrink: { label: "Wyrm Curse", glyph: "▼", color: "#a3e635", bad: true },
};

export const BRICK_META: Record<
  BrickKind,
  { label: string; color: string; note: string }
> = {
  ember: { label: "Ember", color: "#ea580c", note: "Shatters in one blow." },
  scale: { label: "Scale", color: "#059669", note: "Two blows." },
  crystal: { label: "Crystal", color: "#2563eb", note: "Three blows." },
  gold: { label: "Gold", color: "#d97706", note: "Rich. Often drops relics." },
  magma: { label: "Magma", color: "#e11d48", note: "Detonates its neighbours." },
  rune: { label: "Rune", color: "#7c3aed", note: "Four blows. Old magic." },
  bone: { label: "Bone", color: "#d6d3d1", note: "Brittle. Worth little." },
  frost: { label: "Frost", color: "#22d3ee", note: "Chills the fireball when broken." },
  venom: { label: "Venom", color: "#4d7c0f", note: "May drop a curse. Do not catch it." },
  obsidian: { label: "Obsidian", color: "#52525b", note: "Cannot be broken. Bounce around it." },
};
