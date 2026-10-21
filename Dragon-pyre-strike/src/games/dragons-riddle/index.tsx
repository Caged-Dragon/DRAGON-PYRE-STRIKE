import { useState, useRef, useEffect, type FormEvent } from 'react'
import { RotateCcw, Coins } from 'lucide-react'
import type { GamePlayProps } from '../registry'
import { sfx } from '@/utils/sound'

interface Guess {
  value: number
  hint: 'higher' | 'lower' | 'correct'
}

function randomTarget() {
  return Math.floor(Math.random() * 100) + 1
}

export default function DragonsRiddle({ onScore, soundOn }: GamePlayProps) {
  const [target, setTarget] = useState(randomTarget)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<Guess[]>([])
  const [won, setWon] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submitGuess(e: FormEvent) {
    e.preventDefault()
    const value = Number(input)
    if (!Number.isInteger(value) || value < 1 || value > 100 || won) return

    let hint: Guess['hint']
    if (value === target) hint = 'correct'
    else if (value < target) hint = 'higher'
    else hint = 'lower'

    const nextHistory = [{ value, hint }, ...history]
    setHistory(nextHistory)
    setInput('')

    if (hint === 'correct') {
      setWon(true)
      onScore?.(nextHistory.length)
      if (soundOn) sfx.win()
    } else if (soundOn) {
      sfx.blip()
    }
  }

  function newGame() {
    setTarget(randomTarget())
    setHistory([])
    setWon(false)
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5 py-4">
      <Coins className="h-10 w-10 text-secondary" aria-hidden="true" />
      <div className="text-center">
        <p className="font-display text-lg font-bold" aria-live="polite">
          {won ? `The dragon nods \u2014 solved in ${history.length} ${history.length === 1 ? 'guess' : 'guesses'}!` : 'A dragon guards 1-100 gold coins'}
        </p>
        <p className="mt-1 text-sm text-textMuted">{won ? 'The riddle is solved.' : 'Guess the size of the hoard.'}</p>
      </div>

      {!won ? (
        <form onSubmit={submitGuess} className="flex w-full gap-2">
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={100}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1-100"
            aria-label="Your guess, between 1 and 100"
            className="btn-focus stat-mono w-full rounded-xl border border-text/10 bg-surface px-4 py-3 text-center text-lg text-text"
          />
          <button type="submit" className="btn-focus shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary2">
            Guess
          </button>
        </form>
      ) : (
        <button
          onClick={newGame}
          className="btn-focus flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary2"
        >
          <RotateCcw className="h-4 w-4" /> Face a New Hoard
        </button>
      )}

      {history.length > 0 && (
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">History</p>
            {!won && (
              <button onClick={newGame} className="btn-focus text-xs font-medium text-muted transition-colors hover:text-textMuted">
                New hoard
              </button>
            )}
          </div>
          <ul className="stat-mono flex max-h-40 flex-col gap-1 overflow-y-auto text-sm">
            {history.map((g, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5">
                <span>{g.value}</span>
                <span className={g.hint === 'correct' ? 'text-success' : g.hint === 'higher' ? 'text-secondary' : 'text-warning'}>
                  {g.hint === 'correct' ? 'Solved!' : g.hint === 'higher' ? 'Hoard is bigger' : 'Hoard is smaller'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
