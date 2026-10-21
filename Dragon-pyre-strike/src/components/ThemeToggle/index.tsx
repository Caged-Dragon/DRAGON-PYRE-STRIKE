import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to colorful theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to colorful theme' : 'Switch to dark theme'}
      className="btn-focus rounded-full p-2 text-textMuted transition-colors hover:bg-surface2 hover:text-text"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
