import { useState, useEffect, useRef } from 'react';
import { DragonSkin, PageState, ThemeMode } from './types/game';
import { SKINS } from './data/gameData';
import { IntroScreen } from './components/IntroScreen';
import { GameCanvas } from './components/GameCanvas';
import { soundManager } from './utils/audio';
import { DragonDock, loadCloudSave, queueCloudSave, reportRun, useAuth } from './dps';

const STORAGE_KEY_SCORES = 'dragon_flight_scores';
const STORAGE_KEY_SKIN = 'dragon_flight_skin';
const STORAGE_KEY_SOUND = 'dragon_flight_sound';
const STORAGE_KEY_THEME = 'dragon_flight_theme';

interface FlightSave {
  high: number;
  total: number;
  skin?: string;
}

export default function App() {
  const { user } = useAuth();
  const [page, setPage] = useState<PageState>('intro');
  const [currentSkin, setCurrentSkin] = useState<DragonSkin>(SKINS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [highScore, setHighScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    try {
      const storedScores = localStorage.getItem(STORAGE_KEY_SCORES);
      if (storedScores) {
        const scores = JSON.parse(storedScores) as { high: number; total: number };
        setHighScore(scores.high || 0);
        setTotalScore(scores.total || 0);
      }
      const storedSkinId = localStorage.getItem(STORAGE_KEY_SKIN);
      if (storedSkinId) {
        const found = SKINS.find((s) => s.id === storedSkinId);
        if (found) setCurrentSkin(found);
      }
      const storedSound = localStorage.getItem(STORAGE_KEY_SOUND);
      if (storedSound !== null) {
        const enabled = storedSound === 'true';
        setSoundEnabled(enabled);
        soundManager.enabled = enabled;
      }
      const storedTheme = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Latest values for cloud pushes (updateHighScore is called many times per run).
  const latest = useRef<FlightSave>({ high: 0, total: 0, skin: SKINS[0].id });
  latest.current = { high: highScore, total: totalScore, skin: currentSkin.id };
  const pushCloud = (patch: Partial<FlightSave> = {}) =>
    queueCloudSave('dragon-flight', 'main', { ...latest.current, ...patch });

  // On sign-in: merge local + cloud progress (best of both) and keep them in sync.
  const uid = user?.id;
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void (async () => {
      const cloud = await loadCloudSave<FlightSave>('dragon-flight', 'main');
      if (!alive) return;
      const d = cloud?.data;
      const high = Math.max(latest.current.high, d?.high ?? 0);
      const total = Math.max(latest.current.total, d?.total ?? 0);
      setHighScore(high);
      setTotalScore(total);
      try { localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify({ high, total })); } catch { /* ignore */ }
      let skinId = latest.current.skin;
      if (d?.skin) {
        const found = SKINS.find((s) => s.id === d.skin);
        if (found) {
          setCurrentSkin(found);
          skinId = found.id;
          try { localStorage.setItem(STORAGE_KEY_SKIN, found.id); } catch { /* ignore */ }
        }
      }
      queueCloudSave('dragon-flight', 'main', { high, total, skin: skinId }, 1, 500);
      // First time on the leaderboard? Post the best run played before the account existed.
      if (!cloud && high > 0) void reportRun('dragon-flight', high, { source: 'local-best' });
    })();
    return () => { alive = false; };
  }, [uid]);

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#07060b' : '#f8fafc';
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY_THEME, next); } catch { /* ignore */ }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    try { localStorage.setItem(STORAGE_KEY_SOUND, String(next)); } catch { /* ignore */ }
  };

  const selectSkin = (skin: DragonSkin) => {
    setCurrentSkin(skin);
    try { localStorage.setItem(STORAGE_KEY_SKIN, skin.id); } catch { /* ignore */ }
    pushCloud({ skin: skin.id });
  };

  const updateHighScore = (score: number) => {
    setHighScore((prev) => {
      const next = Math.max(prev, score);
      setTotalScore((prevTotal) => {
        const newTotal = Math.max(prevTotal, score);
        try {
          localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify({ high: next, total: newTotal }));
        } catch { /* ignore */ }
        pushCloud({ high: next, total: newTotal });
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
