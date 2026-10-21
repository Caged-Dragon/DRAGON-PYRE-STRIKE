export type DragonRealmId = "inferno" | "jade" | "frost" | "void";

export interface DragonRealmConfig {
  id: DragonRealmId;
  name: string;
  subtitle: string;
  badgeText: string;
  mascot: string;
  tagline: string;
  motto: string;
  canvasBg: string;
  radialBackdrop: string;
  panelBg: string;
  boardBg: string;
  boardBorder: string;
  boardShadow: string;
  panelBorder: string;
  panelBorderGlow: string;
  cellIdleBg: string;
  cellHoverBg: string;
  cellBg: string;
  cellWinBg: string;
  xAccent: string;
  oAccent: string;
  accentText: string;
  buttonGradient: string;
  swatchGradient: string;
  xStops: [string, string, string];
  oStops: [string, string, string];
  xStroke: string;
  xGlow: string;
  oGlow: string;
  strikeStops: [string, string];
  strikeGlow: string;
  watermark: string;
  eye: string;
  emberFrom: string;
  emberTo: string;
  scaleTint: string;
}

const GLOW = (color: string) =>
  `drop-shadow(0 0 4px ${color}95) drop-shadow(0 0 11px ${color}60)`;

export const DRAGON_REALMS: Record<DragonRealmId, DragonRealmConfig> = {
  inferno: {
    id: "inferno",
    name: "Inferno Drake",
    subtitle: "Molten scales · ember breath",
    badgeText: "Fire",
    mascot: "🔥",
    tagline: "Wreathed in eternal flame",
    motto: "Burn the path to victory",
    canvasBg: "#1A0B07",
    radialBackdrop:
      "radial-gradient(ellipse at 50% 115%, rgba(255,120,20,0.35), transparent 55%), radial-gradient(ellipse at 50% -10%, rgba(255,70,0,0.25), transparent 55%), #0E0604",
    panelBg: "rgba(28, 11, 4, 0.72)",
    boardBg:
      "linear-gradient(160deg, #2a0f06 0%, #160804 55%, #0e0503 100%)",
    boardBorder: "border-amber-500/40",
    boardShadow: "0 0 0 1px rgba(255, 160, 40, 0.18), 0 28px 80px -22px rgba(255, 80, 0, 0.55)",
    panelBorder: "border-amber-500/25",
    panelBorderGlow: "#ff8a1a",
    cellIdleBg: "rgba(45, 17, 5, 0.9)",
    cellHoverBg: "rgba(70, 26, 8, 0.95)",
    cellBg: "rgba(55, 19, 6, 0.8)",
    cellWinBg: "rgba(255, 120, 20, 0.24)",
    xAccent: "#F59E0B",
    oAccent: "#EF4444",
    accentText: "text-amber-400",
    buttonGradient: "from-amber-400 via-orange-500 to-red-500",
    swatchGradient: "from-amber-300 via-orange-500 to-red-600",
    xStops: ["#FFE08A", "#F59E0B", "#B45309"],
    oStops: ["#FCA5A5", "#EF4444", "#7F1D1D"],
    xStroke: "#7C2D12",
    xGlow: GLOW("#F59E0B"),
    oGlow: GLOW("#EF4444"),
    strikeStops: ["#FFE08A", "#EF4444"],
    strikeGlow: "rgba(255, 170, 40, 0.75)",
    watermark: "rgba(255, 130, 20, 0.10)",
    eye: "#FFD166",
    emberFrom: "#ffb020",
    emberTo: "rgba(255, 90, 0, 0)",
    scaleTint: "rgba(255, 120, 20, 0.12)",
  },
  jade: {
    id: "jade",
    name: "Jade Serpent",
    subtitle: "Emerald scales · forest breath",
    badgeText: "Nature",
    mascot: "🐉",
    tagline: "Wise ancient guardian of the grove",
    motto: "Strike like a coiled serpent",
    canvasBg: "#07130E",
    radialBackdrop:
      "radial-gradient(ellipse at 50% 115%, rgba(52,211,153,0.22), transparent 55%), radial-gradient(ellipse at 50% -10%, rgba(16,185,129,0.18), transparent 55%), #040B08",
    panelBg: "rgba(8, 22, 15, 0.72)",
    boardBg:
      "linear-gradient(160deg, #071c12 0%, #030e08 55%, #020806 100%)",
    boardBorder: "border-emerald-400/35",
    boardShadow: "0 0 0 1px rgba(52, 211, 153, 0.18), 0 28px 80px -22px rgba(16, 185, 129, 0.45)",
    panelBorder: "border-emerald-400/22",
    panelBorderGlow: "#10b981",
    cellIdleBg: "rgba(8, 32, 22, 0.9)",
    cellHoverBg: "rgba(12, 46, 30, 0.95)",
    cellBg: "rgba(10, 40, 26, 0.8)",
    cellWinBg: "rgba(52, 211, 153, 0.22)",
    xAccent: "#10B981",
    oAccent: "#84CC16",
    accentText: "text-emerald-400",
    buttonGradient: "from-emerald-400 via-teal-500 to-lime-500",
    swatchGradient: "from-emerald-300 via-teal-500 to-lime-500",
    xStops: ["#A7F3D0", "#10B981", "#065F46"],
    oStops: ["#BEF264", "#84CC16", "#365314"],
    xStroke: "#064E3B",
    xGlow: GLOW("#10B981"),
    oGlow: GLOW("#84CC16"),
    strikeStops: ["#A7F3D0", "#84CC16"],
    strikeGlow: "rgba(52, 211, 153, 0.75)",
    watermark: "rgba(16, 185, 129, 0.09)",
    eye: "#86efac",
    emberFrom: "#34d399",
    emberTo: "rgba(16, 185, 129, 0)",
    scaleTint: "rgba(52, 211, 153, 0.12)",
  },
  frost: {
    id: "frost",
    name: "Frost Wyrm",
    subtitle: "Glacial scales · rime breath",
    badgeText: "Ice",
    mascot: "❄️",
    tagline: "The eternal frost of the northern peaks",
    motto: "Freeze them where they stand",
    canvasBg: "#081019",
    radialBackdrop:
      "radial-gradient(ellipse at 50% 115%, rgba(125,211,252,0.22), transparent 55%), radial-gradient(ellipse at 50% -10%, rgba(59,130,246,0.22), transparent 55%), #04080F",
    panelBg: "rgba(12, 24, 40, 0.72)",
    boardBg:
      "linear-gradient(160deg, #0a1b2e 0%, #050d19 55%, #03070e 100%)",
    boardBorder: "border-sky-400/35",
    boardShadow: "0 0 0 1px rgba(125, 211, 252, 0.18), 0 28px 80px -22px rgba(59, 130, 246, 0.45)",
    panelBorder: "border-sky-400/22",
    panelBorderGlow: "#38bdf8",
    cellIdleBg: "rgba(14, 32, 52, 0.9)",
    cellHoverBg: "rgba(20, 46, 78, 0.95)",
    cellBg: "rgba(18, 40, 62, 0.8)",
    cellWinBg: "rgba(125, 211, 252, 0.22)",
    xAccent: "#38BDF8",
    oAccent: "#818CF8",
    accentText: "text-sky-300",
    buttonGradient: "from-sky-400 via-cyan-400 to-indigo-400",
    swatchGradient: "from-sky-300 via-cyan-400 to-indigo-500",
    xStops: ["#BAE6FD", "#38BDF8", "#075985"],
    oStops: ["#C7D2FE", "#818CF8", "#312E81"],
    xStroke: "#0C4A6E",
    xGlow: GLOW("#38BDF8"),
    oGlow: GLOW("#818CF8"),
    strikeStops: ["#BAE6FD", "#818CF8"],
    strikeGlow: "rgba(125, 211, 252, 0.75)",
    watermark: "rgba(125, 211, 252, 0.10)",
    eye: "#e0f2fe",
    emberFrom: "#7dd3fc",
    emberTo: "rgba(59, 130, 246, 0)",
    scaleTint: "rgba(125, 211, 252, 0.12)",
  },
  void: {
    id: "void",
    name: "Void Wyvern",
    subtitle: "Shadow scales · starlight breath",
    badgeText: "Cosmic",
    mascot: "🌑",
    tagline: "Born between the stars",
    motto: "Strike from the shadows",
    canvasBg: "#080417",
    radialBackdrop:
      "radial-gradient(ellipse at 50% 115%, rgba(168,85,247,0.24), transparent 55%), radial-gradient(ellipse at 50% -10%, rgba(236,72,153,0.2), transparent 55%), radial-gradient(circle at 20% 20%, rgba(99,102,241,0.16), transparent 30%), #03010B",
    panelBg: "rgba(20, 10, 40, 0.72)",
    boardBg:
      "linear-gradient(160deg, #180a2e 0%, #09031a 55%, #05020f 100%)",
    boardBorder: "border-fuchsia-400/35",
    boardShadow: "0 0 0 1px rgba(192, 132, 252, 0.18), 0 28px 80px -22px rgba(168, 85, 247, 0.55)",
    panelBorder: "border-fuchsia-400/22",
    panelBorderGlow: "#c084fc",
    cellIdleBg: "rgba(32, 14, 58, 0.9)",
    cellHoverBg: "rgba(48, 22, 86, 0.95)",
    cellBg: "rgba(40, 18, 70, 0.8)",
    cellWinBg: "rgba(217, 70, 239, 0.22)",
    xAccent: "#C084FC",
    oAccent: "#F472B6",
    accentText: "text-fuchsia-300",
    buttonGradient: "from-fuchsia-400 via-purple-500 to-pink-500",
    swatchGradient: "from-fuchsia-400 via-purple-500 to-pink-500",
    xStops: ["#E9D5FF", "#C084FC", "#581C87"],
    oStops: ["#FBCFE8", "#F472B6", "#831843"],
    xStroke: "#3B0764",
    xGlow: GLOW("#C084FC"),
    oGlow: GLOW("#F472B6"),
    strikeStops: ["#E9D5FF", "#F472B6"],
    strikeGlow: "rgba(217, 70, 239, 0.8)",
    watermark: "rgba(192, 132, 252, 0.10)",
    eye: "#f0abfc",
    emberFrom: "#d946ef",
    emberTo: "rgba(168, 85, 247, 0)",
    scaleTint: "rgba(192, 132, 252, 0.12)",
  },
};

export const DRAGON_REALM_LIST: DragonRealmConfig[] = [
  DRAGON_REALMS.inferno,
  DRAGON_REALMS.jade,
  DRAGON_REALMS.frost,
  DRAGON_REALMS.void,
];
