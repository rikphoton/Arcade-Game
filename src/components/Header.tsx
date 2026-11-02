import React from 'react';
import { PlayerProfile } from '../types/game';
import { Monitor, Cpu, Trophy, Sparkles, Skull, Flame, Target } from 'lucide-react';

interface HeaderProps {
  profile: PlayerProfile;
  onOpenCyberLab: () => void;
  onOpenArmory: () => void;
  onOpenDailyBounties: () => void;
  onOpenHighScores: () => void;
  onOpenBossRush: () => void;
  onOpenGauntlet: () => void;
  onToggleCrt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenCyberLab,
  onOpenArmory,
  onOpenDailyBounties,
  onOpenHighScores,
  onOpenBossRush,
  onOpenGauntlet,
  onToggleCrt,
}) => {
  const claimableCount =
    profile.dailyBounties?.bounties.filter((b) => b.isCompleted && !b.isClaimed).length || 0;
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element brand wordmark */}
      <a href="#" className="text-lg font-black tracking-wider text-cyan-400 font-display whitespace-nowrap shrink-0 hover:text-cyan-300 transition-colors">
        NEON PULSE ARCADE
      </a>

      {/* Zone 2: 4-5 clean single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
        <button
          onClick={onOpenCyberLab}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cyber Lab</span>
        </button>
        <button
          onClick={onOpenDailyBounties}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 relative"
        >
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span>Daily Bounties</span>
          {claimableCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono text-[9px] flex items-center justify-center animate-pulse">
              {claimableCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenArmory}
          className="hover:text-purple-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Cabinet Armory</span>
        </button>
        <button
          onClick={onOpenBossRush}
          className="hover:text-rose-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>Boss Rush</span>
        </button>
        <button
          onClick={onOpenGauntlet}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Endless Gauntlet</span>
        </button>
        <button
          onClick={onOpenHighScores}
          className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Leaderboard</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action with NC balance and CRT toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleCrt}
          className={`p-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
            profile.crtFilterEnabled
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle CRT Scanline Overlay"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CRT {profile.crtFilterEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={onOpenCyberLab}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-inner"
        >
          <span className="text-cyan-400">💎</span>
          <span>{profile.neonCredits.toLocaleString()} NC</span>
        </button>
      </div>
    </header>
  );
};
