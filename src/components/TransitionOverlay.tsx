import React, { useEffect, useState } from 'react';
import { SciFiLogo } from './SciFiLogo';
import { MainLogo } from './MainLogo';

interface TransitionOverlayProps {
  isVisible: boolean;
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ isVisible }) => {
  const [render, setRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) setRender(true);
  }, [isVisible]);

  const onAnimationEnd = () => {
    if (!isVisible) setRender(false);
  };

  if (!render) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#070417]/90 backdrop-blur-sm pointer-events-none transition-opacity duration-150 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onTransitionEnd={onAnimationEnd}
    >
      <div 
        className={`flex flex-col items-center gap-6 transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
      >
        <div className="relative mb-2 flex items-center justify-center">
          {/* Resplandor optimizado (GPU friendly) en lugar de drop-shadow sobre SVG */}
          <div className="absolute inset-0 bg-[#00f0ff] blur-2xl opacity-30 rounded-full scale-125"></div>
          
          <div className="relative z-10">
            {/* @ts-ignore */}
            <l-helix size="90" speed="2.5" color="#00f0ff"></l-helix>
          </div>
        </div>
        <MainLogo key={isVisible ? 'visible' : 'hidden'} size="lg" forceColor="#00f0ff" />
      </div>
    </div>
  );
};
