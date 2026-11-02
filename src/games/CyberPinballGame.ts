import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Bumper {
  x: number;
  y: number;
  radius: number;
  points: number;
  color: string;
  hitPulse: number;
}

export class CyberPinballGame implements ArcadeGameInstance {
  public id: GameId = 'cyber-pinball';
  private width = 600;
  private height = 750;

  private balls: Ball[] = [];
  private bumpers: Bumper[] = [];
  private dropTargets: { letter: string; hit: boolean; x: number; y: number }[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  // Flippers
  private leftFlipperAngle = 0.4;
  private rightFlipperAngle = -0.4;
  private flipperLength = 70;
  private leftPivot = { x: 220, y: 660 };
  private rightPivot = { x: 380, y: 660 };

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private multiplier = 1;
  private ballsRemaining = 3;
  private maxBalls = 3;
  private isGameOver = false;

  private multiballActive = false;
  private plungerPower = 0;
  private isPlunging = false;

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
    this.maxBalls = 3 + (this.upgrades?.maxHealthLevel - 1);
    this.ballsRemaining = this.maxBalls;
    this.isGameOver = false;
    this.multiballActive = false;

    this.leftPivot = { x: this.width * 0.35, y: this.height - 90 };
    this.rightPivot = { x: this.width * 0.65, y: this.height - 90 };

    this.bumpers = [
      { x: this.width * 0.35, y: this.height * 0.28, radius: 26, points: 150, color: '#ec4899', hitPulse: 0 },
      { x: this.width * 0.65, y: this.height * 0.28, radius: 26, points: 150, color: '#06b6d4', hitPulse: 0 },
      { x: this.width * 0.5, y: this.height * 0.42, radius: 30, points: 300, color: '#f59e0b', hitPulse: 0 },
    ];

    const letters = ['C', 'Y', 'B', 'E', 'R'];
    const startX = this.width * 0.25;
    const spacing = 36;
    this.dropTargets = letters.map((letter, i) => ({
      letter,
      hit: false,
      x: startX + i * spacing,
      y: this.height * 0.16,
    }));

    this.particles = [];
    this.spawnBall();
  }

  private spawnBall() {
    this.balls = [
      {
        x: this.width - 32,
        y: this.height - 120,
        vx: 0,
        vy: 0,
        radius: 8,
      },
    ];
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.leftPivot = { x: width * 0.35, y: height - 90 };
    this.rightPivot = { x: width * 0.65, y: height - 90 };
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.balls = [];
    this.bumpers = [];
    this.dropTargets = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: this.ballsRemaining,
      maxLives: this.maxBalls,
      creditsEarned: this.creditsEarned,
      multiplier: this.multiplier,
      level: this.multiballActive ? 2 : 1,
      isGameOver: this.isGameOver,
      customStatLabel: this.multiballActive ? 'MULTIBALL' : 'BALLS',
      customStatValue: this.multiballActive ? '3X FRENZY' : `${this.ballsRemaining} LEFT`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    // Flipper inputs
    const leftActive = input.moveX < -0.3 || input.action1;
    const rightActive = input.moveX > 0.3 || input.action2;

    const targetLeft = leftActive ? -0.55 : 0.4;
    const targetRight = rightActive ? 0.55 : -0.4;

    this.leftFlipperAngle += (targetLeft - this.leftFlipperAngle) * 25 * dt;
    this.rightFlipperAngle += (targetRight - this.rightFlipperAngle) * 25 * dt;

    if (leftActive && Math.abs(this.leftFlipperAngle - targetLeft) > 0.1) {
      sound.playFlipper();
    }

    // Plunger charging
    if (input.special || input.moveY > 0.4) {
      this.isPlunging = true;
      this.plungerPower = Math.min(100, this.plungerPower + 220 * dt);
    } else if (this.isPlunging) {
      this.isPlunging = false;
      // Launch ball in shooter lane
      for (const b of this.balls) {
        if (b.x > this.width - 50 && b.y > this.height - 200) {
          b.vy = -Math.max(450, this.plungerPower * 9);
          sound.playShoot();
        }
      }
      this.plungerPower = 0;
    }

    // Update Bumpers hit animation
    for (const bm of this.bumpers) {
      if (bm.hitPulse > 0) bm.hitPulse -= dt * 4;
    }

    // Update Balls physics
    const gravity = 800;

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.vy += gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Table outer wall reflections
      const leftWall = 20;
      const rightWall = this.width - 20;
      const topWall = 30;

      // Top curved arch
      if (b.y < topWall + b.radius) {
        b.y = topWall + b.radius;
        b.vy = Math.abs(b.vy) * 0.75;
        b.vx += (Math.random() - 0.5) * 80;
        sound.playLaserHit();
      }
      if (b.x < leftWall + b.radius) {
        b.x = leftWall + b.radius;
        b.vx = Math.abs(b.vx) * 0.75;
        sound.playLaserHit();
      }
      if (b.x > rightWall - b.radius) {
        b.x = rightWall - b.radius;
        b.vx = -Math.abs(b.vx) * 0.75;
        sound.playLaserHit();
      }

      // Bumpers collision
      for (const bm of this.bumpers) {
        const dist = Math.hypot(b.x - bm.x, b.y - bm.y);
        if (dist < b.radius + bm.radius) {
          bm.hitPulse = 1;
          const nx = (b.x - bm.x) / dist;
          const ny = (b.y - bm.y) / dist;
          const impulse = 520;
          b.vx = nx * impulse;
          b.vy = ny * impulse;

          this.score += bm.points * this.multiplier;
          sound.playCombo(this.multiplier);
          this.addParticles(bm.x, bm.y, bm.color, 12);
        }
      }

      // Drop targets collision
      for (const t of this.dropTargets) {
        if (!t.hit && Math.hypot(b.x - t.x, b.y - t.y) < 18) {
          t.hit = true;
          b.vy = -b.vy * 0.7;
          this.score += 500 * this.multiplier;
          sound.playHit();
          this.addParticles(t.x, t.y, '#f59e0b', 8);

          // Check if all CYBER targets down
          if (this.dropTargets.every((target) => target.hit)) {
            this.triggerMultiball();
          }
        }
      }

      // Flipper collisions
      this.resolveFlipperCollision(b, this.leftPivot, this.flipperLength, this.leftFlipperAngle, true);
      this.resolveFlipperCollision(b, this.rightPivot, this.flipperLength, this.rightFlipperAngle, false);

      // Ball drain
      if (b.y > this.height + 40) {
        this.balls.splice(i, 1);
      }
    }

