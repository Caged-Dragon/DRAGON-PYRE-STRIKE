import { useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Home,
  Lock,
  Play,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "../utils/cn";
import { exitToHub } from "../dps";
import {
  DIFFICULTY_META,
  THEMES,
  type Theme,
  type ThemeId,
} from "../themes";
import type { Difficulty } from "../lib/sudoku";
import {
  ClassicGridEmblem,
  DifficultyEmblem,
  DragonCrestEmblem,
  RuneRing,
} from "./DragonArt";

interface Props {
  theme: Theme;
  themeId: ThemeId;
  onChooseTheme: (id: ThemeId) => void;
  onStart: (d: Difficulty) => void;
  onContinue?: () => void;
  hasSavedGame: boolean;
  savedSummary?: { difficulty: Difficulty; seconds: number; progress: number };
  bestTimes: Partial<Record<Difficulty, number>>;
  gamesSolved: number;
}

function fmt(sec?: number) {
  if (sec === undefined) return "—";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MenuScreen({
  theme,
  themeId,
  onChooseTheme,
  onStart,
  onContinue,
  hasSavedGame,
  savedSummary,
  bestTimes,
  gamesSolved,
}: Props) {
  const isDragon = themeId === "dragon";
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>("medium");

  const activeDiffMeta =
    DIFFICULTY_META.find((d) => d.id === selectedDiff) ?? DIFFICULTY_META[1];

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col justify-between gap-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold",
            theme.surface
          )}
        >
          <Trophy
            className={cn(
              "h-3.5 w-3.5",
              isDragon ? "text-amber-400" : "text-blue-600"
            )}
          />
          <span className={theme.textSecondary}>
            Solved:{" "}
            <strong className={theme.textPrimary}>{gamesSolved}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => void exitToHub()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-transform active:scale-95",
            isDragon
              ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
              : "border-slate-300 bg-white text-slate-700"
          )}
        >
          <Home className="h-3.5 w-3.5" />
          <span>Realm hub</span>
        </button>
      </div>

      {/* Center Content Stack */}
      <main className="my-auto flex flex-col gap-5 sm:gap-6">
        {/* Hero Header */}
        <div className="anim-slide-up relative flex flex-col items-center text-center">
          {isDragon && (
            <RuneRing className="pointer-events-none absolute -top-14 left-1/2 h-56 w-56 -translate-x-1/2 opacity-65 sm:h-68 sm:w-68" />
          )}

          <div
            className={cn(
              "relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16",
              isDragon
                ? "bg-[linear-gradient(145deg,#2c110d,#140605)] border border-amber-500/60 shadow-[0_0_32px_rgba(245,158,11,0.35)]"
                : "bg-white border border-slate-200/90 shadow-md"
            )}
          >
            {isDragon ? (
              <DragonCrestEmblem className="h-9 w-9 sm:h-10 sm:w-10" />
            ) : (
              <ClassicGridEmblem className="h-8 w-8 sm:h-9 sm:w-9" />
            )}
          </div>

          <h1
            className={cn(
              "text-3xl font-extrabold sm:text-5xl",
              isDragon ? "font-dragon-display text-amber-50" : "text-slate-900 tracking-tight"
            )}
          >
            SUDOKU
          </h1>
          <p
            className={cn(
              "mt-1.5 max-w-md text-xs sm:text-sm",
              theme.textMuted
            )}
          >
            {isDragon
              ? "Ancient obsidian grid forged in dragonfire — master each trial of the hoard."
              : "Crisp 9×9 logic puzzles with precision guide lines and seamless controls."}
          </p>
        </div>

        {/* Step 1: Theme / Edition Selector */}
        <section
          aria-label="Theme edition"
          className={cn(
            "anim-slide-up rounded-2xl p-4 sm:p-5",
            theme.surface
          )}
          style={{ animationDelay: "60ms" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-[0.14em]",
                theme.textMuted
              )}
            >
              1 · Select Theme Edition
            </span>
            <span className={cn("text-[11px]", theme.textMuted)}>
              Switch anytime in-game
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["classic", "dragon"] as ThemeId[]).map((id) => {
              const t = THEMES[id];
              const active = id === themeId;
              const locked = false;
              const cardDragon = id === "dragon";

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChooseTheme(id)}
                  className={cn(
                    "group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all active:scale-[0.99]",
                    cardDragon
                      ? "bg-[linear-gradient(135deg,#240d0b_0%,#120505_100%)]"
                      : "bg-gradient-to-br from-white via-slate-50/70 to-blue-50/50",
                    active
                      ? cardDragon
                        ? "border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_26px_-4px_rgba(245,158,11,0.4)]"
                        : "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                      : cardDragon
                      ? "border-amber-700/40 hover:border-amber-500/80"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {cardDragon && (
                    <span className="scale-pattern pointer-events-none absolute inset-0 opacity-60" />
                  )}

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {cardDragon ? (
                        <DragonCrestEmblem className="h-5 w-5 shrink-0" />
                      ) : (
                        <ClassicGridEmblem className="h-5 w-5 shrink-0" />
                      )}
                      <span
                        className={cn(
                          "truncate text-sm font-bold sm:text-base",
                          cardDragon
                            ? "font-dragon-title text-amber-50"
                            : "text-slate-900"
                        )}
                      >
                        {t.name}
                      </span>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#1a0806]">
                          <Lock className="h-2.5 w-2.5" />
                          Pro
                        </span>
                      ) : active ? (
                        <CheckCircle2
                          className={cn(
                            "h-4 w-4 shrink-0",
                            cardDragon ? "text-amber-400" : "text-blue-600"
                          )}
                        />
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        cardDragon ? "text-amber-200/70" : "text-slate-500"
                      )}
                    >
                      {t.tagline}
                    </p>
                  </div>

                  {/* Crisp Mini 3x3 Preview Tile */}
                  <div
                    className={cn(
                      "relative z-10 grid h-14 w-14 shrink-0 grid-cols-3 gap-[1.5px] rounded-lg p-1",
                      cardDragon
                        ? "border border-amber-500/60 bg-amber-500/35"
                        : "border border-slate-700/70 bg-slate-300"
                    )}
                  >
                    {[5, 0, 9, 0, 3, 0, 8, 0, 2].map((num, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-center rounded-[2px] text-[9px] font-bold leading-none",
                          cardDragon
                            ? "bg-[#170807] text-amber-300 font-dragon-num"
                            : "bg-white text-slate-800 font-classic-num"
                        )}
                      >
                        {num || ""}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Select Level & Start */}
        <section
          aria-label="Select difficulty level"
          className={cn(
            "anim-slide-up rounded-2xl p-4 sm:p-5",
            theme.surface
          )}
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-[0.14em]",
                theme.textMuted
              )}
            >
              2 · {isDragon ? "Choose Your Trial Level" : "Choose Difficulty Level"}
            </span>
            <span className={cn("text-xs font-medium", theme.textSecondary)}>
              {activeDiffMeta.clues} initial clues
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {DIFFICULTY_META.map((d) => {
              const isSelected = selectedDiff === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDiff(d.id)}
                  onDoubleClick={() => onStart(d.id)}
                  className={cn(
                    "group relative flex flex-col items-center rounded-xl border p-3.5 text-center transition-all active:scale-[0.98]",
                    isDragon
                      ? isSelected
                        ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/40 shadow-[0_0_24px_-6px_rgba(251,191,36,0.45)]"
                        : "border-amber-800/45 bg-[#160807]/80 hover:border-amber-600/80"
                      : isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  )}
                >
                  <DifficultyEmblem
                    difficulty={d.id}
                    isDragon={isDragon}
                    className="mb-2 h-10 w-10 transition-transform duration-200 group-hover:scale-105"
                  />

                  <span
                    className={cn(
                      "text-sm font-bold",
                      theme.titleFont,
                      theme.textPrimary
                    )}
                  >
                    {isDragon ? d.dragonLabel : d.label}
                  </span>

                  <span className={cn("mt-0.5 text-[11px]", theme.textMuted)}>
                    {isDragon ? d.dragonDesc : d.desc}
                  </span>

                  {/* Intensity Pip Bar */}
                  <div className="mt-2.5 flex items-center gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <span
                        key={step}
                        className={cn(
                          "h-1 w-3.5 rounded-full transition-colors",
                          step <= d.tier
                            ? isDragon
                              ? "bg-amber-400"
                              : "bg-blue-600"
                            : isDragon
                            ? "bg-amber-950"
                            : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>

                  <div
                    className={cn(
                      "mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                      isDragon
                        ? "bg-black/45 text-amber-200/80"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <Award className="h-2.5 w-2.5 opacity-75" />
                    <span>Best {fmt(bestTimes[d.id])}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Primary Start & Optional Continue Buttons */}
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => onStart(selectedDiff)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold tracking-wide transition-all active:scale-[0.99]",
                theme.btnPrimaryBg,
                theme.btnPrimaryText
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isDragon
                  ? `Start ${activeDiffMeta.dragonLabel} Trial`
                  : `Start ${activeDiffMeta.label} Game`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {hasSavedGame && onContinue && savedSummary && (
              <button
                type="button"
                onClick={onContinue}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.99]",
                  theme.btnSecondaryBg,
                  theme.btnSecondaryText
                )}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>
                  Continue ({savedSummary.difficulty.toUpperCase()} ·{" "}
                  {fmt(savedSummary.seconds)} · {savedSummary.progress}%)
                </span>
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Subtle Footer Hint */}
      <footer className="text-center">
        <p className={cn("text-xs", theme.textMuted)}>
          Supports touch, mouse, and full keyboard controls (1–9, Arrows, N for
          Notes, Z for Undo, H for Hint)
        </p>
      </footer>
    </div>
  );
}
