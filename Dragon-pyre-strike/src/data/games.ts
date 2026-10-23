import type { CategoryId } from './categories'
import { siteUrl } from '@/dps'

export type SortKey = 'popular' | 'rating' | 'newest' | 'az'
export type ScoreDirection = 'high' | 'low'

export interface GameMeta {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string
  category: CategoryId
  tags: string[]
  icon: string
  gradient: string
  rating: number
  playCount: number
  releaseDate: string
  featured?: boolean
  trending?: boolean
  new?: boolean
  hot?: boolean
  controls: { desktop: string[]; mobile: string[] }
  howToPlay: string[]
  features: string[]
  hasScore: boolean
  scoreDirection: ScoreDirection
  scoreUnit: string
  /** Set only for games hosted on their own separate site (hub-and-spoke). */
  externalUrl?: string
}

// NOTE ON DATA: rating / playCount below are structured placeholder demo
// values (Section 52 of the brief) -- shaped exactly like real analytics
// would be, so a future `/api/games` response can replace this file without
// touching any UI component. Nothing here is presented as live/real-world data.

export const GAMES: GameMeta[] = [
  {
    id: 'g-dragon-strike',
    title: 'Dragon Strike',
    slug: 'dragon-strike',
    description:
      'Take to the sky as the realm\u2019s last dragon and hold the line against a hunting party of airborne wyverns. Breathe fire, dodge steel, and chain kills before your wings give out.',
    shortDescription: 'Breathe fire, dodge steel, survive the hunt.',
    category: 'action',
    tags: ['dragon', 'shooter', 'flight', 'arcade', 'reflex', 'waves'],
    icon: 'Crosshair',
    gradient: 'from-orange-700 via-red-700 to-rose-900',
    rating: 4.7,
    playCount: 128400,
    releaseDate: '2026-07-02',
    featured: true,
    trending: true,
    hot: true,
    controls: {
      desktop: ['\u2190 \u2192 or A / D to move', 'Space to breathe fire', 'P to pause'],
      mobile: ['Drag anywhere to move', 'Tap to breathe fire'],
    },
    howToPlay: [
      'Move left and right to weave through the hunting party.',
      'Breathe fire at wyverns before they close in.',
      'Avoid direct hits \u2014 you have 3 lives.',
      'Survive as long as you can to post a high score.',
    ],
    features: ['Endless mode + 12-realm campaign', '8 dragons to awaken', '14 achievements', 'Cloud saves & global ranks'],
    hasScore: true,
    scoreDirection: 'high',
    scoreUnit: 'pts',
    externalUrl: siteUrl('dragon-strike'),
  },
  {
    id: 'g-ember-wyrm',
    title: 'Ember Wyrm',
    slug: 'ember-wyrm',
    description:
      'Guide a young fire-wyrm through ten hand-built lairs, from a green meadow to an ancient dragon\u2019s throne room. Slip through rift portals, dodge collapsing walls, and grow long enough to claim each ember before your own tail catches up. Ember Wyrm lives on its own site \u2014',
    shortDescription: 'Ten lairs, three modes, one hungry wyrm.',
    category: 'arcade',
    tags: ['dragon', 'wyrm', 'classic', 'grid', 'levels', 'portals'],
    icon: 'Flame',
    gradient: 'from-red-600 via-orange-600 to-amber-500',
    rating: 4.6,
    playCount: 214800,
    releaseDate: '2026-05-14',
    trending: true,
    hot: true,
    controls: {
      desktop: ['Arrow keys or WASD to steer', 'Enter / Space to select in menus', 'P or Esc to pause'],
      mobile: ['Swipe to steer', 'Tap to select in menus'],
    },
    howToPlay: [
      'Choose Classic, Constant Level, or Level Campaign from the main menu.',
      'Steer the wyrm toward glowing embers to grow.',
      'Slip through blue rift portals to warp across the lair \u2014 red rifts are traps.',
      'Clear a lair\u2019s target area to advance. Sign in with your Dragon Realm account and your progress and best scores follow you across every game.',
    ],
    features: ['10 hand-built levels', '3 game modes', '5 speed settings', 'Rift portals', 'Save & continue'],
    hasScore: false,
    scoreDirection: 'high',
    scoreUnit: 'pts',
    externalUrl: siteUrl('ember-wyrm'),
  },
  {
    id: 'g-dragons-hoard',
    title: 'Dragon\u2019s Hoard',
    slug: 'dragons-hoard',
    description:
      'Slide treasure across the vault floor, merge matching coins into ever-richer stacks, and chase the legendary hoard tile. Simple to start, brutal to master.',
    shortDescription: 'Merge treasure, chase the legendary hoard.',
    category: 'puzzle',
    tags: ['dragon', 'hoard', 'puzzle', 'numbers', 'merge', 'singleplayer'],
    icon: 'Coins',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    rating: 4.8,
    playCount: 189200,
    releaseDate: '2026-06-20',
    trending: true,
    hot: true,
    controls: {
      desktop: ['Arrow keys to slide tiles'],
      mobile: ['Swipe in any direction to slide tiles'],
    },
    howToPlay: [
      'Swipe or press arrow keys to slide every coin in one direction.',
      'Matching coins merge into a richer stack.',
      'A new coin appears after every move.',
      'Reach the 2048 stack to claim the hoard \u2014 or keep piling higher.',
    ],
    features: ['Classic merge rules', 'Keeps playing past the goal', 'Local high scores'],
    hasScore: true,
    scoreDirection: 'high',
    scoreUnit: 'pts',
  },
  {
    id: 'g-drakebreaker',
    title: 'Drakebreaker',
    slug: 'drakebreaker',
    description:
      'Fifty levels across five realms of ash, ice, storm, void and flame \u2014 shatter every ward-stone, fill your dragon\u2019s rage meter, and unleash its wrath on the toughest blocks. Drakebreaker lives on its own site \u2014',
    shortDescription: '50 levels, 5 realms, one furious dragon.',
    category: 'action',
    tags: ['dragon', 'drakebreaker', 'breakout', 'brick breaker', 'levels', 'classic'],
    icon: 'Blocks',
    gradient: 'from-orange-600 via-red-600 to-red-900',
    rating: 4.5,
    playCount: 96300,
    releaseDate: '2026-04-11',
    controls: {
      desktop: ['\u2190 \u2192 or mouse to move', 'Space to launch', 'Fill the rage meter for a dragon\u2019s-wrath power shot'],
      mobile: ['Drag to move', 'Tap to launch'],
    },
    howToPlay: [
      'Move the paddle to keep the ball in play.',
      'Shatter every ward-stone to clear a level.',
      'Fill the rage meter by breaking blocks, then unleash the dragon\u2019s wrath.',
      'Fifty levels span five realms \u2014 progress and best scores save on that site.',
    ],
    features: ['50 hand-built levels', '5 themed realms', 'Dragon rage power-up', 'Its own save system'],
    hasScore: false,
    scoreDirection: 'high',
    scoreUnit: 'pts',
    externalUrl: siteUrl('drakebreaker'),
  },
  {
    id: 'g-dragon-flight',
    title: 'Dragon Flight',
    slug: 'dragon-flight',
    description:
      'Master the celestial skies on a young dragon\u2019s wings. Fly through five elemental realms that shift without warning, dodging obstacles as the world changes around you. Dragon Flight lives on its own site \u2014',
    shortDescription: 'Five realms, one flight, the sky keeps changing.',
    category: 'arcade',
    tags: ['dragon', 'flight', 'reflex', 'endless', 'one-button', 'elemental realms'],
    icon: 'Bird',
    gradient: 'from-orange-500 via-red-600 to-slate-800',
    rating: 4.3,
    playCount: 154700,
    releaseDate: '2026-03-27',
    controls: {
      desktop: ['Space or \u2191 to flap'],
      mobile: ['Tap anywhere to flap'],
    },
    howToPlay: [
      'Tap or press space to flap upward.',
      'Gravity pulls you down between wingbeats.',
      'The realm shifts between five elements as you fly \u2014 stay sharp.',
      'Pick a dragon skin and go for distance.',
    ],
    features: ['5 shifting elemental realms', 'Selectable dragon skins', 'Its own save system'],
    hasScore: false,
    scoreDirection: 'high',
    scoreUnit: 'pts',
    externalUrl: siteUrl('dragon-flight'),
  },
  {
    id: 'g-dragon-2048',
    title: 'Dragon 2048',
    slug: 'dragon-2048',
    description:
      'Slide and merge matching tiles to hatch a humble egg into the Dragon Lord. Three grid sizes, a dragon codex of every form you have raised, and a Classic mode for purists. Dragon 2048 lives on its own site.',
    shortDescription: 'Merge eggs into the Dragon Lord.',
    category: 'puzzle',
    tags: ['2048', 'puzzle', 'merge', 'dragon', 'tiles', 'classic'],
    icon: 'Grid3x3',
    gradient: 'from-amber-600 via-orange-700 to-red-900',
    rating: 4.6,
    playCount: 54200,
    releaseDate: '2026-10-01',
    new: true,
    controls: {
      desktop: ['Arrow keys or W A S D to slide', 'Merge equal tiles'],
      mobile: ['Swipe to slide'],
    },
    howToPlay: ['Slide every tile in one direction.', 'Equal tiles merge into the next form.', 'Reach 2048 to awaken the Dragon Lord.', 'Pick 3x3, 4x4 or 5x5 to change the challenge.'],
    features: ['3 grid sizes', 'Dragon codex', 'Dragon and Classic themes', 'Cloud-saved progress'],
    hasScore: true,
    scoreDirection: 'high',
    scoreUnit: 'pts',
    externalUrl: siteUrl('dragon-2048'),
  },
  {
    id: 'g-dragon-sudoku',
    title: 'Dragon Sudoku',
    slug: 'dragon-sudoku',
    description:
      'Classic Sudoku with four difficulties, notes, hints and a conflict checker, dressed in crisp Classic paper or the glowing Dragon Cave. Dragon Sudoku lives on its own site.',
    shortDescription: 'Classic grids, dragon-cave nights.',
    category: 'puzzle',
    tags: ['sudoku', 'puzzle', 'logic', 'numbers', 'classic', 'dragon'],
    icon: 'Hash',
    gradient: 'from-slate-700 via-indigo-800 to-slate-950',
    rating: 4.5,
    playCount: 41800,
    releaseDate: '2026-10-02',
    new: true,
    controls: {
      desktop: ['Click a cell, type 1-9', 'N toggles notes'],
      mobile: ['Tap a cell, tap a number'],
    },
    howToPlay: ['Fill every row, column and 3x3 box with 1-9.', 'No digit may repeat in a row, column or box.', 'Use notes for candidates and hints when stuck.', 'Faster solves on harder grids score more.'],
    features: ['4 difficulties', 'Notes and hints', 'Dragon and Classic themes', 'Cloud-saved settings and best times'],
    hasScore: true,
    scoreDirection: 'high',
    scoreUnit: 'pts',
    externalUrl: siteUrl('dragon-sudoku'),
  },
  {
    id: 'g-dragon-tictactoe',
    title: 'Dragon Tic-Tac-Toe',
    slug: 'dragon-tictactoe',
    description:
      'Tic-tac-toe with a smart computer opponent or a friend, Classic and Dragon Arena looks, and a running scoreboard. Dragon Tic-Tac-Toe lives on its own site.',
    shortDescription: 'Three in a row, claw to claw.',
    category: 'strategy',
    tags: ['tic-tac-toe', 'strategy', 'two player', 'classic', 'dragon', 'board'],
    icon: 'Target',
    gradient: 'from-red-700 via-orange-700 to-yellow-800',
    rating: 4.4,
    playCount: 38900,
    releaseDate: '2026-10-03',
    new: true,
    controls: {
      desktop: ['Click a square to play'],
      mobile: ['Tap a square to play'],
    },
    howToPlay: ['Take turns placing your mark.', 'Three in a row wins.', 'Play the computer or a friend on the same screen.', 'Win streaks add to your score.'],
    features: ['Versus computer or friend', 'Dragon and Classic themes', 'Scoreboard', 'Cloud-saved settings'],
    hasScore: true,
    scoreDirection: 'high',
    scoreUnit: 'pts',
    externalUrl: siteUrl('dragon-tictactoe'),
  },
  {
    id: 'g-dragons-lair',
    title: 'Dragon\u2019s Lair',
    slug: 'dragons-lair',
    description:
      'Somewhere in this cave, sleeping dragons lie curled beneath the stone. Read the warnings, mark what you suspect, and clear every safe tile without waking one.',
    shortDescription: 'Read the warnings. Don\u2019t wake a sleeping dragon.',
    category: 'strategy',
    tags: ['dragon', 'lair', 'logic', 'grid', 'classic'],
    icon: 'Skull',
    gradient: 'from-stone-700 via-red-900 to-orange-700',
    rating: 4.6,
    playCount: 87100,
    releaseDate: '2026-08-05',
    new: true,
    controls: {
      desktop: ['Left-click to reveal', 'Right-click to mark'],
      mobile: ['Tap to reveal', 'Long-press to mark'],
    },
    howToPlay: [
      'Reveal a tile \u2014 a number shows how many sleeping dragons are nearby.',
      'Mark tiles you\u2019re sure hide a dragon.',
      'Clear every safe tile to win. Wake one dragon and the run ends.',
    ],
    features: ['Safe first click', 'Flood-fill reveal', 'Live timer', 'Best-time tracking'],
    hasScore: true,
    scoreDirection: 'low',
    scoreUnit: 'sec',
  },
  {
    id: 'g-dragons-memory',
    title: 'Dragon\u2019s Memory',
    slug: 'dragons-memory',
    description:
      'Flip the runes hidden across a dragon\u2019s scattered hoard and remember where each treasure lies. Clear the vault in as few flips as you can manage.',
    shortDescription: 'Flip, remember, and clear the hoard.',
    category: 'puzzle',
    tags: ['dragon', 'hoard', 'memory', 'cards', 'relaxed'],
    icon: 'Gem',
    gradient: 'from-amber-500 via-yellow-500 to-red-600',
    rating: 4.4,
    playCount: 71200,
    releaseDate: '2026-02-18',
    controls: {
      desktop: ['Click a rune to flip it'],
      mobile: ['Tap a rune to flip it'],
    },
    howToPlay: [
      'Flip two runes to reveal the treasure beneath.',
      'Matching treasures stay uncovered.',
      'A mismatch flips back \u2014 remember what you saw.',
      'Clear the whole hoard in as few moves as you can.',
    ],
    features: ['Shuffled every round', 'Move counter', 'Best-moves tracking'],
    hasScore: true,
    scoreDirection: 'low',
    scoreUnit: 'moves',
  },
  {
    id: 'g-dragon-knight-mage',
    title: 'Dragon, Knight & Mage',
    slug: 'dragon-knight-mage',
    description:
      'The oldest standoff in the realm: dragonfire scorches steel, steel silences spellcraft, spellcraft binds the dragon. Pick your side and see who the realm favors.',
    shortDescription: 'Dragon burns Knight. Knight silences Mage. Mage binds Dragon.',
    category: 'casual',
    tags: ['dragon', 'knight', 'mage', 'quick', 'local multiplayer', 'party'],
    icon: 'Swords',
    gradient: 'from-red-600 via-slate-600 to-indigo-600',
    rating: 4.1,
    playCount: 63900,
    releaseDate: '2026-01-22',
    controls: {
      desktop: ['Click Dragon, Knight or Mage'],
      mobile: ['Tap Dragon, Knight or Mage'],
    },
    howToPlay: [
      'Choose Dragon, Knight, or Mage.',
      'Dragon beats Knight, Knight beats Mage, Mage beats Dragon.',
      'Matching picks are a standoff \u2014 go again.',
    ],
    features: ['Running win/loss tally', 'Instant rounds', 'No two rounds alike'],
    hasScore: false,
    scoreDirection: 'high',
    scoreUnit: 'pts',
  },
  {
    id: 'g-dragons-realm',
    title: 'Dragon\u2019s Realm',
    slug: 'dragons-realm',
    description:
      'Two clans, one realm, nine territories. Plant your sigil across the map and claim three in a row before your rival locks you out.',
    shortDescription: 'Claim three territories in a row to win the realm.',
    category: 'strategy',
    tags: ['dragon', 'realm', 'local multiplayer', 'quick', 'party'],
    icon: 'Flag',
    gradient: 'from-red-800 via-red-600 to-orange-500',
    rating: 4.2,
    playCount: 58400,
    releaseDate: '2025-12-09',
    controls: {
      desktop: ['Click a territory to plant your sigil'],
      mobile: ['Tap a territory to plant your sigil'],
    },
    howToPlay: [
      'Players take turns planting their sigil on an open territory.',
      'Claim three territories in a row \u2014 across, down or diagonal \u2014 to win.',
      'Every territory claimed with no winner? The realm stays contested \u2014 a draw.',
    ],
    features: ['Local 2-player', 'Winning line highlight', 'Match tally'],
    hasScore: false,
    scoreDirection: 'high',
    scoreUnit: 'pts',
  },
  {
    id: 'g-dragons-riddle',
    title: 'Dragon\u2019s Riddle',
    slug: 'dragons-riddle',
    description:
      'An ancient dragon guards a hoard of gold coins \u2014 somewhere between 1 and 100 of them. Answer its riddle in as few guesses as you can.',
    shortDescription: 'Guess the size of the hoard, one riddle at a time.',
    category: 'casual',
    tags: ['dragon', 'riddle', 'number', 'logic', 'relaxed', 'quick'],
    icon: 'Target',
    gradient: 'from-amber-300 via-orange-500 to-red-600',
    rating: 4.0,
    playCount: 41500,
    releaseDate: '2026-08-12',
    new: true,
    controls: {
      desktop: ['Type a number and press Enter'],
      mobile: ['Tap the input, type a number, tap Guess'],
    },
    howToPlay: [
      'Enter a guess between 1 and 100.',
      'The dragon tells you if the true count is higher or lower.',
      'Narrow it down and guess again \u2014 fewer guesses pleases the dragon more.',
    ],
    features: ['Guess history', 'Best-attempts tracking', 'New hoard every round'],
    hasScore: true,
    scoreDirection: 'low',
    scoreUnit: 'guesses',
  },
]

