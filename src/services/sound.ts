/**
 * Procedural Web Audio Engine for Neon Pulse Arcade
 * 100% synthesized in-browser with zero external MP3/WAV dependencies
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private isMusicPlaying = false;
  private musicIntervalId: number | null = null;
  private musicStep = 0;

  private sfxVolume = 0.7;
  private musicVolume = 0.4;
  private isMuted = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(sfx: number, music: number, muted: boolean) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    this.isMuted = muted;

    if (this.ctx && this.masterGain && this.sfxGain && this.musicGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public playCoin() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    osc2.frequency.setValueAtTime(987.77 * 0.5, now);
    osc2.frequency.setValueAtTime(1318.51 * 0.5, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playShoot() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playLaserHit() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playHit() {
    this.playLaserHit();
  }

  public playExplosion() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Noise buffer for punchy blast
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.3);
  }

  public playPowerup() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const notes = [330, 440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.12);
    });
  }

  public playCombo(streak = 1) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = Math.min(1200, 440 + streak * 40);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playGameOver() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const freqs = [349.23, 311.13, 277.18, 220.0];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.25, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.14 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.2);
    });
  }

  public playEmp() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playFlipper() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Synthwave Background OST
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initCtx();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Bassline notes (A minor progression: A - F - C - G)
    const bassline = [
      110, 110, 220, 110, 110, 110, 220, 164.81,
      87.31, 87.31, 174.61, 87.31, 87.31, 87.31, 174.61, 130.81,
      65.41, 65.41, 130.81, 65.41, 65.41, 65.41, 130.81, 98.0,
      98.0, 98.0, 196.0, 98.0, 98.0, 98.0, 196.0, 146.83,
    ];

    const leadNotes = [
      440, 0, 523.25, 0, 659.25, 0, 587.33, 523.25,
      349.23, 0, 440, 0, 523.25, 0, 440, 0,
      261.63, 0, 329.63, 0, 392.0, 0, 329.63, 0,
      392.0, 0, 493.88, 0, 587.33, 0, 493.88, 0,
    ];

    const stepDuration = 0.15; // 100 BPM 16th notes

    this.musicIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep % bassline.length;

      // Bass note
      const bassFreq = bassline[step];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, now);

        bGain.gain.setValueAtTime(0.18, now);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.9);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bGain);
        bGain.connect(this.musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 0.9);
      }

      // Arpeggiated / Lead note
      const leadFreq = leadNotes[step];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();

        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        lGain.gain.setValueAtTime(0.1, now);
        lGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.7);

        leadOsc.connect(lGain);
        lGain.connect(this.musicGain);

        leadOsc.start(now);
        leadOsc.stop(now + stepDuration * 0.7);
      }

      this.musicStep++;
    }, stepDuration * 1000);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

export const sound = new SoundEngine();
