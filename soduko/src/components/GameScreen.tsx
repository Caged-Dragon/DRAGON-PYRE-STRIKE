import {
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Flame,
  Grid3X3,
  MoonStar,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "../utils/cn";
import { DIFFICULTY_META, type Theme, type ThemeId } from "../themes";
import { SudokuBoard } from "./SudokuBoard";
import { NumberPad } from "./NumberPad";
import {
  ClassicGridEmblem,
  DifficultyEmblem,
  DragonCrestEmblem,
} from "./DragonArt";
import type { useSudokuGame } from "../hooks/useSudokuGame";

type Game = ReturnType<typeof useSudokuGame>;

interface Props {
  game: Game;
  theme: Theme;
  themeId: ThemeId;
  onMenu: () => void;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function GameScreen({
  game,
  theme,
  themeId,
  onMenu,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
}: Props) {
  const isDragon = themeId === "dragon";
  const meta =
    DIFFICULTY_META.find((d) => d.id === game.difficulty) ?? DIFFICULTY_META[0];
  const progress = Math.round((game.filledCount / 81) * 100);

  const activeDigit =
    game.selected && game.board[game.selected.r][game.selected.c] !== 0
      ? game.board[game.selected.r][game.selected.c]
      : null;

  const completedDigitsCount = game.remaining
    .slice(1)
    .filter((left, idx) => left === 0 && (game.wrongCounts?.[idx + 1] ?? 0) === 0)
    .length;

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5">
      {/* Subtle Screen-Edge Placement Feedback */}
      {game.flash && (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-40 transition-opacity duration-300",
            game.flash === "bad"
              ? isDragon
                ? "bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(220,38,38,0.42)_100%)]"
                : "bg-[radial-gradient(ellipse_at_center,transparent_62%,rgba(244,63,94,0.22)_100%)]"
              : isDragon
              ? "bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(245,158,11,0.22)_100%)]"
              : "bg-[radial-gradient(ellipse_at_center,transparent_70%,rgba(37,99,235,0.1)_100%)]"
          )}
        />
      )}

      {/* ---------- Top Navigation Header ---------- */}
      <header
        className={cn(
          "flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3",
          theme.surface
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenu}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95 sm:px-3 sm:py-2 sm:text-sm",
              theme.btnSecondaryBg,
              theme.btnSecondaryText
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Menu</span>
          </button>

          <div className="flex items-center gap-2.5">
            <DifficultyEmblem
              difficulty={game.difficulty}
              isDragon={isDragon}
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
            />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-bold sm:text-base",
                    theme.titleFont,
                    theme.textPrimary
                  )}
                >
                  {isDragon ? meta.dragonLabel : meta.label}
                </span>
                <span
                  className={cn(
                    "hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    game.incorrectCount > 0
                      ? isDragon
                        ? "bg-red-950/90 text-red-300 border border-red-500/40"
                        : "bg-rose-100 text-rose-700"
                      : isDragon
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/35"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}
                >
                  {game.incorrectCount > 0 ? (
                    <>
                      <CircleAlert className="h-2.5 w-2.5" />
                      {game.incorrectCount} to fix
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Clean board
                    </>
                  )}
                </span>
              </div>
              <div className={cn("text-[10px]", theme.textMuted)}>
                {isDragon ? "Dragon Cave Edition" : "Classic Sudoku"} ·{" "}
                {completedDigitsCount}/9 digits complete
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound effects toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? "Mute entry sounds" : "Enable entry sounds"}
            aria-label={
              soundEnabled ? "Mute sound effects" : "Enable sound effects"
            }
            aria-pressed={soundEnabled}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 sm:h-9 sm:w-9",
              soundEnabled
                ? isDragon
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                  : "border-blue-200 bg-blue-50 text-blue-700"
                : cn(theme.btnSecondaryBg, theme.textMuted)
            )}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {/* Guide Lines Toggle */}
          <button
            type="button"
            onClick={() => game.setShowGuides(!game.showGuides)}
            title="Toggle active guide box & row/column rails"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95 sm:px-3 sm:py-2",
              game.showGuides
                ? cn(theme.accentSoft)
                : cn(theme.btnSecondaryBg, theme.textMuted)
            )}
          >
            <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden md:inline">Guides</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95 sm:px-3.5 sm:py-2",
              isDragon
                ? cn(theme.btnSecondaryBg, theme.btnSecondaryText)
                : "bg-[linear-gradient(100deg,#1e0b09,#32120e)] text-amber-100 border border-amber-500/60 shadow-sm hover:brightness-110"
            )}
          >
            {isDragon ? (
              <>
                <ClassicGridEmblem className="h-4 w-4" />
                <span>Classic</span>
              </>
            ) : (
              <>
                <DragonCrestEmblem className="h-4 w-4" />
                <span>Dragon</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ---------- Live Telemetry Strip ---------- */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 sm:px-5",
          theme.surface
        )}
      >
        <div className="flex items-center gap-4 sm:gap-7">
          {/* Timer + Quick Pause */}
          <button
            type="button"
            onClick={() => game.setPaused(!game.paused)}
            className="group inline-flex items-center gap-2 text-left focus:outline-none"
            title={game.paused ? "Resume timer" : "Pause timer"}
          >
            <Timer
              className={cn(
                "h-4 w-4",
                isDragon ? "text-amber-400" : "text-blue-600"
              )}
            />
            <div>
              <div
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  theme.textMuted
                )}
              >
                Time
              </div>
              <div
                className={cn(
                  "text-sm sm:text-base font-extrabold tabular-nums leading-tight",
                  theme.textPrimary
                )}
              >
                {formatTime(game.seconds)}
              </div>
            </div>
          </button>

          <div className={cn("h-6 w-px", theme.divider)} />

          {/* To Fix / Mistakes */}
          <div className="inline-flex items-center gap-2">
            <ShieldAlert
              className={cn(
                "h-4 w-4",
                game.incorrectCount > 0
                  ? isDragon
                    ? "text-red-400"
                    : "text-rose-500"
                  : theme.textMuted
              )}
            />
            <div>
              <div
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  theme.textMuted
                )}
              >
                {isDragon ? "To Mend" : "To Fix"}
              </div>
              <div
                className={cn(
                  "text-sm sm:text-base font-extrabold tabular-nums leading-tight",
                  game.incorrectCount > 0
                    ? isDragon
                      ? "text-red-400"
                      : "text-rose-600"
                    : theme.textPrimary
                )}
              >
                {game.incorrectCount}
                <span
                  className={cn(
                    "ml-1 text-[10px] font-medium",
                    theme.textMuted
                  )}
                >
                  ({game.mistakes} total)
                </span>
              </div>
            </div>
          </div>

          <div className={cn("h-6 w-px", theme.divider)} />

          {/* Hints */}
          <div className="inline-flex items-center gap-2">
            <Flame
              className={cn(
                "h-4 w-4",
                isDragon ? "text-amber-400/80" : "text-indigo-500"
              )}
            />
            <div>
              <div
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  theme.textMuted
                )}
              >
                Hints
              </div>
              <div
                className={cn(
                  "text-sm sm:text-base font-extrabold tabular-nums leading-tight",
                  theme.textPrimary
                )}
              >
                {game.hintsUsed}
              </div>
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="flex min-w-[140px] flex-1 sm:max-w-[260px] flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className={theme.textMuted}>Verified Cells</span>
            <span className={cn("tabular-nums font-bold", theme.textPrimary)}>
              {game.filledCount}/81 ({progress}%)
            </span>
          </div>
          <div
            className={cn(
              "h-2 w-full overflow-hidden rounded-full",
              isDragon
                ? "bg-black/55 border border-amber-900/40"
                : "bg-slate-200/90"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isDragon
                  ? "bg-[linear-gradient(90deg,#f59e0b,#ea580c)] shadow-[0_0_10px_rgba(249,115,22,0.7)]"
                  : "bg-blue-600"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ---------- Standard Responsive Workspace (Board + Command Sidebar) ---------- */}
      <div className="my-auto flex flex-col items-center justify-center gap-4 lg:flex-row lg:items-start lg:gap-8">
        {/* Left: 9x9 Sudoku Board */}
        <div className="relative w-full lg:w-auto lg:flex-1">
          <SudokuBoard
            board={game.board}
            notes={game.notes}
            given={game.given}
            incorrect={game.incorrect}
            conflicts={game.conflicts}
            selected={game.selected}
            lastPlaced={game.lastPlaced}
            showGuides={game.showGuides}
            onSelect={(r, c) => game.setSelected({ r, c })}
            theme={theme}
          />

          {/* Board Legend & Rule Behavior Callout */}
          <div
            className={cn(
              "mx-auto mt-2.5 flex w-full max-w-[min(94vw,520px)] lg:max-w-[540px] flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-[10px] sm:text-[11px]",
              isDragon
                ? "border border-amber-800/40 bg-[#170807]/85 text-amber-100/80"
                : "border border-slate-200/90 bg-white/90 text-slate-600 shadow-2xs"
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-xs",
                    isDragon ? "bg-amber-400" : "bg-slate-800"
                  )}
                />
                Given
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-xs",
                    isDragon ? "bg-orange-400" : "bg-blue-600"
                  )}
                />
                Correct Entry
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-rose-600 text-[7px] font-black text-white">
                  !
                </span>
                Wrong Entry (visible to fix, ignored by rules)
              </span>
            </div>

            {game.incorrectCount > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isDragon
                    ? "bg-red-950 text-red-200 border border-red-500/40"
                    : "bg-rose-100 text-rose-700"
                )}
              >
                {game.incorrectCount} to fix
              </span>
            )}
          </div>

          {/* Pause Overlay Veil */}
          {game.paused && !game.won && (
            <div
              className={cn(
                "absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center",
                isDragon
                  ? "bg-[#0e0404]/92 backdrop-blur-md border border-amber-600/40"
                  : "bg-white/94 backdrop-blur-md border border-slate-200"
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl",
                  isDragon
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/40"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                )}
              >
                <MoonStar className="h-7 w-7" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold",
                  theme.titleFont,
                  theme.textPrimary
                )}
              >
                {isDragon ? "The Dragon Slumbers" : "Game Paused"}
              </h2>
              <p className={cn("max-w-xs text-xs", theme.textMuted)}>
                Timer paused at {formatTime(game.seconds)}. Resume whenever you
                are ready to continue solving.
              </p>
              <button
                type="button"
                onClick={() => game.setPaused(false)}
                className={cn(
                  "mt-1 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all active:scale-95",
                  theme.btnPrimaryBg,
                  theme.btnPrimaryText
                )}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Resume Game</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Controls & Keypad Sidebar */}
        <aside
          aria-label="Sudoku keypad and controls"
          className={cn(
            "flex w-full max-w-[min(94vw,520px)] flex-col gap-3.5 rounded-2xl p-3.5 sm:p-4 lg:w-[356px] lg:max-w-none lg:shrink-0",
            theme.surface
          )}
        >
          {/* Quick Level Switcher */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.14em]",
                  theme.textMuted
                )}
              >
                Level
              </span>
              <span className={cn("text-[10px]", theme.textMuted)}>
                Starts fresh board
              </span>
            </div>
            <div
              className={cn(
                "grid grid-cols-4 gap-1 rounded-xl p-1",
                isDragon
                  ? "bg-black/45 border border-amber-900/40"
                  : "bg-slate-100"
              )}
            >
              {DIFFICULTY_META.map((d) => {
                const active = d.id === game.difficulty;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => game.newGame(d.id)}
                    className={cn(
                      "truncate rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-all",
                      active
                        ? isDragon
                          ? "bg-amber-500 text-[#1a0806] font-bold shadow-xs"
                          : "bg-white text-slate-900 font-bold shadow-xs"
                        : isDragon
                        ? "text-amber-200/70 hover:text-amber-100"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {isDragon ? d.dragonLabel.split(" ")[0] : d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={cn("h-px w-full", theme.divider)} />

          {/* Number Pad & Candidate Tools */}
          <NumberPad
            onNumber={game.placeNumber}
            onErase={game.erase}
            onUndo={game.undo}
            onHint={game.hint}
            onAutoNotes={game.autoFillNotes}
            onToggleNotes={() => game.setNotesMode(!game.notesMode)}
            canUndo={game.canUndo}
            notesMode={game.notesMode}
            activeDigit={activeDigit}
            remaining={game.remaining}
            placedCounts={game.placedCounts}
            wrongCounts={game.wrongCounts}
            theme={theme}
          />

          <div className={cn("h-px w-full", theme.divider)} />

          {/* Session Controls */}
          <div className="grid grid-cols-3 gap-2">
            <SessionButton
              label={game.paused ? "Resume" : "Pause"}
              icon={
                game.paused ? (
                  <Play className="h-3.5 w-3.5" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )
              }
              onClick={() => game.setPaused(!game.paused)}
              theme={theme}
            />
            <SessionButton
              label="Restart"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={game.restart}
              theme={theme}
            />
            <SessionButton
              label="New Board"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => game.newGame(game.difficulty)}
              theme={theme}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SessionButton({
  label,
  icon,
  onClick,
  theme,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  theme: Theme;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all active:scale-95",
        theme.btnSecondaryBg,
        theme.btnSecondaryText
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
