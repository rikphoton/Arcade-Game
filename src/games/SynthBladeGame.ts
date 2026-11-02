import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, TechTreeState } from '../types/game';
import { sound } from '../services/sound';

interface Note {
  lane: number; // 0, 1, 2, 3
  y: number;
  hit: boolean;
  missed: boolean;
}

interface FloatingRating {
  text: string;
  color: string;
  x: number;
  y: number;
  life: number;
}

export class SynthBladeGame implements ArcadeGameInstance {
  public id: GameId = 'synth-blade';
  private width = 600;
  private height = 700;

  private notes: Note[] = [];
  private floatingRatings: FloatingRating[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  private hitLineY = 580;
  private laneWidth = 100;
  private startX = 100;
  private noteSpeed = 360;

  private score = 0;
  private highScore = 0;
  private creditsEarned = 0;
  private combo = 0;
  private multiplier = 1;
  private feverMode = false;
  private feverTimer = 0;
  private health = 100;
  private maxHealth = 100;
  private isGameOver = false;

  private spawnTimer = 0;
  private beatStep = 0;

  private lanePressed: boolean[] = [false, false, false, false];
  private prevInputKeys: boolean[] = [false, false, false, false];

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
    this.combo = 0;
    this.multiplier = 1;
    this.feverMode = false;
    this.feverTimer = 0;
    this.maxHealth = 100 + (this.upgrades?.maxHealthLevel - 1) * 25;
    this.health = this.maxHealth;
    this.isGameOver = false;

    this.laneWidth = Math.min(110, (this.width - 40) / 4);
    this.startX = (this.width - this.laneWidth * 4) / 2;
    this.hitLineY = this.height - 110;

    this.notes = [];
    this.floatingRatings = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.beatStep = 0;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.laneWidth = Math.min(110, (width - 40) / 4);
    this.startX = (width - this.laneWidth * 4) / 2;
    this.hitLineY = height - 110;
  }

  public pause() {}
  public resume() {}
  public destroy() {
    this.notes = [];
    this.floatingRatings = [];
    this.particles = [];
  }

