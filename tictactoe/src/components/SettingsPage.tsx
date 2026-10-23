import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  Clock,
  Crosshair,
  Database,
  Eye,
  Gamepad2,
  Hash,
  Infinity as InfinityIcon,
  Info,
  Lightbulb,
  Palette,
  PartyPopper,
  Play,
  Repeat,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Undo2,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { DIFFICULTY_DESCRIPTION, MAX_NAME_LENGTH } from "../config/settings";
import { DRAGON_REALMS } from "../config/dragonRealms";
import { getUiTokens, type UiTokens } from "../config/uiTokens";
import type {
  CellValue,
  DragonRealmId,
  GameSettings,
  Player,
  ScoreBoard,
  SettingsTab,
  SubscriptionState,
  ThemeId,
} from "../types/game";
import { Board } from "./Board";
import { GamePiece } from "./Pieces";
import { FieldLabel, Panel, Segmented, SettingGroup, SettingRow, Toggle } from "./ui";
import { OutcomeBar, RealmPicker, ThemeChoiceCards } from "./ThemeWidgets";

export type UpdateSetting = <K extends keyof GameSettings>(
  key: K,
  value: GameSettings[K]
) => void;

interface SettingsPageProps {
  settings: GameSettings;
  realm: DragonRealmId;
  subscription: SubscriptionState;
  scores: ScoreBoard;
  tab: SettingsTab;
  hasMatchInProgress: boolean;
  savedAt: number;
  onTabChange: (tab: SettingsTab) => void;
  onUpdate: UpdateSetting;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectRealm: (realm: DragonRealmId) => void;
  onResetScores: () => void;
  onRestoreDefaults: () => void;
  onPreviewSound: () => void;
  onPlay: () => void;
  onBack: () => void;
}

const TABS: { id: SettingsTab; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "gameplay", label: "Gameplay", desc: "Opponent, board & rules", icon: <Gamepad2 className="h-4 w-4" /> },
  { id: "players", label: "Players", desc: "Names & turn order", icon: <Users className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", desc: "Theme, realm & effects", icon: <Palette className="h-4 w-4" /> },
  { id: "audio", label: "Sound & Assists", desc: "Volume, hints & undo", icon: <Volume2 className="h-4 w-4" /> },
  { id: "data", label: "Pass & Data", desc: "Dragon Pass, stats & reset", icon: <Database className="h-4 w-4" /> },
];

const PREVIEW_BOARD: CellValue[] = ["X", null, "O", null, "X", null, "O", null, null];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const Notice: React.FC<{ tokens: UiTokens; children: React.ReactNode }> = ({
  tokens: t,
  children,
}) => (
  <div
    role="note"
    className={`flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-xs leading-snug ${
      t.isDragon
        ? "bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-400/25"
        : "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
    }`}
  >
    <Info className="mt-px h-4 w-4 shrink-0" />
    <span>{children}</span>
  </div>
);

const ChoiceCard: React.FC<{
  tokens: UiTokens;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}> = ({ tokens: t, active, onClick, icon, title, desc }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`group relative flex min-w-0 flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 ${t.ring} ${
      active ? t.cardActive : t.cardIdle
    }`}
  >
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${t.iconTile}`}
    >
      {icon}
    </span>
    <span className={`text-[13px] font-bold ${t.textStrong}`}>{title}</span>
    <span className={`text-[11.5px] leading-snug ${t.textMuted}`}>{desc}</span>
    <span
      className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
        active ? t.radioOn : t.radioOff
      }`}
    >
      {active && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  </button>
);

const MiniGrid: React.FC<{ n: number; color: string }> = ({ n, color }) => (
  <span
    aria-hidden="true"
    className="grid h-7 w-7 gap-[2px]"
    style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
  >
    {Array.from({ length: n * n }).map((_, i) => (
      <span
        key={i}
        className="rounded-[2px]"
        style={{ backgroundColor: color, opacity: i % (n + 1) === 0 ? 0.95 : 0.22 }}
      />
    ))}
  </span>
);

