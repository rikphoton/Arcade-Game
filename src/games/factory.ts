import { ArcadeGameInstance, GameId } from '../types/game';
import { CyberSurvivorsGame } from './CyberSurvivorsGame';
import { NeonDashGame } from './NeonDashGame';
import { QuantumBreakerGame } from './QuantumBreakerGame';
import { AstroPulseGame } from './AstroPulseGame';
import { NeonDriftGame } from './NeonDriftGame';
import { HexaTronGame } from './HexaTronGame';
import { CyberPacmanGame } from './CyberPacmanGame';
import { CyberPinballGame } from './CyberPinballGame';
import { VoxelTankSiegeGame } from './VoxelTankSiegeGame';
import { SynthBladeGame } from './SynthBladeGame';
import { LaserMatrixGame } from './LaserMatrixGame';

export function createGameInstance(id: GameId): ArcadeGameInstance {
  switch (id) {
    case 'cyber-survivors':
      return new CyberSurvivorsGame();
    case 'neon-dash':
      return new NeonDashGame();
    case 'quantum-breaker':
      return new QuantumBreakerGame();
    case 'astro-pulse':
      return new AstroPulseGame();
    case 'neon-drift':
      return new NeonDriftGame();
    case 'hexa-tron':
      return new HexaTronGame();
    case 'cyber-pacman':
      return new CyberPacmanGame();
    case 'cyber-pinball':
      return new CyberPinballGame();
    case 'voxel-tank-siege':
      return new VoxelTankSiegeGame();
    case 'synth-blade':
      return new SynthBladeGame();
    case 'laser-matrix':
      return new LaserMatrixGame();
    default:
      return new CyberSurvivorsGame();
  }
}
