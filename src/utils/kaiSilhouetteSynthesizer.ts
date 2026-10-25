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
 * Genera un análisis de respaldo determinista directamente a partir de los bytes
 * de la cadena Base64 (en caso de que el lienzo de navegador no esté disponible).
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

  const isDualPeaked = absHash % 3 === 0;
  const isConvex = absHash % 4 === 1;
  const isSlender = absHash % 5 === 2;
  const isHourglass = absHash % 6 === 3;
  const isWide = absHash % 7 === 4;

  return {
    aspectRatio: 0.6 + (absHash % 100) / 70,
    density: 0.4 + (absHash % 50) / 100,
    isDualPeaked,
    isConvex,
    isSlender,
    isHourglass,
    isWide,
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
  // 1. Estimar color del fondo muestreando las 4 esquinas y bordes
  const cornerIndices = [
    0, // sup-izq
    (dim - 1) * 4, // sup-der
    (dim * (dim - 1)) * 4, // inf-izq
    (dim * dim - 1) * 4, // inf-der
    Math.floor(dim / 2) * 4, // centro sup
    ((dim - 1) * dim + Math.floor(dim / 2)) * 4, // centro inf
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

  // 2. Crear máscara de primer plano (foreground mask)
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

  // Si la imagen tiene muy poco contraste de fondo, usar contraste respecto a la media
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

  // 3. Muestrear 10 cortes horizontales (de arriba a abajo)
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
      // Reclamar ancho del corte anterior o aproximar por elipse
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

  // Normalizar halfWidths a rango 0.1 a 1.0
  const normalizedHW = halfWidths.map((hw) => Math.max(0.12, hw / maxHalfWidth));

  // 4. Detección de características morfológicas clave
  // A. ¿Tiene dos picos arriba (orejas de animal, audífonos, astas)?
  const topY = Math.min(dim - 1, minY);
  let topTransitions = 0;
  for (let x = 1; x < dim; x++) {
    if (mask[topY][x] !== mask[topY][x - 1]) topTransitions++;
  }
  const isDualPeaked = topTransitions >= 3 || (normalizedHW[0] > 0.4 && normalizedHW[1] < normalizedHW[0]);

  // B. ¿Es convexo (orbe, manzana, reloj)?
  const midHW = (normalizedHW[4] + normalizedHW[5]) / 2;
  const isConvex = midHW > normalizedHW[0] * 1.3 && midHW > normalizedHW[9] * 1.3;

  // C. ¿Es esbelto / monolito vertical (botella, encendedor, espada)?
  const isSlender = aspectRatio < 0.65;

  // D. ¿Tiene cintura (guitarra, pesa, reloj de arena)?
  const waistHW = (normalizedHW[4] + normalizedHW[5]) / 2;
  const isHourglass = waistHW < normalizedHW[2] * 0.85 && waistHW < normalizedHW[8] * 0.85;

  // E. ¿Es ancho (auriculares de diadema, gafas, avión)?
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
 * Síntesis de nombres épicos cibernéticos basados en el análisis visual y el prompt
 */
function deriveEpicName(analysis: ImageSampleAnalysis, userPrompt?: string): string {
  if (userPrompt && userPrompt.trim()) {
    const cleanPrompt = userPrompt.trim().replace(/[.,!¡?¿]/g, '');
    const capitalized = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1, 18);
    if (analysis.isDualPeaked) return `Cyber-${capitalized} Alfa`;
    if (analysis.isConvex) return `Orbe ${capitalized} Cuántico`;
    if (analysis.isSlender) return `Titán ${capitalized} Monolito`;
    if (analysis.isWide) return `Centinela ${capitalized} Vectorial`;
    return `Vanguardia ${capitalized}`;
  }

  const hash = analysis.signatureHash;

  if (analysis.isDualPeaked) {
    const names = [
      'Centinela Auricular Alfa',
      'Cyber-Lince Espectral',
      'Vórtice Bicornio Neón',
      'Arco Sónico Diadema',
      'Guardián de Escaneo Biaxial',
    ];
    return names[hash % names.length];
  }

  if (analysis.isConvex) {
    const names = [
      'Orbe Crono-Esférico',
      'Núcleo Gravitacional Alfa',
      'Globo Cuántico Solar',
      'Esfera de Vacío Radiante',
      'Prisma Geodésico Cuántico',
    ];
    return names[hash % names.length];
  }

  if (analysis.isSlender) {
    const names = [
      'Titán Columna Óptica',
      'Monolito Nexo Adamantio',
      'Obelisco de Luz Especular',
      'Aguja Cuántica Estelar',
      'Códice de Adamantio',
    ];
    return names[hash % names.length];
  }

  if (analysis.isWide) {
    const names = [
      'Vanguardia Alada Táctica',
      'Emisor Biaxial Cuántico',
      'Interceptor Vectorial Neón',
      'Radar Sagrado de KAI',
      'Chasis Valquiria Biaxial',
    ];
    return names[hash % names.length];
  }

  if (analysis.isHourglass) {
    const names = [
      'Resonador Armónico Biaxial',
      'Crono-Váscula Cuántica',
      'Balanza de Singularidad',
      'Péndulo de Fase Cero',
      'Oscilador Cuántico',
    ];
    return names[hash % names.length];
  }

  const defaultNames = [
    'Artefacto Cuántico Alfa',
    'Holo-Centinela Sagrado',
    'Matriz Poliédrica Neón',
    'Baluarte Prismático de KAI',
    'Efigie Holográfica Viva',
  ];
  return defaultNames[hash % defaultNames.length];
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SINTETIZADOR VECTORIAL DE SILUETA GEOMÉTRICA (MOTOR DE GENERACIÓN PROCEDURAL)
 * Transforma los cortes de silueta extraídos de la fotografía en un modelo
 * poligonal simétrico estricto dentro de viewBox="0 0 160 170" con el ojo sagrado.
 * ══════════════════════════════════════════════════════════════════════════════
 */
export async function synthesizeKaiFromImageSilhouette(params: {
  imageBase64: string;
  promptDescription?: string;
}): Promise<KaiCustomForm> {
  const { imageBase64, promptDescription = '' } = params;
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  // 1. Extraer datos de píxeles reales o analizar bytes Base64
  let analysis: ImageSampleAnalysis;
  const canvasResult = await extractImageDataFromCanvas(cleanBase64, 36);

  if (canvasResult && canvasResult.data) {
    analysis = analyzePixelMatrix(canvasResult.data, canvasResult.width);
  } else {
    analysis = analyzeBase64Bytes(cleanBase64);
  }

  // 2. Mapear los 10 cortes a coordenadas SVG simétricas en viewBox="0 0 160 170"
  // Eje central: x = 80
  // Rango vertical seguro: y = 26 a y = 138
  const Y_LEVELS = [26, 38, 50, 62, 74, 86, 98, 110, 124, 138];

  // Calcular el ancho de cada corte escalado a un halfWidth entre 14 y 52 píxeles
  const maxAllowedHalfWidth = analysis.isSlender ? 38 : analysis.isWide ? 54 : 48;
  const minAllowedHalfWidth = 14;

  const dxList: number[] = analysis.halfWidths.map((hw) => {
    return Math.round(minAllowedHalfWidth + hw * (maxAllowedHalfWidth - minAllowedHalfWidth));
  });

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const polygons: Array<{ points: string }> = [];

  // 3. GENERAR CONTORNO EXTERIOR SIMÉTRICO
  // Izquierda: (80 - dx[i], Y[i]) -> (80 - dx[i+1], Y[i+1])
  // Derecha:   (80 + dx[i], Y[i]) -> (80 + dx[i+1], Y[i+1])
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

  // 4. GENERAR CARACTERÍSTICA SUPERIOR (Cúpula, Orejas/Audífonos o Ápice)
  if (analysis.isDualPeaked) {
    // Orejas / Astas / Diadema de Audífonos
    const earTipX = Math.round(dxList[0] * 1.08);
    const earTipY = Y_LEVELS[0] - 8;
    const dipY = Y_LEVELS[0] + 10;

    // Punta Oreja Izquierda
    lines.push({ x1: 80 - dxList[0], y1: Y_LEVELS[0], x2: 80 - earTipX, y2: earTipY });
    lines.push({ x1: 80 - earTipX, y1: earTipY, x2: 80, y2: dipY });

    // Punta Oreja Derecha
    lines.push({ x1: 80 + dxList[0], y1: Y_LEVELS[0], x2: 80 + earTipX, y2: earTipY });
    lines.push({ x1: 80 + earTipX, y1: earTipY, x2: 80, y2: dipY });

    // Polígonos de orejas
    polygons.push({
      points: `${80 - dxList[0]},${Y_LEVELS[0]} ${80 - earTipX},${earTipY} 80,${dipY}`,
    });
    polygons.push({
      points: `${80 + dxList[0]},${Y_LEVELS[0]} ${80 + earTipX},${earTipY} 80,${dipY}`,
    });
  } else if (analysis.isConvex) {
    // Cúpula Esférica Facetada
    const apexY = Y_LEVELS[0] - 6;
    lines.push({ x1: 80 - dxList[0], y1: Y_LEVELS[0], x2: 80, y2: apexY });
    lines.push({ x1: 80 + dxList[0], y1: Y_LEVELS[0], x2: 80, y2: apexY });
    lines.push({ x1: 80 - dxList[0], y1: Y_LEVELS[0], x2: 80 + dxList[0], y2: Y_LEVELS[0] });

    polygons.push({
      points: `${80 - dxList[0]},${Y_LEVELS[0]} 80,${apexY} ${80 + dxList[0]},${Y_LEVELS[0]}`,
    });
  } else {
    // Ápice Triangular o Monolito
    const apexY = Y_LEVELS[0] - 10;
    lines.push({ x1: 80 - dxList[0], y1: Y_LEVELS[0], x2: 80, y2: apexY });
    lines.push({ x1: 80 + dxList[0], y1: Y_LEVELS[0], x2: 80, y2: apexY });
    lines.push({ x1: 80, y1: apexY, x2: 80, y2: Y_LEVELS[2] });

    polygons.push({
      points: `${80 - dxList[0]},${Y_LEVELS[0]} 80,${apexY} ${80 + dxList[0]},${Y_LEVELS[0]}`,
    });
  }

  // 5. GENERAR BASE INFERIOR (Punta de cristal o Skids de aterrizaje)
  if (analysis.isSlender || analysis.isConvex) {
    // Converge a punta inferior de cristal
    const bottomTipY = 144;
    lines.push({ x1: 80 - dxList[9], y1: Y_LEVELS[9], x2: 80, y2: bottomTipY });
    lines.push({ x1: 80 + dxList[9], y1: Y_LEVELS[9], x2: 80, y2: bottomTipY });

    polygons.push({
      points: `${80 - dxList[9]},${Y_LEVELS[9]} 80,${bottomTipY} ${80 + dxList[9]},${Y_LEVELS[9]}`,
    });
  } else {
    // Base de aterrizaje horizontal con bisel
    const baseY = 140;
    const innerDx = Math.max(10, Math.round(dxList[9] * 0.45));
    lines.push({ x1: 80 - dxList[9], y1: Y_LEVELS[9], x2: 80 - innerDx, y2: baseY });
    lines.push({ x1: 80 + dxList[9], y1: Y_LEVELS[9], x2: 80 + innerDx, y2: baseY });
    lines.push({ x1: 80 - innerDx, y1: baseY, x2: 80 + innerDx, y2: baseY });

    polygons.push({
      points: `${80 - dxList[9]},${Y_LEVELS[9]} ${80 - innerDx},${baseY} ${80 + innerDx},${baseY} ${80 + dxList[9]},${Y_LEVELS[9]}`,
    });
  }

  // 6. GENERAR FACETAS POLIGONALES INTERNAS Y REFUERZOS WIREFRAME
  // Se conectan los vértices con el eje central x=80 y entre niveles adyacentes
  for (let i = 0; i < 9; i += 2) {
    const midY = Math.round((Y_LEVELS[i] + Y_LEVELS[i + 1]) / 2);

    // Tirantes diagonales
    lines.push({ x1: 80 - dxList[i], y1: Y_LEVELS[i], x2: 80, y2: midY });
    lines.push({ x1: 80 + dxList[i], y1: Y_LEVELS[i], x2: 80, y2: midY });

    lines.push({ x1: 80, y1: midY, x2: 80 - dxList[i + 1], y2: Y_LEVELS[i + 1] });
    lines.push({ x1: 80, y1: midY, x2: 80 + dxList[i + 1], y2: Y_LEVELS[i + 1] });

    // Polígonos de facetas
    polygons.push({
      points: `${80 - dxList[i]},${Y_LEVELS[i]} ${80 - dxList[i + 1]},${Y_LEVELS[i + 1]} 80,${midY}`,
    });
    polygons.push({
      points: `${80 + dxList[i]},${Y_LEVELS[i]} ${80 + dxList[i + 1]},${Y_LEVELS[i + 1]} 80,${midY}`,
    });
  }

  // 7. INTEGRACIÓN CON EL OJO SAGRADO (80, 85, r: 8)
  // Anclar líneas estructurales desde los flancos laterales directamente a la cuenca ocular
  lines.push({ x1: 80 - dxList[5], y1: Y_LEVELS[5], x2: 50, y2: 85 });
  lines.push({ x1: 80 + dxList[5], y1: Y_LEVELS[5], x2: 110, y2: 85 });
  lines.push({ x1: 80 - dxList[4], y1: Y_LEVELS[4], x2: 60, y2: 74 });
  lines.push({ x1: 80 + dxList[4], y1: Y_LEVELS[4], x2: 100, y2: 74 });

  // Columna vertebral del chasis
  lines.push({ x1: 80, y1: 26, x2: 80, y2: 64 });
  lines.push({ x1: 80, y1: 106, x2: 80, y2: 138 });

  // 8. Crear y retornar el compañero holográfico
  const epicName = deriveEpicName(analysis, promptDescription);

  return {
    name: epicName,
    sourceType: 'image',
    createdAt: new Date().toISOString(),
    lines,
    polygons,
    coreEye: { cx: 80, cy: 85, r: 8 },
  };
}
