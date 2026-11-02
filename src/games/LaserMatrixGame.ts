import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Mirror {
  col: number;
  row: number;
  angle: number; // in radians: 0, Math.PI/4, Math.PI/2, etc.
}

interface TargetCore {
  col: number;
  row: number;
  powered: boolean;
}

interface LaserSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class LaserMatrixGame implements ArcadeGameInstance {
  public id: GameId = 'laser-matrix';
  private width = 700;
  private height = 650;

  private gridCols = 8;
  private gridRows = 8;
  private cellSize = 60;
  private offsetX = 50;
  private offsetY = 50;

  private mirrors: Mirror[] = [];
  private targets: TargetCore[] = [];
  private laserSegments: LaserSegment[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  private emitter = { col: 0, row: 3, dirX: 1, dirY: 0 };

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private multiplier = 1;
  private level = 1;
  private maxLevel = 5;
  private isGameOver = false;
  private isVictory = false;

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
    this.level = 1;
    this.isGameOver = false;
    this.isVictory = false;

    this.particles = [];
    this.loadLevel(this.level);
  }

  private loadLevel(lvl: number) {
    this.cellSize = Math.min(64, Math.floor((this.height - 120) / this.gridRows));
    this.offsetX = Math.floor((this.width - this.gridCols * this.cellSize) / 2);
    this.offsetY = Math.floor((this.height - this.gridRows * this.cellSize) / 2);

    this.emitter = { col: 0, row: 2 + (lvl % 3), dirX: 1, dirY: 0 };
    this.mirrors = [];
    this.targets = [];

    if (lvl === 1) {
      this.mirrors = [
        { col: 3, row: this.emitter.row, angle: Math.PI / 4 }, // 45 deg
        { col: 3, row: this.emitter.row + 3, angle: -Math.PI / 4 },
      ];
      this.targets = [{ col: 6, row: this.emitter.row + 3, powered: false }];
    } else if (lvl === 2) {
      this.mirrors = [
        { col: 2, row: this.emitter.row, angle: Math.PI / 4 },
        { col: 2, row: 1, angle: -Math.PI / 4 },
        { col: 5, row: 1, angle: Math.PI / 4 },
      ];
      this.targets = [{ col: 5, row: 6, powered: false }];
    } else {
      this.mirrors = [
        { col: 2, row: this.emitter.row, angle: 0 },
        { col: 4, row: this.emitter.row - 1, angle: Math.PI / 4 },
        { col: 4, row: this.emitter.row + 2, angle: -Math.PI / 4 },
        { col: 6, row: this.emitter.row + 2, angle: Math.PI / 4 },
      ];
      this.targets = [
        { col: 6, row: 1, powered: false },
        { col: 7, row: this.emitter.row + 2, powered: false },
      ];
    }

    this.calculateLaser();
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.loadLevel(this.level);
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.mirrors = [];
    this.targets = [];
    this.laserSegments = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    const poweredCount = this.targets.filter((t) => t.powered).length;
    return {
      score: this.score,
      highScore: this.highScore,
      lives: 1,
      maxLives: 1,
      creditsEarned: this.creditsEarned,
      multiplier: this.multiplier,
      level: this.level,
      isGameOver: this.isGameOver,
      isVictory: this.isVictory,
      customStatLabel: 'CORES POWERED',
      customStatValue: `${poweredCount} / ${this.targets.length}`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    // Handle mirror clicks
    if (input.canvasClick) {
      const clickCol = Math.floor((input.canvasClick.x - this.offsetX) / this.cellSize);
      const clickRow = Math.floor((input.canvasClick.y - this.offsetY) / this.cellSize);

      const clickedMirror = this.mirrors.find((m) => m.col === clickCol && m.row === clickRow);
      if (clickedMirror) {
        clickedMirror.angle = (clickedMirror.angle + Math.PI / 4) % (Math.PI * 2);
        sound.playLaserHit();
        this.addParticles(
          this.offsetX + clickCol * this.cellSize + this.cellSize / 2,
          this.offsetY + clickRow * this.cellSize + this.cellSize / 2,
          '#0284c7',
          10
        );
        this.calculateLaser();
      }
    }

    // Check Victory
    const allPowered = this.targets.length > 0 && this.targets.every((t) => t.powered);
    if (allPowered) {
      sound.playPowerup();
      this.score += 1500 * this.level;
      const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
      this.creditsEarned += Math.ceil(25 * creditBonus);

      if (this.level < this.maxLevel) {
        this.level++;
        this.loadLevel(this.level);
      } else {
        this.isVictory = true;
        this.isGameOver = true;
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

  private calculateLaser() {
    this.laserSegments = [];
    this.targets.forEach((t) => (t.powered = false));

    let curX = this.offsetX + this.emitter.col * this.cellSize + this.cellSize / 2;
    let curY = this.offsetY + this.emitter.row * this.cellSize + this.cellSize / 2;
    let dirX = this.emitter.dirX;
    let dirY = this.emitter.dirY;

    const maxSteps = 16;
    for (let step = 0; step < maxSteps; step++) {
      let nextX = curX;
      let nextY = curY;

      // Find next intersection with mirror or target
      let hitMirror: Mirror | null = null;
      let hitTarget: TargetCore | null = null;
      let stepDistance = 9999;

      // Check grid boundaries
      if (dirX > 0) stepDistance = Math.min(stepDistance, (this.offsetX + this.gridCols * this.cellSize - curX));
      if (dirX < 0) stepDistance = Math.min(stepDistance, (curX - this.offsetX));
      if (dirY > 0) stepDistance = Math.min(stepDistance, (this.offsetY + this.gridRows * this.cellSize - curY));
      if (dirY < 0) stepDistance = Math.min(stepDistance, (curY - this.offsetY));

      // Scan through mirrors along ray
      for (const m of this.mirrors) {
        const mx = this.offsetX + m.col * this.cellSize + this.cellSize / 2;
        const my = this.offsetY + m.row * this.cellSize + this.cellSize / 2;

        const toMx = mx - curX;
        const toMy = my - curY;

        // Is in front of current direction?
        if (dirX !== 0 && Math.sign(toMx) === dirX && Math.abs(toMy) < 4 && Math.abs(toMx) < stepDistance && Math.abs(toMx) > 4) {
          stepDistance = Math.abs(toMx);
          hitMirror = m;
        } else if (dirY !== 0 && Math.sign(toMy) === dirY && Math.abs(toMx) < 4 && Math.abs(toMy) < stepDistance && Math.abs(toMy) > 4) {
          stepDistance = Math.abs(toMy);
          hitMirror = m;
        }
      }

      // Check targets along ray
      for (const t of this.targets) {
        const tx = this.offsetX + t.col * this.cellSize + this.cellSize / 2;
        const ty = this.offsetY + t.row * this.cellSize + this.cellSize / 2;
        const toTx = tx - curX;
        const toTy = ty - curY;

        if (dirX !== 0 && Math.sign(toTx) === dirX && Math.abs(toTy) < 4 && Math.abs(toTx) <= stepDistance) {
          stepDistance = Math.abs(toTx);
          hitTarget = t;
          hitMirror = null;
        } else if (dirY !== 0 && Math.sign(toTy) === dirY && Math.abs(toTx) < 4 && Math.abs(toTy) <= stepDistance) {
          stepDistance = Math.abs(toTy);
          hitTarget = t;
          hitMirror = null;
        }
      }

      nextX = curX + dirX * stepDistance;
      nextY = curY + dirY * stepDistance;

      this.laserSegments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });

      if (hitTarget) {
        hitTarget.powered = true;
        this.addParticles(nextX, nextY, '#10b981', 4);
        break;
      }

      if (hitMirror) {
        // Reflect 90 degrees based on angle
        if (Math.abs(Math.sin(hitMirror.angle)) > 0.5) {
          const temp = dirX;
          dirX = dirY;
          dirY = temp;
        } else {
          const temp = dirX;
          dirX = -dirY;
          dirY = -temp;
        }
        curX = nextX;
        curY = nextY;
      } else {
        // Hit outer wall
        break;
      }
    }
  }

  private addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.3,
        color,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Backdrop
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render Matrix Grid
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= this.gridRows; r++) {
      const y = this.offsetY + r * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, y);
      ctx.lineTo(this.offsetX + this.gridCols * this.cellSize, y);
      ctx.stroke();
    }
    for (let c = 0; c <= this.gridCols; c++) {
      const x = this.offsetX + c * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(x, this.offsetY);
      ctx.lineTo(x, this.offsetY + this.gridRows * this.cellSize);
      ctx.stroke();
    }

