import type {
  AIDifficulty,
  BoardSize,
  CellValue,
  GameVariant,
  Player,
  WinResult,
} from "../types/game";

const LINE_CACHE: Partial<Record<BoardSize, number[][]>> = {};

export function getWinLength(size: BoardSize): number {
  return size === 3 ? 3 : 4;
}

export function getMaxActivePieces(size: BoardSize): number {
  return size === 3 ? 3 : 4;
}

export function indexToCoord(index: number, size: BoardSize): string {
  const rowLetter = String.fromCharCode(65 + Math.floor(index / size));
  const colNumber = (index % size) + 1;
  return `${rowLetter}${colNumber}`;
}

export function getWinningLines(size: BoardSize): number[][] {
  if (LINE_CACHE[size]) return LINE_CACHE[size]!;

  const winLen = getWinLength(size);
  const lines: number[][] = [];

  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLen; c++) {
      const line: number[] = [];
      for (let k = 0; k < winLen; k++) line.push(r * size + (c + k));
      lines.push(line);
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLen; r++) {
      const line: number[] = [];
      for (let k = 0; k < winLen; k++) line.push((r + k) * size + c);
      lines.push(line);
    }
  }

  // Down-Right Diagonals
  for (let r = 0; r <= size - winLen; r++) {
    for (let c = 0; c <= size - winLen; c++) {
      const line: number[] = [];
      for (let k = 0; k < winLen; k++) line.push((r + k) * size + (c + k));
      lines.push(line);
    }
  }

  // Down-Left Diagonals
  for (let r = 0; r <= size - winLen; r++) {
    for (let c = winLen - 1; c < size; c++) {
      const line: number[] = [];
      for (let k = 0; k < winLen; k++) line.push((r + k) * size + (c - k));
      lines.push(line);
    }
  }

  LINE_CACHE[size] = lines;
  return lines;
}

export function evaluateBoard(
  board: CellValue[],
  size: BoardSize,
  variant: GameVariant = "standard"
): WinResult | null {
  const lines = getWinningLines(size);

  for (const line of lines) {
    const first = board[line[0]];
    if (!first) continue;
    let allMatch = true;
    for (let i = 1; i < line.length; i++) {
      if (board[line[i]] !== first) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      return {
        winner: first,
        line,
        reason: "line",
      };
    }
  }

  if (variant === "standard" && board.every((cell) => cell !== null)) {
    return {
      winner: "draw",
      line: null,
      reason: "draw",
    };
  }

  return null;
}

/**
 * Simulates placing a mark on `board`, applying Infinite-mode FIFO vanishing if enabled.
 */
export function simulatePlacement(
  board: CellValue[],
  index: number,
  player: Player,
  size: BoardSize,
  variant: GameVariant,
  playerQueue: number[]
): {
  nextBoard: CellValue[];
  nextQueue: number[];
  vanishedIndex: number | null;
} {
  const nextBoard = [...board];
  const nextQueue = [...playerQueue];
  let vanishedIndex: number | null = null;

  if (variant === "infinite") {
    const cap = getMaxActivePieces(size);
    if (nextQueue.length >= cap) {
      const oldest = nextQueue.shift()!;
      nextBoard[oldest] = null;
      vanishedIndex = oldest;
    }
  }

  nextBoard[index] = player;
  nextQueue.push(index);

  return { nextBoard, nextQueue, vanishedIndex };
}

function getAvailableMoves(board: CellValue[]): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i);
  }
  return moves;
}

function scoreHeuristic(
  board: CellValue[],
  size: BoardSize,
  aiPlayer: Player,
  humanPlayer: Player
): number {
  const lines = getWinningLines(size);
  let total = 0;

  for (const line of lines) {
    let aiCount = 0;
    let humanCount = 0;
    for (const idx of line) {
      if (board[idx] === aiPlayer) aiCount++;
      else if (board[idx] === humanPlayer) humanCount++;
    }

    if (aiCount > 0 && humanCount === 0) {
      total += Math.pow(10, aiCount);
    } else if (humanCount > 0 && aiCount === 0) {
      total -= Math.pow(10, humanCount) * 1.1;
    }
  }

  return total;
}