    // Check if ball drained
    if (this.balls.length === 0) {
      this.ballsRemaining--;
      this.multiballActive = false;
      sound.playGameOver();

      if (this.ballsRemaining <= 0) {
        this.isGameOver = true;
      } else {
        this.spawnBall();
      }
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

  private resolveFlipperCollision(
    ball: Ball,
    pivot: { x: number; y: number },
    len: number,
    angle: number,
    isLeft: boolean
  ) {
    const tipX = pivot.x + Math.cos(angle) * (isLeft ? len : -len);
    const tipY = pivot.y + Math.sin(angle) * len;

    // Segment distance
    const dx = tipX - pivot.x;
    const dy = tipY - pivot.y;
    const l2 = dx * dx + dy * dy;
    let t = ((ball.x - pivot.x) * dx + (ball.y - pivot.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = pivot.x + t * dx;
    const projY = pivot.y + t * dy;
    const dist = Math.hypot(ball.x - projX, ball.y - projY);

    if (dist < ball.radius + 8) {
      const nx = -(tipY - pivot.y);
      const ny = tipX - pivot.x;
      const nlen = Math.hypot(nx, ny);
      const unx = (nx / nlen) * (isLeft ? -1 : 1);
      const uny = (ny / nlen) * (isLeft ? -1 : 1);

      ball.vx = unx * 580;
      ball.vy = uny * 580;
      sound.playFlipper();
      this.addParticles(projX, projY, '#ec4899', 6);
    }
  }

  private triggerMultiball() {
    this.multiballActive = true;
    this.multiplier = 3;
    sound.playPowerup();
    const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
    this.creditsEarned += Math.ceil(30 * creditBonus);

    // Spawn 2 extra balls
    this.balls.push(
      { x: this.width * 0.45, y: this.height * 0.35, vx: -180, vy: -300, radius: 8 },
      { x: this.width * 0.55, y: this.height * 0.35, vx: 180, vy: -300, radius: 8 }
    );

    // Reset drop targets
    this.dropTargets.forEach((t) => (t.hit = false));
  }

  private addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.35,
        color,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Playfield table
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.width, this.height);

    // Outer neon rim
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;
    ctx.strokeRect(16, 20, this.width - 32, this.height - 40);

    // Shooter lane divider
    ctx.beginPath();
    ctx.moveTo(this.width - 48, 120);
    ctx.lineTo(this.width - 48, this.height - 20);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Bumpers
    for (const bm of this.bumpers) {
      ctx.fillStyle = bm.color;
      ctx.shadowColor = bm.color;
      ctx.shadowBlur = 14 + bm.hitPulse * 16;
      ctx.beginPath();
      ctx.arc(bm.x, bm.y, bm.radius + bm.hitPulse * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bm.x, bm.y, bm.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw Drop Targets
    for (const t of this.dropTargets) {
      ctx.fillStyle = t.hit ? '#334155' : '#f59e0b';
      ctx.shadowColor = t.hit ? 'transparent' : '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fillRect(t.x - 12, t.y - 12, 24, 24);

      ctx.fillStyle = t.hit ? '#64748b' : '#000000';
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.letter, t.x, t.y);
    }
    ctx.shadowBlur = 0;

    // Draw Flippers
    this.renderFlipper(ctx, this.leftPivot, this.flipperLength, this.leftFlipperAngle, true);
    this.renderFlipper(ctx, this.rightPivot, this.flipperLength, this.rightFlipperAngle, false);

    // Draw Balls
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#ec4899';
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
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }

  private renderFlipper(
    ctx: CanvasRenderingContext2D,
    pivot: { x: number; y: number },
    len: number,
    angle: number,
    isLeft: boolean
  ) {
    const tipX = pivot.x + Math.cos(angle) * (isLeft ? len : -len);
    const tipY = pivot.y + Math.sin(angle) * len;

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.lineCap = 'butt';
  }
}
