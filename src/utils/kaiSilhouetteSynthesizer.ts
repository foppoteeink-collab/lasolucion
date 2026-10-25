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

      hash = (hash << 3) ^ (r + g * 3 + b * 7);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;

      let isForeground = false;
      if (isTransparentBg) {
        isForeground = a > 140;
      } else {
        const colorDist = Math.hypot(r - bgR, g - bgG, b - bgB);
        isForeground = colorDist > 28;
      }

      if (isForeground) {
        mask[y][x] = true;
        totalForeground++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (totalForeground < 25) {
    const avgLum = totalLum / (dim * dim);
    for (let y = 0; y < dim; y++) {
      for (let x = 0; x < dim; x++) {
        const idx = (y * dim + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (Math.abs(lum - avgLum) > 22) {
          mask[y][x] = true;
          totalForeground++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  if (totalForeground === 0 || minX > maxX || minY > maxY) {
    minX = 6; maxX = dim - 7; minY = 6; maxY = dim - 7;
    totalForeground = (maxX - minX) * (maxY - minY);
  }

  const objW = Math.max(1, maxX - minX + 1);
  const objH = Math.max(1, maxY - minY + 1);
  const aspectRatio = objW / objH;

  const halfWidths: number[] = [];
  const centerOffsets: number[] = [];
  let maxHalfWidth = 1;

  for (let slice = 0; slice < 10; slice++) {
    const sampleY = Math.min(dim - 1, Math.max(0, Math.round(minY + (slice / 9) * (objH - 1))));
    let sliceLeft = -1;
    let sliceRight = -1;

    for (let x = 0; x < dim; x++) {
      if (mask[sampleY][x]) {
        if (sliceLeft === -1) sliceLeft = x;
        sliceRight = x;
      }
    }

    if (sliceLeft === -1 || sliceRight === -1) {
      const fallbackHW = Math.sin(((slice + 1) / 11) * Math.PI) * (objW / 2);
      halfWidths.push(Math.max(2, fallbackHW));
      centerOffsets.push(0);
    } else {
      const hw = Math.max(1.5, (sliceRight - sliceLeft + 1) / 2);
      const mid = (sliceLeft + sliceRight) / 2;
      const centerShift = (mid - (minX + objW / 2)) / (objW / 2 || 1);
      halfWidths.push(hw);
      centerOffsets.push(Math.max(-1, Math.min(1, centerShift)));
      if (hw > maxHalfWidth) maxHalfWidth = hw;
    }
  }

  const normalizedHW = halfWidths.map((hw) => Math.max(0.12, hw / maxHalfWidth));

  const topY = Math.min(dim - 1, minY);
  let topTransitions = 0;
  for (let x = 1; x < dim; x++) {
    if (mask[topY][x] !== mask[topY][x - 1]) topTransitions++;
  }
  const isDualPeaked = topTransitions >= 3 || (normalizedHW[0] > 0.4 && normalizedHW[1] < normalizedHW[0]);
  const midHW = (normalizedHW[4] + normalizedHW[5]) / 2;
  const isConvex = midHW > normalizedHW[0] * 1.3 && midHW > normalizedHW[9] * 1.3;
  const isSlender = aspectRatio < 0.65;
  const waistHW = (normalizedHW[4] + normalizedHW[5]) / 2;
  const isHourglass = waistHW < normalizedHW[2] * 0.85 && waistHW < normalizedHW[8] * 0.85;
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
): { category: 'sunglasses' | 'lighter' | 'headphones' | 'watch' | 'mug' | 'dumbbell' | 'apple' | 'phone' | 'bespoke'; label: string } {
  const p = prompt.toLowerCase();

  // 1. Coincidencia por texto / prompt del usuario
  if (p.includes('gafa') || p.includes('lente') || p.includes('anteojo') || p.includes('sunglass') || p.includes('visor') || p.includes('rayban')) {
    return { category: 'sunglasses', label: 'Gafas de Sol' };
  }
  if (p.includes('encendedor') || p.includes('mechero') || p.includes('zippo') || p.includes('lighter') || p.includes('fuego') || p.includes('bic') || p.includes('chispa')) {
    return { category: 'lighter', label: 'Encendedor' };
  }
  if (p.includes('audifono') || p.includes('audífono') || p.includes('auricular') || p.includes('headphone') || p.includes('headset') || p.includes('sony') || p.includes('airpod') || p.includes('diadema')) {
    return { category: 'headphones', label: 'Audífonos' };
  }
  if (p.includes('reloj') || p.includes('watch') || p.includes('smartwatch') || p.includes('cronometro') || p.includes('cronómetro') || p.includes('rolex')) {
    return { category: 'watch', label: 'Reloj' };
  }
  if (p.includes('taza') || p.includes('cafe') || p.includes('café') || p.includes('vaso') || p.includes('termo') || p.includes('mug') || p.includes('cup') || p.includes('starbucks')) {
    return { category: 'mug', label: 'Taza de Café' };
  }
  if (p.includes('pesa') || p.includes('mancuerna') || p.includes('dumbbell') || p.includes('gym') || p.includes('barra') || p.includes('disco')) {
    return { category: 'dumbbell', label: 'Pesa / Mancuerna' };
  }
  if (p.includes('manzana') || p.includes('fruta') || p.includes('apple') || p.includes('fruto')) {
    return { category: 'apple', label: 'Manzana' };
  }
  if (p.includes('celular') || p.includes('telefono') || p.includes('teléfono') || p.includes('smartphone') || p.includes('iphone') || p.includes('pantalla')) {
    return { category: 'phone', label: 'Smartphone' };
  }

  // 2. Coincidencia por morfología visual (si el prompt está vacío)
  if (analysis.isWide && analysis.isDualPeaked) {
    return { category: 'headphones', label: 'Audífonos' };
  }
  if (analysis.isWide && analysis.aspectRatio > 1.45) {
    return { category: 'sunglasses', label: 'Gafas de Sol' };
  }
  if (analysis.isSlender && analysis.aspectRatio < 0.65) {
    return { category: 'lighter', label: 'Encendedor' };
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
 * GENERADORES ICONOGRÁFICOS ESPECIALIZADOS (ESTILO KAI: LÍNEAS NEÓN + OJO SAGRADO)
 * ══════════════════════════════════════════════════════════════════════════════
 */

// 🕶️ GAFAS DE SOL / VISOR SOLARIS
function buildSunglassesKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Barra superior del marco
      { x1: 34, y1: 68, x2: 126, y2: 68 },
      // Lente Izquierdo (Marco exterior)
      { x1: 34, y1: 68, x2: 38, y2: 104 },
      { x1: 38, y1: 104, x2: 66, y2: 108 },
      { x1: 66, y1: 108, x2: 74, y2: 90 },
      { x1: 74, y1: 90, x2: 74, y2: 68 },
      // Lente Derecho (Marco exterior)
      { x1: 126, y1: 68, x2: 122, y2: 104 },
      { x1: 122, y1: 104, x2: 94, y2: 108 },
      { x1: 94, y1: 108, x2: 86, y2: 90 },
      { x1: 86, y1: 90, x2: 86, y2: 68 },
      // Puente central sobre el ojo de KAI (80, 85)
      { x1: 74, y1: 76, x2: 86, y2: 76 },
      { x1: 74, y1: 90, x2: 86, y2: 90 },
      // Facetas internas del lente izquierdo
      { x1: 42, y1: 74, x2: 44, y2: 98 },
      { x1: 44, y1: 98, x2: 64, y2: 102 },
      { x1: 64, y1: 102, x2: 70, y2: 88 },
      { x1: 70, y1: 88, x2: 70, y2: 74 },
      { x1: 42, y1: 74, x2: 70, y2: 74 },
      // Facetas internas del lente derecho
      { x1: 118, y1: 74, x2: 116, y2: 98 },
      { x1: 116, y1: 98, x2: 96, y2: 102 },
      { x1: 96, y1: 102, x2: 90, y2: 88 },
      { x1: 90, y1: 88, x2: 90, y2: 74 },
      { x1: 118, y1: 74, x2: 90, y2: 74 },
      // Patillas laterales plegadas estilo cyberpunk
      { x1: 34, y1: 68, x2: 22, y2: 112 },
      { x1: 22, y1: 112, x2: 24, y2: 128 },
      { x1: 126, y1: 68, x2: 138, y2: 112 },
      { x1: 138, y1: 112, x2: 136, y2: 128 },
      // Visera / Ceja superior poligonal
      { x1: 52, y1: 52, x2: 80, y2: 42 },
      { x1: 80, y1: 42, x2: 108, y2: 52 },
      { x1: 52, y1: 52, x2: 34, y2: 68 },
      { x1: 108, y1: 52, x2: 126, y2: 68 },
      // Conexión del puente al ojo central
      { x1: 80, y1: 42, x2: 80, y2: 68 },
      { x1: 80, y1: 90, x2: 80, y2: 114 },
    ],
    polygons: [
      { points: '34,68 38,104 66,108 74,90 74,68' },
      { points: '126,68 122,104 94,108 86,90 86,68' },
      { points: '52,52 80,42 108,52 80,68' },
    ],
  };
}

// ⚡ ENCENDEDOR / KAI IGNIS MONOLITO
function buildLighterKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Base biselada del encendedor
      { x1: 54, y1: 138, x2: 106, y2: 138 },
      { x1: 54, y1: 138, x2: 46, y2: 130 },
      { x1: 106, y1: 138, x2: 114, y2: 130 },
      // Laterales del chasis
      { x1: 46, y1: 130, x2: 46, y2: 74 },
      { x1: 114, y1: 130, x2: 114, y2: 74 },
      // Ranura horizontal de la tapa abatible
      { x1: 46, y1: 74, x2: 114, y2: 74 },
      // Chimenea / Cortavientos perforado metálico
      { x1: 58, y1: 52, x2: 102, y2: 52 },
      { x1: 58, y1: 74, x2: 58, y2: 52 },
      { x1: 102, y1: 74, x2: 102, y2: 52 },
      // Perforaciones de aire en la chimenea
      { x1: 66, y1: 64, x2: 72, y2: 64 },
      { x1: 88, y1: 64, x2: 94, y2: 64 },
      // Rueda de chispa / estrías en los hombros
      { x1: 46, y1: 74, x2: 36, y2: 58 },
      { x1: 36, y1: 58, x2: 44, y2: 48 },
      { x1: 44, y1: 48, x2: 58, y2: 52 },
      { x1: 114, y1: 74, x2: 124, y2: 58 },
      { x1: 124, y1: 58, x2: 116, y2: 48 },
      { x1: 116, y1: 48, x2: 102, y2: 52 },
      // Llama de plasma geométrica superior
      { x1: 80, y1: 20, x2: 68, y2: 40 },
      { x1: 80, y1: 20, x2: 92, y2: 40 },
      { x1: 68, y1: 40, x2: 74, y2: 52 },
      { x1: 92, y1: 40, x2: 86, y2: 52 },
      // Núcleo interno de la llama
      { x1: 80, y1: 28, x2: 74, y2: 42 },
      { x1: 80, y1: 28, x2: 86, y2: 42 },
      { x1: 74, y1: 42, x2: 80, y2: 48 },
      { x1: 86, y1: 42, x2: 80, y2: 48 },
      // Refuerzos de facetado en el cuerpo alrededor del ojo
      { x1: 46, y1: 98, x2: 64, y2: 98 },
      { x1: 114, y1: 98, x2: 96, y2: 98 },
      { x1: 64, y1: 98, x2: 80, y2: 120 },
      { x1: 96, y1: 98, x2: 80, y2: 120 },
      { x1: 80, y1: 120, x2: 80, y2: 138 },
      // Canales de anclaje ocular
      { x1: 46, y1: 74, x2: 62, y2: 85 },
      { x1: 114, y1: 74, x2: 98, y2: 85 },
    ],
    polygons: [
      { points: '80,20 68,40 74,52 86,52 92,40' },
      { points: '58,52 102,52 102,74 58,74' },
      { points: '46,74 114,74 106,138 54,138' },
    ],
  };
}

// 🎧 AUDÍFONOS / KAI SÓNICO VÓRTICE
function buildHeadphonesKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Diadema exterior arqueada
      { x1: 38, y1: 72, x2: 54, y2: 42 },
      { x1: 54, y1: 42, x2: 80, y2: 24 },
      { x1: 80, y1: 24, x2: 106, y2: 42 },
      { x1: 106, y1: 42, x2: 122, y2: 72 },
      // Diadema interior
      { x1: 44, y1: 74, x2: 58, y2: 48 },
      { x1: 58, y1: 48, x2: 80, y2: 34 },
      { x1: 80, y1: 34, x2: 102, y2: 48 },
      { x1: 102, y1: 48, x2: 116, y2: 74 },
      // Almohadilla superior de confort
      { x1: 64, y1: 29, x2: 96, y2: 29 },
      // Horquilla izquierda (Yoke)
      { x1: 38, y1: 72, x2: 26, y2: 84 },
      { x1: 38, y1: 72, x2: 54, y2: 84 },
      // Copa auricular izquierda
      { x1: 26, y1: 84, x2: 46, y2: 76 },
      { x1: 46, y1: 76, x2: 56, y2: 96 },
      { x1: 56, y1: 96, x2: 46, y2: 118 },
      { x1: 46, y1: 118, x2: 26, y2: 110 },
      { x1: 26, y1: 110, x2: 26, y2: 84 },
      // Transductor interior izquierdo
      { x1: 32, y1: 88, x2: 42, y2: 82 },
      { x1: 42, y1: 82, x2: 48, y2: 96 },
      { x1: 48, y1: 96, x2: 42, y2: 110 },
      { x1: 42, y1: 110, x2: 32, y2: 104 },
      { x1: 32, y1: 104, x2: 32, y2: 88 },
      // Horquilla derecha (Yoke)
      { x1: 122, y1: 72, x2: 134, y2: 84 },
      { x1: 122, y1: 72, x2: 106, y2: 84 },
      // Copa auricular derecha
      { x1: 134, y1: 84, x2: 114, y2: 76 },
      { x1: 114, y1: 76, x2: 104, y2: 96 },
      { x1: 104, y1: 96, x2: 114, y2: 118 },
      { x1: 114, y1: 118, x2: 134, y2: 110 },
      { x1: 134, y1: 110, x2: 134, y2: 84 },
      // Transductor interior derecho
      { x1: 128, y1: 88, x2: 118, y2: 82 },
      { x1: 118, y1: 82, x2: 112, y2: 96 },
      { x1: 112, y1: 96, x2: 118, y2: 110 },
      { x1: 118, y1: 110, x2: 128, y2: 104 },
      { x1: 128, y1: 104, x2: 128, y2: 88 },
      // Núcleo de onda sónica hacia el ojo sagrado (80, 85)
      { x1: 56, y1: 96, x2: 68, y2: 85 },
      { x1: 104, y1: 96, x2: 92, y2: 85 },
      { x1: 80, y1: 34, x2: 80, y2: 66 },
      { x1: 80, y1: 104, x2: 80, y2: 136 },
      { x1: 46, y1: 118, x2: 80, y2: 136 },
      { x1: 114, y1: 118, x2: 80, y2: 136 },
    ],
    polygons: [
      { points: '26,84 46,76 56,96 46,118 26,110' },
      { points: '134,84 114,76 104,96 114,118 134,110' },
      { points: '54,42 80,24 106,42 102,48 80,34 58,48' },
    ],
  };
}

