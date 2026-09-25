import React from 'react';

export const SciFiGridBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-100 dark:bg-[#050814] transition-colors duration-300">
      {/* Background Gradient Mesh - Optimized for Performance */}
      <div className="absolute inset-0 opacity-20 dark:opacity-40">
        <div 
          className="absolute top-0 left-1/4 w-[500px] h-[500px] mix-blend-screen" 
          style={{ background: 'radial-gradient(circle, rgba(22, 78, 99, 0.4) 0%, transparent 60%)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] mix-blend-screen"
          style={{ background: 'radial-gradient(circle, rgba(30, 58, 138, 0.3) 0%, transparent 60%)' }}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(140, 169, 255, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(140, 169, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)'
        }}
      />

      {/* Floating Geometric Particles (DNA / Hexagons) */}
      <div className="absolute top-20 left-10 opacity-30 hover:opacity-100 transition-opacity duration-700">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#8ca9ff" strokeWidth="1.5">
          <polygon points="50,15 80,35 80,65 50,85 20,65 20,35" />
          <circle cx="50" cy="50" r="4" fill="#8ca9ff" />
          <line x1="50" y1="15" x2="50" y2="50" />
          <line x1="80" y1="35" x2="50" y2="50" />
          <line x1="20" y1="65" x2="50" y2="50" />
        </svg>
      </div>

      <div className="absolute bottom-20 right-10 opacity-20 hover:opacity-100 transition-opacity duration-700 delay-100">
        <svg width="150" height="150" viewBox="0 0 100 100" fill="none" stroke="#4d84f0" strokeWidth="1">
          <path d="M30,30 L70,70 M70,30 L30,70" opacity="0.5"/>
          <circle cx="50" cy="50" r="25" strokeDasharray="4 4" />
          <circle cx="50" cy="50" r="10" />
          <circle cx="50" cy="50" r="2" fill="#4d84f0" />
        </svg>
      </div>

      <div className="hidden lg:block absolute top-1/3 right-1/4 opacity-10">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#8ca9ff" strokeWidth="1">
           <path d="M100,0 L200,100 L100,200 L0,100 Z" strokeDasharray="10 5" />
           <circle cx="100" cy="100" r="40" />
           <polygon points="100,50 143,125 57,125" />
        </svg>
      </div>
      
      <div className="hidden lg:block absolute bottom-1/3 left-1/4 opacity-15">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="#8ca9ff" strokeWidth="1.5">
          <path d="M 30,20 Q 50,50 30,80" />
          <path d="M 70,20 Q 50,50 70,80" />
          <circle cx="50" cy="50" r="3" fill="#8ca9ff" />
          <line x1="42" y1="35" x2="58" y2="35" />
          <line x1="42" y1="65" x2="58" y2="65" />
        </svg>
      </div>
    </div>
  );
};
