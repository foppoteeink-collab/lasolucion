import { KaiCustomForm, KaiMultiverseStyle } from '../types';

interface ImageSampleAnalysis {
  aspectRatio: number; // width / height
  density: number; // 0 to 1
  isDualPeaked: boolean; // true if ears, horns, or headphones
  isConvex: boolean; // true if bulging in middle (round / diamond)
  isSlender: boolean; // true if tall and narrow (monolith / bottle)
  isHourglass: boolean; // true if pinched waist
  isWide: boolean; // true if wide wings or arch
  halfWidths: number[]; // 10 normalized widths (0 to 1) from top to bottom
  centerOffsets: number[]; // 10 normalized center shifts (-1 to 1)
  dominantBrightness: number; // 0 to 255
  signatureHash: number;
}

/**
 * Carga la imagen en un lienzo fuera de pantalla de 36x36 píxeles
 * para extraer su silueta, relación de aspecto y distribución de masa.
 */
function extractImageDataFromCanvas(
  imageBase64: string,
  sampleDim = 36
): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timer = setTimeout(() => {
        resolve(null);
      }, 1500);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = sampleDim;
          canvas.height = sampleDim;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, sampleDim, sampleDim);
          const imgData = ctx.getImageData(0, 0, sampleDim, sampleDim);
          resolve({
            data: imgData.data,
            width: sampleDim,
            height: sampleDim,
          });
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };

      img.src = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Análisis determinista a partir de los bytes Base64 cuando no hay canvas disponible
 */
function analyzeBase64Bytes(cleanBase64: string): ImageSampleAnalysis {
  let hash = 0;
  for (let i = 0; i < cleanBase64.length; i++) {
    hash = (hash << 5) - hash + cleanBase64.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const halfWidths: number[] = [];
  const centerOffsets: number[] = [];
  const sliceSize = Math.max(1, Math.floor(cleanBase64.length / 10));

  for (let i = 0; i < 10; i++) {
    const chunk = cleanBase64.slice(i * sliceSize, (i + 1) * sliceSize);
    let chunkSum = 0;
    for (let j = 0; j < chunk.length; j++) {
      chunkSum += chunk.charCodeAt(j);
    }
    const normalized = (chunkSum % 1000) / 1000;
    halfWidths.push(0.25 + normalized * 0.7);
    centerOffsets.push(((chunkSum % 200) - 100) / 500);
  }

  return {
    aspectRatio: 0.6 + (absHash % 100) / 70,
    density: 0.4 + (absHash % 50) / 100,
    isDualPeaked: absHash % 3 === 0,
    isConvex: absHash % 4 === 1,
    isSlender: absHash % 5 === 2,
    isHourglass: absHash % 6 === 3,
    isWide: absHash % 7 === 4,
    halfWidths,
    centerOffsets,
    dominantBrightness: absHash % 256,
    signatureHash: absHash,
  };
}

/**
 * Analiza la matriz de píxeles (36x36) para detectar la silueta real del objeto
 */
function analyzePixelMatrix(data: Uint8ClampedArray, dim: number): ImageSampleAnalysis {
  const cornerIndices = [
    0,
    (dim - 1) * 4,
    dim * (dim - 1) * 4,
    (dim * dim - 1) * 4,
    Math.floor(dim / 2) * 4,
    ((dim - 1) * dim + Math.floor(dim / 2)) * 4,
  ];

  let bgR = 0, bgG = 0, bgB = 0, bgA = 0;
  for (const idx of cornerIndices) {
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
    bgA += data[idx + 3];
  }
  bgR /= cornerIndices.length;
  bgG /= cornerIndices.length;
  bgB /= cornerIndices.length;
  bgA /= cornerIndices.length;

  const isTransparentBg = bgA < 120;
  const mask: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));
  let minX = dim, maxX = 0, minY = dim, maxY = 0;
  let totalForeground = 0;
  let totalLum = 0;
  let hash = 0;

  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const idx = (y * dim + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      let isFg = false;
      if (isTransparentBg) {
        isFg = a > 140;
      } else {
        const colorDist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        isFg = colorDist > 45 || Math.abs(a - bgA) > 60;
      }

      if (isFg) {
        mask[y][x] = true;
        totalForeground++;
        totalLum += (r * 0.299 + g * 0.587 + b * 0.114);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hash = (hash << 3) ^ (r + (g << 2) + (b << 4));
      }
    }
  }

  if (totalForeground < 25) {
    return analyzeBase64Bytes('fallback-empty');
  }

  const objW = Math.max(1, maxX - minX + 1);
  const objH = Math.max(1, maxY - minY + 1);
  const aspectRatio = objW / objH;

  const halfWidths: number[] = [];
  const centerOffsets: number[] = [];
  const sliceH = Math.max(1, Math.floor(objH / 10));

  for (let s = 0; s < 10; s++) {
    const startY = minY + s * sliceH;
    const endY = Math.min(maxY, startY + sliceH);
    let sMinX = dim, sMaxX = 0, hasPix = false;

    for (let y = startY; y < endY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (mask[y][x]) {
          hasPix = true;
          if (x < sMinX) sMinX = x;
          if (x > sMaxX) sMaxX = x;
        }
      }
    }

    if (hasPix) {
      const w = (sMaxX - sMinX + 1) / objW;
      halfWidths.push(Math.max(0.2, Math.min(1.0, w)));
      const mid = (sMinX + sMaxX) / 2;
      const center = (mid - (minX + objW / 2)) / (objW / 2);
      centerOffsets.push(center);
    } else {
      halfWidths.push(halfWidths.length > 0 ? halfWidths[halfWidths.length - 1] * 0.8 : 0.4);
      centerOffsets.push(0);
    }
  }

  const maxHW = Math.max(...halfWidths);
  const normalizedHW = halfWidths.map(h => h / (maxHW || 1));

  const isDualPeaked = normalizedHW[0] > 0.6 && normalizedHW[2] < 0.65 && normalizedHW[5] > 0.7;
  const isConvex = normalizedHW[4] > normalizedHW[0] * 1.3 && normalizedHW[4] > normalizedHW[9] * 1.3;
  const isSlender = aspectRatio < 0.75;
  const isHourglass = normalizedHW[4] < normalizedHW[1] * 0.75 && normalizedHW[4] < normalizedHW[8] * 0.75;
  const isWide = aspectRatio > 1.3;

  return {
    aspectRatio,
    density: totalForeground / (objW * objH),
    isDualPeaked,
    isConvex,
    isSlender,
    isHourglass,
    isWide,
    halfWidths: normalizedHW,
    centerOffsets,
    dominantBrightness: totalLum / (dim * dim),
    signatureHash: Math.abs(hash),
  };
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * IDENTIFICADOR DE OBJETO (DETECCIÓN POR CONTEXTO Y SILUETA)
 * ══════════════════════════════════════════════════════════════════════════════
 */