// ⌚ RELOJ / KAI CRONO-BISEL
function buildWatchKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Bisel octagonal exterior
      { x1: 58, y1: 62, x2: 102, y2: 62 },
      { x1: 102, y1: 62, x2: 124, y2: 85 },
      { x1: 124, y1: 85, x2: 102, y2: 108 },
      { x1: 102, y1: 108, x2: 58, y2: 108 },
      { x1: 58, y1: 108, x2: 36, y2: 85 },
      { x1: 36, y1: 85, x2: 58, y2: 62 },
      // Esfera circular interna
      { x1: 64, y1: 68, x2: 96, y2: 68 },
      { x1: 96, y1: 68, x2: 112, y2: 85 },
      { x1: 112, y1: 85, x2: 96, y2: 102 },
      { x1: 96, y1: 102, x2: 64, y2: 102 },
      { x1: 64, y1: 102, x2: 48, y2: 85 },
      { x1: 48, y1: 85, x2: 64, y2: 68 },
      // Correa superior con nervaduras
      { x1: 64, y1: 62, x2: 68, y2: 24 },
      { x1: 96, y1: 62, x2: 92, y2: 24 },
      { x1: 68, y1: 24, x2: 92, y2: 24 },
      { x1: 66, y1: 42, x2: 94, y2: 42 },
      // Correa inferior
      { x1: 64, y1: 108, x2: 68, y2: 146 },
      { x1: 96, y1: 108, x2: 92, y2: 146 },
      { x1: 68, y1: 146, x2: 92, y2: 146 },
      { x1: 66, y1: 128, x2: 94, y2: 128 },
      // Botones / Coronas laterales tácticas
      { x1: 124, y1: 78, x2: 132, y2: 78 },
      { x1: 132, y1: 78, x2: 132, y2: 92 },
      { x1: 132, y1: 92, x2: 124, y2: 92 },
      // Índices horarios
      { x1: 80, y1: 68, x2: 80, y2: 74 },
      { x1: 80, y1: 96, x2: 80, y2: 102 },
      { x1: 48, y1: 85, x2: 56, y2: 85 },
      { x1: 104, y1: 85, x2: 112, y2: 85 },
    ],
    polygons: [
      { points: '58,62 102,62 124,85 102,108 58,108 36,85' },
      { points: '64,62 68,24 92,24 96,62' },
      { points: '64,108 68,146 92,146 96,108' },
    ],
  };
}

