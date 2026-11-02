import React from 'react';
import { PlayerProfile } from '../types/game';
import { ARCADE_GAMES } from '../games/registry';
import { X, Trophy, Medal, Star } from 'lucide-react';

interface HighScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({ isOpen, onClose, profile }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Arcade Hall of Fame</h2>
              <p className="text-xs text-slate-400">High scores and mastery rankings for all 11 games</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High Scores List */}
        <div className="p-6 overflow-y-auto space-y-2.5">
          {ARCADE_GAMES.map((game, i) => {
            const stats = profile.gameStats[game.id];
            const score = stats?.highScore || 0;
            const level = stats?.masteryLevel || 1;

            return (
              <div
                key={game.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-mono text-xs font-bold text-slate-500">
                    {i + 1 < 10 ? `0${i + 1}` : i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white font-display flex items-center gap-2">
                      <span>{game.title}</span>
                      {game.isNew && (
                        <span className="text-[9px] font-bold text-pink-400 px-1.5 py-0.5 rounded bg-pink-500/20 border border-pink-500/30">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{game.genre}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right font-mono">
                  <div>
                    <div className="text-xs font-bold text-cyan-400">LVL {level}</div>
                    <div className="text-[10px] text-slate-500">MASTERY</div>
                  </div>
                  <div className="min-w-[90px]">
                    <div className="text-sm font-bold text-white font-mono-numbers">
                      {score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-400 font-semibold">HIGH SCORE</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
