import { useState, useEffect } from 'react';
import { DragonSkin, PageState, ThemeMode } from './types/game';
import { SKINS } from './data/gameData';
import { IntroScreen } from './components/IntroScreen';
import { GameCanvas } from './components/GameCanvas';
import { soundManager } from './utils/audio';
import { DragonDock, store, useRealmTheme } from './dps';


const STORAGE_KEY_SCORES = 'dragon_flight_scores';
const STORAGE_KEY_SKIN = 'dragon_flight_skin';
const STORAGE_KEY_SOUND = 'dragon_flight_sound';


export default function App() {
  const [page, setPage] = useState<PageState>('intro');
  const [currentSkin, setCurrentSkin] = useState<DragonSkin>(SKINS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [realm, setRealm] = useRealmTheme();
  const theme: ThemeMode = realm === 'dragon' ? 'dark' : 'light';
  const [highScore, setHighScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    try {
      const storedScores = store.getItem(STORAGE_KEY_SCORES);
      if (storedScores) {
        const scores = JSON.parse(storedScores) as { high: number; total: number };
        setHighScore(scores.high || 0);
        setTotalScore(scores.total || 0);
      }
      const storedSkinId = store.getItem(STORAGE_KEY_SKIN);
      if (storedSkinId) {
        const found = SKINS.find((s) => s.id === storedSkinId);
        if (found) setCurrentSkin(found);
      }
      const storedSound = store.getItem(STORAGE_KEY_SOUND);
      if (storedSound !== null) {
        const enabled = storedSound === 'true';
        setSoundEnabled(enabled);
        soundManager.enabled = enabled;
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#07060b' : '#f8fafc';
  }, [theme]);

  const toggleTheme = () => {
    setRealm(realm === 'dragon' ? 'classic' : 'dragon');
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    try { store.setItem(STORAGE_KEY_SOUND, String(next)); } catch { /* ignore */ }
  };

  const selectSkin = (skin: DragonSkin) => {
    setCurrentSkin(skin);
    try { store.setItem(STORAGE_KEY_SKIN, skin.id); } catch { /* ignore */ }
  };

  const updateHighScore = (score: number) => {
    setHighScore((prev) => {
      const next = Math.max(prev, score);
      setTotalScore((prevTotal) => {
        const newTotal = Math.max(prevTotal, score);
        try {
          store.setItem(STORAGE_KEY_SCORES, JSON.stringify({ high: next, total: newTotal }));
        } catch { /* ignore */ }
        return newTotal;
      });
      return next;
    });
  };

  return (
    <div className="w-full h-full">
      <DragonDock siteSlug="dragon-flight" position="bottom-left" />
      {page === 'intro' && (
        <IntroScreen
          onStartGame={() => setPage('game')}
          selectedSkin={currentSkin}
          onSelectSkin={selectSkin}
          highScore={highScore}
          totalScore={totalScore}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {page === 'game' && (
        <GameCanvas
          skin={currentSkin}
          onBackToIntro={() => setPage('intro')}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          theme={theme}
          onToggleTheme={toggleTheme}
          highScore={highScore}
          onUpdateHighScore={updateHighScore}
        />
      )}
    </div>
  );
}
