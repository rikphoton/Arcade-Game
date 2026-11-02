import React, { useState, useEffect } from 'react';
import { DailyBounty, GameId, PlayerProfile } from '../types/game';
import { getTimeUntilNextReset, GRAND_BONUS_REWARD } from '../services/bountyService';
import { sound } from '../services/sound';
import { ARCADE_GAMES } from '../games/registry';
import { X, Target, Clock, Gift, CheckCircle2, Play, Sparkles } from 'lucide-react';

interface DailyBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onLaunchGame: (id: GameId) => void;
}

export const DailyBountyModal: React.FC<DailyBountyModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onLaunchGame,
}) => {
  const [resetTimer, setResetTimer] = useState(getTimeUntilNextReset());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setResetTimer(getTimeUntilNextReset());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const bounties: DailyBounty[] = profile.dailyBounties?.bounties || [];
  const allCompleted = bounties.length > 0 && bounties.every((b) => b.isCompleted);
  const claimedAllBonus = profile.dailyBounties?.claimedAllBonus || false;

  const handleClaimBounty = (bountyId: string, reward: number) => {
    sound.playPowerup();
    onUpdateProfile((prev) => {
      if (!prev.dailyBounties) return prev;
      const updatedBounties = prev.dailyBounties.bounties.map((b) =>
        b.id === bountyId ? { ...b, isClaimed: true } : b
      );

      return {
        ...prev,
        neonCredits: prev.neonCredits + reward,
        dailyBounties: {
          ...prev.dailyBounties,
          bounties: updatedBounties,
        },
      };
    });
  };

  const handleClaimGrandBonus = () => {
    sound.playPowerup();
    onUpdateProfile((prev) => {
      if (!prev.dailyBounties) return prev;
      return {
        ...prev,
        neonCredits: prev.neonCredits + GRAND_BONUS_REWARD,
        dailyBounties: {
          ...prev.dailyBounties,
          claimedAllBonus: true,
        },
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Daily Bounty Matrix</h2>
              <p className="text-xs text-slate-400">Daily seeded challenges for Cyber Lab tech credits</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Reset Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{resetTimer}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Grand Bonus Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              allCompleted
                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950/50 border-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  allCompleted ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white font-display">Daily Grand Bounty Bonus</h4>
                  <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                    +500 NC
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Complete all 3 daily bounties to unlock the grand credit cache
                </p>
              </div>
            </div>

            <div>
              {claimedAllBonus ? (
                <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CLAIMED</span>
                </div>
              ) : allCompleted ? (
                <button
                  onClick={handleClaimGrandBonus}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
                >
                  CLAIM +500 NC
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-500">
                  {bounties.filter((b) => b.isCompleted).length} / {bounties.length} DONE
                </span>
              )}
            </div>
          </div>

          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pt-1">
            TODAY'S MISSIONS
          </div>

          {/* 3 Seeded Bounties */}
          {bounties.map((bounty) => {
            const gameDef = bounty.gameId ? ARCADE_GAMES.find((g) => g.id === bounty.gameId) : null;
            const progressPercent = Math.min(100, Math.floor((bounty.current / bounty.target) * 100));

            return (
              <div
                key={bounty.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{bounty.title}</h4>
                      {gameDef && (
                        <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                          {gameDef.title}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{bounty.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      +{bounty.rewardCredits} NC
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-200 font-mono-numbers">
                      {bounty.current.toLocaleString()} / {bounty.target.toLocaleString()} {bounty.unit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        bounty.isCompleted ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1">
                  {gameDef ? (
                    <button
                      onClick={() => {
                        sound.playCoin();
                        onLaunchGame(gameDef.id);
                        onClose();
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Launch {gameDef.title}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Cross-arcade challenge</span>
                  )}

                  {bounty.isClaimed ? (
                    <span className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>CLAIMED</span>
                    </span>
                  ) : bounty.isCompleted ? (
                    <button
                      onClick={() => handleClaimBounty(bounty.id, bounty.rewardCredits)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      CLAIM +{bounty.rewardCredits} NC
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">IN PROGRESS</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
