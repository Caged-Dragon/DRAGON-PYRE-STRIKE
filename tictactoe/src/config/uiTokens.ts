import { DRAGON_REALMS } from "./dragonRealms";
import type { DragonRealmId, ThemeId } from "../types/game";

export interface UiTokens {
  isDragon: boolean;
  canvas: string;
  headerBar: string;
  panel: string;
  panelSolid: string;
  inset: string;
  iconTile: string;
  textStrong: string;
  textBody: string;
  textMuted: string;
  label: string;
  accentText: string;
  gradientText: string;
  segTrack: string;
  segActive: string;
  segIdle: string;
  cardIdle: string;
  cardActive: string;
  radioOn: string;
  radioOff: string;
  stepBadge: string;
  primaryBtn: string;
  secondaryBtn: string;
  ring: string;
  chip: string;
  divider: string;
  xColor: string;
  oColor: string;
  displayFont: string;
}

export function getUiTokens(theme: ThemeId, realm: DragonRealmId): UiTokens {
  if (theme === "dragon") {
    const r = DRAGON_REALMS[realm];
    return {
      isDragon: true,
      canvas: r.canvasBg,
      headerBar: "bg-black/30 border-white/[0.07] backdrop-blur-xl",
      panel:
        "bg-white/[0.035] backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)]",
      panelSolid:
        "bg-[#120F1C]/95 border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl",
      inset: "bg-black/25 border border-white/[0.06]",
      iconTile: `bg-white/[0.06] ${r.accentText} ring-1 ring-inset ring-white/10`,
      textStrong: "text-white",
      textBody: "text-slate-300",
      textMuted: "text-slate-500",
      label: "text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500",
      accentText: r.accentText,
      gradientText: `bg-gradient-to-r ${r.swatchGradient} bg-clip-text text-transparent`,
      segTrack: "bg-black/30 ring-1 ring-inset ring-white/[0.07]",
      segActive: `bg-gradient-to-r ${r.buttonGradient} shadow-[0_6px_18px_-8px_rgba(0,0,0,0.8)]`,
      segIdle: "text-slate-400 hover:text-white hover:bg-white/[0.05]",
      cardIdle:
        "bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]",
      cardActive: `bg-white/[0.07] ${r.boardBorder} ring-4 ring-white/[0.05]`,
      radioOn: "border-transparent bg-white text-slate-950",
      radioOff: "border-white/20",
      stepBadge: `bg-gradient-to-br ${r.buttonGradient}`,
      primaryBtn: `bg-gradient-to-r ${r.buttonGradient} shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.25)]`,
      secondaryBtn:
        "bg-white/[0.05] text-slate-200 border border-white/10 hover:bg-white/[0.1] hover:text-white",
      ring: "focus-visible:ring-white/40",
      chip: "bg-white/[0.06] text-slate-300 ring-1 ring-inset ring-white/10",
      divider: "bg-white/[0.07]",
      xColor: r.xStops[1],
      oColor: r.oStops[1],
      displayFont: "font-display-dragon",
    };
  }

  return {
    isDragon: false,
    canvas: "#F5F7FB",
    headerBar: "bg-white/70 border-slate-200/70 backdrop-blur-xl",
    panel:
      "bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-24px_rgba(15,23,42,0.2)]",
    panelSolid:
      "bg-white border border-slate-200/90 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]",
    inset: "bg-slate-50/90 border border-slate-200/70",
    iconTile: "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100",
    textStrong: "text-slate-900",
    textBody: "text-slate-600",
    textMuted: "text-slate-400",
    label: "text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400",
    accentText: "text-blue-600",
    gradientText:
      "bg-gradient-to-r from-blue-600 via-indigo-500 to-rose-500 bg-clip-text text-transparent",
    segTrack: "bg-slate-100/90 ring-1 ring-inset ring-slate-200/70",
    segActive:
      "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08),0_2px_8px_-2px_rgba(15,23,42,0.14)]",
    segIdle: "text-slate-500 hover:text-slate-900",
    cardIdle:
      "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-[0_10px_24px_-14px_rgba(15,23,42,0.3)]",
    cardActive: "bg-blue-50/60 border-blue-500 ring-4 ring-blue-500/10",
    radioOn: "border-blue-600 bg-blue-600 text-white",
    radioOff: "border-slate-300",
    stepBadge:
      "bg-blue-600 text-white shadow-[0_4px_10px_-4px_rgba(37,99,235,0.8)]",
    primaryBtn:
      "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.75),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-blue-500 hover:to-blue-700",
    secondaryBtn:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
    ring: "focus-visible:ring-blue-500/60",
    chip: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70",
    divider: "bg-slate-200/80",
    xColor: "#2563EB",
    oColor: "#E11D48",
    displayFont: "",
  };
}
