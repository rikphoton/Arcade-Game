import { DailyBounty, DailyBountyState, GameId, PlayerProfile } from '../types/game';
import { ARCADE_GAMES } from '../games/registry';

export const GRAND_BONUS_REWARD = 500;

interface BountyTemplate {
  id: string;
  gameId?: GameId;
  title: string;
  description: string;
  target: number;
  rewardCredits: number;
  unit: string;
  match: (b: DailyBounty, event: GameEvent) => number;
}

export interface GameEvent {
  gameId: GameId;
  score?: number;
  combo?: number;
  stage?: number;
  empUsed?: boolean;
  gameCompleted?: boolean;
}

const BOUNTY_TEMPLATES: BountyTemplate[] = [
  {
    id: 'pinball-frenzy',
    gameId: 'cyber-pinball',
    title: 'Flipper Wizard',
    description: 'Score 7,500 points on the Cyber Pinball table',
    target: 7500,
    rewardCredits: 250,
    unit: 'PTS',
    match: (b, e) => (e.gameId === 'cyber-pinball' && e.score ? Math.max(b.current, e.score) : b.current),
  },
  {
    id: 'synth-rhythm',
    gameId: 'synth-blade',
    title: 'Synth Rhythm Maestro',
    description: 'Achieve a 20-note combo streak in Synth Blade',
    target: 20,
    rewardCredits: 300,
    unit: 'STREAK',
    match: (b, e) => (e.gameId === 'synth-blade' && e.combo ? Math.max(b.current, e.combo) : b.current),
  },
  {
    id: 'tank-assault',
    gameId: 'voxel-tank-siege',
    title: 'Armored Breaker',
    description: 'Reach Wave 3 in Voxel Tank Siege arena',
    target: 3,
    rewardCredits: 250,
    unit: 'WAVE',
    match: (b, e) => (e.gameId === 'voxel-tank-siege' && e.stage ? Math.max(b.current, e.stage) : b.current),
  },
  {
    id: 'laser-puzzle',
    gameId: 'laser-matrix',
    title: 'Quantum Optician',
    description: 'Power up all quantum cores to clear Stage 2 in Laser Matrix',
    target: 2,
    rewardCredits: 200,
    unit: 'STAGE',
    match: (b, e) => (e.gameId === 'laser-matrix' && e.stage ? Math.max(b.current, e.stage) : b.current),
  },
  {
    id: 'survivor-overclock',
    gameId: 'cyber-survivors',
    title: 'Swarm Purge',
    description: 'Rack up 6,000 points destroying cyber drones in Cyber Survivors',
    target: 6000,
    rewardCredits: 250,
    unit: 'PTS',
    match: (b, e) => (e.gameId === 'cyber-survivors' && e.score ? Math.max(b.current, e.score) : b.current),
  },
  {
    id: 'dash-velocity',
    gameId: 'neon-dash',
    title: 'Supersonic Inversion',
    description: 'Run 600m without wiping out in Neon Dash',
    target: 600,
    rewardCredits: 250,
    unit: 'METERS',
    match: (b, e) => (e.gameId === 'neon-dash' && e.score ? Math.max(b.current, Math.floor(e.score / 5)) : b.current),
  },
  {
    id: 'drift-multiplier',
    gameId: 'neon-drift',
    title: 'High-Speed Nitro Near-Miss',
    description: 'Build a 5x near-miss combo multiplier in Neon Drift',
    target: 5,
    rewardCredits: 220,
    unit: 'MULTIPLIER',
    match: (b, e) => (e.gameId === 'neon-drift' && e.combo ? Math.max(b.current, e.combo) : b.current),
  },
  {
    id: 'breaker-mastery',
    gameId: 'quantum-breaker',
    title: 'Core Shatter',
    description: 'Score 5,000 points breaking crystal formations in Quantum Breaker',
    target: 5000,
    rewardCredits: 200,
    unit: 'PTS',
    match: (b, e) => (e.gameId === 'quantum-breaker' && e.score ? Math.max(b.current, e.score) : b.current),
  },
  {
    id: 'pacman-devourer',
    gameId: 'cyber-pacman',
    title: 'Packet Devourer',
    description: 'Collect Overclock Cores & reach 4,500 points in Cyber Pacman',
    target: 4500,
    rewardCredits: 220,
    unit: 'PTS',
    match: (b, e) => (e.gameId === 'cyber-pacman' && e.score ? Math.max(b.current, e.score) : b.current),
  },
  {
    id: 'shmup-mothership',
    gameId: 'astro-pulse',
    title: 'Dreadnought Interceptor',
    description: 'Score 7,000 points against drone fleets in Astro Pulse',
    target: 7000,
    rewardCredits: 260,
    unit: 'PTS',
    match: (b, e) => (e.gameId === 'astro-pulse' && e.score ? Math.max(b.current, e.score) : b.current),
  },
  {
    id: 'arena-veteran',
    title: 'Arcade Hopper',
    description: 'Play at least 3 rounds in any arcade games today',
    target: 3,
    rewardCredits: 200,
    unit: 'ROUNDS',
    match: (b, e) => (e.gameCompleted ? b.current + 1 : b.current),
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export function getTimeUntilNextReset(): string {
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffMs = nextReset.getTime() - now.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Deterministic seed based on date string
function pseudoRandomSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateDailyBounties(dateStr: string): DailyBounty[] {
  const seed = pseudoRandomSeed(dateStr);
  const selected: DailyBounty[] = [];
  const available = [...BOUNTY_TEMPLATES];

  // Pick 3 deterministic bounties
  for (let i = 0; i < 3; i++) {
    const idx = (seed + i * 7) % available.length;
    const template = available.splice(idx, 1)[0];
    selected.push({
      id: `${template.id}-${dateStr}`,
      gameId: template.gameId,
      title: template.title,
      description: template.description,
      target: template.target,
      current: 0,
      rewardCredits: template.rewardCredits,
      isCompleted: false,
      isClaimed: false,
      unit: template.unit,
    });
  }

  return selected;
}

export function syncDailyBounties(profile: PlayerProfile): PlayerProfile {
  const today = getTodayDateString();
  if (!profile.dailyBounties || profile.dailyBounties.date !== today) {
    return {
      ...profile,
      dailyBounties: {
        date: today,
        bounties: generateDailyBounties(today),
        claimedAllBonus: false,
      },
    };
  }
  return profile;
}

export function processGameEventForBounties(
  bounties: DailyBounty[],
  event: GameEvent
): { updatedBounties: DailyBounty[]; newlyCompletedBounties: DailyBounty[] } {
  const newlyCompleted: DailyBounty[] = [];
  const updated = bounties.map((b) => {
    if (b.isCompleted) return b;

    // Find template to match logic
    const template = BOUNTY_TEMPLATES.find((t) => b.id.startsWith(t.id));
    if (!template) return b;

    const newCurrent = Math.min(b.target, template.match(b, event));
    const isNowCompleted = newCurrent >= b.target;

    if (isNowCompleted && !b.isCompleted) {
      newlyCompleted.push({ ...b, current: newCurrent, isCompleted: true });
    }

    return {
      ...b,
      current: newCurrent,
      isCompleted: isNowCompleted,
    };
  });

  return { updatedBounties: updated, newlyCompletedBounties: newlyCompleted };
}
