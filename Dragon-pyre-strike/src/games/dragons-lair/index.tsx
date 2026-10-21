import { useState, useEffect, useRef, type MouseEvent, type TouchEvent } from 'react'
import { RotateCcw, Flag, Bomb } from 'lucide-react'
import type { GamePlayProps } from '../registry'
import { sfx } from '@/utils/sound'
import { formatSeconds } from '@/utils/format'

const ROWS = 9
const COLS = 9
const MINES = 10

interface Cell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

type Status = 'idle' | 'playing' | 'won' | 'lost'

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-secondary',
  2: 'text-success',
  3: 'text-danger',
  4: 'text-primary',
  5: 'text-warning',
  6: 'text-secondary',
  7: 'text-text',
  8: 'text-muted',
}

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })))
}

function neighbors(r: number, c: number): [number, number][] {
  const result: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) result.push([nr, nc])
    }
  }
  return result
}

/** Places mines only after the first click, excluding that cell and its
 *  neighbors, so the opening move is always safe. */
function placeMines(board: Cell[][], safeR: number, safeC: number): Cell[][] {
  const next = board.map((row) => row.map((cell) => ({ ...cell })))
  const forbidden = new Set(neighbors(safeR, safeC).map(([r, c]) => `${r},${c}`))
  forbidden.add(`${safeR},${safeC}`)

  let placed = 0
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (forbidden.has(`${r},${c}`) || next[r][c].mine) continue
    next[r][c].mine = true
    placed++
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!next[r][c].mine) next[r][c].adjacent = neighbors(r, c).filter(([nr, nc]) => next[nr][nc].mine).length
    }
  }
  return next
}

function floodReveal(board: Cell[][], startR: number, startC: number): Cell[][] {
  const next = board.map((row) => row.map((cell) => ({ ...cell })))
  const stack: [number, number][] = [[startR, startC]]
  const visited = new Set<string>()

  while (stack.length) {
    const [r, c] = stack.pop() as [number, number]
    const key = `${r},${c}`
    if (visited.has(key)) continue
    visited.add(key)
    const cell = next[r][c]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.adjacent === 0 && !cell.mine) {
      for (const [nr, nc] of neighbors(r, c)) {
        if (!next[nr][nc].revealed && !next[nr][nc].flagged) stack.push([nr, nc])
      }
    }
  }
  return next
}

function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell)))
}

function checkWin(board: Cell[][]): boolean {
  return board.flat().every((cell) => cell.mine || cell.revealed)
}

export default function Minesweeper({ onScore, soundOn }: GamePlayProps) {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard)
  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  const minesLeft = MINES - board.flat().filter((c) => c.flagged).length

  function toggleFlag(r: number, c: number) {
    if (status === 'won' || status === 'lost' || board[r][c].revealed) return
    setBoard((prev) => prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? { ...cell, flagged: !cell.flagged } : cell))))
    if (soundOn) sfx.select()
  }

  function handleReveal(r: number, c: number) {
    if (status === 'won' || status === 'lost') return
    if (board[r][c].flagged || board[r][c].revealed) return

    let working = board
    let nextStatus: Status = status
    if (status === 'idle') {
      working = placeMines(board, r, c)
      nextStatus = 'playing'
    }

    if (working[r][c].mine) {
      setBoard(revealAllMines(working))
      setStatus('lost')
      if (soundOn) sfx.gameOver()
      return
    }

    const revealed = floodReveal(working, r, c)
    setBoard(revealed)

    if (checkWin(revealed)) {
      setStatus('won')
      onScore?.(seconds)
      if (soundOn) sfx.win()
    } else {
      setStatus(nextStatus)
      if (soundOn) sfx.blip()
    }
  }

  function onCellContextMenu(r: number, c: number, e: MouseEvent) {
    e.preventDefault()
    toggleFlag(r, c)
  }

  function onCellTouchStart(r: number, c: number) {
    longPressFired.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      toggleFlag(r, c)
    }, 450)
  }

  function onCellTouchEnd(e: TouchEvent) {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (longPressFired.current) e.preventDefault()
  }

  function restart() {
    setBoard(emptyBoard())
    setStatus('idle')
    setSeconds(0)
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 py-4">
      <div className="stat-mono flex w-full items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 rounded-lg bg-surface2 px-3 py-1.5 font-bold">
          <Bomb className="h-3.5 w-3.5 text-danger" /> {minesLeft}
        </span>
        <span className="rounded-lg bg-surface2 px-3 py-1.5 font-bold text-secondary">{formatSeconds(seconds)}</span>
      </div>

      {status === 'won' && (
        <p className="font-display text-lg font-bold text-success" aria-live="polite">
          Lair cleared in {formatSeconds(seconds)}!
        </p>
      )}
      {status === 'lost' && (
        <p className="font-display text-lg font-bold text-danger" aria-live="polite">
          You woke a dragon. Better luck next time.
        </p>
      )}

      <div className="grid select-none grid-cols-9 gap-[3px] rounded-xl bg-surface2 p-2">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleReveal(r, c)}
              onContextMenu={(e) => onCellContextMenu(r, c, e)}
              onTouchStart={() => onCellTouchStart(r, c)}
              onTouchEnd={onCellTouchEnd}
              disabled={status === 'won' || status === 'lost'}
              aria-label={cell.revealed ? (cell.mine ? 'Mine' : `${cell.adjacent} adjacent mines`) : cell.flagged ? 'Flagged cell' : 'Hidden cell'}
              className={`stat-mono flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition-all sm:h-8 sm:w-8 sm:text-sm ${
                cell.revealed
                  ? cell.mine
                    ? 'bg-gradient-to-br from-danger to-red-700 text-white shadow-[inset_0_1px_3px_rgb(0,0,0,0.35)]'
                    : 'bg-surface text-textMuted shadow-[inset_1px_1px_2px_rgb(0,0,0,0.35)]'
                  : 'bg-surface2 shadow-[inset_1.5px_1.5px_0_rgb(255,255,255,0.08),inset_-1.5px_-1.5px_0_rgb(0,0,0,0.35)] hover:brightness-110 active:shadow-none'
              }`}
            >
              {cell.revealed ? (
                cell.mine ? (
                  <Bomb className="pop-in h-3.5 w-3.5" />
                ) : cell.adjacent > 0 ? (
                  <span className={`pop-in ${NUMBER_COLORS[cell.adjacent]}`}>{cell.adjacent}</span>
                ) : (
                  ''
                )
              ) : cell.flagged ? (
                <Flag className="pop-in h-3.5 w-3.5 text-warning" />
              ) : null}
            </button>
          )),
        )}
      </div>

      <button
        onClick={restart}
        className="btn-focus flex items-center gap-1.5 rounded-full border border-text/10 bg-surface px-4 py-2.5 text-sm font-medium text-textMuted transition-colors hover:text-text"
      >
        <RotateCcw className="h-3.5 w-3.5" /> New Game
      </button>
    </div>
  )
}