    // Outer grid border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 8;
    ctx.strokeRect(this.offsetX, this.offsetY, this.gridCols * this.cellSize, this.gridRows * this.cellSize);
    ctx.shadowBlur = 0;

    // Render Laser Emitter
    const ex = this.offsetX + this.emitter.col * this.cellSize + this.cellSize / 2;
    const ey = this.offsetY + this.emitter.row * this.cellSize + this.cellSize / 2;
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.fillRect(ex - 12, ey - 12, 24, 24);
    ctx.shadowBlur = 0;

    // Render Mirrors
    for (const m of this.mirrors) {
      const mx = this.offsetX + m.col * this.cellSize + this.cellSize / 2;
      const my = this.offsetY + m.row * this.cellSize + this.cellSize / 2;

      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(m.angle);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, this.cellSize * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Mirror reflection plate
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-this.cellSize * 0.3, 0);
      ctx.lineTo(this.cellSize * 0.3, 0);
      ctx.stroke();

      ctx.restore();
    }
    ctx.shadowBlur = 0;

    // Render Targets
    for (const t of this.targets) {
      const tx = this.offsetX + t.col * this.cellSize + this.cellSize / 2;
      const ty = this.offsetY + t.row * this.cellSize + this.cellSize / 2;

      ctx.fillStyle = t.powered ? '#10b981' : '#f43f5e';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = t.powered ? 14 : 6;
      ctx.beginPath();
      ctx.arc(tx, ty, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tx, ty, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Render Laser Beams
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    for (const seg of this.laserSegments) {
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }
}
