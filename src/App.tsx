/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameId, PlayerProfile } from './types/game';
import { ARCADE_GAMES } from './games/registry';
import { loadProfile, saveProfile } from './services/storage';
import { syncDailyBounties } from './services/bountyService';
import { sound } from './services/sound';
import { Header } from './components/Header';
import { Arcade3DHall } from './components/Arcade3DHall';
import { GameGrid } from './components/GameGrid';
import { GameHost } from './components/GameHost';
import { CyberLabModal } from './components/CyberLabModal';
import { CabinetArmoryModal } from './components/CabinetArmoryModal';
import { BossRushModal } from './components/BossRushModal';
import { GauntletModal } from './components/GauntletModal';
import { HighScoresModal } from './components/HighScoresModal';
import { DailyBountyModal } from './components/DailyBountyModal';
import { Play, Grid, Box, Sparkles, Trophy, Flame, Skull, Shield, Target } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => syncDailyBounties(loadProfile()));
  const [currentView, setCurrentView] = useState<'HUB' | 'PLAYING'>('HUB');
  const [hubMode, setHubMode] = useState<'3D' | '2D'>('3D');
  const [selectedGameId, setSelectedGameId] = useState<GameId>('cyber-survivors');

  // Modals
  const [cyberLabOpen, setCyberLabOpen] = useState(false);
  const [armoryOpen, setArmoryOpen] = useState(false);
  const [bossRushOpen, setBossRushOpen] = useState(false);
  const [gauntletOpen, setGauntletOpen] = useState(false);
  const [highScoresOpen, setHighScoresOpen] = useState(false);
  const [bountyModalOpen, setBountyModalOpen] = useState(false);

  // Gauntlet / Special modes
  const [isGauntletActive, setIsGauntletActive] = useState(false);
  const [gauntletStage, setGauntletStage] = useState(1);

  // Sync profile to local storage on change
  const handleUpdateProfile = (updater: (prev: PlayerProfile) => PlayerProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      saveProfile(next);
      return next;
    });
  };

  const handleLaunchGame = (id: GameId) => {
    setSelectedGameId(id);
    setCurrentView('PLAYING');
  };

  const handleReturnToHub = () => {
    setCurrentView('HUB');
    setIsGauntletActive(false);
  };

  const handleStartGauntlet = () => {
    setIsGauntletActive(true);
    setGauntletStage(1);
    const randomGame = ARCADE_GAMES[Math.floor(Math.random() * ARCADE_GAMES.length)].id;
    handleLaunchGame(randomGame);
  };

  const handleStartBossRush = (gameId: GameId) => {
    handleLaunchGame(gameId);
  };

  const handleToggleCrt = () => {
    handleUpdateProfile((prev) => ({
      ...prev,
      crtFilterEnabled: !prev.crtFilterEnabled,
    }));
  };

  const activeGame = ARCADE_GAMES.find((g) => g.id === selectedGameId) || ARCADE_GAMES[0];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Header */}
      <Header
        profile={profile}
        onOpenCyberLab={() => setCyberLabOpen(true)}
        onOpenArmory={() => setArmoryOpen(true)}
        onOpenDailyBounties={() => setBountyModalOpen(true)}
        onOpenHighScores={() => setHighScoresOpen(true)}
        onOpenBossRush={() => setBossRushOpen(true)}
        onOpenGauntlet={() => setGauntletOpen(true)}
        onToggleCrt={handleToggleCrt}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {currentView === 'HUB' ? (
          <>
            {/* Hero Banner / Mode Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-slate-800/80">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                  CYBERPUNK NEON ARCADIA
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  11 playable arcade titles · 3D interactive showroom · Roguelite meta-progression
                </p>
              </div>

              {/* View Switcher: 3D Cabinet Showroom vs 2D Quick Grid */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  onClick={() => setHubMode('3D')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    hubMode === '3D'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Hall</span>
                </button>
                <button
                  onClick={() => setHubMode('2D')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    hubMode === '2D'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>2D Grid</span>
                </button>
              </div>
            </div>

            {/* Hub View Mode */}
            {hubMode === '3D' ? (
              <Arcade3DHall
                selectedGameId={selectedGameId}
                onSelectGame={setSelectedGameId}
                onLaunchGame={handleLaunchGame}
                activeSkin={profile.activeSkin}
                onOpenSkinsModal={() => setArmoryOpen(true)}
                onToggleGridView={() => setHubMode('2D')}
              />
            ) : (
              <GameGrid
                profile={profile}
                onSelectGame={setSelectedGameId}
                onLaunchGame={handleLaunchGame}
              />
            )}

            {/* Quick Challenge Strips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div
                onClick={() => setBountyModalOpen(true)}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                      Daily Bounties
                    </h3>
                    <p className="text-xs text-slate-400">Earn up to 1,250 NC every day</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">VIEW →</span>
              </div>

              <div
                onClick={() => setBossRushOpen(true)}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Skull className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                      Boss Rush Arena
                    </h3>
                    <p className="text-xs text-slate-400">Challenge elite dreadnoughts</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">ENTER →</span>
              </div>

              <div
                onClick={() => setGauntletOpen(true)}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      Endless Gauntlet
                    </h3>
                    <p className="text-xs text-slate-400">Multi-game streak survival</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">PLAY →</span>
              </div>

              <div
                onClick={() => setCyberLabOpen(true)}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                      Cyber Lab Tech
                    </h3>
                    <p className="text-xs text-slate-400">Permanent system upgrades</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">UPGRADE →</span>
              </div>
            </div>
          </>
        ) : (
          /* Active Game View */
          <div className="w-full flex flex-col items-center">
            <GameHost
              gameId={selectedGameId}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onReturnToHub={handleReturnToHub}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <CyberLabModal
        isOpen={cyberLabOpen}
        onClose={() => setCyberLabOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      <CabinetArmoryModal
        isOpen={armoryOpen}
        onClose={() => setArmoryOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      <DailyBountyModal
        isOpen={bountyModalOpen}
        onClose={() => setBountyModalOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onLaunchGame={handleLaunchGame}
      />

      <BossRushModal
        isOpen={bossRushOpen}
        onClose={() => setBossRushOpen(false)}
        onStartBossRush={handleStartBossRush}
      />

      <GauntletModal
        isOpen={gauntletOpen}
        onClose={() => setGauntletOpen(false)}
        profile={profile}
        onStartGauntlet={handleStartGauntlet}
      />

      <HighScoresModal
        isOpen={highScoresOpen}
        onClose={() => setHighScoresOpen(false)}
        profile={profile}
      />
    </div>
  );
}
