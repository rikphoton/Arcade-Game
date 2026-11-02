import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  size: number;
  isBoss?: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy?: boolean;
}

export class AstroPulseGame implements ArcadeGameInstance {
  public id: GameId = 'astro-pulse';
  private width = 800;
  private height = 600;

  private playerX = 400;
  private playerY = 500;
  private playerSpeed = 320;
  private playerShield = 100;
  private playerMaxShield = 100;
  private weaponLevel = 1;

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private multiplier = 1;
  private wave = 1;
  private isGameOver = false;

  private isBossActive = false;
  private bossHp = 500;
  private bossMaxHp = 500;

  private stars: Star[] = [];
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  private fireTimer = 0;
  private spawnTimer = 0;
  private upgrades!: TechTreeState;

  public init(canvas: HTMLCanvasElement, width: number, height: number, upgrades: TechTreeState) {
    this.width = width;
    this.height = height;
    this.upgrades = upgrades;
    this.initStars();
    this.restart();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 60 + Math.random() * 140,
        size: Math.random() < 0.2 ? 2 : 1,
        color: Math.random() < 0.3 ? '#38bdf8' : '#94a3b8',
      });
    }
  }

  public restart() {
    this.playerX = this.width / 2;
    this.playerY = this.height - 80;
    this.playerMaxShield = 100 + (this.upgrades?.maxHealthLevel - 1) * 25;
    this.playerShield = this.playerMaxShield;
    this.playerSpeed = 320 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);

    this.score = 0;
    this.creditsEarned = 0;
    this.multiplier = 1;
    this.wave = 1;
    this.weaponLevel = 1;
    this.isGameOver = false;
    this.isBossActive = false;

    this.enemies = [];
    this.bullets = [];
    this.particles = [];
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: Math.max(0, Math.ceil(this.playerShield / 25)),
      maxLives: Math.ceil(this.playerMaxShield / 25),
      creditsEarned: this.creditsEarned,
      multiplier: this.multiplier,
      level: this.wave,
      isGameOver: this.isGameOver,
      isBossWave: this.isBossActive,
      bossHealthPercent: this.isBossActive ? (this.bossHp / this.bossMaxHp) * 100 : undefined,
      customStatLabel: this.isBossActive ? 'DREADNOUGHT' : 'WAVE',
      customStatValue: this.isBossActive ? `${Math.ceil((this.bossHp / this.bossMaxHp) * 100)}%` : `STAGE ${this.wave}`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    // Scroll stars
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > this.height) {
        s.y = 0;
        s.x = Math.random() * this.width;
      }
    }

    // Move player
    this.playerX += input.moveX * this.playerSpeed * dt;
    this.playerY += input.moveY * this.playerSpeed * dt;
    this.playerX = Math.max(20, Math.min(this.width - 20, this.playerX));
    this.playerY = Math.max(40, Math.min(this.height - 40, this.playerY));

    // Player firing
    this.fireTimer += dt;
    if (this.fireTimer >= 0.14) {
      this.fireTimer = 0;
      this.fireWeapons();
    }

    // Special EMP Bomb
    if (input.special) {
      this.triggerScreenBomb();
    }

    // Spawning waves or boss
    this.spawnTimer += dt;
    if (!this.isBossActive && this.score > this.wave * 3000) {
      this.spawnBoss();
    } else if (!this.isBossActive && this.spawnTimer >= 0.9) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Enemy bullet hitting player
      if (b.isEnemy) {
        if (Math.hypot(b.x - this.playerX, b.y - this.playerY) < 16) {
          this.bullets.splice(i, 1);
          this.playerShield -= 20;
          sound.playLaserHit();
          this.addParticles(this.playerX, this.playerY, '#ef4444', 8);

          if (this.playerShield <= 0) {
            this.isGameOver = true;
            sound.playGameOver();
            this.addParticles(this.playerX, this.playerY, '#ef4444', 30);
          }
          continue;
        }
      } else {
        // Player bullet hitting enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
            e.hp -= 20;
            this.bullets.splice(i, 1);
            sound.playLaserHit();
            this.addParticles(b.x, b.y, '#38bdf8', 4);

            if (e.hp <= 0) {
              this.killEnemy(j);
            }
            break;
          }
        }
      }

      if (b.y < -20 || b.y > this.height + 20) {
        this.bullets.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.isBoss) {
        this.bossHp = e.hp;
        if (e.x < 100 || e.x > this.width - 100) e.vx = -e.vx;
        // Boss firing
        if (Math.random() < 0.05) {
          this.bullets.push({
            x: e.x,
            y: e.y + e.size,
            vx: (Math.random() - 0.5) * 140,
            vy: 260,
            isEnemy: true,
          });
        }
      }

      if (e.y > this.height + 40) {
        this.enemies.splice(i, 1);
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

  private fireWeapons() {
    sound.playShoot();
    this.bullets.push({ x: this.playerX, y: this.playerY - 14, vx: 0, vy: -550 });

    if (this.weaponLevel >= 2) {
      this.bullets.push({ x: this.playerX - 10, y: this.playerY - 10, vx: -80, vy: -520 });
      this.bullets.push({ x: this.playerX + 10, y: this.playerY - 10, vx: 80, vy: -520 });
    }
  }

  private triggerScreenBomb() {
    sound.playEmp();
    this.addParticles(this.playerX, this.playerY, '#38bdf8', 35);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].isBoss) {
        this.killEnemy(i);
      } else {
        this.enemies[i].hp -= 150;
      }
    }
    this.bullets = this.bullets.filter((b) => !b.isEnemy);
  }

  private spawnEnemy() {
    this.enemies.push({
      x: 40 + Math.random() * (this.width - 80),
      y: -30,
      vx: (Math.random() - 0.5) * 80,
      vy: 140 + Math.random() * 60,
      hp: 30,
      maxHp: 30,
      size: 16,
    });
  }

  private spawnBoss() {
    this.isBossActive = true;
    this.bossMaxHp = 500 + this.wave * 200;
    this.bossHp = this.bossMaxHp;
    this.enemies.push({
      x: this.width / 2,
      y: 90,
      vx: 100,
      vy: 0,
      hp: this.bossHp,
      maxHp: this.bossMaxHp,
      size: 48,
      isBoss: true,
    });
    sound.playPowerup();
  }

  private killEnemy(index: number) {
    const e = this.enemies[index];
    this.enemies.splice(index, 1);
    this.score += (e.isBoss ? 2500 : 100) * this.multiplier;
    const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
    this.creditsEarned += Math.ceil((e.isBoss ? 50 : 3) * creditBonus);

    this.addParticles(e.x, e.y, e.isBoss ? '#f59e0b' : '#38bdf8', e.isBoss ? 40 : 12);
    sound.playExplosion();

    if (e.isBoss) {
      this.isBossActive = false;
      this.wave++;
      this.weaponLevel = Math.min(3, this.weaponLevel + 1);
      sound.playPowerup();
    }
  }

  private addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 160;
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
    // Deep space backdrop
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render stars
    for (const s of this.stars) {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Render bullets
    for (const b of this.bullets) {
      ctx.fillStyle = b.isEnemy ? '#ef4444' : '#38bdf8';
      ctx.shadowColor = b.isEnemy ? '#ef4444' : '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.isEnemy ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Render enemies
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.isBoss) {
        // Mothership Dreadnought
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(0, e.size);
        ctx.lineTo(-e.size, -e.size * 0.6);
        ctx.lineTo(e.size, -e.size * 0.6);
        ctx.closePath();
        ctx.fill();

        // Core
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Scout drone
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, e.size);
        ctx.lineTo(-e.size * 0.8, -e.size * 0.8);
        ctx.lineTo(e.size * 0.8, -e.size * 0.8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.shadowBlur = 0;

    // Render player interceptor
    if (!this.isGameOver) {
      ctx.save();
      ctx.translate(this.playerX, this.playerY);

      // Shield glow
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Jet chassis
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-14, 14);
      ctx.lineTo(0, 8);
      ctx.lineTo(14, 14);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
