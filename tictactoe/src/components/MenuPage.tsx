import React, { useEffect, useState } from "react";
import {
  Bot,
  ChevronRight,
  Clock,
  Hash,
  Infinity as InfinityIcon,
  Palette,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { DIFFICULTY_LABEL } from "../config/settings";
import { DRAGON_REALMS } from "../config/dragonRealms";
import { getUiTokens, type UiTokens } from "../config/uiTokens";
import type { ViewportMetrics } from "../hooks/useViewportLayout";
import type {
  CellValue,
  DragonRealmId,
  GameMode,
  GameSettings,
  Player,
  ScoreBoard,
  SettingsTab,
  SubscriptionState,
  WinResult,
} from "../types/game";
import { Board } from "./Board";
import { DragonSilhouette } from "./DragonSilhouette";
import { resolveDisplayName } from "./ScoreAndControls";
import { OutcomeBar } from "./ThemeWidgets";
import { Panel } from "./ui";

interface MenuPageProps {
  viewport: ViewportMetrics;
  realm: DragonRealmId;
  subscription: SubscriptionState;
  scores: ScoreBoard;
  settings: GameSettings;
  hasMatchInProgress: boolean;
  moveCount: number;
  onStartNewGame: () => void;
  onQuickStart: (mode: GameMode) => void;
  onResumeGame: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
}

/* ---------- Self-playing demo board ---------- */
const DEMO_SEQUENCE: { index: number; player: Player }[] = [
  { index: 4, player: "X" },
  { index: 1, player: "O" },
  { index: 0, player: "X" },
  { index: 2, player: "O" },
  { index: 8, player: "X" },
];

function useDemoBoard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => (s >= DEMO_SEQUENCE.length + 3 ? 0 : s + 1)),
      800
    );
    return () => clearInterval(id);
  }, []);

  const board: CellValue[] = Array(9).fill(null);
  DEMO_SEQUENCE.slice(0, Math.min(step, DEMO_SEQUENCE.length)).forEach((m) => {
    board[m.index] = m.player;
  });
  const done = step >= DEMO_SEQUENCE.length;
  const win: WinResult | null = done ? { winner: "X", line: [0, 4, 8], reason: "line" } : null;
  const current: Player = step % 2 === 0 ? "X" : "O";
  const last = step > 0 && !done ? DEMO_SEQUENCE[step - 1].index : null;
  return { board, win, current, last };
}

/* ---------- Menu tile ---------- */
const MenuTile: React.FC<{
  tokens: UiTokens;
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: string;
  badge?: string;
  premium?: boolean;
  watermarkRealm?: DragonRealmId;
  delay: number;
  onClick: () => void;
}> = ({ tokens: t, icon, title, desc, action, badge, premium = false, watermarkRealm, delay, onClick }) => (
  <div className="animate-fade-up" style={{ "--d": `${delay}s` } as React.CSSProperties}>
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-full min-h-[172px] w-full min-w-0 flex-col gap-3 overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 cursor-pointer hover:-translate-y-1 focus:outline-none focus-visible:ring-2 sm:p-5 ${t.ring} ${
        premium
          ? "bg-gradient-to-br from-[#1E1630] to-[#0E0B16] text-white ring-1 ring-amber-400/30 shadow-[0_24px_50px_-28px_rgba(245,158,11,0.6)]"
          : t.panel
      }`}
    >
      {watermarkRealm && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 opacity-60 transition-transform duration-300 group-hover:scale-110"
        >
          <DragonSilhouette realm={watermarkRealm} className="h-full w-full" />
        </div>
      )}
      <div className="relative flex items-start justify-between gap-2">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
            premium ? "bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/30" : t.iconTile
          }`}
        >
          {icon}
        </span>
        {badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              premium ? "bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/30" : t.chip
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="relative min-w-0">
        <div
          className={`text-base font-extrabold tracking-tight ${premium ? "text-white" : t.textStrong} ${t.displayFont}`}
        >
          {title}
        </div>
        <div className={`mt-1 text-xs leading-snug ${premium ? "text-slate-400" : t.textMuted}`}>
          {desc}
        </div>
      </div>
      <div
        className={`relative mt-auto inline-flex items-center gap-1 text-xs font-bold ${
          premium ? "text-amber-300" : t.accentText
        }`}
      >
        {action}
        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </button>
  </div>
);

