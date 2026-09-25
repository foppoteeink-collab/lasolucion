import React from 'react';
import { MainLogo } from './MainLogo';

export const SciFiLogo: React.FC<{ className?: string; textClassName?: string; showText?: boolean }> = ({ className = "w-12 h-12", textClassName = "", showText = true }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* SVG Container */}
      <svg 
        viewBox="0 0 200 280" 
        className="w-full h-full drop-shadow-[0_0_8px_rgba(100,150,255,0.8)]"
        fill="none" 
        stroke="#8ca9ff" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* DNA / Z Top Section */}
        {/* Left curve */}
        <path d="M 80,20 Q 60,40 80,60 Q 100,80 80,100" />
        {/* Right curve */}
        <path d="M 120,20 Q 140,40 120,60 Q 100,80 120,100" />
        {/* Z shapes connecting */}
        <path d="M 80,30 L 120,30 L 80,50 L 120,50" />
        <path d="M 80,70 L 120,70 L 80,90 L 120,90" />
        {/* Left side node structure */}
        <circle cx="65" cy="40" r="3" fill="#8ca9ff" />
        <circle cx="65" cy="70" r="3" fill="#8ca9ff" />
        <circle cx="45" cy="55" r="3" fill="#8ca9ff" />
        <path d="M 80,40 L 65,40 L 45,55 L 65,70 L 80,70" />
        <path d="M 65,40 L 65,70" />
        {/* Right side node structure */}
        <circle cx="135" cy="40" r="3" fill="#8ca9ff" />
        <circle cx="135" cy="70" r="3" fill="#8ca9ff" />
        <circle cx="155" cy="55" r="3" fill="#8ca9ff" />
        <path d="M 120,40 L 135,40 L 155,55 L 135,70 L 120,70" />
        <path d="M 135,40 L 135,70" />

        {/* Outer Brackets */}
        <path d="M 80,100 L 50,120 L 50,180 L 80,210" />
        <path d="M 120,100 L 150,120 L 150,180 L 120,210" />
        <path d="M 40,115 L 25,125 L 25,175 L 40,185" opacity="0.4" />
        <path d="M 160,115 L 175,125 L 175,175 L 160,185" opacity="0.4" />

        {/* Icosahedron (Center Hexagon with inner triangles) */}
        <polygon points="100,105 130,125 130,165 100,185 70,165 70,125" />
        <circle cx="100" cy="145" r="3" fill="#8ca9ff" />
        <circle cx="100" cy="105" r="3" fill="#8ca9ff" />
        <circle cx="130" cy="125" r="3" fill="#8ca9ff" />
        <circle cx="130" cy="165" r="3" fill="#8ca9ff" />
        <circle cx="100" cy="185" r="3" fill="#8ca9ff" />
        <circle cx="70" cy="165" r="3" fill="#8ca9ff" />
        <circle cx="70" cy="125" r="3" fill="#8ca9ff" />
        {/* Inner lines connecting to center */}
        <path d="M 100,105 L 100,145" />
        <path d="M 130,125 L 100,145" />
        <path d="M 130,165 L 100,145" />
        <path d="M 100,185 L 100,145" />
        <path d="M 70,165 L 100,145" />
        <path d="M 70,125 L 100,145" />
        {/* Inner triangles crossing */}
        <path d="M 70,125 L 130,125" />
        <path d="M 70,165 L 130,165" />
        <path d="M 100,105 L 70,165" />
        <path d="M 100,105 L 130,165" />
        <path d="M 100,185 L 70,125" />
        <path d="M 100,185 L 130,125" />

        {/* Bottom Hexagon System */}
        <polygon points="100,195 125,210 125,240 100,255 75,240 75,210" />
        <polygon points="100,205 115,215 115,235 100,245 85,235 85,215" opacity="0.6" />
        <circle cx="100" cy="225" r="5" fill="#8ca9ff" />
        <circle cx="100" cy="225" r="12" strokeWidth="1" opacity="0.4" />
      </svg>
      {showText && (
        <div className={`mt-2 ${textClassName}`}>
          <MainLogo size="sm" />
        </div>
      )}
    </div>
  );
};
