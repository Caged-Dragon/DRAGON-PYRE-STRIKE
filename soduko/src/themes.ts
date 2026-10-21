import type { Difficulty } from "./lib/sudoku";

export type ThemeId = "classic" | "dragon";

export interface Theme {
  id: ThemeId;
  name: string;
  tagline: string;
  locked: boolean;
  appBg: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  titleFont: string;
  bodyFont: string;
  // Board tokens
  boardBg: string;
  boardBorder: string;
  boardShadow: string;
  cellBg: string;
  cellBgAlt: string;
  cellGivenText: string;
  cellUserText: string;
  cellSelectedBg: string;
  cellHighlightBg: string;
  cellSameNumberBg: string;
  cellConflictBg: string;
  cellConflictText: string;
  numberFont: string;
  // Guide box & rail lines
  guideThin: string;
  guideThick: string;
  guideGlow: string;
  guideDot: string;
  activeBoxBorder: string;
  activeRailBorder: string;
  coordText: string;
  // Controls & Buttons
  keySurface: string;
  keyText: string;
  keyDisabled: string;
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnSecondaryBg: string;
  btnSecondaryText: string;
  accent: string;
  accentSoft: string;
  divider: string;
  premium: string;
  premiumText: string;
  modalBackdrop: string;
  modalBg: string;
}

export const classicTheme: Theme = {
  id: "classic",
  name: "Classic",
  tagline: "Architectural paper & royal ink",
  locked: false,
  appBg: "classic-backdrop text-slate-900",
  surface: "classic-card backdrop-blur-md",
  textPrimary: "text-slate-900",
  textSecondary: "text-slate-700",
  textMuted: "text-slate-500",
  titleFont: "tracking-tight",
  bodyFont: "",
  boardBg: "bg-white",
  boardBorder: "border-[2.5px] border-slate-800",
  boardShadow: "shadow-[0_18px_45px_-12px_rgba(15,23,42,0.16)]",
  cellBg: "bg-white hover:bg-slate-50/90",
  cellBgAlt: "bg-slate-50/75 hover:bg-slate-100/80",
  cellGivenText: "text-slate-900 font-bold",
  cellUserText: "text-blue-600 font-semibold",
  cellSelectedBg: "bg-blue-100/95",
  cellHighlightBg: "bg-sky-50/90",
  cellSameNumberBg: "bg-indigo-100/90",
  cellConflictBg: "bg-rose-100/95",
  cellConflictText: "text-rose-600 font-bold",
  numberFont: "font-classic-num",
  guideThin: "rgba(148, 163, 184, 0.42)",
  guideThick: "#1e293b",
  guideGlow: "",
  guideDot: "#1e293b",
  activeBoxBorder: "rgba(37, 99, 235, 0.68)",
  activeRailBorder: "rgba(37, 99, 235, 0.34)",
  coordText: "text-slate-400",
  keySurface: "classic-keycap",
  keyText: "text-slate-800",
  keyDisabled: "text-slate-300",
  btnPrimaryBg:
    "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/25 border border-blue-700/20",
  btnPrimaryText: "text-white",
  btnSecondaryBg:
    "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs",
  btnSecondaryText: "text-slate-700",
  accent: "text-blue-600",
  accentSoft: "bg-blue-50 text-blue-700 border border-blue-200/80",
  divider: "bg-slate-200/80",
  premium: "bg-amber-100 border border-amber-200",
  premiumText: "text-amber-800 font-semibold",
  modalBackdrop: "bg-slate-900/50 backdrop-blur-sm",
  modalBg:
    "bg-white border border-slate-200/90 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.28)]",
};