/* ---------- Page ---------- */
export const MenuPage: React.FC<MenuPageProps> = ({
  viewport,
  realm,
  scores,
  settings,
  hasMatchInProgress,
  moveCount,
  onStartNewGame,
  onQuickStart,
  onResumeGame,
  onOpenSettings,
}) => {
  const theme = settings.theme;
  const t = getUiTokens(theme, realm);
  const r = DRAGON_REALMS[realm];
  const isDragon = t.isDragon;
  const demo = useDemoBoard();

  const demoSize = Math.round(
    Math.max(
      190,
      Math.min(
        viewport.width >= 820 ? viewport.width * 0.26 : viewport.width - 96,
        viewport.height * 0.42,
        320
      )
    )
  );

  const nameX = resolveDisplayName("X", "pvp", settings.humanSide, settings.playerNames, isDragon);
  const nameO = resolveDisplayName("O", "pvp", settings.humanSide, settings.playerNames, isDragon);
  const totalGames = scores.X + scores.O + scores.draws;

  const features = [
    { icon: <Zap className="h-3 w-3" />, label: "Smart AI" },
    { icon: <InfinityIcon className="h-3 w-3" />, label: "Infinite mode" },
    { icon: <Clock className="h-3 w-3" />, label: "Turn clock" },
    { icon: <Sparkles className="h-3 w-3" />, label: "4 Dragon realms" },
  ];

  const setupRows: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tab: SettingsTab;
  }[] = [
    {
      icon: <Swords className="h-4 w-4" />,
      label: "Match",
      value:
        settings.gameMode === "ai"
          ? `vs ${DIFFICULTY_LABEL[settings.aiDifficulty]} AI · you play ${settings.humanSide}`
          : "2 Players · pass & play",
      tab: "gameplay",
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Board",
      value: `${settings.boardSize}×${settings.boardSize} · ${
        settings.variant === "infinite" ? "Infinite" : "Standard"
      } · ${settings.turnTimer ? `${settings.turnTimer}s clock` : "no clock"}`,
      tab: "gameplay",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Players",
      value:
        settings.gameMode === "ai"
          ? `${resolveDisplayName(settings.humanSide, "ai", settings.humanSide, settings.playerNames, isDragon)} vs ${
              isDragon ? "Dragon AI" : "Computer"
            }`
          : `${nameX} vs ${nameO}`,
      tab: "players",
    },
    {
      icon: <Palette className="h-4 w-4" />,
      label: "Look",
      value: isDragon ? `Dragon · ${r.name}` : "Classic Studio",
      tab: "appearance",
    },
    {
      icon: settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />,
      label: "Sound",
      value: settings.soundEnabled ? `On · ${settings.volume}% volume` : "Muted",
      tab: "audio",
    },
  ];

  return (
    <div className="@container mx-auto flex w-full max-w-[min(96vw,1240px)] flex-col gap-[clamp(1rem,2.2vw,1.5rem)] py-[clamp(0.25rem,1.5dvh,1rem)]">
      {/* ================= HERO ================= */}
      <section
        className={`relative overflow-hidden rounded-[2rem] p-[clamp(1.25rem,3.5vw,2.5rem)] ${t.panel}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: `${t.xColor}22` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: `${t.oColor}1a` }}
        />

        <div className="relative grid items-center gap-[clamp(1.5rem,4vw,3rem)] @3xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0 animate-fade-up">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${t.chip}`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: t.xColor }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: t.xColor }}
                />
              </span>
              {isDragon ? `${r.name} · Dragon Pass` : "Classic Studio · Free to play"}
            </span>

            <h1
              className={`mt-4 text-[clamp(2rem,5.2vw,3.75rem)] font-extrabold leading-[1.04] tracking-tight ${t.textStrong} ${t.displayFont}`}
            >
              {isDragon ? (
                <>
                  Wake the dragon.
                  <br />
                  <span className={t.gradientText}>Claim the arena.</span>
                </>
              ) : (
                <>
                  Three in a row.
                  <br />
                  <span className={t.gradientText}>Endless strategy.</span>
                </>
              )}
            </h1>

            <p className={`mt-3 max-w-xl text-sm leading-relaxed sm:text-[15px] ${t.textBody}`}>
              Challenge a sharp AI or a friend on 3×3, 4×4 or 5×5 grids. Your rules, theme and
              names live in Settings and are remembered every time you come back.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {hasMatchInProgress ? (
                <>
                  <button
                    type="button"
                    onClick={onResumeGame}
                    className={`inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${t.primaryBtn}`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Resume match · move {moveCount}
                  </button>
                  <button
                    type="button"
                    onClick={onStartNewGame}
                    className={`inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all duration-200 cursor-pointer ${t.secondaryBtn}`}
                  >
                    <RotateCcw className="h-4 w-4" />
                    New match
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onStartNewGame}
                    className={`inline-flex h-12 items-center gap-2 rounded-2xl px-7 text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${t.primaryBtn}`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Play now
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSettings()}
                    className={`inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all duration-200 cursor-pointer ${t.secondaryBtn}`}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {features.map((f, i) => (
                <span
                  key={f.label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold animate-fade-up ${t.chip}`}
                  style={{ "--d": `${0.1 + i * 0.06}s` } as React.CSSProperties}
                >
                  <span className={t.accentText}>{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Demo board */}
          <div
            className="relative justify-self-center animate-fade-up"
            style={{ "--d": "0.15s" } as React.CSSProperties}
          >
            <div
              aria-hidden="true"
              className="absolute -inset-10 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${t.xColor}30, transparent 65%)` }}
            />
            <div inert className="relative">
              <Board
                board={demo.board}
                boardSize={3}
                boardSizePx={demoSize}
                currentPlayer={demo.current}
                theme={theme}
                realm={realm}
                winResult={demo.win}
                lastMoveIndex={demo.last}
                hintIndex={null}
                nextVanishIndex={null}
                disabled={true}
                onCellClick={() => {}}
                showCoordinates={settings.showCoordinates}
                highlightLastMove={settings.highlightLastMove}
              />
            </div>
            <span
              className={`absolute -bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold shadow-lg ${t.panelSolid} ${t.textBody}`}
            >
              {demo.win ? (
                <>
                  <Trophy className="h-3 w-3 text-amber-500" /> X wins the demo
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                  preview
                </>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* ================= MAIN MENU ================= */}
      <section aria-labelledby="main-menu-title">
        <div className="mb-3 px-1">
          <h2
            id="main-menu-title"
            className={`text-lg font-extrabold tracking-tight ${t.textStrong} ${t.displayFont}`}
          >
            Main Menu
          </h2>
          <p className={`text-xs ${t.textMuted}`}>
            Jump straight into a mode, or fine-tune every option in Settings.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3 sm:gap-4">
          <MenuTile
            tokens={t}
            delay={0.05}
            icon={<Bot className="h-5 w-5" />}
            title="Single Player"
            desc={`vs ${DIFFICULTY_LABEL[settings.aiDifficulty]} AI · you play ${settings.humanSide} · ${settings.boardSize}×${settings.boardSize}`}
            action="Play solo"
            badge={settings.gameMode === "ai" ? "Selected" : undefined}
            onClick={() => onQuickStart("ai")}
          />
          <MenuTile
            tokens={t}
            delay={0.1}
            icon={<Users className="h-5 w-5" />}
            title="Two Players"
            desc={`${nameX} vs ${nameO} · pass & play on one device`}
            action="Play together"
            badge={settings.gameMode === "pvp" ? "Selected" : undefined}
            onClick={() => onQuickStart("pvp")}
          />
          <MenuTile
            tokens={t}
            delay={0.15}
            icon={<Settings className="h-5 w-5" />}
            title="Settings"
            desc="Rules, players, theme, sound & assists — all saved automatically"
            action="Open settings"
            onClick={() => onOpenSettings()}
          />
        </div>
      </section>

      {/* ================= SETUP + RECORD ================= */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-start gap-4">
        <Panel
          tokens={t}
          title="Your Setup"
          subtitle="Saved settings used every time you press Play"
          icon={<Sparkles className="h-4 w-4" />}
          action={
            <button
              type="button"
              onClick={() => onOpenSettings()}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${t.chip}`}
            >
              Edit all
            </button>
          }
        >
          <ul className={`divide-y ${isDragon ? "divide-white/[0.07]" : "divide-slate-200/80"}`}>
            {setupRows.map((row) => (
              <li key={row.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.iconTile}`}
                >
                  {row.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={t.label}>{row.label}</div>
                  <div className={`truncate text-[13px] font-semibold ${t.textStrong}`}>
                    {row.value}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSettings(row.tab)}
                  aria-label={`Edit ${row.label.toLowerCase()} settings`}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${t.secondaryBtn}`}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          tokens={t}
          title="Career Record"
          subtitle={totalGames ? `${totalGames} rounds played` : "No rounds yet"}
          icon={<Trophy className="h-4 w-4" />}
          action={
            <button
              type="button"
              onClick={() => onOpenSettings("data")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${t.chip}`}
            >
              Manage
            </button>
          }
        >
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "X wins", value: scores.X },
              { label: "Draws", value: scores.draws },
              { label: "O wins", value: scores.O },
              { label: "Best", value: scores.bestStreak },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl px-1.5 py-2.5 text-center ${t.inset}`}>
                <div className={`font-tabular text-lg font-extrabold leading-none ${t.textStrong}`}>
                  {s.value}
                </div>
                <div
                  className={`mt-1 truncate text-[10px] font-semibold uppercase tracking-wider ${t.textMuted}`}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3.5">
            <OutcomeBar scores={scores} theme={theme} realm={realm} />
          </div>
        </Panel>
      </div>
    </div>
  );
};
