import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { GamePlayProps } from '../registry'
import { sfx } from '@/utils/sound'

function XMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`pop-in h-9 w-9 sm:h-11 sm:w-11 ${className}`}>
      <line x1="9" y1="9" x2="31" y2="31" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="31" y1="9" x2="9" y2="31" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

function OMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`pop-in h-9 w-9 sm:h-11 sm:w-11 ${className}`}>
      <circle cx="20" cy="20" r="12.5" fill="none" stroke="currentColor" strokeWidth="5" />
    </svg>
  )
}

type Cell = 'X' | 'O' | null

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function getWinner(board: Cell[]): { winner: 'X' | 'O' | null; line: number[] | null } {
  for (const line of LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line }
  }
  return { winner: null, line: null }
}

export default function TicTacToe({ soundOn }: GamePlayProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [turn, setTurn] = useState<'X' | 'O'>('X')
  const [tally, setTally] = useState({ X: 0, O: 0, draws: 0 })

  const { winner, line } = getWinner(board)
  const isDraw = !winner && board.every((c) => c !== null)

  function handleClick(i: number) {
    if (board[i] || winner || isDraw) return
    const next = [...board]
    next[i] = turn
    setBoard(next)
    if (soundOn) sfx.select()

    const result = getWinner(next)
    if (result.winner) {
      const w = result.winner
      setTally((t) => ({ ...t, [w]: t[w] + 1 }))
      if (soundOn) sfx.win()
    } else if (next.every((c) => c !== null)) {
      setTally((t) => ({ ...t, draws: t.draws + 1 }))
    } else {
      setTurn(turn === 'X' ? 'O' : 'X')
    }
  }

  function newRound() {
    setBoard(Array(9).fill(null))
    setTurn('X')
  }

  function resetMatch() {
    newRound()
    setTally({ X: 0, O: 0, draws: 0 })
  }

  const status = winner ? `${winner} wins this round!` : isDraw ? "It's a draw!" : `${turn}'s turn`

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5 py-4">
      <div className="stat-mono flex items-center gap-6 text-sm text-textMuted">
        <span className={turn === 'X' && !winner && !isDraw ? 'text-primary' : ''}>X: {tally.X}</span>
        <span>Draws: {tally.draws}</span>
        <span className={turn === 'O' && !winner && !isDraw ? 'text-secondary' : ''}>O: {tally.O}</span>
      </div>

      <p className="font-display text-lg font-bold" aria-live="polite">
        {status}
      </p>

      <div className="relative grid grid-cols-3 gap-2 rounded-2xl bg-surface2 p-2 shadow-glow">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={Boolean(cell) || Boolean(winner) || isDraw}
            aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ', empty'}`}
            className={`flex h-20 w-20 items-center justify-center rounded-xl bg-surface shadow-[inset_0_-2px_0_rgb(0,0,0,0.25)] transition-colors duration-150 sm:h-24 sm:w-24 ${
              line?.includes(i) ? 'bg-primary/15' : 'hover:bg-surface2/70'
            } ${cell === 'X' ? 'text-primary' : cell === 'O' ? 'text-secondary' : ''}`}
          >
            {cell === 'X' && <XMark />}
            {cell === 'O' && <OMark />}
          </button>
        ))}

        {line && (
          <svg viewBox="0 0 3 3" className="pointer-events-none absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] overflow-visible">
            <defs>
              <linearGradient id="ttt-line-grad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#DC2626" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <line
              className="line-in"
              x1={(line[0] % 3) + 0.5}
              y1={Math.floor(line[0] / 3) + 0.5}
              x2={(line[2] % 3) + 0.5}
              y2={Math.floor(line[2] / 3) + 0.5}
              stroke="url(#ttt-line-grad)"
              strokeWidth="0.1"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <div className="flex gap-2">
        {(winner || isDraw) && (
          <button
            onClick={newRound}
            className="btn-focus rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary2"
          >
            Next Round
          </button>
        )}
        <button
          onClick={resetMatch}
          className="btn-focus flex items-center gap-1.5 rounded-full border border-text/10 bg-surface px-4 py-2.5 text-sm font-medium text-textMuted transition-colors hover:text-text"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset Match
        </button>
      </div>
    </div>
  )
}