// ☕ TAZA / KAI TERMO-REACTOR
function buildMugKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Borde superior de la taza
      { x1: 48, y1: 58, x2: 112, y2: 58 },
      // Cuerpo trapezoidal
      { x1: 48, y1: 58, x2: 56, y2: 132 },
      { x1: 112, y1: 58, x2: 104, y2: 132 },
      // Base y pedestal
      { x1: 56, y1: 132, x2: 104, y2: 132 },
      { x1: 52, y1: 138, x2: 108, y2: 138 },
      { x1: 56, y1: 132, x2: 52, y2: 138 },
      { x1: 104, y1: 132, x2: 108, y2: 138 },
      // Asas cibernéticas simétricas en ambos costados
      { x1: 48, y1: 70, x2: 26, y2: 82 },
      { x1: 26, y1: 82, x2: 26, y2: 114 },
      { x1: 26, y1: 114, x2: 54, y2: 122 },
      { x1: 112, y1: 70, x2: 134, y2: 82 },
      { x1: 134, y1: 82, x2: 134, y2: 114 },
      { x1: 134, y1: 114, x2: 106, y2: 122 },
      // Vapor / Energía ascendente en vectores
      { x1: 76, y1: 52, x2: 80, y2: 22 },
      { x1: 80, y1: 22, x2: 84, y2: 52 },
      { x1: 62, y1: 54, x2: 66, y2: 32 },
      { x1: 98, y1: 54, x2: 94, y2: 32 },
      // Facetas en el cuerpo hacia el ojo (80, 85)
      { x1: 48, y1: 85, x2: 64, y2: 85 },
      { x1: 112, y1: 85, x2: 96, y2: 85 },
      { x1: 64, y1: 85, x2: 80, y2: 110 },
      { x1: 96, y1: 85, x2: 80, y2: 110 },
    ],
    polygons: [
      { points: '48,58 112,58 104,132 56,132' },
      { points: '76,52 80,22 84,52' },
    ],
  };
}

