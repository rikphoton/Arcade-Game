import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Cycle {
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  color: string;
  isAi: boolean;
  alive: boolean;
  speed: number;
  phaseJumpTime: number;
  trail: { x: number; y: number }[];
}

export class HexaTronGame implements ArcadeGameInstance {
  public id: GameId = 'hexa-tron';
  private width = 800;
  private height = 600;

  private cycles: Cycle[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private multiplier = 1;
  private round = 1;
  private isGameOver = false;

  private phaseCooldown = 0;
  private empCharges = 2;
  private upgrades!: TechTreeState;

  public init(canvas: HTMLCanvasElement, width: number, height: number, upgrades: TechTreeState) {
    this.width = width;
    this.height = height;
    this.upgrades = upgrades;
    this.restart();
  }

  public restart() {
    this.score = 0;
    this.creditsEarned = 0;
    this.multiplier = 1;
    this.round = 1;
    this.phaseCooldown = 0;
    this.empCharges = 2 + (this.upgrades?.maxHealthLevel - 1);
    this.isGameOver = false;

    this.particles = [];
    this.initRound();
  }

  private initRound() {
    const baseSpeed = 180 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);

    this.cycles = [
      // Player
      {
        x: 120,
        y: this.height / 2,
        dir: 'RIGHT',
        nextDir: 'RIGHT',
        color: '#10b981',
        isAi: false,
        alive: true,
        speed: baseSpeed,
        phaseJumpTime: 0,
        trail: [],
      },
      // AI 1 (Red / Magenta)
      {
        x: this.width - 120,
        y: this.height / 2,
        dir: 'LEFT',
        nextDir: 'LEFT',
        color: '#f43f5e',
        isAi: true,
        alive: true,
        speed: baseSpeed * 0.95,
        phaseJumpTime: 0,
        trail: [],
      },
      // AI 2 (Cyan)
      {
        x: this.width / 2,
        y: 100,
        dir: 'DOWN',
        nextDir: 'DOWN',
        color: '#06b6d4',
        isAi: true,
        alive: true,
        speed: baseSpeed * 0.95,
        phaseJumpTime: 0,
        trail: [],
      },
      // AI 3 (Amber)
      {
        x: this.width / 2,
        y: this.height - 100,
        dir: 'UP',
        nextDir: 'UP',
        color: '#f59e0b',
        isAi: true,
        alive: true,
        speed: baseSpeed * 0.95,
        phaseJumpTime: 0,
        trail: [],
      },
    ];
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.cycles = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    const player = this.cycles[0];
    const enemiesAlive = this.cycles.filter((c) => c.isAi && c.alive).length;
    return {
      score: this.score,
      highScore: this.highScore,
      lives: player?.alive ? 1 : 0,
      maxLives: 1,
      creditsEarned: this.creditsEarned,
      multiplier: this.multiplier,
      level: this.round,
      isGameOver: this.isGameOver,
      customStatLabel: 'RIVALS',
      customStatValue: `${enemiesAlive} REMAIN`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    const player = this.cycles[0];
    if (player && player.alive) {
      // Direction steering
      if (input.moveX > 0.5 && player.dir !== 'LEFT') player.nextDir = 'RIGHT';
      else if (input.moveX < -0.5 && player.dir !== 'RIGHT') player.nextDir = 'LEFT';
      else if (input.moveY > 0.5 && player.dir !== 'UP') player.nextDir = 'DOWN';
      else if (input.moveY < -0.5 && player.dir !== 'DOWN') player.nextDir = 'UP';

      // Phase Jump ability
      if (this.phaseCooldown > 0) this.phaseCooldown -= dt;
      if (input.action1 && this.phaseCooldown <= 0) {
        player.phaseJumpTime = 1.2;
        this.phaseCooldown = Math.max(2.5, 5 - (this.upgrades?.empCooldownLevel - 1) * 0.6);
        sound.playPowerup();
        this.addParticles(player.x, player.y, '#10b981', 14);
      }

      // EMP trail clearer
      if (input.special && this.empCharges > 0) {
        this.empCharges--;
        sound.playEmp();
        this.clearLocalTrails(player.x, player.y, 160);
      }
    }

    // Update all cycles
    for (const c of this.cycles) {
      if (!c.alive) continue;

      if (c.phaseJumpTime > 0) c.phaseJumpTime -= dt;

      // Update AI directions
      if (c.isAi) {
        this.updateAi(c);
      }

      c.dir = c.nextDir;

      // Add to trail before moving
      c.trail.push({ x: c.x, y: c.y });

      // Move forward
      const moveDist = c.speed * dt;
      if (c.dir === 'RIGHT') c.x += moveDist;
      else if (c.dir === 'LEFT') c.x -= moveDist;
      else if (c.dir === 'DOWN') c.y += moveDist;
      else if (c.dir === 'UP') c.y -= moveDist;

      // Check arena bounds collision
      if (c.x < 10 || c.x > this.width - 10 || c.y < 10 || c.y > this.height - 10) {
        this.killCycle(c);
        continue;
      }

      // Check trail collisions (unless phase jumping)
      if (c.phaseJumpTime <= 0) {
        if (this.checkTrailCollision(c)) {
          this.killCycle(c);
        }
      }
    }

    // Check round victory
    const enemiesAlive = this.cycles.filter((c) => c.isAi && c.alive).length;
    if (enemiesAlive === 0 && player?.alive) {
      this.round++;
      this.score += 2000 * this.multiplier;
      const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
      this.creditsEarned += Math.ceil(20 * creditBonus);
      sound.playPowerup();
      this.initRound();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private updateAi(c: Cycle) {
    // Look ahead 40 pixels
    let lookX = c.x;
    let lookY = c.y;
    const lookDist = 45;
    if (c.dir === 'RIGHT') lookX += lookDist;
    else if (c.dir === 'LEFT') lookX -= lookDist;
    else if (c.dir === 'DOWN') lookY += lookDist;
    else if (c.dir === 'UP') lookY -= lookDist;

    // If danger ahead, turn
    const isDangerous =
      lookX < 20 ||
      lookX > this.width - 20 ||
      lookY < 20 ||
      lookY > this.height - 20 ||
      this.isPointInTrails(lookX, lookY, 15);

    if (isDangerous) {
      const possibleDirs: Direction[] = [];
      if (c.dir === 'LEFT' || c.dir === 'RIGHT') {
        if (!this.isPointInTrails(c.x, c.y - lookDist, 15) && c.y - lookDist > 20) possibleDirs.push('UP');
        if (!this.isPointInTrails(c.x, c.y + lookDist, 15) && c.y + lookDist < this.height - 20) possibleDirs.push('DOWN');
      } else {
        if (!this.isPointInTrails(c.x - lookDist, c.y, 15) && c.x - lookDist > 20) possibleDirs.push('LEFT');
        if (!this.isPointInTrails(c.x + lookDist, c.y, 15) && c.x + lookDist < this.width - 20) possibleDirs.push('RIGHT');
      }

      if (possibleDirs.length > 0) {
        c.nextDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
      }
    }
  }

  private isPointInTrails(x: number, y: number, radius: number): boolean {
    for (const other of this.cycles) {
      for (let i = 0; i < other.trail.length - 8; i++) {
        const pt = other.trail[i];
        if (Math.hypot(pt.x - x, pt.y - y) < radius) return true;
      }
    }
    return false;
  }

  private checkTrailCollision(c: Cycle): boolean {
    for (const other of this.cycles) {
      const limit = other === c ? c.trail.length - 12 : other.trail.length;
      for (let i = 0; i < limit; i++) {
        const pt = other.trail[i];
        if (Math.hypot(pt.x - c.x, pt.y - c.y) < 8) return true;
      }
    }
    return false;
  }

  private clearLocalTrails(x: number, y: number, radius: number) {
    for (const c of this.cycles) {
      c.trail = c.trail.filter((pt) => Math.hypot(pt.x - x, pt.y - y) > radius);
    }
    this.addParticles(x, y, '#06b6d4', 30);
  }

  private killCycle(c: Cycle) {
    c.alive = false;
    sound.playExplosion();
    this.addParticles(c.x, c.y, c.color, 25);

    if (!c.isAi) {
      this.isGameOver = true;
      sound.playGameOver();
    } else {
      this.score += 500 * this.multiplier;
    }
  }

  private addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.4,
        color,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Clear arena
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Neon grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.07)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Arena boundary walls
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.strokeRect(10, 10, this.width - 20, this.height - 20);
    ctx.shadowBlur = 0;

    // Draw Light Trails
    for (const c of this.cycles) {
      if (c.trail.length < 2) continue;
      ctx.strokeStyle = c.color;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(c.trail[0].x, c.trail[0].y);
      for (let i = 1; i < c.trail.length; i++) {
        ctx.lineTo(c.trail[i].x, c.trail[i].y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Draw Cycles
    for (const c of this.cycles) {
      if (!c.alive) continue;
      ctx.save();
      ctx.translate(c.x, c.y);

      // Phase Jump halo
      if (c.phaseJumpTime > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = c.color;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(-6, -6, 12, 12);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -2, 4, 4);

      ctx.restore();
    }

    // Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }
}
