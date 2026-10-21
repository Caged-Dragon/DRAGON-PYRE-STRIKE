import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import Creature from "./components/Creature";
import { type Dir, type Tile, addRandomTile, canMove, hydrate, initGame, maxTile, move } from "./game";
import { STAGES, stageFor, type Stage } from "./stages";
import { GameAudio } from "./sound";
import heroArt from "./images/dragon-keep.jpg";

const SAVE_KEY = "dragon2048-save";
const STATS_KEY = "dragon2048-stats";
const SOUND_KEY = "dragon2048-sound";
const CODEX_KEY = "dragon2048-codex";
type Difficulty = "easy" | "classic" | "hard";
type Theme = "classic" | "dragon";
const MODES: Record<Difficulty, { label: string; size: number; caption: string }> = {
  easy: { label: "Relaxed", size: 5, caption: "5 x 5 grid" },
  classic: { label: "Classic", size: 4, caption: "4 x 4 grid" },
  hard: { label: "Expert", size: 3, caption: "3 x 3 grid" },
};
const modeName = (v: Difficulty) => MODES[v].label;
const format = (n: number) => n.toLocaleString("en-US");
const safeRead = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const safeWrite = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private browsing */ } };
const safeRemove = (key: string) => { try { localStorage.removeItem(key); } catch { /* private browsing */ } };

type State = {
  id: number;
  tiles: Tile[];
  difficulty: Difficulty;
  score: number;
  moves: number;
  merges: number;
  seconds: number;
  over: boolean;
  won: boolean;
  keepPlaying: boolean;
  maxValue: number;
  moveId: number;
  gain: number;
  evolvedTo: number | null;
  justWon: boolean;
  justOver: boolean;
};
type Action =
  | { type: "move"; dir: Dir }
  | { type: "new"; difficulty: Difficulty }
  | { type: "continue" }
  | { type: "tick" };