  public getState(): GameRuntimeState {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: Math.max(0, Math.ceil(this.health / 25)),
      maxLives: Math.ceil(this.maxHealth / 25),
      creditsEarned: this.creditsEarned,
      multiplier: this.feverMode ? this.multiplier * 2 : this.multiplier,
      level: Math.floor(this.score / 5000) + 1,
      isGameOver: this.isGameOver,
      customStatLabel: this.feverMode ? 'FEVER MODE' : 'COMBO',
      customStatValue: this.feverMode ? '4X FEVER!' : `${this.combo} STREAK`,
    };
  }

  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    if (this.feverMode) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.feverMode = false;
      }
    }

    // Lane press checks
    // D, F, J, K or moveX/moveY
    const currentKeys = [
      input.moveX < -0.4,
      input.moveY > 0.4,
      input.moveY < -0.4,
      input.moveX > 0.4 || input.action1,
    ];

    // Check touch on lane hit buttons
    if (input.canvasClick) {
      const clickLane = Math.floor((input.canvasClick.x - this.startX) / this.laneWidth);
      if (clickLane >= 0 && clickLane < 4) {
        currentKeys[clickLane] = true;
      }
    }

    for (let l = 0; l < 4; l++) {
      if (currentKeys[l] && !this.prevInputKeys[l]) {
        this.hitLane(l);
      }
      this.lanePressed[l] = currentKeys[l];
      this.prevInputKeys[l] = currentKeys[l];
    }

    // Spawn notes in sync with beat
    this.spawnTimer += dt;
    const beatInterval = 0.45;
    if (this.spawnTimer >= beatInterval) {
      this.spawnTimer = 0;
      this.beatStep++;

      // Pattern sequences
      const pattern = [0, 1, 2, 3, 1, 2, 0, 3, 2, 1, 3, 0];
      const lane = pattern[this.beatStep % pattern.length];
      this.notes.push({
        lane,
        y: -30,
        hit: false,
        missed: false,
      });

      if (this.beatStep % 4 === 0 && Math.random() < 0.4) {
        // Dual note
        const lane2 = (lane + 2) % 4;
        this.notes.push({ lane: lane2, y: -30, hit: false, missed: false });
      }
    }

    // Update notes
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      n.y += this.noteSpeed * dt;

      // Check if missed
      if (!n.hit && !n.missed && n.y > this.hitLineY + 50) {
        n.missed = true;
        this.combo = 0;
        this.multiplier = 1;
        this.health -= 15;
        this.showRating('MISS', '#ef4444', this.startX + n.lane * this.laneWidth + this.laneWidth / 2);
        sound.playGameOver();

        if (this.health <= 0) {
          this.isGameOver = true;
        }
      }

      if (n.y > this.height + 40) {
        this.notes.splice(i, 1);
      }
    }

    // Update floating ratings
    for (let i = this.floatingRatings.length - 1; i >= 0; i--) {
      const r = this.floatingRatings[i];
      r.y -= 40 * dt;
      r.life -= dt;
      if (r.life <= 0) this.floatingRatings.splice(i, 1);
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

  private hitLane(lane: number) {
    let closestNote: Note | null = null;
    let minDist = 80;

    for (const n of this.notes) {
      if (n.lane === lane && !n.hit && !n.missed) {
        const dist = Math.abs(n.y - this.hitLineY);
        if (dist < minDist) {
          minDist = dist;
          closestNote = n;
        }
      }
    }

    const noteX = this.startX + lane * this.laneWidth + this.laneWidth / 2;

    if (closestNote) {
      closestNote.hit = true;
      this.combo++;
      this.health = Math.min(this.maxHealth, this.health + 2);

      if (this.combo >= 20 && !this.feverMode) {
        this.feverMode = true;
        this.feverTimer = 10;
        sound.playPowerup();
        this.addParticles(noteX, this.hitLineY, '#facc15', 30);
      }

      if (minDist < 18) {
        // PERFECT!
        this.multiplier = Math.min(4, Math.floor(this.combo / 5) + 1);
        const pts = 200 * (this.feverMode ? 2 : 1) * this.multiplier;
        this.score += pts;
        this.showRating('PERFECT +200', '#22c55e', noteX);
        sound.playCombo(this.multiplier);
        this.addParticles(noteX, this.hitLineY, '#22c55e', 14);
      } else {
        // GREAT!
        this.multiplier = Math.min(3, Math.floor(this.combo / 6) + 1);
        const pts = 100 * (this.feverMode ? 2 : 1) * this.multiplier;
        this.score += pts;
        this.showRating('GREAT +100', '#38bdf8', noteX);
        sound.playLaserHit();
        this.addParticles(noteX, this.hitLineY, '#38bdf8', 8);
      }

      const creditBonus = 1 + (this.upgrades?.creditMultiplierLevel - 1) * 0.25;
      this.creditsEarned += Math.ceil(1 * creditBonus);
    } else {
      // Empty tap
      this.addParticles(noteX, this.hitLineY, '#64748b', 3);
    }
  }

  private showRating(text: string, color: string, x: number) {
    this.floatingRatings.push({
      text,
      color,
      x,
      y: this.hitLineY - 30,
      life: 0.6,
    });
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
    // Backdrop
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    const laneColors = ['#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

    // Render 4 Lanes
    for (let i = 0; i < 4; i++) {
      const lx = this.startX + i * this.laneWidth;

      // Lane fill
      ctx.fillStyle = this.lanePressed[i] ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.4)';
      ctx.fillRect(lx, 0, this.laneWidth, this.height);

      // Lane dividers
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.height);
      ctx.stroke();

      // Key letter indicator at bottom
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px Orbitron';
      ctx.textAlign = 'center';
      const keyLabels = ['D', 'F', 'J', 'K'];
      ctx.fillText(keyLabels[i], lx + this.laneWidth / 2, this.height - 30);
    }

    // Outer lane border
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.strokeRect(this.startX, 0, this.laneWidth * 4, this.height);

    // Hit Line Target
    ctx.strokeStyle = this.feverMode ? '#facc15' : '#a855f7';
    ctx.lineWidth = 4;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.hitLineY);
    ctx.lineTo(this.startX + this.laneWidth * 4, this.hitLineY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Render Notes
    for (const n of this.notes) {
      if (n.hit) continue;
      const nx = this.startX + n.lane * this.laneWidth + 8;
      const nw = this.laneWidth - 16;
      const color = laneColors[n.lane];

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(nx, n.y - 10, nw, 20);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nx + 6, n.y - 4, nw - 12, 8);
    }
    ctx.shadowBlur = 0;

    // Render Floating Evaluation Ratings
    for (const r of this.floatingRatings) {
      ctx.fillStyle = r.color;
      ctx.font = 'bold 18px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(r.text, r.x, r.y);
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }
}
