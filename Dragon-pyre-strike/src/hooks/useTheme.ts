import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type Theme = 'light' | 'dark'

/**
 * DracoPyre Strike defaults to the dark "Dragonforge" gaming theme; the
 * colorful/light theme is an explicit opt-in -- independent of the OS's
 * prefers-color-scheme. Built on
 * useLocalStorage so the choice syncs across tabs and persists locally
 * (key: "dracopyre:theme"). Applied via a `data-theme` attribute on <html>,
 * which every color in index.css reads from. A tiny inline script in
 * index.html applies the stored choice before first paint so there's no
 * flash of the wrong theme on reload.
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', theme === 'dark' ? '#0a080a' : '#fdfaf6')
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, setTheme, toggleTheme }
}
