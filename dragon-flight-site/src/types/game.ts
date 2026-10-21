export type PageState = 'intro' | 'game';

export type ThemeMode = 'dark' | 'light';

export type SkinId = 'crimson' | 'emerald' | 'azure' | 'void';

export interface DragonSkin {
  id: SkinId;
  name: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  eyeColor: string;
  hornColor: string;
  flameColors: [string, string, string];
  unlockedByDefault: boolean;
  requiredScore: number;
}

export interface RealmConfig {
  id: number;
  name: string;
  bgGradient: [string, string, string];
  obstacleType: 'volcanic' | 'crystal' | 'storm' | 'void' | 'temple';
  particleType: 'ember' | 'crystal' | 'spark' | 'void' | 'leaf';
  accentColor: string;
}

export interface Gate {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
  item?: {
    type: 'shield' | 'star' | 'slow';
    y: number;
    collected: boolean;
  };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Physics {
  dragonY: number;
  velocity: number;
  gates: Gate[];
  particles: Particle[];
  score: number;
  status: 'ready' | 'playing' | 'paused' | 'over';
  lastSpawn: number;
  flame: number;
  hasShield: boolean;
  slowTimer: number;
  currentRealmIndex: number;
  realmTransitionProgress: number;
  nextRealmChange: number;
}

export interface GameSettings {
  gravity: number;
  flapVelocity: number;
  gateSpeed: number;
  gateGap: number;
  gateInterval: number;
}
