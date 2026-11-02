import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Tank {
  x: number;
  y: number;
  angle: number;
  turretAngle: number;
  hp: number;
  maxHp: number;
  isEnemy: boolean;
  color: string;
}

interface Shell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
  isEnemy: boolean;
}

interface Barricade {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
}

interface Mine {
  x: number;
  y: number;
  timer: number;
}

export class VoxelTankSiegeGame implements ArcadeGameInstance {
  public id: GameId = 'voxel-tank-siege';
  private width = 800;
  private height = 600;

  private player!: Tank;
  private enemies: Tank[] = [];
  private shells: Shell[] = [];
  private barricades: Barricade[] = [];
  private mines: Mine[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private multiplier = 1;
  private wave = 1;
  private isGameOver = false;

  private fireCooldown = 0;
  private mineCharges = 3;
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
    this.wave = 1;
    this.mineCharges = 3 + (this.upgrades?.maxHealthLevel - 1);
    this.isGameOver = false;

    const maxHp = 100 + (this.upgrades?.maxHealthLevel - 1) * 25;
    this.player = {
      x: 100,
      y: this.height / 2,
      angle: 0,
      turretAngle: 0,
      hp: maxHp,
      maxHp,
      isEnemy: false,
      color: '#14b8a6',
    };

    this.shells = [];
    this.mines = [];
    this.particles = [];
    this.buildArena();
    this.spawnWave();
  }

  private buildArena() {
    this.barricades = [
      { x: this.width * 0.3, y: this.height * 0.25, w: 20, h: 100, hp: 50 },
      { x: this.width * 0.3, y: this.height * 0.6, w: 20, h: 100, hp: 50 },
      { x: this.width * 0.5 - 50, y: this.height * 0.5 - 10, w: 100, h: 20, hp: 50 },
      { x: this.width * 0.7, y: this.height * 0.25, w: 20, h: 100, hp: 50 },
      { x: this.width * 0.7, y: this.height * 0.6, w: 20, h: 100, hp: 50 },
    ];
  }

  private spawnWave() {
    this.enemies = [];
    const count = Math.min(6, 2 + this.wave);
    for (let i = 0; i < count; i++) {
      this.enemies.push({
        x: this.width - 100,
        y: 80 + (i * (this.height - 160)) / count,
        angle: Math.PI,
        turretAngle: Math.PI,
        hp: 40 + this.wave * 10,
        maxHp: 40 + this.wave * 10,
        isEnemy: true,
        color: '#f43f5e',
      });
    }
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.enemies = [];
    this.shells = [];
    this.barricades = [];
    this.mines = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: Math.max(0, Math.ceil(this.player.hp / 25)),
      maxLives: Math.ceil(this.player.maxHp / 25),
      creditsEarned: this.creditsEarned,
      multiplier: this.multiplier,
      level: this.wave,
      isGameOver: this.isGameOver,
      customStatLabel: 'MINES',
      customStatValue: `${this.mineCharges} READY`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // Player Drive Controls
    const speed = 190 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);
    let dx = input.moveX;
    let dy = input.moveY;
    const len = Math.hypot(dx, dy);

    if (len > 0.1) {
      dx /= len;
      dy /= len;
      this.player.angle = Math.atan2(dy, dx);
      this.player.x += dx * speed * dt;
      this.player.y += dy * speed * dt;
    }

    // Keep Player inside arena walls
    this.player.x = Math.max(30, Math.min(this.width - 30, this.player.x));
    this.player.y = Math.max(30, Math.min(this.height - 30, this.player.y));

    // Turret Aiming: use mouse/aimAngle or point in movement direction
    if (input.canvasClick) {
      this.player.turretAngle = Math.atan2(input.canvasClick.y - this.player.y, input.canvasClick.x - this.player.x);
    } else if (len > 0.1) {
      this.player.turretAngle = this.player.angle;
    }

    // Fire Cannon
    if ((input.action1 || input.canvasClick) && this.fireCooldown <= 0) {
      this.fireCooldown = 0.28;
      sound.playShoot();
      this.shells.push({
        x: this.player.x + Math.cos(this.player.turretAngle) * 22,
        y: this.player.y + Math.sin(this.player.turretAngle) * 22,
        vx: Math.cos(this.player.turretAngle) * 440,
        vy: Math.sin(this.player.turretAngle) * 440,
        bounces: 2,
        isEnemy: false,
      });
    }

    // Deploy Mine
    if (input.action2 && this.mineCharges > 0) {
      this.mineCharges--;
      this.mines.push({ x: this.player.x, y: this.player.y, timer: 1.5 });
      sound.playLaserHit();
    }