function identifyObjectCategory(
  prompt: string,
  analysis: ImageSampleAnalysis
): { category: 'sunglasses' | 'lighter' | 'headphones' | 'watch' | 'mug' | 'dumbbell' | 'apple' | 'monolith' | 'animal' | 'bespoke'; label: string } {
  const p = prompt.toLowerCase();

  // 1. Coincidencia por texto / prompt del usuario
  if (p.includes('gafa') || p.includes('lente') || p.includes('anteojo') || p.includes('sunglass') || p.includes('visor') || p.includes('rayban') || p.includes('polarizado')) {
    return { category: 'sunglasses', label: 'Gafas de Sol' };
  }
  if (p.includes('encendedor') || p.includes('mechero') || p.includes('zippo') || p.includes('lighter') || p.includes('fuego') || p.includes('bic') || p.includes('chispa') || p.includes('clipper') || p.includes('gas')) {
    return { category: 'lighter', label: 'Encendedor' };
  }
  if (p.includes('audifono') || p.includes('audífono') || p.includes('auricular') || p.includes('headphone') || p.includes('headset') || p.includes('sony') || p.includes('airpod') || p.includes('diadema') || p.includes('bose')) {
    return { category: 'headphones', label: 'Audífonos' };
  }
  if (p.includes('reloj') || p.includes('watch') || p.includes('smartwatch') || p.includes('cronometro') || p.includes('cronómetro') || p.includes('rolex') || p.includes('casio')) {
    return { category: 'watch', label: 'Reloj' };
  }
  if (p.includes('taza') || p.includes('cafe') || p.includes('café') || p.includes('vaso') || p.includes('termo') || p.includes('mug') || p.includes('cup') || p.includes('starbucks') || p.includes('pocillo')) {
    return { category: 'mug', label: 'Taza de Café' };
  }
  if (p.includes('pesa') || p.includes('mancuerna') || p.includes('dumbbell') || p.includes('gym') || p.includes('barra') || p.includes('disco') || p.includes('fitness')) {
    return { category: 'dumbbell', label: 'Pesa / Mancuerna' };
  }
  if (p.includes('perro') || p.includes('gato') || p.includes('dog') || p.includes('cat') || p.includes('mascota') || p.includes('lobo') || p.includes('wolf') || p.includes('pantera') || p.includes('tigre') || p.includes('loro') || p.includes('ave') || p.includes('conejo')) {
    return { category: 'animal', label: 'Mascota Cyber' };
  }
  if (p.includes('celular') || p.includes('telefono') || p.includes('teléfono') || p.includes('smartphone') || p.includes('iphone') || p.includes('pantalla') || p.includes('movil') || p.includes('móvil') || p.includes('monolito') || p.includes('caja') || p.includes('bateria') || p.includes('powerbank') || p.includes('tarjeta') || p.includes('rectangulo') || p.includes('rectángulo')) {
    return { category: 'monolith', label: 'Monolito Cibernético' };
  }
  if (p.includes('manzana') || p.includes('fruta') || p.includes('apple') || p.includes('fruto')) {
    return { category: 'apple', label: 'Manzana' };
  }

  // 2. Coincidencia por morfología visual (si el prompt está vacío)
  if (analysis.isWide && analysis.isDualPeaked) {
    return { category: 'headphones', label: 'Audífonos' };
  }
  if (analysis.isWide && analysis.aspectRatio > 1.35) {
    return { category: 'sunglasses', label: 'Gafas de Sol' };
  }
  // Si es esbelto o rectangular vertical: encendedor o monolito
  if (analysis.isSlender && analysis.aspectRatio < 0.65) {
    return { category: 'lighter', label: 'Encendedor' };
  }
  if (analysis.aspectRatio >= 0.55 && analysis.aspectRatio <= 0.85) {
    return { category: 'monolith', label: 'Monolito Cibernético' };
  }
  if (analysis.isHourglass) {
    return { category: 'dumbbell', label: 'Pesa / Mancuerna' };
  }
  if (analysis.isConvex && analysis.aspectRatio >= 0.85 && analysis.aspectRatio <= 1.2) {
    return { category: 'apple', label: 'Manzana' };
  }

  return { category: 'bespoke', label: 'Compañero Forja Neural' };
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * GENERADORES ICONOGRÁFICOS CYBER-ORIGAMI (CANON ESTRICTO KAI)
 * NUNCA DIBUJAN CAJAS VACÍAS NI RECTÁNGULOS PLANOS:
 * SIEMPRE FACETAS TRIANGULARES 3D, BISELES ANGULARES Y OJO SAGRADO INTEGRADO.
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ⚡ 1. ENCENDEDOR // KAI IGNIS MONOLITO
function buildLighterKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Base y pedestal biselado inferior
      { x1: 56, y1: 136, x2: 104, y2: 136 },
      { x1: 56, y1: 136, x2: 46, y2: 126 },
      { x1: 104, y1: 136, x2: 114, y2: 126 },
      // Laterales de armadura
      { x1: 46, y1: 126, x2: 46, y2: 74 },
      { x1: 114, y1: 126, x2: 114, y2: 74 },

      // Costura biselada de la tapa abatible
      { x1: 46, y1: 74, x2: 114, y2: 74 },
      { x1: 46, y1: 74, x2: 50, y2: 44 },
      { x1: 114, y1: 74, x2: 110, y2: 44 },
      { x1: 50, y1: 44, x2: 80, y2: 38 },
      { x1: 110, y1: 44, x2: 80, y2: 38 },

      // Chimenea / Cortavientos perforado metálico
      { x1: 62, y1: 44, x2: 98, y2: 44 },
      { x1: 62, y1: 74, x2: 62, y2: 44 },
      { x1: 98, y1: 74, x2: 98, y2: 44 },
      // Ranuras de ventilación
      { x1: 68, y1: 58, x2: 74, y2: 58 },
      { x1: 86, y1: 58, x2: 92, y2: 58 },

      // Rueda de chispa facetada
      { x1: 46, y1: 74, x2: 38, y2: 62 },
      { x1: 38, y1: 62, x2: 46, y2: 52 },
      { x1: 46, y1: 52, x2: 62, y2: 56 },
      { x1: 114, y1: 74, x2: 122, y2: 62 },
      { x1: 122, y1: 62, x2: 114, y2: 52 },
      { x1: 114, y1: 52, x2: 98, y2: 56 },

      // LLAMA DE PLASMA EN APEX SUPERIOR
      { x1: 80, y1: 14, x2: 68, y2: 32 },
      { x1: 80, y1: 14, x2: 92, y2: 32 },
      { x1: 68, y1: 32, x2: 74, y2: 44 },
      { x1: 92, y1: 32, x2: 86, y2: 44 },
      { x1: 80, y1: 22, x2: 74, y2: 34 },
      { x1: 80, y1: 22, x2: 86, y2: 34 },
      { x1: 74, y1: 34, x2: 80, y2: 40 },
      { x1: 86, y1: 34, x2: 80, y2: 40 },

      // Facetas 3D en espina de pez alrededor del Ojo Central (80, 85)
      { x1: 80, y1: 74, x2: 62, y2: 88 },
      { x1: 80, y1: 74, x2: 98, y2: 88 },
      { x1: 62, y1: 88, x2: 80, y2: 104 },
      { x1: 98, y1: 88, x2: 80, y2: 104 },
      { x1: 46, y1: 96, x2: 62, y2: 88 },
      { x1: 114, y1: 96, x2: 98, y2: 88 },
      { x1: 46, y1: 96, x2: 64, y2: 116 },
      { x1: 114, y1: 96, x2: 96, y2: 116 },
      { x1: 80, y1: 104, x2: 80, y2: 126 },
      { x1: 64, y1: 116, x2: 80, y2: 126 },
      { x1: 96, y1: 116, x2: 80, y2: 126 },
      { x1: 80, y1: 126, x2: 80, y2: 136 },
    ],
    polygons: [
      { points: '80,14 68,32 74,44 86,44 92,32' },
      { points: '50,44 80,38 110,44 114,74 46,74' },
      { points: '80,74 62,88 80,104 98,88' },
      { points: '46,74 62,88 46,96' },
      { points: '114,74 98,88 114,96' },
      { points: '56,136 104,136 114,126 46,126' },
    ],
  };
}

// 📱 2. MONOLITO CIBERNÉTICO // KAI AETHER-BLOCK (Para Móviles, Gadgets, Cajas, Libros o Rectángulos)
function buildMonolithKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Corona superior en cresta angular
      { x1: 80, y1: 18, x2: 58, y2: 28 },
      { x1: 80, y1: 18, x2: 102, y2: 28 },
      // Chaflanes de esquina superior
      { x1: 58, y1: 28, x2: 44, y2: 44 },
      { x1: 102, y1: 28, x2: 116, y2: 44 },
      // Flancos blindados
      { x1: 44, y1: 44, x2: 44, y2: 118 },
      { x1: 116, y1: 44, x2: 116, y2: 118 },
      // Chaflanes de esquina inferior
      { x1: 44, y1: 118, x2: 58, y2: 134 },
      { x1: 116, y1: 118, x2: 102, y2: 134 },
      // Quilla de levitación inferior
      { x1: 58, y1: 134, x2: 80, y2: 144 },
      { x1: 102, y1: 134, x2: 80, y2: 144 },

      // Costillas de Facetado Origami en el Pecho Superior
      { x1: 80, y1: 18, x2: 80, y2: 56 },
      { x1: 58, y1: 28, x2: 80, y2: 56 },
      { x1: 102, y1: 28, x2: 80, y2: 56 },
      { x1: 44, y1: 44, x2: 80, y2: 56 },
      { x1: 116, y1: 44, x2: 80, y2: 56 },

      // Cámara Ocular Central en Diamante Alrededor del Ojo (80, 85)
      { x1: 80, y1: 64, x2: 58, y2: 85 },
      { x1: 80, y1: 64, x2: 102, y2: 85 },
      { x1: 58, y1: 85, x2: 80, y2: 106 },
      { x1: 102, y1: 85, x2: 80, y2: 106 },
      // Líneas de conexión entre el pecho y la cámara ocular
      { x1: 80, y1: 56, x2: 80, y2: 64 },
      { x1: 44, y1: 72, x2: 58, y2: 85 },
      { x1: 116, y1: 72, x2: 102, y2: 85 },

      // Brackets de Energía Laterales (HUD Matrix)
      { x1: 44, y1: 98, x2: 58, y2: 85 },
      { x1: 116, y1: 98, x2: 102, y2: 85 },
      { x1: 44, y1: 98, x2: 66, y2: 118 },
      { x1: 116, y1: 98, x2: 94, y2: 118 },

      // Faldón Inferior en Chevron
      { x1: 80, y1: 106, x2: 66, y2: 118 },
      { x1: 80, y1: 106, x2: 94, y2: 118 },
      { x1: 66, y1: 118, x2: 80, y2: 130 },
      { x1: 94, y1: 118, x2: 80, y2: 130 },
      { x1: 80, y1: 130, x2: 80, y2: 144 },
      { x1: 58, y1: 134, x2: 80, y2: 130 },
      { x1: 102, y1: 134, x2: 80, y2: 130 },
    ],
    polygons: [
      { points: '80,18 58,28 80,56 102,28' },
      { points: '80,64 58,85 80,106 102,85' },
      { points: '44,44 80,56 58,28' },
      { points: '116,44 80,56 102,28' },
      { points: '80,106 66,118 80,130 94,118' },
      { points: '58,134 80,144 102,134 80,130' },
    ],
  };
}

