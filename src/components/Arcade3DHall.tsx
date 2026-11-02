import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARCADE_GAMES } from '../games/registry';
import { CABINET_SKINS } from '../services/storage';
import { sound } from '../services/sound';
import { CabinetSkinId, GameId } from '../types/game';
import { ChevronLeft, ChevronRight, Play, Sparkles, Eye, Grid } from 'lucide-react';

interface Arcade3DHallProps {
  selectedGameId: GameId;
  onSelectGame: (id: GameId) => void;
  onLaunchGame: (id: GameId) => void;
  activeSkin: CabinetSkinId;
  onOpenSkinsModal: () => void;
  onToggleGridView: () => void;
}

export const Arcade3DHall: React.FC<Arcade3DHallProps> = ({
  selectedGameId,
  onSelectGame,
  onLaunchGame,
  activeSkin,
  onOpenSkinsModal,
  onToggleGridView,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedIndex = ARCADE_GAMES.findIndex((g) => g.id === selectedGameId);

  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const skinRef = useRef(activeSkin);
  skinRef.current = activeSkin;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.035);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 2.6, 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio 3-Point Lighting
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Floor Reflection Grid
    const floorGeo = new THREE.PlaneGeometry(60, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.25,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Grid Floor Overlay
    const gridHelper = new THREE.GridHelper(50, 50, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Build 11 Arcade Cabinets
    const cabinetGroups: THREE.Group[] = [];
    const cabinetSpacing = 2.4;
    const currentSkin = CABINET_SKINS.find((s) => s.id === skinRef.current) || CABINET_SKINS[0];

    ARCADE_GAMES.forEach((game, idx) => {
      const cabinet = new THREE.Group();
      const xPos = (idx - (ARCADE_GAMES.length - 1) / 2) * cabinetSpacing;
      // Slight arch arrangement
      const zPos = -Math.pow((idx - (ARCADE_GAMES.length - 1) / 2) * 0.4, 2);
      cabinet.position.set(xPos, 0, zPos);

      // (1) Cabinet Main Body Chassis
      const chassisMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(currentSkin.chassisColor),
        roughness: 0.35,
        metalness: 0.6,
      });

      // Lower Base
      const baseGeo = new THREE.BoxGeometry(1.2, 1.4, 1.1);
      const baseMesh = new THREE.Mesh(baseGeo, chassisMat);
      baseMesh.position.set(0, 0.7, 0);
      baseMesh.castShadow = !isSoftwareGl;
      baseMesh.receiveShadow = !isSoftwareGl;
      cabinet.add(baseMesh);

      // Upper Marquee & Screen Housing
      const upperGeo = new THREE.BoxGeometry(1.2, 1.6, 0.95);
      const upperMesh = new THREE.Mesh(upperGeo, chassisMat);
      upperMesh.position.set(0, 2.1, -0.08);
      upperMesh.castShadow = !isSoftwareGl;
      cabinet.add(upperMesh);

      // (2) Control Deck
      const deckMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.2,
        metalness: 0.8,
      });
      const deckGeo = new THREE.BoxGeometry(1.26, 0.16, 0.55);
      const deckMesh = new THREE.Mesh(deckGeo, deckMat);
      deckMesh.position.set(0, 1.35, 0.42);
      deckMesh.rotation.x = 0.2;
      deckMesh.castShadow = !isSoftwareGl;
      cabinet.add(deckMesh);

      // Joystick ball
      const stickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.14);
      const stickMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
      const stickMesh = new THREE.Mesh(stickGeo, stickMat);
      stickMesh.position.set(-0.25, 1.5, 0.42);
      cabinet.add(stickMesh);

      const ballGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const ballMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.2 });
      const ballMesh = new THREE.Mesh(ballGeo, ballMat);
      ballMesh.position.set(-0.25, 1.58, 0.42);
      cabinet.add(ballMesh);

      // 4 Action Buttons
      const btnGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.04);
      const btnColors = [0x06b6d4, 0xec4899, 0xf59e0b, 0x10b981];
      for (let b = 0; b < 4; b++) {
        const btnMat = new THREE.MeshStandardMaterial({ color: btnColors[b], roughness: 0.3 });
        const btnMesh = new THREE.Mesh(btnGeo, btnMat);
        btnMesh.position.set(0.08 + (b % 2) * 0.1, 1.45 + (b > 1 ? 0.04 : 0), 0.38 + Math.floor(b / 2) * 0.08);
        cabinet.add(btnMesh);
      }

      // (3) Marquee Top Sign (Glowing Canvas Texture)
      const marqueeCanvas = document.createElement('canvas');
      marqueeCanvas.width = 512;
      marqueeCanvas.height = 160;
      const mCtx = marqueeCanvas.getContext('2d')!;
      mCtx.fillStyle = '#060913';
      mCtx.fillRect(0, 0, 512, 160);
      mCtx.fillStyle = game.color;
      mCtx.shadowColor = game.color;
      mCtx.shadowBlur = 18;
      mCtx.font = 'bold 36px Orbitron';
      mCtx.textAlign = 'center';
      mCtx.textBaseline = 'middle';
      mCtx.fillText(game.title.toUpperCase(), 256, 80);

      const marqueeTex = new THREE.CanvasTexture(marqueeCanvas);
      marqueeTex.colorSpace = THREE.SRGBColorSpace;
      const marqueeMat = new THREE.MeshBasicMaterial({ map: marqueeTex });
      const marqueeGeo = new THREE.PlaneGeometry(1.14, 0.36);
      const marqueeMesh = new THREE.Mesh(marqueeGeo, marqueeMat);
      marqueeMesh.position.set(0, 2.72, 0.4);
      cabinet.add(marqueeMesh);

      // (4) CRT Screen (Dynamic canvas texture)
      const screenCanvas = document.createElement('canvas');
      screenCanvas.width = 400;
      screenCanvas.height = 360;
      const sCtx = screenCanvas.getContext('2d')!;
      sCtx.fillStyle = '#090d16';
      sCtx.fillRect(0, 0, 400, 360);

      // Animated retro screen preview
      sCtx.fillStyle = game.color;
      sCtx.font = 'bold 22px Orbitron';
      sCtx.textAlign = 'center';
      sCtx.fillText(game.title, 200, 80);
      sCtx.fillStyle = '#94a3b8';
      sCtx.font = '15px Plus Jakarta Sans';
      sCtx.fillText(game.genre, 200, 120);

      sCtx.fillStyle = '#facc15';
      sCtx.font = 'bold 18px Orbitron';
      sCtx.fillText('INSERT COIN', 200, 220);
      sCtx.fillStyle = '#38bdf8';
      sCtx.font = '13px Orbitron';
      sCtx.fillText('PRESS START TO PLAY', 200, 255);

      const screenTex = new THREE.CanvasTexture(screenCanvas);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
      const screenGeo = new THREE.PlaneGeometry(1.0, 0.9);
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.set(0, 1.95, 0.35);
      screenMesh.rotation.x = -0.16; // Slanted CRT screen
      cabinet.add(screenMesh);

      // (5) Coin Door Panel
      const coinDoorGeo = new THREE.BoxGeometry(0.5, 0.6, 0.04);
      const coinDoorMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
      const coinDoorMesh = new THREE.Mesh(coinDoorGeo, coinDoorMat);
      coinDoorMesh.position.set(0, 0.55, 0.55);
      cabinet.add(coinDoorMesh);

      // (6) Neon Side Flank Piping
      const pipeGeo = new THREE.BoxGeometry(0.04, 2.7, 0.04);
      const pipeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(game.color) });
      const pipeLeft = new THREE.Mesh(pipeGeo, pipeMat);
      pipeLeft.position.set(-0.61, 1.5, 0.1);
      cabinet.add(pipeLeft);

      const pipeRight = new THREE.Mesh(pipeGeo, pipeMat);
      pipeRight.position.set(0.61, 1.5, 0.1);
      cabinet.add(pipeRight);

      // Store index on cabinet object
      cabinet.userData = { gameIndex: idx, gameId: game.id };

      scene.add(cabinet);
      cabinetGroups.push(cabinet);
    });

    // Raycaster for cabinet click selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.userData?.gameId) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.gameId) {
          const clickedId = parent.userData.gameId as GameId;
          onSelectGame(clickedId);
          sound.playCoin();
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Animation & Camera Damping Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const targetIdx = selectedIndexRef.current;
      const targetCabinet = cabinetGroups[targetIdx];

      if (targetCabinet) {
        // Camera smoothly follows selected cabinet
        const targetCamX = targetCabinet.position.x;
        const targetCamZ = targetCabinet.position.z + 4.8;
        const targetCamY = 2.1;

        camera.position.x += (targetCamX - camera.position.x) * 4 * delta;
        camera.position.z += (targetCamZ - camera.position.z) * 4 * delta;
        camera.position.y += (targetCamY - camera.position.y) * 4 * delta;

        camera.lookAt(targetCabinet.position.x, 1.9, targetCabinet.position.z);
      }

      // Subtle float animation on selected cabinet
      cabinetGroups.forEach((cab, i) => {
        if (i === targetIdx) {
          cab.position.y = Math.sin(clock.getElapsedTime() * 3) * 0.03;
        } else {
          cab.position.y = 0;
        }
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Handle Window Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const activeGame = ARCADE_GAMES[selectedIndex] || ARCADE_GAMES[0];

  const handlePrev = () => {
    const prevIdx = (selectedIndex - 1 + ARCADE_GAMES.length) % ARCADE_GAMES.length;
    onSelectGame(ARCADE_GAMES[prevIdx].id);
    sound.playLaserHit();
  };

  const handleNext = () => {
    const nextIdx = (selectedIndex + 1) % ARCADE_GAMES.length;
    onSelectGame(ARCADE_GAMES[nextIdx].id);
    sound.playLaserHit();
  };

  return (
    <div className="relative w-full h-[620px] bg-slate-950 overflow-hidden border border-slate-800 rounded-xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-6 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700/60 z-10">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
          CABINET {selectedIndex + 1} / {ARCADE_GAMES.length}
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-xs font-semibold text-cyan-400">{activeGame.genre}</span>
        {activeGame.isNew && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/40">
            NEW TITLE
          </span>
        )}
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-4 right-6 flex items-center gap-2 z-10">
        <button
          onClick={onOpenSkinsModal}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap"
          title="Customize Arcade Cabinet Finish"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Cabinet Armory</span>
        </button>
        <button
          onClick={onToggleGridView}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap"
          title="Switch to 2D Grid Selector"
        >
          <Grid className="w-3.5 h-3.5 text-cyan-400" />
          <span>2D Grid View</span>
        </button>
      </div>

      {/* Side Arrow Navigation */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-400 border border-slate-700/70 shadow-lg transition-all z-10"
        aria-label="Previous Cabinet"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-400 border border-slate-700/70 shadow-lg transition-all z-10"
        aria-label="Next Cabinet"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Bottom Central Control Dock */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="text-left w-full sm:w-auto">
          <h2 className="text-xl font-bold font-display text-white tracking-wide">{activeGame.title}</h2>
          <p className="text-xs text-slate-400 max-w-md line-clamp-1">{activeGame.tagline}</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              sound.playCoin();
              onLaunchGame(activeGame.id);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-cyan-500/25 transition-all whitespace-nowrap active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>INSERT COIN · PLAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
