import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Drone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  damage: number;
}

interface Gem {
  x: number;
  y: number;
  value: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class CyberSurvivorsGame implements ArcadeGameInstance {
  public id: GameId = 'cyber-survivors';
  private canvas!: HTMLCanvasElement;
  private width = 800;
  private height = 600;

  private playerX = 400;
  private playerY = 300;
  private playerRadius = 14;
  private playerSpeed = 220;
  private playerHp = 100;
  private playerMaxHp = 100;
  private empCharge = 100; // 0 to 100

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private xp = 0;
  private level = 1;
  private xpToNext = 50;
  private multiplier = 1;
  private isGameOver = false;

  private drones: Drone[] = [];
  private bullets: Bullet[] = [];
  private gems: Gem[] = [];
  private particles: Particle[] = [];

  private shootTimer = 0;
  private spawnTimer = 0;
  private gameTime = 0;
  private upgrades!: TechTreeState;

  public init(canvas: HTMLCanvasElement, width: number, height: number, upgrades: TechTreeState) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.upgrades = upgrades;
    this.restart();
  }

  public restart() {
    this.playerX = this.width / 2;
    this.playerY = this.height / 2;
    this.playerMaxHp = 100 + (this.upgrades?.maxHealthLevel - 1) * 25;
    this.playerHp = this.playerMaxHp;
    this.playerSpeed = 220 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);

    this.score = 0;
    this.creditsEarned = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 50;
    this.multiplier = 1;
    this.empCharge = 100;
    this.isGameOver = false;

    this.drones = [];
    this.bullets = [];
    this.gems = [];
    this.particles = [];
    this.shootTimer = 0;
    this.spawnTimer = 0;
    this.gameTime = 0;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.drones = [];
    this.bullets = [];
    this.gems = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: Math.max(0, Math.ceil(this.playerHp / 25)),
      maxLives: Math.ceil(this.playerMaxHp / 25),
      creditsEarned: this.creditsEarned,
      multiplier: this.multiplier,
      level: this.level,
      isGameOver: this.isGameOver,
      customStatLabel: 'EMP CHARGE',
      customStatValue: `${Math.floor(this.empCharge)}%`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;
    this.gameTime += dt;

    // Recharge EMP
    const empRate = 8 * (1 + (this.upgrades?.empCooldownLevel - 1) * 0.15);
    this.empCharge = Math.min(100, this.empCharge + dt * empRate);