// 🕶️ 3. GAFAS DE SOL // KAI VISOR SOLARIS
function buildSunglassesKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Visera superior en cresta facetada
      { x1: 54, y1: 46, x2: 80, y2: 36 },
      { x1: 80, y1: 36, x2: 106, y2: 46 },
      { x1: 54, y1: 46, x2: 32, y2: 64 },
      { x1: 106, y1: 46, x2: 128, y2: 64 },
      { x1: 80, y1: 36, x2: 80, y2: 64 },

      // Barra frontal superior de la montura
      { x1: 32, y1: 64, x2: 128, y2: 64 },

      // Lente Izquierdo Poligonal (Dual-Facet)
      { x1: 32, y1: 64, x2: 36, y2: 102 },
      { x1: 36, y1: 102, x2: 66, y2: 108 },
      { x1: 66, y1: 108, x2: 74, y2: 88 },
      { x1: 74, y1: 88, x2: 74, y2: 64 },
      // Lente Derecho Poligonal
      { x1: 128, y1: 64, x2: 124, y2: 102 },
      { x1: 124, y1: 102, x2: 94, y2: 108 },
      { x1: 94, y1: 108, x2: 86, y2: 88 },
      { x1: 86, y1: 88, x2: 86, y2: 64 },

      // Puente Ocular Central
      { x1: 74, y1: 74, x2: 86, y2: 74 },
      { x1: 74, y1: 88, x2: 86, y2: 88 },

      // Facetas internas reflectantes
      { x1: 42, y1: 72, x2: 44, y2: 96 },
      { x1: 44, y1: 96, x2: 64, y2: 100 },
      { x1: 64, y1: 100, x2: 68, y2: 84 },
      { x1: 68, y1: 84, x2: 68, y2: 72 },
      { x1: 42, y1: 72, x2: 68, y2: 72 },

      { x1: 118, y1: 72, x2: 116, y2: 96 },
      { x1: 116, y1: 96, x2: 96, y2: 100 },
      { x1: 96, y1: 100, x2: 92, y2: 84 },
      { x1: 92, y1: 84, x2: 92, y2: 72 },
      { x1: 118, y1: 72, x2: 92, y2: 72 },

      // Patillas aerodinámicas laterales
      { x1: 32, y1: 64, x2: 20, y2: 108 },
      { x1: 20, y1: 108, x2: 26, y2: 126 },
      { x1: 128, y1: 64, x2: 140, y2: 108 },
      { x1: 140, y1: 108, x2: 134, y2: 126 },

      // Quilla de anclaje inferior al pedestal
      { x1: 66, y1: 108, x2: 80, y2: 124 },
      { x1: 94, y1: 108, x2: 80, y2: 124 },
      { x1: 80, y1: 124, x2: 80, y2: 140 },
    ],
    polygons: [
      { points: '32,64 36,102 66,108 74,88 74,64' },
      { points: '128,64 124,102 94,108 86,88 86,64' },
      { points: '54,46 80,36 106,46 80,64' },
      { points: '66,108 80,124 94,108 80,88' },
    ],
  };
}

// 🎧 4. AUDÍFONOS // KAI SÓNICO VÓRTICE
function buildHeadphonesKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Diadema exterior en arco poligonal
      { x1: 38, y1: 72, x2: 54, y2: 40 },
      { x1: 54, y1: 40, x2: 80, y2: 22 },
      { x1: 80, y1: 22, x2: 106, y2: 40 },
      { x1: 106, y1: 40, x2: 122, y2: 72 },
      // Diadema interior
      { x1: 44, y1: 74, x2: 58, y2: 48 },
      { x1: 58, y1: 48, x2: 80, y2: 34 },
      { x1: 80, y1: 34, x2: 102, y2: 48 },
      { x1: 102, y1: 48, x2: 116, y2: 74 },
      { x1: 64, y1: 28, x2: 96, y2: 28 },

      // Horquillas laterales (Yokes)
      { x1: 38, y1: 72, x2: 26, y2: 84 },
      { x1: 38, y1: 72, x2: 54, y2: 84 },
      { x1: 122, y1: 72, x2: 134, y2: 84 },
      { x1: 122, y1: 72, x2: 106, y2: 84 },

      // Copas Auriculares Hexagonales
      // Izquierda
      { x1: 26, y1: 84, x2: 46, y2: 76 },
      { x1: 46, y1: 76, x2: 56, y2: 96 },
      { x1: 56, y1: 96, x2: 46, y2: 118 },
      { x1: 46, y1: 118, x2: 26, y2: 110 },
      { x1: 26, y1: 110, x2: 26, y2: 84 },
      // Derecha
      { x1: 134, y1: 84, x2: 114, y2: 76 },
      { x1: 114, y1: 76, x2: 104, y2: 96 },
      { x1: 104, y1: 96, x2: 114, y2: 118 },
      { x1: 114, y1: 118, x2: 134, y2: 110 },
      { x1: 134, y1: 110, x2: 134, y2: 84 },

      // Conexión sónica hacia el Ojo Central (80, 85)
      { x1: 56, y1: 96, x2: 68, y2: 85 },
      { x1: 104, y1: 96, x2: 92, y2: 85 },
      { x1: 80, y1: 34, x2: 80, y2: 66 },
      { x1: 80, y1: 104, x2: 80, y2: 138 },
      { x1: 46, y1: 118, x2: 80, y2: 138 },
      { x1: 114, y1: 118, x2: 80, y2: 138 },
    ],
    polygons: [
      { points: '26,84 46,76 56,96 46,118 26,110' },
      { points: '134,84 114,76 104,96 114,118 134,110' },
      { points: '54,40 80,22 106,40 102,48 80,34 58,48' },
      { points: '68,85 80,104 92,85 80,66' },
    ],
  };
}

// ⌚ 5. RELOJ / SMARTWATCH // KAI CRONO-BISEL
function buildWatchKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Bisel Octagonal Exterior
      { x1: 58, y1: 62, x2: 102, y2: 62 },
      { x1: 102, y1: 62, x2: 124, y2: 85 },
      { x1: 124, y1: 85, x2: 102, y2: 108 },
      { x1: 102, y1: 108, x2: 58, y2: 108 },
      { x1: 58, y1: 108, x2: 36, y2: 85 },
      { x1: 36, y1: 85, x2: 58, y2: 62 },

      // Esfera Circular Interna
      { x1: 64, y1: 68, x2: 96, y2: 68 },
      { x1: 96, y1: 68, x2: 112, y2: 85 },
      { x1: 112, y1: 85, x2: 96, y2: 102 },
      { x1: 96, y1: 102, x2: 64, y2: 102 },
      { x1: 64, y1: 102, x2: 48, y2: 85 },
      { x1: 48, y1: 85, x2: 64, y2: 68 },

      // Eslabones de Correa Superior
      { x1: 64, y1: 62, x2: 68, y2: 24 },
      { x1: 96, y1: 62, x2: 92, y2: 24 },
      { x1: 68, y1: 24, x2: 92, y2: 24 },
      { x1: 66, y1: 42, x2: 94, y2: 42 },

      // Eslabones de Correa Inferior
      { x1: 64, y1: 108, x2: 68, y2: 144 },
      { x1: 96, y1: 108, x2: 92, y2: 144 },
      { x1: 68, y1: 144, x2: 92, y2: 144 },
      { x1: 66, y1: 126, x2: 94, y2: 126 },

      // Botón Pulsador / Corona Táctica
      { x1: 124, y1: 78, x2: 132, y2: 78 },
      { x1: 132, y1: 78, x2: 132, y2: 92 },
      { x1: 132, y1: 92, x2: 124, y2: 92 },

      // Retícula de Escaneo Ocular
      { x1: 80, y1: 68, x2: 80, y2: 74 },
      { x1: 80, y1: 96, x2: 80, y2: 102 },
      { x1: 48, y1: 85, x2: 56, y2: 85 },
      { x1: 104, y1: 85, x2: 112, y2: 85 },
    ],
    polygons: [
      { points: '58,62 102,62 124,85 102,108 58,108 36,85' },
      { points: '64,62 68,24 92,24 96,62' },
      { points: '64,108 68,144 92,144 96,108' },
    ],
  };
}

// ☕ 6. TAZA // KAI TERMO-REACTOR
function buildMugKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      { x1: 48, y1: 58, x2: 112, y2: 58 },
      { x1: 48, y1: 58, x2: 56, y2: 132 },
      { x1: 112, y1: 58, x2: 104, y2: 132 },
      { x1: 56, y1: 132, x2: 104, y2: 132 },
      { x1: 52, y1: 138, x2: 108, y2: 138 },
      { x1: 56, y1: 132, x2: 52, y2: 138 },
      { x1: 104, y1: 132, x2: 108, y2: 138 },

      // Asas cibernéticas simétricas
      { x1: 48, y1: 70, x2: 24, y2: 82 },
      { x1: 24, y1: 82, x2: 24, y2: 114 },
      { x1: 24, y1: 114, x2: 54, y2: 122 },
      { x1: 112, y1: 70, x2: 136, y2: 82 },
      { x1: 136, y1: 82, x2: 136, y2: 114 },
      { x1: 136, y1: 114, x2: 106, y2: 122 },

      // Vapor de plasma ascendente
      { x1: 76, y1: 52, x2: 80, y2: 20 },
      { x1: 80, y1: 20, x2: 84, y2: 52 },
      { x1: 62, y1: 54, x2: 66, y2: 30 },
      { x1: 98, y1: 54, x2: 94, y2: 30 },

      // Facetas del cáliz hacia el ojo
      { x1: 48, y1: 85, x2: 64, y2: 85 },
      { x1: 112, y1: 85, x2: 96, y2: 85 },
      { x1: 64, y1: 85, x2: 80, y2: 110 },
      { x1: 96, y1: 85, x2: 80, y2: 110 },
    ],
    polygons: [
      { points: '48,58 112,58 104,132 56,132' },
      { points: '76,52 80,20 84,52' },
      { points: '64,85 80,110 96,85 80,72' },
    ],
  };
}

