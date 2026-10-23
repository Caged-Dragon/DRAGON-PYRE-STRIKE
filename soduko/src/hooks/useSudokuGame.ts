import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type Board,
  type Difficulty,
  type NotesBoard,
  boardsEqual,
  cloneBoard,
  cloneNotes,
  emptyNotes,
  findConflicts,
  generatePuzzle,
  isBoardComplete,
  isValidPlacement,
} from "../lib/sudoku";
import type { GameSoundCallbacks } from "./useGameSounds";
import { store } from '../dps';

interface HistoryEntry {
  board: Board;
  notes: NotesBoard;
}

interface PersistedGame {
  solution: Board;
  board: Board;
  notes: number[][][];
  given: boolean[][];
  seconds: number;
  mistakes: number;
  hintsUsed: number;
  difficulty: Difficulty;
  active: boolean;
  won: boolean;
}

const SAVE_KEY = "sudoku.activeGame.v2";
const EMPTY: Board = Array.from({ length: 9 }, () => Array(9).fill(0));

function loadSavedGame(): PersistedGame | null {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGame;
    if (
      !parsed ||
      !Array.isArray(parsed.board) ||
      parsed.board.length !== 9 ||
      !Array.isArray(parsed.solution) ||
      parsed.solution.length !== 9
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useSudokuGame(sounds?: GameSoundCallbacks) {
  const playCorrect = sounds?.playCorrect;
  const playWrong = sounds?.playWrong;
  const initial = useMemo(() => loadSavedGame(), []);

  const [solution, setSolution] = useState<Board>(initial?.solution ?? EMPTY);
  const [board, setBoard] = useState<Board>(initial?.board ?? EMPTY);
  const [notes, setNotes] = useState<NotesBoard>(() =>
    initial?.notes
      ? initial.notes.map((row) => row.map((arr) => new Set(arr)))
      : emptyNotes()
  );
  const [given, setGiven] = useState<boolean[][]>(
    () =>
      initial?.given ??
      Array.from({ length: 9 }, () => Array(9).fill(false))
  );
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(
    null
  );
  const [notesMode, setNotesMode] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [seconds, setSeconds] = useState(initial?.seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(initial?.active ?? false);
  const [won, setWon] = useState(initial?.won ?? false);
  const [mistakes, setMistakes] = useState(initial?.mistakes ?? 0);
  const [hintsUsed, setHintsUsed] = useState(initial?.hintsUsed ?? 0);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initial?.difficulty ?? "easy"
  );
  const [lastPlaced, setLastPlaced] = useState<{
    r: number;
    c: number;
    id: number;
  } | null>(null);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const placeId = useRef(0);

  // Persist game state cleanly
  useEffect(() => {
    if (!active) return;
    try {
      const payload: PersistedGame = {
        solution,
        board,
        notes: notes.map((row) => row.map((set) => Array.from(set))),
        given,
        seconds,
        mistakes,
        hintsUsed,
        difficulty,
        active,
        won,
      };
      store.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [
    solution,
    board,
    notes,
    given,
    seconds,
    mistakes,
    hintsUsed,
    difficulty,
    active,
    won,
  ]);

  // Timer
  useEffect(() => {
    if (!active || paused || won) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active, paused, won]);

  // Flash feedback auto-reset
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 460);
    return () => clearTimeout(t);
  }, [flash]);

  // Wrong guesses stay visible in the board, but are omitted from all rule checks.
  const incorrect = useMemo(
    () =>
      board.map((row, r) =>
        row.map(
          (value, c) =>
            value !== 0 && !given[r][c] && value !== solution[r][c]
        )
      ),
    [board, given, solution]
  );

  const constraintBoard = useMemo(
    () =>
      board.map((row, r) =>
        row.map((value, c) => (incorrect[r][c] ? 0 : value))
      ),
    [board, incorrect]
  );

  const conflicts = useMemo(
    () => findConflicts(constraintBoard),
    [constraintBoard]
  );

  useEffect(() => {
    if (!active || won) return;
    if (
      isBoardComplete(constraintBoard) &&
      boardsEqual(constraintBoard, solution)
    ) {
      setWon(true);
    }
  }, [constraintBoard, solution, active, won]);

  const newGame = useCallback((diff: Difficulty) => {
    const { puzzle, solution: sol } = generatePuzzle(diff);
    setSolution(sol);
    setBoard(cloneBoard(puzzle));
    setNotes(emptyNotes());
    setGiven(puzzle.map((row) => row.map((v) => v !== 0)));
    setSelected(null);
    setHistory([]);
    setSeconds(0);
    setDifficulty(diff);
    setActive(true);
    setPaused(false);
    setWon(false);
    setMistakes(0);
    setHintsUsed(0);
    setNotesMode(false);
    setLastPlaced(null);
  }, []);

  const restart = useCallback(() => {
    setBoard((b) =>
      b.map((row, r) => row.map((v, c) => (given[r][c] ? v : 0)))
    );
    setNotes(emptyNotes());
    setHistory([]);
    setSeconds(0);
    setMistakes(0);
    setHintsUsed(0);
    setWon(false);
    setPaused(false);
    setSelected(null);
  }, [given]);

  const pushHistory = useCallback((b: Board, n: NotesBoard) => {
    setHistory((h) => [
      ...h.slice(-59),
      { board: cloneBoard(b), notes: cloneNotes(n) },
    ]);
  }, []);

  const placeNumber = useCallback(
    (n: number) => {
      if (!selected || won || paused) return;
      const { r, c } = selected;
      if (given[r][c]) return;

      if (notesMode) {
        // Do not overwrite a verified correct cell with notes
        if (board[r][c] !== 0 && board[r][c] === solution[r][c]) return;
        pushHistory(board, notes);
        if (board[r][c] !== 0) {
          const nb = cloneBoard(board);
          nb[r][c] = 0;
          setBoard(nb);
        }
        const nn = cloneNotes(notes);
        if (nn[r][c].has(n)) nn[r][c].delete(n);
        else nn[r][c].add(n);
        setNotes(nn);
        return;
      }

      pushHistory(board, notes);

      const nb = cloneBoard(board);
      const nextVal = nb[r][c] === n ? 0 : n;
      nb[r][c] = nextVal;

      if (nextVal !== 0) {
        placeId.current += 1;
        setLastPlaced({ r, c, id: placeId.current });

        if (solution[r][c] !== nextVal) {
          setMistakes((m) => m + 1);
          setFlash("bad");
          playWrong?.();
        } else {
          setFlash("good");
          playCorrect?.();

          // Clear any earlier wrong guess of the same digit `nextVal` in the same row, col, or 3x3 box
          const br = Math.floor(r / 3) * 3;
          const bc = Math.floor(c / 3) * 3;
          for (let i = 0; i < 9; i++) {
            if (
              i !== c &&
              nb[r][i] === nextVal &&
              nb[r][i] !== solution[r][i]
            ) {
              nb[r][i] = 0;
            }
            if (
              i !== r &&
              nb[i][c] === nextVal &&
              nb[i][c] !== solution[i][c]
            ) {
              nb[i][c] = 0;
            }
          }
          for (let rr = br; rr < br + 3; rr++) {
            for (let cc = bc; cc < bc + 3; cc++) {
              if (
                (rr !== r || cc !== c) &&
                nb[rr][cc] === nextVal &&
                nb[rr][cc] !== solution[rr][cc]
              ) {
                nb[rr][cc] = 0;
              }
            }
          }

          // If all 9 correct positions of `nextVal` are now placed, clear any stray wrong `nextVal` anywhere
          let correctForDigit = 0;
          for (let rr = 0; rr < 9; rr++) {
            for (let cc = 0; cc < 9; cc++) {
              if (nb[rr][cc] === nextVal && solution[rr][cc] === nextVal) {
                correctForDigit++;
              }
            }
          }
          if (correctForDigit === 9) {
            for (let rr = 0; rr < 9; rr++) {
              for (let cc = 0; cc < 9; cc++) {
                if (nb[rr][cc] === nextVal && solution[rr][cc] !== nextVal) {
                  nb[rr][cc] = 0;
                }
              }
            }
          }
        }
      }

      setBoard(nb);

      const nn = cloneNotes(notes);
      nn[r][c].clear();
      // An incorrect guess must not remove candidates from its peers.
      if (nextVal !== 0 && nextVal === solution[r][c]) {
        for (let i = 0; i < 9; i++) {
          nn[r][i].delete(nextVal);
          nn[i][c].delete(nextVal);
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++)
          for (let cc = bc; cc < bc + 3; cc++) nn[rr][cc].delete(nextVal);
      }
      setNotes(nn);
    },
    [
      board,
      notes,
      selected,
      given,
      notesMode,
      solution,
      won,
      paused,
      pushHistory,
      playCorrect,
      playWrong,
    ]
  );

  const erase = useCallback(() => {
    if (!selected || won || paused) return;
    const { r, c } = selected;
    if (given[r][c]) return;
    if (board[r][c] === 0 && notes[r][c].size === 0) return;
    pushHistory(board, notes);
    const nb = cloneBoard(board);
    nb[r][c] = 0;
    setBoard(nb);
    const nn = cloneNotes(notes);
    nn[r][c].clear();
    setNotes(nn);
  }, [board, notes, selected, given, won, paused, pushHistory]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setBoard(last.board);
      setNotes(last.notes);
      return h.slice(0, -1);
    });
  }, []);

  const hint = useCallback(() => {
    if (won || paused) return;
    let target =
      selected &&
      !given[selected.r][selected.c] &&
      constraintBoard[selected.r][selected.c] === 0
        ? selected
        : null;
    if (!target) {
      const empties: { r: number; c: number }[] = [];
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (constraintBoard[r][c] === 0 && !given[r][c]) {
            empties.push({ r, c });
          }
      if (empties.length === 0) return;
      target = empties[Math.floor(Math.random() * empties.length)];
      setSelected(target);
    }
    pushHistory(board, notes);
    const nb = cloneBoard(board);
    const correctVal = solution[target.r][target.c];
    nb[target.r][target.c] = correctVal;

    // Also clear any wrong `correctVal` in the same row/col/box
    const br = Math.floor(target.r / 3) * 3;
    const bc = Math.floor(target.c / 3) * 3;
    for (let i = 0; i < 9; i++) {
      if (
        i !== target.c &&
        nb[target.r][i] === correctVal &&
        nb[target.r][i] !== solution[target.r][i]
      ) {
        nb[target.r][i] = 0;
      }
      if (
        i !== target.r &&
        nb[i][target.c] === correctVal &&
        nb[i][target.c] !== solution[i][target.c]
      ) {
        nb[i][target.c] = 0;
      }
    }
    for (let rr = br; rr < br + 3; rr++) {
      for (let cc = bc; cc < bc + 3; cc++) {
        if (
          (rr !== target.r || cc !== target.c) &&
          nb[rr][cc] === correctVal &&
          nb[rr][cc] !== solution[rr][cc]
        ) {
          nb[rr][cc] = 0;
        }
      }
    }

    setBoard(nb);

    const nn = cloneNotes(notes);
    nn[target.r][target.c].clear();
    for (let i = 0; i < 9; i++) {
      nn[target.r][i].delete(correctVal);
      nn[i][target.c].delete(correctVal);
    }
    for (let rr = br; rr < br + 3; rr++)
      for (let cc = bc; cc < bc + 3; cc++) nn[rr][cc].delete(correctVal);
    setNotes(nn);

    placeId.current += 1;
    setLastPlaced({ r: target.r, c: target.c, id: placeId.current });
    setHintsUsed((h) => h + 1);
    setFlash("good");
    playCorrect?.();
  }, [
    board,
    notes,
    selected,
    solution,
    given,
    constraintBoard,
    won,
    paused,
    pushHistory,
    playCorrect,
  ]);

  const autoFillNotes = useCallback(() => {
    if (won || paused) return;
    pushHistory(board, notes);
    const nn = emptyNotes();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (constraintBoard[r][c] !== 0) continue;
        for (let n = 1; n <= 9; n++) {
          if (isValidPlacement(constraintBoard, r, c, n)) {
            nn[r][c].add(n);
          }
        }
      }
    }
    setNotes(nn);
  }, [board, notes, constraintBoard, won, paused, pushHistory]);

  const move = useCallback((dr: number, dc: number) => {
    setSelected((s) => {
      if (!s) return { r: 0, c: 0 };
      return {
        r: Math.min(8, Math.max(0, s.r + dr)),
        c: Math.min(8, Math.max(0, s.c + dc)),
      };
    });
  }, []);

  // Track total placed on board, verified correct count, and remaining availability per digit 1..9
  const digitStats = useMemo(() => {
    const placed = new Array(10).fill(0);
    const correct = new Array(10).fill(0);
    const wrong = new Array(10).fill(0);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = board[r][c];
        if (v >= 1 && v <= 9) {
          placed[v]++;
          if (incorrect[r][c]) {
            wrong[v]++;
          } else {
            correct[v]++;
          }
        }
      }
    }

    // Remaining shows how many more of digit `d` are needed to reach 9 placed on the board.
    // As soon as 9 of digit `d` are placed on the board, remaining[d] is 0.
    const remaining = new Array(10).fill(0).map((_, d) =>
      d === 0 ? 0 : Math.max(0, 9 - placed[d])
    );

    return { placed, correct, wrong, remaining };
  }, [board, incorrect]);

  const filledCount = useMemo(() => {
    let n = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (constraintBoard[r][c] !== 0) n++;
    return n;
  }, [constraintBoard]);

  const incorrectCount = useMemo(
    () =>
      incorrect.reduce((total, row) => total + row.filter(Boolean).length, 0),
    [incorrect]
  );

  return {
    board,
    notes,
    given,
    solution,
    incorrect,
    incorrectCount,
    conflicts,
    selected,
    setSelected,
    notesMode,
    setNotesMode,
    showGuides,
    setShowGuides,
    seconds,
    paused,
    setPaused,
    active,
    won,
    mistakes,
    hintsUsed,
    difficulty,
    remaining: digitStats.remaining,
    placedCounts: digitStats.placed,
    correctCounts: digitStats.correct,
    wrongCounts: digitStats.wrong,
    filledCount,
    lastPlaced,
    flash,
    canUndo: history.length > 0,
    newGame,
    restart,
    placeNumber,
    erase,
    undo,
    hint,
    autoFillNotes,
    move,
  };
}
