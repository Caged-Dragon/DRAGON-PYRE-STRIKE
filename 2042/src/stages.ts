export type Stage = {
  value: number;
  name: string;
  blurb: string;
  /** tile gradient */
  from: string;
  to: string;
  /** accent used for glows / evolution bursts */
  glow: string;
  text: string;
};

/** The egg ➜ dragon evolution path */
export const STAGES: Stage[] = [
  { value: 2, name: "Dragon Egg", blurb: "Warm, speckled and quietly wobbling.", from: "#4a3526", to: "#7a593c", glow: "#f7d9a0", text: "#fff3dc" },
  { value: 4, name: "Cracking Egg", blurb: "Something inside is pushing its way out!", from: "#7a4518", to: "#c47c2e", glow: "#ffb23f", text: "#fff4e0" },
  { value: 8, name: "Hatchling", blurb: "A tiny snout pokes through the shell.", from: "#1f4d25", to: "#3e9147", glow: "#a6f07a", text: "#effff0" },
  { value: 16, name: "Wyrmling", blurb: "Free of its shell and full of curiosity.", from: "#134a4a", to: "#2a9087", glow: "#62f2d2", text: "#eafffb" },
  { value: 32, name: "Whelp", blurb: "Its first little wings flutter with excitement.", from: "#172f6b", to: "#3768cc", glow: "#86b8ff", text: "#eef4ff" },
  { value: 64, name: "Fire Drake", blurb: "Smoke curls from its nose and its tail burns bright.", from: "#6e200f", to: "#d8582a", glow: "#ff9f45", text: "#fff1e6" },
  { value: 128, name: "Frost Dragon", blurb: "Snow follows wherever it flies.", from: "#0f3e66", to: "#43a9dd", glow: "#c4f0ff", text: "#f0fbff" },
  { value: 256, name: "Storm Dragon", blurb: "Lightning crackles across its wings.", from: "#2c1766", to: "#7350dc", glow: "#c1abff", text: "#f6f1ff" },
  { value: 512, name: "Shadow Dragon", blurb: "It slips between darkness and light.", from: "#1a1030", to: "#523486", glow: "#ff55dc", text: "#f3e8ff" },
  { value: 1024, name: "Golden Dragon", blurb: "Its scales gleam like a royal hoard.", from: "#6b4a08", to: "#e3ad30", glow: "#ffe48a", text: "#2b1d00" },
  { value: 2048, name: "Dragon Lord", blurb: "The crowned ruler of all dragonkind.", from: "#5c0a1c", to: "#dc2f4b", glow: "#ff7486", text: "#fff0f3" },
  { value: 4096, name: "Ancient One", blurb: "Older than the stars it sleeps beneath.", from: "#070a24", to: "#4d2595", glow: "#a3f7ff", text: "#f2f0ff" },
];

export function stageFor(v: number): Stage {
  return STAGES.find((s) => s.value === v) ?? STAGES[STAGES.length - 1];
}
