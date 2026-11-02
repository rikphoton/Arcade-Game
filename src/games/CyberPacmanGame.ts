import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface DroneGhost {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  color: string;
  name: string;
}

export class CyberPacmanGame implements ArcadeGameInstance {
  public id: GameId = 'cyber-pacman';
  private width = 800;
  private height = 600;

  private playerX = 400;
  private playerY = 300;
  private playerDirX = 0;
  private playerDirY = 0;
  private nextDirX = 0;
  private nextDirY = 0;
  private playerSpeed = 190;
  private mouthAngle = 0.2;

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private lives = 3;
  private maxLives = 3;
  private multiplier = 1;
  private level = 1;
  private isGameOver = false;

  private overclockTime = 0;
  private stunPulseCharges = 2;

  private gridCols = 19;
  private gridRows = 15;
  private cellSize = 36;
  private offsetX = 50;
  private offsetY = 30;

  // 1 = Wall, 0 = Dot, 2 = Power Core, 3 = Empty
  private maze: number[][] = [];
  private ghosts: DroneGhost[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

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
    this.maxLives = 3 + (this.upgrades?.maxHealthLevel - 1);
    this.lives = this.maxLives;
    this.playerSpeed = 190 * (1 + (this.upgrades?.speedBoostLevel - 1) * 0.08);
    this.stunPulseCharges = 2;
    this.overclockTime = 0;
    this.isGameOver = false;

    this.particles = [];
    this.buildMaze();
    this.resetPositions();
  }

  private buildMaze() {
    this.cellSize = Math.min(36, Math.floor((this.height - 80) / this.gridRows));
    this.offsetX = Math.floor((this.width - this.gridCols * this.cellSize) / 2);
    this.offsetY = Math.floor((this.height - this.gridRows * this.cellSize) / 2);

    // Symmetric classic arcade layout
    const template = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 3, 3, 3, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    this.maze = template.map((row) => [...row]);
  }

