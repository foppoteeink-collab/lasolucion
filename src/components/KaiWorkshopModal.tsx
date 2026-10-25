import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Check, 
  Crown, 
  Camera, 
  Upload, 
  Zap, 
  Layers, 
  Shield, 
  Palette, 
  RotateCcw,
  Flame,
  Award,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { KAI_OFFICIAL_SHAPES, KAI_AURAS_REGISTRY, KaiShapeDefinition } from '../data/kaiShapes';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { KaiShapeKey, KaiCustomForm } from '../types';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { forgeKaiFromImage } from '../services/aiService';

interface KaiWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop?: () => void;
}

type WorkshopTab = 'shapes' | 'evolution' | 'forge' | 'armory';

export const KaiWorkshopModal: React.FC<KaiWorkshopModalProps> = ({
  isOpen,
  onClose,
  onOpenShop,
}) => {
  const { stats, setStats } = usePlayerStore();
  const habitMastery = useAppStore((state) => state.habitMastery);

  const [activeTab, setActiveTab] = useState<WorkshopTab>('shapes');

  // Neural Forge States
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [forgePrompt, setForgePrompt] = useState<string>('');
  const [isForging, setIsForging] = useState(false);
  const [forgedResult, setForgedResult] = useState<KaiCustomForm | null>(null);
  const [forgeError, setForgeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progresión de Hábitos 21d / 66d
  const habits21Count = useMemo(() => {
    const list = Object.values(habitMastery || {});
    const count = list.filter((h) => h.isMaltzReached || (h.currentStreak || 0) >= 21).length;
    return count > 0 ? count : ((stats.streakDays || 0) >= 21 ? 1 : 0);
  }, [habitMastery, stats.streakDays]);

  const habits66Count = useMemo(() => {
    const list = Object.values(habitMastery || {});
    const count = list.filter((h) => h.isMastered || (h.currentStreak || 0) >= 66).length;
    return count > 0 ? count : ((stats.streakDays || 0) >= 66 ? 1 : 0);
  }, [habitMastery, stats.streakDays]);

  const has21Days = habits21Count >= 1;
  const has66Days = habits66Count >= 1;
  const ascensionGrade = habits66Count; // Grado I, II, III...
  const ascensionCrystals = Math.max(0, habits66Count - 1);

  // Cargas de Forja (Garantizar al menos 1 carga de prueba desbloqueada)
  const forgeCharges = stats.kaiNeuralForgeCharges ?? 1;

  if (!isOpen) return null;

  const handleSelectShape = (shapeId: KaiShapeKey) => {
    soundFX.playItemEquip();
    triggerShockwave({ color: 'cyan', intensity: 'subtle' });
    setStats((prev) => ({
      ...prev,
      kaiShape: shapeId,
    }));
  };

  const handleSelectAura = (color: string) => {
    soundFX.playClick();
    setStats((prev) => ({
      ...prev,
      kaiAuraColor: color,
    }));
  };

  const handleSelectParticle = (particle: string) => {
    soundFX.playItemEquip();
    setStats((prev) => ({
      ...prev,
      kaiParticleEffect: particle,
    }));
  };

  // Procesamiento de imagen en cliente (compresión canvas)
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
  };

  const handleRunNeuralForge = async () => {
    if (!capturedImageBase64) return;
    if (forgeCharges <= 0) {
      setForgeError('No tienes cargas de Forja Neural. Adquiere un Núcleo en la Tienda o conquista un nuevo hábito de 66 días.');
      return;
    }

    soundFX.playClick();
    setIsForging(true);
    setForgeError(null);

    try {
      const customForm = await forgeKaiFromImage({
        imageBase64: capturedImageBase64,
        promptDescription: forgePrompt.trim(),
      });

      if (customForm) {
        soundFX.playLevelUp();
        triggerShockwave({ color: 'violet', intensity: 'epic' });
        setForgedResult(customForm);

        // Descontar carga y registrar forma
        setStats((prev) => ({
          ...prev,
          kaiNeuralForgeCharges: Math.max(0, (prev.kaiNeuralForgeCharges ?? 1) - 1),
        }));
      } else {
        setForgeError('No se pudo procesar la silueta. Intenta con un objeto con fondo más despejado.');
      }
    } catch (err: any) {
      setForgeError('Error de conexión con el motor neural. Inténtalo de nuevo.');
    } finally {
      setIsForging(false);
    }
  };

  const handleEquipCustomForm = () => {
    if (!forgedResult) return;
    soundFX.playItemEquip();
    triggerShockwave({ color: 'gold', intensity: 'epic' });
    setStats((prev) => ({
      ...prev,
      kaiCustomForm: forgedResult,
      kaiShape: 'custom',
    }));
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#030712] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden text-white">
        
        {/* ─── ENCABEZADO CYBERNETIC ─── */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#030712] via-[#061326] to-[#030712]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Taller Cuántico de KAI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {stats.kaiShape === 'custom' ? 'FORJA IA ACTIVA' : '6 FORMAS DÍA 0'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personaliza la forma, auras elementales y accesorios holográficos de tu compañero.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── BARRA DE PESTAÑAS ─── */}
        <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto scrollbar-none px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('shapes'); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shapes'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Formas Base (6)</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('evolution'); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'evolution'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Evolución (21d / 66d)</span>
            {has66Days && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/30 text-amber-200 border border-amber-400/50">
                Grado {ascensionGrade}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('forge'); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'forge'
                ? 'border-fuchsia-400 text-fuchsia-300 bg-fuchsia-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-fuchsia-400 animate-pulse" />
            <span>📸 Forja Neural (IA)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/50">
              {forgeCharges} Carga{forgeCharges !== 1 ? 's' : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('armory'); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'armory'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Armería & Efectos</span>
          </button>
        </div>

        {/* ─── CONTENIDO DE PESTAÑAS ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-800">
          
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: LAS 6 FORMAS BASE (DÍA 0) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'shapes' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-2xl bg-[#001020] border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚡</span>
                  <div>
                    <span className="text-xs font-black uppercase text-cyan-300 block tracking-wide">
                      6 Arquetipos Oficiales en Día 0
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Elige con qué espíritu resonar desde hoy. Todas las formas conservan tus auras de 21d y coronas de 66d ganadas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid 3x2 de Formas Oficiales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {KAI_OFFICIAL_SHAPES.map((shape) => {
                  const isSelected = stats.kaiShape === shape.id;
                  return (
                    <div
                      key={shape.id}
                      onClick={() => handleSelectShape(shape.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/60'
                          : 'bg-[#040814] border-white/10 hover:border-cyan-500/40 hover:bg-[#061022]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-16 h-16 shrink-0 relative flex items-center justify-center bg-black/50 rounded-xl border border-white/5 p-1">
                          <KaiVectorGraphics
                            shapeId={shape.id}
                            activeColor={isSelected ? '#00f0ff' : '#94a3b8'}
                            secondaryColor="#0284c7"
                            glowFilterId={`preview-${shape.id}`}
                            has21Days={has21Days}
                            has66Days={has66Days}
                            ascensionCrystalsCount={ascensionCrystals}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{shape.icon}</span>
                            <h4 className="text-sm font-bold text-white truncate">{shape.name}</h4>
                          </div>
                          <span className="text-[9px] font-mono text-cyan-300 font-bold block mt-0.5">
                            {shape.codename}
                          </span>
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300">
                            {shape.themeTrait}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed mb-3 line-clamp-2">
                        {shape.description}
                      </p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          Afinidad: <strong className="text-white">{shape.archetypeMatch.split('/')[0]}</strong>
                        </span>

                        {isSelected ? (
                          <span className="text-[10px] font-mono font-black text-cyan-300 bg-cyan-900/60 border border-cyan-400 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3 text-cyan-300" />
                            Equipado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectShape(shape.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-cyan-500 hover:text-black font-mono text-[10px] font-bold text-slate-200 transition-all cursor-pointer"
                          >
                            Equipar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Tarjeta de Forma Forjada por IA (Si existe) */}
                {stats.kaiCustomForm && (
                  <div
                    onClick={() => handleSelectShape('custom')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                      stats.kaiShape === 'custom'
                        ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)] ring-1 ring-fuchsia-400/60'
                        : 'bg-[#040814] border-fuchsia-500/30 hover:border-fuchsia-500/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-16 h-16 shrink-0 relative flex items-center justify-center bg-black/50 rounded-xl border border-fuchsia-500/30 p-1">
                        <KaiVectorGraphics
                          shapeId="custom"
                          activeColor="#e879f9"
                          secondaryColor="#a21caf"
                          glowFilterId="preview-custom"
                          has21Days={has21Days}
                          has66Days={has66Days}
                          ascensionCrystalsCount={ascensionCrystals}
                          customForm={stats.kaiCustomForm}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">✨</span>
                          <h4 className="text-sm font-bold text-fuchsia-200 truncate">{stats.kaiCustomForm.name}</h4>
                        </div>
                        <span className="text-[9px] font-mono text-fuchsia-400 font-bold block mt-0.5">
                          FORJA NEURAL IA
                        </span>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                          {stats.kaiCustomForm.lines.length} trazos vectoriales
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                      Compañero único vectorizado por Gemini a partir de tu fotografía personal.
                    </p>

                    <div className="pt-2 border-t border-fuchsia-500/20 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-fuchsia-300">
                        Creación Personal
                      </span>

                      {stats.kaiShape === 'custom' ? (
                        <span className="text-[10px] font-mono font-black text-fuchsia-300 bg-fuchsia-900/60 border border-fuchsia-400 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <Check className="w-3 h-3 text-fuchsia-300" />
                          Equipado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectShape('custom');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500 hover:text-black font-mono text-[10px] font-bold text-fuchsia-200 transition-all cursor-pointer border border-fuchsia-500/40"
                        >
                          Equipar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: PROGRESIÓN ACUMULATIVA (21d / 66d & ASCENSIÓN) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'evolution' && (
            <div className="space-y-6">
              {/* Resumen de Ascensión */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#0a0f24] to-[#030712] border border-amber-500/40 shadow-[0_0_25px_rgba(251,191,36,0.15)] flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 shrink-0 relative flex items-center justify-center bg-black/60 rounded-2xl border border-amber-500/40 p-1">
                    <KaiVectorGraphics
                      shapeId={stats.kaiShape || 'prism'}
                      activeColor={has66Days ? '#fbbf24' : '#00f0ff'}
                      secondaryColor="#0284c7"
                      glowFilterId="ascension-hero"
                      has21Days={has21Days}
                      has66Days={has66Days}
                      ascensionCrystalsCount={ascensionCrystals}
                      customForm={stats.kaiCustomForm}
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                      Estado de Ascensión Cuántica
                    </span>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>KAI {has66Days ? `Ascensión Grado ${ascensionGrade}` : (has21Days ? 'Guardián de Neuroplasticidad' : 'Forma Esencial')}</span>
                      {has66Days && <Crown className="w-4 h-4 text-amber-400" />}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      {has66Days
                        ? `Posees ${habits66Count} hábito(s) con automatización basal completa de 66 días. Cada nuevo hábito agrega un Cristal Orbital y sube tu Grado de Ascensión.`
                        : has21Days
                        ? 'Has quebrado la barrera de inercia de 21 días. El Anillo Orbital y las Auras Elementales están activos.'
                        : 'Cumple tu primer hábito durante 21 días consecutivos para despertar el Aura Elemental de KAI.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center p-3 rounded-2xl bg-black/50 border border-white/10 min-w-[90px]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">21 Días</span>
                    <span className="text-xl font-black text-purple-300 font-mono">{habits21Count}</span>
                    <span className="text-[9px] text-slate-400 block">Hábitos</span>
                  </div>

                  <div className="text-center p-3 rounded-2xl bg-black/50 border border-amber-500/40 min-w-[90px]">
                    <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">66 Días</span>
                    <span className="text-xl font-black text-amber-300 font-mono">{habits66Count}</span>
                    <span className="text-[9px] text-amber-400/80 block">Maestrías</span>
                  </div>
                </div>
              </div>

              {/* Selector de Auras Elementales Desbloqueadas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>Auras Elementales Desbloqueadas por Hábitos</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {KAI_AURAS_REGISTRY.filter(a => a.requiredStreak === 0 || (a.requiredStreak === 21 && has21Days) || (a.requiredStreak === 66 && has66Days)).length} de {KAI_AURAS_REGISTRY.length} Desbloqueadas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {KAI_AURAS_REGISTRY.map((aura) => {
                    const isUnlocked = aura.requiredStreak === 0 || (aura.requiredStreak === 21 && has21Days) || (aura.requiredStreak === 66 && has66Days);
                    const isEquipped = stats.kaiAuraColor === aura.color;

                    return (
                      <div
                        key={aura.id}
                        onClick={() => { if (isUnlocked) handleSelectAura(aura.color); }}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isUnlocked
                            ? 'bg-[#040814] border-white/10 hover:border-white/30 cursor-pointer'
                            : 'bg-black/30 border-white/5 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full shrink-0 shadow-md border flex items-center justify-center"
                            style={{
                              backgroundColor: `${aura.color}25`,
                              borderColor: aura.color,
                              boxShadow: `0 0 10px ${aura.glow}`,
                            }}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: aura.color }} />
                          </div>

                          <div>
                            <span className="text-xs font-bold text-white block">{aura.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {aura.requiredStreak === 0
                                ? 'Disponible Día 0'
                                : aura.requiredStreak === 21
                                ? 'Requiere Hábito 21d'
                                : 'Requiere Hábito 66d'}
                            </span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          isEquipped ? (
                            <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                              Activa
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleSelectAura(aura.color); }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-slate-200"
                            >
                              Aplicar
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">🔒 Bloqueada</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: 📸 FORJA NEURAL POR FOTO (IA MULTIMODAL) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'forge' && (
            <div className="space-y-6">
              {/* Explicación de la innovación */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-fuchsia-950/40 via-[#0a0518] to-[#030712] border border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                      <Camera className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                      Forja Neural IA // Convierte Fotos en Compañeros Neón
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Toma una foto de cualquier objeto real (unos auriculares, una pesa, tu perro, una taza, una guitarra) o descríbelo. 
                    El motor neural de Gemini extraerá su silueta y la transformará en una figura poligonal simétrica estilo <strong>Cyber-Wireframe</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-fuchsia-500/40 text-center shrink-0 min-w-[140px]">
                  <span className="text-[10px] font-mono text-fuchsia-300 font-bold uppercase block">
                    Cargas Disponibles
                  </span>
                  <span className="text-2xl font-black text-fuchsia-200 font-mono">
                    {forgeCharges}
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-mono mt-0.5">
                    ✓ 1 Uso de prueba activo
                  </span>
                </div>
              </div>

              {/* Selector de Entrada (Cámara o Archivo) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Panel Izquierdo: Captura de Imagen */}
                <div className="p-5 rounded-2xl bg-[#040814] border border-white/10 space-y-4 flex flex-col justify-between">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div>
                    <span className="text-xs font-bold uppercase text-slate-300 block mb-2 tracking-wide">
                      1. Captura o sube la imagen
                    </span>

                    {capturedImageBase64 ? (
                      <div className="relative rounded-xl overflow-hidden border border-fuchsia-500/40 bg-black aspect-video flex items-center justify-center">
                        <img src={capturedImageBase64} alt="Captura" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => { setCapturedImageBase64(null); setForgedResult(null); }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-white hover:bg-rose-950 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-fuchsia-500/30 hover:border-fuchsia-400 rounded-xl p-8 text-center cursor-pointer bg-fuchsia-950/10 hover:bg-fuchsia-950/20 transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <Camera className="w-8 h-8 text-fuchsia-400 animate-bounce" />
                        <span className="text-xs font-bold text-fuchsia-200">
                          Toca aquí para Tomar Foto o Subir Archivo
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (La imagen se comprime en tu teléfono al instante)
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Contexto o Nombre Opcional (Ayuda a la IA):
                    </label>
                    <input
                      type="text"
                      value={forgePrompt}
                      onChange={(e) => setForgePrompt(e.target.value)}
                      placeholder="Ej. Mis auriculares Sony de estudio, mi gato negro..."
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400"
                    />
                  </div>

                  {forgeError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{forgeError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRunNeuralForge}
                    disabled={!capturedImageBase64 || isForging}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:opacity-90 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isForging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Vectorizando en el Motor Neural...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Forjar KAI con IA (Consumir 1 Carga)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Panel Derecho: Previsualización Vectorial Holográfica */}
                <div className="p-5 rounded-2xl bg-[#040814] border border-white/10 space-y-4 flex flex-col items-center justify-between">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-300 tracking-wide">
                      2. Resultado Holográfico
                    </span>
                    {forgedResult && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                        ✓ Vectorización Lista
                      </span>
                    )}
                  </div>

                  <div className="w-48 h-48 relative flex items-center justify-center bg-black/70 rounded-2xl border border-white/10 p-2 shadow-[inset_0_0_20px_rgba(217,70,239,0.1)]">
                    {forgedResult ? (
                      <KaiVectorGraphics
                        shapeId="custom"
                        activeColor="#e879f9"
                        secondaryColor="#a21caf"
                        glowFilterId="forge-result"
                        has21Days={has21Days}
                        has66Days={has66Days}
                        ascensionCrystalsCount={ascensionCrystals}
                        customForm={forgedResult}
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500 space-y-2">
                        <Sparkles className="w-8 h-8 mx-auto opacity-30 text-fuchsia-400" />
                        <span className="text-[11px] block">
                          Sube una imagen y toca "Forjar" para ver nacer a tu KAI personalizado.
                        </span>
                      </div>
                    )}
                  </div>

                  {forgedResult && (
                    <div className="w-full text-center space-y-1">
                      <h4 className="text-sm font-bold text-white">{forgedResult.name}</h4>
                      <p className="text-[10px] font-mono text-fuchsia-300">
                        {forgedResult.lines.length} trazos geométricos simétricos • Peso: 1.8 KB
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleEquipCustomForm}
                    disabled={!forgedResult}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Guardar y Equipar como Mi KAI Activo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 4: ARMERÍA & ACCESORIOS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'armory' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#001020] border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-cyan-300" />
                  <div>
                    <span className="text-xs font-black uppercase text-cyan-300 block tracking-wide">
                      Efectos de Partículas & Cosméticos de KAI
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Equipa efectos de fondo holográficos. Puedes adquirir nuevos módulos con las Monedas del juego en la Tienda.
                    </p>
                  </div>
                </div>

                {onOpenShop && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenShop(); }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 hover:text-black border border-cyan-400 text-cyan-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Ir a la Tienda
                  </button>
                )}
              </div>

              {/* Grid de Efectos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'none', name: 'Sin Efecto', icon: '⚪', desc: 'Presencia holográfica pura y minimalista.' },
                  { id: 'wings', name: 'Alas Tácticas', icon: '🪽', desc: 'Alas cibernéticas angulares en ambos lados.' },
                  { id: 'solar', name: 'Llamarada Solar', icon: '☀️', desc: 'Anillo coronal radiante en rotación lenta.' },
                  { id: 'matrix', name: 'Código Matrix', icon: '🟩', desc: 'Lluvia digital sutil de datos binarios.' },
                  { id: 'quantum_pulse', name: 'Pulso Cuántico', icon: '🌊', desc: 'Ondas armónicas continuas expansivas.' },
                ].map((item) => {
                  const isEquipped = (stats.kaiParticleEffect || 'none') === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectParticle(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-[#040814] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <span className="text-2xl block mb-2">{item.icon}</span>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                        {isEquipped ? (
                          <span className="text-[9px] font-mono text-purple-300 font-bold bg-purple-900/60 border border-purple-400/50 px-2 py-0.5 rounded">
                            Equipado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectParticle(item.id); }}
                            className="text-[9px] font-mono text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/10"
                          >
                            Equipar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ─── PIE DEL MODAL ─── */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>KAI Activo: <strong className="text-cyan-300 uppercase">{stats.kaiShape === 'custom' ? (stats.kaiCustomForm?.name || 'Forja Neural') : (KAI_OFFICIAL_SHAPES.find(s => s.id === stats.kaiShape)?.name || 'El Prisma')}</strong></span>
            {has66Days && (
              <span className="text-amber-300 font-bold">• Corona de Maestría Activa</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default KaiWorkshopModal;
