import { useRealmTheme } from "../dps";

export type ThemeName = "dark" | "light";

/**
 * Dark / light for the game's canvas and CSS, driven by the Realm-wide theme
 * (Dragon = dark, Classic = light). The shared module paints <html data-theme> and saves the choice to the account.
 */
export function useTheme() {
  const [realm, setRealm] = useRealmTheme();
  const theme: ThemeName = realm === "dragon" ? "dark" : "light";
  const setTheme = (t: ThemeName) => setRealm(t === "dark" ? "dragon" : "classic");
  const toggleTheme = () => setRealm(realm === "dragon" ? "classic" : "dragon");
  return { theme, setTheme, toggleTheme };
}