// 🏋️ MANCUERNA / KAI TITÁN DE FUERZA
function buildDumbbellKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Discos izquierdos hexagonales
      { x1: 22, y1: 60, x2: 44, y2: 60 },
      { x1: 44, y1: 60, x2: 48, y2: 85 },
      { x1: 48, y1: 85, x2: 44, y2: 110 },
      { x1: 44, y1: 110, x2: 22, y2: 110 },
      { x1: 22, y1: 110, x2: 18, y2: 85 },
      { x1: 18, y1: 85, x2: 22, y2: 60 },
      // Disco secundario izquierdo
      { x1: 28, y1: 66, x2: 38, y2: 66 },
      { x1: 38, y1: 66, x2: 42, y2: 85 },
      { x1: 42, y1: 85, x2: 38, y2: 104 },
      { x1: 38, y1: 104, x2: 28, y2: 104 },
      { x1: 28, y1: 104, x2: 24, y2: 85 },
      { x1: 24, y1: 85, x2: 28, y2: 66 },
      // Discos derechos hexagonales
      { x1: 138, y1: 60, x2: 116, y2: 60 },
      { x1: 116, y1: 60, x2: 112, y2: 85 },
      { x1: 112, y1: 85, x2: 116, y2: 110 },
      { x1: 116, y1: 110, x2: 138, y2: 110 },
      { x1: 138, y1: 110, x2: 142, y2: 85 },
      { x1: 142, y1: 85, x2: 138, y2: 60 },
      // Disco secundario derecho
      { x1: 132, y1: 66, x2: 122, y2: 66 },
      { x1: 122, y1: 66, x2: 118, y2: 85 },
      { x1: 118, y1: 85, x2: 122, y2: 104 },
      { x1: 122, y1: 104, x2: 132, y2: 104 },
      { x1: 132, y1: 104, x2: 136, y2: 85 },
      { x1: 136, y1: 85, x2: 132, y2: 66 },
      // Barra central moleteada
      { x1: 48, y1: 78, x2: 112, y2: 78 },
      { x1: 48, y1: 92, x2: 112, y2: 92 },
      // Anillas de tope en la barra
      { x1: 58, y1: 74, x2: 58, y2: 96 },
      { x1: 102, y1: 74, x2: 102, y2: 96 },
      // Facetas diagonales alrededor del ojo central
      { x1: 68, y1: 78, x2: 80, y2: 64 },
      { x1: 92, y1: 78, x2: 80, y2: 64 },
      { x1: 68, y1: 92, x2: 80, y2: 106 },
      { x1: 92, y1: 92, x2: 80, y2: 106 },
    ],
    polygons: [
      { points: '22,60 44,60 48,85 44,110 22,110 18,85' },
      { points: '138,60 116,60 112,85 116,110 138,110 142,85' },
      { points: '58,78 102,78 102,92 58,92' },
    ],
  };
}

