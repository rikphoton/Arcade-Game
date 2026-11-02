import React from 'react';
import { CabinetSkinId, PlayerProfile } from '../types/game';
import { CABINET_SKINS } from '../services/storage';
import { sound } from '../services/sound';
import { X, Check, Lock, Sparkles } from 'lucide-react';

interface CabinetArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const CabinetArmoryModal: React.FC<CabinetArmoryModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const handleSelectSkin = (skinId: CabinetSkinId) => {
    sound.playCoin();
    onUpdateProfile((prev) => ({
      ...prev,
      activeSkin: skinId,
    }));
  };

  const handlePurchaseSkin = (skinId: CabinetSkinId, price: number) => {
    if (profile.neonCredits < price) return;
    sound.playPowerup();
    onUpdateProfile((prev) => ({
      ...prev,
      neonCredits: prev.neonCredits - price,
      unlockedSkins: [...prev.unlockedSkins, skinId],
      activeSkin: skinId,
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Cabinet Armory</h2>
              <p className="text-xs text-slate-400">Unlock custom arcade cabinet chassis skins & glows</p>
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

        {/* Skins Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CABINET_SKINS.map((skin) => {
            const isUnlocked = profile.unlockedSkins.includes(skin.id);
            const isEquipped = profile.activeSkin === skin.id;
            const canAfford = profile.neonCredits >= skin.price;

            return (
              <div
                key={skin.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isEquipped
                    ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Color Swatch Preview */}
                  <div
                    className="h-16 rounded-lg mb-3 flex items-center justify-center border border-white/10"
                    style={{
                      background: `linear-gradient(135deg, ${skin.chassisColor} 0%, ${skin.marqueeBg} 100%)`,
                      boxShadow: `inset 0 0 15px ${skin.accentGlow}44`,
                    }}
                  >
                    <span className="font-display font-black text-sm tracking-widest text-white shadow-sm">
                      {skin.name.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{skin.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{skin.description}</p>
                </div>

                <div>
                  {isEquipped ? (
                    <div className="w-full py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>EQUIPPED</span>
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleSelectSkin(skin.id)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      EQUIP
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchaseSkin(skin.id, skin.price)}
                      disabled={!canAfford}
                      className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                        canAfford
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>UNLOCK 💎 {skin.price}</span>
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