function alphaBeta(
  board: CellValue[],
  size: BoardSize,
  variant: GameVariant,
  aiQueue: number[],
  humanQueue: number[],
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  humanPlayer: Player
): number {
  const result = evaluateBoard(board, size, variant);
  if (result) {
    if (result.winner === aiPlayer) return 10000 - depth * 10;
    if (result.winner === humanPlayer) return -10000 + depth * 10;
    return 0;
  }

  if (depth >= maxDepth) {
    return scoreHeuristic(board, size, aiPlayer, humanPlayer);
  }

  const moves = getAvailableMoves(board);
  if (moves.length === 0) return 0;

  // Order center-most cells first for superior alpha-beta pruning
  const center = (size - 1) / 2;
  moves.sort((a, b) => {
    const da = Math.hypot((a % size) - center, Math.floor(a / size) - center);
    const db = Math.hypot((b % size) - center, Math.floor(b / size) - center);
    return da - db;
  });

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const sim = simulatePlacement(
        board,
        move,
        aiPlayer,
        size,
        variant,
        aiQueue
      );
      const val = alphaBeta(
        sim.nextBoard,
        size,
        variant,
        sim.nextQueue,
        humanQueue,
        depth + 1,
        maxDepth,
        alpha,
        beta,
        false,
        aiPlayer,
        humanPlayer
      );
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const sim = simulatePlacement(
        board,
        move,
        humanPlayer,
        size,
        variant,
        humanQueue
      );
      const val = alphaBeta(
        sim.nextBoard,
        size,
        variant,
        aiQueue,
        sim.nextQueue,
        depth + 1,
        maxDepth,
        alpha,
        beta,
        true,
        aiPlayer,
        humanPlayer
      );
      if (val < best) best = val;
      if (best < beta) beta = best;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBestMove(
  board: CellValue[],
  aiPlayer: Player,
  difficulty: AIDifficulty,
  size: BoardSize = 3,
  variant: GameVariant = "standard",
  xQueue: number[] = [],
  oQueue: number[] = []
): number {
  const available = getAvailableMoves(board);
  if (available.length === 0) return -1;

  // Natural variety on completely empty opening board
  if (available.length === board.length) {
    if (size === 3) {
      const openings = [4, 0, 2, 6, 8];
      return openings[Math.floor(Math.random() * openings.length)];
    }
    const mid = Math.floor(size / 2);
    const centerCandidates: number[] = [];
    for (let r = Math.max(0, mid - 1); r <= Math.min(size - 1, mid); r++) {
      for (let c = Math.max(0, mid - 1); c <= Math.min(size - 1, mid); c++) {
        centerCandidates.push(r * size + c);
      }
    }
    return centerCandidates[Math.floor(Math.random() * centerCandidates.length)];
  }

  const randomPick = () =>
    available[Math.floor(Math.random() * available.length)];

  if (difficulty === "casual" && Math.random() < 0.56) {
    return randomPick();
  }
  if (difficulty === "tactical" && Math.random() < 0.22) {
    return randomPick();
  }

  const humanPlayer: Player = aiPlayer === "X" ? "O" : "X";
  const aiQueue = aiPlayer === "X" ? xQueue : oQueue;
  const humanQueue = humanPlayer === "X" ? xQueue : oQueue;

  // 1. Check immediate winning move first
  for (const move of available) {
    const sim = simulatePlacement(
      board,
      move,
      aiPlayer,
      size,
      variant,
      aiQueue
    );
    const res = evaluateBoard(sim.nextBoard, size, variant);
    if (res?.winner === aiPlayer) return move;
  }

  // 2. Block immediate opponent winning threat
  for (const move of available) {
    const sim = simulatePlacement(
      board,
      move,
      humanPlayer,
      size,
      variant,
      humanQueue
    );
    const res = evaluateBoard(sim.nextBoard, size, variant);
    if (res?.winner === humanPlayer) return move;
  }

  // Depth calibrated per grid size so search stays sub-25ms & super sharp
  const maxDepth =
    size === 3
      ? variant === "infinite"
        ? 6
        : 9
      : size === 4
      ? 4
      : 3;

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const move of available) {
    const sim = simulatePlacement(
      board,
      move,
      aiPlayer,
      size,
      variant,
      aiQueue
    );
    const score = alphaBeta(
      sim.nextBoard,
      size,
      variant,
      sim.nextQueue,
      humanQueue,
      1,
      maxDepth,
      -Infinity,
      Infinity,
      false,
      aiPlayer,
      humanPlayer
    );

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export function getStrategicHint(
  board: CellValue[],
  player: Player,
  size: BoardSize,
  variant: GameVariant,
  xQueue: number[],
  oQueue: number[]
): number {
  return getBestMove(board, player, "unbeatable", size, variant, xQueue, oQueue);
}

/**
 * Computes exact SVG line start & end points inside a `size * 100` square viewBox
 * extending slightly past the first and last winning cell centers.
 */
export function getStrikeCoordinates(
  line: number[],
  size: BoardSize
): {
  viewBoxSize: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const viewBoxSize = size * 100;
  const centerOf = (index: number) => ({
    x: (index % size) * 100 + 50,
    y: Math.floor(index / size) * 100 + 50,
  });

  const start = centerOf(line[0]);
  const end = centerOf(line[line.length - 1]);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const overhang = 20;

  return {
    viewBoxSize,
    x1: start.x - (dx / len) * overhang,
    y1: start.y - (dy / len) * overhang,
    x2: end.x + (dx / len) * overhang,
    y2: end.y + (dy / len) * overhang,
  };
}