export const dragonTheme: Theme = {
  id: "dragon",
  name: "Dragon Cave",
  tagline: "Obsidian runes & molten gold",
  locked: true,
  appBg: "bg-[#090303] text-amber-50",
  surface: "dragon-card backdrop-blur-md",
  textPrimary: "text-amber-50",
  textSecondary: "text-amber-100/90",
  textMuted: "text-amber-200/60",
  titleFont: "font-dragon-title",
  bodyFont: "font-dragon-body",
  boardBg:
    "bg-[linear-gradient(145deg,#1b0a09_0%,#240d0b_50%,#130606_100%)] scale-pattern",
  boardBorder: "border-[2.5px] border-amber-500/80",
  boardShadow:
    "shadow-[0_0_55px_-10px_rgba(249,115,22,0.32),0_24px_50px_-12px_rgba(0,0,0,0.85)]",
  cellBg: "bg-[#150807]/80 hover:bg-[#220d0b]/85",
  cellBgAlt: "bg-[#1e0b0a]/80 hover:bg-[#2a100d]/85",
  cellGivenText: "",
  cellUserText: "",
  cellSelectedBg: "bg-amber-500/28",
  cellHighlightBg: "bg-amber-800/25",
  cellSameNumberBg: "bg-orange-600/30",
  cellConflictBg: "bg-red-950/80",
  cellConflictText: "",
  numberFont: "font-dragon-num",
  guideThin: "rgba(180, 83, 9, 0.42)",
  guideThick: "#f59e0b",
  guideGlow: "0 0 8px rgba(245, 158, 11, 0.65)",
  guideDot: "#fde68a",
  activeBoxBorder: "rgba(251, 191, 36, 0.85)",
  activeRailBorder: "rgba(249, 115, 22, 0.45)",
  coordText: "text-amber-400/55",
  keySurface: "dragon-runestone",
  keyText: "text-amber-100",
  keyDisabled: "text-amber-900/60",
  btnPrimaryBg:
    "bg-[linear-gradient(100deg,#b45309_0%,#ea580c_50%,#c2410c_100%)] hover:brightness-110 border border-amber-400/40 shadow-lg shadow-orange-950/60",
  btnPrimaryText: "text-amber-50",
  btnSecondaryBg:
    "bg-[#1e0c0a]/85 border border-amber-700/45 hover:bg-amber-900/35 hover:border-amber-500/70",
  btnSecondaryText: "text-amber-100",
  accent: "text-amber-400",
  accentSoft: "bg-amber-950/70 text-amber-200 border border-amber-600/40",
  divider: "bg-amber-800/35",
  premium: "bg-[linear-gradient(90deg,#fde68a,#f59e0b)]",
  premiumText: "text-[#1a0806] font-bold",
  modalBackdrop: "bg-black/80 backdrop-blur-md",
  modalBg:
    "bg-[linear-gradient(160deg,#210c0a_0%,#130606_60%,#260d0b_100%)] border border-amber-500/60 shadow-[0_0_80px_-10px_rgba(249,115,22,0.4)]",
};

export const THEMES: Record<ThemeId, Theme> = {
  classic: classicTheme,
  dragon: dragonTheme,
};

export interface DifficultyMetaItem {
  id: Difficulty;
  label: string;
  dragonLabel: string;
  clues: number;
  tier: number;
  desc: string;
  dragonDesc: string;
}

export const DIFFICULTY_META: DifficultyMetaItem[] = [
  {
    id: "easy",
    label: "Easy",
    dragonLabel: "Hatchling",
    clues: 42,
    tier: 1,
    desc: "Gentle warm-up",
    dragonDesc: "First embers",
  },
  {
    id: "medium",
    label: "Medium",
    dragonLabel: "Wyrmling",
    clues: 34,
    tier: 2,
    desc: "Balanced flow",
    dragonDesc: "Steady flame",
  },
  {
    id: "hard",
    label: "Hard",
    dragonLabel: "Fire Drake",
    clues: 28,
    tier: 3,
    desc: "Deep deduction",
    dragonDesc: "Searing trial",
  },
  {
    id: "expert",
    label: "Expert",
    dragonLabel: "Elder Wyrm",
    clues: 23,
    tier: 4,
    desc: "Master challenge",
    dragonDesc: "Ancient hoard",
  },
];