// 🍎 MANZANA / KAI ORBE BOTÁNICO
function buildAppleKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Hombros superiores redondeados y hendidura central
      { x1: 80, y1: 56, x2: 62, y2: 48 },
      { x1: 80, y1: 56, x2: 98, y2: 48 },
      { x1: 62, y1: 48, x2: 40, y2: 68 },
      { x1: 98, y1: 48, x2: 120, y2: 68 },
      // Flancos exteriores
      { x1: 40, y1: 68, x2: 36, y2: 96 },
      { x1: 120, y1: 68, x2: 124, y2: 96 },
      { x1: 36, y1: 96, x2: 44, y2: 120 },
      { x1: 124, y1: 96, x2: 116, y2: 120 },
      // Base inferior con hoyuelo
      { x1: 44, y1: 120, x2: 66, y2: 136 },
      { x1: 116, y1: 120, x2: 94, y2: 136 },
      { x1: 66, y1: 136, x2: 80, y2: 132 },
      { x1: 94, y1: 136, x2: 80, y2: 132 },
      // Tallo botánico
      { x1: 80, y1: 56, x2: 80, y2: 32 },
      { x1: 80, y1: 32, x2: 84, y2: 24 },
      // Hoja poligonal estilizada
      { x1: 80, y1: 38, x2: 98, y2: 30 },
      { x1: 98, y1: 30, x2: 94, y2: 46 },
      { x1: 94, y1: 46, x2: 80, y2: 38 },
      // Facetas internas geodésicas hacia el ojo
      { x1: 40, y1: 68, x2: 64, y2: 85 },
      { x1: 120, y1: 68, x2: 96, y2: 85 },
      { x1: 44, y1: 120, x2: 64, y2: 85 },
      { x1: 116, y1: 120, x2: 96, y2: 85 },
    ],
    polygons: [
      { points: '80,56 62,48 40,68 36,96 44,120 66,136 80,132 94,136 116,120 124,96 120,68 98,48' },
      { points: '80,38 98,30 94,46' },
    ],
  };
}

