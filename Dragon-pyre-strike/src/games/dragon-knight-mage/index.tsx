import { useState } from 'react'
import { RotateCcw, Flame, Shield, Sparkles, type LucideIcon } from 'lucide-react'
import type { GamePlayProps } from '../registry'
import { sfx } from '@/utils/sound'

type Choice = 'dragon' | 'knight' | 'mage'
const CHOICES: Choice[] = ['dragon', 'knight', 'mage']

const ICONS: Record<Choice, LucideIcon> = { dragon: Flame, knight: Shield, mage: Sparkles }
const LABELS: Record<Choice, string> = { dragon: 'Dragon', knight: 'Knight', mage: 'Mage' }
// Dragon scorches Knight's steel, Knight's blade silences the Mage, the Mage's
// spellcraft binds the Dragon -- the oldest three-way standoff in the realm.
const BEATS: Record<Choice, Choice> = { dragon: 'knight', knight: 'mage', mage: 'dragon' }
const VERB: Record<Choice, string> = { dragon: 'scorches', knight: 'silences', mage: 'binds' }

const CHOICE_GRADIENTS: Record<Choice, string> = {
  dragon: 'from-red-600 to-orange-700',
  knight: 'from-slate-400 to-slate-600',
  mage: 'from-indigo-500 to-purple-700',
}

export default function DragonKnightMage({ soundOn }: GamePlayProps) {
  const [player, setPlayer] = useState<Choice | null>(null)
  const [cpu, setCpu] = useState<Choice | null>(null)
  const [result, setResult] = useState<'win' | 'lose' | 'tie' | null>(null)
  const [tally, setTally] = useState({ wins: 0, losses: 0, ties: 0 })
  const [round, setRound] = useState(0)

  function play(choice: Choice) {
    const cpuChoice = CHOICES[Math.floor(Math.random() * 3)]
    setPlayer(choice)
    setCpu(cpuChoice)
    setRound((r) => r + 1)

    let outcome: 'win' | 'lose' | 'tie'
    if (choice === cpuChoice) outcome = 'tie'
    else if (BEATS[choice] === cpuChoice) outcome = 'win'
    else outcome = 'lose'

    setResult(outcome)
    setTally((t) => ({
      wins: t.wins + (outcome === 'win' ? 1 : 0),
      losses: t.losses + (outcome === 'lose' ? 1 : 0),
      ties: t.ties + (outcome === 'tie' ? 1 : 0),
    }))

    if (soundOn) {
      if (outcome === 'win') sfx.win()
      else if (outcome === 'lose') sfx.hit()
      else sfx.blip()
    }
  }

  function resetTally() {
    setTally({ wins: 0, losses: 0, ties: 0 })
    setPlayer(null)
    setCpu(null)
    setResult(null)
    setRound(0)
  }

  const resultText = (() => {
    if (!result) return 'Choose your side'
    if (result === 'tie') return 'A standoff \u2014 go again'
    if (!player || !cpu) return ''
    const winner = result === 'win' ? player : cpu
    const loser = result === 'win' ? cpu : player
    const verb = VERB[winner]
    return `${LABELS[winner]} ${verb} the ${LABELS[loser]}${result === 'win' ? ' \u2014 you win!' : ' \u2014 the realm favors the house.'}`
  })()

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 py-4">
      <div className="stat-mono flex items-center gap-6 text-sm text-textMuted">
        <span className="text-success">Wins: {tally.wins}</span>
        <span>Ties: {tally.ties}</span>
        <span className="text-danger">Losses: {tally.losses}</span>
      </div>

      <div className="flex w-full items-center justify-center gap-6 sm:gap-10">
        <PlayerTile choice={player} highlight={result === 'win' ? 'win' : result === 'lose' ? 'lose' : result === 'tie' ? 'tie' : null} label="You" round={round} />
        <span className="font-display text-lg font-bold text-muted">VS</span>
        <PlayerTile
          choice={cpu}
          highlight={result === 'lose' ? 'win' : result === 'win' ? 'lose' : result === 'tie' ? 'tie' : null}
          label="The Realm"
          round={round}
        />
      </div>

      <p
        aria-live="polite"
        className={`rounded-full px-4 py-1.5 text-center text-sm font-bold transition-colors ${
          result === 'win'
            ? 'bg-success/15 text-success'
            : result === 'lose'
              ? 'bg-danger/15 text-danger'
              : result === 'tie'
                ? 'bg-warning/15 text-warning'
                : 'font-display text-lg text-text'
        }`}
      >
        {resultText}
      </p>

      <div className="flex gap-3">
        {CHOICES.map((c) => {
          const Icon = ICONS[c]
          return (
            <button
              key={c}
              onClick={() => play(c)}
              className={`btn-focus flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform hover:-translate-y-1 active:scale-95 sm:h-20 sm:w-20 ${CHOICE_GRADIENTS[c]} ${
                player === c ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-bg' : ''
              }`}
              aria-label={LABELS[c]}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{LABELS[c]}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={resetTally}
        className="btn-focus flex items-center gap-1.5 rounded-full border border-text/10 bg-surface px-4 py-2 text-xs font-medium text-textMuted transition-colors hover:text-text"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset Score
      </button>
    </div>
  )
}

function PlayerTile({
  choice,
  highlight,
  label,
  round,
}: {
  choice: Choice | null
  highlight: 'win' | 'lose' | 'tie' | null
  label: string
  round: number
}) {
  const Icon = choice ? ICONS[choice] : null
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        key={`${label}-${round}`}
        className={`pop-in flex h-24 w-24 items-center justify-center rounded-2xl bg-surface2 ring-2 transition-all ${
          highlight === 'win'
            ? 'ring-success shadow-[0_0_24px_rgb(34,197,94,0.4)]'
            : highlight === 'lose'
              ? 'opacity-60 ring-danger/30'
              : highlight === 'tie'
                ? 'ring-warning/60'
                : 'ring-transparent'
        }`}
      >
        {Icon ? <Icon className="h-10 w-10 text-text" strokeWidth={1.75} /> : <span className="font-display text-2xl text-muted">?</span>}
      </div>
      <span className="text-xs text-textMuted">{label}</span>
    </div>
  )
}
