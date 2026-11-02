import React, { useState } from 'react';
import { GameId } from '../types/game';
import { sound } from '../services/sound';
import { X, Flame, ShieldAlert, Zap, Skull, Play } from 'lucide-react';

interface BossRushModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBossRush: (gameId: GameId, mutators: { speedFrenzy: boolean; bulletHell: boolean; glassCannon: boolean }) => void;
}

export const BossRushModal: React.FC<BossRushModalProps> = ({
  isOpen,
  onClose,
  onStartBossRush,
}) => {
  const [speedFrenzy, setSpeedFrenzy] = useState(false);
  const [bulletHell, setBulletHell] = useState(true);
  const [glassCannon, setGlassCannon] = useState(false);

  if (!isOpen) return null;

  const handleLaunch = () => {
    sound.playCoin();
    // Launch directly into Astro Pulse in Boss Wave mode
    onStartBossRush('astro-pulse', { speedFrenzy, bulletHell, glassCannon });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Boss Rush Arena</h2>
              <p className="text-xs text-slate-400">Confront elite Dreadnoughts & AI commanders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mutator Toggles */}
        <div className="p-6 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
            CHALLENGE MUTATORS
          </div>

          {/* Mutator 1: Speed Frenzy */}
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-white">Speed Frenzy</div>
                <div className="text-xs text-slate-400">+40% Boss & Projectile Velocity</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={speedFrenzy}
              onChange={(e) => setSpeedFrenzy(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 accent-rose-500 bg-slate-800 border-slate-700"
            />
          </label>

          {/* Mutator 2: Bullet Hell */}
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-sm font-semibold text-white">Bullet Hell Swarm</div>
                <div className="text-xs text-slate-400">Bosses discharge dual spread barrages</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={bulletHell}
              onChange={(e) => setBulletHell(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 accent-rose-500 bg-slate-800 border-slate-700"
            />
          </label>

          {/* Mutator 3: Glass Cannon */}
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <div>
                <div className="text-sm font-semibold text-white">Glass Cannon (High Stakes)</div>
                <div className="text-xs text-slate-400">1 Hit Point Remaining · 3x Score Multiplier</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={glassCannon}
              onChange={(e) => setGlassCannon(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 accent-rose-500 bg-slate-800 border-slate-700"
            />
          </label>
        </div>

        {/* Footer Launch */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleLaunch}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-rose-600/25 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>ENTER BOSS ARENA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
