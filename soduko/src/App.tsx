import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "./utils/cn";
import type { Difficulty } from "./lib/sudoku";
import { THEMES, type ThemeId } from "./themes";
import { useSudokuGame } from "./hooks/useSudokuGame";
import { useGameSounds } from "./hooks/useGameSounds";
import { MenuScreen } from "./components/MenuScreen";
import { GameScreen } from "./components/GameScreen";
import { PaywallModal } from "./components/PaywallModal";
import { WinModal } from "./components/WinModal";
import { DragonCave } from "./components/DragonArt";

type Screen = "menu" | "game";

interface UserPrefs {
  themeId: ThemeId;
  subscribed: boolean;
  soundEnabled: boolean;
  bestTimes: Partial<Record<Difficulty, number>>;
  gamesSolved: number;
}

const PREFS_KEY = "sudoku.prefs.v2";

function loadPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return {
        themeId: "classic",
        subscribed: false,
        soundEnabled: true,
        bestTimes: {},
        gamesSolved: 0,
      };
    }
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    const sub = Boolean(parsed.subscribed);
    return {
      themeId: parsed.themeId === "dragon" && sub ? "dragon" : "classic",
      subscribed: sub,
      soundEnabled: parsed.soundEnabled ?? true,
      bestTimes: parsed.bestTimes ?? {},
      gamesSolved: parsed.gamesSolved ?? 0,
    };
  } catch {
    return {
      themeId: "classic",
      subscribed: false,
      soundEnabled: true,
      bestTimes: {},
      gamesSolved: 0,
    };
  }
}

export default function App() {
  const initialPrefs = loadPrefs();
  const [screen, setScreen] = useState<Screen>("menu");
  const [themeId, setThemeId] = useState<ThemeId>(initialPrefs.themeId);
  const [subscribed, setSubscribed] = useState<boolean>(
    initialPrefs.subscribed
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    initialPrefs.soundEnabled
  );
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [bestTimes, setBestTimes] = useState<
    Partial<Record<Difficulty, number>>
  >(initialPrefs.bestTimes);
  const [gamesSolved, setGamesSolved] = useState<number>(
    initialPrefs.gamesSolved
  );
  const [isBest, setIsBest] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const recordedWin = useRef(false);

  const theme = THEMES[themeId];
  const soundEffects = useGameSounds(soundEnabled);
  const game = useSudokuGame(soundEffects);

  // Persist user preferences & stats
  useEffect(() => {
    try {
      const data: UserPrefs = {
        themeId,
        subscribed,
        soundEnabled,
        bestTimes,
        gamesSolved,
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }, [themeId, subscribed, soundEnabled, bestTimes, gamesSolved]);

  // Record best time & increment solved count on win
  useEffect(() => {
    if (!game.won) {
      recordedWin.current = false;
      setShowWin(false);
      return;
    }
    if (recordedWin.current) return;
    recordedWin.current = true;
    const prev = bestTimes[game.difficulty];
    const better = prev === undefined || game.seconds < prev;
    setIsBest(better);
    if (better) {
      setBestTimes((b) => ({ ...b, [game.difficulty]: game.seconds }));
    }
    setGamesSolved((s) => s + 1);
    setShowWin(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.won]);

  // Keyboard shortcuts during gameplay
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (paywallOpen) {
        if (e.key === "Escape") setPaywallOpen(false);
        return;
      }
      if (screen !== "game") return;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        game.placeNumber(parseInt(e.key, 10));
      } else if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "0"
      ) {
        e.preventDefault();
        game.erase();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        game.move(-1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        game.move(1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        game.move(0, -1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        game.move(0, 1);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        game.setNotesMode(!game.notesMode);
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        game.undo();
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        game.hint();
      } else if (e.key === " ") {
        e.preventDefault();
        game.setPaused(!game.paused);
      } else if (e.key === "Escape") {
        setScreen("menu");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, paywallOpen, game]);

  const chooseTheme = useCallback(
    (id: ThemeId) => {
      if (id === "dragon" && !subscribed) {
        setPaywallOpen(true);
        return;
      }
      setThemeId(id);
    },
    [subscribed]
  );

  const handleSubscribe = useCallback(() => {
    setSubscribed(true);
    setThemeId("dragon");
    setPaywallOpen(false);
  }, []);

  const handleCancelSubscription = useCallback(() => {
    setSubscribed(false);
    setThemeId("classic");
    setPaywallOpen(false);
  }, []);

  const startGame = useCallback(
    (d: Difficulty) => {
      game.newGame(d);
      setScreen("game");
    },
    [game]
  );

  const isDragon = themeId === "dragon";

  return (
    <div
      className={cn(
        "relative min-h-[100dvh] w-full overflow-x-hidden transition-colors duration-300",
        theme.appBg,
        theme.bodyFont
      )}
    >
      {/* Dynamic Atmospheric Backdrop */}
      {isDragon && <DragonCave />}

      {screen === "menu" ? (
        <MenuScreen
          theme={theme}
          themeId={themeId}
          subscribed={subscribed}
          onChooseTheme={chooseTheme}
          onOpenPaywall={() => setPaywallOpen(true)}
          onStart={startGame}
          onContinue={() => setScreen("game")}
          hasSavedGame={game.active && !game.won}
          savedSummary={
            game.active && !game.won
              ? {
                  difficulty: game.difficulty,
                  seconds: game.seconds,
                  progress: Math.round((game.filledCount / 81) * 100),
                }
              : undefined
          }
          bestTimes={bestTimes}
          gamesSolved={gamesSolved}
        />
      ) : (
        <GameScreen
          game={game}
          theme={theme}
          themeId={themeId}
          subscribed={subscribed}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
          onMenu={() => setScreen("menu")}
          onToggleTheme={() =>
            chooseTheme(themeId === "dragon" ? "classic" : "dragon")
          }
        />
      )}

      <WinModal
        open={showWin && screen === "game"}
        theme={theme}
        seconds={game.seconds}
        mistakes={game.mistakes}
        hints={game.hintsUsed}
        difficulty={game.difficulty}
        isBest={isBest}
        onPlayAgain={() => {
          setShowWin(false);
          game.newGame(game.difficulty);
        }}
        onMenu={() => {
          setShowWin(false);
          setScreen("menu");
        }}
      />

      <PaywallModal
        open={paywallOpen}
        subscribed={subscribed}
        onClose={() => setPaywallOpen(false)}
        onSubscribe={handleSubscribe}
        onCancelSubscription={handleCancelSubscription}
        theme={theme}
      />
    </div>
  );
}
