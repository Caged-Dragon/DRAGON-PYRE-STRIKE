import {
  Check,
  CircleAlert,
  Eraser,
  Flame,
  PencilLine,
  Sparkles,
  Undo2,
  WandSparkles,
} from "lucide-react";
import { cn } from "../utils/cn";
import type { Theme } from "../themes";
import { DragonDigitFiligree } from "./DragonArt";

interface Props {
  onNumber: (n: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onAutoNotes: () => void;
  onUndo: () => void;
  onHint: () => void;
  canUndo: boolean;
  notesMode: boolean;
  activeDigit: number | null;
  remaining: number[];
  placedCounts?: number[];
  wrongCounts?: number[];
  theme: Theme;
}

export function NumberPad({
  onNumber,
  onErase,
  onToggleNotes,
  onAutoNotes,
  onUndo,
  onHint,
  canUndo,
  notesMode,
  activeDigit,
  remaining,
  placedCounts,
  wrongCounts,
  theme,
}: Props) {
  const isDragon = theme.id === "dragon";

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Primary Action Tools */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <PadAction
          label="Undo"
          shortcut="Z"
          icon={<Undo2 className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
          onClick={onUndo}
          disabled={!canUndo}
          theme={theme}
        />
        <PadAction
          label="Erase"
          shortcut="Del"
          icon={<Eraser className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
          onClick={onErase}
          theme={theme}
        />
        <PadAction
          label="Notes"
          shortcut="N"
          badge={notesMode ? "ON" : "OFF"}
          icon={<PencilLine className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
          onClick={onToggleNotes}
          active={notesMode}
          theme={theme}
        />
        <PadAction
          label="Hint"
          shortcut="H"
          icon={
            isDragon ? (
              <Flame className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-amber-400" />
            ) : (
              <Sparkles className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-blue-600" />
            )
          }
          onClick={onHint}
          theme={theme}
        />
      </div>

      {/* Availability Header Label */}
      <div className="flex items-center justify-between px-0.5">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.14em]",
            theme.textMuted
          )}
        >
          {isDragon ? "Runestone Keypad" : "Number Keypad"}
        </span>
        <span className={cn("text-[10px] font-medium", theme.textMuted)}>
          {notesMode ? "Pencil candidate mode" : "Shows remaining of 9"}
        </span>
      </div>

      {/* 1–9 Number Keycaps / Runestones (9-across on mobile, 3x3 keypad on desktop) */}
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5 lg:grid-cols-3 lg:gap-2.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
          const left = Math.max(0, remaining[n] ?? 0);
          const placed = Math.min(9, placedCounts ? placedCounts[n] ?? 9 - left : 9 - left);
          const wrongForDigit = wrongCounts ? wrongCounts[n] ?? 0 : 0;
          const allPlaced = left === 0;
          const fullyVerified = allPlaced && wrongForDigit === 0;
          const isMatched = activeDigit === n;
          const fillPct = Math.min(100, Math.round((placed / 9) * 100));

          return (
            <button
              key={n}
              type="button"
              onClick={() => !fullyVerified && onNumber(n)}
              disabled={fullyVerified}
              aria-label={`Number ${n}, ${left} remaining${
                wrongForDigit > 0 ? `, ${wrongForDigit} incorrect on board` : ""
              }`}
              className={cn(
                "group relative flex flex-col items-center justify-between overflow-hidden rounded-xl px-1 pt-1.5 pb-1.5 sm:pt-2 sm:pb-2 lg:aspect-[1.12/1] lg:p-2 select-none focus:outline-none transition-all",
                theme.keySurface,
                fullyVerified &&
                  (isDragon
                    ? "cursor-default opacity-45 border-emerald-500/35 shadow-none"
                    : "cursor-default opacity-50 border-emerald-300 bg-slate-50 shadow-none"),
                isMatched &&
                  !fullyVerified &&
                  (isDragon
                    ? "ring-2 ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.4)]"
                    : "ring-2 ring-blue-600 bg-blue-50/80")
              )}
            >
              {isDragon && !fullyVerified && (
                <>
                  <DragonDigitFiligree isGiven />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-xl bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.24),transparent_70%)] opacity-80 transition-opacity group-hover:opacity-100" />
                </>
              )}

              {/* Top status corner on desktop (placed / 9) */}
              <div className="relative z-10 hidden lg:flex w-full items-center justify-between text-[9px] font-bold leading-none">
                <span
                  className={cn(
                    "tabular-nums",
                    isDragon ? "text-amber-300/60" : "text-slate-400"
                  )}
                >
                  {placed}/9
                </span>
                {fullyVerified ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase",
                      isDragon
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[2.8]" />
                    Done
                  </span>
                ) : wrongForDigit > 0 ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase",
                      isDragon
                        ? "bg-red-950/90 text-red-300 border border-red-500/40"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    <CircleAlert className="h-2.5 w-2.5" />
                    Fix
                  </span>
                ) : null}
              </div>

              {/* Primary Digit Numeral */}
              <span
                className={cn(
                  "relative z-10 leading-none my-auto",
                  theme.numberFont,
                  "text-base sm:text-xl lg:text-[26px]",
                  isDragon
                    ? fullyVerified
                      ? "text-amber-200/45"
                      : notesMode
                      ? "text-amber-200"
                      : "dragon-given"
                    : fullyVerified
                    ? "text-slate-400 font-bold"
                    : notesMode
                    ? "text-blue-600 font-semibold"
                    : cn("font-bold", theme.keyText)
                )}
              >
                {n}
              </span>

              {/* Explicit Availability Footer + Mini Progress Bar */}
              <div className="relative z-10 mt-1 flex w-full flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex items-center justify-center gap-0.5 rounded-full px-1 lg:px-2 py-[1px] text-[8px] sm:text-[9px] lg:text-[10px] font-bold tabular-nums leading-none",
                    fullyVerified
                      ? isDragon
                        ? "text-emerald-300"
                        : "text-emerald-600"
                      : allPlaced && wrongForDigit > 0
                      ? isDragon
                        ? "text-red-300"
                        : "text-rose-600"
                      : isDragon
                      ? "bg-black/40 text-amber-200/90"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {fullyVerified ? (
                    <>
                      <Check className="h-2.5 w-2.5 stroke-[2.8]" />
                      <span className="hidden lg:inline">0 left</span>
                    </>
                  ) : (
                    <>
                      <span>{left}</span>
                      <span className="hidden lg:inline opacity-80">left</span>
                    </>
                  )}
                </span>

                {/* Mini 9-count fill bar */}
                <div
                  className={cn(
                    "h-1 w-full overflow-hidden rounded-full",
                    isDragon ? "bg-black/60" : "bg-slate-200/90"
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      fullyVerified
                        ? "bg-emerald-500"
                        : wrongForDigit > 0
                        ? "bg-rose-500"
                        : isDragon
                        ? "bg-amber-400"
                        : "bg-blue-600"
                    )}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Auto-Candidate helper */}
      <button
        type="button"
        onClick={onAutoNotes}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.99]",
          theme.accentSoft
        )}
      >
        <WandSparkles className="h-3.5 w-3.5 shrink-0" />
        <span>Auto-fill candidate notes</span>
      </button>
    </div>
  );
}

