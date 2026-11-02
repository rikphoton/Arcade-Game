import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  isCeiling: boolean;
  type: 'spike' | 'gate';
}

interface Star {
  x: number;
  y: number;
  collected: boolean;
}

export class NeonDashGame implements ArcadeGameInstance {
  public id: GameId = 'neon-dash';
  private width = 800;
  private height = 500;

  private playerX = 120;
  private playerY = 380;
  private playerW = 24;
  private playerH = 24;
  private playerVy = 0;
  private isCeiling = false;
  private gravity = 1800;

  private dashDuration = 0;
  private dashCooldown = 0;
  private speed = 360;

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private multiplier = 1;
  private lives = 3;
  private maxLives = 3;
  private isGameOver = false;

  private obstacles: Obstacle[] = [];
  private stars: Star[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  private distanceRun = 0;
  private spawnTimer = 0;

  private corridorTop = 80;
  private corridorBottom = 420;
  private upgrades!: TechTreeState;

  public init(canvas: HTMLCanvasElement, width: number, height: number, upgrades: TechTreeState) {
    this.width = width;
    this.height = height;
    this.upgrades = upgrades;
    this.restart();
  }

  public restart() {
    this.corridorTop = Math.max(50, this.height * 0.15);
    this.corridorBottom = Math.min(this.height - 50, this.height * 0.85);

    this.playerX = 120;
    this.playerY = this.corridorBottom - this.playerH;
    this.playerVy = 0;
    this.isCeiling = false;
    this.speed = 360 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);

    this.dashDuration = 0;
    this.dashCooldown = 0;
    this.score = 0;
    this.creditsEarned = 0;
    this.multiplier = 1;
    this.maxLives = 3 + (this.upgrades?.maxHealthLevel - 1);
    this.lives = this.maxLives;
    this.isGameOver = false;

    this.obstacles = [];
    this.stars = [];
    this.particles = [];
    this.distanceRun = 0;
    this.spawnTimer = 0;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.corridorTop = Math.max(50, height * 0.15);
    this.corridorBottom = Math.min(height - 50, height * 0.85);
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.obstacles = [];
    this.stars = [];
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
      level: Math.floor(this.distanceRun / 500) + 1,
      isGameOver: this.isGameOver,
      customStatLabel: 'DISTANCE',
      customStatValue: `${Math.floor(this.distanceRun)}m`,
    };
  }

  private prevFlipInput = false;
  private prevDashInput = false;

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    // Flip Gravity on input press
    const flipPressed = (input.action1 || input.moveY < -0.5 || input.moveY > 0.5) && !this.prevFlipInput;
    this.prevFlipInput = input.action1 || input.moveY < -0.5 || input.moveY > 0.5;

    if (flipPressed) {
      this.isCeiling = !this.isCeiling;
      this.playerVy = this.isCeiling ? -400 : 400;
      sound.playLaserHit();
      this.addParticles(this.playerX + this.playerW / 2, this.playerY + this.playerH / 2, '#f43f5e', 8);
    }

    // Rocket Dash
    const dashPressed = (input.action2 || input.special) && !this.prevDashInput && this.dashCooldown <= 0;
    this.prevDashInput = input.action2 || input.special;

    if (dashPressed) {
      this.dashDuration = 0.25;
      this.dashCooldown = Math.max(0.6, 1.2 - (this.upgrades?.empCooldownLevel - 1) * 0.15);
      sound.playShoot();
      this.addParticles(this.playerX, this.playerY + this.playerH / 2, '#38bdf8', 12);
    }

    if (this.dashDuration > 0) {
      this.dashDuration -= dt;
    }
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }

    // Physics
    const g = this.isCeiling ? -this.gravity : this.gravity;
    this.playerVy += g * dt;
    this.playerY += this.playerVy * dt;

    // Floor and Ceiling bounds
    if (this.playerY > this.corridorBottom - this.playerH) {
      this.playerY = this.corridorBottom - this.playerH;
      this.playerVy = 0;
    }
    if (this.playerY < this.corridorTop) {
      this.playerY = this.corridorTop;
      this.playerVy = 0;
    }

    // Advance speed and distance
    const currentSpeed = this.dashDuration > 0 ? this.speed * 2.2 : this.speed;
    this.distanceRun += (currentSpeed * dt) / 10;
    this.score += Math.floor(currentSpeed * dt * this.multiplier * 0.2);

    // Spawn obstacles and stars
    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.8) {
      this.spawnTimer = 0;
      this.spawnHazard();
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      ob.x -= currentSpeed * dt;

      // Collision check with player
      if (
        this.playerX < ob.x + ob.w &&
        this.playerX + this.playerW > ob.x &&
        this.playerY < ob.y + ob.h &&
        this.playerY + this.playerH > ob.y
      ) {
        if (this.dashDuration > 0 && ob.type === 'gate') {
          // Smash through gate during dash!
          this.obstacles.splice(i, 1);
          sound.playExplosion();
          this.score += 200 * this.multiplier;
          this.addParticles(ob.x + ob.w / 2, ob.y + ob.h / 2, '#38bdf8', 16);
          continue;
        }

        // Damage player
        this.obstacles.splice(i, 1);
        this.lives--;
        this.multiplier = 1;
        sound.playExplosion();
        this.addParticles(this.playerX, this.playerY, '#ef4444', 20);

        if (this.lives <= 0) {
          this.isGameOver = true;
          sound.playGameOver();
        }
        continue;
      }

      if (ob.x < -60) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update stars
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      s.x -= currentSpeed * dt;

      if (
        !s.collected &&
        Math.hypot(s.x - (this.playerX + this.playerW / 2), s.y - (this.playerY + this.playerH / 2)) < 28
      ) {
        s.collected = true;
        this.stars.splice(i, 1);
        this.multiplier = Math.min(5, this.multiplier + 1);
        this.score += 100 * this.multiplier;
        const creditMultiplier = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
        this.creditsEarned += Math.ceil(2 * creditMultiplier);
        sound.playCombo(this.multiplier);
        this.addParticles(s.x, s.y, '#facc15', 10);
        continue;
      }

      if (s.x < -40) {
        this.stars.splice(i, 1);
      }
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

  private spawnHazard() {
    const isCeil = Math.random() < 0.5;
    const type = Math.random() < 0.35 ? 'gate' : 'spike';
    const h = type === 'spike' ? 32 : (this.corridorBottom - this.corridorTop) * 0.45;
    const w = type === 'spike' ? 24 : 16;
    const y = isCeil ? this.corridorTop : this.corridorBottom - h;

    this.obstacles.push({
      x: this.width + 40,
      y,
      w,
      h,
      isCeiling: isCeil,
      type,
    });

    // Star pickup spawn
    if (Math.random() < 0.6) {
      this.stars.push({
        x: this.width + 120,
        y: (this.corridorTop + this.corridorBottom) / 2 + (Math.random() * 80 - 40),
        collected: false,
      });
    }
  }

  private addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.3 + Math.random() * 0.3,
        color,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Clear corridor
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.width, this.height);

    // Corridor ceiling and floor
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, this.width, this.corridorTop);
    ctx.fillRect(0, this.corridorBottom, this.width, this.height - this.corridorBottom);

    // Neon boundary laser lines
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(0, this.corridorTop);
    ctx.lineTo(this.width, this.corridorTop);
    ctx.moveTo(0, this.corridorBottom);
    ctx.lineTo(this.width, this.corridorBottom);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw stars
    for (const s of this.stars) {
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw obstacles
    for (const ob of this.obstacles) {
      if (ob.type === 'spike') {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (ob.isCeiling) {
          ctx.moveTo(ob.x, ob.y);
          ctx.lineTo(ob.x + ob.w, ob.y);
          ctx.lineTo(ob.x + ob.w / 2, ob.y + ob.h);
        } else {
          ctx.moveTo(ob.x, ob.y + ob.h);
          ctx.lineTo(ob.x + ob.w, ob.y + ob.h);
          ctx.lineTo(ob.x + ob.w / 2, ob.y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Cyber Gate
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      }
    }
    ctx.shadowBlur = 0;

    // Draw player
    if (!this.isGameOver) {
      ctx.save();
      ctx.translate(this.playerX, this.playerY);

      // Dash aura
      if (this.dashDuration > 0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(-15, -4, this.playerW + 30, this.playerH + 8);
      }

      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.fillRect(0, 0, this.playerW, this.playerH);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, this.playerW - 8, this.playerH - 8);

      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
