export type DragonId =
  | "ember"
  | "frost"
  | "storm"
  | "venom"
  | "void"
  | "solar"
  | "stone"
  | "blood";

export type FireKind =
  | "inferno"
  | "frost"
  | "lightning"
  | "venom"
  | "arcane"
  | "solar"
  | "quake"
  | "sanguine";

export type HornStyle = "curved" | "bladed" | "crowned" | "rift" | "antler" | "crest" | "tusk";
export type WingStyle = "classic" | "feathered" | "spiked" | "rift" | "crystal" | "plated" | "spectral";

export interface DragonPalette {
  body: string;
  bodyDark?: string;
  belly: string;
  bellyRidge?: string;
  wing: string;
  wingInner?: string;
  wingRim: string;
  horn: string;
  eye: string;
  glow?: string;
  energy?: string;
}

/**
 * Realistic fire-breathing cadence. A dragon inhales, blasts, then must recover —
 * it cannot exhale forever. Timings are in seconds.
 */
export interface BreathProfile {
  /** Deep breath in before the blast. */
  inhale: number;
  /** Length of the actual exhalation. */
  blast: number;
  /** Short pause between blasts while the chest refills. */
  recover: number;
  /** Forced recovery when the lungs are emptied. */
  winded: number;
  /** Damage per second at full envelope. */
  dps: number;
  /** Lung capacity drained per second of blasting. */
  drain: number;
  /** Lung capacity refilled per second while not blasting. */
  refill: number;
}

export interface DragonDefinition {
  id: DragonId;
  name: string;
  title: string;
  power: string;
  description: string;
  fire: FireKind;
  fireColor: string;
  accent: string;
  rarity: "starter" | "common" | "rare" | "epic" | "legendary";
  stats: { force: number; speed: number; control: number };
  breath: BreathProfile;
  palette: DragonPalette;
  hornStyle?: HornStyle;
  wingStyle?: WingStyle;
  /** Campaign level that unlocks this dragon, if any. */
  unlockLevel?: number;
}