type Stats = { best: number; played: number; wins: number; moves: number; merges: number; totalScore: number; highestTile: number; byMode: Record<Difficulty, number> };
const emptyStats = (): Stats => ({ best: 0, played: 0, wins: 0, moves: 0, merges: 0, totalScore: 0, highestTile: 0, byMode: { easy: 0, classic: 0, hard: 0 } });
function loadStats(): Stats {
  try {
    const s = JSON.parse(safeRead(STATS_KEY) || "null");
    if (s && typeof s === "object") return { ...emptyStats(), ...s, byMode: { ...emptyStats().byMode, ...s.byMode } };
  } catch { /* reset invalid stats */ }
  const legacyBest = Number(safeRead("dragon2048-best")) || 0;
  return { ...emptyStats(), best: legacyBest };
}
function loadGame(): State | null {
  try {
    const raw = safeRead(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const difficulty: Difficulty = Object.prototype.hasOwnProperty.call(MODES, s.difficulty) ? s.difficulty : "classic";
    const size = MODES[difficulty].size;
    const tiles = hydrate(s.tiles, size);
    if (!tiles.length || s.over || !canMove(tiles, size)) return null;
    return {
      id: Number(s.id) || Date.now(), tiles, difficulty, score: Number(s.score) || 0,
      moves: Number(s.moves) || 0, merges: Number(s.merges) || 0, seconds: Number(s.seconds) || 0,
      over: false, won: !!s.won, keepPlaying: !!s.keepPlaying, maxValue: maxTile(tiles),
      moveId: 0, gain: 0, evolvedTo: null, justWon: false, justOver: false,
    };
  } catch { return null; }
}
function freshGame(difficulty: Difficulty): State {
  const tiles = initGame(MODES[difficulty].size);
  return { id: Date.now() + Math.random(), tiles, difficulty, score: 0, moves: 0, merges: 0, seconds: 0,
    over: false, won: false, keepPlaying: false, maxValue: maxTile(tiles), moveId: 0, gain: 0,
    evolvedTo: null, justWon: false, justOver: false };
}
function reducer(state: State | null, action: Action): State | null {
  if (action.type === "new") return freshGame(action.difficulty);
  if (!state) return null;
  if (action.type === "tick") return { ...state, seconds: state.seconds + 1 };
  if (action.type === "continue") return { ...state, keepPlaying: true };
  if (state.over || (state.won && !state.keepPlaying)) return state;
  const size = MODES[state.difficulty].size;
  const res = move(state.tiles, action.dir, size);
  if (!res.moved) return state;
  const tiles = addRandomTile(res.tiles, size);
  const maxValue = Math.max(state.maxValue, maxTile(tiles));
  const over = !canMove(tiles, size);
  const won = state.won || maxValue >= 2048;
  return { ...state, tiles, score: state.score + res.score, moves: state.moves + 1,
    merges: state.merges + res.merges, gain: res.score, moveId: state.moveId + 1,
    maxValue, evolvedTo: maxValue > state.maxValue && maxValue >= 8 ? maxValue : null,
    won, over, justWon: won && !state.won, justOver: over && !state.over };
}
/* dragon tiles: soft highlight + a faint dragon-scale weave over the stage gradient */
const SCALES =
  "radial-gradient(circle at 50% 116%, transparent 58%, rgba(255,255,255,.09) 60%, rgba(255,255,255,.09) 66%, transparent 68%) 0 0 / 20% 20%, " +
  "radial-gradient(circle at 50% 116%, transparent 58%, rgba(255,255,255,.09) 60%, rgba(255,255,255,.09) 66%, transparent 68%) 10% 10% / 20% 20%";
const tileBg = (s: Stage) => `radial-gradient(circle at 50% 38%, rgba(255,255,255,.2), transparent 62%), ${SCALES}, linear-gradient(135deg, ${s.from}, ${s.to})`;

/* classic tiles: a rainbow ramp — every power of two gets its own hue */
type ClassicTile = { bg: string; text: string; glow: string };
const CLASSIC_TILES: Record<number, ClassicTile> = {
  2: { bg: "linear-gradient(145deg,#7cd4ff,#3f9cff)", text: "#ffffff", glow: "rgba(63,156,255,.6)" },
  4: { bg: "linear-gradient(145deg,#5ee7df,#17b3a6)", text: "#ffffff", glow: "rgba(23,179,166,.6)" },
  8: { bg: "linear-gradient(145deg,#7ff0a5,#22c55e)", text: "#ffffff", glow: "rgba(34,197,94,.6)" },
  16: { bg: "linear-gradient(145deg,#dcf76e,#9ccc2e)", text: "#2b3a05", glow: "rgba(156,204,46,.6)" },
  32: { bg: "linear-gradient(145deg,#ffe97a,#ffc531)", text: "#4a3300", glow: "rgba(255,197,49,.65)" },
  64: { bg: "linear-gradient(145deg,#ffc270,#ff9410)", text: "#ffffff", glow: "rgba(255,148,16,.65)" },
  128: { bg: "linear-gradient(145deg,#ff9f7a,#ff5a2e)", text: "#ffffff", glow: "rgba(255,90,46,.65)" },
  256: { bg: "linear-gradient(145deg,#ff7d9d,#f23a63)", text: "#ffffff", glow: "rgba(242,58,99,.65)" },
  512: { bg: "linear-gradient(145deg,#ff8ad4,#e0399f)", text: "#ffffff", glow: "rgba(224,57,159,.65)" },
  1024: { bg: "linear-gradient(145deg,#c89bff,#9548f0)", text: "#ffffff", glow: "rgba(149,72,240,.7)" },
  2048: { bg: "linear-gradient(135deg,#ffd86b 0%,#ff8a5c 35%,#ff5c8a 65%,#8a6bff 100%)", text: "#ffffff", glow: "rgba(255,138,92,.8)" },
};
const CLASSIC_FALLBACK: ClassicTile = { bg: "linear-gradient(135deg,#2a2370,#6d3df0 60%,#ff5c8a)", text: "#ffffff", glow: "rgba(109,61,240,.75)" };

/* words change with the world you're playing in */
const COPY = {
  classic: {
    world: "Rainbow arcade",
    title: "2048",
    score: "Score",
    best: "Best score",
    hint: "Join matching tiles to reach",
    hintStrong: "2048.",
    journey: "Your journey",
    highest: "Highest tile",
    newGame: "New game",
    keep: "Keep playing",
    winTitle: "You reached 2048!",
    winBody: "The journey doesn't have to end here.",
    loseTitle: "No moves left",
  },
  dragon: {
    world: "The Ember Keep",
    title: "Dragon 2048",
    score: "Hoard",
    best: "Best hoard",
    hint: "Merge matching dragons to awaken the",
    hintStrong: "Dragon Lord.",
    journey: "Dragon chronicle",
    highest: "Mightiest creature",
    newGame: "New hoard",
    keep: "Keep flying",
    winTitle: "The Dragon Lord awakens!",
    winBody: "You raised a humble egg into the ruler of all dragonkind.",
    loseTitle: "Your flame is extinguished",
  },
} as const;
const KEYS: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
const duration = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export default function App() {
  const [game, dispatch] = useReducer(reducer, undefined, loadGame);
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("classic");
  const [theme, setTheme] = useState<Theme>("classic");
  const [stats, setStats] = useState<Stats>(loadStats);
  const [soundOn, setSoundOn] = useState(() => safeRead(SOUND_KEY) !== "off");
  const [modal, setModal] = useState<"subscription" | "restart" | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [banner, setBanner] = useState<{ value: number; id: number } | null>(null);
  const [codex, setCodex] = useState(() => Number(safeRead(CODEX_KEY)) || 0);
  const audio = useRef(new GameAudio());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const countedMove = useRef<string | null>(null);
  const bannerTimer = useRef<number | undefined>(undefined);

  useEffect(() => { audio.current.setEnabled(soundOn); safeWrite(SOUND_KEY, soundOn ? "on" : "off"); }, [soundOn]);
  useEffect(() => { safeWrite(STATS_KEY, JSON.stringify(stats)); }, [stats]);
  useEffect(() => {
    if (!game) { safeRemove(SAVE_KEY); return; }
    const tiles = game.tiles.filter(t => !t.ghost).map(({ value, row, col }) => ({ value, row, col }));
    safeWrite(SAVE_KEY, JSON.stringify({ ...game, tiles }));
  }, [game]);
  useEffect(() => {
    if (!game || game.moveId === 0) return;
    const key = `${game.id}:${game.moveId}`;
    if (countedMove.current === key) return;
    countedMove.current = key;
    setStats(prev => ({ ...prev, best: Math.max(prev.best, game.score), moves: prev.moves + 1,
      merges: prev.merges + (game.tiles.filter(t => t.merged).length), totalScore: prev.totalScore + game.gain,
      highestTile: Math.max(prev.highestTile, game.maxValue), wins: prev.wins + Number(game.justWon) }));
    if (game.justWon) audio.current.play("win");
    else if (game.justOver) audio.current.play("lose");
    else if (game.evolvedTo && theme === "dragon") audio.current.play("milestone");
    else audio.current.play(game.gain ? "merge" : "move");
    if (game.maxValue > codex) { setCodex(game.maxValue); safeWrite(CODEX_KEY, String(game.maxValue)); }
    if (game.evolvedTo && theme === "dragon") {
      setBanner({ value: game.evolvedTo, id: game.moveId });
      window.clearTimeout(bannerTimer.current);
      bannerTimer.current = window.setTimeout(() => setBanner(null), 2400);
    }
  }, [game?.id, game?.moveId, game?.score, game?.gain, game?.justWon, game?.justOver, game?.evolvedTo, game?.maxValue, theme, codex]);
  useEffect(() => () => window.clearTimeout(bannerTimer.current), []);
  useEffect(() => {
    if (screen !== "game" || !game || game.over || (game.won && !game.keepPlaying) || modal) return;
    const id = window.setInterval(() => { if (!document.hidden) dispatch({ type: "tick" }); }, 1000);
    return () => window.clearInterval(id);
  }, [screen, game?.id, game?.over, game?.won, game?.keepPlaying, modal]);

  const doMove = useCallback((dir: Dir) => dispatch({ type: "move", dir }), []);
  useEffect(() => {
    if (screen !== "game" || modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const dir = KEYS[e.key];
      if (dir) { e.preventDefault(); doMove(dir); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, modal, doMove]);
  const touchStart = (e: TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const touchEnd = (e: TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };
  const startNew = () => {
    audio.current.play("tap");
    dispatch({ type: "new", difficulty });
    setStats(prev => ({ ...prev, played: prev.played + 1, byMode: { ...prev.byMode, [difficulty]: prev.byMode[difficulty] + 1 } }));
    countedMove.current = null;
    setModal(null); setBanner(null); setScreen("game"); setShowStats(false);
  };
  const continueGame = () => { if (!game) return; audio.current.play("tap"); setDifficulty(game.difficulty); setScreen("game"); };
  const returnMenu = () => { audio.current.play("tap"); setScreen("menu"); setBanner(null); };
  const requestNew = () => { if (game && !game.over) setModal("restart"); else startNew(); };
  const toggleSound = () => { if (!soundOn) { audio.current.setEnabled(true); audio.current.play("tap"); } setSoundOn(!soundOn); };
  const chooseDragonPreview = () => { setTheme("dragon"); setModal(null); audio.current.play("milestone"); };
  const hasSave = !!game && !game.over;
  const size = game ? MODES[game.difficulty].size : 4;
  const showWin = !!game?.won && !game.keepPlaying;
  const topStage = stageFor(showWin ? 2048 : game?.maxValue || 2);
  const themeClass = theme === "dragon" ? "theme-dragon" : "theme-classic";
  const known = Math.max(codex, game?.maxValue || 2);
  const copy = COPY[theme];
  const mightiest = stageFor(game?.maxValue || 2);
  // 2 → cold ember, 2048 → full blaze: the board's glow grows with your strongest dragon
  const heat = Math.max(0, Math.min(1, (Math.log2(game?.maxValue || 2) - 1) / 10));
  const boardStyle = theme === "dragon"
    ? ({ "--glow-b": `${Math.round(28 + heat * 70)}px`, "--glow-c": `rgba(255,${Math.round(150 - heat * 45)},40,${(0.28 + heat * 0.52).toFixed(2)})` } as CSSProperties)
    : undefined;

  return (
    <div className={`app-shell ${themeClass} min-h-dvh`} style={{ "--hero-art": `url(${heroArt})` } as CSSProperties}>
      {screen === "menu" ? (
        <main className="menu-screen relative overflow-hidden">
          <div className="menu-art absolute inset-0" aria-hidden="true" />
          <div className="menu-scrim absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[88rem] flex-col px-[clamp(1.15rem,0.75rem+2.2vw,4.5rem)]">
            <nav className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-white/10 py-[clamp(1rem,0.85rem+0.7vw,1.85rem)]">
              <div className="flex items-center gap-3 text-amber-200">
                <BrandIcon />
                <span className="eyebrow">The Ember Keep</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="top-action" onClick={toggleSound} aria-label={soundOn ? "Mute sound" : "Unmute sound"} title={soundOn ? "Sound on" : "Sound off"}>
                  {soundOn ? <SoundIcon /> : <MuteIcon />}
                </button>
                <button className="top-action eyebrow px-3" onClick={() => setModal("subscription")}>Dragon Pass</button>
              </div>
            </nav>

            <div className="flex flex-1 flex-col justify-center py-[clamp(1.75rem,1.25rem+2.6vw,5rem)]">
              <div className="menu-content w-full max-w-[42rem]">
                <p className="eyebrow mb-[clamp(0.9rem,0.75rem+0.5vw,1.65rem)] flex items-center gap-3 text-[#e7ba70]">
                  <span className="h-px w-8 bg-[#e7ba70]" />
                  A new kind of 2048
                </p>
                <h1 className="menu-title">
                  DRAGON<br /><span className="text-[#efad58]">2048</span>
                </h1>
                <p className="menu-lede mt-[clamp(1.15rem,0.95rem+0.8vw,2.15rem)]">
                  A little egg. A legendary destiny. Combine matching tiles and build your way to 2048.
                </p>

                <div className="menu-panel mt-[clamp(1.5rem,1.2rem+1.4vw,2.85rem)] w-full max-w-[32rem]">
                  <div className="eyebrow mb-3 flex items-center justify-between gap-3 text-[#dbc9b8]">
                    <span>Choose your difficulty</span>
                    <span className="opacity-60">Grid size</span>
                  </div>
                  <div className="segment" role="group" aria-label="Difficulty">
                    {(Object.keys(MODES) as Difficulty[]).map(key => (
                      <button key={key} onClick={() => { setDifficulty(key); audio.current.play("tap"); }} aria-pressed={difficulty === key}>
                        <span className="seg-label">{MODES[key].label}</span>
                        <span className="seg-caption">{MODES[key].caption}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-[clamp(0.85rem,0.7rem+0.6vw,1.45rem)] flex flex-col gap-3 sm:flex-row">
                    <button className="primary-button flex-1" onClick={() => hasSave ? setModal("restart") : startNew()}>
                      New game <ArrowIcon />
                    </button>
                    {hasSave && (
                      <button className="secondary-button flex-1" onClick={continueGame}>
                        Continue game <ArrowIcon />
                      </button>
                    )}
                  </div>
                  {hasSave && (
                    <p className="mt-3 text-[clamp(0.72rem,0.68rem+0.16vw,0.85rem)] text-[#ac9b8c]">
                      Continue your {modeName(game.difficulty).toLowerCase()} game at {format(game.score)} points.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <footer className="flex flex-col gap-[clamp(0.85rem,0.7rem+0.7vw,1.5rem)] border-t border-white/10 py-[clamp(1.15rem,0.95rem+0.8vw,2.15rem)]">
              <div className="menu-stats">
                <div><div className="stat-k">Personal best</div><div className="stat-v">{format(stats.best)}</div></div>
                <div><div className="stat-k">Games played</div><div className="stat-v">{format(stats.played)}</div></div>
                <div><div className="stat-k">Games won</div><div className="stat-v">{format(stats.wins)}</div></div>
                <div><div className="stat-k">Highest tile</div><div className="stat-v">{format(stats.highestTile || 2)}</div></div>
              </div>
              <p className="text-[clamp(0.72rem,0.68rem+0.16vw,0.85rem)] text-[#a9988d]">
                Arrow keys / WASD to move <span className="mx-2 opacity-40">/</span> Swipe on touch screens
              </p>
            </footer>
          </div>
        </main>
      ) : (
        <main className="game-screen">
          <div className="game-wrap">
            <header className="game-header header-row border-b pb-[clamp(0.85rem,0.7rem+0.7vw,1.55rem)]">
              <div className="header-left flex items-center gap-[clamp(0.7rem,0.55rem+0.6vw,1.25rem)]">
                <button className="game-icon" onClick={returnMenu} title="Back to menu" aria-label="Back to menu"><BackIcon /></button>
                <div className="min-w-0">
                  <p className="game-eyebrow eyebrow truncate">{copy.world} / {modeName(game?.difficulty || "classic")}</p>
                  <h1 className="game-title font-display font-black tracking-tight">
                    {theme === "dragon" && <BrandIcon className="title-flame" />}
                    <span className="title-text">{copy.title}</span>
                  </h1>
                </div>
              </div>
              <div className="header-scores">
                <ScoreBox label={copy.score} value={game?.score || 0} gain={game?.gain || 0} moveId={game?.moveId || 0} />
                <ScoreBox label={copy.best} value={stats.best} />
                <button className="game-icon" onClick={toggleSound} title={soundOn ? "Mute sound" : "Unmute sound"} aria-label={soundOn ? "Mute sound" : "Unmute sound"}>
                  {soundOn ? <SoundIcon /> : <MuteIcon />}
                </button>
              </div>
            </header>

            <div className="grid items-start gap-[clamp(1.5rem,1.15rem+1.8vw,3.25rem)] pt-[clamp(1.15rem,0.95rem+0.9vw,2.15rem)] lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)]">
              <div className="board-wrap mx-auto">
                <div className="mb-[clamp(0.65rem,0.55rem+0.45vw,1.15rem)] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="game-muted text-[clamp(0.8rem,0.75rem+0.18vw,0.98rem)]">
                    {copy.hint} <strong className="game-strong font-bold">{copy.hintStrong}</strong>
                  </p>
                  <span className="game-tag eyebrow shrink-0">{size} x {size} board</span>
                </div>

                <div
                  className="board relative aspect-square w-full touch-none"
                  style={boardStyle}
                  onTouchStart={touchStart}
                  onTouchEnd={touchEnd}
                  role="application"
                  aria-label="2048 game board"
                >
                  <div className="board-inner grid" style={{ gridTemplateColumns: `repeat(${size},1fr)`, gridTemplateRows: `repeat(${size},1fr)` }}>
                    {Array.from({ length: size * size }).map((_, i) => (
                      <div key={i} className="cell-pad"><div className="empty-cell h-full w-full" /></div>
                    ))}
                  </div>
                  <div className="board-inner">
                    {game?.tiles.map(t => <TileView key={t.id} tile={t} size={size} theme={theme} />)}
                  </div>

                  {(game?.over || showWin) && (
                    <div className="end-overlay overlay-in absolute inset-0 z-40 flex flex-col items-center justify-center gap-[clamp(0.65rem,0.5rem+0.6vw,1.3rem)] text-center">
                      {theme === "dragon"
                        ? <Creature value={topStage.value} className="h-[clamp(3.5rem,2.5rem+4vw,6rem)] w-[clamp(3.5rem,2.5rem+4vw,6rem)]" />
                        : <span className="font-display text-[clamp(2.25rem,1.6rem+3vw,4.25rem)] font-black">{showWin ? "2048" : "!"}</span>}
                      <h2 className="end-title font-display font-black">{showWin ? copy.winTitle : copy.loseTitle}</h2>
                      <p className="game-muted max-w-[32ch] text-[clamp(0.82rem,0.76rem+0.2vw,1.02rem)]">
                        {showWin
                          ? copy.winBody
                          : theme === "dragon"
                            ? `Your mightiest creature was the ${mightiest.name}. Hoard of ${format(game?.score || 0)} points.`
                            : `You scored ${format(game?.score || 0)} points. Ready to try again?`}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button className="primary-button !min-h-[42px] !px-4 !py-2" onClick={requestNew}>{copy.newGame}</button>
                        {showWin && !game?.over && <button className="secondary-button !min-h-[42px] !px-4 !py-2" onClick={() => dispatch({ type: "continue" })}>{copy.keep}</button>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-[clamp(0.75rem,0.65rem+0.5vw,1.35rem)] flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <p className="game-muted text-[clamp(0.72rem,0.68rem+0.14vw,0.88rem)]">Use arrow keys, WASD or swipe to move.</p>
                  <button className="text-button" onClick={requestNew}>{copy.newGame} <span aria-hidden="true">↗</span></button>
                </div>
              </div>

              <aside className="game-aside">
                <section className="aside-card">
                  <div className="mb-[clamp(0.55rem,0.45rem+0.4vw,1.05rem)] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h2 className="aside-title font-display font-bold">{copy.journey}</h2>
                    <span className="game-muted eyebrow">This game</span>
                  </div>
                  {theme === "dragon" && (
                    <div className="spotlight" style={{ "--spot-glow": mightiest.glow } as CSSProperties}>
                      <div className="spotlight-avatar" style={{ background: tileBg(mightiest) }}>
                        <Creature value={mightiest.value} className="h-full w-full" />
                      </div>
                      <div className="min-w-0">
                        <div className="eyebrow text-[#f0b15e]">Mightiest creature</div>
                        <strong className="font-display block text-[clamp(0.95rem,0.88rem+0.3vw,1.2rem)] leading-tight text-[#ffe9c7]">
                          {mightiest.name}
                        </strong>
                        <p className="game-muted line-clamp-2 text-[clamp(0.72rem,0.68rem+0.14vw,0.86rem)] leading-snug">{mightiest.blurb}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <StatLine label="Time played" value={duration(game?.seconds || 0)} />
                    <StatLine label="Moves made" value={format(game?.moves || 0)} />
                    <StatLine label={theme === "dragon" ? "Dragons evolved" : "Tiles merged"} value={format(game?.merges || 0)} />
                    <StatLine label={copy.highest} value={theme === "dragon" ? `${mightiest.name} · ${format(mightiest.value)}` : format(game?.maxValue || 2)} />
                    <StatLine label="Difficulty" value={modeName(game?.difficulty || "classic")} />
                  </div>
                  <button className="text-button mt-1" onClick={() => setShowStats(!showStats)} aria-expanded={showStats}>
                    {showStats ? "Hide" : "View"} lifetime statistics <span aria-hidden="true">{showStats ? "−" : "+"}</span>
                  </button>
                  {showStats && (
                    <div className="game-divider border-t pt-1">
                      <StatLine label="Games started" value={format(stats.played)} />
                      <StatLine label="Games won" value={format(stats.wins)} />
                      <StatLine label="Lifetime moves" value={format(stats.moves)} />
                      <StatLine label="Lifetime merges" value={format(stats.merges)} />
                      <StatLine label="Total points earned" value={format(stats.totalScore)} />
                      <StatLine label="Highest tile ever" value={format(stats.highestTile)} />
                    </div>
                  )}
                </section>

                <section className="aside-card">
                  <h2 className="aside-title font-display font-bold">Choose your look</h2>
                  <p className="game-muted mb-[clamp(0.75rem,0.65rem+0.5vw,1.35rem)] mt-1 text-[clamp(0.82rem,0.76rem+0.2vw,1.02rem)]">
                    Same puzzle. A different world.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button className={`theme-option ${theme === "classic" ? "selected" : ""}`} onClick={() => { setTheme("classic"); audio.current.play("tap"); }} aria-pressed={theme === "classic"}>
                      <span className="theme-swatch classic-swatch">2</span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-[clamp(0.88rem,0.82rem+0.2vw,1.05rem)] font-bold">Classic</strong>
                        <small className="game-muted block text-[clamp(0.72rem,0.68rem+0.14vw,0.86rem)]">Bright rainbow tiles</small>
                      </span>
                      <span className="game-muted eyebrow shrink-0">Free</span>
                    </button>
                    <button className={`theme-option ${theme === "dragon" ? "selected" : ""}`} onClick={() => theme === "dragon" ? setTheme("classic") : setModal("subscription")} aria-pressed={theme === "dragon"}>
                      <span className="theme-swatch dragon-swatch"><Creature value={8} className="h-full w-full" /></span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-[clamp(0.88rem,0.82rem+0.2vw,1.05rem)] font-bold">Dragon</strong>
                        <small className="game-muted block text-[clamp(0.72rem,0.68rem+0.14vw,0.86rem)]">Living dragons and embers</small>
                      </span>
                      <span className="game-muted eyebrow shrink-0">{theme === "dragon" ? "Preview on" : "Pass"}</span>
                    </button>
                  </div>
                </section>

                {theme === "dragon" && (
                  <section className="aside-card aside-full">
                    <div className="mb-[clamp(0.55rem,0.45rem+0.4vw,1.05rem)] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h2 className="aside-title font-display font-bold">Evolution path</h2>
                      <span className="game-muted eyebrow">{STAGES.filter(s => s.value <= known).length}/{STAGES.length}</span>
                    </div>
                    <div className="evo-grid">
                      {STAGES.map((s, i) => {
                        const locked = s.value > known;
                        return (
                          <div key={s.value} title={`${s.value} · ${s.name}`} className={`evo-cell ${locked ? "opacity-30 grayscale" : ""}`} style={{ background: tileBg(s) }}>
                            <Creature value={s.value} seed={i} still={s.value > codex} className="h-full w-full" />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </aside>
            </div>
          </div>

          {banner && theme === "dragon" && (
            <div key={banner.id} className="banner pointer-events-none fixed left-1/2 top-4 z-50 w-[min(92vw,24rem)]">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-[#1b1126] p-3 text-amber-100 shadow-2xl">
                <Creature value={banner.value} className="h-14 w-14 shrink-0" />
                <div className="min-w-0">
                  <div className="eyebrow text-amber-400">New evolution</div>
                  <strong className="font-display block truncate">{stageFor(banner.value).name}</strong>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {modal && (
        <div className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-[clamp(0.75rem,0.55rem+0.8vw,1.5rem)]" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }} role="presentation">
          <div className="modal-panel overlay-in w-full max-w-[27rem]" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            {modal === "subscription" ? <>
              <div className="mb-[clamp(1rem,0.85rem+0.6vw,1.75rem)] h-[clamp(3.75rem,3rem+2.5vw,5.25rem)] w-[clamp(3.75rem,3rem+2.5vw,5.25rem)] rounded-2xl bg-[#512a30] p-1">
                <Creature value={64} className="h-full w-full" />
              </div>
              <p className="eyebrow text-[#d99b51]">Dragon Pass</p>
              <h2 id="modal-title" className="modal-title font-display mt-2 font-black">A world beyond numbers.</h2>
              <p className="mt-3 text-[clamp(0.85rem,0.8rem+0.18vw,1.02rem)] leading-relaxed opacity-75">
                Watch eggs hatch and dragons evolve as you play. Dragon is planned as a subscription theme; checkout is not connected in this demo.
              </p>
              <button className="primary-button mt-[clamp(1.25rem,1rem+0.9vw,2.15rem)] w-full" onClick={chooseDragonPreview}>
                Try Dragon preview <ArrowIcon />
              </button>
              <p className="mt-3 text-center text-[clamp(0.72rem,0.68rem+0.14vw,0.85rem)] opacity-55">
                Free preview for this visit. No payment or subscription is created.
              </p>
              <button className="mt-4 w-full py-2 text-[clamp(0.85rem,0.8rem+0.18vw,1.02rem)] opacity-70 transition-opacity hover:opacity-100" onClick={() => setModal(null)}>
                Not now
              </button>
            </> : <>
              <p className="eyebrow text-[#d99b51]">Start fresh</p>
              <h2 id="modal-title" className="modal-title font-display mt-3 font-black">Begin a new game?</h2>
              <p className="mt-3 text-[clamp(0.85rem,0.8rem+0.18vw,1.02rem)] leading-relaxed opacity-75">
                Your current board will be replaced. Your best score and lifetime statistics will stay.
              </p>
              <div className="mt-[clamp(1.25rem,1rem+0.9vw,2.15rem)] flex flex-col gap-3 sm:flex-row">
                <button className="secondary-button flex-1" onClick={() => setModal(null)}>Keep playing</button>
                <button className="primary-button flex-1" onClick={startNew}>Start new</button>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBox({ label, value, gain, moveId }: { label: string; value: number; gain?: number; moveId?: number }) {
  return (
    <div className="score-box relative text-center">
      <span className="score-k">{label}</span>
      <strong className="score-v">{format(value)}</strong>
      {!!gain && <span key={moveId} className="score-pop pointer-events-none absolute left-1/2 top-0 text-[clamp(0.85rem,0.8rem+0.2vw,1.05rem)] font-black">+{gain}</span>}
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-line">
      <span className="game-muted">{label}</span>
      <strong className="stat-value">{value}</strong>
    </div>
  );
}

function TileView({ tile, size, theme }: { tile: Tile; size: number; theme: Theme }) {
  const stage = stageFor(tile.value);
  const classic = CLASSIC_TILES[tile.value] ?? CLASSIC_FALLBACK;
  const anim = tile.ghost ? "tile-ghost" : tile.merged ? "tile-evolve" : tile.isNew ? "tile-spawn" : "";
  const faceStyle: CSSProperties = theme === "dragon"
    ? { background: tileBg(stage), boxShadow: tile.value >= 128 ? `0 0 22px -4px ${stage.glow}, inset 0 0 0 1px rgba(255,255,255,.14)` : undefined }
    : ({ background: classic.bg, color: classic.text, "--tile-glow": classic.glow } as CSSProperties);
  const digits = String(tile.value).length;
  const shrink = digits >= 4 ? 0.74 : digits === 3 ? 0.88 : 1;
  const numSize = `clamp(1.05rem, ${((44 / size) * shrink).toFixed(2)}cqw, 4.5rem)`;
  const chipSize = `clamp(0.62rem, ${(20 / size).toFixed(2)}cqw, 1.25rem)`;
  return (
    <div
      className="absolute left-0 top-0 cell-pad transition-transform duration-[130ms] ease-out"
      style={{ width: `${100 / size}%`, height: `${100 / size}%`, transform: `translate(${tile.col * 100}%,${tile.row * 100}%)`, zIndex: tile.ghost ? 5 : tile.merged ? 20 : 10 }}
    >
      <div
        className={`tile-face relative flex h-full w-full items-center justify-center ${anim}`}
        style={faceStyle}
        title={theme === "dragon" ? `${stage.name} - ${tile.value}` : String(tile.value)}
      >
        {theme === "dragon" ? (
          <>
            <Creature value={tile.value} seed={tile.id} className="absolute left-[12%] top-[2%] h-[76%] w-[76%]" />
            <span className="tile-chip absolute bottom-[3%]" style={{ fontSize: chipSize }}>{tile.value}</span>
          </>
        ) : (
          <span className="tile-num" style={{ fontSize: numSize }}>{tile.value}</span>
        )}
      </div>
      {tile.merged && theme === "dragon" && (
        <div className="fx-ring pointer-events-none absolute inset-[8%] rounded-full border-[3px]" style={{ borderColor: stage.glow, boxShadow: `0 0 16px ${stage.glow}` }} />
      )}
    </div>
  );
}

function BrandIcon({ className = "h-[clamp(1.55rem,1.4rem+0.5vw,1.95rem)] w-[clamp(1.55rem,1.4rem+0.5vw,1.95rem)]" }: { className?: string }) {
  return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}><path d="M15 2c-1 6-6 6-4 13-4-2-5-4-5-4C2 20 6 26 14 26s12-6 9-13c-2 3-4 4-5 4 2-7-2-10-3-15Z" fill="#e9a44e" /><path d="M15 13c-1 4-4 5-2 8-2-1-3-2-3-2-1 4 1 6 4 6s5-2 4-6c-1 1-2 2-3 2 1-4 0-6 0-8Z" fill="#fbe4a5" /></svg>;
}
function ArrowIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-[1.05em] w-[1.05em] shrink-0"><path d="M3 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M17 10H4m5 5-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function SoundIcon() {
  return <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 8v4h3l4 3V5L6 8H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M13 7c2 1 2 5 0 6m2-9c4 2 4 10 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function MuteIcon() {
  return <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 8v4h3l4 3V5L6 8H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="m13 7 5 6m0-6-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
