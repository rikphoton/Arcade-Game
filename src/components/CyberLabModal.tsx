import React from 'react';
import { PlayerProfile, TechTreeState } from '../types/game';
import { TECH_TREE_CONFIG } from '../services/storage';
import { sound } from '../services/sound';
import { X, Cpu, Shield, Zap, Sparkles, ArrowUpRight } from 'lucide-react';

interface CyberLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const CyberLabModal: React.FC<CyberLabModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const handleUpgrade = (key: keyof TechTreeState) => {
    const config = TECH_TREE_CONFIG[key];
    const currentLvl = profile.techTree[key];
    if (currentLvl >= config.maxLevel) return;

    const cost = Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLvl - 1));
    if (profile.neonCredits < cost) return;

    sound.playPowerup();
    onUpdateProfile((prev) => ({
      ...prev,
      neonCredits: prev.neonCredits - cost,
      techTree: {
        ...prev.techTree,
        [key]: prev.techTree[key] + 1,
      },
    }));
  };

  const keys: (keyof TechTreeState)[] = [
    'maxHealthLevel',
    'speedBoostLevel',
    'creditMultiplierLevel',
    'empCooldownLevel',
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Cyber Lab Tech Tree</h2>
              <p className="text-xs text-slate-400">Global permanent system upgrades across all 11 games</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-400">
              💎 {profile.neonCredits.toLocaleString()} NC
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {keys.map((key) => {
            const config = TECH_TREE_CONFIG[key];
            const currentLvl = profile.techTree[key];
            const isMax = currentLvl >= config.maxLevel;
            const cost = isMax
              ? 0
              : Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLvl - 1));
            const canAfford = profile.neonCredits >= cost;

            return (
              <div
                key={key}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white font-display">{config.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      TIER {currentLvl} / {config.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">{config.description}</p>
                  <div className="text-xs font-mono font-semibold text-emerald-400">
                    {config.formatEffect(currentLvl)}
                  </div>
                </div>

                <div>
                  {isMax ? (
                    <span className="px-4 py-2 text-xs font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 rounded-lg inline-block">
                      MAX TIER
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(key)}
                      disabled={!canAfford}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        canAfford
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span>UPGRADE</span>
                      <span className="font-mono">💎 {cost}</span>
                    </button>
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