    // Player Movement
    let dx = input.moveX;
    let dy = input.moveY;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.playerX += dx * this.playerSpeed * dt;
      this.playerY += dy * this.playerSpeed * dt;
    }

    // Keep player in bounds
    this.playerX = Math.max(this.playerRadius, Math.min(this.width - this.playerRadius, this.playerX));
    this.playerY = Math.max(this.playerRadius, Math.min(this.height - this.playerRadius, this.playerY));

    // Handle EMP Nova Special
    if (input.special && this.empCharge >= 100) {
      this.triggerEmpNova();
    }

    // Auto-fire bullets at closest drone
    this.shootTimer += dt;
    const shootInterval = Math.max(0.12, 0.3 - (this.level - 1) * 0.03);
    if (this.shootTimer >= shootInterval) {
      this.shootTimer = 0;
      this.autoFire();
    }

    // Spawn drones
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.3, 1.2 - this.gameTime * 0.015);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnDrone();
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
        this.bullets.splice(i, 1);
      }
    }

    // Update drones & collisions with bullets
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      const toPlayerX = this.playerX - d.x;
      const toPlayerY = this.playerY - d.y;
      const dist = Math.hypot(toPlayerX, toPlayerY);
      if (dist > 0) {
        d.vx = (toPlayerX / dist) * d.speed;
        d.vy = (toPlayerY / dist) * d.speed;
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      // Bullet hit check
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (Math.hypot(b.x - d.x, b.y - d.y) < d.radius + b.radius) {
          d.hp -= b.damage;
          this.bullets.splice(j, 1);
          sound.playLaserHit();
          this.addExplosion(b.x, b.y, '#06b6d4', 4);

          if (d.hp <= 0) {
            this.killDrone(i);
            break;
          }
        }
      }

      // Player contact damage
      if (dist < d.radius + this.playerRadius) {
        this.playerHp -= 25 * dt;
        this.addExplosion(this.playerX, this.playerY, '#ef4444', 1);
        if (this.playerHp <= 0) {
          this.playerHp = 0;
          this.isGameOver = true;
          sound.playGameOver();
          this.addExplosion(this.playerX, this.playerY, '#ef4444', 25);
        }
      }
    }

    // Update and collect gems
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dist = Math.hypot(this.playerX - g.x, this.playerY - g.y);
      if (dist < 80) {
        // Magnet effect
        g.x += ((this.playerX - g.x) / dist) * 260 * dt;
        g.y += ((this.playerY - g.y) / dist) * 260 * dt;
      }
      if (dist < this.playerRadius + g.radius) {
        this.gems.splice(i, 1);
        this.collectGem(g.value);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private triggerEmpNova() {
    this.empCharge = 0;
    sound.playEmp();
    this.addExplosion(this.playerX, this.playerY, '#06b6d4', 40);

    for (let i = this.drones.length - 1; i >= 0; i--) {
      this.killDrone(i);
    }
  }

  private autoFire() {
    let closestDrone: Drone | null = null;
    let minDist = 400;

    for (const d of this.drones) {
      const dist = Math.hypot(d.x - this.playerX, d.y - this.playerY);
      if (dist < minDist) {
        minDist = dist;
        closestDrone = d;
      }
    }

    sound.playShoot();
    const speed = 480;

    if (closestDrone) {
      const angle = Math.atan2(closestDrone.y - this.playerY, closestDrone.x - this.playerX);
      this.fireBulletAtAngle(angle, speed);
      if (this.level >= 3) {
        this.fireBulletAtAngle(angle + 0.2, speed);
        this.fireBulletAtAngle(angle - 0.2, speed);
      }
    } else {
      // Fire in 4 cardinal directions if idle
      this.fireBulletAtAngle(0, speed);
      this.fireBulletAtAngle(Math.PI / 2, speed);
      this.fireBulletAtAngle(Math.PI, speed);
      this.fireBulletAtAngle(-Math.PI / 2, speed);
    }
  }

  private fireBulletAtAngle(angle: number, speed: number) {
    this.bullets.push({
      x: this.playerX,
      y: this.playerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4,
      life: 1.2,
      damage: 15 + this.level * 2,
    });
  }

  private spawnDrone() {
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (side === 0) {
      x = Math.random() * this.width;
      y = -20;
    } else if (side === 1) {
      x = this.width + 20;
      y = Math.random() * this.height;
    } else if (side === 2) {
      x = Math.random() * this.width;
      y = this.height + 20;
    } else {
      x = -20;
      y = Math.random() * this.height;
    }

    const isHeavy = Math.random() < 0.2 && this.gameTime > 15;
    this.drones.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: isHeavy ? 18 : 10,
      hp: isHeavy ? 60 : 20,
      maxHp: isHeavy ? 60 : 20,
      speed: isHeavy ? 80 : 120 + Math.random() * 30,
      color: isHeavy ? '#f43f5e' : '#ec4899',
    });
  }

  private killDrone(index: number) {
    const d = this.drones[index];
    this.drones.splice(index, 1);
    this.score += 50 * this.multiplier;
    this.addExplosion(d.x, d.y, d.color, 12);
    sound.playExplosion();

    this.gems.push({
      x: d.x,
      y: d.y,
      value: d.maxHp > 30 ? 30 : 10,
      radius: 6,
    });
  }

  private collectGem(value: number) {
    sound.playCombo(this.level);
    this.xp += value;
    const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
    this.creditsEarned += Math.ceil((value / 5) * creditBonus);

    if (this.xp >= this.xpToNext) {
      this.level++;
      this.xp -= this.xpToNext;
      this.xpToNext = Math.floor(this.xpToNext * 1.5);
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 25);
      sound.playPowerup();
      this.addExplosion(this.playerX, this.playerY, '#22c55e', 20);
    }
  }

  private addExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.2 + Math.random() * 0.3,
        maxLife: 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Clear arena canvas with subtle grid
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Draw gems
    for (const g of this.gems) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw bullets
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw drones
    for (const d of this.drones) {
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();

      // Health ring
      if (d.hp < d.maxHp) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius + 3, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (d.hp / d.maxHp)));
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    // Draw player mech
    if (!this.isGameOver) {
      ctx.save();
      ctx.translate(this.playerX, this.playerY);

      // EMP Aura if fully charged
      if (this.empCharge >= 100) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, this.playerRadius + 8 + Math.sin(this.gameTime * 6) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Mech Chassis
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.playerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.playerRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Health bar above player
      const barW = 32;
      const barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-barW / 2, -this.playerRadius - 12, barW, barH);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-barW / 2, -this.playerRadius - 12, barW * (this.playerHp / this.playerMaxHp), barH);

      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}
