import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShockwaveColor, ShockwaveIntensity } from '../utils/celebration';

interface Shard {
  id: number;
  angle: number; // in radians
  distance: number;
  size: number;
  aspect: number;
  rotation: number;
  rotateDelta: number;
  delay: number;
}

interface ActiveFlare {
  id: string;
  color: ShockwaveColor;
  intensity: ShockwaveIntensity;
  origin: { x: number; y: number };
  shards: Shard[];
}

const COLOR_PALETTES: Record<ShockwaveColor, {
  core: string;
  beamCenter: string;
  beamGlow: string;
  streakGrad: string;
  shardBg: string;
  shardBorder: string;
  shardGlow: string;
  starColor: string;
  ambientFlash: string;
}> = {
  cyan: {
    core: '#ffffff',
    beamCenter: '#a5f3fc',
    beamGlow: 'rgba(6, 182, 212, 0.85)',
    streakGrad: 'linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(34,211,238,0.7) 20%, #ffffff 50%, rgba(34,211,238,0.7) 80%, rgba(6,182,212,0) 100%)',
    shardBg: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(34,211,238,0.45) 50%, rgba(6,182,212,0.15) 100%)',
    shardBorder: 'rgba(165, 243, 252, 0.9)',
    shardGlow: '0 0 16px rgba(6, 182, 212, 0.7)',
    starColor: '#22d3ee',
    ambientFlash: 'radial-gradient(circle at var(--origin-x) var(--origin-y), rgba(34,211,238,0.28) 0%, rgba(6,182,212,0.08) 45%, transparent 70%)',
  },
  gold: {
    core: '#ffffff',
    beamCenter: '#fef08a',
    beamGlow: 'rgba(245, 158, 11, 0.9)',
    streakGrad: 'linear-gradient(90deg, rgba(245,158,11,0) 0%, rgba(251,191,36,0.8) 25%, #ffffff 50%, rgba(251,191,36,0.8) 75%, rgba(245,158,11,0) 100%)',
    shardBg: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(251,191,36,0.55) 45%, rgba(180,83,9,0.2) 100%)',
    shardBorder: 'rgba(254, 240, 138, 0.95)',
    shardGlow: '0 0 18px rgba(245, 158, 11, 0.75)',
    starColor: '#fbbf24',
    ambientFlash: 'radial-gradient(circle at var(--origin-x) var(--origin-y), rgba(251,191,36,0.32) 0%, rgba(245,158,11,0.1) 45%, transparent 70%)',
  },
  emerald: {
    core: '#ffffff',
    beamCenter: '#a7f3d0',
    beamGlow: 'rgba(16, 185, 129, 0.85)',
    streakGrad: 'linear-gradient(90deg, rgba(16,185,129,0) 0%, rgba(52,211,153,0.75) 25%, #ffffff 50%, rgba(52,211,153,0.75) 75%, rgba(16,185,129,0) 100%)',
    shardBg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(52,211,153,0.45) 50%, rgba(16,185,129,0.15) 100%)',
    shardBorder: 'rgba(167, 243, 208, 0.9)',
    shardGlow: '0 0 16px rgba(16, 185, 129, 0.7)',
    starColor: '#34d399',
    ambientFlash: 'radial-gradient(circle at var(--origin-x) var(--origin-y), rgba(52,211,153,0.28) 0%, rgba(16,185,129,0.08) 45%, transparent 70%)',
  },
  violet: {
    core: '#ffffff',
    beamCenter: '#e9d5ff',
    beamGlow: 'rgba(168, 85, 247, 0.9)',
    streakGrad: 'linear-gradient(90deg, rgba(168,85,247,0) 0%, rgba(192,132,252,0.8) 25%, #ffffff 50%, rgba(192,132,252,0.8) 75%, rgba(168,85,247,0) 100%)',
    shardBg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(192,132,252,0.5) 50%, rgba(126,34,206,0.2) 100%)',
    shardBorder: 'rgba(233, 213, 255, 0.9)',
    shardGlow: '0 0 18px rgba(168, 85, 247, 0.75)',
    starColor: '#c084fc',
    ambientFlash: 'radial-gradient(circle at var(--origin-x) var(--origin-y), rgba(192,132,252,0.3) 0%, rgba(168,85,247,0.09) 45%, transparent 70%)',
  },
};

const generateShards = (count: number, maxDist: number): Shard[] => {
  const shards: Shard[] = [];
  for (let i = 0; i < count; i++) {
    // Distribute around 360 degrees with slight organic clustering
    const baseAngle = (i / count) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 0.45;
    const angle = baseAngle + jitter;
    const distance = maxDist * (0.35 + Math.random() * 0.75);
    const size = 6 + Math.random() * 16; // 6px to 22px
    const aspect = 1.6 + Math.random() * 2.8; // elongated crystal needle/shard
    const rotation = Math.random() * 360;
    const rotateDelta = (Math.random() - 0.5) * 360;
    const delay = Math.random() * 0.05;

    shards.push({
      id: i,
      angle,
      distance,
      size,
      aspect,
      rotation,
      rotateDelta,
      delay,
    });
  }
  return shards;
};

