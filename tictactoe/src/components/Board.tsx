import React, { useId, useRef, useState } from "react";
import { DRAGON_REALMS } from "../config/dragonRealms";
import type {
  BoardSize,
  CellValue,
  DragonRealmId,
  Player,
  ThemeId,
  WinResult,
} from "../types/game";
import { getStrikeCoordinates, indexToCoord } from "../utils/gameLogic";
import { DragonSilhouette } from "./DragonSilhouette";
import { GamePiece } from "./Pieces";

interface BoardProps {
  board: CellValue[];
  boardSize: BoardSize;
  boardSizePx: number;
  currentPlayer: Player;
  theme: ThemeId;
  realm: DragonRealmId;
  winResult: WinResult | null;
  lastMoveIndex: number | null;
  hintIndex: number | null;
  nextVanishIndex: number | null;
  disabled: boolean;
  onCellClick: (index: number) => void;
  /** Show A1-style labels on empty cells (when the cells are big enough). */
  showCoordinates?: boolean;
  /** Mark the most recent move with a small dot. */
  highlightLastMove?: boolean;
}

const CORNERS = [
  "left-2 top-2 rounded-tl-md border-l-2 border-t-2",
  "right-2 top-2 rounded-tr-md border-r-2 border-t-2",
  "bottom-2 left-2 rounded-bl-md border-b-2 border-l-2",
  "bottom-2 right-2 rounded-br-md border-b-2 border-r-2",
];

