import { useState, useEffect, useRef } from 'react'
import { RotateCcw, Flame, Gem, Crown, Egg, Shield, Swords, Skull, Coins } from 'lucide-react'
import type { GamePlayProps } from '../registry'
import { sfx } from '@/utils/sound'
import { formatSeconds } from '@/utils/format'

const SYMBOLS = [Flame, Gem, Crown, Egg, Shield, Swords, Skull, Coins]

interface CardData {
  id: number
  symbolIndex: number
}

function buildDeck(): CardData[] {
  const pairs: CardData[] = SYMBOLS.flatMap((_, symbolIndex) => [
    { id: symbolIndex * 2, symbolIndex },
    { id: symbolIndex * 2 + 1, symbolIndex },
  ])
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

export default function MemoryMatch({ onScore, soundOn }: GamePlayProps) {
  const [deck, setDeck] = useState<CardData[]>(buildDeck)
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [wrongPair, setWrongPair] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const lockRef = useRef(false)

  const won = matched.length === deck.length

  useEffect(() => {
    if (!running || won) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running, won])

  useEffect(() => {
    if (!won) return
    onScore?.(moves)
    if (soundOn) sfx.win()
    setRunning(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won])

  function flip(index: number) {
    if (lockRef.current || flipped.includes(index) || matched.includes(index)) return
    if (!running) setRunning(true)
    if (soundOn) sfx.flip()

    const nextFlipped = [...flipped, index]
    setFlipped(nextFlipped)

    if (nextFlipped.length === 2) {
      lockRef.current = true
      setMoves((m) => m + 1)
      const [a, b] = nextFlipped
      if (deck[a].symbolIndex === deck[b].symbolIndex) {
        setTimeout(() => {
          setMatched((m) => [...m, a, b])
          setFlipped([])
          lockRef.current = false
          if (soundOn) sfx.score()
        }, 350)
      } else {
        setWrongPair(nextFlipped)
        if (soundOn) sfx.hit()
        setTimeout(() => {
          setFlipped([])
          setWrongPair([])
          lockRef.current = false
        }, 800)
      }
    }
  }

  function restart() {
    setDeck(buildDeck())
    setFlipped([])
    setMatched([])
    setWrongPair([])
    setMoves(0)
    setSeconds(0)
    setRunning(false)
    lockRef.current = false
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5 py-4">
      <div className="stat-mono flex items-center gap-6 text-sm text-textMuted">
        <span>Moves: {moves}</span>
        <span>Time: {formatSeconds(seconds)}</span>
        <span>
          Pairs: {matched.length / 2}/{deck.length / 2}
        </span>
      </div>

      {won && (
        <p className="font-display text-lg font-bold text-success" aria-live="polite">
          Solved in {moves} moves!
        </p>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {deck.map((card, i) => {
          const Icon = SYMBOLS[card.symbolIndex]
          const isUp = flipped.includes(i) || matched.includes(i)
          const isMatched = matched.includes(i)
          const isWrong = wrongPair.includes(i)
          return (
            <button
              key={card.id}
              onClick={() => flip(i)}
              disabled={isUp}
              aria-label={isUp ? 'Card revealed' : 'Hidden card'}
              className={`relative h-16 w-16 [perspective:600px] sm:h-20 sm:w-20 ${isWrong ? 'shake' : ''}`}
            >
              <div
                className="relative h-full w-full rounded-xl transition-transform duration-300 [transform-style:preserve-3d]"
                style={{ transform: isUp ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-surface2 to-surface [backface-visibility:hidden] hover:brightness-125">
                  <div className="grid grid-cols-2 gap-1.5 opacity-50">
                    <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" />
                    <span className="h-1.5 w-1.5 rounded-[2px] bg-secondary" />
                    <span className="h-1.5 w-1.5 rounded-[2px] bg-secondary" />
                    <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" />
                  </div>
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-xl transition-shadow [backface-visibility:hidden] ${
                    isMatched
                      ? 'bg-gradient-to-br from-success/25 to-success/10 shadow-[0_0_16px_rgb(34,197,94,0.35)]'
                      : isWrong
                        ? 'bg-danger/15'
                        : 'bg-primary/20'
                  }`}
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${isMatched ? 'text-success' : 'text-text'}`} strokeWidth={1.75} />
                </div>
              </div>
            </button>
          )
        })}
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
