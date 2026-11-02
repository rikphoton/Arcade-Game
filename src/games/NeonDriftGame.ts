import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface TrafficCar {
  x: number; // -0.8 to 0.8
  z: number; // distance ahead
  speed: number;
  color: string;
}

export class NeonDriftGame implements ArcadeGameInstance {
  public id: GameId = 'neon-drift';
  private width = 800;
  private height = 600;

  private playerX = 0; // -1 to 1
  private speed = 0;
  private maxSpeed = 380;
  private acceleration = 180;
  private nitroActive = false;
  private nitroTank = 100;

  private distance = 0;
  private roadCurve = 0;
  private targetCurve = 0;
  private curveTimer = 0;

  private traffic: TrafficCar[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private multiplier = 1;
  private lives = 3;
  private maxLives = 3;
  private isGameOver = false;

  private upgrades!: TechTreeState;

  public init(canvas: HTMLCanvasElement, width: number, height: number, upgrades: TechTreeState) {
    this.width = width;
    this.height = height;
    this.upgrades = upgrades;
    this.restart();
  }

  public restart() {
    this.playerX = 0;
    this.speed = 0;
    this.maxSpeed = 380 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);
    this.nitroTank = 100;
    this.nitroActive = false;
    this.distance = 0;
    this.roadCurve = 0;
    this.targetCurve = 0;
    this.curveTimer = 0;

    this.score = 0;
    this.creditsEarned = 0;
    this.multiplier = 1;
    this.maxLives = 3 + (this.upgrades?.maxHealthLevel - 1);
    this.lives = this.maxLives;
    this.isGameOver = false;

    this.traffic = [];
    this.particles = [];
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.traffic = [];
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
      level: Math.floor(this.distance / 1000) + 1,
      isGameOver: this.isGameOver,
      customStatLabel: 'SPEED',
      customStatValue: `${Math.floor(this.speed)} KM/H`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    // Throttle & Nitro
    const accelerating = input.action1 || input.moveY < -0.2 || input.action2;
    this.nitroActive = (input.action2 || input.special) && this.nitroTank > 0;

    if (this.nitroActive) {
      this.nitroTank = Math.max(0, this.nitroTank - dt * 35);
      this.speed = Math.min(this.maxSpeed * 1.4, this.speed + this.acceleration * 2 * dt);
      if (Math.random() < 0.3) {
        sound.playShoot();
        this.addNitroParticles();
      }
    } else {
      this.nitroTank = Math.min(100, this.nitroTank + dt * 10);
      if (accelerating) {
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * dt);
      } else {
        this.speed = Math.max(0, this.speed - this.acceleration * 0.8 * dt);
      }
    }

    // Steering
    const steerSpeed = (this.speed / this.maxSpeed) * 1.8;
    this.playerX += input.moveX * steerSpeed * dt;
    // Centrifugal force from road curve
    this.playerX -= this.roadCurve * (this.speed / this.maxSpeed) * 0.8 * dt;

    // Off-road penalty
    if (Math.abs(this.playerX) > 0.85) {
      this.speed = Math.max(80, this.speed - 300 * dt);
    }
    this.playerX = Math.max(-1.1, Math.min(1.1, this.playerX));

    // Road Curve interpolation
    this.curveTimer += dt;
    if (this.curveTimer > 3) {
      this.curveTimer = 0;
      this.targetCurve = (Math.random() - 0.5) * 1.4;
    }
    this.roadCurve += (this.targetCurve - this.roadCurve) * 2 * dt;

    // Distance and score
    this.distance += this.speed * dt;
    this.score += Math.floor(this.speed * dt * this.multiplier * 0.1);

    // Spawn traffic
    if (this.traffic.length < 5 && Math.random() < 0.03) {
      this.traffic.push({
        x: (Math.random() - 0.5) * 1.2,
        z: 600 + Math.random() * 400,
        speed: 160 + Math.random() * 80,
        color: Math.random() < 0.5 ? '#f43f5e' : '#ec4899',
      });
    }

    // Update traffic
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const c = this.traffic[i];
      // Relative motion
      c.z -= (this.speed - c.speed) * dt;

      // Check collision
      if (c.z < 60 && c.z > 20 && Math.abs(c.x - this.playerX) < 0.22) {
        // Crash!
        this.traffic.splice(i, 1);
        this.lives--;
        this.speed = 60;
        this.multiplier = 1;
        sound.playExplosion();
        this.addCrashParticles();

        if (this.lives <= 0) {
          this.isGameOver = true;
          sound.playGameOver();
        }
        continue;
      }

