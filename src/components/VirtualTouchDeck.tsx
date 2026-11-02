import React, { useRef, useState, useEffect } from 'react';
import { InputState } from '../types/game';
import { Zap, Shield, Flame } from 'lucide-react';

interface VirtualTouchDeckProps {
  onInputChange: (input: InputState) => void;
  gameId: string;
}

export const VirtualTouchDeck: React.FC<VirtualTouchDeckProps> = ({ onInputChange, gameId }) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<InputState>({
    moveX: 0,
    moveY: 0,
    action1: false,
    action2: false,
    special: false,
  });

  const notifyChange = () => {
    onInputChange({ ...inputRef.current });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joystickBaseRef.current) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = 45;
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    inputRef.current.moveX = dx / maxRadius;
    inputRef.current.moveY = dy / maxRadius;
    notifyChange();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
    notifyChange();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="w-full bg-slate-950/90 border-t border-slate-800/80 p-3 select-none touch-none flex items-center justify-between gap-4">
      {/* Left Zone: Secondary Action (Nitro, Boost, Drift, Left Flipper) */}
      <div className="flex flex-col items-center gap-2">
        <button
          onPointerDown={() => {
            inputRef.current.action2 = true;
            notifyChange();
          }}
          onPointerUp={() => {
            inputRef.current.action2 = false;
            notifyChange();
          }}
          className="w-14 h-14 rounded-full bg-amber-500/20 active:bg-amber-500/60 border border-amber-500/50 flex flex-col items-center justify-center text-amber-400 active:scale-90 transition-transform shadow-lg"
          aria-label="Secondary Boost"
        >
          <Flame className="w-5 h-5" />
          <span className="text-[9px] font-bold font-mono uppercase mt-0.5">BOOST</span>
        </button>
      </div>

      {/* Center Zone: Centred Virtual Joystick */}
      <div className="flex-1 flex justify-center">
        <div
          ref={joystickBaseRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-28 h-28 rounded-full bg-slate-900 border-2 border-cyan-500/40 shadow-inner flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
        >
          {/* Subtle Direction markers */}
          <div className="absolute top-1 text-[8px] text-cyan-500/50 font-mono font-bold">▲</div>
          <div className="absolute bottom-1 text-[8px] text-cyan-500/50 font-mono font-bold">▼</div>
          <div className="absolute left-1 text-[8px] text-cyan-500/50 font-mono font-bold">◀</div>
          <div className="absolute right-1 text-[8px] text-cyan-500/50 font-mono font-bold">▶</div>

          {/* Draggable Knob */}
          <div
            className="w-12 h-12 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 border-2 border-white pointer-events-none transition-transform"
            style={{
              transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
            }}
          />
        </div>
      </div>

      {/* Right Zone: Primary Action & Special EMP Ability */}
      <div className="flex items-center gap-3">
        {/* Special Ability Button (EMP / Nova) */}
        <button
          onPointerDown={() => {
            inputRef.current.special = true;
            notifyChange();
          }}
          onPointerUp={() => {
            inputRef.current.special = false;
            notifyChange();
          }}
          className="w-12 h-12 rounded-full bg-purple-500/20 active:bg-purple-500/60 border border-purple-500/50 flex flex-col items-center justify-center text-purple-300 active:scale-90 transition-transform shadow-lg"
          aria-label="Special EMP"
        >
          <Zap className="w-4 h-4" />
          <span className="text-[8px] font-bold font-mono uppercase mt-0.5">EMP</span>
        </button>

        {/* Primary Action Button (Fire / Jump / Flip / Launch) */}
        <button
          onPointerDown={() => {
            inputRef.current.action1 = true;
            notifyChange();
          }}
          onPointerUp={() => {
            inputRef.current.action1 = false;
            notifyChange();
          }}
          className="w-16 h-16 rounded-full bg-cyan-500/25 active:bg-cyan-500/70 border-2 border-cyan-400 flex flex-col items-center justify-center text-cyan-300 active:scale-90 transition-transform shadow-xl shadow-cyan-500/20"
          aria-label="Primary Action"
        >
          <Shield className="w-6 h-6" />
          <span className="text-[10px] font-black font-display tracking-wider uppercase mt-0.5">FIRE</span>
        </button>
      </div>
    </div>
  );
};
