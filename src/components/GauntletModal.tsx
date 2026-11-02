import React from 'react';
import { GameId, PlayerProfile } from '../types/game';
import { sound } from '../services/sound';
import { X, Flame, Shield, Trophy, Play, Shuffle } from 'lucide-react';

interface GauntletModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onStartGauntlet: () => void;
}

export const GauntletModal: React.FC<GauntletModalProps> = ({
  isOpen,
  onClose,
  profile,
  onStartGauntlet,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Endless Arcade Gauntlet</h2>
              <p className="text-xs text-slate-400">Survive rapid-fire micro-stages across random games</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview & Rules */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <Shuffle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-300 leading-relaxed">
                Every 45 seconds, the system warps you into a new random arcade game. Shields, score, and combo multipliers carry over!
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-300 leading-relaxed">
                Clearing a stage fully restores 1 shield point and grants bonus Neon Credits.
              </p>
            </div>
          </div>

          {/* Player Gauntlet Record */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">RECORD STAGES</div>
              <div className="text-2xl font-bold text-white font-mono-numbers">
                {profile.gauntletRecord.maxStagesCleared} STAGES
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">BEST STREAK</div>
              <div className="text-2xl font-bold text-amber-400 font-mono-numbers">
                {profile.gauntletRecord.bestComboStreak}x COMBO
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              sound.playCoin();
              onStartGauntlet();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-500/25 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START GAUNTLET RUN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
