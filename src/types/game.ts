/**
 * Game and Player types for Neon Pulse Arcade
 */

export type GameId =
  | 'cyber-survivors'
  | 'neon-dash'
  | 'quantum-breaker'
  | 'astro-pulse'
  | 'neon-drift'
  | 'hexa-tron'
  | 'cyber-pacman'
  | 'cyber-pinball'
  | 'voxel-tank-siege'
  | 'synth-blade'
  | 'laser-matrix';

export interface GameDefinition {
  id: GameId;
  title: string;
  genre: string;
  tagline: string;
  description: string;
  color: string;
  accentColor: string;
  isNew?: boolean;
  controlsDescription: {
    keyboard: string;
    touch: string;
  };
  features: string[];
}

export interface InputState {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  action1: boolean; // Primary: Fire, Jump, Flip, Launch, Left Flipper
  action2: boolean; // Secondary: Boost, Drift, Nitro, Right Flipper
  special: boolean; // EMP, Nova, Bomb
  aimAngle?: number;
  canvasClick?: { x: number; y: number } | null;
}

export interface GameRuntimeState {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  creditsEarned: number;
  multiplier: number;
  level: number;
  isGameOver: boolean;
  isVictory?: boolean;
  isBossWave?: boolean;
  bossHealthPercent?: number;
  customStatLabel?: string;
  customStatValue?: string | number;
}

export interface ArcadeGameInstance {
  id: GameId;
  init: (canvas: HTMLCanvasElement, width: number, height: number, upgrades: TechTreeState) => void;
  update: (dt: number, input: InputState) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
  resize: (width: number, height: number) => void;
  destroy: () => void;
  pause: () => void;
  resume: () => void;
  getState: () => GameRuntimeState;
  restart: () => void;
}

export interface TechTreeState {
  maxHealthLevel: number;
  speedBoostLevel: number;
  creditMultiplierLevel: number;
  empCooldownLevel: number;
}

export type CabinetSkinId = 'cyber-classic' | 'matrix-green' | 'outrun-sunset' | 'monolith-chrome';

export interface CabinetSkin {
  id: CabinetSkinId;
  name: string;
  description: string;
  price: number;
  marqueeBg: string;
  chassisColor: string;
  accentGlow: string;
  screenTint: string;
}

export interface PlayerProfile {
  neonCredits: number;
  unlockedSkins: CabinetSkinId[];
  activeSkin: CabinetSkinId;
  crtFilterEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  techTree: TechTreeState;
  gameStats: Record<
    GameId,
    {
      highScore: number;
      masteryXp: number;
      masteryLevel: number;
      gamesPlayed: number;
    }
  >;
  gauntletRecord: {
    maxStagesCleared: number;
    bestComboStreak: number;
  };
}

export interface BossRushMutators {
  speedFrenzy: boolean;
  bulletHell: boolean;
  glassCannon: boolean;
}
