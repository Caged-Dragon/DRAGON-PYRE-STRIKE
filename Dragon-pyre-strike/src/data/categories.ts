export type CategoryId =
  | 'action'
  | 'adventure'
  | 'arcade'
  | 'puzzle'
  | 'racing'
  | 'sports'
  | 'strategy'
  | 'casual'
  | 'multiplayer'

export interface Category {
  id: CategoryId
  title: string
  description: string
  icon: string
  gradient: string
}

export const CATEGORIES: Category[] = [
  {
    id: 'action',
    title: 'Action',
    description: 'Fast reflexes, faster enemies. Blast, dodge and survive.',
    icon: 'Crosshair',
    gradient: 'from-rose-500 via-red-500 to-orange-500',
  },
  {
    id: 'adventure',
    title: 'Adventure',
    description: 'Explore new worlds and uncover what they hide.',
    icon: 'Compass',
    gradient: 'from-teal-500 via-emerald-500 to-lime-500',
  },
  {
    id: 'arcade',
    title: 'Arcade',
    description: 'Pick-up-and-play classics built for one more round.',
    icon: 'Joystick',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    id: 'puzzle',
    title: 'Puzzle',
    description: 'Brain-benders, merges and matches to slow down with.',
    icon: 'Puzzle',
    gradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
  },
  {
    id: 'racing',
    title: 'Racing',
    description: 'Speed, precision and the perfect line.',
    icon: 'Car',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
  {
    id: 'sports',
    title: 'Sports',
    description: 'Score, sink and spike your way to the top.',
    icon: 'Volleyball',
    gradient: 'from-orange-400 via-amber-500 to-yellow-500',
  },
  {
    id: 'strategy',
    title: 'Strategy',
    description: 'Outthink the board. Every move counts.',
    icon: 'Swords',
    gradient: 'from-indigo-500 via-violet-500 to-purple-600',
  },
  {
    id: 'casual',
    title: 'Casual',
    description: 'Low-stakes, high-fun. Easy to learn, hard to put down.',
    icon: 'Coffee',
    gradient: 'from-cyan-500 via-sky-500 to-blue-600',
  },
  {
    id: 'multiplayer',
    title: 'Multiplayer',
    description: 'Local head-to-head today — online rooms are on the roadmap.',
    icon: 'Users',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
  },
]

export function getCategory(id: string | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}
