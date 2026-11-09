import { PlayerStats } from '../types';

export interface ShareCardPayload {
  stats: PlayerStats;
  archetypeName: string;
  completionRate?: number;
  xpEarnedToday?: number;
  grade?: string;
}

const showIOSShareCardModal = (imageUrl: string, fileName: string) => {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('ios-share-card-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'ios-share-card-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background-color:rgba(0,0,0,0.85);backdrop-filter:blur(8px);padding:16px;';
  
  modal.innerHTML = `
    <div style="position:relative;max-width:340px;width:100%;background-color:#0f172a;border:1px solid rgba(0,240,255,0.4);border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.8);">
      <button id="close-share-card-modal" style="position:absolute;top:10px;right:10px;color:#94a3b8;background:transparent;border:none;font-size:18px;cursor:pointer;padding:4px 8px;">✕</button>
      <p style="font-size:11px;font-weight:700;color:#00f0ff;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Tarjeta Táctica Generada</p>
      <img src="${imageUrl}" alt="${fileName}" style="max-height:60vh;border-radius:12px;border:1px solid rgba(0,240,255,0.2);object-fit:contain;box-shadow:0 10px 15px -3px rgba(0,0,0,0.5);" />
      <p style="font-size:11px;color:#cbd5e1;text-align:center;margin:0;font-family:system-ui,-apple-system,sans-serif;">
        📱 Mantén presionada la imagen para <strong>Guardar en Fotos</strong>
      </p>
    </div>
  `;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('#close-share-card-modal');
  const closeModal = () => {
    modal.remove();
    setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
  };
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
};

/**
 * 6. Growth Hacker — Generador Nativo de "Tarjeta Táctica de Legado" (Canvas Share Card 9:16)
 * Renderiza en cliente una tarjeta 9:16 con el estatus táctico del jugador y la comparte vía Web Share API
 * o visor interactivo para iOS WebKit sin depender de servidores externos.
 * Aplica escalado dinámico de memoria (720x1280 en móviles/baja RAM vs 1080x1920 en alta gama)
 * para prevenir caídas de WebKit (OOM crashes).
 */
export const generateAndShareLegacyCard = async (payload: ShareCardPayload): Promise<boolean> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isLowMemory = typeof navigator !== 'undefined' && (navigator as any).deviceMemory !== undefined && (navigator as any).deviceMemory <= 4;

  const baseWidth = (isMobile || isLowMemory) ? 720 : 1080;
  const baseHeight = (isMobile || isLowMemory) ? 1280 : 1920;
  const scale = baseWidth / 1080;

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth;
  canvas.height = baseHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.scale(scale, scale);

  try {
    // Sincronización tipográfica: asegura que las fuentes tipográficas estén rasterizadas en WebKit antes de dibujar
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      try {
        await (document as any).fonts.ready;
      } catch {
        // Fallback silencioso en entornos donde document.fonts falle
      }
    }

    // 1. Fondo Obsidiana Profundo con Gradiente Radial Sci-Fi
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#020612');
    bgGrad.addColorStop(0.5, '#051026');
    bgGrad.addColorStop(1, '#02040a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Aura central cian/violeta
    const glowGrad = ctx.createRadialGradient(540, 720, 60, 540, 720, 620);
    glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
    glowGrad.addColorStop(0.6, 'rgba(139, 92, 246, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Marco Táctico Exterior
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(64, 64, 952, 1792);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(84, 84, 912, 1752);

    // 3. Encabezado del Sistema
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SISTEMA DE EVOLUCIÓN PERSONAL // LA SOLUCIÓN', 540, 180);

    // Estrellas de Ascensión si existen
    const stars = payload.stats.ascensionTier || 0;
    if (stars > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`${'★'.repeat(Math.min(stars, 10))} ASCENSIÓN RANGO ${stars}`, 540, 245);
    }

    // 4. Emblema Central de Nivel
    ctx.beginPath();
    ctx.arc(540, 540, 170, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(3, 12, 28, 0.92)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#00f0ff';
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('NIVEL ALCANZADO', 540, 480);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 130px sans-serif';
    ctx.fillText(`${payload.stats.level || 1}`, 540, 600);

    // 5. Nombre del Jugador, Rango y Arquetipo
    const heroName = (payload.stats.username || payload.stats.fullName || 'OPERADOR TÁCTICO').toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText(heroName, 540, 820);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText((payload.stats.rankTitle || 'Chispazo de Voluntad').toUpperCase(), 540, 890);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '32px monospace';
    ctx.fillText(`Arquetipo: ${payload.archetypeName}`, 540, 950);

    // 6. Métricas de Racha y Cumplimiento
    const drawMetricBox = (x: number, y: number, w: number, h: number, label: string, value: string, color: string) => {
      ctx.fillStyle = 'rgba(4, 15, 35, 0.88)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(label, x + w / 2, y + 70);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(value, x + w / 2, y + 155);
    };

    drawMetricBox(130, 1060, 390, 220, 'RACHA ACTIVA', `🔥 ${payload.stats.streakDays || 0} DÍAS`, '#f59e0b');
    drawMetricBox(
      560,
      1060,
      390,
      220,
      payload.grade ? `RANGO JORNADA (${payload.grade})` : 'XP ACUMULADO',
      payload.completionRate !== undefined ? `${payload.completionRate}%` : `${payload.stats.totalXpEarned || 0} XP`,
      '#10b981'
    );

    // 7. Atributos del Jugador
    const attrs = payload.stats.attributes || { disciplina: 10, fuerza: 10, mente: 10, energia: 10, estudio: 10 };
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(
      `DIS ${attrs.disciplina}  •  FUE ${attrs.fuerza}  •  MEN ${attrs.mente}  •  ENE ${attrs.energia}`,
      540,
      1410
    );

    // 8. Pie de firma y Call-To-Action orgánico
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('CONSTRUYE HÁBITOS INQUEBRANTABLES EN 21/66 DÍAS', 540, 1640);

    ctx.fillStyle = '#64748b';
    ctx.font = '26px monospace';
    ctx.fillText(window.location.origin, 540, 1700);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
    if (!blob) return false;

    const file = new File([blob], `legado-la-solucion-nv${payload.stats.level}.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Nivel ${payload.stats.level} en La Solución`,
          text: `🔥 ${payload.stats.streakDays || 0} días de racha activa (${payload.stats.rankTitle}). Forjando disciplina diaria.`,
          files: [file],
        });
        return true;
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return true; // Graceful exit on user cancel
        }
        console.warn('[ShareCard] navigator.share error or canceled, falling back to download:', shareErr);
      }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = URL.createObjectURL(blob);

    if (isIOS) {
      showIOSShareCardModal(url, `legado-tactico-nv${payload.stats.level}.png`);
      return true;
    }

    // Fallback: Descarga directa de la tarjeta PNG
    const link = document.createElement('a');
    link.href = url;
    link.download = `legado-tactico-nv${payload.stats.level}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch (err) {
    console.warn('Share card generation cancelled or failed:', err);
    return false;
  } finally {
    // FORCED CLEANUP: Clear 2D context and reset canvas dimensions to 0 to immediately release GPU backing store
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  }
};
