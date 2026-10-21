import { useState, useEffect, useCallback, useRef, type TouchEvent } from 'react'
import { RotateCcw } from 'lucide-react'
import type { GamePlayProps } from '../registry'
import { sfx } from '@/utils/sound'

type Grid = number[][]
type Dir = 'left' | 'right' | 'up' | 'down'

const SIZE = 4

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function emptyCells(grid: Grid): [number, number][] {
  const cells: [number, number][] = []
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) cells.push([r, c])
  return cells
}

function spawnTile(grid: Grid): Grid {
  const cells = emptyCells(grid)
  if (cells.length === 0) return grid
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]
  const next = grid.map((row) => [...row])
  next[r][c] = Math.random() < 0.9 ? 2 : 4
  return next
}

/** Slides + merges one row toward index 0. Each tile merges at most once per move (classic rules). */
function slideRowLeft(row: number[]): { row: number[]; gained: number; moved: boolean } {
  const filtered = row.filter((v) => v !== 0)
  const result: number[] = []
  let gained = 0
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      gained += merged
      i++
    } else {
      result.push(filtered[i])
    }
  }
  while (result.length < SIZE) result.push(0)
  const moved = row.some((v, i) => v !== result[i])
  return { row: result, gained, moved }
}

function rotateGridCW(grid: Grid): Grid {
  const next = emptyGrid()
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) next[c][SIZE - 1 - r] = grid[r][c]
  return next
}

/** Every direction is normalized to "slide left" by rotating the grid, then rotated back. Verified by trace. */
function move(grid: Grid, dir: Dir): { grid: Grid; gained: number; moved: boolean } {
  const rotations = dir === 'up' ? 3 : dir === 'right' ? 2 : dir === 'down' ? 1 : 0
  let working = grid.map((row) => [...row])
  for (let i = 0; i < rotations; i++) working = rotateGridCW(working)

  let gained = 0
  let moved = false
  const nextRows = working.map((row) => {
    const result = slideRowLeft(row)
    gained += result.gained
    if (result.moved) moved = true
    return result.row
  })

  let result = nextRows
  const backRotations = (4 - rotations) % 4
  for (let i = 0; i < backRotations; i++) result = rotateGridCW(result)

  return { grid: result, gained, moved }
}

function canMove(grid: Grid): boolean {
  if (emptyCells(grid).length > 0) return true
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c]
      if (c < SIZE - 1 && grid[r][c + 1] === v) return true
      if (r < SIZE - 1 && grid[r + 1][c] === v) return true
    }
  }
  return false
}

function initGrid(): Grid {
  return spawnTile(spawnTile(emptyGrid()))
}

const TILE_COLORS: Record<number, string> = {
  2: 'bg-surface2 text-text',
  4: 'bg-surface2 text-text',
  8: 'bg-primary/30 text-text',
  16: 'bg-primary/40 text-text',
  32: 'bg-primary/55 text-white',
  64: 'bg-primary/70 text-white shadow-[0_0_14px_rgb(139,92,246,0.4)]',
  128: 'bg-secondary/50 text-white',
  256: 'bg-secondary/65 text-white',
  512: 'bg-secondary/80 text-white shadow-[0_0_14px_rgb(34,211,238,0.4)]',
  1024: 'bg-warning/80 text-bg',
  2048: 'bg-warning text-bg shadow-[0_0_20px_rgb(245,158,11,0.55)]',
}

export default function Merge2048({ onScore, soundOn }: GamePlayProps) {
  const [grid, setGrid] = useState<Grid>(initGrid)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [continued, setContinued] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  // NOTE: all side effects (score/sound/win/game-over) run in this plain
  // callback, never inside a setState updater — updater functions can be
  // invoked twice by React StrictMode in dev, which would double-count
  // score and double-fire sound if side effects lived in there instead.
  const handleMove = useCallback(
    (dir: Dir) => {
      if (gameOver || (won && !continued)) return
      const result = move(grid, dir)
      if (!result.moved) return
      const spawned = spawnTile(result.grid)

      setGrid(spawned)
      setScore((s) => s + result.gained)
      if (result.gained > 0 && soundOn) sfx.score()
      if (!won && spawned.some((row) => row.includes(2048))) setWon(true)
      if (!canMove(spawned)) {
        setGameOver(true)
        if (soundOn) sfx.gameOver()
      }
    },
    [grid, gameOver, won, continued, soundOn],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Dir> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        handleMove(dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  useEffect(() => {
    if (gameOver) onScore?.(score)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver])

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  function onTouchEnd(e: TouchEvent) {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    touchStart.current = null
    if (Math.max(absX, absY) < 24) return
    if (absX > absY) handleMove(dx > 0 ? 'right' : 'left')
    else handleMove(dy > 0 ? 'down' : 'up')
  }

  function restart() {
    setGrid(initGrid())
    setScore(0)
    setGameOver(false)
    setWon(false)
    setContinued(false)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 py-4">
      <div className="stat-mono flex w-full items-center justify-between text-sm">
        <span className="font-sans text-textMuted">Merge tiles, reach 2048</span>
        <span className="rounded-lg bg-surface2 px-3 py-1 font-bold text-secondary">Score: {score}</span>
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative grid grid-cols-4 gap-2 rounded-2xl bg-surface2 p-2 sm:gap-2.5 sm:p-2.5"
      >
        {grid.map((row, r) =>
          row.map((value, c) => (
            <div
              key={`${r}-${c}-${value}`}
              className={`stat-mono flex h-16 w-16 items-center justify-center rounded-lg text-xl font-bold sm:h-[4.5rem] sm:w-[4.5rem] sm:text-2xl ${
                value ? `pop-in ${TILE_COLORS[value] ?? 'bg-warning text-bg'}` : 'bg-surface/60'
              }`}
            >
              {value || ''}
            </div>
          )),
        )}

        {(gameOver || (won && !continued)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-bg/85 backdrop-blur-sm">
            <p className="font-display text-lg font-bold">{gameOver ? 'No more moves' : 'You reached 2048!'}</p>
            <div className="flex gap-2">
              {won && !continued && !gameOver && (
                <button
                  onClick={() => setContinued(true)}
                  className="btn-focus rounded-full border border-text/15 bg-text/10 px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-text/20"
                >
                  Keep Going
                </button>
              )}
              <button
                onClick={restart}
                className="btn-focus rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary2"
              >
                New Game
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={restart}
        className="btn-focus flex items-center gap-1.5 rounded-full border border-text/10 bg-surface px-4 py-2 text-xs font-medium text-textMuted transition-colors hover:text-text"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Restart
      </button>
    </div>
  )
}
