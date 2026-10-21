import React from "react";
import {
  BarChart3,
  Clock,
  Flame,
  Lightbulb,
  RotateCcw,
  Settings,
  Sparkles,
  Trophy,
  Undo2,
} from "lucide-react";
import { summarizeMatch } from "../config/settings";
import { getUiTokens } from "../config/uiTokens";
import type {
  AIDifficulty,
  BoardSize,
  DragonRealmId,
  GameMode,
  GameVariant,
  MoveRecord,
  Player,
  ScoreBoard,
  ThemeId,
  TurnTimerOption,
  WinResult,
} from "../types/game";
import { GamePiece } from "./Pieces";
import { FieldLabel, Panel } from "./ui";
import { OutcomeBar } from "./ThemeWidgets";

/** Everything the in-game widgets need. No settings controls live here any more. */
export interface ArenaControlProps {
  theme: ThemeId;
  realm: DragonRealmId;
  scores: ScoreBoard;
  playerNames: { X: string; O: string };
  humanSide: Player;
  currentPlayer: Player;
  winResult: WinResult | null;
  gameMode: GameMode;
  boardSize: BoardSize;
  variant: GameVariant;
  turnTimer: TurnTimerOption;
  timeRemainingMs: number;
  aiDifficulty: AIDifficulty;
  isAiThinking: boolean;
  canUndo: boolean;
  moves: MoveRecord[];
  hintsEnabled: boolean;
  undoEnabled: boolean;
  onNewRound: () => void;
  onUndo: () => void;
  onHint: () => void;
  onOpenSettings: () => void;
}

export function resolveDisplayName(
  player: Player,
  gameMode: GameMode,
  humanSide: Player,
  playerNames: { X: string; O: string },
  isDragon: boolean
): string {
  const custom = playerNames[player]?.trim();
  if (gameMode === "ai") {
    if (player === humanSide) return custom || (isDragon ? "Challenger" : "You");
    return isDragon ? "Dragon AI" : "Computer";
  }
  return custom || `Player ${player}`;
}

/* ------------------------------------------------------------------ */
/* Versus scoreboard + live status                                     */
/* ------------------------------------------------------------------ */