export const ShockwaveOverlay: React.FC = () => {
  const [flares, setFlares] = useState<ActiveFlare[]>([]);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      const { color = 'cyan', intensity = 'medium', origin } = e.detail || {};
      const winW = typeof window !== 'undefined' ? window.innerWidth : 400;
      const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

      const posX = origin?.x ?? winW / 2;
      const posY = origin?.y ?? winH / 2;

      const isEpic = intensity === 'epic';
      const isSubtle = intensity === 'subtle';
      const shardCount = isEpic ? 22 : isSubtle ? 10 : 16;
      const maxDistance = isEpic ? 240 : isSubtle ? 110 : 170;

      const newFlare: ActiveFlare = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        color,
        intensity,
        origin: { x: posX, y: posY },
        shards: generateShards(shardCount, maxDistance),
      };

      setFlares((prev) => [...prev.slice(-1), newFlare]);

      // Lifecycle removal
      const duration = isEpic ? 900 : 750;
      setTimeout(() => {
        setFlares((prev) => prev.filter((f) => f.id !== newFlare.id));
      }, duration);
    };

    window.addEventListener('celebration-shockwave', handleTrigger);
    return () => {
      window.removeEventListener('celebration-shockwave', handleTrigger);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[130] overflow-hidden">
      <AnimatePresence>
        {flares.map((flare) => {
          const palette = COLOR_PALETTES[flare.color] || COLOR_PALETTES.cyan;
          const isEpic = flare.intensity === 'epic';
          const { x: originX, y: originY } = flare.origin;

          return (
            <React.Fragment key={flare.id}>
              {/* 1. FLASH DE EXPOSICIÓN CINEMÁTICA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.95, 0],
                  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: palette.ambientFlash
                    .replace('var(--origin-x)', `${originX}px`)
                    .replace('var(--origin-y)', `${originY}px`),
                }}
              />

              {/* 2. HAZ DE LUZ ANAMÓRFICA HORIZONTAL (Corta la pantalla de lado a lado) */}
              <div
                className="absolute left-0 right-0 pointer-events-none flex items-center justify-center"
                style={{ top: `${originY}px`, transform: 'translateY(-50%)' }}
              >
                {/* Rayo central blanco incandescente */}
                <motion.div
                  initial={{ scaleX: 0.05, opacity: 0, scaleY: 2.2 }}
                  animate={{
                    scaleX: [0.05, 1.05, 1],
                    scaleY: [2.5, 0.7, 0.3],
                    opacity: [0, 1, 0.85, 0],
                  }}
                  transition={{
                    duration: isEpic ? 0.65 : 0.5,
                    times: [0, 0.25, 0.6, 1],
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="w-full h-[3px] rounded-full pointer-events-none"
                  style={{
                    background: palette.streakGrad,
                    boxShadow: `0 0 24px ${palette.beamGlow}, 0 0 8px #ffffff`,
                  }}
                />

                {/* Resplandor vertical anamórfico difuminado */}
                <motion.div
                  initial={{ scaleX: 0.1, opacity: 0 }}
                  animate={{
                    scaleX: [0.1, 1],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: isEpic ? 0.75 : 0.55,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute w-full h-[40px] pointer-events-none blur-lg"
                  style={{
                    background: palette.streakGrad,
                  }}
                />
              </div>

              {/* 3. NÚCLEO PRISMÁTICO DE DIAMANTE (Starburst central en el punto de impacto) */}
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ left: `${originX}px`, top: `${originY}px` }}
              >
                {/* Estrella de destello de 4 puntas de precisión óptica */}
                <motion.div
                  initial={{ scale: 0.1, rotate: 0, opacity: 0 }}
                  animate={{
                    scale: [0.1, isEpic ? 1.7 : 1.35, 0],
                    rotate: [0, 30],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 0.55,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative pointer-events-none flex items-center justify-center"
                >
                  <svg
                    width="140"
                    height="140"
                    viewBox="0 0 100 100"
                    fill="none"
                    className="drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]"
                  >
                    {/* Haz vertical de diamante */}
                    <path
                      d="M50 0 L52 48 L100 50 L52 52 L50 100 L48 52 L0 50 L48 48 Z"
                      fill="url(#coreGradient)"
                    />
                    <defs>
                      <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="35%" stopColor={palette.starColor} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={palette.starColor} stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </motion.div>

                {/* Micro-anillo sónico ultra fino */}
                <motion.div
                  initial={{ scale: 0.2, opacity: 1, borderWidth: '2px' }}
                  animate={{
                    scale: [0.2, isEpic ? 2.6 : 2.0],
                    opacity: [1, 0.4, 0],
                    borderWidth: ['2px', '0.5px'],
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute w-24 h-24 rounded-full border pointer-events-none"
                  style={{
                    borderColor: palette.starColor,
                    boxShadow: `0 0 20px ${palette.beamGlow}`,
                  }}
                />
              </div>

              {/* 4. FRACTURA DE CRISTAL PRISMÁTICO (Fragmentos geométricos translúcidos) */}
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${originX}px`, top: `${originY}px` }}
              >
                {flare.shards.map((shard) => {
                  const targetX = Math.cos(shard.angle) * shard.distance;
                  const targetY = Math.sin(shard.angle) * shard.distance;

                  return (
                    <motion.div
                      key={shard.id}
                      initial={{
                        x: 0,
                        y: 0,
                        scale: 0.2,
                        opacity: 1,
                        rotate: shard.rotation,
                      }}
                      animate={{
                        x: targetX,
                        y: targetY,
                        scale: [0.2, 1, 0.6],
                        opacity: [1, 0.9, 0],
                        rotate: shard.rotation + shard.rotateDelta,
                      }}
                      transition={{
                        duration: isEpic ? 0.75 : 0.6,
                        delay: shard.delay,
                        ease: [0.12, 0.9, 0.25, 1],
                      }}
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{
                        width: `${shard.size}px`,
                        height: `${shard.size * shard.aspect}px`,
                        background: palette.shardBg,
                        border: `1px solid ${palette.shardBorder}`,
                        boxShadow: palette.shardGlow,
                        clipPath: 'polygon(50% 0%, 100% 38%, 78% 100%, 22% 100%, 0% 38%)',
                        backdropFilter: 'blur(3px)',
                        transformOrigin: 'center center',
                      }}
                    />
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ShockwaveOverlay;
