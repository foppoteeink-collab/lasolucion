import React from 'react';
import { motion } from 'framer-motion';

interface KaiCosmeticEffectsProps {
  effectId: string;
  activeColor?: string;
  scale?: number;
  className?: string;
}

/**
 * CAPA DE EFECTOS VISUALES DE ALTO IMPACTO PARA KAI
 * Proyecta cosméticos, auras, rayos y armaduras holográficas de gran visibilidad
 * compatibles tanto con El Prisma como con personajes forjados con IA.
 */
export const KaiCosmeticEffects: React.FC<KaiCosmeticEffectsProps> = ({
  effectId,
  activeColor = '#00f0ff',
  scale = 1,
  className = '',
}) => {
  if (!effectId || effectId === 'none') return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-visible select-none ${className}`}
      style={{ transform: `scale(${scale})` }}
    >
      {/* ──────────────── 1. ALAS CIBERNÉTICAS TÁCTICAS (WINGS) ──────────────── */}
      {effectId === 'wings' && (
        <svg
          viewBox="0 0 240 180"
          className="absolute w-[180%] h-[180%] -translate-y-2 overflow-visible"
          fill="none"
        >
          <defs>
            <filter id="wing-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ala Izquierda */}
          <g filter="url(#wing-glow)" className="animate-pulse">
            <polygon
              points="65,75 10,40 32,85 48,92"
              fill={`${activeColor}25`}
              stroke={activeColor}
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <polygon
              points="60,90 20,65 38,105 52,108"
              fill={`${activeColor}35`}
              stroke={activeColor}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <polygon
              points="55,105 30,95 45,122 56,118"
              fill={`${activeColor}20`}
              stroke={activeColor}
              strokeWidth="1.8"
            />
            <line x1="18" y1="50" x2="52" y2="80" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="28" y1="78" x2="56" y2="98" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* Ala Derecha */}
          <g filter="url(#wing-glow)" className="animate-pulse">
            <polygon
              points="175,75 230,40 208,85 192,92"
              fill={`${activeColor}25`}
              stroke={activeColor}
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <polygon
              points="180,90 220,65 202,105 188,108"
              fill={`${activeColor}35`}
              stroke={activeColor}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <polygon
              points="185,105 210,95 195,122 184,118"
              fill={`${activeColor}20`}
              stroke={activeColor}
              strokeWidth="1.8"
            />
            <line x1="222" y1="50" x2="188" y2="80" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="212" y1="78" x2="184" y2="98" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        </svg>
      )}

      {/* ──────────────── 2. RAYOS DE PLASMA Y ARCOS ELÉCTRICOS (PLASMA_LIGHTNING) ──────────────── */}
      {(effectId === 'plasma_lightning' || effectId === 'lightning') && (
        <svg
          viewBox="0 0 180 180"
          className="absolute w-[160%] h-[160%] overflow-visible"
          fill="none"
        >
          <defs>
            <filter id="plasma-blur">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Rayos danzantes con animación de pulsos */}
          <g filter="url(#plasma-blur)">
            {/* Rayo superior izquierdo */}
            <motion.path
              d="M 35,45 L 50,60 L 44,70 L 62,85"
              stroke={activeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ opacity: [0.2, 1, 0.4, 0.9, 0.1], pathLength: [0.4, 1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
            {/* Rayo superior derecho */}
            <motion.path
              d="M 145,45 L 130,60 L 136,70 L 118,85"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ opacity: [0.9, 0.2, 1, 0.3, 0.8], pathLength: [1, 0.5, 1, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Rayo lateral izquierdo */}
            <motion.path
              d="M 25,100 L 42,108 L 36,118 L 55,125"
              stroke={activeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ opacity: [0.3, 0.9, 0.1, 1], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
            {/* Rayo lateral derecho */}
            <motion.path
              d="M 155,100 L 138,108 L 144,118 L 125,125"
              stroke={activeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ opacity: [1, 0.2, 0.8, 0.4] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />
            {/* Chispas nodales */}
            <circle cx="35" cy="45" r="3" fill="#ffffff" />
            <circle cx="145" cy="45" r="3" fill="#ffffff" />
            <circle cx="62" cy="85" r="2.5" fill="#ffffff" />
            <circle cx="118" cy="85" r="2.5" fill="#ffffff" />
          </g>
        </svg>
      )}

      {/* ──────────────── 3. ESCUDO DE ENERGÍA HEXAGONAL (HEX_SHIELD) ──────────────── */}
      {effectId === 'hex_shield' && (
        <svg
          viewBox="0 0 180 180"
          className="absolute w-[150%] h-[150%] overflow-visible"
          fill="none"
        >
          <defs>
            <pattern id="hex-pattern" width="24" height="20.78" patternUnits="userSpaceOnUse">
              <path
                d="M 12 0 L 24 6.93 L 24 20.78 L 12 27.71 L 0 20.78 L 0 6.93 Z"
                stroke={activeColor}
                strokeWidth="1.2"
                strokeOpacity="0.45"
                fill="none"
              />
            </pattern>
            <radialGradient id="shield-dome" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor={activeColor} stopOpacity="0" />
              <stop offset="85%" stopColor={activeColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.65" />
            </radialGradient>
          </defs>

          {/* Domo esférico */}
          <circle cx="90" cy="90" r="75" fill="url(#shield-dome)" />
          <circle cx="90" cy="90" r="75" fill="url(#hex-pattern)" opacity="0.65" />
          <circle
            cx="90"
            cy="90"
            r="76"
            stroke={activeColor}
            strokeWidth="2.2"
            strokeDasharray="16 8"
            className="animate-spin"
            style={{ animationDuration: '24s', transformOrigin: '90px 90px' }}
          />
          <circle cx="90" cy="90" r="79" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        </svg>
      )}

      {/* ──────────────── 4. CORONA & ORBES ORBITALES DE ASCENSIÓN (SOLAR / ORBS) ──────────────── */}
      {(effectId === 'solar' || effectId === 'solar_crown') && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Corona Dorada Superior */}
          <svg viewBox="0 0 100 40" className="absolute -top-7 w-20 h-8 overflow-visible">
            <polygon
              points="50,2 38,18 42,16 50,22 58,16 62,18"
              fill="rgba(251, 191, 36, 0.45)"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="8" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="18" r="2" fill="#fbbf24" />
            <circle cx="62" cy="18" r="2" fill="#fbbf24" />
          </svg>

          {/* Anillo Orbital con Orbes Giratorios */}
          <motion.div
            className="absolute w-36 h-36 rounded-full border border-amber-400/40 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            {/* Orbe 1 (0°) */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-white to-amber-400 shadow-[0_0_12px_#fbbf24] flex items-center justify-center"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
            {/* Orbe 2 (120°) */}
            <div
              className="absolute bottom-2 left-3 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-white to-cyan-400 shadow-[0_0_10px_#00f0ff]"
            />
            {/* Orbe 3 (240°) */}
            <div
              className="absolute bottom-2 right-3 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-white to-fuchsia-400 shadow-[0_0_10px_#d946ef]"
            />
          </motion.div>
        </div>
      )}

      {/* ──────────────── 5. VISOR TÁCTICO & HUD MILITAR (HUD_VISOR) ──────────────── */}
      {effectId === 'hud_visor' && (
        <svg viewBox="0 0 160 160" className="absolute w-[125%] h-[125%] overflow-visible" fill="none">
          {/* Corchetes HUD de apuntado */}
          <path d="M 40,55 L 30,55 L 30,70" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 120,55 L 130,55 L 130,70" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 40,115 L 30,115 L 30,100" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 120,115 L 130,115 L 130,100" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />

          {/* Láser de escaneo horizontal */}
          <motion.line
            x1="35"
            x2="125"
            y1="60"
            y2="60"
            stroke="#00f0ff"
            strokeWidth="2"
            strokeOpacity="0.85"
            animate={{ y1: [55, 115, 55], y2: [55, 115, 55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Marcadores de telemetría */}
          <text x="32" y="50" fill="#00f0ff" fontSize="7" fontFamily="monospace" fontWeight="bold">LOCK // KAI</text>
          <text x="96" y="125" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">SYNC 100%</text>
        </svg>
      )}

      {/* ──────────────── 6. TORMENTA DIGITAL MATRIX (MATRIX) ──────────────── */}
      {effectId === 'matrix' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-80">
          <div className="absolute inset-0 flex justify-between px-3 text-[9px] font-mono font-black text-emerald-400 select-none">
            <motion.div animate={{ y: [-15, 15, -15] }} transition={{ duration: 2.2, repeat: Infinity }}>
              01<br />10<br />01<br />11
            </motion.div>
            <motion.div animate={{ y: [15, -15, 15] }} transition={{ duration: 2.5, repeat: Infinity }}>
              10<br />01<br />11<br />00
            </motion.div>
            <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 1.8, repeat: Infinity }}>
              00<br />11<br />10<br />01
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};
