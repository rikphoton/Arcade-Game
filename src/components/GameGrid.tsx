import React from 'react';
import { ARCADE_GAMES } from '../games/registry';
import { GameId, PlayerProfile } from '../types/game';
import { Play, Trophy, Sparkles, Flame } from 'lucide-react';
import { sound } from '../services/sound';

interface GameGridProps {
  onSelectGame: (id: GameId) => void;
  onLaunchGame: (id: GameId) => void;
  profile: PlayerProfile;
}

export const GameGrid: React.FC<GameGridProps> = ({ onSelectGame, onLaunchGame, profile }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {ARCADE_GAMES.map((game, index) => {
        const stats = profile.gameStats[game.id];
        const highScore = stats?.highScore || 0;
        const masteryLvl = stats?.masteryLevel || 1;

        return (
          <div
            key={game.id}
            className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-cyan-500/5 text-left"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  0{index + 1} · {game.genre}
                </span>
                {game.isNew && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/40">
                    NEW
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <h3 className="text-lg font-bold font-display text-white group-hover:text-cyan-400 transition-colors mb-1">
                {game.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{game.description}</p>
            </div>

            <div>
              {/* Stats Bar */}
              <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-4 font-mono-numbers">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>HI: {highScore.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 font-mono text-[11px]">
                  <span>LVL {masteryLvl}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playCoin();
                    onLaunchGame(game.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500/15 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/30 font-semibold text-xs rounded-lg transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY NOW</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
