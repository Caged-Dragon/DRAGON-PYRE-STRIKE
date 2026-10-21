export type AppScreen = "menu" | "arena" | "settings";

export type SettingsTab = "gameplay" | "players" | "appearance" | "audio" | "data";

export type ThemeId = "classic" | "dragon";

export type DragonRealmId = "inferno" | "jade" | "frost" | "void";

export type Player = "X" | "O";

export type CellValue = Player | null;

export type BoardSize = 3 | 4 | 5;

export type GameMode = "pvp" | "ai";

export type GameVariant = "standard" | "infinite";

export type TurnTimerOption = 0 | 5 | 10 | 20;

export type AIDifficulty = "casual" | "tactical" | "unbeatable";

export type SubscriptionPlan = "monthly" | "annual" | "lifetime";

export type PaymentMethod = "card" | "wallet";

export type ViewportLayoutMode = "portrait" | "split" | "command";

/** Every user preference that is remembered between visits. */
export interface GameSettings {
  // Gameplay
  gameMode: GameMode;
  humanSide: Player;
  aiDifficulty: AIDifficulty;
  boardSize: BoardSize;
  variant: GameVariant;
  turnTimer: TurnTimerOption;
  // Players
  playerNames: { X: string; O: string };
  alternateStarter: boolean;
  // Appearance
  theme: ThemeId;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  animations: boolean;
  confetti: boolean;
  // Sound & assists
  soundEnabled: boolean;
  volume: number;
  hintsEnabled: boolean;
  undoEnabled: boolean;
}

export interface SubscriptionState {
  isSubscribed: boolean;
  plan: SubscriptionPlan;
  trialMatchesRemaining: number;
  trialUsedOnce: boolean;
  selectedRealm: DragonRealmId;
  activatedAt: string | null;
  transactionId: string | null;
  paymentMethod: PaymentMethod | null;
  amountPaid: string | null;
}

export interface ScoreBoard {
  X: number;
  O: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  streakHolder: Player | null;
  totalMatches: number;
}

export interface MoveRecord {
  step: number;
  player: Player;
  index: number;
  coord: string;
  vanishedIndex: number | null;
}

export interface GameSnapshot {
  board: CellValue[];
  currentPlayer: Player;
  xQueue: number[];
  oQueue: number[];
  moves: MoveRecord[];
}

export interface WinResult {
  winner: Player | "draw";
  line: number[] | null;
  reason?: "line" | "draw" | "timeout";
}
