// Sudoku generator & solver utilities

export type Board = number[][]; // 9x9, 0 for empty
export type NotesBoard = Set<number>[][]; // 9x9 of candidate sets

export type Difficulty = "easy" | "medium" | "hard" | "expert";

const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  easy: 42,
  medium: 34,
  hard: 28,
  expert: 23,
};

export function emptyNotes(): NotesBoard {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
}

// ---- Validation ----
export function isValidPlacement(
  board: Board,
  row: number,
  col: number,
  num: number
): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num && i !== col) return false;
    if (board[i][col] === num && i !== row) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === num && !(r === row && c === col)) return false;
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fill board using backtracking
function fillBoard(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isValidPlacement(board, r, c, n)) {
            board[r][c] = n;
            if (fillBoard(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count solutions (up to limit) to ensure uniqueness
function countSolutions(board: Board, limit = 2): number {
  let count = 0;
  function solve(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValidPlacement(board, r, c, n)) {
              board[r][c] = n;
              if (solve()) {
                board[r][c] = 0;
                return true;
              }
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }
  solve();
  return count;
}

export function generateSolvedBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  return board;
}

export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Board;
  solution: Board;
} {
  const solution = generateSolvedBoard();
  const puzzle: Board = solution.map((row) => [...row]);
  const clues = DIFFICULTY_CLUES[difficulty];
  const cellsToRemove = 81 - clues;

  // Try to remove cells while keeping unique solution
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    const copy: Board = puzzle.map((row) => [...row]);
    if (countSolutions(copy, 2) !== 1) {
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }

  return { puzzle, solution };
}

export function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

export function isBoardComplete(board: Board): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) if (board[r][c] === 0) return false;
  return true;
}

export function findConflicts(board: Board): boolean[][] {
  const conflicts: boolean[][] = Array.from({ length: 9 }, () =>
    Array(9).fill(false)
  );
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === 0) continue;
      if (!isValidPlacement(board, r, c, v)) {
        conflicts[r][c] = true;
      }
    }
  }
  return conflicts;
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

export function cloneNotes(n: NotesBoard): NotesBoard {
  return n.map((row) => row.map((s) => new Set(s)));
}