      // Near-miss bonus
      if (c.z < 20 && c.z > 0 && Math.abs(c.x - this.playerX) < 0.4 && Math.abs(c.x - this.playerX) >= 0.22) {
        this.multiplier = Math.min(8, this.multiplier + 1);
        this.score += 250 * this.multiplier;
        const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
        this.creditsEarned += Math.ceil(3 * creditBonus);
        sound.playCombo(this.multiplier);
      }

      // Past camera
      if (c.z < 0) {
        this.traffic.splice(i, 1);
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

  private addNitroParticles() {
    const screenX = this.width / 2 + this.playerX * (this.width * 0.35);
    const screenY = this.height - 70;
    this.particles.push({
      x: screenX - 12,
      y: screenY,
      vx: (Math.random() - 0.5) * 30,
      vy: 100 + Math.random() * 50,
      life: 0.25,
      color: '#06b6d4',
    });
    this.particles.push({
      x: screenX + 12,
      y: screenY,
      vx: (Math.random() - 0.5) * 30,
      vy: 100 + Math.random() * 50,
      life: 0.25,
      color: '#06b6d4',
    });
  }

  private addCrashParticles() {
    const screenX = this.width / 2 + this.playerX * (this.width * 0.35);
    const screenY = this.height - 80;
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 150;
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.4,
        color: '#f59e0b',
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Horizon & Cyberpunk sky
    const horizonY = this.height * 0.45;

    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, horizonY);

    // Neon Sun / Mountain horizon silhouette
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(this.width * 0.25, horizonY - 60);
    ctx.lineTo(this.width * 0.5, horizonY);
    ctx.lineTo(this.width * 0.75, horizonY - 90);
    ctx.lineTo(this.width, horizonY);
    ctx.fill();

    // Road Ground
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, horizonY, this.width, this.height - horizonY);

    // Draw Pseudo-3D Road Segments
    const segments = 40;
    for (let i = segments; i >= 1; i--) {
      const y1 = horizonY + (this.height - horizonY) * Math.pow(i / segments, 1.8);
      const y2 = horizonY + (this.height - horizonY) * Math.pow((i - 1) / segments, 1.8);

      const curveOffset1 = Math.sin((i / segments) * Math.PI) * this.roadCurve * 140;
      const curveOffset2 = Math.sin(((i - 1) / segments) * Math.PI) * this.roadCurve * 140;

      const w1 = this.width * 0.08 + (this.width * 0.7) * (i / segments);
      const w2 = this.width * 0.08 + (this.width * 0.7) * ((i - 1) / segments);

      const cx1 = this.width / 2 + curveOffset1;
      const cx2 = this.width / 2 + curveOffset2;

      // Alternating road strips
      const isAlt = Math.floor((this.distance * 0.04 + i) % 2) === 0;
      ctx.fillStyle = isAlt ? '#0f172a' : '#1e293b';

      ctx.beginPath();
      ctx.moveTo(cx1 - w1 / 2, y1);
      ctx.lineTo(cx1 + w1 / 2, y1);
      ctx.lineTo(cx2 + w2 / 2, y2);
      ctx.lineTo(cx2 - w2 / 2, y2);
      ctx.fill();

      // Neon road borders
      ctx.strokeStyle = isAlt ? '#06b6d4' : '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx1 - w1 / 2, y1);
      ctx.lineTo(cx2 - w2 / 2, y2);
      ctx.moveTo(cx1 + w1 / 2, y1);
      ctx.lineTo(cx2 + w2 / 2, y2);
      ctx.stroke();
    }

    // Render Traffic Cars
    for (const c of this.traffic) {
      const zNorm = c.z / 800; // 0 to 1
      if (zNorm <= 0 || zNorm > 1) continue;
      const y = horizonY + (this.height - horizonY) * Math.pow(1 - zNorm, 1.8);
      const roadW = this.width * 0.08 + (this.width * 0.7) * (1 - zNorm);
      const curveOffset = Math.sin((1 - zNorm) * Math.PI) * this.roadCurve * 140;
      const x = this.width / 2 + curveOffset + c.x * (roadW * 0.45);
      const carW = 34 * (1 - zNorm);
      const carH = 20 * (1 - zNorm);

      ctx.fillStyle = c.color;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(x - carW / 2, y - carH, carW, carH);
      ctx.shadowBlur = 0;
    }

    // Render Player Cyber Car
    if (!this.isGameOver) {
      const px = this.width / 2 + this.playerX * (this.width * 0.35);
      const py = this.height - 80;
      const carW = 56;
      const carH = 28;

      ctx.save();
      ctx.translate(px, py);

      // Chassis
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillRect(-carW / 2, -carH, carW, carH);

      // Windshield & lights
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-carW / 2 + 8, -carH + 4, carW - 16, 8);

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-carW / 2 + 4, -4, 10, 4);
      ctx.fillRect(carW / 2 - 14, -4, 10, 4);

      ctx.restore();
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }
}