function PadAction({
  label,
  shortcut,
  badge,
  icon,
  onClick,
  theme,
  active,
  disabled,
}: {
  label: string;
  shortcut?: string;
  badge?: string;
  icon: React.ReactNode;
  onClick: () => void;
  theme: Theme;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 sm:py-2.5 transition-all active:scale-95 focus:outline-none",
        active
          ? cn(theme.btnPrimaryBg, theme.btnPrimaryText)
          : cn(theme.btnSecondaryBg, theme.btnSecondaryText),
        disabled && "cursor-not-allowed opacity-40 active:scale-100"
      )}
    >
      {badge && (
        <span
          className={cn(
            "absolute right-1.5 top-1 rounded px-1 py-[1px] text-[8px] font-extrabold tracking-wider",
            active
              ? "bg-white/25 text-white"
              : theme.id === "dragon"
              ? "bg-amber-950/90 text-amber-300/80"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {badge}
        </span>
      )}
      {icon}
      <div className="flex items-center gap-1">
        <span className="text-[10px] sm:text-[11px] font-semibold leading-none">
          {label}
        </span>
        {shortcut && (
          <kbd className="hidden xl:inline-block rounded bg-black/5 px-1 py-[1px] text-[8px] font-mono opacity-60">
            {shortcut}
          </kbd>
        )}
      </div>
    </button>
  );
}