    // Update Mines
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      m.timer -= dt;
      if (m.timer <= 0) {
        // Explode
        this.mines.splice(i, 1);
        sound.playExplosion();
        this.addParticles(m.x, m.y, '#14b8a6', 30);
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.hypot(e.x - m.x, e.y - m.y) < 90) {
            e.hp -= 80;
            if (e.hp <= 0) this.killEnemy(j);
          }
        }
      }
    }

    // Update Shells (with ricochet bounces)
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Arena wall bounce
      let bounced = false;
      if (s.x < 15 || s.x > this.width - 15) {
        s.vx = -s.vx;
        bounced = true;
      }
      if (s.y < 15 || s.y > this.height - 15) {
        s.vy = -s.vy;
        bounced = true;
      }

      // Barricade collision
      for (let j = this.barricades.length - 1; j >= 0; j--) {
        const b = this.barricades[j];
        if (s.x > b.x && s.x < b.x + b.w && s.y > b.y && s.y < b.y + b.h) {
          b.hp -= 20;
          bounced = true;
          s.vx = -s.vx;
          if (b.hp <= 0) {
            this.barricades.splice(j, 1);
            sound.playExplosion();
            this.addParticles(b.x + b.w / 2, b.y + b.h / 2, '#64748b', 16);
          }
          break;
        }
      }

      if (bounced) {
        s.bounces--;
        sound.playLaserHit();
        if (s.bounces < 0) {
          this.shells.splice(i, 1);
          continue;
        }
      }

      // Hit Player
      if (s.isEnemy && Math.hypot(s.x - this.player.x, s.y - this.player.y) < 18) {
        this.player.hp -= 25;
        this.shells.splice(i, 1);
        sound.playLaserHit();
        this.addParticles(this.player.x, this.player.y, '#ef4444', 12);
        if (this.player.hp <= 0) {
          this.isGameOver = true;
          sound.playGameOver();
          this.addParticles(this.player.x, this.player.y, '#ef4444', 30);
        }
        continue;
      }

      // Hit Enemies
      if (!s.isEnemy) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.hypot(s.x - e.x, s.y - e.y) < 20) {
            e.hp -= 35;
            this.shells.splice(i, 1);
            sound.playLaserHit();
            this.addParticles(e.x, e.y, '#14b8a6', 8);

            if (e.hp <= 0) {
              this.killEnemy(j);
            }
            break;
          }
        }
      }
    }

    // Update Enemies AI
    for (const e of this.enemies) {
      const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      e.turretAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);

      // Advance towards player if far
      if (dist > 180) {
        e.x += Math.cos(e.turretAngle) * 80 * dt;
        e.y += Math.sin(e.turretAngle) * 80 * dt;
      }

      // AI Fire
      if (Math.random() < 0.015) {
        this.shells.push({
          x: e.x + Math.cos(e.turretAngle) * 20,
          y: e.y + Math.sin(e.turretAngle) * 20,
          vx: Math.cos(e.turretAngle) * 360,
          vy: Math.sin(e.turretAngle) * 360,
          bounces: 1,
          isEnemy: true,
        });
      }
    }

    // Check Wave Clear
    if (this.enemies.length === 0) {
      this.wave++;
      this.score += 1500 * this.multiplier;
      sound.playPowerup();
      this.spawnWave();
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

  private killEnemy(index: number) {
    const e = this.enemies[index];
    this.enemies.splice(index, 1);
    this.score += 350 * this.multiplier;
    const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
    this.creditsEarned += Math.ceil(5 * creditBonus);
    sound.playExplosion();
    this.addParticles(e.x, e.y, e.color, 20);
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
    // Arena
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Neon wall border
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#14b8a6';
    ctx.shadowBlur = 8;
    ctx.strokeRect(10, 10, this.width - 20, this.height - 20);
    ctx.shadowBlur = 0;

    // Render Barricades
    for (const b of this.barricades) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }

    // Render Mines
    for (const m of this.mines) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Render Shells
    for (const s of this.shells) {
      ctx.fillStyle = s.isEnemy ? '#ef4444' : '#14b8a6';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Render Enemies
    for (const e of this.enemies) {
      this.renderTank(ctx, e);
    }

    // Render Player
    if (!this.isGameOver) {
      this.renderTank(ctx, this.player);
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }

  private renderTank(ctx: CanvasRenderingContext2D, t: Tank) {
    ctx.save();
    ctx.translate(t.x, t.y);

    // Chassis
    ctx.rotate(t.angle);
    ctx.fillStyle = t.color;
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(-16, -12, 32, 24);

    // Treads
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -15, 36, 4);
    ctx.fillRect(-18, 11, 36, 4);

    // Turret (independent rotation)
    ctx.rotate(t.turretAngle - t.angle);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -3, 20, 6);
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
