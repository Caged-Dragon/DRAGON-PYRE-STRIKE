import { Award, Home, RotateCcw, Trophy } from "lucide-react";
import { cn } from "../utils/cn";
import { DIFFICULTY_META, type Theme } from "../themes";
import type { Difficulty } from "../lib/sudoku";
import { DragonCrestEmblem } from "./DragonArt";

interface Props {
  open: boolean;
  theme: Theme;
  seconds: number;
  mistakes: number;
  hints: number;
  difficulty: Difficulty;
  isBest: boolean;
  onPlayAgain: () => void;
  onMenu: () => void;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function WinModal({
  open,
  theme,
  seconds,
  mistakes,
  hints,
  difficulty,
  isBest,
  onPlayAgain,
  onMenu,
}: Props) {
  const isDragon = theme.id === "dragon";
  const meta =
    DIFFICULTY_META.find((d) => d.id === difficulty) ?? DIFFICULTY_META[0];

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        theme.modalBackdrop
      )}
    >
      <div
        className={cn(
          "anim-pop relative w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center sm:p-7",
          theme.modalBg
        )}
      >
        {isDragon && (
          <div className="scale-pattern pointer-events-none absolute inset-0 opacity-55" />
        )}

        <div className="relative z-10">
          <div
            className={cn(
              "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl",
              isDragon
                ? "border border-amber-400/60 bg-amber-500/15 shadow-[0_0_28px_rgba(245,158,11,0.35)]"
                : "border border-blue-200 bg-blue-50 text-blue-600"
            )}
          >
            {isDragon ? (
              <DragonCrestEmblem className="h-10 w-10" />
            ) : (
              <Trophy className="h-8 w-8" />
            )}
          </div>

          {isBest && (
            <div
              className={cn(
                "mx-auto mb-2.5 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em]",
                theme.premium,
                theme.premiumText
              )}
            >
              <Award className="h-3 w-3" />
              <span>New Personal Best</span>
            </div>
          )}

          <h2
            className={cn(
              "text-2xl font-extrabold",
              isDragon ? "font-dragon-display" : "tracking-tight",
              theme.textPrimary
            )}
          >
            {isDragon ? "Trial Conquered" : "Puzzle Solved"}
          </h2>
          <p className={cn("mt-1 mb-5 text-xs sm:text-sm", theme.textMuted)}>
            {isDragon
              ? `You mastered the ${meta.dragonLabel} grid.`
              : `Completed on ${meta.label} difficulty.`}
          </p>

          <div className="mb-6 grid grid-cols-3 gap-2">
            <StatTile label="Time" value={fmt(seconds)} theme={theme} />
            <StatTile
              label={isDragon ? "Scorches" : "Mistakes"}
              value={String(mistakes)}
              theme={theme}
            />
            <StatTile label="Hints" value={String(hints)} theme={theme} />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onPlayAgain}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.98]",
                theme.btnPrimaryBg,
                theme.btnPrimaryText
              )}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Another {isDragon ? meta.dragonLabel : meta.label}</span>
            </button>

            <button
              type="button"
              onClick={onMenu}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-[0.98]",
                theme.btnSecondaryBg,
                theme.btnSecondaryText
              )}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return to Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: Theme;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-2 py-2.5",
        theme.id === "dragon"
          ? "border border-amber-800/45 bg-black/45"
          : "border border-slate-200 bg-slate-50"
      )}
    >
      <div
        className={cn(
          "text-[9px] font-bold uppercase tracking-wider",
          theme.textMuted
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-base font-extrabold tabular-nums",
          theme.textPrimary
        )}
      >
        {value}
      </div>
    </div>
  );
}
