import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Camera,
  Zap,
  Landmark,
  Check,
  Loader2,
  Share2,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { KAICompanion } from '../KAICompanion';
import { QuantumCubeLoader } from '../QuantumCubeLoader';
import { KAI_MULTIVERSE_STYLES } from '../../data/kaiShapes';
import { KAI_TEMPERAMENTS } from './workshopConstants';
import { soundFX } from '../../utils/audio';
import { triggerShockwave } from '../../utils/celebration';
import { forgeAllKaiVariantsFromImage } from '../../services/aiService';
import { KaiCustomForm, KaiTemperament } from '../../types';

interface WorkshopForgeTabProps {
  onEquipCustomForm: (targetForm: KaiCustomForm) => void;
  onSaveAllToVault: (variants: KaiCustomForm[]) => void;
  onShareTradingCard: (targetKai: KaiCustomForm, id?: string) => void;
  onSpeakQuote: (quote: string, mood?: KaiTemperament, id?: string) => void;
  speakingRelicId: string | null;
  isSharingCard: string | null;
}

export const WorkshopForgeTab: React.FC<WorkshopForgeTabProps> = ({
  onEquipCustomForm,
  onSaveAllToVault,
  onShareTradingCard,
  onSpeakQuote,
  speakingRelicId,
  isSharingCard,
}) => {
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [forgePrompt, setForgePrompt] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<KaiTemperament>('stoic');
  const [isForging, setIsForging] = useState(false);
  const [forgedResult, setForgedResult] = useState<KaiCustomForm | null>(null);
  const [forgedVariants, setForgedVariants] = useState<KaiCustomForm[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [saveAllFeedback, setSaveAllFeedback] = useState<boolean>(false);
  const [liveDetectedObject, setLiveDetectedObject] = useState<string | null>(null);
  const [forgeProgressText, setForgeProgressText] = useState<string>('');
  const [forgeError, setForgeError] = useState<string | null>(null);
  const [equippedFeedback, setEquippedFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          setCapturedImageBase64(compressed);
          setForgeError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRunNeuralForge = async () => {
    if (!capturedImageBase64) return;

    soundFX.playClick();
    setIsForging(true);
    setForgedVariants([]);
    setForgedResult(null);
    setSelectedVariantIndex(0);
    setLiveDetectedObject(null);
    setForgeError(null);
    setForgeProgressText('Paso 1: Analizando imagen con tu compañero KAI...');

    try {
      const variants = await forgeAllKaiVariantsFromImage({
        imageBase64: capturedImageBase64,
        promptDescription: forgePrompt.trim(),
        mood: selectedMood,
        onProgress: (info) => {
          if (info.detectedObject) {
            setLiveDetectedObject(info.detectedObject);
          }
          setForgeProgressText(
            info.completed > 0
              ? `Forjando 6 variantes del Multiverso: ${info.completed} de ${info.total} listas...`
              : info.detectedObject
              ? `🎯 Objeto: "${info.detectedObject}". Creando 6 estilos...`
              : 'Escaneando objeto con IA...'
          );
          if (info.variants && info.variants.length > 0) {
            setForgedVariants([...info.variants]);
            setForgedResult((prev) => prev || info.variants[0]);
          }
        },
      });

      if (variants && variants.length > 0) {
        soundFX.playFanfare();
        triggerShockwave({ color: 'violet', intensity: 'epic' });
        setForgedVariants(variants);
        setForgedResult(variants[0]);
        setSelectedVariantIndex(0);
        setLiveDetectedObject(variants[0].detectedObject || null);
      } else {
        setForgeError('No se pudo procesar la silueta. Intenta con un objeto con fondo más despejado.');
      }
    } catch (err: any) {
      console.error('[Forja Neural 6 Variantes] Error procesando:', err);
      setForgeError(err?.message || 'Error de conexión con el motor neural. Inténtalo de nuevo.');
    } finally {
      setIsForging(false);
    }
  };

  const handleSaveAllVariants = () => {
    if (!forgedVariants || forgedVariants.length === 0) return;
    soundFX.playFanfare();
    triggerShockwave({ color: 'gold', intensity: 'medium' });
    onSaveAllToVault(forgedVariants);
    setSaveAllFeedback(true);
    setTimeout(() => setSaveAllFeedback(false), 3500);
  };

  const handleEquip = (formToEquip: KaiCustomForm) => {
    onEquipCustomForm(formToEquip);
    setEquippedFeedback(true);
    setTimeout(() => setEquippedFeedback(false), 4500);
  };

  const activeVariant: KaiCustomForm | null =
    forgedVariants.length > 0
      ? forgedVariants[selectedVariantIndex] || forgedResult || forgedVariants[0]
      : null;

  const activeStyleDef = activeVariant?.artStyle
    ? KAI_MULTIVERSE_STYLES.find((s) => s.id === activeVariant.artStyle)
    : null;

  return (
    <div className="space-y-4">
      {/* 1. Encabezado Contextual de la Forja */}
      {forgedVariants.length > 0 ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/70 via-purple-950/50 to-cyan-950/70 border border-fuchsia-500/40 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_25px_rgba(217,70,239,0.2)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-0.5 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#040814] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-fuchsia-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-white tracking-wide">
                  {liveDetectedObject || activeVariant?.detectedObject
                    ? `🎯 Objeto: "${liveDetectedObject || activeVariant?.detectedObject}"`
                    : 'Multiverso Revelado'}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-400/50 px-2 py-0.5 rounded-full">
                  {forgedVariants.length} de 6 Estilos Disponibles
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Compara las 6 interpretaciones en paralelo. Toca cualquier estilo para verla en el pedestal o adoptarla.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAllVariants}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              title="Guardar las 6 variantes en tu Bóveda de Reliquias"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-300" />
              <span>Guardar las 6 en Bóveda</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCapturedImageBase64(null);
                setForgedVariants([]);
                setForgedResult(null);
                setSelectedVariantIndex(0);
                setLiveDetectedObject(null);
                setForgeError(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Forjar otro objeto</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-[#0a0f24] to-cyan-950/40 border border-fuchsia-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-white tracking-wide">
                  🌌 Forja Neural del Multiverso (6 Estilos en Paralelo)
                </span>
                <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-400/40 px-2 py-0.5 rounded-full font-bold">
                  1 Foto = 6 Opciones
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Toma una foto de cualquier objeto real. La IA sintetizará simultáneamente las 6 dimensiones estéticas canónicas para que elijas tu favorita.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast de Bóveda */}
      {saveAllFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-200 text-center font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
        >
          <Landmark className="w-4 h-4 text-amber-300" />
          <span>🎉 ¡Las {forgedVariants.length} variantes fueron guardadas con éxito en tu Bóveda de Reliquias!</span>
        </motion.div>
      )}

      {/* 2. Cuerpo Principal: Opciones Listas vs Captura */}
      {forgedVariants.length > 0 && activeVariant ? (
        /* ─── ESTADO: 6 VARIANTES GENERADAS (MULTIVERSE SELECTION STUDIO) ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Columna Izquierda: Galería Interactiva de las 6 Opciones */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>Galaxia de Variantes ({forgedVariants.length})</span>
              </span>
              <span className="text-[10px] font-mono text-fuchsia-300">
                Toca una para inspeccionar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {forgedVariants.map((variant, idx) => {
                const isSelected = selectedVariantIndex === idx;
                const styleDef = KAI_MULTIVERSE_STYLES.find((s) => s.id === variant.artStyle);
                const shortName = styleDef?.name.split('/')[0].trim() || variant.artStyle;
                const badgeLabel =
                  styleDef?.badge
                    .replace('VECTOR // ', '')
                    .replace('ILUSTRACIÓN ', '')
                    .replace('VECTOR ', '') || 'MULTIVERSO';

                return (
                  <div
                    key={variant.id || `${variant.artStyle}_${idx}`}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedVariantIndex(idx);
                      setForgedResult(variant);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-fuchsia-950/70 border-fuchsia-400/90 shadow-[0_0_20px_rgba(217,70,239,0.35)] ring-2 ring-fuchsia-400/80'
                        : 'bg-[#040814]/80 border-white/10 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    {/* Encabezado del Estilo */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1 truncate">
                        <span>{styleDef?.icon || '🎨'}</span>
                        <span className="truncate">{shortName}</span>
                      </span>
                      <span className="text-[8px] font-mono text-fuchsia-300 bg-fuchsia-950/80 px-1 py-0.5 rounded border border-fuchsia-500/30 whitespace-nowrap">
                        {badgeLabel}
                      </span>
                    </div>

                    {/* Mini Showcase Centrado */}
                    <div className="w-20 h-20 mx-auto my-1.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1 group-hover:scale-105 transition-transform overflow-hidden relative">
                      <div className="absolute inset-0 bg-radial from-fuchsia-500/10 via-transparent to-transparent pointer-events-none" />
                      <KAICompanion customForm={variant} shapeId="custom" size={72} />
                    </div>

                    {/* Nombre y Estado */}
                    <div className="space-y-1.5 mt-1">
                      <span className="text-[11px] font-bold text-white block truncate text-center">
                        {variant.name}
                      </span>
                      {isSelected ? (
                        <div className="w-full py-1 rounded-lg bg-fuchsia-600/40 border border-fuchsia-400/60 text-[9px] font-mono font-bold text-fuchsia-200 text-center flex items-center justify-center gap-1">
                          <Sparkles className="w-3 h-3 text-fuchsia-300" />
                          <span>En Pedestal</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFX.playClick();
                            setSelectedVariantIndex(idx);
                            setForgedResult(variant);
                          }}
                          className="w-full py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 text-[9px] font-mono font-medium transition-colors text-center"
                        >
                          Inspeccionar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Pedestal de Inspección & Adopción Hero */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-gradient-to-b from-[#040814] via-[#060c20] to-[#040814] border border-white/10 space-y-3 flex flex-col items-center justify-between relative overflow-hidden min-h-[380px]">
            {/* Luz de fondo sutil */}
            <div className="absolute inset-0 bg-radial from-fuchsia-600/15 via-transparent to-transparent pointer-events-none blur-xl" />

            {/* Header del Pedestal */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                <span className="truncate">{activeVariant.name}</span>
              </span>
              <span className="text-[9px] font-mono text-fuchsia-300 font-bold bg-fuchsia-950/80 border border-fuchsia-400/50 px-2 py-0.5 rounded-full shrink-0">
                {activeStyleDef?.name || activeVariant.artStyle}
              </span>
            </div>

            {/* Pedestal Holográfico con KAI */}
            <div className="w-52 h-52 relative flex items-center justify-center p-2 z-10 my-auto">
              <div className="absolute inset-0 rounded-full border border-fuchsia-500/20 animate-ping opacity-25" />
              <div className="absolute inset-2 rounded-full border border-dashed border-fuchsia-400/30 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-5 rounded-full border border-dotted border-cyan-400/30 animate-[spin_12s_linear_infinite_reverse]" />
              <div className="absolute bottom-1 w-32 h-4 bg-fuchsia-500/20 blur-md rounded-full pointer-events-none" />

              <motion.div
                key={`${activeVariant.artStyle}_${activeVariant.name}`}
                initial={{ scale: 0.85, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="relative z-10 w-48 h-48 flex items-center justify-center"
              >
                <KAICompanion customForm={activeVariant} shapeId="custom" size={185} />
              </motion.div>
            </div>

            {/* Cita y Acciones de Adopción */}
            <div className="w-full space-y-2.5 z-10">
              {/* Diálogo con Botón de Voz */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-fuchsia-500/30 flex items-center justify-between gap-2">
                <div className="flex-1 text-center min-w-0">
                  <span className="text-[10px] font-mono uppercase text-fuchsia-300 font-bold block mb-0.5 truncate">
                    💬 {activeVariant.name}:
                  </span>
                  <p className="text-xs text-white italic font-medium leading-relaxed line-clamp-2">
                    "{activeVariant.personalityQuote || '¡He despertado con forma y voluntad propia!'}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onSpeakQuote(
                      activeVariant.personalityQuote || '¡He despertado!',
                      activeVariant.mood,
                      'pedestal_active'
                    )
                  }
                  className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 hover:text-white transition-all shrink-0 cursor-pointer"
                  title="Escuchar voz de KAI"
                >
                  <Volume2
                    className={`w-4 h-4 ${
                      speakingRelicId === 'pedestal_active'
                        ? 'animate-bounce text-cyan-300'
                        : ''
                    }`}
                  />
                </button>
              </div>

              {/* Badges de ADN */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {activeVariant.detectedObject && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-medium">
                    🎯 {activeVariant.detectedObject}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-fuchsia-950/70 border border-fuchsia-400/40 text-[10px] font-mono text-fuchsia-200 uppercase font-medium">
                  {activeStyleDef?.icon || '🎨'} {activeVariant.artStyle}
                </span>
                {activeVariant.mood && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/70 border border-purple-400/40 text-[10px] font-mono text-purple-200 capitalize font-medium">
                    🛡️ {activeVariant.mood}
                  </span>
                )}
              </div>

              {/* Botones: Adoptar KAI & Carta Holográfica */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEquip(activeVariant)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Adoptar KAI!</span>
                </button>

                <button
                  type="button"
                  onClick={() => onShareTradingCard(activeVariant, 'pedestal_active')}
                  disabled={isSharingCard === 'pedestal_active'}
                  className="px-3.5 py-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-400/50 text-purple-200 text-xs font-anton tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Generar y compartir Carta Holográfica Coleccionable"
                >
                  {isSharingCard === 'pedestal_active' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                  ) : (
                    <Share2 className="w-4 h-4 text-purple-300" />
                  )}
                  <span className="hidden sm:inline">Carta</span>
                </button>
              </div>

              {/* Toast de Éxito al Equipar */}
              {equippedFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full p-2 rounded-xl bg-emerald-950/90 border border-emerald-400 text-center font-mono text-[11px] font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  🎉 ¡{activeVariant.name} ha sido equipado en toda la app!
                </motion.div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── ESTADO: CAPTURA & FORJA DE LAS 6 VARIANTES ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna Izquierda: Captura y Parámetros */}
          <div className="p-4 rounded-2xl bg-[#040814] border border-white/10 space-y-3.5 flex flex-col justify-between">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* 1. Zona de Imagen */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wide">
                1. Foto del Objeto
              </span>

              {capturedImageBase64 ? (
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative rounded-xl overflow-hidden border border-fuchsia-500/40 bg-black aspect-video flex items-center justify-center cursor-pointer group max-h-48"
                    title="Toca para cambiar la foto"
                  >
                    <img
                      src={capturedImageBase64}
                      alt="Captura"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-mono text-white transition-opacity gap-1.5">
                      <Camera className="w-4 h-4 text-fuchsia-400" />
                      <span>Cambiar foto</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-medium text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3 h-3 text-fuchsia-400" />
                      <span>Cambiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedImageBase64(null);
                        setForgedResult(null);
                        setForgedVariants([]);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-[10px] font-mono text-rose-300 transition-colors cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-fuchsia-500/30 hover:border-fuchsia-400/80 rounded-xl p-5 text-center cursor-pointer bg-fuchsia-950/10 hover:bg-fuchsia-950/20 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Tomar o subir foto
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Fotografía nítida de cualquier objeto para darle vida
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Selector de Temperamento */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  2. Temperamento de KAI
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  {KAI_TEMPERAMENTS.find((t) => t.id === selectedMood)?.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {KAI_TEMPERAMENTS.map((t) => {
                  const isSelected = selectedMood === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setSelectedMood(t.id);
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.3)] text-white'
                          : 'bg-black/40 border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs">{t.icon}</span>
                      <span className="text-[10px] font-bold truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Input Limpio de Detalle o Rasgo Especial */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>3. Detalle o Rasgo Especial</span>
                <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
              </label>
              <input
                type="text"
                value={forgePrompt}
                onChange={(e) => setForgePrompt(e.target.value)}
                placeholder="Ej: Con cuernos de fuego, con bufanda ninja, lentes oscuros..."
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400/80 transition-colors"
              />
            </div>

            {forgeError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="text-[11px]">{forgeError}</span>
              </div>
            )}

            {/* Botón Principal: Forjar las 6 Variantes */}
            <button
              type="button"
              onClick={handleRunNeuralForge}
              disabled={!capturedImageBase64 || isForging}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 hover:opacity-95 disabled:opacity-30 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(217,70,239,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isForging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="truncate">
                    {forgeProgressText || 'Materializando con IA...'}
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>✨ Dar Vida: Forjar las 6 Variantes</span>
                </>
              )}
            </button>
          </div>

          {/* Columna Derecha: Escenario Holográfico o Previsualización */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#040814] via-[#060c20] to-[#040814] border border-white/10 space-y-3 flex flex-col items-center justify-between relative overflow-hidden min-h-[300px]">
            {/* Luz de fondo sutil */}
            <div className="absolute inset-0 bg-radial from-fuchsia-600/10 via-transparent to-transparent pointer-events-none blur-xl" />

            {/* Header de la columna derecha */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-fuchsia-400" />
                <span>Pedestal Multiverso</span>
              </span>
              {isForging ? (
                <span className="text-[9px] font-mono text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded-full animate-pulse">
                  ⚡ Forjando 6 Estilos...
                </span>
              ) : null}
            </div>

            {/* Pedestal Holográfico Central */}
            <div className="w-48 h-48 relative flex items-center justify-center p-2 z-10 my-auto">
              <div className="absolute inset-0 rounded-full border border-fuchsia-500/20 animate-ping opacity-25" />
              <div className="absolute inset-2 rounded-full border border-dashed border-fuchsia-400/30 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-5 rounded-full border border-dotted border-cyan-400/30 animate-[spin_12s_linear_infinite_reverse]" />
              <div className="absolute bottom-1 w-28 h-4 bg-fuchsia-500/15 blur-md rounded-full pointer-events-none" />

              {isForging ? (
                <div className="text-center p-3 text-cyan-300 space-y-3 z-10 animate-pulse flex flex-col items-center">
                  <div className="py-1">
                    <QuantumCubeLoader size="sm" speed="slow" showLabel={false} />
                  </div>
                  <div className="space-y-0.5 max-w-[200px]">
                    <span className="text-xs font-bold text-white block truncate">
                      {liveDetectedObject ? `🎯 "${liveDetectedObject}"` : 'Escaneando objeto...'}
                    </span>
                    <span className="text-[10px] text-cyan-300/80 font-mono block leading-tight">
                      {forgeProgressText || 'Materializando 6 dimensiones'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 text-slate-500 space-y-2 z-10">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-fuchsia-950/30 border border-fuchsia-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-fuchsia-400/70" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 block">
                    Cámara Multiversal Lista
                  </span>
                  <span className="text-[10px] text-slate-400 block max-w-[190px] mx-auto leading-relaxed">
                    Sube tu foto para crear simultáneamente los 6 estilos canónicos
                  </span>
                </div>
              )}
            </div>

            {/* Muestra de los 6 Estilos Canónicos que se Forjarán */}
            <div className="w-full space-y-1.5 z-10">
              <span className="text-[9px] font-mono uppercase text-slate-400 block text-center tracking-wider">
                Estilos del Multiverso a generar:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {KAI_MULTIVERSE_STYLES.map((st) => (
                  <div
                    key={st.id}
                    className="p-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-1.5"
                  >
                    <span className="text-xs shrink-0">{st.icon}</span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-300 block truncate">
                        {st.name.split('/')[0].trim()}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 block truncate">
                        {st.badge.replace('VECTOR // ', '').replace('ILUSTRACIÓN ', '')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