// 📱 SMARTPHONE / KAI TERMINAL CUÁNTICO
function buildPhoneKai(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number }>; polygons: Array<{ points: string }> } {
  return {
    lines: [
      // Chasis exterior redondeado
      { x1: 54, y1: 26, x2: 106, y2: 26 },
      { x1: 106, y1: 26, x2: 114, y2: 34 },
      { x1: 114, y1: 34, x2: 114, y2: 136 },
      { x1: 114, y1: 136, x2: 106, y2: 144 },
      { x1: 106, y1: 144, x2: 54, y2: 144 },
      { x1: 54, y1: 144, x2: 46, y2: 136 },
      { x1: 46, y1: 136, x2: 46, y2: 34 },
      { x1: 46, y1: 34, x2: 54, y2: 26 },
      // Marco de pantalla interior
      { x1: 52, y1: 42, x2: 108, y2: 42 },
      { x1: 108, y1: 42, x2: 108, y2: 128 },
      { x1: 108, y1: 128, x2: 52, y2: 128 },
      { x1: 52, y1: 128, x2: 52, y2: 42 },
      // Dynamic Island / Cámara frontal
      { x1: 72, y1: 34, x2: 88, y2: 34 },
      // Barra de inicio táctil
      { x1: 70, y1: 136, x2: 90, y2: 136 },
      // Facetas diagonales hacia el sensor ocular
      { x1: 52, y1: 42, x2: 64, y2: 85 },
      { x1: 108, y1: 42, x2: 96, y2: 85 },
      { x1: 52, y1: 128, x2: 64, y2: 85 },
      { x1: 108, y1: 128, x2: 96, y2: 85 },
    ],
    polygons: [
      { points: '54,26 106,26 114,34 114,136 106,144 54,144 46,136 46,34' },
      { points: '52,42 108,42 108,128 52,128' },
    ],
  };
}

