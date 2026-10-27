/**
 * MOTOR TIPOGRÁFICO KINÉTICO Y TÉRMICO (ESTILO MOXEN)
 * Transforma texto estándar en una matriz tipográfica multiescalar que reacciona
 * térmicamente al cursor o al tacto del usuario mediante interpolación GPU.
 */

interface TiposInstance {
  destroy: () => void;
  recalculate: () => void;
}

interface LetterData {
  element: HTMLElement;
  layers: HTMLElement[];
  centerX: number;
  centerY: number;
  currentHeat: number;
  targetHeat: number;
}

/**
 * Monta el motor de calor tipográfico sobre un elemento DOM contenedor
 */
export function mountTiposElement(container: HTMLElement): TiposInstance {
  const originalText = container.getAttribute('data-tipos-text') || container.textContent?.trim() || 'LA SOLUCIÓN';
  container.setAttribute('data-tipos-text', originalText);
  
  // Limpiar contenido previo para reconstruir estructura kinética
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.display = 'inline-block';
  container.style.userSelect = 'none';
  container.style.webkitUserSelect = 'none';

  // Lector de accesibilidad (para lectores de pantalla)
  const lector = document.createElement('span');
  lector.className = 'tp-lector';
  lector.textContent = originalText;
  container.appendChild(lector);

  // Línea contenedora
  const linea = document.createElement('span');
  linea.className = 'tp-linea';
  container.appendChild(linea);

  // Span de medición oculto
  const mide = document.createElement('span');
  mide.className = 'tp-mide font-semibold';
  mide.style.fontFamily = 'var(--tp-base)';
  container.appendChild(mide);

  const letters: LetterData[] = [];
  const chars = Array.from(originalText);

  // Función para medir y posicionar cada carácter con precisión milimétrica
  function buildLetters() {
    linea.innerHTML = '';
    letters.length = 0;

    let currentLeft = 0;

    chars.forEach((char) => {
      if (char === ' ') {
        // Medir ancho de espacio natural
        mide.textContent = 'M';
        const mWidth = mide.getBoundingClientRect().width;
        const spaceWidth = mWidth * 0.35; // Espaciado noble entre palabras
        currentLeft += spaceWidth;
        return;
      }

      // Medir ancho exacto de la letra en la tipografía base
      mide.textContent = char;
      const charWidth = mide.getBoundingClientRect().width || 14;

      const letra = document.createElement('span');
      letra.className = 'tp-letra';
      letra.style.left = `${currentLeft}px`;
      letra.style.width = `${charWidth}px`;

      // 5 Capas tipográficas del efecto Moxen
      const capaClasses = ['is-base', 'is-fina', 'is-mono', 'is-negra', 'is-cursiva'];
      const layerElements: HTMLElement[] = [];

      capaClasses.forEach((capaClass, index) => {
        const capa = document.createElement('i');
        capa.className = `tp-capa ${capaClass}`;
        capa.textContent = char;
        capa.style.opacity = index === 0 ? '1' : '0';
        letra.appendChild(capa);
        layerElements.push(capa);
      });

      linea.appendChild(letra);

      letters.push({
        element: letra,
        layers: layerElements,
        centerX: currentLeft + charWidth / 2,
        centerY: 0,
        currentHeat: 0,
        targetHeat: 0,
      });

      currentLeft += charWidth;
    });

    linea.style.width = `${currentLeft}px`;
  }

  // Recalcular posiciones físicas relativas al viewport
  function updateLetterMetrics() {
    const lineaRect = linea.getBoundingClientRect();
    letters.forEach((l) => {
      const rect = l.element.getBoundingClientRect();
      l.centerX = rect.left + rect.width / 2;
      l.centerY = rect.top + rect.height / 2;
    });
  }

  buildLetters();

  // Esperar a que las fuentes web estén completamente renderizadas para ajustar métricas
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      buildLetters();
      updateLetterMetrics();
    });
  }

  let rafId: number | null = null;
  let isPointerInside = false;
  let pointerX = -9999;
  let pointerY = -9999;
  const INFLUENCE_RADIUS = 110; // Radio de radiación de calor térmico (px)

  // Bucle de animación física por GPU
  function tick() {
    let hasMotion = false;

    letters.forEach((l) => {
      // Interpolar calor suavemente hacia el calor objetivo
      const diff = l.targetHeat - l.currentHeat;
      if (Math.abs(diff) > 0.002) {
        l.currentHeat += diff * 0.18;
        hasMotion = true;
      } else {
        l.currentHeat = l.targetHeat;
      }

      const h = Math.max(0, Math.min(1, l.currentHeat));

      // Mapear h (0 a 1) a través de las 5 capas morfológicas
      const p = h * 4; // Escala 0 a 4
      l.layers.forEach((layer, idx) => {
        // Curva suave de opacidad entre capas adyacentes
        const distance = Math.abs(p - idx);
        let opacity = 0;
        if (distance < 1) {
          opacity = 1 - distance;
        } else if (idx === 0 && p < 1) {
          opacity = 1 - p;
        }
        layer.style.opacity = opacity.toFixed(3);
      });

      // Transformación kinética: estiramiento vertical, escala y micro-inclinación
      if (h > 0.01) {
        const scale = 1 + h * 0.14;
        const translateY = -h * 4;
        const tilt = ((pointerX - l.centerX) / INFLUENCE_RADIUS) * -3 * h;
        l.element.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotate(${tilt.toFixed(1)}deg)`;
      } else {
        l.element.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
      }
    });

    if (hasMotion || isPointerInside) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function startAnimation() {
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    isPointerInside = true;
    pointerX = e.clientX;
    pointerY = e.clientY;

    letters.forEach((l) => {
      const dx = pointerX - l.centerX;
      const dy = pointerY - l.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < INFLUENCE_RADIUS) {
        // Curva cuadrática de radiación térmica
        const factor = 1 - dist / INFLUENCE_RADIUS;
        l.targetHeat = factor * factor;
      } else {
        l.targetHeat = 0;
      }
    });

    startAnimation();
  }

  function handlePointerLeave() {
    isPointerInside = false;
    pointerX = -9999;
    pointerY = -9999;
    letters.forEach((l) => {
      l.targetHeat = 0;
    });
    startAnimation();
  }

  // Event Listeners con captura pasiva para máximo rendimiento táctil y scroll
  container.addEventListener('pointerenter', updateLetterMetrics, { passive: true });
  container.addEventListener('pointermove', handlePointerMove, { passive: true });
  container.addEventListener('pointerdown', (e) => {
    updateLetterMetrics();
    handlePointerMove(e);
  }, { passive: true });
  container.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  container.addEventListener('pointercancel', handlePointerLeave, { passive: true });

  const resizeObserver = new ResizeObserver(() => {
    buildLetters();
    updateLetterMetrics();
  });
  resizeObserver.observe(container);

  return {
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('pointerenter', updateLetterMetrics);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('pointercancel', handlePointerLeave);
      resizeObserver.disconnect();
    },
    recalculate: () => {
      buildLetters();
      updateLetterMetrics();
    },
  };
}

/**
 * Escanea el documento o un contenedor y activa automáticamente
 * cualquier elemento con el atributo [data-tipos].
 */
export function initAllTiposElements(root: HTMLElement | Document = document): () => void {
  const elements = root.querySelectorAll<HTMLElement>('[data-tipos]');
  const instances: TiposInstance[] = [];

  elements.forEach((el) => {
    instances.push(mountTiposElement(el));
  });

  return () => {
    instances.forEach((inst) => inst.destroy());
  };
}
