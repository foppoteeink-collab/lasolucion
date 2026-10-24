import React, { useEffect, useRef } from 'react';
import { simplex3 } from '../utils/perlinNoise';

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let isVisible = true;
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

    const createParticle = (initRandom = false): Particle => {
      const x = initRandom ? Math.random() * width : (Math.random() < 0.5 ? 0 : Math.random() * width);
      const y = initRandom ? Math.random() * height : (Math.random() < 0.5 ? 0 : Math.random() * height);
      const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
      const maxLife = 200 + Math.random() * 300;

      return {
        x,
        y,
        prevX: x,
        prevY: y,
        speed: 0.45 + Math.random() * 0.75, // Movimiento sutil y relajante
        size: color === '#d6f421' ? 1.2 : 1.5 + Math.random() * 0.9,
        color,
        baseAlpha: 0.18 + Math.random() * 0.22, // Muy sutil para no ensuciar
        currentAlpha: 0,
        life: initRandom ? Math.random() * maxLife : 0,
        maxLife,
      };
    };

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Adaptative count: ~70 en mobile, ~130 en desktop (eficiente y limpio)
      const count = width < 768 ? 65 : 125;
      particles = Array.from({ length: count }, () => createParticle(true));
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let lastTimestamp = performance.now();

    // Render loop
    const render = (now: number) => {
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;
      time += delta * 1000;

      // 1. Limpieza cristalina transparente para no tapar ni ensuciar el degradado del fondo
      ctx.clearRect(0, 0, width, height);

      // 2. PARTÍCULAS DE FLUJO VECTORIAL PERLIN/SIMPLEX (Puro flujo orgánico sin líneas geométricas)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.prevX = p.x;
        p.prevY = p.y;
        p.life++;

        // Ciclo de vida con fade in / fade out orgánico
        const halfLife = p.maxLife / 2;
        const progress = p.life < halfLife 
          ? p.life / halfLife 
          : (p.maxLife - p.life) / halfLife;
        p.currentAlpha = Math.max(0, p.baseAlpha * progress);

        // Vector de dirección derivado del Perlin / Simplex 3D
        const angle = simplex3(
          p.x * 0.0011, 
          p.y * 0.0011, 
          time * 0.00014
        ) * Math.PI * 2.5;

        let vx = Math.cos(angle) * p.speed;
        let vy = Math.sin(angle) * p.speed;

        // Suave influencia gravitatoria si el cursor está cerca (sutil)
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 40000 && distSq > 400) { // dentro de 200px
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 200) * 0.35;
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
          }
        }

        p.x += vx;
        p.y += vy;

        // Reaparición si sale de la pantalla o termina su vida
        if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20 || p.life >= p.maxLife) {
          particles[i] = createParticle(false);
          continue;
        }

        // Trazado del micro-filamento
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.currentAlpha * 0.85;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Núcleo brillante
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.currentAlpha;
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
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
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

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
