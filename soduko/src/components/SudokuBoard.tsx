import { cn } from "../utils/cn";
import type { Board, NotesBoard } from "../lib/sudoku";
import type { Theme } from "../themes";
import {
  ClawCorner,
  DragonDigitFiligree,
  DragonHeadWatermark,
} from "./DragonArt";

interface Props {
  board: Board;
  notes: NotesBoard;
  given: boolean[][];
  incorrect: boolean[][];
  conflicts: boolean[][];
  selected: { r: number; c: number } | null;
  lastPlaced: { r: number; c: number; id: number } | null;
  showGuides: boolean;
  onSelect: (r: number, c: number) => void;
  theme: Theme;
}

const COLS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const THIRDS = [1, 2];

export function SudokuBoard({
  board,
  notes,
  given,
  incorrect,
  conflicts,
  selected,
  lastPlaced,
  showGuides,
  onSelect,
  theme,
}: Props) {
  const isDragon = theme.id === "dragon";
  const selectedValue =
    selected && board[selected.r][selected.c] !== 0
      ? board[selected.r][selected.c]
      : null;

  const activeBoxR = selected ? Math.floor(selected.r / 3) : null;
  const activeBoxC = selected ? Math.floor(selected.c / 3) : null;
  const activeBoxIndex =
    activeBoxR !== null && activeBoxC !== null
      ? activeBoxR * 3 + activeBoxC + 1
      : null;

  return (
    <div className="mx-auto w-full max-w-[min(94vw,520px)] lg:max-w-[540px]">
      {/* Board Coordinate & Status Micro-Bar */}
      <div className="mb-1.5 flex items-center justify-between px-1 sm:pl-5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
              isDragon
                ? "border border-amber-700/45 bg-[#1c0b09]/90 text-amber-200"
                : "border border-slate-200 bg-white text-slate-700 shadow-2xs"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                selected
                  ? isDragon
                    ? "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
                    : "bg-blue-600"
                  : "bg-slate-400"
              )}
            />
            {selected ? (
              <span>
                Cell {ROWS[selected.r]}
                {COLS[selected.c]} · Box {activeBoxIndex}
              </span>
            ) : (
              <span>Tap any cell to begin</span>
            )}
          </span>

          {selected && incorrect[selected.r][selected.c] && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                isDragon
                  ? "bg-red-950/90 text-red-300 border border-red-500/40"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              Incorrect entry · Ignored by rules
            </span>
          )}
        </div>

        <span
          className={cn(
            "hidden sm:inline text-[10px] font-medium",
            theme.textMuted
          )}
        >
          {showGuides ? "3×3 Guide Rails Active" : "Standard Grid"}
        </span>
      </div>

      {/* Subtle column guide labels (hidden on narrow phones to maximize cell tap area) */}
      <div className="mb-1 hidden sm:grid grid-cols-9 pl-5 select-none">
        {COLS.map((col, idx) => (
          <span
            key={col}
            className={cn(
              "text-center text-[10px] font-semibold tracking-wider transition-colors",
              selected?.c === idx
                ? isDragon
                  ? "text-amber-300 font-extrabold"
                  : "text-blue-600 font-extrabold"
                : theme.coordText
            )}
          >
            {col}
          </span>
        ))}
      </div>

      <div className="flex items-stretch">
        {/* Subtle row guide labels */}
        <div className="mr-1.5 hidden sm:grid grid-rows-9 w-3.5 select-none">
          {ROWS.map((row, idx) => (
            <span
              key={row}
              className={cn(
                "flex items-center justify-center text-[10px] font-semibold transition-colors",
                selected?.r === idx
                  ? isDragon
                    ? "text-amber-300 font-extrabold"
                    : "text-blue-600 font-extrabold"
                  : theme.coordText
              )}
            >
              {row}
            </span>
          ))}
        </div>

        {/* Main 9x9 Square Board Container */}
        <div className="relative flex-1">
          {isDragon && (
            <>
              <ClawCorner className="pointer-events-none absolute -left-2.5 -top-2.5 z-30 h-9 w-9 sm:h-11 sm:w-11" />
              <ClawCorner
                className="pointer-events-none absolute -right-2.5 -top-2.5 z-30 h-9 w-9 sm:h-11 sm:w-11"
                flipX
              />
              <ClawCorner
                className="pointer-events-none absolute -bottom-2.5 -left-2.5 z-30 h-9 w-9 sm:h-11 sm:w-11"
                flipY
              />
              <ClawCorner
                className="pointer-events-none absolute -bottom-2.5 -right-2.5 z-30 h-9 w-9 sm:h-11 sm:w-11"
                flipX
                flipY
              />
            </>
          )}

          <div
            className={cn(
              "relative aspect-square w-full overflow-hidden rounded-xl",
              theme.boardBg,
              theme.boardBorder,
              theme.boardShadow
            )}
          >
            {/* Etched dragon centerpiece watermark */}
            {isDragon && (
              <DragonHeadWatermark className="pointer-events-none absolute inset-[9%] z-0 opacity-90" />
            )}

            {/* ---- 81 Interactive Grid Cells ---- */}
            <div className="relative z-10 grid h-full w-full grid-cols-9 grid-rows-9">
              {Array.from({ length: 9 }).map((_, r) =>
                Array.from({ length: 9 }).map((_, c) => {
                  const value = board[r][c];
                  const isGiven = given[r][c];
                  const isIncorrect = incorrect[r][c];
                  const isSelected =
                    !!selected && selected.r === r && selected.c === c;
                  const inPeerGroup =
                    showGuides &&
                    !!selected &&
                    !isSelected &&
                    (selected.r === r ||
                      selected.c === c ||
                      (Math.floor(selected.r / 3) === Math.floor(r / 3) &&
                        Math.floor(selected.c / 3) === Math.floor(c / 3)));
                  const isSameNumber =
                    selectedValue !== null &&
                    value === selectedValue &&
                    !isSelected;
                  const isConflict = conflicts[r][c];
                  const altBlock =
                    (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1;
                  const justPlaced =
                    !!lastPlaced && lastPlaced.r === r && lastPlaced.c === c;

                  const bg = isConflict
                    ? theme.cellConflictBg
                    : isIncorrect
                    ? isDragon
                      ? "bg-red-950/75"
                      : "bg-rose-50/95"
                    : isSelected
                    ? theme.cellSelectedBg
                    : isSameNumber
                    ? theme.cellSameNumberBg
                    : inPeerGroup
                    ? theme.cellHighlightBg
                    : altBlock
                    ? theme.cellBgAlt
                    : theme.cellBg;

                  const numClass = isDragon
                    ? isConflict || isIncorrect
                      ? "dragon-conflict"
                      : isGiven
                      ? "dragon-given"
                      : "dragon-user"
                    : isConflict || isIncorrect
                    ? "text-rose-600 font-bold"
                    : isGiven
                    ? theme.cellGivenText
                    : theme.cellUserText;

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => onSelect(r, c)}
                      aria-label={`Row ${ROWS[r]}, Column ${COLS[c]}${
                        value ? `, value ${value}` : ", empty"
                      }${
                        isIncorrect
                          ? ", incorrect entry, excluded from Sudoku rules"
                          : ""
                      }`}
                      aria-invalid={isIncorrect || undefined}
                      title={
                        isIncorrect
                          ? "Incorrect entry. It stays visible so you can fix it, but is ignored by row, column, and 3×3 box rules."
                          : undefined
                      }
                      className={cn(
                        "relative flex min-h-0 min-w-0 items-center justify-center select-none transition-colors duration-100 focus:outline-none",
                        bg,
                        isSelected &&
                          (isDragon
                            ? "ring-2 ring-inset ring-amber-300"
                            : "ring-2 ring-inset ring-blue-600"),
                        !isSelected &&
                          isSameNumber &&
                          (isDragon
                            ? "ring-1 ring-inset ring-amber-400/50"
                            : "ring-1 ring-inset ring-indigo-400/60")
                      )}
                      style={{
                        borderRight:
                          c < 8 ? `1px solid ${theme.guideThin}` : "none",
                        borderBottom:
                          r < 8 ? `1px solid ${theme.guideThin}` : "none",
                      }}
                    >
                      {isIncorrect && (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute right-[3px] top-[3px] z-10 flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-black leading-none",
                              isDragon
                                ? "border border-red-300/70 bg-red-600 text-white shadow-[0_0_8px_rgba(248,113,113,0.85)]"
                                : "border border-white bg-rose-600 text-white shadow-xs"
                            )}
                          >
                            !
                          </span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "pointer-events-none absolute inset-x-2 bottom-[3px] h-[2px] rounded-full",
                              isDragon ? "bg-red-400/75" : "bg-rose-500/75"
                            )}
                          />
                        </>
                      )}

                      {isDragon && isSelected && (
                        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.34),transparent_72%)]" />
                      )}

                      {value !== 0 ? (
                        <>
                          {isDragon && <DragonDigitFiligree isGiven={isGiven} />}
                          <span
                            key={justPlaced ? `p${lastPlaced!.id}` : "v"}
                            className={cn(
                              "relative z-10 leading-none",
                              theme.numberFont,
                              "text-[clamp(1rem,4.3vw,1.95rem)] lg:text-[clamp(1.2rem,2.4vw,1.95rem)]",
                              numClass,
                              justPlaced && "anim-pop"
                            )}
                          >
                            {value}
                          </span>
                        </>
                      ) : (
                        <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-[1.5px] sm:p-[3px]">
                          {Array.from({ length: 9 }, (_, i) => i + 1).map(
                            (n) => {
                              const has = notes[r][c].has(n);
                              const highlightNote =
                                has &&
                                selectedValue !== null &&
                                n === selectedValue;
                              return (
                                <span
                                  key={n}
                                  className={cn(
                                    "flex items-center justify-center rounded-[2px] leading-none font-medium",
                                    "text-[clamp(0.42rem,1.45vw,0.68rem)]",
                                    isDragon
                                      ? theme.numberFont
                                      : "font-classic-num",
                                    has
                                      ? highlightNote
                                        ? isDragon
                                          ? "bg-amber-400/25 text-amber-200 font-bold"
                                          : "bg-blue-600/15 text-blue-700 font-bold"
                                        : isDragon
                                        ? "text-amber-300/75"
                                        : "text-slate-500"
                                      : "text-transparent"
                                  )}
                                >
                                  {n}
                                </span>
                              );
                            }
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* ---- Permanent 3x3 Guide Box Lines & Intersection Diamonds ---- */}
            <div className="pointer-events-none absolute inset-0 z-20">
              {THIRDS.map((t) => (
                <div
                  key={`v-${t}`}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${(t * 100) / 3}%`,
                    width: isDragon ? 2.5 : 2,
                    transform: "translateX(-50%)",
                    background: theme.guideThick,
                    boxShadow: theme.guideGlow || undefined,
                  }}
                />
              ))}
              {THIRDS.map((t) => (
                <div
                  key={`h-${t}`}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${(t * 100) / 3}%`,
                    height: isDragon ? 2.5 : 2,
                    transform: "translateY(-50%)",
                    background: theme.guideThick,
                    boxShadow: theme.guideGlow || undefined,
                  }}
                />
              ))}
              {THIRDS.map((tr) =>
                THIRDS.map((tc) => (
                  <div
                    key={`dot-${tr}-${tc}`}
                    className="absolute rotate-45"
                    style={{
                      top: `${(tr * 100) / 3}%`,
                      left: `${(tc * 100) / 3}%`,
                      width: isDragon ? 7 : 6,
                      height: isDragon ? 7 : 6,
                      transform: "translate(-50%, -50%) rotate(45deg)",
                      background: theme.guideDot,
                      boxShadow: isDragon
                        ? "0 0 10px rgba(251, 191, 36, 0.9)"
                        : undefined,
                    }}
                  />
                ))
              )}
            </div>

            {/* ---- Active Selection Guide Box & Row/Column Guide Rails ---- */}
            {showGuides &&
              selected &&
              activeBoxR !== null &&
              activeBoxC !== null && (
                <div className="pointer-events-none absolute inset-0 z-[22]">
                  {/* Active 3x3 Box Outline */}
                  <div
                    className="absolute rounded-[2px] transition-all duration-150"
                    style={{
                      top: `${activeBoxR * (100 / 3)}%`,
                      left: `${activeBoxC * (100 / 3)}%`,
                      width: `${100 / 3}%`,
                      height: `${100 / 3}%`,
                      boxShadow: `inset 0 0 0 2px ${theme.activeBoxBorder}`,
                    }}
                  />
                  {/* Active Row Rail */}
                  <div
                    className="absolute left-0 right-0 transition-all duration-150"
                    style={{
                      top: `${(selected.r * 100) / 9}%`,
                      height: `${100 / 9}%`,
                      borderTop: `1px dashed ${theme.activeRailBorder}`,
                      borderBottom: `1px dashed ${theme.activeRailBorder}`,
                    }}
                  />
                  {/* Active Column Rail */}
                  <div
                    className="absolute top-0 bottom-0 transition-all duration-150"
                    style={{
                      left: `${(selected.c * 100) / 9}%`,
                      width: `${100 / 9}%`,
                      borderLeft: `1px dashed ${theme.activeRailBorder}`,
                      borderRight: `1px dashed ${theme.activeRailBorder}`,
                    }}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