const NameField: React.FC<{
  tokens: UiTokens;
  player: Player;
  theme: ThemeId;
  realm: DragonRealmId;
  value: string;
  placeholder: string;
  note: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}> = ({ tokens: t, player, theme, realm, value, placeholder, note, disabled = false, onChange }) => {
  const id = `player-name-${player}`;
  return (
    <div className={disabled ? "opacity-60" : ""}>
      <label htmlFor={id} className={t.label}>
        Player {player}
      </label>
      <div
        className={`mt-1.5 flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-shadow focus-within:ring-2 ${t.inset} ${
          t.isDragon ? "focus-within:ring-white/25" : "focus-within:ring-blue-500/40"
        }`}
      >
        <GamePiece
          player={player}
          theme={theme}
          realm={realm}
          animate={false}
          className="h-6 w-6 shrink-0"
        />
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          maxLength={MAX_NAME_LENGTH}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value.slice(0, MAX_NAME_LENGTH))}
          className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium disabled:cursor-not-allowed ${
            t.textStrong
          } ${t.isDragon ? "placeholder:text-slate-500" : "placeholder:text-slate-400"}`}
        />
        {!disabled && (
          <span className={`font-tabular text-[10px] ${t.textMuted}`}>
            {value.length}/{MAX_NAME_LENGTH}
          </span>
        )}
      </div>
      <p className={`mt-1.5 text-[11px] ${t.textMuted}`}>{note}</p>
    </div>
  );
};

/** Two-step button: first tap arms it, second tap (within 3s) confirms. */
const ConfirmButton: React.FC<{
  tokens: UiTokens;
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
}> = ({ tokens: t, label, confirmLabel, onConfirm }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all duration-200 cursor-pointer ${
        armed
          ? "bg-red-500 text-white shadow-[0_8px_20px_-10px_rgba(239,68,68,0.9)]"
          : t.secondaryBtn
      }`}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {armed ? confirmLabel : label}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings: s,
  realm,
  subscription,
  scores,
  tab,
  hasMatchInProgress,
  savedAt,
  onTabChange,
  onUpdate,
  onSelectTheme,
  onSelectRealm,
  onResetScores,
  onRestoreDefaults,
  onPreviewSound,
  onPlay,
  onBack,
}) => {
  const t = getUiTokens(s.theme, realm);
  const r = DRAGON_REALMS[realm];
  const aiName = t.isDragon ? "Dragon AI" : "Computer";

  // Flash a "Saved" confirmation whenever a setting is written to storage.
  const [justSaved, setJustSaved] = useState(false);
  const savedAtOnMount = useRef(savedAt);
  useEffect(() => {
    if (savedAt === savedAtOnMount.current) return;
    setJustSaved(true);
    const id = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(id);
  }, [savedAt]);

  const tabActive = t.isDragon
    ? "bg-white/[0.09] text-white ring-1 ring-inset ring-white/15"
    : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80";
  const tabIdle = t.isDragon
    ? "text-slate-400 hover:bg-white/[0.05] hover:text-white"
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900";

  /* ---------------- Gameplay ---------------- */
  const gameplay = (
    <>
      {hasMatchInProgress && (
        <Notice tokens={t}>
          A match is in progress. Changing the opponent, board or ruleset will restart it.
        </Notice>
      )}

      <Panel
        tokens={t}
        title="Opponent"
        subtitle="Choose who you play against"
        icon={<Swords className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-2.5">
          <ChoiceCard
            tokens={t}
            active={s.gameMode === "ai"}
            onClick={() => onUpdate("gameMode", "ai")}
            icon={<Bot className="h-4.5 w-4.5" />}
            title="vs Computer"
            desc="Three AI skill levels"
          />
          <ChoiceCard
            tokens={t}
            active={s.gameMode === "pvp"}
            onClick={() => onUpdate("gameMode", "pvp")}
            icon={<Users className="h-4.5 w-4.5" />}
            title="2 Players"
            desc="Pass & play on one device"
          />
        </div>

        {s.gameMode === "ai" && (
          <SettingGroup tokens={t} className="mt-4">
            <SettingRow
              tokens={t}
              layout="wide"
              title="AI skill"
              description={DIFFICULTY_DESCRIPTION[s.aiDifficulty]}
              control={
                <Segmented
                  tokens={t}
                  ariaLabel="AI skill"
                  value={s.aiDifficulty}
                  onChange={(v) => onUpdate("aiDifficulty", v)}
                  options={[
                    { value: "casual", label: "Casual" },
                    { value: "tactical", label: "Tactical" },
                    { value: "unbeatable", label: "Master" },
                  ]}
                />
              }
            />
            <SettingRow
              tokens={t}
              layout="wide"
              title="Your side"
              description="X always makes the first move"
              control={
                <Segmented
                  tokens={t}
                  ariaLabel="Your side"
                  value={s.humanSide}
                  onChange={(v) => onUpdate("humanSide", v)}
                  options={[
                    { value: "X", label: "Play X" },
                    { value: "O", label: "Play O" },
                  ]}
                />
              }
            />
          </SettingGroup>
        )}
      </Panel>

      <Panel
        tokens={t}
        title="Board & Rules"
        subtitle="Grid size, ruleset and turn clock"
        icon={<Hash className="h-4 w-4" />}
      >
        <FieldLabel tokens={t} hint={s.boardSize === 3 ? "3 in a row wins" : "4 in a row wins"}>
          Grid size
        </FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {([3, 4, 5] as const).map((size) => {
            const active = s.boardSize === size;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={active}
                onClick={() => onUpdate("boardSize", size)}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 ${t.ring} ${
                  active ? t.cardActive : t.cardIdle
                }`}
              >
                <MiniGrid
                  n={size}
                  color={active ? t.xColor : t.isDragon ? "#94A3B8" : "#64748B"}
                />
                <span className={`text-sm font-extrabold ${t.textStrong}`}>
                  {size}×{size}
                </span>
                <span className={`text-[10.5px] ${t.textMuted}`}>
                  {size === 3 ? "Classic" : size === 4 ? "Tactical" : "Epic"}
                </span>
              </button>
            );
          })}
        </div>

        <SettingGroup tokens={t} className="mt-4">
          <SettingRow
            tokens={t}
            layout="wide"
            icon={<InfinityIcon className="h-4 w-4" />}
            title="Ruleset"
            description={
              s.variant === "infinite"
                ? "Your oldest mark fades away — no draws possible"
                : "Classic rules — fill the board"
            }
            control={
              <Segmented
                tokens={t}
                ariaLabel="Ruleset"
                value={s.variant}
                onChange={(v) => onUpdate("variant", v)}
                options={[
                  { value: "standard", label: "Standard" },
                  { value: "infinite", label: "Infinite" },
                ]}
              />
            }
          />
          <SettingRow
            tokens={t}
            layout="wide"
            icon={<Clock className="h-4 w-4" />}
            title="Turn clock"
            description={
              s.turnTimer
                ? `${s.turnTimer} seconds per move — run out and you lose the round`
                : "Take as long as you like"
            }
            control={
              <Segmented
                tokens={t}
                ariaLabel="Turn clock"
                value={s.turnTimer}
                onChange={(v) => onUpdate("turnTimer", v)}
                options={[
                  { value: 0, label: "Off" },
                  { value: 20, label: "20s" },
                  { value: 10, label: "10s" },
                  { value: 5, label: "5s" },
                ]}
              />
            }
          />
        </SettingGroup>
      </Panel>
    </>
  );

  /* ---------------- Players ---------------- */
  const players = (
    <>
      <Panel
        tokens={t}
        title="Player Names"
        subtitle="Shown on the scoreboard and result card"
        icon={<Users className="h-4 w-4" />}
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
          {(["X", "O"] as const).map((p) => {
            const isAi = s.gameMode === "ai" && p !== s.humanSide;
            return (
              <NameField
                key={p}
                tokens={t}
                player={p}
                theme={s.theme}
                realm={realm}
                value={isAi ? "" : s.playerNames[p]}
                placeholder={isAi ? aiName : s.gameMode === "ai" ? "You" : `Player ${p}`}
                disabled={isAi}
                note={
                  isAi
                    ? "Controlled by the computer"
                    : s.gameMode === "ai"
                    ? "That's you"
                    : p === "X"
                    ? "Moves first"
                    : "Moves second"
                }
                onChange={(v) => onUpdate("playerNames", { ...s.playerNames, [p]: v })}
              />
            );
          })}
        </div>
      </Panel>

      <Panel
        tokens={t}
        title="Turn Order"
        subtitle="Who opens each round"
        icon={<Repeat className="h-4 w-4" />}
      >
        <SettingGroup tokens={t}>
          <SettingRow
            tokens={t}
            title="Alternate first move"
            description="In 2-player games the opening move switches between X and O every round."
            control={
              <Toggle
                tokens={t}
                label="Alternate first move"
                checked={s.alternateStarter}
                onChange={(v) => onUpdate("alternateStarter", v)}
              />
            }
          />
        </SettingGroup>
      </Panel>
    </>
  );

  /* ---------------- Appearance ---------------- */
  const appearance = (
    <>
      <Panel
        tokens={t}
        title="Theme"
        subtitle="Classic and Dragon are both free — your choice follows you across the Realm"
        icon={<Palette className="h-4 w-4" />}
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] items-center gap-5">
          <div className="min-w-0">
            <ThemeChoiceCards
              theme={s.theme}
              realm={realm}
              subscription={subscription}
              onSelectTheme={onSelectTheme}
            />
            <div className="mt-4">
              <FieldLabel tokens={t} hint={t.isDragon ? r.name : "Tap to equip"}>
                Dragon realm
              </FieldLabel>
              <RealmPicker
                theme={s.theme}
                realm={realm}
                subscription={subscription}
                onSelectRealm={onSelectRealm}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div inert className="pointer-events-none">
              <Board
                board={PREVIEW_BOARD}
                boardSize={3}
                boardSizePx={196}
                currentPlayer="X"
                theme={s.theme}
                realm={realm}
                winResult={null}
                lastMoveIndex={4}
                hintIndex={null}
                nextVanishIndex={null}
                disabled={true}
                onCellClick={() => {}}
                showCoordinates={s.showCoordinates}
                highlightLastMove={s.highlightLastMove}
              />
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${t.textMuted}`}>
              <Eye className="h-3 w-3" /> Live preview
            </span>
          </div>
        </div>
      </Panel>

      <Panel
        tokens={t}
        title="Board Display"
        subtitle="What appears on the cells"
        icon={<Eye className="h-4 w-4" />}
      >
        <SettingGroup tokens={t}>
          <SettingRow
            tokens={t}
            icon={<Hash className="h-4 w-4" />}
            title="Cell coordinates"
            description="Show A1-style labels on empty cells"
            control={
              <Toggle
                tokens={t}
                label="Cell coordinates"
                checked={s.showCoordinates}
                onChange={(v) => onUpdate("showCoordinates", v)}
              />
            }
          />
          <SettingRow
            tokens={t}
            icon={<Crosshair className="h-4 w-4" />}
            title="Highlight last move"
            description="Mark the most recent move with a glowing dot"
            control={
              <Toggle
                tokens={t}
                label="Highlight last move"
                checked={s.highlightLastMove}
                onChange={(v) => onUpdate("highlightLastMove", v)}
              />
            }
          />
        </SettingGroup>
      </Panel>

      <Panel
        tokens={t}
        title="Motion & Effects"
        subtitle="Animations and celebrations"
        icon={<Sparkles className="h-4 w-4" />}
      >
        <SettingGroup tokens={t}>
          <SettingRow
            tokens={t}
            icon={<Zap className="h-4 w-4" />}
            title="Animations"
            description="Piece pops, glows, embers and screen transitions"
            control={
              <Toggle
                tokens={t}
                label="Animations"
                checked={s.animations}
                onChange={(v) => onUpdate("animations", v)}
              />
            }
          />
          <SettingRow
            tokens={t}
            icon={<PartyPopper className="h-4 w-4" />}
            title="Victory confetti"
            description="Celebrate wins on the result card"
            control={
              <Toggle
                tokens={t}
                label="Victory confetti"
                checked={s.confetti}
                onChange={(v) => onUpdate("confetti", v)}
              />
            }
          />
        </SettingGroup>
      </Panel>
    </>
  );

  /* ---------------- Sound & assists ---------------- */
  const audio = (
    <>
      <Panel
        tokens={t}
        title="Sound"
        subtitle="Effects for moves, wins and unlocks"
        icon={<Volume2 className="h-4 w-4" />}
      >
        <SettingGroup tokens={t}>
          <SettingRow
            tokens={t}
            icon={
              s.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />
            }
            title="Sound effects"
            description="Also available from the speaker button in the header"
            control={
              <Toggle
                tokens={t}
                label="Sound effects"
                checked={s.soundEnabled}
                onChange={(v) => onUpdate("soundEnabled", v)}
              />
            }
          />
          <SettingRow
            tokens={t}
            layout="wide"
            title="Volume"
            description={s.soundEnabled ? `${s.volume}%` : "Turn sound effects on to adjust"}
            control={
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={s.volume}
                  disabled={!s.soundEnabled}
                  aria-label="Volume"
                  onChange={(e) => onUpdate("volume", Number(e.target.value))}
                  onPointerUp={onPreviewSound}
                  onKeyUp={(e) => {
                    if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") {
                      onPreviewSound();
                    }
                  }}
                  style={{ accentColor: t.xColor }}
                  className="h-2 min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={onPreviewSound}
                  disabled={!s.soundEnabled}
                  className={`h-8 shrink-0 rounded-lg px-2.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${t.secondaryBtn}`}
                >
                  Test
                </button>
              </div>
            }
          />
        </SettingGroup>
      </Panel>

      <Panel
        tokens={t}
        title="Assists"
        subtitle="Optional helpers during a match"
        icon={<Lightbulb className="h-4 w-4" />}
      >
        <SettingGroup tokens={t}>
          <SettingRow
            tokens={t}
            icon={<Lightbulb className="h-4 w-4" />}
            title="Hint button"
            description="Reveal the best move when you're stuck"
            control={
              <Toggle
                tokens={t}
                label="Hint button"
                checked={s.hintsEnabled}
                onChange={(v) => onUpdate("hintsEnabled", v)}
              />
            }
          />
          <SettingRow
            tokens={t}
            icon={<Undo2 className="h-4 w-4" />}
            title="Allow undo"
            description="Take back your last turn during a round"
            control={
              <Toggle
                tokens={t}
                label="Allow undo"
                checked={s.undoEnabled}
                onChange={(v) => onUpdate("undoEnabled", v)}
              />
            }
          />
        </SettingGroup>
      </Panel>
    </>
  );

  /* ---------------- Pass & data ---------------- */
  const data = (
    <>
      <Panel
        tokens={t}
        title="Career Stats"
        subtitle={`${scores.totalMatches} round${scores.totalMatches === 1 ? "" : "s"} recorded`}
        icon={<Trophy className="h-4 w-4" />}
        action={
          <ConfirmButton
            tokens={t}
            label="Reset"
            confirmLabel="Confirm reset"
            onConfirm={onResetScores}
          />
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "X wins", value: scores.X },
            { label: "Draws", value: scores.draws },
            { label: "O wins", value: scores.O },
            { label: "Best run", value: scores.bestStreak },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl px-1.5 py-2.5 text-center ${t.inset}`}>
              <div className={`font-tabular text-lg font-extrabold leading-none ${t.textStrong}`}>
                {stat.value}
              </div>
              <div
                className={`mt-1 truncate text-[10px] font-semibold uppercase tracking-wider ${t.textMuted}`}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3.5">
          <OutcomeBar scores={scores} theme={s.theme} realm={realm} />
        </div>
      </Panel>

      <Panel
        tokens={t}
        title="Saved Settings"
        subtitle="Stored on this device"
        icon={<Database className="h-4 w-4" />}
      >
        <SettingGroup tokens={t}>
          <SettingRow
            tokens={t}
            title="Restore defaults"
            description="Reset rules, names, theme, sound and assists to their original values."
            control={
              <ConfirmButton
                tokens={t}
                label="Restore"
                confirmLabel="Tap to confirm"
                onConfirm={onRestoreDefaults}
              />
            }
          />
        </SettingGroup>
        <p className={`mt-4 flex items-start gap-2 text-[11.5px] leading-snug ${t.textMuted}`}>
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          Every change is saved automatically in this browser and restored the next time you
          open the game.
        </p>
      </Panel>
    </>
  );

  const content: Record<SettingsTab, React.ReactNode> = {
    gameplay,
    players,
    appearance,
    audio,
    data,
  };

  return (
    <div className="@container mx-auto w-full max-w-[min(96vw,1180px)] py-[clamp(0.25rem,1.5dvh,1rem)]">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-up">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to menu"
            title="Back to menu"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${t.secondaryBtn}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1
              className={`text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-tight tracking-tight ${t.textStrong} ${t.displayFont}`}
            >
              Settings
            </h1>
            <p className={`text-xs sm:text-sm ${t.textMuted}`}>
              Customize your game — every change is saved automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            aria-live="polite"
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all duration-300 ${
              justSaved
                ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/30"
                : t.chip
            }`}
          >
            {justSaved ? <Check className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {justSaved ? "Saved" : "Auto-save on"}
          </span>
          <button
            type="button"
            onClick={onPlay}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${t.primaryBtn}`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {hasMatchInProgress ? "Resume" : "Play"}
          </button>
        </div>
      </div>

      {/* Tabs + content: sidebar when the page is wide, scrollable tab bar when narrow */}
      <div className="mt-5 grid items-start gap-5 @4xl:grid-cols-[240px_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className={`thin-scroll flex gap-1 overflow-x-auto rounded-2xl p-1.5 @4xl:sticky @4xl:top-[84px] @4xl:flex-col @4xl:overflow-visible ${t.panel}`}
        >
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onTabChange(item.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 @4xl:py-2.5 ${t.ring} ${
                  active ? tabActive : tabIdle
                }`}
              >
                <span className={`shrink-0 ${active ? t.accentText : ""}`}>{item.icon}</span>
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-xs font-semibold @4xl:text-[13px]">
                    {item.label}
                  </span>
                  <span className="hidden truncate text-[10.5px] opacity-75 @4xl:block">
                    {item.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div key={tab} className="flex min-w-0 flex-col gap-4 animate-fade-up">
          {content[tab]}
        </div>
      </div>
    </div>
  );
};
