import React, { useId } from "react";
import { DRAGON_REALMS } from "../config/dragonRealms";
import type { DragonRealmId, Player, ThemeId } from "../types/game";

interface PieceProps {
  player: Player;
  theme: ThemeId;
  realm?: DragonRealmId;
  animate?: boolean;
  ghost?: boolean;
  vanishing?: boolean;
  className?: string;
}

export const GamePiece: React.FC<PieceProps> = ({
  player,
  theme,
  realm = "inferno",
  animate = true,
  ghost = false,
  vanishing = false,
  className = "w-[62%] h-[62%]",
}) => {
  const uid = useId().replace(/:/g, "");
  const realmCfg = DRAGON_REALMS[realm];

  const vanishClass = vanishing ? "animate-pulse opacity-45 scale-90" : "";

  if (theme === "classic") {
    if (player === "X") {
      return (
        <svg
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
          className={`${className} transition-all duration-200 ${
            ghost ? "opacity-25" : vanishClass
          }`}
        >
          <line
            x1="24" y1="24" x2="76" y2="76"
            stroke="#2563EB"
            strokeWidth="11"
            strokeLinecap="round"
            className={animate && !ghost ? "animate-draw-stroke" : ""}
          />
          <line
            x1="76" y1="24" x2="24" y2="76"
            stroke="#2563EB"
            strokeWidth="11"
            strokeLinecap="round"
            style={animate && !ghost ? { animationDelay: "70ms" } : undefined}
            className={animate && !ghost ? "animate-draw-stroke" : ""}
          />
        </svg>
      );
    }
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        className={`${className} transition-all duration-200 ${
          ghost ? "opacity-25" : vanishClass
        }`}
      >
        <circle
          cx="50" cy="50" r="27"
          stroke="#E11D48"
          strokeWidth="11"
          strokeLinecap="round"
          className={animate && !ghost ? "animate-draw-stroke" : ""}
        />
      </svg>
    );
  }

  /* ---------------- DRAGON X: THREE CLAW TALONS crossing ---------------- */
  if (player === "X") {
    const gradMain = `dragon-x-grad-${uid}`;
    const gradShine = `dragon-x-shine-${uid}`;
    const gradShadow = `dragon-x-shadow-${uid}`;

    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        className={`${className} transition-all duration-200 ${
          ghost
            ? "opacity-30"
            : vanishing
            ? vanishClass
            : animate
            ? `animate-pop-piece`
            : ""
        }`}
        style={!ghost && !vanishing ? { filter: realmCfg.xGlow } : undefined}
      >
        <defs>
          <linearGradient id={gradMain} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={realmCfg.xStops[0]} />
            <stop offset="50%" stopColor={realmCfg.xStops[1]} />
            <stop offset="100%" stopColor={realmCfg.xStops[2]} />
          </linearGradient>
          <linearGradient id={gradShine} x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={gradShadow} cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft drop shadow under claws */}
        <ellipse cx="50" cy="76" rx="22" ry="6" fill={`url(#${gradShadow})`} />

        {/* Three crossing talon strokes. Each talon is a thick curved blade with a sharp tip. */}
        {[
          { d: "M14 82 C 32 62, 60 38, 86 18 L 82 28 C 58 46, 32 66, 18 84 Z" },
          { d: "M86 82 C 68 62, 40 38, 14 18 L 18 28 C 42 46, 68 66, 82 84 Z" },
          { d: "M10 48 C 34 46, 66 46, 90 48 L 86 54 C 66 54, 34 54, 14 54 Z" },
        ].map((talon, i) => (
          <g key={i}>
            <path d={talon.d} fill={`url(#${gradMain})`} stroke={realmCfg.xStroke} strokeWidth="1.2" strokeLinejoin="round" />
            {/* scale ridges along the talon */}
            {i === 0 && (
              <>
                <path d="M30 68 Q 40 60, 50 54" stroke={realmCfg.xStops[2]} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M42 58 Q 52 50, 60 44" stroke={realmCfg.xStops[2]} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
              </>
            )}
            {i === 1 && (
              <>
                <path d="M70 68 Q 60 60, 50 54" stroke={realmCfg.xStops[2]} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M58 58 Q 48 50, 40 44" stroke={realmCfg.xStops[2]} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
              </>
            )}
            {/* highlight */}
            <path
              d={
                i === 0
                  ? "M20 80 C 40 62, 68 40, 82 24"
                  : i === 1
                  ? "M80 80 C 60 62, 32 40, 18 24"
                  : "M20 49 C 40 48, 64 48, 84 49"
              }
              stroke={`url(#${gradShine})`}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />
          </g>
        ))}

        {/* Central knuckle / scale gem */}
        <g>
          <polygon
            points="50,44 60,50 50,60 40,50"
            fill={`url(#${gradMain})`}
            stroke={realmCfg.xStroke}
            strokeWidth="1.3"
          />
          <polygon points="50,46 56,50 50,55 44,50" fill={realmCfg.xStops[0]} opacity="0.6" />
        </g>
      </svg>
    );
  }

  /* ---------------- DRAGON O: DRAGON EYE with vertical slit pupil ---------------- */
  const gradIris = `dragon-o-iris-${uid}`;
  const gradSclera = `dragon-o-sclera-${uid}`;
  const gradHorn = `dragon-o-horn-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={`${className} transition-all duration-200 ${
        ghost
          ? "opacity-30"
          : vanishing
          ? vanishClass
          : animate
          ? `animate-pop-piece`
          : ""
      }`}
      style={!ghost && !vanishing ? { filter: realmCfg.oGlow } : undefined}
    >
      <defs>
        <radialGradient id={gradIris} cx="50%" cy="52%" r="36%">
          <stop offset="0%" stopColor={realmCfg.oStops[0]} />
          <stop offset="60%" stopColor={realmCfg.oStops[1]} />
          <stop offset="100%" stopColor={realmCfg.oStops[2]} />
        </radialGradient>
        <linearGradient id={gradSclera} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={realmCfg.oStops[2]} stopOpacity="0.9" />
          <stop offset="100%" stopColor={realmCfg.oStops[2]} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={gradHorn} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={realmCfg.oStops[0]} />
          <stop offset="100%" stopColor={realmCfg.oStops[2]} />
        </linearGradient>
      </defs>

      {/* outer scaled ring */}
      <circle cx="50" cy="51" r="31" fill="none" stroke={realmCfg.oStops[2]} strokeWidth="2" strokeOpacity="0.55" />
      <circle cx="50" cy="51" r="28" fill="none" stroke={realmCfg.oStops[1]} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="2 3" />

      {/* brow horns */}
      <path
        d="M22 29 C 26 18, 34 18, 38 26 L 33 30 C 30 25, 25 26, 22 30 Z"
        fill={`url(#${gradHorn})`}
        stroke={realmCfg.oStops[2]}
        strokeWidth="0.9"
      />
      <path
        d="M78 29 C 74 18, 66 18, 62 26 L 67 30 C 70 25, 75 26, 78 30 Z"
        fill={`url(#${gradHorn})`}
        stroke={realmCfg.oStops[2]}
        strokeWidth="0.9"
      />
      {/* brow ridges */}
      <path d="M18 36 C 28 30, 40 28, 46 33" stroke={realmCfg.oStops[2]} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M82 36 C 72 30, 60 28, 54 33" stroke={realmCfg.oStops[2]} strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* sclera / eye ring */}
      <ellipse cx="50" cy="51" rx="25" ry="22" fill="#000" />
      <ellipse cx="50" cy="51" rx="23.5" ry="20.5" fill={`url(#${gradSclera})`} />
      <ellipse cx="50" cy="51" rx="18" ry="18" fill={`url(#${gradIris})`} />

      {/* slit pupil (cat / dragon) */}
      <path d="M50 35 C 52.5 43, 52.5 58, 50 68 C 47.5 58, 47.5 43, 50 35 Z" fill="#0a0a0a" />
      <ellipse cx="50" cy="51" rx="3.5" ry="18" fill="#000" />

      {/* eye highlight */}
      <ellipse cx="44" cy="44" rx="4" ry="2.4" fill="#ffffff" opacity="0.75" />
      <circle cx="56" cy="56" r="1.4" fill="#ffffff" opacity="0.55" />

      {/* little scale ridges beneath */}
      <path d="M30 74 C 36 70, 44 70, 50 74" stroke={realmCfg.oStops[2]} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M50 74 C 56 70, 64 70, 70 74" stroke={realmCfg.oStops[2]} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
};
