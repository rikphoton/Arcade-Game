import { CabinetSkin, CabinetSkinId, GameId, PlayerProfile, TechTreeState } from '../types/game';

const STORAGE_KEY = 'neon_pulse_arcade_profile_v2';

export const CABINET_SKINS: CabinetSkin[] = [
  {
    id: 'cyber-classic',
    name: 'Cyber Classic',
    description: 'Electric cyan and neon magenta gloss with vibrant underglow',
    price: 0,
    marqueeBg: '#090d16',
    chassisColor: '#0f172a',
    accentGlow: '#06b6d4',
    screenTint: '#06b6d4',
  },
  {
    id: 'matrix-green',
    name: 'Matrix Terminal',
    description: 'Retro phosphor green digital rain styling and CRT scanlines',
    price: 250,
    marqueeBg: '#051b11',
    chassisColor: '#062013',
    accentGlow: '#10b981',
    screenTint: '#10b981',
  },
  {
    id: 'outrun-sunset',
    name: 'Outrun Sunset',
    description: 'Blazing sunset amber and hot magenta synthwave vector chassis',
    price: 500,
    marqueeBg: '#2a0a1a',
    chassisColor: '#280c1e',
    accentGlow: '#f59e0b',
    screenTint: '#ec4899',
  },
  {
    id: 'monolith-chrome',
    name: 'Monolith Chrome',
    description: 'Sleek brushed aerospace titanium with prismatic laser piping',
    price: 1000,
    marqueeBg: '#18181b',
    chassisColor: '#27272a',
    accentGlow: '#a855f7',
    screenTint: '#c084fc',
  },
];

const INITIAL_PROFILE: PlayerProfile = {
  neonCredits: 100, // Starter credits
  unlockedSkins: ['cyber-classic'],
  activeSkin: 'cyber-classic',
  crtFilterEnabled: true,
  soundEnabled: true,
  soundVolume: 0.7,
  musicVolume: 0.35,
  techTree: {
    maxHealthLevel: 1,
    speedBoostLevel: 1,
    creditMultiplierLevel: 1,
    empCooldownLevel: 1,
  },
  gameStats: {
    'cyber-survivors': { highScore: 4200, masteryXp: 350, masteryLevel: 2, gamesPlayed: 3 },
    'neon-dash': { highScore: 3800, masteryXp: 280, masteryLevel: 1, gamesPlayed: 2 },
    'quantum-breaker': { highScore: 5600, masteryXp: 450, masteryLevel: 2, gamesPlayed: 4 },
    'astro-pulse': { highScore: 7100, masteryXp: 620, masteryLevel: 3, gamesPlayed: 5 },
    'neon-drift': { highScore: 6400, masteryXp: 500, masteryLevel: 2, gamesPlayed: 3 },
    'hexa-tron': { highScore: 3200, masteryXp: 210, masteryLevel: 1, gamesPlayed: 2 },
    'cyber-pacman': { highScore: 4900, masteryXp: 390, masteryLevel: 2, gamesPlayed: 3 },
    'cyber-pinball': { highScore: 8500, masteryXp: 550, masteryLevel: 2, gamesPlayed: 4 },
    'voxel-tank-siege': { highScore: 5200, masteryXp: 310, masteryLevel: 1, gamesPlayed: 2 },
    'synth-blade': { highScore: 9400, masteryXp: 720, masteryLevel: 3, gamesPlayed: 4 },
    'laser-matrix': { highScore: 3000, masteryXp: 200, masteryLevel: 1, gamesPlayed: 2 },
  },
  gauntletRecord: {
    maxStagesCleared: 6,
    bestComboStreak: 18,
  },
};

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_PROFILE,
      ...parsed,
      techTree: { ...INITIAL_PROFILE.techTree, ...(parsed.techTree || {}) },
      gameStats: { ...INITIAL_PROFILE.gameStats, ...(parsed.gameStats || {}) },
      gauntletRecord: { ...INITIAL_PROFILE.gauntletRecord, ...(parsed.gauntletRecord || {}) },
    };
  } catch {
    return INITIAL_PROFILE;
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save player profile:', err);
  }
}

export const TECH_TREE_CONFIG: Record<
  keyof TechTreeState,
  {
    name: string;
    description: string;
    maxLevel: number;
    baseCost: number;
    costMultiplier: number;
    formatEffect: (level: number) => string;
  }
> = {
  maxHealthLevel: {
    name: 'Reinforced Hull & Shields',
    description: 'Increases starting player lives and shield integrity across all games',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 1.8,
    formatEffect: (lvl) => `+${lvl - 1} Extra Starting Shield / Life`,
  },
  speedBoostLevel: {
    name: 'Overclocked Thrusters',
    description: 'Boosts movement agility, dash speed, and responsiveness',
    maxLevel: 5,
    baseCost: 120,
    costMultiplier: 1.7,
    formatEffect: (lvl) => `+${(lvl - 1) * 8}% Acceleration & Maneuverability`,
  },
  creditMultiplierLevel: {
    name: 'Crypto Extraction Node',
    description: 'Amplifies Neon Credits earned from destroying enemies and combos',
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 2.0,
    formatEffect: (lvl) => `+${(lvl - 1) * 25}% Bonus Neon Credits Harvested`,
  },
  empCooldownLevel: {
    name: 'Super Nova Capacitor',
    description: 'Reduces EMP and special ability recharge cooldowns',
    maxLevel: 5,
    baseCost: 180,
    costMultiplier: 1.75,
    formatEffect: (lvl) => `-${(lvl - 1) * 15}% Special Ability Recharge Time`,
  },
};
