import { useRealmTheme } from '@/dps'

export type Theme = 'light' | 'dark'

/**
 * The hub shares ONE theme with every game in the Realm (Dragon = dark, Classic = light).
 * The shared module paints <html data-theme> and saves the choice to the account when signed in.
 */
export function useTheme() {
  const [realm, setRealm] = useRealmTheme()
  const theme: Theme = realm === 'dragon' ? 'dark' : 'light'
  const setTheme = (t: Theme) => setRealm(t === 'dark' ? 'dragon' : 'classic')
  const toggleTheme = () => setRealm(realm === 'dragon' ? 'classic' : 'dragon')
  return { theme, setTheme, toggleTheme }
}
