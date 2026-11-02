# Neon Pulse Arcade: 11-Game Evolution & 3D Cyber Hall

An overhaul and massive expansion of the `neon-pulse-arcade` codebase, expanding the retro-futuristic arcade from 7 to 11 games, integrating a Three.js 3D Virtual Arcade Cabinet Hub with custom cabinet skins, and introducing Boss Rush and Endless Multi-Game Gauntlet modes.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following choices were confirmed during requirement clarification and establish the core scope of this project:

- **Confirmed Decision 1 (Game Library Expansion)**: Add all four new arcade games (**Cyber Pinball**, **Voxel Tank Siege**, **Synth Blade Rhythm Slasher**, and **Laser Matrix Puzzle**) alongside the 7 original titles (**Cyber Survivors**, **Neon Dash**, **Quantum Breaker**, **Astro Pulse**, **Neon Drift**, **Hexa-Tron**, and **Cyber Pacman**), bringing the collection to 11 distinct games.
- **Confirmed Decision 2 (Advanced Challenge Modes)**: Introduce **Boss Rush Arena** (consecutive mothership, rogue AI, and boss encounters with tactical difficulty mutators) and **Endless Arcade Gauntlet** (seamless rapid-fire transitions between games where shields and combo streaks carry over).
- **Confirmed Decision 3 (Immersion & Hub Presentation)**: Build an interactive **3D Virtual Arcade Cabinet Hall Hub** where players can inspect themed neon arcade cabinets in 3D, switch between custom cabinet art skins, drop virtual tokens, and launch directly into 60 FPS gameplay.
- **Open Decision / Recommended Default (Audio & Input Architecture)**: Retain the procedural Web Audio synthesizer engine (zero external audio dependencies) and provide dual control interfaces: full desktop keyboard/gamepad mapping alongside the centred 3-zone ergonomic mobile virtual deck.

---

## 1. Overview & Core Concept

- **What It Does**: Neon Pulse Arcade is an all-in-one cyberpunk retro arcade experience. Players can explore a 3D neon arcade hall, inspect physical-style arcade cabinets with customizable neon trim and marquee art, insert tokens, and dive into 11 high-octane 2D/pseudo-3D arcade games. Games award Neon Credits (💎 NC) that feed into the global Cyber Lab tech tree and unlock cabinet skins, CRT filters, and synth themes.
- **Target Audience / Persona**: Retro gaming enthusiasts, roguelite action players, and casual gamers looking for instant-play arcade thrills across desktop and mobile devices.
- **Key Value**: Preserves and polishes all 7 classic arcade titles from `rikphoton/Fun-Game` while delivering 4 new game genres, 2 overarching challenge modes, and a 3D cabinet showroom without bloated external assets or loading times.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Arcade Hall Exploration (Hub View)**:
   - Player arrives at the 3D Arcade Hall featuring 11 illuminated arcade cabinets lined up in a moody neon pavilion with floor reflections.
   - Using mouse drag, keyboard arrows, or touch swipe, the camera smoothly pans between cabinets.
   - The selected cabinet features an animated CRT screen showing live gameplay previews, high scores, mastery level, and a "Press Start / Insert Coin" prompt.
   - Quick 2D view toggle is available for players who prefer a traditional fast grid selector.

2. **Cabinet Customization & Armory**:
   - In the cabinet view, players can open the Skin Customizer to apply unlocked finishes (Classic Cyberpunk Cyan/Magenta, Matrix Phosphor Green, Outrun Sunset Amber, or Monolithic Chrome).

3. **Active Gameplay (11 Arcade Titles)**:
   - Launching a game transitions the camera smoothly into the cabinet screen or full-screen playfield.
   - HUD displays real-time score, multiplier, remaining shields, and neon credits earned.
   - Seamless pause menu with instant resume, restart, control mapping guide, and audio volume sliders.

4. **Boss Rush & Endless Gauntlet**:
   - **Boss Rush**: Select difficulty modifiers (Speed Frenzy, Bullet Hell, Glass Cannon) and battle bosses across Astro Pulse, Cyber Survivors, and Tank Siege consecutively.
   - **Endless Gauntlet**: Play 60-second survival micro-stages across random games. Clearing objectives warps the player into the next arcade cabinet with accumulated multiplier bonuses.

### Visual Identity & Theme

- **Aesthetic Direction**: Neo-Tokyo 2099 cyberpunk meets high-end arcade hardware. Sleek dark metallic cabinet chassis, vibrant electroluminescent vector lines, and nostalgic arcade phosphor glows without visual clutter.
- **Color Palette & Discipline (60-30-10)**:
  - *60% Dominant Neutral Canvas*: Deep obsidian (`#090D16`) and deep space slate (`#0F172A`).
  - *30% Structural Surfaces*: Charcoal cabinet bezels (`#1E293B`), hairline neon borders (`rgba(6, 182, 212, 0.25)`), and dark frosted glass control decks.
  - *10% Focal Accents*: Electric Cyan (`#06B6D4`), Laser Magenta (`#EC4899`), Nitro Amber (`#F59E0B`), and Acid Green (`#10B981`).
- **Typography & Hierarchy**:
  - *Display / Cabinet Marquees*: Bold futuristic geometric sans (`Orbitron` / `Chakra Petch`).
  - *Body Prose & Settings*: Clean, high-legibility sans (`Plus Jakarta Sans`).
  - *Scores & Multipliers*: Tabular monospace figures (`tabular-nums font-mono`).