export const Board: React.FC<BoardProps> = ({
  board,
  boardSize,
  boardSizePx,
  currentPlayer,
  theme,
  realm,
  winResult,
  lastMoveIndex,
  hintIndex,
  nextVanishIndex,
  disabled,
  onCellClick,
  showCoordinates = true,
  highlightLastMove = true,
}) => {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const strikeGradId = `strike-grad-${useId().replace(/:/g, "")}`;

  const isDragon = theme === "dragon";
  const realmCfg = DRAGON_REALMS[realm];
  const winningSet = new Set(winResult?.line ?? []);
  const totalCells = boardSize * boardSize;
  const showCoords = showCoordinates && boardSizePx / boardSize >= 60;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % totalCells;
    else if (e.key === "ArrowLeft") next = (idx + totalCells - 1) % totalCells;
    else if (e.key === "ArrowDown") next = (idx + boardSize) % totalCells;
    else if (e.key === "ArrowUp") next = (idx + totalCells - boardSize) % totalCells;
    else return;

    e.preventDefault();
    cellRefs.current[next]?.focus();
  };

  const strikeCoords =
    winResult && winResult.line && winResult.line.length >= 2
      ? getStrikeCoordinates(winResult.line, boardSize)
      : null;

  const padPx = Math.max(6, Math.min(13, Math.round(boardSizePx * 0.028)));
  const gapPx = Math.max(5, Math.min(12, Math.round((boardSizePx / boardSize) * 0.09)));

  // Realm colours are raw CSS values, so they are applied through style / CSS variables.
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
    padding: `${padPx}px`,
    gap: `${gapPx}px`,
    ...(isDragon
      ? ({
          background: realmCfg.boardBg,
          boxShadow: realmCfg.boardShadow,
          ["--cell-idle" as string]: realmCfg.cellIdleBg,
          ["--cell-hover" as string]: realmCfg.cellHoverBg,
          ["--cell-win" as string]: realmCfg.cellWinBg,
          ["--cell-glow" as string]: realmCfg.panelBorderGlow,
        } as React.CSSProperties)
      : {}),
  };

  return (
    <div
      style={{ width: `${boardSizePx}px`, height: `${boardSizePx}px`, maxWidth: "100%" }}
      className="relative aspect-square shrink-0 select-none transition-[width,height] duration-150 ease-out"
    >
      {isDragon && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-1.5 rounded-[1.45rem] border ${realmCfg.boardBorder} opacity-65 transition-colors duration-300`}
        />
      )}

      <div
        role="grid"
        aria-label={`${boardSize} by ${boardSize} Tic-Tac-Toe board`}
        style={gridStyle}
        className={`relative grid h-full w-full overflow-hidden rounded-[1.25rem] border transition-colors duration-300 ${
          isDragon
            ? realmCfg.boardBorder
            : "bg-gradient-to-b from-slate-100 to-slate-200/80 border-slate-200 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4),inset_0_1px_0_rgba(255,255,255,0.9)]"
        }`}
      >
        {isDragon && (
          <>
            {/* Dragon head watermark */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <DragonSilhouette realm={realm} className="h-[84%] w-[84%] opacity-90" />
            </div>
            {/* Scale texture */}
            <div
              aria-hidden="true"
              className="dragon-panel-scales pointer-events-none absolute inset-0 opacity-80"
            />
            {/* Inner vignette */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            {/* Heraldic corner flourishes */}
            {CORNERS.map((pos) => (
              <span
                key={pos}
                aria-hidden="true"
                className={`pointer-events-none absolute h-5 w-5 ${pos}`}
                style={{ borderColor: `${realmCfg.panelBorderGlow}80` }}
              />
            ))}
          </>
        )}

        {board.map((cell, idx) => {
          const row = Math.floor(idx / boardSize) + 1;
          const col = (idx % boardSize) + 1;
          const coord = indexToCoord(idx, boardSize);
          const isWinningCell = winningSet.has(idx);
          const isInteractive = !disabled && cell === null && !winResult;
          const showGhost = isInteractive && hoveredCell === idx;
          const isHint = isInteractive && hintIndex === idx;
          const isLastMove = cell !== null && lastMoveIndex === idx && !winResult;
          const isVanishingNext = cell !== null && nextVanishIndex === idx && !winResult;

          let cellSurface: string;
          if (isDragon) {
            if (isWinningCell) {
              cellSurface = "bg-[var(--cell-win)] border-white/30 ring-2 ring-white/15";
            } else if (isHint) {
              cellSurface =
                "bg-amber-500/20 border-amber-300 ring-2 ring-amber-400/60 cursor-pointer";
            } else if (isInteractive) {
              cellSurface =
                "bg-[var(--cell-idle)] border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[var(--cell-hover)] hover:border-white/25 hover:shadow-[0_0_18px_-6px_var(--cell-glow)] cursor-pointer active:scale-[0.97]";
            } else {
              cellSurface =
                "bg-[var(--cell-idle)] border-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] cursor-default";
            }
          } else if (isWinningCell) {
            cellSurface =
              winResult?.winner === "X"
                ? "bg-blue-50 border-blue-300"
                : "bg-rose-50 border-rose-300";
          } else if (isHint) {
            cellSurface =
              "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/40 cursor-pointer";
          } else if (isInteractive) {
            cellSurface =
              "bg-white border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04),inset_0_-3px_0_rgba(15,23,42,0.04)] hover:-translate-y-px hover:border-blue-200 hover:shadow-[0_10px_20px_-12px_rgba(37,99,235,0.5)] cursor-pointer active:scale-[0.97]";
          } else {
            cellSurface =
              "bg-white border-slate-200/80 shadow-[inset_0_-3px_0_rgba(15,23,42,0.04)] cursor-default";
          }

          const statusLabel = cell
            ? isVanishingNext
              ? `occupied by ${cell}, next to vanish`
              : `occupied by ${cell}`
            : isHint
            ? "recommended hint cell"
            : "empty";

          return (
            <button
              key={idx}
              ref={(el) => {
                cellRefs.current[idx] = el;
              }}
              type="button"
              role="gridcell"
              aria-label={`Cell ${coord} (Row ${row}, Column ${col}), ${statusLabel}`}
              disabled={!isInteractive && cell === null && Boolean(winResult)}
              onClick={() => {
                if (isInteractive) onCellClick(idx);
              }}
              onMouseEnter={() => setHoveredCell(idx)}
              onMouseLeave={() => setHoveredCell(null)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`group relative flex items-center justify-center rounded-[0.85rem] border transition-all duration-150 focus:outline-none focus-visible:ring-2 ${
                isDragon ? "focus-visible:ring-amber-400" : "focus-visible:ring-blue-500"
              } ${cellSurface}`}
            >
              {showCoords && !cell && (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-1.5 top-1 select-none font-tabular text-[9px] transition-opacity ${
                    isDragon
                      ? "text-white/20 group-hover:text-white/40"
                      : "text-slate-300 group-hover:text-slate-400"
                  }`}
                >
                  {coord}
                </span>
              )}

              {highlightLastMove && isLastMove && (
                <span
                  aria-hidden="true"
                  title="Last move"
                  className={`pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${
                    isDragon ? "" : "bg-blue-500 ring-2 ring-blue-100"
                  }`}
                  style={
                    isDragon
                      ? {
                          backgroundColor: realmCfg.panelBorderGlow,
                          boxShadow: `0 0 8px ${realmCfg.panelBorderGlow}`,
                        }
                      : undefined
                  }
                />
              )}

              {isVanishingNext && (
                <span
                  aria-hidden="true"
                  title="Fades on your next move"
                  className={`pointer-events-none absolute inset-x-2 bottom-1 truncate rounded px-1 text-center text-[8px] font-bold uppercase tracking-wider ${
                    isDragon ? "bg-amber-500/20 text-amber-300" : "bg-slate-200/90 text-slate-600"
                  }`}
                >
                  fade
                </span>
              )}

              {cell && (
                <GamePiece
                  player={cell}
                  theme={theme}
                  realm={realm}
                  animate={true}
                  vanishing={isVanishingNext}
                  className="h-[62%] w-[62%]"
                />
              )}

              {!cell && (showGhost || isHint) && (
                <GamePiece
                  player={currentPlayer}
                  theme={theme}
                  realm={realm}
                  animate={false}
                  ghost={true}
                  className="h-[56%] w-[56%] transition-opacity duration-150"
                />
              )}
            </button>
          );
        })}

        {/* Winning line */}
        {strikeCoords && winResult && winResult.winner !== "draw" && (
          <svg
            viewBox={`0 0 ${strikeCoords.viewBoxSize} ${strikeCoords.viewBoxSize}`}
            fill="none"
            aria-hidden="true"
            style={{
              inset: `${padPx}px`,
              width: `calc(100% - ${padPx * 2}px)`,
              height: `calc(100% - ${padPx * 2}px)`,
            }}
            className="pointer-events-none absolute"
          >
            {isDragon ? (
              <>
                <defs>
                  <linearGradient id={strikeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={realmCfg.strikeStops[0]} />
                    <stop offset="100%" stopColor={realmCfg.strikeStops[1]} />
                  </linearGradient>
                </defs>
                <line
                  x1={strikeCoords.x1}
                  y1={strikeCoords.y1}
                  x2={strikeCoords.x2}
                  y2={strikeCoords.y2}
                  stroke={realmCfg.strikeGlow}
                  strokeOpacity="0.38"
                  strokeWidth="15"
                  strokeLinecap="round"
                  className="animate-strike-line"
                />
                <line
                  x1={strikeCoords.x1}
                  y1={strikeCoords.y1}
                  x2={strikeCoords.x2}
                  y2={strikeCoords.y2}
                  stroke={`url(#${strikeGradId})`}
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  className="animate-strike-line"
                />
              </>
            ) : (
              <line
                x1={strikeCoords.x1}
                y1={strikeCoords.y1}
                x2={strikeCoords.x2}
                y2={strikeCoords.y2}
                stroke={winResult.winner === "X" ? "#2563EB" : "#E11D48"}
                strokeWidth="7"
                strokeLinecap="round"
                className="animate-strike-line"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
};