export function getGameBySlug(slug: string | undefined): GameMeta | undefined {
  if (!slug) return undefined
  return GAMES.find((g) => g.slug === slug)
}

export function sortGames(list: GameMeta[], sort: SortKey): GameMeta[] {
  const copy = [...list]
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating)
    case 'newest':
      return copy.sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
    case 'az':
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    case 'popular':
    default:
      return copy.sort((a, b) => b.playCount - a.playCount)
  }
}

export function searchGames(list: GameMeta[], query: string): GameMeta[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return list
  return list.filter(
    (g) =>
      g.title.toLowerCase().includes(needle) ||
      g.description.toLowerCase().includes(needle) ||
      g.category.toLowerCase().includes(needle) ||
      g.tags.some((t) => t.toLowerCase().includes(needle)),
  )
}

export function getRelatedGames(game: GameMeta, limit = 4): GameMeta[] {
  const sameCategory = GAMES.filter((g) => g.slug !== game.slug && g.category === game.category)
  if (sameCategory.length >= limit) return sortGames(sameCategory, 'popular').slice(0, limit)
  const fillers = sortGames(
    GAMES.filter((g) => g.slug !== game.slug && !sameCategory.includes(g)),
    'popular',
  )
  return [...sameCategory, ...fillers].slice(0, limit)
}

export function getFeaturedGame(): GameMeta {
  return GAMES.find((g) => g.featured) ?? sortGames(GAMES, 'popular')[0]
}