// 🌐 SILUETA PERSONALIZADA ADAPTATIVA (PARA CUALQUIER OTRO OBJETO)
function buildBespokeContourKai(analysis: ImageSampleAnalysis): {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  polygons: Array<{ points: string }>;
} {
  const Y_LEVELS = [26, 38, 50, 62, 74, 86, 98, 110, 124, 138];
  const maxAllowedHalfWidth = analysis.isSlender ? 38 : analysis.isWide ? 54 : 48;
  const minAllowedHalfWidth = 14;

  const dxList: number[] = analysis.halfWidths.map((hw) => {
    return Math.round(minAllowedHalfWidth + hw * (maxAllowedHalfWidth - minAllowedHalfWidth));
  });

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  for (let i = 0; i < 9; i++) {
    lines.push({
      x1: 80 - dxList[i],
      y1: Y_LEVELS[i],
      x2: 80 - dxList[i + 1],
      y2: Y_LEVELS[i + 1],
    });
    lines.push({
      x1: 80 + dxList[i],
      y1: Y_LEVELS[i],
      x2: 80 + dxList[i + 1],
      y2: Y_LEVELS[i + 1],
    });
  }

  const apexY = Y_LEVELS[0] - 8;
  lines.push({ x1: 80 - dxList[0], y1: Y_LEVELS[0], x2: 80, y2: apexY });
  lines.push({ x1: 80 + dxList[0], y1: Y_LEVELS[0], x2: 80, y2: apexY });
  lines.push({ x1: 80, y1: apexY, x2: 80, y2: Y_LEVELS[2] });

  polygons.push({
    points: `${80 - dxList[0]},${Y_LEVELS[0]} 80,${apexY} ${80 + dxList[0]},${Y_LEVELS[0]}`,
  });

  const bottomTipY = 142;
  lines.push({ x1: 80 - dxList[9], y1: Y_LEVELS[9], x2: 80, y2: bottomTipY });
  lines.push({ x1: 80 + dxList[9], y1: Y_LEVELS[9], x2: 80, y2: bottomTipY });

  polygons.push({
    points: `${80 - dxList[9]},${Y_LEVELS[9]} 80,${bottomTipY} ${80 + dxList[9]},${Y_LEVELS[9]}`,
  });

  for (let i = 0; i < 9; i += 2) {
    const midY = Math.round((Y_LEVELS[i] + Y_LEVELS[i + 1]) / 2);
    lines.push({ x1: 80 - dxList[i], y1: Y_LEVELS[i], x2: 80, y2: midY });
    lines.push({ x1: 80 + dxList[i], y1: Y_LEVELS[i], x2: 80, y2: midY });
    lines.push({ x1: 80, y1: midY, x2: 80 - dxList[i + 1], y2: Y_LEVELS[i + 1] });
    lines.push({ x1: 80, y1: midY, x2: 80 + dxList[i + 1], y2: Y_LEVELS[i + 1] });

    polygons.push({
      points: `${80 - dxList[i]},${Y_LEVELS[i]} ${80 - dxList[i + 1]},${Y_LEVELS[i + 1]} 80,${midY}`,
    });
    polygons.push({
      points: `${80 + dxList[i]},${Y_LEVELS[i]} ${80 + dxList[i + 1]},${Y_LEVELS[i + 1]} 80,${midY}`,
    });
  }

  lines.push({ x1: 80 - dxList[5], y1: Y_LEVELS[5], x2: 50, y2: 85 });
  lines.push({ x1: 80 + dxList[5], y1: Y_LEVELS[5], x2: 110, y2: 85 });
  lines.push({ x1: 80 - dxList[4], y1: Y_LEVELS[4], x2: 60, y2: 74 });
  lines.push({ x1: 80 + dxList[4], y1: Y_LEVELS[4], x2: 100, y2: 74 });

  lines.push({ x1: 80, y1: 26, x2: 80, y2: 64 });
  lines.push({ x1: 80, y1: 106, x2: 80, y2: 138 });

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
    case 'sunglasses':
      vectorArt = buildSunglassesKai();
      epicName = promptDescription ? `KAI Visor ${promptDescription.slice(0, 14)}` : 'KAI Visor Solaris';
      break;
    case 'lighter':
      vectorArt = buildLighterKai();
      epicName = promptDescription ? `KAI Ignis ${promptDescription.slice(0, 14)}` : 'KAI Ignis Monolito';
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
    case 'apple':
      vectorArt = buildAppleKai();
      epicName = promptDescription ? `KAI Orbe ${promptDescription.slice(0, 14)}` : 'KAI Orbe Botánico';
      break;
    case 'phone':
      vectorArt = buildPhoneKai();
      epicName = promptDescription ? `KAI Terminal ${promptDescription.slice(0, 14)}` : 'KAI Terminal Cuántico';
      break;
    case 'bespoke':
    default:
      vectorArt = buildBespokeContourKai(analysis);
      epicName = promptDescription ? `KAI Tótem ${promptDescription.slice(0, 14)}` : 'KAI Matriz Neón';
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
