import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  color: string;
  isExplosive?: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export class QuantumBreakerGame implements ArcadeGameInstance {
  public id: GameId = 'quantum-breaker';
  private width = 800;
  private height = 600;

  private paddleX = 350;
  private paddleY = 540;
  private paddleW = 100;
  private paddleH = 14;
  private paddleSpeed = 500;

  private balls: Ball[] = [];
  private bricks: Brick[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private lives = 3;
  private maxLives = 3;
  private multiplier = 1;
  private stage = 1;
  private isGameOver = false;
  private ballAttached = true;
  private laserFireCooldown = 0;

  private upgrades!: TechTreeState;

  public init(canvas: HTMLCanvasElement, width: number, height: number, upgrades: TechTreeState) {
    this.width = width;
    this.height = height;
    this.upgrades = upgrades;
    this.restart();
  }

  public restart() {
    this.paddleW = 100 + (this.upgrades?.speedBoostLevel - 1) * 6;
    this.paddleX = (this.width - this.paddleW) / 2;
    this.paddleY = this.height - 40;
    this.paddleSpeed = 500 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);

    this.score = 0;
    this.creditsEarned = 0;
    this.multiplier = 1;
    this.stage = 1;
    this.maxLives = 3 + (this.upgrades?.maxHealthLevel - 1);
    this.lives = this.maxLives;
    this.isGameOver = false;

    this.particles = [];
    this.resetBall();
    this.buildBricks();
  }

  private resetBall() {
    this.ballAttached = true;
    this.balls = [
      {
        x: this.paddleX + this.paddleW / 2,
        y: this.paddleY - 8,
        vx: 240,
        vy: -320,
        radius: 6,
      },
    ];
  }

  private buildBricks() {
    this.bricks = [];
    const rows = 5;
    const cols = 9;
    const padding = 8;
    const totalW = this.width - 80;
    const brickW = (totalW - (cols - 1) * padding) / cols;
    const brickH = 22;
    const startY = 70;

    const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Pattern variations based on stage
        if (this.stage === 2 && (r + c) % 2 === 0) continue;
        const isExplosive = Math.random() < 0.12;
        this.bricks.push({
          x: 40 + c * (brickW + padding),
          y: startY + r * (brickH + padding),
          w: brickW,
          h: brickH,
          hp: r === 0 ? 2 : 1,
          maxHp: r === 0 ? 2 : 1,
          color: isExplosive ? '#ef4444' : colors[r % colors.length],
          isExplosive,
        });
      }
    }
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.paddleY = height - 40;
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.balls = [];
    this.bricks = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: this.lives,
      maxLives: this.maxLives,
      creditsEarned: this.creditsEarned,
      multiplier: this.multiplier,
      level: this.stage,
      isGameOver: this.isGameOver,
      customStatLabel: 'BALLS',
      customStatValue: this.balls.length,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    // Paddle Movement
    if (input.moveX !== 0) {
      this.paddleX += input.moveX * this.paddleSpeed * dt;
    }
    if (input.canvasClick) {
      this.paddleX = input.canvasClick.x - this.paddleW / 2;
    }

    this.paddleX = Math.max(10, Math.min(this.width - this.paddleW - 10, this.paddleX));

    // Launch ball
    if (this.ballAttached) {
      this.balls[0].x = this.paddleX + this.paddleW / 2;
      this.balls[0].y = this.paddleY - 8;

      if (input.action1 || input.special) {
        this.ballAttached = false;
        sound.playLaserHit();
      }
      return;
    }

    // Laser fire powerup cooldown
    if (this.laserFireCooldown > 0) this.laserFireCooldown -= dt;

    // Update Balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Wall bounce
      if (b.x < b.radius) {
        b.x = b.radius;
        b.vx = Math.abs(b.vx);
        sound.playLaserHit();
      }
      if (b.x > this.width - b.radius) {
        b.x = this.width - b.radius;
        b.vx = -Math.abs(b.vx);
        sound.playLaserHit();
      }
      if (b.y < b.radius) {
        b.y = b.radius;
        b.vy = Math.abs(b.vy);
        sound.playLaserHit();
      }

      // Paddle bounce
      if (
        b.y + b.radius >= this.paddleY &&
        b.y - b.radius <= this.paddleY + this.paddleH &&
        b.x >= this.paddleX &&
        b.x <= this.paddleX + this.paddleW
      ) {
        b.vy = -Math.abs(b.vy);
        // Angle variation based on impact point
        const hitOffset = (b.x - (this.paddleX + this.paddleW / 2)) / (this.paddleW / 2);
        b.vx = hitOffset * 360;
        sound.playFlipper();
        this.multiplier = Math.min(6, this.multiplier + 1);
        this.addParticles(b.x, b.y, '#8b5cf6', 6);
      }

      // Check Brick Collisions
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const br = this.bricks[j];
        if (
          b.x + b.radius > br.x &&
          b.x - b.radius < br.x + br.w &&
          b.y + b.radius > br.y &&
          b.y - b.radius < br.y + br.h
        ) {
          b.vy = -b.vy;
          br.hp--;
          sound.playHit();
          this.addParticles(b.x, b.y, br.color, 8);

          if (br.hp <= 0) {
            this.destroyBrick(j);
          }
          break;
        }
      }

      // Ball fell out of screen bottom
      if (b.y > this.height + 20) {
        this.balls.splice(i, 1);
      }
    }

    // Check if all balls lost
    if (this.balls.length === 0) {
      this.lives--;
      this.multiplier = 1;
      sound.playGameOver();
      if (this.lives <= 0) {
        this.isGameOver = true;
      } else {
        this.resetBall();
      }
    }

    // Check Stage Clear
    if (this.bricks.length === 0) {
      this.stage++;
      this.score += 1000 * this.multiplier;
      sound.playPowerup();
      this.resetBall();
      this.buildBricks();
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private destroyBrick(index: number) {
    const br = this.bricks[index];
    this.bricks.splice(index, 1);
    this.score += 50 * this.multiplier;
    const creditMultiplier = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
    this.creditsEarned += Math.ceil(2 * creditMultiplier);
    sound.playCombo(this.multiplier);

    // Explosive chain reaction
    if (br.isExplosive) {
      sound.playExplosion();
      this.addParticles(br.x + br.w / 2, br.y + br.h / 2, '#ef4444', 20);
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const other = this.bricks[j];
        if (Math.hypot(other.x - br.x, other.y - br.y) < 70) {
          this.destroyBrick(j);
        }
      }
    }
  }

  private addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.3 + Math.random() * 0.2,
        color,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Clear arena
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.width, this.height);

    // Laser Trajectory Guide if ball is attached
    if (this.ballAttached && this.balls.length > 0) {
      const b = this.balls[0];
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.vx * 0.8, b.y + b.vy * 0.8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Bricks
    for (const br of this.bricks) {
      ctx.fillStyle = br.color;
      ctx.shadowColor = br.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(br.x, br.y, br.w, br.h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(br.x + 2, br.y + 2, br.w - 4, 3);
    }
    ctx.shadowBlur = 0;

    // Draw Paddle
    ctx.fillStyle = '#8b5cf6';
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.paddleX, this.paddleY, this.paddleW, this.paddleH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.paddleX + 6, this.paddleY + 2, this.paddleW - 12, 3);
    ctx.shadowBlur = 0;

    // Draw Balls
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 12;
    for (const b of this.balls) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
