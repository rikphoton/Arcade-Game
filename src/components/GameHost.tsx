import React, { useEffect, useRef, useState } from 'react';
import { ArcadeGameInstance, GameId, GameRuntimeState, InputState, PlayerProfile } from '../types/game';
import { ARCADE_GAMES } from '../games/registry';
import { createGameInstance } from '../games/factory';
import { sound } from '../services/sound';
import { VirtualTouchDeck } from './VirtualTouchDeck';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, Shield, Heart, Zap, Award } from 'lucide-react';

interface GameHostProps {
  gameId: GameId;
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onReturnToHub: () => void;
}

export const GameHost: React.FC<GameHostProps> = ({
  gameId,
  profile,
  onUpdateProfile,
  onReturnToHub,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ArcadeGameInstance | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [hudState, setHudState] = useState<GameRuntimeState>({
    score: 0,
    highScore: 0,
    lives: 3,
    maxLives: 3,
    creditsEarned: 0,
    multiplier: 1,
    level: 1,
    isGameOver: false,
  });

  const [soundMuted, setSoundMuted] = useState(!profile.soundEnabled);

  const inputStateRef = useRef<InputState>({
    moveX: 0,
    moveY: 0,
    action1: false,
    action2: false,
    special: false,
    canvasClick: null,
  });

  const gameDef = ARCADE_GAMES.find((g) => g.id === gameId) || ARCADE_GAMES[0];

  // Initialize and run game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = Math.min(620, Math.max(460, window.innerHeight * 0.65));

    canvas.width = width;
    canvas.height = height;

    const instance = createGameInstance(gameId);
    instance.init(canvas, width, height, profile.techTree);
    gameRef.current = instance;

    // Start background synth OST
    if (profile.soundEnabled) {
      sound.startMusic();
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (!isPaused) {
        instance.update(dt, inputStateRef.current);
        instance.render(ctx);

        const state = instance.getState();
        setHudState(state);

        // Clear one-shot canvas click
        inputStateRef.current.canvasClick = null;

        if (state.isGameOver) {
          // Commit score and credits to profile once
          onUpdateProfile((prev) => {
            const currentStats = prev.gameStats[gameId] || {
              highScore: 0,
              masteryXp: 0,
              masteryLevel: 1,
              gamesPlayed: 0,
            };

            const newHighScore = Math.max(currentStats.highScore, state.score);
            const addedXp = Math.floor(state.score / 10);
            const totalXp = currentStats.masteryXp + addedXp;
            const newLevel = Math.min(10, Math.floor(totalXp / 500) + 1);

            return {
              ...prev,
              neonCredits: prev.neonCredits + state.creditsEarned,
              gameStats: {
                ...prev.gameStats,
                [gameId]: {
                  highScore: newHighScore,
                  masteryXp: totalXp,
                  masteryLevel: newLevel,
                  gamesPlayed: currentStats.gamesPlayed + 1,
                },
              },
            };
          });
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    // Keyboard listener
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setIsPaused((p) => !p);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputStateRef.current.moveX = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputStateRef.current.moveX = 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputStateRef.current.moveY = -1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputStateRef.current.moveY = 1;

      if (e.key === ' ' || e.key === 'Enter') inputStateRef.current.action1 = true;
      if (e.key === 'Shift') inputStateRef.current.action2 = true;
      if (e.key === 'e' || e.key === 'E') inputStateRef.current.special = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) {
        inputStateRef.current.moveX = 0;
      }
      if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) {
        inputStateRef.current.moveY = 0;
      }
      if (e.key === ' ' || e.key === 'Enter') inputStateRef.current.action1 = false;
      if (e.key === 'Shift') inputStateRef.current.action2 = false;
      if (e.key === 'e' || e.key === 'E') inputStateRef.current.special = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize
    const onResize = () => {
      if (!canvas || !container) return;
      const w = container.clientWidth;
      const h = Math.min(620, Math.max(460, window.innerHeight * 0.65));
      canvas.width = w;
      canvas.height = h;
      instance.resize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      sound.stopMusic();
      instance.destroy();
    };
  }, [gameId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    inputStateRef.current.canvasClick = { x, y };
  };

  const handleRestart = () => {
    sound.playCoin();
    setIsPaused(false);
    gameRef.current?.restart();
  };

  const toggleSound = () => {
    setSoundMuted((m) => {
      const next = !m;
      sound.setVolumes(profile.soundVolume, profile.musicVolume, next);
      if (next) sound.stopMusic();
      else sound.startMusic();
      return next;
    });
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Arcade In-Game HUD */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 font-mono z-10">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">SCORE</div>
            <div className="text-lg font-bold font-display text-white font-mono-numbers">
              {hudState.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">STREAK</div>
            <div className="text-base font-bold text-cyan-400 font-mono-numbers">
              {hudState.multiplier}x
            </div>
          </div>
        </div>

        {/* Center Title & Custom Game Stat */}
        <div className="hidden sm:flex flex-col items-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider">{gameDef.title}</span>
          {hudState.customStatLabel && (
            <span className="text-[11px] text-amber-400 font-mono font-semibold">
              {hudState.customStatLabel}: {hudState.customStatValue}
            </span>
          )}
        </div>

        {/* Right Controls: Lives & Pause */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: hudState.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < hudState.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`}
              />
            ))}
          </div>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Sound"
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Pause Game (P / Esc)"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Game Canvas Container with Optional CRT Screen Overlay */}
      <div className={`relative w-full flex justify-center bg-slate-950 ${profile.crtFilterEnabled ? 'crt-screen crt-vignette' : ''}`}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-crosshair max-w-full block"
        />

        {/* In-Game Pause Modal */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30 p-6">
            <h3 className="text-2xl font-bold font-display text-white tracking-widest">PAUSED</h3>
            <p className="text-xs text-slate-400 text-center max-w-sm">
              Controls: {gameDef.controlsDescription.keyboard}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESTART</span>
              </button>
              <button
                onClick={onReturnToHub}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>HUB</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {hudState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30 p-6 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
              {hudState.isVictory ? 'MISSION ACCOMPLISHED' : 'SYSTEM CRASH'}
            </span>
            <h3 className="text-3xl font-extrabold font-display text-white tracking-widest">
              {hudState.isVictory ? 'VICTORY!' : 'GAME OVER'}
            </h3>

            <div className="grid grid-cols-2 gap-4 my-2 p-4 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[280px]">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">FINAL SCORE</div>
                <div className="text-xl font-bold font-display text-white font-mono-numbers">
                  {hudState.score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">CREDITS EARNED</div>
                <div className="text-xl font-bold font-display text-cyan-400 font-mono-numbers">
                  +{hudState.creditsEarned} 💎
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN</span>
              </button>
              <button
                onClick={onReturnToHub}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>RETURN TO HUB</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Centred Ergonomic Mobile Virtual Deck */}
      <VirtualTouchDeck
        gameId={gameId}
        onInputChange={(inp) => {
          inputStateRef.current = { ...inputStateRef.current, ...inp };
        }}
      />
    </div>
  );
};