// 🏋️ 7. MANCUERNA // KAI TITÁN DE FUERZA
function buildDumbbellKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      { x1: 22, y1: 60, x2: 44, y2: 60 },
      { x1: 44, y1: 60, x2: 48, y2: 85 },
      { x1: 48, y1: 85, x2: 44, y2: 110 },
      { x1: 44, y1: 110, x2: 22, y2: 110 },
      { x1: 22, y1: 110, x2: 18, y2: 85 },
      { x1: 18, y1: 85, x2: 22, y2: 60 },

      { x1: 138, y1: 60, x2: 116, y2: 60 },
      { x1: 116, y1: 60, x2: 112, y2: 85 },
      { x1: 112, y1: 85, x2: 116, y2: 110 },
      { x1: 116, y1: 110, x2: 138, y2: 110 },
      { x1: 138, y1: 110, x2: 142, y2: 85 },
      { x1: 142, y1: 85, x2: 138, y2: 60 },

      // Barra central moleteada
      { x1: 48, y1: 78, x2: 112, y2: 78 },
      { x1: 48, y1: 92, x2: 112, y2: 92 },
      { x1: 58, y1: 74, x2: 58, y2: 96 },
      { x1: 102, y1: 74, x2: 102, y2: 96 },

      // Facetas alrededor del ojo
      { x1: 68, y1: 78, x2: 80, y2: 64 },
      { x1: 92, y1: 78, x2: 80, y2: 64 },
      { x1: 68, y1: 92, x2: 80, y2: 106 },
      { x1: 92, y1: 92, x2: 80, y2: 106 },
    ],
    polygons: [
      { points: '22,60 44,60 48,85 44,110 22,110 18,85' },
      { points: '138,60 116,60 112,85 116,110 138,110 142,85' },
      { points: '58,78 102,78 102,92 58,92' },
      { points: '68,78 80,64 92,78 80,92' },
    ],
  };
}

// 🐺 8. MASCOTA / ANIMAL CYBER-ORIGAMI
function buildAnimalKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Orejas
      { x1: 40, y1: 18, x2: 28, y2: 54 },
      { x1: 40, y1: 18, x2: 62, y2: 42 },
      { x1: 28, y1: 54, x2: 62, y2: 42 },
      { x1: 120, y1: 18, x2: 132, y2: 54 },
      { x1: 120, y1: 18, x2: 98, y2: 42 },
      { x1: 132, y1: 54, x2: 98, y2: 42 },

      // Frente
      { x1: 80, y1: 28, x2: 62, y2: 42 },
      { x1: 80, y1: 28, x2: 98, y2: 42 },
      { x1: 62, y1: 42, x2: 80, y2: 56 },
      { x1: 98, y1: 42, x2: 80, y2: 56 },

      // Mejillas
      { x1: 28, y1: 54, x2: 22, y2: 78 },
      { x1: 22, y1: 78, x2: 46, y2: 104 },
      { x1: 46, y1: 104, x2: 80, y2: 138 },
      { x1: 132, y1: 54, x2: 138, y2: 78 },
      { x1: 138, y1: 78, x2: 114, y2: 104 },
      { x1: 114, y1: 104, x2: 80, y2: 138 },

      // Hocico
      { x1: 80, y1: 56, x2: 68, y2: 82 },
      { x1: 80, y1: 56, x2: 92, y2: 82 },
      { x1: 68, y1: 82, x2: 80, y2: 108 },
      { x1: 92, y1: 82, x2: 80, y2: 108 },
      { x1: 74, y1: 108, x2: 86, y2: 108 },
      { x1: 80, y1: 108, x2: 80, y2: 138 },
    ],
    polygons: [
      { points: '40,18 28,54 62,42' },
      { points: '120,18 132,54 98,42' },
      { points: '80,28 62,42 80,56 98,42' },
      { points: '80,56 68,82 80,108 92,82' },
      { points: '46,104 80,138 114,104 80,108' },
    ],
  };
}

// 🍎 9. MANZANA // KAI ORBE BOTÁNICO
function buildAppleKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      { x1: 80, y1: 56, x2: 62, y2: 48 },
      { x1: 80, y1: 56, x2: 98, y2: 48 },
      { x1: 62, y1: 48, x2: 40, y2: 68 },
      { x1: 98, y1: 48, x2: 120, y2: 68 },
      { x1: 40, y1: 68, x2: 36, y2: 96 },
      { x1: 120, y1: 68, x2: 124, y2: 96 },
      { x1: 36, y1: 96, x2: 44, y2: 120 },
      { x1: 124, y1: 96, x2: 116, y2: 120 },
      { x1: 44, y1: 120, x2: 66, y2: 136 },
      { x1: 116, y1: 120, x2: 94, y2: 136 },
      { x1: 66, y1: 136, x2: 80, y2: 132 },
      { x1: 94, y1: 136, x2: 80, y2: 132 },
      { x1: 80, y1: 56, x2: 80, y2: 30 },
      { x1: 80, y1: 30, x2: 84, y2: 22 },
      { x1: 80, y1: 36, x2: 98, y2: 28 },
      { x1: 98, y1: 28, x2: 94, y2: 44 },
      { x1: 94, y1: 44, x2: 80, y2: 36 },
    ],
    polygons: [
      { points: '80,56 62,48 40,68 36,96 44,120 66,136 80,132 94,136 116,120 124,96 120,68 98,48' },
      { points: '80,36 98,28 94,44' },
    ],
  };
}

// 🌐 10. TESELADOR CYBER-ORIGAMI ADAPTATIVO (PARA CUALQUIER SILUETA O FORMA DESCONOCIDA)
// NUNCA genera un rectángulo vacío: divide el volumen en facetas triangulares 3D con cresta y quilla
function buildBespokeContourKai(analysis: ImageSampleAnalysis): {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  polygons: Array<{ points: string }>;
} {
  // 6 niveles de altura armónicos entre y=24 e y=140
  const Y_NODES = [24, 46, 68, 88, 110, 134];
  const maxW = analysis.isSlender ? 36 : analysis.isWide ? 54 : 46;
  const minW = 16;

  const dx: number[] = [
    Math.round(minW + analysis.halfWidths[0] * (maxW * 0.7 - minW)),
    Math.round(minW + analysis.halfWidths[2] * (maxW * 0.9 - minW)),
    Math.round(minW + analysis.halfWidths[4] * (maxW - minW)),
    Math.round(minW + analysis.halfWidths[6] * (maxW - minW)),
    Math.round(minW + analysis.halfWidths[8] * (maxW * 0.85 - minW)),
    Math.round(minW + analysis.halfWidths[9] * (maxW * 0.5 - minW)),
  ];

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  // 1. Cresta / Ápice Superior
  const apexY = 14;
  lines.push({ x1: 80, y1: apexY, x2: 80 - dx[0], y2: Y_NODES[0] });
  lines.push({ x1: 80, y1: apexY, x2: 80 + dx[0], y2: Y_NODES[0] });
  lines.push({ x1: 80 - dx[0], y1: Y_NODES[0], x2: 80 + dx[0], y2: Y_NODES[0] });

  polygons.push({
    points: `80,${apexY} ${80 - dx[0]},${Y_NODES[0]} ${80 + dx[0]},${Y_NODES[0]}`,
  });

  // 2. Contorno Exterior Facetado en Chaflán
  for (let i = 0; i < Y_NODES.length - 1; i++) {
    lines.push({ x1: 80 - dx[i], y1: Y_NODES[i], x2: 80 - dx[i + 1], y2: Y_NODES[i + 1] });
    lines.push({ x1: 80 + dx[i], y1: Y_NODES[i], x2: 80 + dx[i + 1], y2: Y_NODES[i + 1] });
  }

  // 3. Quilla de Levitación Inferior
  const keelY = 144;
  lines.push({ x1: 80 - dx[5], y1: Y_NODES[5], x2: 80, y2: keelY });
  lines.push({ x1: 80 + dx[5], y1: Y_NODES[5], x2: 80, y2: keelY });
  lines.push({ x1: 80 - dx[5], y1: Y_NODES[5], x2: 80 + dx[5], y2: Y_NODES[5] });

  polygons.push({
    points: `${80 - dx[5]},${Y_NODES[5]} 80,${keelY} ${80 + dx[5]},${Y_NODES[5]}`,
  });

  // 4. Facetas Trianguladas Internas (Cyber-Origami Cross-Struts)
  // Nivel 0 a 1: Pecho Superior
  lines.push({ x1: 80 - dx[0], y1: Y_NODES[0], x2: 80, y2: Y_NODES[1] });
  lines.push({ x1: 80 + dx[0], y1: Y_NODES[0], x2: 80, y2: Y_NODES[1] });
  lines.push({ x1: 80, y1: Y_NODES[0], x2: 80, y2: Y_NODES[1] });

  polygons.push({
    points: `${80 - dx[0]},${Y_NODES[0]} 80,${Y_NODES[1]} ${80 - dx[1]},${Y_NODES[1]}`,
  });
  polygons.push({
    points: `${80 + dx[0]},${Y_NODES[0]} 80,${Y_NODES[1]} ${80 + dx[1]},${Y_NODES[1]}`,
  });

  // Nivel 1 a 3: Cámara Ocular Central (Encuadra el Ojo Sagrado en 80, 85)
  lines.push({ x1: 80, y1: Y_NODES[1], x2: 80 - dx[2], y2: Y_NODES[2] });
  lines.push({ x1: 80, y1: Y_NODES[1], x2: 80 + dx[2], y2: Y_NODES[2] });
  lines.push({ x1: 80 - dx[2], y1: Y_NODES[2], x2: 80, y2: Y_NODES[3] });
  lines.push({ x1: 80 + dx[2], y1: Y_NODES[2], x2: 80, y2: Y_NODES[3] });

  polygons.push({
    points: `80,${Y_NODES[1]} ${80 - dx[2]},${Y_NODES[2]} 80,${Y_NODES[3]} ${80 + dx[2]},${Y_NODES[2]}`,
  });

  // Nivel 3 a 5: Faldón y Armadura Inferior
  lines.push({ x1: 80 - dx[3], y1: Y_NODES[3], x2: 80, y2: Y_NODES[4] });
  lines.push({ x1: 80 + dx[3], y1: Y_NODES[3], x2: 80, y2: Y_NODES[4] });
  lines.push({ x1: 80, y1: Y_NODES[3], x2: 80, y2: Y_NODES[4] });
  lines.push({ x1: 80 - dx[4], y1: Y_NODES[4], x2: 80, y2: keelY });
  lines.push({ x1: 80 + dx[4], y1: Y_NODES[4], x2: 80, y2: keelY });

  polygons.push({
    points: `${80 - dx[3]},${Y_NODES[3]} 80,${Y_NODES[4]} ${80 - dx[4]},${Y_NODES[4]}`,
  });
  polygons.push({
    points: `${80 + dx[3]},${Y_NODES[3]} 80,${Y_NODES[4]} ${80 + dx[4]},${Y_NODES[4]}`,
  });

  return { lines, polygons };
}

