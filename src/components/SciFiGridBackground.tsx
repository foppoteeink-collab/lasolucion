import React from 'react';

// Distant cosmic micro-stars with subtle twinkle effect
const COSMIC_STARS = [
  { top: '6%', left: '12%', size: 2, delay: '0s' },
  { top: '12%', left: '48%', size: 1.5, delay: '1s' },
  { top: '18%', left: '85%', size: 2.5, delay: '2s' },
  { top: '24%', left: '22%', size: 1.5, delay: '0.5s' },
  { top: '32%', left: '92%', size: 2, delay: '1.5s' },
  { top: '42%', left: '8%', size: 2.5, delay: '2.5s' },
  { top: '50%', left: '65%', size: 1.5, delay: '0.8s' },
  { top: '62%', left: '30%', size: 2, delay: '1.8s' },
  { top: '72%', left: '88%', size: 2, delay: '0.3s' },
  { top: '82%', left: '15%', size: 2.5, delay: '2.2s' },
  { top: '90%', left: '54%', size: 1.5, delay: '1.2s' },
  { top: '8%', left: '72%', size: 2, delay: '0.7s' },
  { top: '28%', left: '60%', size: 1.5, delay: '1.9s' },
  { top: '58%', left: '95%', size: 2, delay: '2.4s' },
  { top: '78%', left: '42%', size: 1.5, delay: '1.1s' },
];

export const SciFiGridBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse 130% 90% at 50% -10%, #0c1633 0%, #050b1a 45%, #02040a 100%)'
      }}
      aria-hidden="true"
    >
      {/* CAPA 1: ESTRELLAS CÓSMICAS EN EL FONDO */}
      <div className="absolute inset-0 pointer-events-none">
        {COSMIC_STARS.map((star, idx) => (
          <div
            key={idx}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: '3.5s',
              animationDelay: star.delay,
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.9)',
            }}
          />
        ))}
      </div>

      {/* CAPA 2: AURORA BOREAL LUMINOSA (ONDAS MULTICOLOR FLUIDAS) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Veta 1: Arco Verde Boreal & Lima Eléctrico (Esmeralda Neón) */}
        <div 
          className="absolute -top-[12%] left-[2%] w-[900px] lg:w-[1300px] h-[520px] lg:h-[700px] rounded-full pointer-events-none animate-aurora-1"
          style={{
            background: 'radial-gradient(ellipse 65% 50% at 45% 45%, rgba(0, 255, 135, 0.65) 0%, rgba(16, 185, 129, 0.50) 30%, rgba(214, 244, 33, 0.35) 55%, rgba(5, 150, 105, 0.12) 75%, transparent 90%)',
            filter: 'blur(42px)',
          }}
        />

        {/* Veta 2: Velo Magia Violeta & Orquídea Eléctrica (Púrpura Cósmico) */}
        <div 
          className="absolute top-[2%] -right-[8%] w-[850px] lg:w-[1200px] h-[580px] lg:h-[750px] rounded-full pointer-events-none animate-aurora-2 mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 60% 55% at 60% 45%, rgba(168, 85, 247, 0.70) 0%, rgba(150, 0, 255, 0.55) 32%, rgba(217, 70, 239, 0.38) 58%, rgba(88, 28, 135, 0.15) 78%, transparent 92%)',
            filter: 'blur(46px)',
          }}
        />

        {/* Veta 3: Cortina Cian Ártico & Azul Glacial (Luz Polar Inferior) */}
        <div 
          className="absolute top-[32%] -left-[12%] w-[800px] lg:w-[1100px] h-[520px] lg:h-[680px] rounded-full pointer-events-none animate-aurora-3 mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 70% 45% at 50% 50%, rgba(0, 240, 255, 0.55) 0%, rgba(6, 182, 212, 0.42) 32%, rgba(59, 130, 246, 0.28) 55%, transparent 80%)',
            filter: 'blur(45px)',
          }}
        />

        {/* Veta 4: Haz de Fusión Central (Intersección Esmeralda & Magenta) */}
        <div 
          className="absolute top-[18%] left-[22%] w-[700px] lg:w-[950px] h-[420px] lg:h-[580px] rounded-full pointer-events-none animate-aurora-1 mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 55% 42% at 50% 50%, rgba(52, 211, 153, 0.50) 0%, rgba(192, 132, 252, 0.42) 48%, transparent 75%)',
            filter: 'blur(48px)',
            animationDelay: '-7s',
          }}
        />

        {/* Veta 5: Atmósfera Inferior Cálida y Mística */}
        <div 
          className="absolute -bottom-[8%] right-[12%] w-[750px] lg:w-[1000px] h-[450px] lg:h-[600px] rounded-full pointer-events-none animate-aurora-2 mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(99, 102, 241, 0.45) 0%, rgba(168, 85, 247, 0.35) 42%, rgba(6, 182, 212, 0.20) 68%, transparent 85%)',
            filter: 'blur(52px)',
            animationDelay: '-11s',
          }}
        />

        {/* Estriaciones Verticales Shimmer (Cortinas de la Aurora) */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-45 mix-blend-overlay animate-aurora-curtain"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              rgba(0, 255, 135, 0.15) 0px,
              rgba(0, 255, 135, 0.15) 2px,
              transparent 2px,
              transparent 28px,
              rgba(168, 85, 247, 0.15) 30px,
              transparent 32px,
              transparent 60px
            )`,
            backgroundSize: '200% 100%',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 70%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 70%, transparent 95%)',
          }}
        />
      </div>

      {/* CAPA 3: CUADRÍCULA SCI-FI MATRICIAL (SUAVE SOBRE LA AURORA) */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(140, 169, 255, 0.45) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(140, 169, 255, 0.45) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 65%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 65%, transparent 95%)',
        }}
      />

      {/* CAPA 4: CONSTELACIONES Y GLIFOS SCI-FI FLOTANTES */}
      <div className="absolute top-20 left-8 opacity-35 hover:opacity-100 transition-opacity duration-700">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#8ca9ff" strokeWidth="1.3">
          <polygon points="50,15 80,35 80,65 50,85 20,65 20,35" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="3.5" fill="#d6f421" />
          <line x1="50" y1="15" x2="50" y2="50" opacity="0.6" />
          <line x1="80" y1="35" x2="50" y2="50" opacity="0.6" />
          <line x1="20" y1="65" x2="50" y2="50" opacity="0.6" />
        </svg>
      </div>

      <div className="absolute bottom-24 right-8 opacity-30 hover:opacity-100 transition-opacity duration-700 delay-100">
        <svg width="140" height="140" viewBox="0 0 100 100" fill="none" stroke="#9600ff" strokeWidth="1.2">
          <path d="M30,30 L70,70 M70,30 L30,70" opacity="0.4" />
          <circle cx="50" cy="50" r="25" strokeDasharray="4 4" opacity="0.6" />
          <circle cx="50" cy="50" r="10" stroke="#8ca9ff" opacity="0.7" />
          <circle cx="50" cy="50" r="3" fill="#9600ff" />
        </svg>
      </div>
    </div>
  );
};
