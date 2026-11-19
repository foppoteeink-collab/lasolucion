import React, { useEffect, useRef } from 'react';
import { simplex3 } from '../utils/perlinNoise';
import { useUIStore } from '../store/useUIStore';
import { useSystemPalette } from '../utils/systemPalette';

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

// P0 Target FPS: 20 FPS (50ms interval) to eliminate GPU/CPU thermal throttling on mobile SoCs
const TARGET_FPS = 20;
const TARGET_FRAME_MS = 1000 / TARGET_FPS; // 50.0 ms

export const QuantumNoiseCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zenMode = useUIStore((s) => s.zenMode);
  const glowIntensity = useUIStore((s) => s.glowIntensity);
  const palette = useSystemPalette();

  useEffect(() => {
    // Si el usuario activa el Modo Zen o apaga la emisión lumínica, suspendemos el canvas
    if (zenMode || glowIntensity === 'off') return;
    const dynamicColors = [palette.c1, palette.c1, palette.c2, palette.c3, palette.c4];

    // Detectar si el usuario prefiere movimiento reducido en el sistema operativo
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let isVisible = !document.hidden;
    let isIntersecting = true;
    let isBatteryThrottled = false;
    let isScrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let time = 0;
    let lastTimestamp = performance.now();
    let lastFrameTime = performance.now();

    // Mouse / touch subtle perturbation & idle detection
    const mouse = { x: -1000, y: -1000, active: false };

    let startLoopIfEligible = () => {};

    // Modo Reposo Ecológico: pausa el render loop tras 45s de inactividad total
    let isIdle = false;
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    const IDLE_TIME_MS = 45000;

    const wakeUpAndResetIdle = () => {
      if (isIdle) {
        isIdle = false;
        startLoopIfEligible();
      }
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        isIdle = true;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      }, IDLE_TIME_MS);
    };

    const handleMouseMove = (e: MouseEvent) => {
      wakeUpAndResetIdle();
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      wakeUpAndResetIdle();
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    // Pausar actualización durante scroll activo para priorizar 60 FPS en listas nativas
    const handleScroll = () => {
      wakeUpAndResetIdle();
      isScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    const createParticle = (initRandom = false): Particle => {
      const x = initRandom ? Math.random() * width : (Math.random() < 0.5 ? 0 : Math.random() * width);
      const y = initRandom ? Math.random() * height : (Math.random() < 0.5 ? 0 : Math.random() * height);
      const color = dynamicColors[Math.floor(Math.random() * dynamicColors.length)];
      const maxLife = 220 + Math.random() * 280;

      return {
        x,
        y,
        prevX: x,
        prevY: y,
        speed: 0.35 + Math.random() * 0.55,
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Conteo de partículas adaptativo: 16 en móviles, 36 en desktop
      const count = width < 768 ? 16 : 36;
      particles = Array.from({ length: count }, () => createParticle(true));
    };

    resize();

    // Render loop con control estricto de 20 FPS (50ms por cuadro) y auto-reposo inteligente
    const render = (now: number) => {
      if (!isVisible || !isIntersecting || isBatteryThrottled || isIdle) {
        animationFrameId = 0;
        return;
      }

      const elapsed = now - lastFrameTime;
      if (elapsed < TARGET_FRAME_MS) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now - (elapsed % TARGET_FRAME_MS);

      if (isScrolling) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;
      time += delta * 1000;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.prevX = p.x;
        p.prevY = p.y;
        p.life++;

        const halfLife = p.maxLife / 2;
        const progress =
          p.life < halfLife
            ? p.life / halfLife
            : (p.maxLife - p.life) / halfLife;
        p.currentAlpha = Math.max(0, p.baseAlpha * progress);

        const angle =
          simplex3(p.x * 0.0011, p.y * 0.0011, time * 0.00014) * Math.PI * 2.5;

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

        if (
          p.x < -20 ||
          p.x > width + 20 ||
          p.y < -20 ||
          p.y > height + 20 ||
          p.life >= p.maxLife
        ) {
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

      if (isVisible && isIntersecting && !isBatteryThrottled && !isIdle) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        animationFrameId = 0;
      }
    };

    startLoopIfEligible = () => {
      if (isVisible && isIntersecting && !isBatteryThrottled && !isIdle && !animationFrameId) {
        lastTimestamp = performance.now();
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // 1. IntersectionObserver: Suspende rAF al estar fuera del viewport
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersecting = Boolean(entry?.isIntersecting);
        if (isIntersecting) {
          startLoopIfEligible();
        } else if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    // 2. Battery Status API: Pausa automática si la batería es baja (<= 20% y sin cargar)
    let batteryApiCleaners: (() => void)[] = [];
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          const evaluateBattery = () => {
            const isLow = battery.level <= 0.2 && !battery.charging;
            isBatteryThrottled = isLow;
            if (isLow && animationFrameId) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = 0;
            } else if (!isLow) {
              startLoopIfEligible();
            }
          };

          evaluateBattery();

          const onLevelChange = () => evaluateBattery();
          const onChargingChange = () => evaluateBattery();

          battery.addEventListener('levelchange', onLevelChange);
          battery.addEventListener('chargingchange', onChargingChange);

          batteryApiCleaners.push(() => {
            battery.removeEventListener('levelchange', onLevelChange);
            battery.removeEventListener('chargingchange', onChargingChange);
          });
        })
        .catch(() => {});
    }

    // 3. Document Visibility API
    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        startLoopIfEligible();
      } else if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointerdown', wakeUpAndResetIdle, { passive: true });
    window.addEventListener('keydown', wakeUpAndResetIdle, { passive: true });

    wakeUpAndResetIdle();
    startLoopIfEligible();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (idleTimeout) clearTimeout(idleTimeout);
      intersectionObserver.disconnect();
      batteryApiCleaners.forEach((clean) => clean());
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointerdown', wakeUpAndResetIdle);
      window.removeEventListener('keydown', wakeUpAndResetIdle);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [zenMode, glowIntensity, palette.c1, palette.c2, palette.c3, palette.c4]);

  if (zenMode || glowIntensity === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className="ambient-canvas absolute inset-0 pointer-events-none z-0 opacity-90"
      aria-hidden="true"
    />
  );
};