// ══════════════════════════════════════════════════════════════════════════════
// 🧸 1. GENERADOR MULTIVERSO TOON (CHIBI MASCOT NINTENDO / PIXAR)
// Siluetas redondeadas, cabeza grande, proporciones chibi y gran sonrisa
// ══════════════════════════════════════════════════════════════════════════════
function buildToonGeometry(category: string, label: string): {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  polygons: Array<{ points: string }>;
  dualEyes: { left: { cx: number; cy: number; rx: number; ry: number }; right: { cx: number; cy: number; rx: number; ry: number } };
  mouth: { d: string };
  baseName: string;
} {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  // Cabeza Chibi Redonda y Amigable
  polygons.push({
    points: '60,26 100,26 122,46 128,74 120,98 96,112 64,112 40,98 32,74 38,46',
  });
  lines.push(
    { x1: 60, y1: 26, x2: 100, y2: 26 },
    { x1: 100, y1: 26, x2: 122, y2: 46 },
    { x1: 122, y1: 46, x2: 128, y2: 74 },
    { x1: 128, y1: 74, x2: 120, y2: 98 },
    { x1: 120, y1: 98, x2: 96, y2: 112 },
    { x1: 96, y1: 112, x2: 64, y2: 112 },
    { x1: 64, y1: 112, x2: 40, y2: 98 },
    { x1: 40, y1: 98, x2: 32, y2: 74 },
    { x1: 32, y1: 74, x2: 38, y2: 46 },
    { x1: 38, y1: 46, x2: 60, y2: 26 }
  );

  // Cuerpecito Rechoncho Chibi y patitas
  polygons.push({
    points: '54,112 106,112 118,136 102,148 58,148 42,136',
  });
  lines.push(
    { x1: 54, y1: 112, x2: 42, y2: 136 },
    { x1: 42, y1: 136, x2: 58, y2: 148 },
    { x1: 58, y1: 148, x2: 102, y2: 148 },
    { x1: 102, y1: 148, x2: 118, y2: 136 },
    { x1: 118, y1: 136, x2: 106, y2: 112 },
    { x1: 66, y1: 148, x2: 66, y2: 154 },
    { x1: 94, y1: 148, x2: 94, y2: 154 }
  );

  // Manitas / Alitas saludando a los lados
  lines.push(
    { x1: 40, y1: 118, x2: 24, y2: 108 },
    { x1: 24, y1: 108, x2: 28, y2: 126 },
    { x1: 28, y1: 126, x2: 44, y2: 128 },
    { x1: 120, y1: 118, x2: 136, y2: 108 },
    { x1: 136, y1: 108, x2: 132, y2: 126 },
    { x1: 132, y1: 126, x2: 116, y2: 128 }
  );

  let baseName = 'Toon ' + label;

  if (category === 'lighter') {
    baseName = 'Chibi Ignis';
    polygons.push({ points: '80,6 92,20 86,28 74,28 68,20' });
    lines.push(
      { x1: 80, y1: 6, x2: 92, y2: 20 },
      { x1: 92, y1: 20, x2: 86, y2: 28 },
      { x1: 86, y1: 28, x2: 74, y2: 28 },
      { x1: 74, y1: 28, x2: 68, y2: 20 },
      { x1: 68, y1: 20, x2: 80, y2: 6 },
      { x1: 80, y1: 12, x2: 80, y2: 22 }
    );
  } else if (category === 'animal') {
    baseName = 'Mascota Chibi';
    polygons.push(
      { points: '42,38 24,12 56,26' },
      { points: '118,38 136,12 104,26' }
    );
    lines.push(
      { x1: 42, y1: 38, x2: 24, y2: 12 },
      { x1: 24, y1: 12, x2: 56, y2: 26 },
      { x1: 118, y1: 38, x2: 136, y2: 12 },
      { x1: 136, y1: 12, x2: 104, y2: 26 },
      { x1: 34, y1: 82, x2: 20, y2: 80 },
      { x1: 34, y1: 88, x2: 20, y2: 92 },
      { x1: 126, y1: 82, x2: 140, y2: 80 },
      { x1: 126, y1: 88, x2: 140, y2: 92 }
    );
  } else if (category === 'sunglasses') {
    baseName = 'Solaris Toon';
    lines.push(
      { x1: 44, y1: 70, x2: 74, y2: 70 },
      { x1: 74, y1: 70, x2: 74, y2: 80 },
      { x1: 74, y1: 80, x2: 44, y2: 80 },
      { x1: 44, y1: 80, x2: 44, y2: 70 },
      { x1: 74, y1: 72, x2: 86, y2: 72 },
      { x1: 86, y1: 70, x2: 116, y2: 70 },
      { x1: 116, y1: 70, x2: 116, y2: 80 },
      { x1: 116, y1: 80, x2: 86, y2: 80 },
      { x1: 86, y1: 80, x2: 86, y2: 70 }
    );
  } else if (category === 'headphones') {
    baseName = 'Beats Chibi';
    polygons.push(
      { points: '24,62 36,62 36,92 24,92' },
      { points: '124,62 136,62 136,92 124,92' },
      { points: '42,42 80,18 118,42 110,48 80,26 50,48' }
    );
    lines.push(
      { x1: 42, y1: 42, x2: 80, y2: 18 },
      { x1: 80, y1: 18, x2: 118, y2: 42 },
      { x1: 24, y1: 62, x2: 36, y2: 62 },
      { x1: 36, y1: 62, x2: 36, y2: 92 },
      { x1: 36, y1: 92, x2: 24, y2: 92 },
      { x1: 24, y1: 92, x2: 24, y2: 62 },
      { x1: 124, y1: 62, x2: 136, y2: 62 },
      { x1: 136, y1: 62, x2: 136, y2: 92 },
      { x1: 136, y1: 92, x2: 124, y2: 92 },
      { x1: 124, y1: 92, x2: 124, y2: 62 }
    );
  } else if (category === 'mug') {
    baseName = 'Cafeto Chibi';
    lines.push(
      { x1: 124, y1: 60, x2: 144, y2: 74 },
      { x1: 144, y1: 74, x2: 142, y2: 98 },
      { x1: 142, y1: 98, x2: 120, y2: 104 },
      { x1: 72, y1: 20, x2: 76, y2: 10 },
      { x1: 88, y1: 20, x2: 84, y2: 10 }
    );
  } else if (category === 'monolith') {
    baseName = 'BMO Bot';
    lines.push(
      { x1: 80, y1: 26, x2: 80, y2: 14 },
      { x1: 74, y1: 12, x2: 86, y2: 12 },
      { x1: 80, y1: 6, x2: 80, y2: 14 }
    );
    polygons.push({ points: '76,8 84,8 84,14 76,14' });
  } else {
    lines.push(
      { x1: 80, y1: 26, x2: 80, y2: 12 },
      { x1: 80, y1: 12, x2: 90, y2: 18 }
    );
  }

  return {
    lines,
    polygons,
    dualEyes: {
      left: { cx: 60, cy: 72, rx: 9.5, ry: 13 },
      right: { cx: 100, cy: 72, rx: 9.5, ry: 13 },
    },
    mouth: {
      d: 'M 68 94 Q 80 110 92 94',
    },
    baseName,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 👾 2. GENERADOR MULTIVERSO PIXEL ART 16-BIT (ARCADE RETRO)
// Estrictamente escaleras y bloques ortogonales (píxeles)
// ══════════════════════════════════════════════════════════════════════════════
function buildPixelGeometry(category: string, label: string): {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  polygons: Array<{ points: string }>;
  dualEyes: { left: { cx: number; cy: number; rx: number; ry: number }; right: { cx: number; cy: number; rx: number; ry: number } };
  mouth: { d: string };
  baseName: string;
} {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  // Cabeza en escalones de píxeles
  polygons.push({
    points: '56,24 104,24 104,36 120,36 120,56 128,56 128,96 120,96 120,112 104,112 104,120 56,120 56,112 40,112 40,96 32,96 32,56 40,56 40,36 56,36',
  });

  lines.push(
    { x1: 56, y1: 24, x2: 104, y2: 24 },
    { x1: 104, y1: 24, x2: 104, y2: 36 },
    { x1: 104, y1: 36, x2: 120, y2: 36 },
    { x1: 120, y1: 36, x2: 120, y2: 56 },
    { x1: 120, y1: 56, x2: 128, y2: 56 },
    { x1: 128, y1: 56, x2: 128, y2: 96 },
    { x1: 128, y1: 96, x2: 120, y2: 96 },
    { x1: 120, y1: 96, x2: 120, y2: 112 },
    { x1: 120, y1: 112, x2: 104, y2: 112 },
    { x1: 104, y1: 112, x2: 104, y2: 120 },
    { x1: 104, y1: 120, x2: 56, y2: 120 },
    { x1: 56, y1: 120, x2: 56, y2: 112 },
    { x1: 56, y1: 112, x2: 40, y2: 112 },
    { x1: 40, y1: 112, x2: 40, y2: 96 },
    { x1: 40, y1: 96, x2: 32, y2: 96 },
    { x1: 32, y1: 96, x2: 32, y2: 56 },
    { x1: 32, y1: 56, x2: 40, y2: 56 },
    { x1: 40, y1: 56, x2: 40, y2: 36 },
    { x1: 40, y1: 36, x2: 56, y2: 36 },
    { x1: 56, y1: 36, x2: 56, y2: 24 }
  );

  // Cuerpo y patitas en píxeles
  polygons.push({
    points: '48,120 112,120 112,144 96,144 96,136 64,136 64,144 48,144',
  });
  lines.push(
    { x1: 48, y1: 120, x2: 48, y2: 144 },
    { x1: 48, y1: 144, x2: 64, y2: 144 },
    { x1: 64, y1: 144, x2: 64, y2: 136 },
    { x1: 64, y1: 136, x2: 96, y2: 136 },
    { x1: 96, y1: 136, x2: 96, y2: 144 },
    { x1: 96, y1: 144, x2: 112, y2: 144 },
    { x1: 112, y1: 144, x2: 112, y2: 120 }
  );

  let baseName = 'Pixel Sprite';
  if (category === 'lighter') {
    baseName = 'Pixel Ignis';
    lines.push(
      { x1: 76, y1: 8, x2: 84, y2: 8 },
      { x1: 84, y1: 8, x2: 84, y2: 16 },
      { x1: 84, y1: 16, x2: 92, y2: 16 },
      { x1: 92, y1: 16, x2: 92, y2: 24 },
      { x1: 76, y1: 8, x2: 76, y2: 16 },
      { x1: 76, y1: 16, x2: 68, y2: 16 },
      { x1: 68, y1: 16, x2: 68, y2: 24 }
    );
  } else if (category === 'animal') {
    baseName = 'Pixel Pet';
    lines.push(
      { x1: 40, y1: 16, x2: 48, y2: 16 },
      { x1: 48, y1: 16, x2: 48, y2: 24 },
      { x1: 40, y1: 16, x2: 40, y2: 36 },
      { x1: 112, y1: 16, x2: 120, y2: 16 },
      { x1: 112, y1: 16, x2: 112, y2: 24 },
      { x1: 120, y1: 16, x2: 120, y2: 36 }
    );
  }

  return {
    lines,
    polygons,
    dualEyes: {
      left: { cx: 58, cy: 70, rx: 6, ry: 6 },
      right: { cx: 102, cy: 70, rx: 6, ry: 6 },
    },
    mouth: {
      d: 'M 68 94 H 74 V 98 H 86 V 94 H 92',
    },
    baseName,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 🔮 3. GENERADOR MULTIVERSO ARTE 3D / VINIL (CLAYMATION / POP MART)
// ══════════════════════════════════════════════════════════════════════════════
function buildClay3dGeometry(category: string, label: string): {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  polygons: Array<{ points: string }>;
  dualEyes: { left: { cx: number; cy: number; rx: number; ry: number }; right: { cx: number; cy: number; rx: number; ry: number } };
  mouth: { d: string };
  baseName: string;
} {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  polygons.push({
    points: '64,28 96,28 118,44 126,68 122,96 98,110 62,110 38,96 34,68 42,44',
  });
  lines.push(
    { x1: 64, y1: 28, x2: 96, y2: 28 },
    { x1: 96, y1: 28, x2: 118, y2: 44 },
    { x1: 118, y1: 44, x2: 126, y2: 68 },
    { x1: 126, y1: 68, x2: 122, y2: 96 },
    { x1: 122, y1: 96, x2: 98, y2: 110 },
    { x1: 98, y1: 110, x2: 62, y2: 110 },
    { x1: 62, y1: 110, x2: 38, y2: 96 },
    { x1: 38, y1: 96, x2: 34, y2: 68 },
    { x1: 34, y1: 68, x2: 42, y2: 44 },
    { x1: 42, y1: 44, x2: 64, y2: 28 }
  );

  polygons.push({
    points: '54,110 106,110 114,134 98,146 62,146 46,134',
  });
  lines.push(
    { x1: 54, y1: 110, x2: 46, y2: 134 },
    { x1: 46, y1: 134, x2: 62, y2: 146 },
    { x1: 62, y1: 146, x2: 98, y2: 146 },
    { x1: 98, y1: 146, x2: 114, y2: 134 },
    { x1: 114, y1: 134, x2: 106, y2: 110 },
    { x1: 52, y1: 46, x2: 68, y2: 36 }
  );

  let baseName = 'Clay ' + label;
  if (category === 'lighter') {
    baseName = 'Clay Flame';
    polygons.push({ points: '80,10 90,22 84,28 76,28 70,22' });
    lines.push(
      { x1: 80, y1: 10, x2: 90, y2: 22 },
      { x1: 90, y1: 22, x2: 84, y2: 28 },
      { x1: 84, y1: 28, x2: 76, y2: 28 },
      { x1: 76, y1: 28, x2: 70, y2: 22 },
      { x1: 70, y1: 22, x2: 80, y2: 10 }
    );
  } else if (category === 'animal') {
    baseName = 'Clay Pet';
    polygons.push(
      { points: '44,38 30,16 54,28' },
      { points: '116,38 130,16 106,28' }
    );
    lines.push(
      { x1: 44, y1: 38, x2: 30, y2: 16 },
      { x1: 30, y1: 16, x2: 54, y2: 28 },
      { x1: 116, y1: 38, x2: 130, y2: 16 },
      { x1: 130, y1: 16, x2: 106, y2: 28 }
    );
  }

  return {
    lines,
    polygons,
    dualEyes: {
      left: { cx: 62, cy: 74, rx: 8, ry: 9 },
      right: { cx: 98, cy: 74, rx: 8, ry: 9 },
    },
    mouth: {
      d: 'M 72 96 Q 80 102 88 96',
    },
    baseName,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 📄 4. GENERADOR MULTIVERSO RECORTES / PAPEL (ORIGAMI 3D)
// ══════════════════════════════════════════════════════════════════════════════
function buildPapercraftGeometry(category: string, label: string): {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  polygons: Array<{ points: string }>;
  dualEyes: { left: { cx: number; cy: number; rx: number; ry: number }; right: { cx: number; cy: number; rx: number; ry: number } };
  mouth: { d: string };
  baseName: string;
} {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  polygons.push(
    { points: '80,24 46,48 80,72' },
    { points: '80,24 114,48 80,72' },
    { points: '46,48 36,88 80,108' },
    { points: '114,48 124,88 80,108' },
    { points: '80,108 52,142 80,148 108,142' }
  );

  lines.push(
    { x1: 80, y1: 24, x2: 46, y2: 48 },
    { x1: 46, y1: 48, x2: 80, y2: 72 },
    { x1: 80, y1: 24, x2: 114, y2: 48 },
    { x1: 114, y1: 48, x2: 80, y2: 72 },
    { x1: 46, y1: 48, x2: 36, y2: 88 },
    { x1: 36, y1: 88, x2: 80, y2: 108 },
    { x1: 114, y1: 48, x2: 124, y2: 88 },
    { x1: 124, y1: 88, x2: 80, y2: 108 },
    { x1: 80, y1: 72, x2: 80, y2: 108 },
    { x1: 80, y1: 108, x2: 52, y2: 142 },
    { x1: 52, y1: 142, x2: 80, y2: 148 },
    { x1: 80, y1: 148, x2: 108, y2: 142 },
    { x1: 108, y1: 142, x2: 80, y2: 108 }
  );

  return {
    lines,
    polygons,
    dualEyes: {
      left: { cx: 60, cy: 74, rx: 8, ry: 6.5 },
      right: { cx: 100, cy: 74, rx: 8, ry: 6.5 },
    },
    mouth: {
      d: 'M 70 96 L 80 104 L 90 96',
    },
    baseName: 'Origami ' + label,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚡ 5. GENERADOR MULTIVERSO CROMO & MERCURIO (FUTURISTA Y2K)
// ══════════════════════════════════════════════════════════════════════════════
function buildChromeGeometry(category: string, label: string): {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  polygons: Array<{ points: string }>;
  dualEyes: { left: { cx: number; cy: number; rx: number; ry: number }; right: { cx: number; cy: number; rx: number; ry: number } };
  mouth: { d: string };
  baseName: string;
} {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  polygons.push(
    { points: '80,18 52,42 42,88 80,112 118,88 108,42' },
    { points: '42,88 56,134 80,146 104,134 118,88 80,112' }
  );

  lines.push(
    { x1: 80, y1: 18, x2: 52, y2: 42 },
    { x1: 52, y1: 42, x2: 42, y2: 88 },
    { x1: 42, y1: 88, x2: 56, y2: 134 },
    { x1: 56, y1: 134, x2: 80, y2: 146 },
    { x1: 80, y1: 146, x2: 104, y2: 134 },
    { x1: 104, y1: 134, x2: 118, y2: 88 },
    { x1: 118, y1: 88, x2: 108, y2: 42 },
    { x1: 108, y1: 42, x2: 80, y2: 18 },
    { x1: 80, y1: 18, x2: 80, y2: 64 },
    { x1: 80, y1: 112, x2: 80, y2: 146 },
    { x1: 52, y1: 42, x2: 80, y2: 64 },
    { x1: 108, y1: 42, x2: 80, y2: 64 }
  );

  return {
    lines,
    polygons,
    dualEyes: {
      left: { cx: 58, cy: 74, rx: 13, ry: 6 },
      right: { cx: 102, cy: 74, rx: 13, ry: 6 },
    },
    mouth: {
      d: 'M 70 95 L 80 98 L 90 95',
    },
    baseName: 'Cromo ' + label,
  };
}

/**
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * MOTORES DE GENERACIÓN VECTORIAL 100% SVG (ARQUITECTURA DE LA FORJA NEURAL)
 * ══════════════════════════════════════════════════════════════════════════════
 */

// 1. Geometría Neón (Default): <polygon> y <path> simétricos, stroke-width="2", fill="none"
function buildNeonGeometryEngine(category: string, label: string) {
  const polygons: Array<{ points: string }> = [
    { points: "80,24 60,48 80,72 100,48" },
    { points: "60,48 40,68 60,94 80,72" },
    { points: "100,48 80,72 100,94 120,68" },
    { points: "80,72 56,104 80,140 104,104" },
    { points: "56,104 36,126 56,146 80,140" },
    { points: "104,104 80,140 104,146 124,126" },
  ];

  let topper = '';
  if (category === 'lighter') {
    topper = `<path d="M 80,12 L 86,22 L 80,26 L 74,22 Z" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />`;
  } else if (category === 'sunglasses') {
    topper = `<polygon points="46,54 74,54 68,68 52,68" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" /><polygon points="86,54 114,54 108,68 92,68" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />`;
  } else if (category === 'headphones') {
    topper = `<path d="M 40,70 L 40,42 L 80,22 L 120,42 L 120,70" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />`;
  }

  const polySvg = polygons.map(p => `<polygon points="${p.points}" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" stroke-linejoin="round" />`).join('\n    ');
  const pathSvg = `
    <path d="M 80,24 L 80,140" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />
    <path d="M 60,48 L 100,48" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />
    <path d="M 56,104 L 104,104" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />
    ${topper}
  `.trim();

  const svgContent = `
<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <g class="kai-neon-geometry-group" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" stroke-linejoin="round">
    ${polySvg}
    ${pathSvg}
  </g>
</svg>`.trim();

  return {
    svgContent,
    polygons,
    lines: [
      { x1: 80, y1: 24, x2: 80, y2: 140 },
      { x1: 60, y1: 48, x2: 100, y2: 48 },
      { x1: 56, y1: 104, x2: 104, y2: 104 },
    ],
    baseName: `Neón ${label}`,
    dualEyes: { left: { cx: 62, cy: 56, rx: 7, ry: 7 }, right: { cx: 98, cy: 56, rx: 7, ry: 7 } },
    mouth: { d: 'M 72 82 L 80 88 L 88 82' },
  };
}

// 2. Cyber-Pixel: Únicamente elementos <rect> alineados a cuadrícula de 8x8px
function buildCyberPixelEngine(category: string, label: string) {
  const rects: Array<{ x: number; y: number }> = [];

  const addSymmetric = (xOffset: number, y: number) => {
    rects.push({ x: 80 - xOffset, y });
    if (xOffset !== 0) {
      rects.push({ x: 72 + xOffset, y });
    }
  };

  // Antenas o copete superior
  addSymmetric(24, 24);
  addSymmetric(16, 32);

  // Corona y frente
  for (let x = 8; x <= 32; x += 8) addSymmetric(x, 40);
  for (let x = 8; x <= 40; x += 8) addSymmetric(x, 48);
  for (let x = 16; x <= 40; x += 8) addSymmetric(x, 56);

  // Nivel de Ojos (dejamos hueco en x=24 para pupilas)
  addSymmetric(8, 64);
  addSymmetric(16, 64);
  addSymmetric(32, 64);
  addSymmetric(40, 64);

  // Mejillas
  for (let x = 8; x <= 40; x += 8) addSymmetric(x, 72);
  for (let x = 8; x <= 32; x += 8) addSymmetric(x, 80);

  // Boca pixel
  addSymmetric(16, 88);
  addSymmetric(8, 88);

  // Cuello y hombros
  for (let x = 8; x <= 24; x += 8) addSymmetric(x, 96);
  for (let x = 8; x <= 40; x += 8) addSymmetric(x, 104);
  for (let x = 16; x <= 48; x += 8) addSymmetric(x, 112);

  // Torso / Base
  for (let x = 8; x <= 32; x += 8) addSymmetric(x, 120);
  for (let x = 8; x <= 24; x += 8) addSymmetric(x, 128);
  addSymmetric(16, 136);
  addSymmetric(8, 136);

  const rectsSvg = rects
    .map(r => `<rect x="${r.x}" y="${r.y}" width="8" height="8" fill="var(--color-aura-activa, currentColor)" shape-rendering="crispEdges" />`)
    .join('\n    ');

  const eyeHighlights = `
    <!-- Ojos Specular Pixel -->
    <rect x="56" y="64" width="8" height="8" fill="#ffffff" shape-rendering="crispEdges" />
    <rect x="96" y="64" width="8" height="8" fill="#ffffff" shape-rendering="crispEdges" />
  `;

  const svgContent = `
<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <g class="kai-cyber-pixel-group" shape-rendering="crispEdges">
    ${rectsSvg}
    ${eyeHighlights}
  </g>
</svg>`.trim();

  return {
    svgContent,
    polygons: [],
    lines: [],
    baseName: `Pixel ${label}`,
    dualEyes: { left: { cx: 60, cy: 68, rx: 4, ry: 4 }, right: { cx: 100, cy: 68, rx: 4, ry: 4 } },
    mouth: { d: 'M 72 88 H 88' },
  };
}

// 3. Flujo Orgánico: Exclusivamente curvas Bezier suaves (C y S), sin ángulos rectos, fill="none"
function buildOrganicFlowEngine(category: string, label: string) {
  const paths: string[] = [
    `M 80 20 C 50 20 30 50 30 80 C 30 115 55 145 80 155 C 105 145 130 115 130 80 C 130 50 110 20 80 20 Z`,
    `M 80 25 C 65 35 55 55 55 80 S 70 125 80 145 S 105 105 105 80 S 95 35 80 25 Z`,
    `M 40 75 C 40 60 60 50 80 50 S 120 60 120 75 S 100 100 80 100 S 40 90 40 75`,
    `M 45 90 C 45 105 60 120 80 120 S 115 105 115 90`,
    `M 30 80 C 20 70 20 90 30 95 C 40 100 50 90 50 80`,
    `M 130 80 C 140 70 140 90 130 95 C 120 100 110 90 110 80`,
  ];

  const pathsSvg = paths
    .map(d => `<path d="${d}" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`)
    .join('\n    ');

  const eyesSvg = `
    <!-- Ojos fluidos orgánicos -->
    <ellipse cx="62" cy="72" rx="7" ry="9" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />
    <ellipse cx="98" cy="72" rx="7" ry="9" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" />
    <circle cx="64" cy="70" r="2.5" fill="#ffffff" />
    <circle cx="96" cy="70" r="2.5" fill="#ffffff" />
    <path d="M 70 94 C 75 102 85 102 90 94" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" stroke-linecap="round" />
  `;

  const svgContent = `
<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <g class="kai-organic-flow-group" stroke="var(--color-aura-activa, currentColor)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    ${pathsSvg}
    ${eyesSvg}
  </g>
</svg>`.trim();

  return {
    svgContent,
    polygons: [],
    lines: [],
    baseName: `Flujo ${label}`,
    dualEyes: { left: { cx: 62, cy: 72, rx: 7, ry: 9 }, right: { cx: 98, cy: 72, rx: 7, ry: 9 } },
    mouth: { d: 'M 70 94 C 75 102 85 102 90 94' },
  };
}

// 4. Low Poly: Polígonos cerrados con fill-opacity aleatorio entre 0.1 y 0.9 para volumen 3D, sin trazos
function buildLowPolyEngine(category: string, label: string) {
  const facets: Array<{ points: string; opacity: number }> = [
    { points: "80,20 60,38 80,45", opacity: 0.35 },
    { points: "80,20 80,45 100,38", opacity: 0.85 },
    { points: "60,38 42,54 62,62 80,45", opacity: 0.22 },
    { points: "80,45 98,62 118,54 100,38", opacity: 0.70 },
    { points: "62,62 80,45 80,75", opacity: 0.45 },
    { points: "80,45 98,62 80,75", opacity: 0.90 },
    { points: "42,54 30,76 54,82 62,62", opacity: 0.18 },
    { points: "118,54 98,62 106,82 130,76", opacity: 0.60 },
    { points: "62,62 80,75 80,95 64,88", opacity: 0.40 },
    { points: "98,62 80,75 80,95 96,88", opacity: 0.78 },
    { points: "54,82 64,88 80,95 72,118", opacity: 0.28 },
    { points: "106,82 96,88 80,95 88,118", opacity: 0.65 },
    { points: "72,118 80,95 88,118 80,128", opacity: 0.52 },
    { points: "30,76 22,112 50,122 54,82", opacity: 0.15 },
    { points: "130,76 106,82 110,122 138,112", opacity: 0.55 },
    { points: "50,122 72,118 80,128 68,148 44,142", opacity: 0.32 },
    { points: "110,122 88,118 80,128 92,148 116,142", opacity: 0.75 },
    { points: "68,148 80,128 92,148 80,158", opacity: 0.48 },
  ];

  const polySvg = facets
    .map(f => `<polygon points="${f.points}" fill="var(--color-aura-activa, currentColor)" fill-opacity="${f.opacity}" stroke="none" />`)
    .join('\n    ');

  const eyeAccents = `
    <!-- Cristales de Ojos Specular -->
    <polygon points="56,66 66,66 62,74 54,72" fill="#ffffff" fill-opacity="0.95" stroke="none" />
    <polygon points="104,66 94,66 98,74 106,72" fill="#ffffff" fill-opacity="0.95" stroke="none" />
  `;

  const svgContent = `
<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <g class="kai-low-poly-group">
    ${polySvg}
    ${eyeAccents}
  </g>
</svg>`.trim();

  return {
    svgContent,
    polygons: facets.map(f => ({ points: f.points, fillOpacity: f.opacity })),
    lines: [],
    baseName: `Poly ${label}`,
    dualEyes: { left: { cx: 60, cy: 68, rx: 6, ry: 5 }, right: { cx: 100, cy: 68, rx: 6, ry: 5 } },
    mouth: { d: 'M 72 95 L 80 102 L 88 95' },
  };
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SINTETIZADOR PRINCIPAL: IDENTIFICA EL OBJETO Y GENERA SU ICONO KAI CON SIMILITUD
 * ══════════════════════════════════════════════════════════════════════════════
 */
export async function synthesizeKaiFromImageSilhouette(params: {
  imageBase64: string;
  promptDescription?: string;
  artStyle?: KaiMultiverseStyle;
}): Promise<KaiCustomForm> {
  const { imageBase64, promptDescription = '', artStyle = 'neon-geometry' } = params;
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  let analysis: ImageSampleAnalysis;
  const canvasResult = await extractImageDataFromCanvas(cleanBase64, 36);

  if (canvasResult && canvasResult.data) {
    analysis = analyzePixelMatrix(canvasResult.data, canvasResult.width);
  } else {
    analysis = analyzeBase64Bytes(cleanBase64);
  }

  const { category, label } = identifyObjectCategory(promptDescription, analysis);

  let vectorResult: {
    lines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
    polygons?: Array<{ points: string; fillOpacity?: number }>;
    dualEyes?: { left: { cx: number; cy: number; rx: number; ry: number }; right: { cx: number; cy: number; rx: number; ry: number } };
    mouth?: { d: string };
    baseName: string;
    svgContent: string;
  };

  switch (artStyle) {
    case 'cyber-pixel':
    case 'pixel':
      vectorResult = buildCyberPixelEngine(category, label);
      break;

    case 'organic-flow':
      vectorResult = buildOrganicFlowEngine(category, label);
      break;

    case 'low-poly':
      vectorResult = buildLowPolyEngine(category, label);
      break;

    case 'toon': {
      const r = buildToonGeometry(category, label);
      vectorResult = { ...r, svgContent: '' };
      break;
    }
    case 'clay3d': {
      const r = buildClay3dGeometry(category, label);
      vectorResult = { ...r, svgContent: '' };
      break;
    }
    case 'papercraft': {
      const r = buildPapercraftGeometry(category, label);
      vectorResult = { ...r, svgContent: '' };
      break;
    }
    case 'chrome': {
      const r = buildChromeGeometry(category, label);
      vectorResult = { ...r, svgContent: '' };
      break;
    }

    case 'neon-geometry':
    default:
      vectorResult = buildNeonGeometryEngine(category, label);
      break;
  }

  // Frases de Personalidad según Estilo y Categoría
  const STYLE_QUOTES: Record<string, Record<string, string>> = {
    'neon-geometry': {
      lighter: 'Llama cuántica encendida. Enfoque láser y cero tolerancia a las excusas.',
      sunglasses: 'Visión wireframe calibrada. El objetivo de hoy está claro como el cristal.',
      headphones: 'Sintonizando frecuencia de hiperenfoque. Silencio total a las distracciones.',
      watch: 'Pulso de reloj atómico activado. Cada segundo forja tu disciplina.',
      mug: 'Recarga de energía pura. La consistencia es el combustible del éxito.',
      dumbbell: 'Estructura reforzada. La resistencia mental se forja en cada hábito.',
      animal: 'Centinela guardián activo. Cuidando tus metas a cada paso.',
      monolith: 'Matriz geométrica alineada. Orden absoluto para tu jornada.',
      apple: 'Núcleo biosintético en armonía. Salud y vitalidad optimizadas.',
      bespoke: '¡Forjado a partir de tu foto! Listo para sincronizarnos y triunfar.',
    },
    'cyber-pixel': {
      lighter: '¡8-bits de fuego arcade! ¡Combo de hábitos x10 encendido!',
      sunglasses: '¡Modo Sigilo Gamer Activado! Cero distracciones en la pantalla.',
      headphones: '¡Banda sonora de 8-bits lista! ¡A vencer al jefe de la pereza!',
      watch: 'Speedrun activado. ¡Completando misiones a tiempo récord!',
      mug: 'Poción de maná +100. ¡Listos para la aventura de hoy!',
      dumbbell: 'Fuerza +50. ¡Subiste de nivel guerrero, sigue entrenando!',
      animal: '¡Compañero Pokémon listo para la batalla de los hábitos diarios!',
      monolith: 'Consola arcade portátil. ¡Insert coin para ganar el día!',
      apple: 'Ítem de salud restaurado. ¡A seguir sumando puntos de EXP!',
      bespoke: '¡Sprite secreto desbloqueado! ¡A jugar y ganar la jornada!',
    },
    'organic-flow': {
      lighter: 'Flujo ígneo constante. Tu energía vital se mueve sin fricción.',
      sunglasses: 'Curvatura visual serena. Fluye con la jornada sin resistirte.',
      headphones: 'Ondas armónicas continuas. Respira y avanza en paz.',
      watch: 'El tiempo es un río que fluye. Navega cada momento con gracia.',
      mug: 'Fluidez y serenidad en cada sorbo. Un hábito a la vez.',
      dumbbell: 'Flexibilidad y potencia biomecánica. Fuerte como el agua.',
      animal: 'Compañero orgánico en perfecta sintonía con tu energía.',
      monolith: 'Estructura viviente ondulante. Enraizamiento y fluidez total.',
      apple: 'Vitalidad natural viva. La salud brota sin esfuerzo.',
      bespoke: 'Criatura de flujo continuo nacida de tu captura. Vamos a fluir.',
    },
    'low-poly': {
      lighter: 'Cristal de fuego tridimensional. Facetas que reflejan tu determinación.',
      sunglasses: 'Prisma facetado de enfoque. Claridad geométrica 3D.',
      headphones: 'Volumen acústico cristalino. Tu zona de deep work protegida.',
      watch: 'Escultura del tiempo en relieve. Cada cara del día cuenta.',
      mug: 'Fuerza poliédrica. Energía sólida y tangible.',
      dumbbell: 'Densidad geométrica pura. Hábitos duros como el diamante.',
      animal: 'Guardián poligonal 3D. Lealtad facetada inquebrantable.',
      monolith: 'Monolito 3D de alta estabilidad. Tu ancla diaria de hábitos.',
      apple: 'Esfera facetada de vitalidad. Geometría sagrada de bienestar.',
      bespoke: 'Escultura tridimensional facetada. Tu foto hecha volumen.',
    },
    toon: {
      lighter: '¡Soy Ignis! ¡Vamos a prenderle fuego a tus excusas y encender tu racha hoy!',
      bespoke: '¡Cobré vida gracias a tu foto! ¡Prometo ser tu mejor aliado de hábitos!',
    },
    pixel: {
      lighter: '16-bits de fuego arcade. ¡Combo de hábitos x10 encendido!',
      bespoke: '¡Personaje secreto desbloqueado! ¡A jugar y ganar la jornada!',
    },
  };

  const finalName = promptDescription
    ? `KAI ${vectorResult.baseName} ${promptDescription.slice(0, 12)}`
    : `KAI ${vectorResult.baseName}`;

  const quote = STYLE_QUOTES[artStyle]?.[category] || STYLE_QUOTES[artStyle]?.bespoke || STYLE_QUOTES['neon-geometry']?.bespoke || '¡Listo para ganar el día!';

  // Paletas de color por estilo
  const PALETTES: Record<string, { primary: string; secondary: string }> = {
    'neon-geometry': { primary: '#00f0ff', secondary: '#0284c7' },
    'cyber-pixel': { primary: '#10b981', secondary: '#059669' },
    'organic-flow': { primary: '#ec4899', secondary: '#a855f7' },
    'low-poly': { primary: '#f59e0b', secondary: '#d97706' },
    toon: { primary: '#f59e0b', secondary: '#ef4444' },
    clay3d: { primary: '#a855f7', secondary: '#ec4899' },
    chrome: { primary: '#00f0ff', secondary: '#38bdf8' },
    papercraft: { primary: '#f97316', secondary: '#d97706' },
    pixel: { primary: '#10b981', secondary: '#059669' },
  };

  const resolvedPalette = PALETTES[artStyle] || PALETTES['neon-geometry'];

  return {
    name: finalName,
    sourceType: 'image',
    createdAt: new Date().toISOString(),
    detectedObject: label,
    artStyle,
    personalityQuote: quote,
    primaryColor: resolvedPalette.primary,
    secondaryColor: resolvedPalette.secondary,
    mood: 'happy',
    svgContent: vectorResult.svgContent,
    lines: vectorResult.lines,
    polygons: vectorResult.polygons,
    dualEyes: vectorResult.dualEyes,
    mouth: vectorResult.mouth,
    coreEye: { cx: 80, cy: 85, r: 8 },
  };
}
