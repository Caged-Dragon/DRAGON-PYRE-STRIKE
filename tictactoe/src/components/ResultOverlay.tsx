import React from "react";
import { Eye, Handshake, Home, RotateCcw } from "lucide-react";
import { getUiTokens } from "../config/uiTokens";
import type { DragonRealmId, GameMode, Player, ThemeId, WinResult } from "../types/game";
import { GamePiece } from "./Pieces";

interface ResultOverlayProps {
  winResult: WinResult;
  theme: ThemeId;
  realm: DragonRealmId;
  names: Record<Player, string>;
  gameMode: GameMode;
  humanSide: Player;
  compact: boolean;
  onPlayAgain: () => void;
  onMenu: () => void;
  onDismiss: () => void;
  showConfetti?: boolean;
}

const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 6.3 + 4) % 96}%`,
  delay: `${(i % 6) * 0.22}s`,
  dur: `${2.2 + (i % 5) * 0.35}s`,
  size: 5 + (i % 3) * 2,
  round: i % 3 === 0,
}));

export const ResultOverlay: React.FC<ResultOverlayProps> = ({
  winResult,
  theme,
  realm,
  names,
  gameMode,
  humanSide,
  compact,
  onPlayAgain,
  onMenu,
  onDismiss,
  showConfetti = true,
}) => {
  const t = getUiTokens(theme, realm);
  const isDraw = winResult.winner === "draw";
  const winner = isDraw ? null : (winResult.winner as Player);
  const humanLost = gameMode === "ai" && winner !== null && winner !== humanSide;
  const celebrate = showConfetti && !isDraw && !humanLost;

  let eyebrow = "Round over";
  let title = "It's a draw";
  let subtitle = "Every cell claimed — perfectly matched.";

  if (winner) {
    if (gameMode === "ai") {
      eyebrow = humanLost ? "Defeat" : "Victory";
      title = humanLost ? `${names[winner]} wins` : "You win!";
    } else {
      eyebrow = "Victory";
      title = `${names[winner]} wins!`;
    }
    subtitle =
      winResult.reason === "timeout"
        ? "The clock ran out on the opponent."
        : `${winResult.line?.length ?? 3} in a row — clean finish.`;
  }

  const confettiColors = [t.xColor, t.oColor, "#F59E0B", "#10B981", "#8B5CF6"];

  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[1.25rem] animate-overlay-in ${
        t.isDragon ? "bg-black/55" : "bg-white/55"
      } backdrop-blur-[3px]`}
    >
      {celebrate &&
        CONFETTI.map((c, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`animate-confetti absolute top-0 ${c.round ? "rounded-full" : "rounded-[2px]"}`}
            style={
              {
                left: c.left,
                width: `${c.size}px`,
                height: `${c.round ? c.size : c.size * 1.6}px`,
                backgroundColor: confettiColors[i % confettiColors.length],
                "--delay": c.delay,
                "--dur": c.dur,
              } as React.CSSProperties
            }
          />
        ))}

      <div
        role="dialog"
        aria-label="Round result"
        className={`relative mx-3 w-full max-w-[290px] rounded-3xl text-center animate-card-rise ${t.panelSolid} ${
          compact ? "p-3.5" : "p-5"
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-center rounded-2xl ${
            compact ? "h-11 w-11" : "h-14 w-14"
          } ${t.isDragon ? "bg-black/40 ring-1 ring-white/10" : "bg-slate-50 ring-1 ring-slate-200"}`}
          style={
            winner
              ? { boxShadow: `0 12px 30px -12px ${winner === "X" ? t.xColor : t.oColor}` }
              : undefined
          }
        >
          {winner ? (
            <GamePiece
              player={winner}
              theme={theme}
              realm={realm}
              animate={false}
              className="h-[66%] w-[66%]"
            />
          ) : (
            <Handshake className={`h-6 w-6 ${t.accentText}`} />
          )}
        </div>

        <div className={`mt-3 ${t.label}`}>{eyebrow}</div>
        <h3
          className={`mt-0.5 font-extrabold tracking-tight ${t.textStrong} ${t.displayFont} ${
            compact ? "text-lg" : "text-2xl"
          }`}
        >
          {title}
        </h3>
        {!compact && <p className={`mt-1 text-xs ${t.textBody}`}>{subtitle}</p>}

        <div className={`grid grid-cols-2 gap-2 ${compact ? "mt-3" : "mt-4"}`}>
          <button
            type="button"
            onClick={onPlayAgain}
            autoFocus
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${t.primaryBtn}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Play again
          </button>
          <button
            type="button"
            onClick={onMenu}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${t.secondaryBtn}`}
          >
            <Home className="h-3.5 w-3.5" />
            Menu
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer hover:underline ${t.textMuted}`}
        >
          <Eye className="h-3 w-3" />
          View final board
        </button>
      </div>
    </div>
  );
};