export const DRAGONS: DragonDefinition[] = [
  {
    id: "ember",
    name: "Ignivar",
    title: "The First Flame",
    power: "Inferno Volley",
    description: "The primordial fire-blood. Balanced lungs and a rolling magma blast that widens with rage.",
    fire: "inferno",
    fireColor: "#ff8a24",
    accent: "#ffc14d",
    rarity: "starter",
    stats: { force: 7, speed: 7, control: 8 },
    breath: { inhale: 0.3, blast: 0.5, recover: 0.5, winded: 1.5, dps: 6.4, drain: 0.52, refill: 0.42 },
    hornStyle: "curved",
    wingStyle: "classic",
    palette: {
      body: "#e86214",
      bodyDark: "#851e06",
      belly: "#ffd384",
      bellyRidge: "#e39228",
      wing: "#6d1405",
      wingInner: "#9e2709",
      wingRim: "#ffb443",
      horn: "#fff3cf",
      eye: "#ffffff",
      glow: "rgba(255, 140, 40, 0.8)",
      energy: "#ff7426",
    },
  },
  {
    id: "frost",
    name: "Cryonax",
    title: "The Glacier Sovereign",
    power: "Rime Cannon",
    description: "Slow to charge but devastating. Fires supercooled vapour that shatters armour on contact.",
    fire: "frost",
    fireColor: "#7fdcff",
    accent: "#d6f6ff",
    rarity: "common",
    stats: { force: 8, speed: 5, control: 9 },
    breath: { inhale: 0.46, blast: 0.34, recover: 0.62, winded: 1.8, dps: 9.2, drain: 0.62, refill: 0.36 },
    hornStyle: "antler",
    wingStyle: "crystal",
    unlockLevel: 1,
    palette: {
      body: "#2b8fc4",
      bodyDark: "#0b4a6e",
      belly: "#dff7ff",
      bellyRidge: "#6fc7e8",
      wing: "#0a3a56",
      wingInner: "#136289",
      wingRim: "#a7ecff",
      horn: "#f2fdff",
      eye: "#e8feff",
      glow: "rgba(127, 220, 255, 0.85)",
      energy: "#5ed3ff",
    },
  },
  {
    id: "storm",
    name: "Zephyrax",
    title: "The Storm Crown",
    power: "Chain Lightning",
    description: "Rapid shallow breaths of crackling plasma. Wings of a thunderhead, temper of a live wire.",
    fire: "lightning",
    fireColor: "#4fe0ff",
    accent: "#b2f5ff",
    rarity: "common",
    stats: { force: 6, speed: 10, control: 8 },
    breath: { inhale: 0.18, blast: 0.28, recover: 0.26, winded: 1.0, dps: 5.6, drain: 0.38, refill: 0.58 },
    hornStyle: "bladed",
    wingStyle: "feathered",
    unlockLevel: 2,
    palette: {
      body: "#0f8bc5",
      bodyDark: "#08476a",
      belly: "#bcf5ff",
      bellyRidge: "#38b9e0",
      wing: "#0a3754",
      wingInner: "#135d8c",
      wingRim: "#8aedff",
      horn: "#e8fbff",
      eye: "#ffffff",
      glow: "rgba(79, 224, 255, 0.85)",
      energy: "#3be2ff",
    },
  },
  {
    id: "venom",
    name: "Mirefang",
    title: "The Thorn Below",
    power: "Venom Bloom",
    description: "Sprays caustic spore-clouds in long, heavy bursts that linger and dissolve whole formations.",
    fire: "venom",
    fireColor: "#67f558",
    accent: "#d4ff9c",
    rarity: "rare",
    stats: { force: 9, speed: 5, control: 9 },
    breath: { inhale: 0.36, blast: 0.72, recover: 0.7, winded: 2.0, dps: 5.2, drain: 0.48, refill: 0.34 },
    hornStyle: "crowned",
    wingStyle: "spiked",
    unlockLevel: 3,
    palette: {
      body: "#2e9a3f",
      bodyDark: "#10471b",
      belly: "#c8f8b4",
      bellyRidge: "#6ec953",
      wing: "#0d3c19",
      wingInner: "#19662e",
      wingRim: "#91fa78",
      horn: "#eaffcb",
      eye: "#f9ff70",
      glow: "rgba(103, 245, 88, 0.85)",
      energy: "#57ea49",
    },
  },
  {
    id: "void",
    name: "Nyxara",
    title: "The Rift Wing",
    power: "Arcane Lance",
    description: "Collapses space itself into a narrow lance. Pierces every drake stacked along its line.",
    fire: "arcane",
    fireColor: "#cc6eff",
    accent: "#f4d0ff",
    rarity: "rare",
    stats: { force: 10, speed: 4, control: 6 },
    breath: { inhale: 0.55, blast: 0.42, recover: 0.75, winded: 2.1, dps: 8.6, drain: 0.55, refill: 0.3 },
    hornStyle: "rift",
    wingStyle: "rift",
    unlockLevel: 4,
    palette: {
      body: "#7035ab",
      bodyDark: "#331256",
      belly: "#ebccff",
      bellyRidge: "#a45fe3",
      wing: "#21093b",
      wingInner: "#431773",
      wingRim: "#d38aff",
      horn: "#f8eaff",
      eye: "#ffffff",
      glow: "rgba(204, 110, 255, 0.85)",
      energy: "#bd54ff",
    },
  },
  {
    id: "solar",
    name: "Solvaris",
    title: "The Dawn Tyrant",
    power: "Solar Flare",
    description: "Radiant gold-fire in short searing flashes. Blinds and burns everything caught in the beam.",
    fire: "solar",
    fireColor: "#ffd23f",
    accent: "#fff2b8",
    rarity: "epic",
    stats: { force: 9, speed: 8, control: 7 },
    breath: { inhale: 0.26, blast: 0.24, recover: 0.34, winded: 1.2, dps: 10.4, drain: 0.6, refill: 0.46 },
    hornStyle: "crest",
    wingStyle: "feathered",
    unlockLevel: 6,
    palette: {
      body: "#e8a920",
      bodyDark: "#8a5206",
      belly: "#fff0bd",
      bellyRidge: "#f5c451",
      wing: "#7d4a05",
      wingInner: "#ad6b09",
      wingRim: "#ffe27a",
      horn: "#fffaea",
      eye: "#fffbe8",
      glow: "rgba(255, 210, 63, 0.9)",
      energy: "#ffc21f",
    },
  },
  {
    id: "stone",
    name: "Terraxis",
    title: "The Mountain That Walks",
    power: "Seismic Roar",
    description: "Armoured in living rock. Looses a gravel-heavy concussion roar that nothing flies through.",
    fire: "quake",
    fireColor: "#d98e4a",
    accent: "#ffd9ac",
    rarity: "epic",
    stats: { force: 10, speed: 3, control: 7 },
    breath: { inhale: 0.62, blast: 0.55, recover: 0.9, winded: 2.4, dps: 9.8, drain: 0.5, refill: 0.26 },
    hornStyle: "tusk",
    wingStyle: "plated",
    unlockLevel: 8,
    palette: {
      body: "#9a7752",
      bodyDark: "#4a3623",
      belly: "#e8d3b4",
      bellyRidge: "#c19a6b",
      wing: "#3c2c1c",
      wingInner: "#5b4429",
      wingRim: "#d9a86a",
      horn: "#f3e6d2",
      eye: "#ffcf7a",
      glow: "rgba(217, 142, 74, 0.8)",
      energy: "#e08a3c",
    },
  },
  {
    id: "blood",
    name: "Sanguinar",
    title: "The Crimson Reaver",
    power: "Crimson Torrent",
    description: "Legendary brood-slayer. Its scarlet gout feeds on the fallen, restoring the rider's vitality.",
    fire: "sanguine",
    fireColor: "#ff4d6d",
    accent: "#ffc2cd",
    rarity: "legendary",
    stats: { force: 10, speed: 9, control: 9 },
    breath: { inhale: 0.24, blast: 0.62, recover: 0.32, winded: 1.1, dps: 7.8, drain: 0.44, refill: 0.5 },
    hornStyle: "crowned",
    wingStyle: "spectral",
    unlockLevel: 11,
    palette: {
      body: "#c02340",
      bodyDark: "#5a0a19",
      belly: "#ffd0d8",
      bellyRidge: "#e04a5f",
      wing: "#3f0713",
      wingInner: "#6b0f22",
      wingRim: "#ff8ea0",
      horn: "#fff0f3",
      eye: "#fff3f5",
      glow: "rgba(255, 77, 109, 0.88)",
      energy: "#ff3355",
    },
  },
];

export const dragonById = (id: DragonId) => DRAGONS.find((dragon) => dragon.id === id) ?? DRAGONS[0];

export const isDragonId = (value: unknown): value is DragonId => DRAGONS.some((dragon) => dragon.id === value);

/** Dragons the player has earned, given the highest campaign level cleared. */
export function dragonsUnlockedBy(highestLevel: number): DragonId[] {
  return DRAGONS.filter((dragon) => !dragon.unlockLevel || highestLevel >= dragon.unlockLevel).map((d) => d.id);
}

export const RARITY_LABEL: Record<DragonDefinition["rarity"], string> = {
  starter: "STARTER",
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};
