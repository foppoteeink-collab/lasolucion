import React, { useEffect, useState } from 'react';
import { SciFiLogo } from './SciFiLogo';
import { MainLogo } from './MainLogo';
import { QuantumCubeLoader } from './QuantumCubeLoader';

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
        className={`flex flex-col items-center gap-5 transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
      >
        <div className="relative mb-1 flex items-center justify-center">
          <QuantumCubeLoader size="md" speed="slow" showLabel={false} />
        </div>
        <MainLogo key={isVisible ? 'visible' : 'hidden'} size="lg" speed="fast" />
      </div>
    </div>
  );
};
