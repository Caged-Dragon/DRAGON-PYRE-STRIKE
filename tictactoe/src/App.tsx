import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DRAGON_REALMS } from "./config/dragonRealms";
import { getUiTokens } from "./config/uiTokens";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  loadSettingsTab,
  saveSettings,
  saveSettingsTab,
} from "./config/settings";
import { useViewportLayout } from "./hooks/useViewportLayout";
import type {
  AppScreen,
  BoardSize,
  CellValue,
  DragonRealmId,
  GameMode,
  GameSettings,
  GameSnapshot,
  MoveRecord,
  PaymentMethod,
  Player,
  ScoreBoard,
  SettingsTab,
  SubscriptionPlan,
  SubscriptionState,
  ThemeId,
  WinResult,
} from "./types/game";
import {
  evaluateBoard,
  getBestMove,
  getMaxActivePieces,
  getStrategicHint,
  indexToCoord,
  simulatePlacement,
} from "./utils/gameLogic";
import {
  playHintSound,
  playMoveSound,
  playOutcomeSound,
  playUndoSound,
  playUnlockFanfare,
  setMasterVolume,
} from "./utils/soundEffects";
import { Header } from "./components/Header";
import { MenuPage } from "./components/MenuPage";
import { SettingsPage } from "./components/SettingsPage";
import { Board } from "./components/Board";
import { ResultOverlay } from "./components/ResultOverlay";
import {
  MatchInfoBar,
  MatchLogCard,
  QuickActionToolbar,
  VersusCard,
  resolveDisplayName,
  type ArenaControlProps,
} from "./components/ScoreAndControls";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { ClassicBackdrop, DragonBackdrop } from "./components/DragonBackdrop";

const SUBSCRIPTION_STORAGE_KEY = "ttt_dragon_pass_v3";
const SCORES_STORAGE_KEY = "ttt_scores_v2";

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  isSubscribed: false,
  plan: "annual",
  trialMatchesRemaining: 0,
  trialUsedOnce: false,
  selectedRealm: "inferno",
  activatedAt: null,
  transactionId: null,
  paymentMethod: null,
  amountPaid: null,
};

const DEFAULT_SCORES: ScoreBoard = {
  X: 0,
  O: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
  streakHolder: null,
  totalMatches: 0,
};

/** Settings that change the rules of a match — changing one starts a fresh round. */
const RESTART_KEYS: ReadonlySet<keyof GameSettings> = new Set<keyof GameSettings>([
  "gameMode",
  "humanSide",
  "aiDifficulty",
  "boardSize",
  "variant",
]);

/** Volume slider (0–100) → gain. 80% matches the original loudness. */
const volumeToGain = (volume: number) => (volume / 100) * 1.25;

function generateTestTransactionId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TXN-DRG-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return { ...fallback, ...JSON.parse(saved) };
  } catch {
    // Ignore storage errors
  }
  return fallback;
}

function hasDragonAccess(sub: SubscriptionState): boolean {
  return sub.isSubscribed || sub.trialMatchesRemaining > 0;
}