export const VersusCard: React.FC<ArenaControlProps> = ({
  theme,
  realm,
  scores,
  playerNames,
  humanSide,
  currentPlayer,
  winResult,
  gameMode,
  turnTimer,
  timeRemainingMs,
  isAiThinking,
}) => {
  const t = getUiTokens(theme, realm);
  const isDragon = t.isDragon;

  const names: Record<Player, string> = {
    X: resolveDisplayName("X", gameMode, humanSide, playerNames, isDragon),
    O: resolveDisplayName("O", gameMode, humanSide, playerNames, isDragon),
  };

  let statusText: string;
  if (winResult) {
    if (winResult.winner === "draw") {
      statusText = isDragon ? "Stalemate in the arena" : "Round drawn — well matched";
    } else {
      statusText =
        winResult.reason === "timeout"
          ? `${names[winResult.winner]} wins on time`
          : `${names[winResult.winner]} takes the round`;
    }
  } else if (isAiThinking) {
    statusText = isDragon ? "The dragon is plotting…" : "Computer is thinking…";
  } else {
    statusText =
      gameMode === "ai" && currentPlayer === humanSide
        ? "Your move — pick a cell"
        : `${names[currentPlayer]} to move`;
  }

  const timerActive = turnTimer > 0 && !winResult;
  const timerPct = timerActive
    ? Math.max(0, Math.min(100, (timeRemainingMs / (turnTimer * 1000)) * 100))
    : 0;
  const lowTime = timerActive && timeRemainingMs <= 3000;

  const renderSide = (player: Player) => {
    const isActive = !winResult && currentPlayer === player;
    const isWinner = winResult?.winner === player;
    const highlight = isActive || isWinner;
    const color = player === "X" ? t.xColor : t.oColor;
    const alignRight = player === "O";

    const surface = isDragon
      ? highlight
        ? "bg-white/[0.07] border-white/20"
        : "bg-black/20 border-white/[0.06]"
      : highlight
      ? player === "X"
        ? "bg-blue-50/80 border-blue-300"
        : "bg-rose-50/80 border-rose-300"
      : "bg-white/70 border-slate-200/80";

    const badgeText = isWinner
      ? "Winner"
      : isAiThinking && gameMode === "ai" && player !== humanSide
      ? "Thinking"
      : "Turn";

    return (
      <div
        className={`relative flex min-w-0 items-center gap-2.5 rounded-2xl border p-2 transition-all duration-300 sm:p-2.5 ${surface} ${
          alignRight ? "flex-row-reverse text-right" : ""
        }`}
        style={
          highlight
            ? { boxShadow: `0 0 0 3px ${color}1f, 0 12px 28px -16px ${color}` }
            : undefined
        }
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
            isDragon
              ? "bg-black/35 ring-1 ring-inset ring-white/10"
              : "bg-white shadow-sm ring-1 ring-inset ring-slate-200/80"
          }`}
        >
          <GamePiece
            player={player}
            theme={theme}
            realm={realm}
            animate={false}
            className="h-[70%] w-[70%]"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className={`truncate text-[11px] font-semibold sm:text-xs ${t.textBody}`}>
            {names[player]}
          </div>
          <div
            className={`mt-0.5 font-tabular text-2xl font-extrabold leading-none sm:text-[28px] ${t.textStrong}`}
          >
            {scores[player]}
          </div>
        </div>

        {highlight && (
          <span
            className={`absolute -top-2 ${
              alignRight ? "right-3" : "left-3"
            } inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shadow-sm ${
              isDragon ? "text-slate-950" : "text-white"
            }`}
            style={{ backgroundColor: color }}
          >
            {isWinner ? (
              <Trophy className="h-2.5 w-2.5" />
            ) : (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            )}
            {badgeText}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`rounded-3xl p-2.5 transition-colors duration-300 sm:p-3 ${t.panel}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 pt-1">
        {renderSide("X")}
        <div className="flex flex-col items-center px-0.5">
          <span className={`text-[10px] font-black tracking-[0.22em] ${t.textMuted}`}>VS</span>
          <span className={`mt-1 font-tabular text-sm font-bold ${t.textBody}`}>
            {scores.draws}
          </span>
          <span className={`text-[9px] font-semibold uppercase tracking-wider ${t.textMuted}`}>
            draws
          </span>
        </div>
        {renderSide("O")}
      </div>

      <div className={`mt-2.5 overflow-hidden rounded-2xl ${t.inset}`}>
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 px-3 py-2"
        >
          <div className={`flex min-w-0 items-center gap-2 ${t.accentText}`}>
            {isAiThinking ? (
              <span className="flex shrink-0 gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
            ) : winResult ? (
              winResult.winner === "draw" ? (
                <Sparkles className="h-4 w-4 shrink-0" />
              ) : (
                <Trophy className="h-4 w-4 shrink-0" />
              )
            ) : (
              <GamePiece
                player={currentPlayer}
                theme={theme}
                realm={realm}
                animate={false}
                className="h-4 w-4 shrink-0"
              />
            )}
            <span className={`truncate text-xs font-semibold sm:text-[13px] ${t.textStrong}`}>
              {statusText}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {timerActive && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-tabular text-[10px] font-bold ${
                  lowTime
                    ? "bg-red-500/15 text-red-500 ring-1 ring-inset ring-red-500/30"
                    : t.chip
                }`}
              >
                <Clock className="h-3 w-3" />
                {(timeRemainingMs / 1000).toFixed(1)}s
              </span>
            )}
            {scores.currentStreak >= 2 && (
              <span
                title="Current win streak"
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500 ring-1 ring-inset ring-amber-500/30"
              >
                <Flame className="h-3 w-3" />
                {scores.currentStreak}
              </span>
            )}
          </div>
        </div>

        {timerActive && (
          <div className={`h-1 w-full ${isDragon ? "bg-white/[0.05]" : "bg-slate-200/70"}`}>
            <div
              style={{
                width: `${timerPct}%`,
                backgroundColor: lowTime
                  ? "#EF4444"
                  : currentPlayer === "X"
                  ? t.xColor
                  : t.oColor,
              }}
              className="h-full transition-[width] duration-100 ease-linear"
            />
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Game actions                                                        */
/* ------------------------------------------------------------------ */

export const QuickActionToolbar: React.FC<ArenaControlProps> = ({
  theme,
  realm,
  winResult,
  canUndo,
  isAiThinking,
  hintsEnabled,
  undoEnabled,
  onNewRound,
  onUndo,
  onHint,
}) => {
  const t = getUiTokens(theme, realm);
  const undoDisabled = !canUndo || isAiThinking;
  const hintDisabled = Boolean(winResult) || isAiThinking;
  const extras = (undoEnabled ? 1 : 0) + (hintsEnabled ? 1 : 0);
  const columns =
    extras === 2
      ? "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]"
      : extras === 1
      ? "grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
      : "grid-cols-1";

  const secondary = `flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm ${t.secondaryBtn}`;

  return (
    <div className={`grid gap-2 ${columns}`}>
      <button
        type="button"
        onClick={onNewRound}
        className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${t.primaryBtn}`}
      >
        <RotateCcw className="h-4 w-4 shrink-0" />
        <span className="truncate">{winResult ? "Play again" : "Restart round"}</span>
      </button>
      {undoEnabled && (
        <button
          type="button"
          disabled={undoDisabled}
          onClick={onUndo}
          title="Undo last turn"
          className={`${secondary} ${undoDisabled ? "" : "cursor-pointer"}`}
        >
          <Undo2 className="h-4 w-4 shrink-0" />
          <span className="truncate">Undo</span>
        </button>
      )}
      {hintsEnabled && (
        <button
          type="button"
          disabled={hintDisabled}
          onClick={onHint}
          title="Show the best move"
          className={`${secondary} ${hintDisabled ? "" : "cursor-pointer"}`}
        >
          <Lightbulb
            className={`h-4 w-4 shrink-0 ${t.isDragon ? t.accentText : "text-amber-500"}`}
          />
          <span className="truncate">Hint</span>
        </button>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Current rules summary + shortcut to the Settings page               */
/* ------------------------------------------------------------------ */

export const MatchInfoBar: React.FC<ArenaControlProps> = (props) => {
  const { theme, realm, onOpenSettings } = props;
  const t = getUiTokens(theme, realm);
  const chips = summarizeMatch(props);

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl p-1.5 pl-3 transition-colors duration-300 ${t.panel}`}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-0.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${t.chip}`}
          >
            {chip}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        title="Change rules, theme, players and sound"
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all duration-200 cursor-pointer ${t.secondaryBtn}`}
      >
        <Settings className="h-3.5 w-3.5" />
        <span>Settings</span>
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Match log (shown beside the board on roomy screens)                 */
/* ------------------------------------------------------------------ */

export const MatchLogCard: React.FC<ArenaControlProps> = ({ theme, realm, scores, moves }) => {
  const t = getUiTokens(theme, realm);
  const stats = [
    { label: "Matches", value: scores.totalMatches },
    { label: "Streak", value: scores.currentStreak },
    { label: "Best", value: scores.bestStreak },
  ];

  return (
    <Panel
      tokens={t}
      title="Match Log"
      subtitle="Career record & this round's moves"
      icon={<BarChart3 className="h-4 w-4" />}
    >
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl px-2 py-2.5 text-center ${t.inset}`}>
            <div className={`font-tabular text-lg font-extrabold leading-none ${t.textStrong}`}>
              {s.value}
            </div>
            <div
              className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${t.textMuted}`}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5">
        <OutcomeBar scores={scores} theme={theme} realm={realm} />
      </div>

      <div className="mt-4">
        <FieldLabel tokens={t} hint={`${moves.length} moves`}>
          Moves
        </FieldLabel>
        <div className={`thin-scroll max-h-36 overflow-y-auto rounded-2xl p-1.5 ${t.inset}`}>
          {moves.length === 0 ? (
            <p className={`px-2 py-4 text-center text-[11px] ${t.textMuted}`}>
              Moves will appear here as you play
            </p>
          ) : (
            <ol className="grid grid-cols-2 gap-1">
              {[...moves].reverse().map((m) => (
                <li
                  key={m.step}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] ${
                    t.isDragon ? "bg-white/[0.04]" : "bg-white"
                  }`}
                >
                  <span className={`font-tabular ${t.textMuted}`}>
                    {String(m.step).padStart(2, "0")}
                  </span>
                  <GamePiece
                    player={m.player}
                    theme={theme}
                    realm={realm}
                    animate={false}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  <span className={`font-tabular font-bold ${t.textStrong}`}>{m.coord}</span>
                  {m.vanishedIndex !== null && (
                    <span
                      className={`ml-auto text-[9px] font-semibold uppercase ${t.textMuted}`}
                    >
                      fade
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Panel>
  );
};
