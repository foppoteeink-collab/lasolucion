import { KaiCustomForm } from '../types';

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

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SINTETIZADOR PRINCIPAL: IDENTIFICA EL OBJETO Y GENERA SU ICONO KAI CON SIMILITUD
 * ══════════════════════════════════════════════════════════════════════════════
 */
export async function synthesizeKaiFromImageSilhouette(params: {
  imageBase64: string;
  promptDescription?: string;
}): Promise<KaiCustomForm> {
  const { imageBase64, promptDescription = '' } = params;
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  let analysis: ImageSampleAnalysis;
  const canvasResult = await extractImageDataFromCanvas(cleanBase64, 36);

  if (canvasResult && canvasResult.data) {
    analysis = analyzePixelMatrix(canvasResult.data, canvasResult.width);
  } else {
    analysis = analyzeBase64Bytes(cleanBase64);
  }

  const { category, label } = identifyObjectCategory(promptDescription, analysis);

  let vectorArt: { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> };
  let epicName = `KAI ${label}`;

  switch (category) {
    case 'lighter':
      vectorArt = buildLighterKai();
      epicName = promptDescription ? `KAI Ignis ${promptDescription.slice(0, 14)}` : 'KAI Ignis Monolito';
      break;
    case 'monolith':
      vectorArt = buildMonolithKai();
      epicName = promptDescription ? `KAI Monolito ${promptDescription.slice(0, 14)}` : 'KAI Monolito Aether';
      break;
    case 'sunglasses':
      vectorArt = buildSunglassesKai();
      epicName = promptDescription ? `KAI Visor ${promptDescription.slice(0, 14)}` : 'KAI Visor Solaris';
      break;
    case 'headphones':
      vectorArt = buildHeadphonesKai();
      epicName = promptDescription ? `KAI Sónico ${promptDescription.slice(0, 14)}` : 'KAI Sónico Vórtice';
      break;
    case 'watch':
      vectorArt = buildWatchKai();
      epicName = promptDescription ? `KAI Crono ${promptDescription.slice(0, 14)}` : 'KAI Crono-Bisel';
      break;
    case 'mug':
      vectorArt = buildMugKai();
      epicName = promptDescription ? `KAI Termo ${promptDescription.slice(0, 14)}` : 'KAI Termo-Reactor';
      break;
    case 'dumbbell':
      vectorArt = buildDumbbellKai();
      epicName = promptDescription ? `KAI Fuerza ${promptDescription.slice(0, 14)}` : 'KAI Titán de Fuerza';
      break;
    case 'animal':
      vectorArt = buildAnimalKai();
      epicName = promptDescription ? `KAI Bestia ${promptDescription.slice(0, 14)}` : 'KAI Guardián Bestial';
      break;
    case 'apple':
      vectorArt = buildAppleKai();
      epicName = promptDescription ? `KAI Orbe ${promptDescription.slice(0, 14)}` : 'KAI Orbe Botánico';
      break;
    case 'bespoke':
    default:
      vectorArt = buildBespokeContourKai(analysis);
      epicName = promptDescription ? `KAI Tótem ${promptDescription.slice(0, 14)}` : 'KAI Matriz Fractal';
      break;
  }

  return {
    name: epicName,
    sourceType: 'image',
    createdAt: new Date().toISOString(),
    detectedObject: label,
    lines: vectorArt.lines,
    polygons: vectorArt.polygons,
    coreEye: { cx: 80, cy: 85, r: 8 },
  };
}