- **Interactive Feedback & Motion**:
  - Frame-rate independent exponential damping for camera pans.
  - CRT shader overlay toggle with scanlines, subtle barrel curvature, and chromatic aberration.
  - Zero-latency Web Audio synthesized sound fx (arpeggios, laser zaps, bass drops, coin clicks).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular Engine Architecture for 11 Games**
  - *Chosen Approach*: Implement a unified `ArcadeGame` interface and state machine (`TITLE`, `PLAYING`, `PAUSED`, `GAME_OVER`) shared across all 11 games. Each game encapsulates its own canvas render loop, collision logic, and particle effects.
  - *Why*: Ensures seamless transitions for the Endless Gauntlet mode, clean code isolation, and memory-safe game teardown when switching titles.
  - *Alternatives Considered*: Monolithic game script or iframes. Dismissed due to excessive memory overhead and inability to share state/credits across modes.

- **Decision 2: Three.js 3D Arcade Hall with 2D Quick-Switch Fallback**
  - *Chosen Approach*: Render procedural 3D arcade cabinets using Three.js with studio lighting, grounded contact shadows, and canvas textures for screen marquees. Detect low-spec / software WebGL environments to adjust pixel ratio, with an instant 2D grid toggle for accessibility.
  - *Why*: Delivers stunning visual immersion while maintaining 60 FPS performance and zero external model file dependencies.

- **Decision 3: Zero-Dependency Procedural Web Audio Engine**
  - *Chosen Approach*: Synthesize all background synth tracks, sound effects, and voice stings procedurally using the browser Web Audio API oscillator nodes, gain envelopes, and biquad filters.
  - *Why*: Eliminates 404 broken asset risks, allows offline PWA play, and enables dynamic tempo scaling during high-combo gameplay.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NEON PULSE ARCADE APP                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Navigation: Brand Wordmark · Game Select · Cyber Lab · Settings · High Scores │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────┐   ┌─────────────────────────────┐   │
│   │     3D ARCADE HALL VIEWPORT       │   │     2D QUICK-SELECT GRID    │   │
│   │  (Three.js Procedural Cabinets)   │OR │  (Alternative Grid View)    │   │
│   │  - PBR Cabinet Meshes             │   │  - 11 Game Cards            │   │
│   │  - Animated Canvas Marquees       │   │  - Mastery & Hi-Score Badges│   │
│   │  - Smooth Camera Focus & Swaps    │   │  - Direct Play Launchers    │   │
│   └─────────────────┬─────────────────┘   └──────────────┬──────────────┘   │
│                     │                                    │                  │
│                     ▼                                    ▼                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       ACTIVE GAME RUNTIME HOST                      │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │ Core 7 Games:                                                 │  │   │
│   │  │ [Cyber Survivors] [Neon Dash] [Quantum Breaker] [Astro Pulse] │  │   │
│   │  │ [Neon Drift]      [Hexa-Tron] [Cyber Pacman]                  │  │   │
│   │  │                                                               │  │   │
│   │  │ 4 New Titles:                                                 │  │   │
│   │  │ [Cyber Pinball]   [Voxel Tank Siege]                          │  │   │
│   │  │ [Synth Blade]     [Laser Matrix Puzzle]                       │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │ Special Modes: [Boss Rush Arena] · [Endless Arcade Gauntlet]  │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────┬───────────────────────────────────┘   │
│                                     │                                       │
│       ┌─────────────────────────────┼─────────────────────────────┐         │
│       ▼                             ▼                             ▼         │
│  ┌──────────────┐          ┌─────────────────┐          ┌───────────────┐   │
│  │  3-Zone Deck │          │ Web Audio Synth │          │ Roguelite Core│   │
│  │ & Gamepad /  │          │ Procedural OST  │          │ Credits (NC), │   │
│  │ Keyboard Bus │          │ & SFX Generator │          │ Tech Tree,    │   │
│  └──────────────┘          └─────────────────┘          │ LocalStorage  │   │
│                                                         └───────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Structure

```typescript
// Core Player Progression
interface PlayerProfile {
  neonCredits: number;
  unlockedSkins: string[];
  activeSkin: string;
  crtFilterEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  techTree: {
    maxHealthLevel: number;
    speedBoostLevel: number;
    creditMultiplierLevel: number;
    empCooldownLevel: number;
  };
  gameStats: Record<string, {
    highScore: number;
    masteryLevel: number;
    masteryXp: number;
    gamesPlayed: number;
  }>;
  gauntletRecord: {
    maxStagesCleared: number;
    bestComboStreak: number;
  };
}

// Unified Game Contract
interface ArcadeGameInstance {
  id: string;
  title: string;
  init: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
  update: (dt: number, input: InputState) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
  destroy: () => void;
  pause: () => void;
  resume: () => void;
  getState: () => GameRuntimeState;
}
```

### Game Details for the 4 New Titles

1. **Cyber Pinball (Neon Flipper)**:
   - Physics-based flippers, bumpers, drop-targets, and ramps.
   - Multiball locks, jackpot lanes, and laser slingshots with authentic restitution calculations.
2. **Voxel Tank Siege**:
   - Dual-stick or WASD + mouse aiming tank combat in a destructible cyber arena.
   - Ricocheting plasma cannonballs, energy shields, and enemy hunter turrets.
3. **Synth Blade (Rhythm Slasher)**:
   - 4-lane cyber beat track synced to procedural synth chords and basslines.
   - Combo multiplier system with visual slice particle bursts.
4. **Laser Matrix Puzzle**:
   - Grid puzzle with optical mirrors, prism beam splitters, and logic gate sensors.
   - Handcrafted and procedurally generated puzzles with increasing complexity.

---