  private resetPositions() {
    const startCol = 9;
    const startRow = 10;
    this.playerX = this.offsetX + startCol * this.cellSize + this.cellSize / 2;
    this.playerY = this.offsetY + startRow * this.cellSize + this.cellSize / 2;
    this.playerDirX = 0;
    this.playerDirY = 0;
    this.nextDirX = 0;
    this.nextDirY = 0;

    const ghostSpeed = 130 * (1 + (this.level - 1) * 0.05);
    this.ghosts = [
      { x: this.offsetX + 8 * this.cellSize + this.cellSize / 2, y: this.offsetY + 7 * this.cellSize + this.cellSize / 2, dirX: 1, dirY: 0, speed: ghostSpeed, color: '#ef4444', name: 'RedLine' },
      { x: this.offsetX + 9 * this.cellSize + this.cellSize / 2, y: this.offsetY + 7 * this.cellSize + this.cellSize / 2, dirX: -1, dirY: 0, speed: ghostSpeed, color: '#ec4899', name: 'Valkyrie' },
      { x: this.offsetX + 10 * this.cellSize + this.cellSize / 2, y: this.offsetY + 7 * this.cellSize + this.cellSize / 2, dirX: 0, dirY: 1, speed: ghostSpeed, color: '#06b6d4', name: 'Glitch' },
      { x: this.offsetX + 9 * this.cellSize + this.cellSize / 2, y: this.offsetY + 6 * this.cellSize + this.cellSize / 2, dirX: 0, dirY: -1, speed: ghostSpeed, color: '#f59e0b', name: 'Chaos' },
    ];
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.buildMaze();
    this.resetPositions();
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.ghosts = [];
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
      level: this.level,
      isGameOver: this.isGameOver,
      customStatLabel: this.overclockTime > 0 ? 'OVERCLOCK' : 'STUN EMP',
      customStatValue: this.overclockTime > 0 ? `${Math.ceil(this.overclockTime)}s` : `${this.stunPulseCharges} READY`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    if (this.overclockTime > 0) {
      this.overclockTime -= dt;
    }

    // Direction input
    if (input.moveX > 0.4) { this.nextDirX = 1; this.nextDirY = 0; }
    else if (input.moveX < -0.4) { this.nextDirX = -1; this.nextDirY = 0; }
    else if (input.moveY > 0.4) { this.nextDirX = 0; this.nextDirY = 1; }
    else if (input.moveY < -0.4) { this.nextDirX = 0; this.nextDirY = -1; }

    // Stun pulse EMP
    if (input.special && this.stunPulseCharges > 0) {
      this.stunPulseCharges--;
      sound.playEmp();
      this.addParticles(this.playerX, this.playerY, '#06b6d4', 30);
      for (const g of this.ghosts) {
        g.dirX = -g.dirX;
        g.dirY = -g.dirY;
      }
    }

    // Try applying next direction if aligned to cell
    const cellCol = Math.floor((this.playerX - this.offsetX) / this.cellSize);
    const cellRow = Math.floor((this.playerY - this.offsetY) / this.cellSize);
    const cellCenterX = this.offsetX + cellCol * this.cellSize + this.cellSize / 2;
    const cellCenterY = this.offsetY + cellRow * this.cellSize + this.cellSize / 2;

    if (Math.abs(this.playerX - cellCenterX) < 4 && Math.abs(this.playerY - cellCenterY) < 4) {
      const nextCol = cellCol + this.nextDirX;
      const nextRow = cellRow + this.nextDirY;
      if (this.isPassable(nextCol, nextRow)) {
        this.playerDirX = this.nextDirX;
        this.playerDirY = this.nextDirY;
        this.playerX = cellCenterX;
        this.playerY = cellCenterY;
      }
    }

    // Move player if path clear
    const targetCol = cellCol + this.playerDirX;
    const targetRow = cellRow + this.playerDirY;
    if (this.isPassable(targetCol, targetRow) || (Math.abs(this.playerX - cellCenterX) > 2 || Math.abs(this.playerY - cellCenterY) > 2)) {
      this.playerX += this.playerDirX * this.playerSpeed * dt;
      this.playerY += this.playerDirY * this.playerSpeed * dt;
    }

    // Devour dot or power core
    if (cellRow >= 0 && cellRow < this.gridRows && cellCol >= 0 && cellCol < this.gridCols) {
      const tile = this.maze[cellRow][cellCol];
      if (tile === 0) {
        // Regular dot
        this.maze[cellRow][cellCol] = 3;
        this.score += 10 * this.multiplier;
        sound.playLaserHit();
      } else if (tile === 2) {
        // Overclock Power Core!
        this.maze[cellRow][cellCol] = 3;
        this.score += 150 * this.multiplier;
        this.overclockTime = 8;
        const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
        this.creditsEarned += Math.ceil(5 * creditBonus);
        sound.playPowerup();
        this.addParticles(this.playerX, this.playerY, '#facc15', 20);
      }
    }

    // Check if all dots eaten (Level victory)
    let dotsRemaining = 0;
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.maze[r][c] === 0 || this.maze[r][c] === 2) dotsRemaining++;
      }
    }
    if (dotsRemaining === 0) {
      this.level++;
      this.score += 2000 * this.multiplier;
      sound.playPowerup();
      this.buildMaze();
      this.resetPositions();
    }

    // Update ghosts
    for (const g of this.ghosts) {
      const gCol = Math.floor((g.x - this.offsetX) / this.cellSize);
      const gRow = Math.floor((g.y - this.offsetY) / this.cellSize);
      const gCenterX = this.offsetX + gCol * this.cellSize + this.cellSize / 2;
      const gCenterY = this.offsetY + gRow * this.cellSize + this.cellSize / 2;

      if (Math.abs(g.x - gCenterX) < 3 && Math.abs(g.y - gCenterY) < 3) {
        // Choose available direction
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ].filter((d) => this.isPassable(gCol + d.dx, gRow + d.dy) && !(d.dx === -g.dirX && d.dy === -g.dirY));

        if (dirs.length > 0) {
          const chosen = dirs[Math.floor(Math.random() * dirs.length)];
          g.dirX = chosen.dx;
          g.dirY = chosen.dy;
        } else {
          g.dirX = -g.dirX;
          g.dirY = -g.dirY;
        }
        g.x = gCenterX;
        g.y = gCenterY;
      }

      const spd = this.overclockTime > 0 ? g.speed * 0.6 : g.speed;
      g.x += g.dirX * spd * dt;
      g.y += g.dirY * spd * dt;

      // Check collision with player
      if (Math.hypot(g.x - this.playerX, g.y - this.playerY) < 22) {
        if (this.overclockTime > 0) {
          // Devour drone!
          this.score += 400 * this.multiplier;
          sound.playExplosion();
          this.addParticles(g.x, g.y, '#38bdf8', 18);
          // Respawn ghost at center
          g.x = this.offsetX + 9 * this.cellSize + this.cellSize / 2;
          g.y = this.offsetY + 7 * this.cellSize + this.cellSize / 2;
        } else {
          // Player hit
          this.lives--;
          sound.playGameOver();
          this.addParticles(this.playerX, this.playerY, '#ef4444', 25);
          if (this.lives <= 0) {
            this.isGameOver = true;
          } else {
            this.resetPositions();
          }
          break;
        }
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

  private isPassable(col: number, row: number): boolean {
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return false;
    return this.maze[row][col] !== 1;
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
        life: 0.35,
        color,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Clear
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render Maze Walls & Dots
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const x = this.offsetX + c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;
        const tile = this.maze[r][c];

        if (tile === 1) {
          // Neon Wall
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 6;
          ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
          ctx.shadowBlur = 0;
        } else if (tile === 0) {
          // Data dot
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 2) {
          // Power Core
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Render Ghosts
    for (const g of this.ghosts) {
      ctx.fillStyle = this.overclockTime > 0 ? '#38bdf8' : g.color;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(g.x, g.y - 2, 10, Math.PI, 0, false);
      ctx.lineTo(g.x + 10, g.y + 10);
      ctx.lineTo(g.x - 10, g.y + 10);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(g.x - 4, g.y - 2, 3, 0, Math.PI * 2);
      ctx.arc(g.x + 4, g.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Render Player
    if (!this.isGameOver) {
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, 12, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.lineTo(this.playerX, this.playerY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }
}