export function App() {
  const viewport = useViewportLayout();

  const [screen, setScreen] = useState<AppScreen>("menu");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(loadSettingsTab);

  const [subscription, setSubscription] = useState<SubscriptionState>(() =>
    loadJSON(SUBSCRIPTION_STORAGE_KEY, DEFAULT_SUBSCRIPTION)
  );

  // All preferences in one persisted object. Dragon falls back to Classic if access lapsed.
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = loadSettings();
    const sub = loadJSON(SUBSCRIPTION_STORAGE_KEY, DEFAULT_SUBSCRIPTION);
    return saved.theme === "dragon" && !hasDragonAccess(sub)
      ? { ...saved, theme: "classic" }
      : saved;
  });
  const [savedAt, setSavedAt] = useState(0);

  const [scores, setScores] = useState<ScoreBoard>(() =>
    loadJSON(SCORES_STORAGE_KEY, DEFAULT_SCORES)
  );

  const { gameMode, humanSide, aiDifficulty, boardSize, variant, turnTimer, theme, soundEnabled } =
    settings;

  // Match state (not persisted)
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
  const [board, setBoard] = useState<CellValue[]>(() =>
    Array(settings.boardSize * settings.boardSize).fill(null)
  );
  const [xQueue, setXQueue] = useState<number[]>([]);
  const [oQueue, setOQueue] = useState<number[]>([]);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [historyStack, setHistoryStack] = useState<GameSnapshot[]>([]);
  const [startingPlayer, setStartingPlayer] = useState<Player>("X");
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [modalPreviewRealm, setModalPreviewRealm] = useState<DragonRealmId>("inferno");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeRealm = subscription.selectedRealm;
  const aiSide: Player = humanSide === "X" ? "O" : "X";
  const matchLive = moves.length > 0 && winResult === null;

  const stateRef = useRef({
    board,
    xQueue,
    oQueue,
    moves,
    currentPlayer,
    boardSize,
    variant,
    theme,
    activeRealm,
    soundEnabled,
    subscription,
  });
  stateRef.current = {
    board,
    xQueue,
    oQueue,
    moves,
    currentPlayer,
    boardSize,
    variant,
    theme,
    activeRealm,
    soundEnabled,
    subscription,
  };

  /* ---------------- Persistence ---------------- */

  const skipFirstSave = useRef(true);
  useEffect(() => {
    saveSettings(settings);
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSavedAt(Date.now());
  }, [settings]);

  useEffect(() => {
    saveSettingsTab(settingsTab);
  }, [settingsTab]);

  useEffect(() => {
    setMasterVolume(volumeToGain(settings.volume));
  }, [settings.volume]);

  useEffect(() => {
    try {
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
    } catch {
      // Ignore storage errors
    }
  }, [subscription]);

  useEffect(() => {
    try {
      localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(scores));
    } catch {
      // Ignore storage errors
    }
  }, [scores]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: settings.animations ? "smooth" : "auto" });
    // Only when the screen changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  /* ---------------- Game engine ---------------- */

  const recordOutcome = useCallback((result: WinResult) => {
    const { theme: curTheme, soundEnabled: curSound, subscription: curSub } = stateRef.current;

    setWinResult(result);
    setOverlayDismissed(false);

    if (result.winner === "draw") {
      setScores((prev) => ({
        ...prev,
        draws: prev.draws + 1,
        currentStreak: 0,
        streakHolder: null,
        totalMatches: prev.totalMatches + 1,
      }));
      playOutcomeSound("draw", curTheme, curSound);
    } else {
      const winner = result.winner;
      setScores((prev) => {
        const nextStreak = prev.streakHolder === winner ? prev.currentStreak + 1 : 1;
        return {
          ...prev,
          [winner]: prev[winner] + 1,
          currentStreak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          streakHolder: winner,
          totalMatches: prev.totalMatches + 1,
        };
      });
      playOutcomeSound("win", curTheme, curSound);
    }

    if (curTheme === "dragon" && !curSub.isSubscribed && curSub.trialMatchesRemaining > 0) {
      setSubscription((sub) => ({
        ...sub,
        trialMatchesRemaining: Math.max(0, sub.trialMatchesRemaining - 1),
      }));
    }
  }, []);

  // Reset the turn clock whenever the turn changes
  useEffect(() => {
    if (turnTimer > 0 && !winResult) {
      setTimeRemainingMs(turnTimer * 1000);
    } else {
      setTimeRemainingMs(0);
    }
  }, [currentPlayer, turnTimer, winResult, boardSize, variant]);

  // Count down only while the game screen is open
  useEffect(() => {
    if (screen !== "arena" || turnTimer === 0 || winResult || isSubModalOpen || moves.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemainingMs((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          const winner: Player = stateRef.current.currentPlayer === "X" ? "O" : "X";
          recordOutcome({ winner, line: null, reason: "timeout" });
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSubModalOpen, moves.length, recordOutcome, screen, turnTimer, winResult]);

  const commitMove = useCallback(
    (index: number, player: Player) => {
      const {
        board: curBoard,
        xQueue: curXQueue,
        oQueue: curOQueue,
        moves: curMoves,
        currentPlayer: curPlayer,
        boardSize: curSize,
        variant: curVariant,
        theme: curTheme,
        activeRealm: curRealm,
        soundEnabled: curSound,
      } = stateRef.current;

      if (curBoard[index] !== null) return;

      setHistoryStack((stack) => [
        ...stack,
        {
          board: [...curBoard],
          currentPlayer: curPlayer,
          xQueue: [...curXQueue],
          oQueue: [...curOQueue],
          moves: [...curMoves],
        },
      ]);

      const activeQueue = player === "X" ? curXQueue : curOQueue;
      const sim = simulatePlacement(curBoard, index, player, curSize, curVariant, activeQueue);

      const moveEntry: MoveRecord = {
        step: curMoves.length + 1,
        player,
        index,
        coord: indexToCoord(index, curSize),
        vanishedIndex: sim.vanishedIndex,
      };

      setBoard(sim.nextBoard);
      if (player === "X") setXQueue(sim.nextQueue);
      else setOQueue(sim.nextQueue);
      setMoves([...curMoves, moveEntry]);
      setHintIndex(null);

      playMoveSound(player, curTheme, curSound, curRealm);

      const outcome = evaluateBoard(sim.nextBoard, curSize, curVariant);
      if (outcome) {
        recordOutcome(outcome);
      } else {
        setCurrentPlayer(player === "X" ? "O" : "X");
      }
    },
    [recordOutcome]
  );

  // AI turn — only while the game screen is open
  useEffect(() => {
    if (screen !== "arena" || gameMode !== "ai" || currentPlayer !== aiSide || winResult) {
      setIsAiThinking(false);
      return;
    }

    setIsAiThinking(true);
    const delayTimer = setTimeout(() => {
      const moveIdx = getBestMove(board, aiSide, aiDifficulty, boardSize, variant, xQueue, oQueue);
      setIsAiThinking(false);
      if (moveIdx !== -1) commitMove(moveIdx, aiSide);
    }, 380);

    return () => clearTimeout(delayTimer);
  }, [aiDifficulty, aiSide, board, boardSize, commitMove, currentPlayer, gameMode, oQueue, screen, variant, winResult, xQueue]);

  const resetRoundBoard = useCallback((size: BoardSize, nextStarter: Player) => {
    setBoard(Array(size * size).fill(null));
    setXQueue([]);
    setOQueue([]);
    setMoves([]);
    setHistoryStack([]);
    setWinResult(null);
    setOverlayDismissed(false);
    setHintIndex(null);
    setStartingPlayer(nextStarter);
    setCurrentPlayer(nextStarter);
    setIsAiThinking(false);
  }, []);

  /* ---------------- Settings ---------------- */

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    if (Object.is(settings[key], value)) return;
    setSettings((prev) => ({ ...prev, [key]: value }) as GameSettings);

    if (key === "volume") setMasterVolume(volumeToGain(value as number));

    if (RESTART_KEYS.has(key)) {
      const nextSize = key === "boardSize" ? (value as BoardSize) : boardSize;
      resetRoundBoard(nextSize, "X");
      if (matchLive) setToastMessage("Rules updated — the match was restarted");
    }
  };

  const openSettings = (tab?: SettingsTab) => {
    if (tab) setSettingsTab(tab);
    setScreen("settings");
  };

  const openPayment = (realmId?: DragonRealmId) => {
    setModalPreviewRealm(realmId || activeRealm);
    setIsSubModalOpen(true);
  };

  const handleSelectTheme = (target: ThemeId) => {
    if (target === "classic") {
      setSettings((prev) => ({ ...prev, theme: "classic" }));
      return;
    }
    if (hasDragonAccess(subscription)) {
      setSettings((prev) => ({ ...prev, theme: "dragon" }));
    } else {
      openPayment();
    }
  };

  const handleSelectRealm = (realmId: DragonRealmId) => {
    if (hasDragonAccess(subscription)) {
      setSubscription((prev) => ({ ...prev, selectedRealm: realmId }));
      setSettings((prev) => ({ ...prev, theme: "dragon" }));
      setToastMessage(`${DRAGON_REALMS[realmId].name} equipped`);
    } else {
      openPayment(realmId);
    }
  };

  const handleRestoreDefaults = () => {
    setSettings({ ...DEFAULT_SETTINGS, playerNames: { X: "", O: "" } });
    setMasterVolume(volumeToGain(DEFAULT_SETTINGS.volume));
    resetRoundBoard(DEFAULT_SETTINGS.boardSize, "X");
    setToastMessage("Default settings restored");
  };

  const handlePreviewSound = () => {
    if (soundEnabled) playMoveSound("X", theme, true, activeRealm);
  };

  /* ---------------- Match actions ---------------- */

  const handleStartNewGame = () => {
    resetRoundBoard(boardSize, "X");
    setScreen("arena");
  };

  const handleQuickStart = (mode: GameMode) => {
    if (mode !== gameMode) setSettings((prev) => ({ ...prev, gameMode: mode }));
    resetRoundBoard(boardSize, "X");
    setScreen("arena");
  };

  const handleCellClick = (index: number) => {
    if (winResult || board[index] !== null) return;
    if (gameMode === "ai" && currentPlayer !== humanSide) return;
    commitMove(index, currentPlayer);
  };

  const handleNewRound = () => {
    if (
      theme === "dragon" &&
      !subscription.isSubscribed &&
      subscription.trialMatchesRemaining <= 0 &&
      winResult !== null
    ) {
      openPayment();
      setSettings((prev) => ({ ...prev, theme: "classic" }));
      setToastMessage("Trial matches used — unlock the Dragon Pass with test checkout");
    }

    const nextStarter: Player =
      gameMode === "pvp" && settings.alternateStarter
        ? startingPlayer === "X"
          ? "O"
          : "X"
        : "X";
    resetRoundBoard(boardSize, nextStarter);
  };

  const handleUndo = () => {
    if (!settings.undoEnabled || historyStack.length === 0 || isAiThinking) return;

    let targetIndex = historyStack.length - 1;
    if (gameMode === "ai") {
      while (targetIndex > 0 && historyStack[targetIndex].currentPlayer !== humanSide) {
        targetIndex--;
      }
    }

    const snap = historyStack[targetIndex];
    setBoard(snap.board);
    setCurrentPlayer(snap.currentPlayer);
    setXQueue(snap.xQueue);
    setOQueue(snap.oQueue);
    setMoves(snap.moves);
    setHistoryStack(historyStack.slice(0, targetIndex));
    setWinResult(null);
    setOverlayDismissed(false);
    setHintIndex(null);
    playUndoSound(soundEnabled);
  };

  const handleHint = () => {
    if (!settings.hintsEnabled || winResult || isAiThinking) return;
    const best = getStrategicHint(board, currentPlayer, boardSize, variant, xQueue, oQueue);
    if (best !== -1) {
      setHintIndex(best);
      playHintSound(soundEnabled);
      setToastMessage(`Hint: try cell ${indexToCoord(best, boardSize)}`);
    }
  };

  const handleResetScores = () => {
    setScores(DEFAULT_SCORES);
    setToastMessage("Career stats cleared");
  };

  /* ---------------- Dragon Pass (test checkout) ---------------- */

  const handleCompletePayment = ({
    plan,
    realm: realmId,
    paymentMethod,
    amountPaid,
  }: {
    plan: SubscriptionPlan;
    realm: DragonRealmId;
    paymentMethod: PaymentMethod;
    amountPaid: string;
  }) => {
    const txnId = subscription.transactionId || generateTestTransactionId();
    setSubscription({
      isSubscribed: true,
      plan,
      trialMatchesRemaining: 0,
      trialUsedOnce: true,
      selectedRealm: realmId,
      activatedAt: new Date().toISOString(),
      transactionId: txnId,
      paymentMethod,
      amountPaid,
    });
    setSettings((prev) => ({ ...prev, theme: "dragon" }));
    setIsSubModalOpen(false);
    playUnlockFanfare(soundEnabled);
    setToastMessage(`Payment approved · ${DRAGON_REALMS[realmId].name} unlocked`);
  };

  const handleStartTrialMatches = (realmId: DragonRealmId) => {
    setSubscription((prev) => ({
      ...prev,
      trialMatchesRemaining: 3,
      trialUsedOnce: true,
      selectedRealm: realmId,
    }));
    setSettings((prev) => ({ ...prev, theme: "dragon" }));
    setIsSubModalOpen(false);
    playUnlockFanfare(soundEnabled);
    setToastMessage(`3 free Dragon trial matches · ${DRAGON_REALMS[realmId].name}`);
  };

  const handleCancelSubscription = () => {
    setSubscription({ ...DEFAULT_SUBSCRIPTION, trialUsedOnce: true, selectedRealm: activeRealm });
    setSettings((prev) => ({ ...prev, theme: "classic" }));
    setIsSubModalOpen(false);
    setToastMessage("Dragon theme re-locked — test the checkout again anytime");
  };

  /* ---------------- Derived view data ---------------- */

  const nextVanishIndex = useMemo(() => {
    if (variant !== "infinite" || winResult) return null;
    const cap = getMaxActivePieces(boardSize);
    const activeQ = currentPlayer === "X" ? xQueue : oQueue;
    return activeQ.length >= cap ? activeQ[0] : null;
  }, [boardSize, currentPlayer, oQueue, variant, winResult, xQueue]);

  const lastMoveIndex = moves.length > 0 ? moves[moves.length - 1].index : null;

  const t = getUiTokens(theme, activeRealm);
  const isDragon = t.isDragon;
  const realmCfg = DRAGON_REALMS[activeRealm];

  const displayNames: Record<Player, string> = {
    X: resolveDisplayName("X", gameMode, humanSide, settings.playerNames, isDragon),
    O: resolveDisplayName("O", gameMode, humanSide, settings.playerNames, isDragon),
  };

  const arenaProps: ArenaControlProps = {
    theme,
    realm: activeRealm,
    scores,
    playerNames: settings.playerNames,
    humanSide,
    currentPlayer,
    winResult,
    gameMode,
    boardSize,
    variant,
    turnTimer,
    timeRemainingMs,
    aiDifficulty,
    isAiThinking,
    canUndo: historyStack.length > 0,
    moves,
    hintsEnabled: settings.hintsEnabled,
    undoEnabled: settings.undoEnabled,
    onNewRound: handleNewRound,
    onUndo: handleUndo,
    onHint: handleHint,
    onOpenSettings: () => openSettings("gameplay"),
  };

  const boardStage = (
    <div
      className="relative mx-auto"
      style={{
        width: `${viewport.boardSizePx}px`,
        height: `${viewport.boardSizePx}px`,
        maxWidth: "100%",
      }}
    >
      <Board
        board={board}
        boardSize={boardSize}
        boardSizePx={viewport.boardSizePx}
        currentPlayer={currentPlayer}
        theme={theme}
        realm={activeRealm}
        winResult={winResult}
        lastMoveIndex={lastMoveIndex}
        hintIndex={hintIndex}
        nextVanishIndex={nextVanishIndex}
        disabled={isAiThinking}
        onCellClick={handleCellClick}
        showCoordinates={settings.showCoordinates}
        highlightLastMove={settings.highlightLastMove}
      />
      {winResult && !overlayDismissed && (
        <ResultOverlay
          winResult={winResult}
          theme={theme}
          realm={activeRealm}
          names={displayNames}
          gameMode={gameMode}
          humanSide={humanSide}
          compact={viewport.boardSizePx < 290}
          showConfetti={settings.confetti}
          onPlayAgain={handleNewRound}
          onMenu={() => setScreen("menu")}
          onDismiss={() => setOverlayDismissed(true)}
        />
      )}
    </div>
  );

  // The game screen holds only the match: scoreboard, board, actions and a rules summary.
  const renderArena = () => {
    if (viewport.layoutMode !== "portrait") {
      return (
        <div className="mx-auto grid w-full max-w-[min(96vw,1200px)] grid-cols-[auto_minmax(280px,380px)] items-center justify-center gap-[clamp(1rem,3vw,2.75rem)]">
          <div className="flex justify-center animate-fade-up">{boardStage}</div>
          <div className="flex min-w-0 flex-col gap-3 animate-fade-up">
            <VersusCard {...arenaProps} />
            <QuickActionToolbar {...arenaProps} />
            <MatchInfoBar {...arenaProps} />
            {!viewport.isCompactHeight && <MatchLogCard {...arenaProps} />}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{ width: `${Math.min(viewport.width - 24, Math.max(viewport.boardSizePx, 440))}px` }}
        className="mx-auto flex max-w-full flex-col items-stretch gap-3 animate-fade-up"
      >
        <VersusCard {...arenaProps} />
        {boardStage}
        <QuickActionToolbar {...arenaProps} />
        <MatchInfoBar {...arenaProps} />
      </div>
    );
  };

  return (
    <div
      style={{ backgroundColor: t.canvas }}
      className={`relative flex min-h-[100dvh] w-full flex-col transition-colors duration-500 ${
        isDragon ? "text-slate-100" : "text-slate-900"
      } ${settings.animations ? "" : "reduce-motion"}`}
    >
      {isDragon ? <DragonBackdrop realm={activeRealm} /> : <ClassicBackdrop />}

      <Header
        screen={screen}
        theme={theme}
        realm={activeRealm}
        subscription={subscription}
        soundEnabled={soundEnabled}
        matchLive={matchLive}
        onNavigate={setScreen}
        onOpenSubscriptionModal={() => openPayment()}
        onToggleSound={() => updateSetting("soundEnabled", !soundEnabled)}
      />

      <main className="relative z-10 flex w-full flex-1 items-center justify-center px-3 py-[clamp(0.85rem,2.5dvh,2rem)] sm:px-6">
        {screen === "menu" && (
          <MenuPage
            viewport={viewport}
            realm={activeRealm}
            subscription={subscription}
            scores={scores}
            settings={settings}
            hasMatchInProgress={matchLive}
            moveCount={moves.length}
            onStartNewGame={handleStartNewGame}
            onQuickStart={handleQuickStart}
            onResumeGame={() => setScreen("arena")}
            onOpenSettings={openSettings}
            onOpenPaymentModal={() => openPayment()}
          />
        )}

        {screen === "settings" && (
          <SettingsPage
            settings={settings}
            realm={activeRealm}
            subscription={subscription}
            scores={scores}
            tab={settingsTab}
            hasMatchInProgress={matchLive}
            savedAt={savedAt}
            onTabChange={setSettingsTab}
            onUpdate={updateSetting}
            onSelectTheme={handleSelectTheme}
            onSelectRealm={handleSelectRealm}
            onOpenPayment={() => openPayment()}
            onResetScores={handleResetScores}
            onRestoreDefaults={handleRestoreDefaults}
            onPreviewSound={handlePreviewSound}
            onPlay={() => (matchLive ? setScreen("arena") : handleStartNewGame())}
            onBack={() => setScreen("menu")}
          />
        )}

        {screen === "arena" && renderArena()}
      </main>

      <footer className="relative z-10 w-full px-4 pb-3 pt-1">
        <div
          className={`mx-auto flex max-w-[min(96vw,1400px)] flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] ${t.textMuted}`}
        >
          <span className="font-semibold">
            {isDragon ? `${realmCfg.name} Edition` : "Classic Studio Edition"}
          </span>
          <span aria-hidden="true">•</span>
          <span>Settings saved on this device</span>
          <span aria-hidden="true">•</span>
          <span>Sandbox payments only — no real charges</span>
        </div>
      </footer>

      {toastMessage && (
        <div
          key={toastMessage}
          role="status"
          className={`fixed bottom-5 left-1/2 z-40 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-2xl animate-toast-in sm:text-sm ${
            isDragon
              ? "bg-[#15111F]/95 text-white ring-1 ring-white/15 backdrop-blur-xl"
              : "bg-slate-900/95 text-white ring-1 ring-slate-800 backdrop-blur-xl"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      <SubscriptionModal
        isOpen={isSubModalOpen}
        subscription={subscription}
        initialRealm={modalPreviewRealm}
        onClose={() => setIsSubModalOpen(false)}
        onCompletePayment={handleCompletePayment}
        onStartTrialMatches={handleStartTrialMatches}
        onCancelSubscription={handleCancelSubscription}
        onEnterArena={() => setScreen("arena")}
      />
    </div>
  );
}

export default App;
