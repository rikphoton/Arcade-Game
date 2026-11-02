# ⚡ Neon Pulse Arcade

> **Cyberpunk 11-in-1 Retro Arcade Collection with an Interactive 3D Cabinet Showroom, Daily Bounties, Roguelite Meta-Progression, and Procedural Web Audio.**

![Neon Pulse Arcade](https://img.shields.io/badge/Arcade-11%20Playable%20Games-cyan?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-React%2019%20%7C%20Three.js%20%7C%20Tailwind%20v4-purple?style=for-the-badge)
![Audio](https://img.shields.io/badge/Audio-Procedural%20Web%20Audio-emerald?style=for-the-badge)

---

## 🎮 Overview

**Neon Pulse Arcade** is a feature-packed retro-futuristic arcade suite. Explore a neon-drenched 3D arcade hall rendered in Three.js, inspect individual retro arcade cabinets with dynamic CRT marquees, drop tokens, and plunge directly into 11 distinct games spanning bullet-heaven roguelites, high-speed racers, rhythm slashers, flipper pinball, and laser quantum puzzles.

All games feed into a unified roguelite economy: earn **Neon Credits (💎 NC)** to unlock permanent system upgrades in the **Cyber Lab** and equip chassis skins in the **Cabinet Armory**.

---

## 🕹️ The 11 Arcade Titles

| # | Title | Genre | Signature Mechanics |
|---|---|---|---|
| 01 | **🛸 Cyber Survivors** | Bullet-Heaven Roguelite | Fight multiplying drone swarms, collect XP gems, upgrade arsenals (laser whips, plasma orbiters), and trigger screen-clearing **Super Nova EMPs**. |
| 02 | **🚀 Neon Dash** | Gravity Rhythm Runner | High-speed corridor runner with mid-air **Rocket Dashing**, gravity flips, hazard gates, and star pickups that ramp your combo multiplier up to 5x. |
| 03 | **💥 Quantum Breaker** | Hyper Brick Breaker | Laser aim trajectory prediction line, explosive chain reactions, quantum multiball splits, and twin laser power-ups. |
| 04 | **🌠 Astro Pulse** | Vertical Cyber Shmup | Interstellar starfighter shmup with scrolling starfields, 5-way spread cannons, seeking micro-missiles, and multi-phase **Mothership Dreadnought** boss fights. |
| 05 | **🏎️ Neon Drift** | Cyber Highway Racer | Pseudo-3D Outrun-style highway speedway. Ignite twin nitro afterburners, drift around bends, weave past cyber traffic, and rack up near-miss combo multipliers. |
| 06 | **⚡ Hexa-Tron** | Lightcycle Arena | High-stakes arena combat against 3 ruthless AI cycles. Draw lethal light ribbons, deploy aerial phase jumps to vault over ribbons, and drop EMP trail clearers. |
| 07 | **👾 Cyber Pacman** | Cyber Maze Infiltrator | Hyper-kinetic neon maze runner. Devour encrypted data bits, collect Overclock Power Cores to hunt the 4 drone AIs (*RedLine*, *Valkyrie*, *Glitch*, *Chaos*), and discharge stun pulses. |
| 08 | **🎯 Cyber Pinball** *(NEW)* | Neon Physics Flipper | Real-time 2D physics pinball table with kinetic flippers, plasma bumpers, CYBER drop-targets, orbit ramps, and a 3-ball **Multiball Frenzy**. |
| 09 | **🛡️ Voxel Tank Siege** *(NEW)* | Tactical Arena Combat | Dual-stick hover-tank combat with ricocheting plasma shells (up to 2 wall bounces), destructible neon barricades, and deployable proximity mines. |
| 10 | **🎵 Synth Blade** *(NEW)* | Rhythm Beat Slasher | 4-lane beat slasher synced to procedural synthwave drops. Hit notes with precision timing (`PERFECT` / `GREAT`), build streaks, and trigger **Fever Mode**. |
| 11 | **💡 Laser Matrix** *(NEW)* | Quantum Laser Puzzle | Ray-traced 2D laser deflection puzzle. Rotate 45° angle mirrors and beam splitters to guide laser beams into all target quantum cores. |

---

## 🎯 Daily Bounty System

Every day at **00:00 UTC**, a fresh set of deterministic, seeded daily bounties is generated for all players:

- **Seeded Daily Missions**: 3 unique objectives tailored across different arcade titles (e.g. *Score 7,500 in Cyber Pinball*, *Survive 600m in Neon Dash*, *Achieve a 20-streak in Synth Blade*).
- **Real-Time Tracking**: In-game actions and scores dynamically update bounty progress bars while playing.
- **In-Game Completion Toasts**: Instant audio-visual notification appears when an objective is reached.
- **Credit Payouts**: Claim bounties to earn 200–300 💎 NC each.
- **Grand Daily Bonus**: Complete all 3 daily bounties to unlock the **+500 NC Grand Bonus** cache!
- **Reset Countdown**: Built-in live countdown timer shows exact time until the next daily bounty rotation.

---

## 🏛️ Interactive 3D Arcade Cabinet Hall (Three.js)

- **Procedural 3D Cabinets**: Built using composite multi-part procedural models in Three.js (chassis, beveled marquee, coin slots, joystick, pushbuttons, CRT monitor).
- **Camera Damping & Inspection**: Smooth camera gliding between cabinets via mouse drag, arrow buttons, or keyboard.
- **Attract-Mode Previews**: Dynamic procedural canvas textures render live gameplay attract loops onto each cabinet screen.
- **Click-to-Play Raycasting**: Click on any arcade cabinet in the 3D scene to focus and play.
- **2D / 3D Quick Toggle**: Instant switch between the 3D showroom and a high-density 2D catalog grid.

---

## 🏆 Game Modes & Challenges

1. **Standard Arcade**: Play any of the 11 games to set high scores, earn credits, and climb per-game mastery ranks (Level 1–10).
2. **Boss Rush Arena**: Confront elite boss commanders back-to-back with custom mutators:
   - **Speed Frenzy**: +40% enemy and bullet velocity.
   - **Bullet Hell**: Double projectile barrages.
   - **Glass Cannon**: 1 hit point remaining for a 3x score multiplier.
3. **Endless Arcade Gauntlet**: Seamlessly warp between random games every 45 seconds while carrying over your combo streak, score, and remaining shields.

---

## 🧬 Meta-Progression & Economy

- **Neon Credits (💎 NC)**: Earned naturally by playing games, clearing waves, setting combo streaks, and completing daily bounties.
- **Cyber Lab Tech Tree**:
  - *Reinforced Hull & Shields*: +1 to +4 extra starting shield lives.
  - *Overclocked Thrusters*: +8% to +32% agility and movement acceleration.
  - *Crypto Extraction Node*: +25% to +100% bonus Neon Credits harvested.
  - *Super Nova Capacitor*: -15% to -60% EMP cooldown duration.
- **Cabinet Armory**: Unlock and equip 4 cabinet chassis finishes:
  - **Cyber Classic**: Electric cyan and magenta gloss.
  - **Matrix Terminal**: Phosphor green digital rain and scanlines.
  - **Outrun Sunset**: Synthwave sunset amber and magenta.
  - **Monolith Chrome**: Brushed titanium with violet laser piping.

---

## 🎧 Procedural Web Audio Engine

- **100% Zero External Audio Dependencies**: All music and SFX are synthesized on-the-fly using the browser's Web Audio API (`OscillatorNode`, `BiquadFilterNode`, `GainNode`).
- **Dynamic Synthwave OST**: Procedurally generated basslines and arpeggiated synth leads that scale with gameplay intensity.
- **Crisp Sound Effects**: Lasers, shield impacts, explosions, coin-drops, power-ups, flipper mechanics, and combo chimes.
- **Retro CRT Screen**: Toggleable scanline shader and vignette effects for classic monitor aesthetics.

---

## 🎮 Controls Reference

| Action | Desktop Keyboard | Gamepad | Mobile Touch Deck |
|---|---|---|---|
| **Movement / Steering** | `WASD` / Arrow Keys | D-Pad / Left Thumbstick | Horizontally Centered Joystick |
| **Primary Action** (Fire / Jump / Flip / Launch) | `Space` / `Enter` | A / Cross Button | Large Right Action Button |
| **Secondary Action** (Nitro / Boost / Drift / Flipper) | `Shift` | B / Circle / Triggers | Left Boost Button |
| **Special Ability** (EMP / Nova / Stun) | `E` key | X / Square / Y | Right EMP Button |
| **Pause / Resume** | `P` / `Esc` | Start Button | Top Right Pause Button |
| **Direct Steering** | Mouse Drag / Click | N/A | Touch & Drag on Screen |

---

## 🚀 Getting Started & How to Run

### Prerequisites
- Node.js >= 18
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/rikphoton/Fun-Game.git

# Navigate into the project folder
cd Fun-Game

# Install dependencies
npm install
```

### Development Server

```bash
# Start the Vite development server (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Compile and build production-ready bundle into /dist
npm run build

# Preview the production build locally
npm run preview
```

---

## 📁 Repository Structure

```
neon-pulse-arcade/
├── src/
│   ├── components/
│   │   ├── Arcade3DHall.tsx       # Three.js 3D Virtual Cabinet Hall & Showroom
│   │   ├── GameHost.tsx           # Runtime container, loop, HUD, pause & game over
│   │   ├── GameGrid.tsx           # 2D fast catalog grid view
│   │   ├── Header.tsx             # Top Bar Contract header with NC balance
│   │   ├── VirtualTouchDeck.tsx   # Centred ergonomic 3-zone mobile virtual controls
│   │   ├── DailyBountyModal.tsx   # Daily bounty mission matrix & countdown
│   │   ├── CyberLabModal.tsx      # Tech tree permanent upgrade system
│   │   ├── CabinetArmoryModal.tsx # Custom 3D cabinet skins & finishes
│   │   ├── BossRushModal.tsx      # Boss Rush Arena setup & challenge mutators
│   │   ├── GauntletModal.tsx      # Endless Arcade Gauntlet mode
│   │   └── HighScoresModal.tsx    # Global & local arcade leaderboard
│   ├── games/
│   │   ├── registry.ts            # Definitions & metadata for all 11 games
│   │   ├── factory.ts             # Dynamic game engine factory
│   │   ├── CyberSurvivorsGame.ts  # Bullet-heaven roguelite engine
│   │   ├── NeonDashGame.ts        # Gravity rhythm runner engine
│   │   ├── QuantumBreakerGame.ts  # Hyper brick breaker engine
│   │   ├── AstroPulseGame.ts      # Vertical cyber shmup engine
│   │   ├── NeonDriftGame.ts       # Pseudo-3D highway racer engine
│   │   ├── HexaTronGame.ts        # Lightcycle arena engine
│   │   ├── CyberPacmanGame.ts     # Cyber maze infiltrator engine
│   │   ├── CyberPinballGame.ts    # [NEW] Neon flipper pinball engine
│   │   ├── VoxelTankSiegeGame.ts  # [NEW] Tactical tank combat engine
│   │   ├── SynthBladeGame.ts      # [NEW] 4-lane rhythm beat slasher engine
│   │   └── LaserMatrixGame.ts     # [NEW] Quantum laser puzzle engine
│   ├── services/
│   │   ├── sound.ts               # Procedural Web Audio synthesizer engine
│   │   ├── storage.ts             # Local persistence & economy profile
│   │   └── bountyService.ts       # Deterministic daily bounty generator & evaluator
│   ├── types/
│   │   └── game.ts                # TypeScript interfaces, contracts & state models
│   ├── App.tsx                    # Root application component & routing
│   ├── index.css                  # Tailwind CSS, custom fonts & CRT scanlines
│   └── main.tsx                   # React 19 application entry point
├── index.html                     # HTML5 shell, SEO metadata & Google Fonts
├── metadata.json                  # AI Studio application metadata
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # TypeScript compiler options
└── vite.config.ts                 # Vite bundler configuration
```

---

## 📜 License

MIT License. Designed and built with ❤️ for retro arcade and cyberpunk gaming fans!
