import React, { useId } from "react";
import { DRAGON_REALMS } from "../config/dragonRealms";
import type { DragonRealmId } from "../types/game";

interface DragonSilhouetteProps {
  realm?: DragonRealmId;
  className?: string;
  /** Render as a solid shape (e.g. for logos) instead of a faint glowing watermark. */
  solidColor?: string;
}

/* Horned dragon head in profile: open jaws with fangs, swept-back horns and neck spines.
   Every sub-path shares the same winding so overlaps never punch holes. */
const DRAGON_PATH =
  "M46 214C40 170 52 130 84 104C92 84 104 68 124 60C146 52 168 60 184 72C194 79 204 86 210 94L206 101C196 102 186 104 176 106L150 108C168 112 186 116 196 124C184 130 164 132 146 130C130 128 118 132 110 142C98 158 100 186 112 214Z" +
  "M104 72C94 52 80 34 58 18C88 30 104 46 120 64Z" +
  "M122 62C118 44 108 28 92 8C112 22 126 38 134 58Z" +
  "M88 101L74 114L64 92Z" +
  "M70 118L58 134L40 116Z" +
  "M55 142L48 160L28 146Z" +
  "M47 170L45 192L24 178Z" +
  "M196 102L192 110L188 103Z" +
  "M184 104L180 112L176 105Z" +
  "M178 118L182 112L186 120Z" +
  "M140 130L128 146L132 128Z";

const EYE_PATH = "M140 77Q152 66 165 72Q153 81 140 77Z";

export const DragonSilhouette: React.FC<DragonSilhouetteProps> = ({
  realm = "inferno",
  className = "",
  solidColor,
}) => {
  const r = DRAGON_REALMS[realm];
  const gradId = `dragon-wm-${useId().replace(/:/g, "")}`;

  if (solidColor) {
    return (
      <svg viewBox="0 0 220 220" className={className} aria-hidden="true">
        <path d={DRAGON_PATH} fill={solidColor} />
        <path d={EYE_PATH} fill="rgba(0,0,0,0.55)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 220 220" className={className} fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="58%" cy="45%" r="65%">
          <stop offset="0%" stopColor={r.panelBorderGlow} stopOpacity="0.32" />
          <stop offset="60%" stopColor={r.panelBorderGlow} stopOpacity="0.1" />
          <stop offset="100%" stopColor={r.panelBorderGlow} stopOpacity="0.02" />
        </radialGradient>
      </defs>
      <path
        d={DRAGON_PATH}
        fill={`url(#${gradId})`}
        stroke={r.panelBorderGlow}
        strokeOpacity="0.22"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d={EYE_PATH} fill={r.eye} opacity="0.9" />
    </svg>
  );
};
