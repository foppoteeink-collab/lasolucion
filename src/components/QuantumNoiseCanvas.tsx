import React, { useEffect, useRef } from 'react';
import { simplex3 } from '../utils/perlinNoise';
import { useUIStore } from '../store/useUIStore';

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
  size: number;
  color: string;
  baseAlpha: number;
  currentAlpha: number;
  life: number;
  maxLife: number;
}

// Brand palette: Cyan Cuántico (#00f0ff), Magia Púrpura (#9600ff), Lima Energía (#d6f421)
const BRAND_COLORS = [
  '#00f0ff', // Cian Cuántico (Primary)
  '#00f0ff',
  '#9600ff', // Magia Púrpura (Accent)
  '#a855f7', // Orquídea Púrpura suave
  '#d6f421', // Lima Energía Neón (Vibrance)
];

export const QuantumNoiseCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zenMode = useUIStore(s => s.zenMode);

  useEffect(() => {
    // Si el usuario activa el Modo Zen / Ahorro de Batería, suspendemos el canvas por completo
    if (zenMode) return;

    // Detectar si el usuario prefiere movimiento reducido en el sistema
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let isVisible = !document.hidden;
    let isScrolling = false;
    let scrollTimeout: any = null;
    let time = 0;

    // Mouse / touch subtle perturbation
    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    // Pausar actualización durante scroll activo para garantizar 60 FPS fluidos en listas
    const handleScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 120);
    };

    const createParticle = (initRandom = false): Particle => {
      const x = initRandom ? Math.random() * width : (Math.random() < 0.5 ? 0 : Math.random() * width);
      const y = initRandom ? Math.random() * height : (Math.random() < 0.5 ? 0 : Math.random() * height);
      const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
      const maxLife = 220 + Math.random() * 280;

      return {
        x,
        y,
        prevX: x,
        prevY: y,
        speed: 0.4 + Math.random() * 0.6,
        size: color === '#d6f421' ? 1.2 : 1.4 + Math.random() * 0.8,
        color,
        baseAlpha: 0.16 + Math.random() * 0.18,
        currentAlpha: 0,
        life: initRandom ? Math.random() * maxLife : 0,
        maxLife,
      };
    };

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25); // Limitado a 1.25 para no saturar memoria GPU
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Partículas ultra-optimizadas: 20 en mobile, 50 en desktop
      const count = width < 768 ? 20 : 50;
      particles = Array.from({ length: count }, () => createParticle(true));
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTimestamp = performance.now();
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let lastTimestamp = performance.now();
    let lastFrameTime = performance.now();
    const TARGET_FRAME_MS = 33.3; // 30 FPS target (ahorro de batería del 50% vs 60/120Hz sin pérdida visual)

    // Render loop
    const render = (now: number) => {
      if (!isVisible) return;

      const elapsed = now - lastFrameTime;
      if (elapsed < TARGET_FRAME_MS) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now - (elapsed % TARGET_FRAME_MS);

      // Si el usuario está scrolleando, saltamos el cálculo para no competir con el scroll
      if (isScrolling) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;
      time += delta * 1000;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.prevX = p.x;
        p.prevY = p.y;
        p.life++;

        const halfLife = p.maxLife / 2;
        const progress = p.life < halfLife 
          ? p.life / halfLife 
          : (p.maxLife - p.life) / halfLife;
        p.currentAlpha = Math.max(0, p.baseAlpha * progress);

        const angle = simplex3(
          p.x * 0.0011, 
          p.y * 0.0011, 
          time * 0.00014
        ) * Math.PI * 2.5;

        let vx = Math.cos(angle) * p.speed;
        let vy = Math.sin(angle) * p.speed;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 30000 && distSq > 400) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 173) * 0.3;
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
          }
        }

        p.x += vx;
        p.y += vy;

        if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20 || p.life >= p.maxLife) {
          particles[i] = createParticle(false);
          continue;
        }

        // Trazado del filamento
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.currentAlpha * 0.8;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Núcleo brillante
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.currentAlpha;
        ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      if (isVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(scrollTimeout);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [zenMode]);

  if (zenMode) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        mixBlendMode: 'screen',
      }}
      aria-hidden="true"
    />
  );
};
