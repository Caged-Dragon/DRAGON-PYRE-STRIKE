export interface LevelDefinition {
  id: number;
  name: string;
  realm: string;
  boss: string;
  bossTitle: string;
  bossHp: number;
  waves: number;
  /** Star rating score thresholds: [1 star, 2 stars, 3 stars]. */
  starScores: [number, number, number];
  /** Boss + sky palette. */
  theme: {
    skyTop: string;
    skyMid: string;
    skyLow: string;
    ridge: string;
    ridgeRim: string;
    moon: string;
    haze: string;
  };
  /** Drakes that dominate this realm, used to tint the swarm. */
  enemyTint: string;
  /** Global difficulty multiplier applied to enemy speed and fire rate. */
  difficulty: number;
  reward?: string;
  rewardText?: string;
}

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: "Cinder Pass",
    realm: "The Scorched Steppes",
    boss: "EMBERWING TITAN",
    bossTitle: "Broodlord of Ash",
    bossHp: 70,
    waves: 3,
    starScores: [1800, 3400, 5200],
    difficulty: 1,
    reward: "frost",
    rewardText: "Cryonax joins your roost",
    theme: {
      skyTop: "#100610",
      skyMid: "#2a0c1c",
      skyLow: "#4d1a10",
      ridge: "#150a18",
      ridgeRim: "rgba(255,107,26,0.3)",
      moon: "255,120,50",
      haze: "rgba(255,110,30,0.42)",
    },
    enemyTint: "#7c3aed",
  },
  {
    id: 2,
    name: "Thunder Spires",
    realm: "Cloudbreak Ridge",
    boss: "TEMPEST WYRM",
    bossTitle: "Howl of the High Winds",
    bossHp: 95,
    waves: 3,
    starScores: [3200, 5600, 8200],
    difficulty: 1.1,
    reward: "storm",
    rewardText: "Zephyrax joins your roost",
    theme: {
      skyTop: "#0b0a1e",
      skyMid: "#1c1140",
      skyLow: "#2f1a5c",
      ridge: "#0e0b22",
      ridgeRim: "rgba(140,120,255,0.3)",
      moon: "150,140,255",
      haze: "rgba(120,110,255,0.34)",
    },
    enemyTint: "#4f9cf5",
  },
  {
    id: 3,
    name: "Mire of Teeth",
    realm: "The Drowned Bog",
    boss: "BOGBLIGHT QUEEN",
    bossTitle: "Mother of Spores",
    bossHp: 120,
    waves: 4,
    starScores: [4600, 7800, 11200],
    difficulty: 1.2,
    reward: "venom",
    rewardText: "Mirefang joins your roost",
    theme: {
      skyTop: "#07130c",
      skyMid: "#0f2a18",
      skyLow: "#1c4023",
      ridge: "#08170f",
      ridgeRim: "rgba(120,240,130,0.26)",
      moon: "120,240,150",
      haze: "rgba(90,220,110,0.3)",
    },
    enemyTint: "#37b45a",
  },
  {
    id: 4,
    name: "Obsidian Gate",
    realm: "The World Wound",
    boss: "OBSIDIAN MAW",
    bossTitle: "Devourer Below",
    bossHp: 150,
    waves: 4,
    starScores: [6200, 10200, 14600],
    difficulty: 1.32,
    reward: "void",
    rewardText: "Nyxara joins your roost",
    theme: {
      skyTop: "#0a050c",
      skyMid: "#1a0a1c",
      skyLow: "#2b0a1a",
      ridge: "#0d0710",
      ridgeRim: "rgba(210,110,255,0.28)",
      moon: "200,110,255",
      haze: "rgba(180,90,255,0.32)",
    },
    enemyTint: "#8b5cf6",
  },
  {
    id: 5,
    name: "Saltwind Coast",
    realm: "The Bleaching Tide",
    boss: "TIDEWRAITH CYCLONE",
    bossTitle: "Storm Below the Waves",
    bossHp: 175,
    waves: 4,
    starScores: [7400, 12000, 17200],
    difficulty: 1.42,
    theme: {
      skyTop: "#071018",
      skyMid: "#0d2b3a",
      skyLow: "#17485c",
      ridge: "#08171d",
      ridgeRim: "rgba(110,220,240,0.26)",
      moon: "120,220,240",
      haze: "rgba(90,200,230,0.3)",
    },
    enemyTint: "#22a3c4",
  },
  {
    id: 6,
    name: "Dawnspire Reach",
    realm: "The Golden Heights",
    boss: "SOLVARIS BETRAYED",
    bossTitle: "The Dawn Tyrant Falls",
    bossHp: 200,
    waves: 4,
    starScores: [9000, 14400, 20400],
    difficulty: 1.52,
    reward: "solar",
    rewardText: "Solvaris joins your roost",
    theme: {
      skyTop: "#2a1408",
      skyMid: "#6b3a10",
      skyLow: "#c9821e",
      ridge: "#1e1008",
      ridgeRim: "rgba(255,215,120,0.4)",
      moon: "255,225,150",
      haze: "rgba(255,205,90,0.4)",
    },
    enemyTint: "#e0a03a",
  },
  {
    id: 7,
    name: "Frostholm Deep",
    realm: "The Buried Glacier",
    boss: "GLACIAL MONARCH",
    bossTitle: "Sovereign of Absolute Zero",
    bossHp: 225,
    waves: 5,
    starScores: [10800, 17000, 23800],
    difficulty: 1.62,
    theme: {
      skyTop: "#061019",
      skyMid: "#0e3350",
      skyLow: "#1c567d",
      ridge: "#081826",
      ridgeRim: "rgba(160,230,255,0.32)",
      moon: "170,235,255",
      haze: "rgba(130,215,255,0.34)",
    },
    enemyTint: "#5fb6e0",
  },
  {
    id: 8,
    name: "Ironroot Chasm",
    realm: "The Stone Choir",
    boss: "MOUNTAIN THAT WALKS",
    bossTitle: "Terraxis Enraged",
    bossHp: 250,
    waves: 5,
    starScores: [12600, 19600, 27400],
    difficulty: 1.72,
    reward: "stone",
    rewardText: "Terraxis joins your roost",
    theme: {
      skyTop: "#160f0a",
      skyMid: "#33230f",
      skyLow: "#5c3f18",
      ridge: "#1a1208",
      ridgeRim: "rgba(230,180,110,0.3)",
      moon: "235,190,130",
      haze: "rgba(210,160,90,0.32)",
    },
    enemyTint: "#b08348",
  },
  {
    id: 9,
    name: "Emberfall Crater",
    realm: "Where Dragons Are Born",
    boss: "PYRE MATRIARCH",
    bossTitle: "First Mother of Fire",
    bossHp: 285,
    waves: 5,
    starScores: [14600, 22400, 31200],
    difficulty: 1.85,
    theme: {
      skyTop: "#1a0606",
      skyMid: "#4a0f0c",
      skyLow: "#8e2310",
      ridge: "#1c0808",
      ridgeRim: "rgba(255,120,60,0.4)",
      moon: "255,140,80",
      haze: "rgba(255,90,40,0.42)",
    },
    enemyTint: "#e2542a",
  },
  {
    id: 10,
    name: "Hollow Nebula",
    realm: "Beyond the Sky",
    boss: "STARLESS RAVAGER",
    bossTitle: "Eater of Constellations",
    bossHp: 320,
    waves: 5,
    starScores: [16800, 25400, 35200],
    difficulty: 1.96,
    theme: {
      skyTop: "#05040f",
      skyMid: "#120b2e",
      skyLow: "#221244",
      ridge: "#08061a",
      ridgeRim: "rgba(180,140,255,0.3)",
      moon: "190,160,255",
      haze: "rgba(150,110,255,0.32)",
    },
    enemyTint: "#9b7bf5",
  },
  {
    id: 11,
    name: "Crimson Breach",
    realm: "The Blood War",
    boss: "REAPER SANGUINAR",
    bossTitle: "The Crimson Reaver Rival",
    bossHp: 360,
    waves: 6,
    starScores: [19600, 29200, 40400],
    difficulty: 2.08,
    reward: "blood",
    rewardText: "Sanguinar joins your roost",
    theme: {
      skyTop: "#170408",
      skyMid: "#3f0a14",
      skyLow: "#6d1322",
      ridge: "#190609",
      ridgeRim: "rgba(255,90,120,0.34)",
      moon: "255,120,140",
      haze: "rgba(255,60,90,0.36)",
    },
    enemyTint: "#e0405f",
  },
  {
    id: 12,
    name: "Ancient Caldera",
    realm: "The Final Ascension",
    boss: "THE ASHEN ANCIENT",
    bossTitle: "God of the Last Flame",
    bossHp: 420,
    waves: 6,
    starScores: [22800, 34000, 47000],
    difficulty: 2.22,
    theme: {
      skyTop: "#0d0407",
      skyMid: "#33101f",
      skyLow: "#63200f",
      ridge: "#12060a",
      ridgeRim: "rgba(255,150,90,0.38)",
      moon: "255,170,110",
      haze: "rgba(255,120,60,0.44)",
    },
    enemyTint: "#c0453a",
  },
];

export const MAX_LEVEL = LEVELS.length;

export const levelById = (id: number) => LEVELS.find((level) => level.id === id) ?? LEVELS[0];

export function starsForScore(levelId: number, score: number): number {
  const level = levelById(levelId);
  if (score >= level.starScores[2]) return 3;
  if (score >= level.starScores[1]) return 2;
  if (score >= level.starScores[0]) return 1;
  return score > 0 ? 1 : 0;
}
