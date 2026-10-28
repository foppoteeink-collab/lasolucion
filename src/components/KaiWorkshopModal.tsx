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
  Loader2,
  Landmark,
  Trash2,
  Link
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { KAI_OFFICIAL_SHAPES, KAI_AURAS_REGISTRY, KAI_MULTIVERSE_STYLES, KaiShapeDefinition } from '../data/kaiShapes';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { KAICompanion } from './KAICompanion';
import { KaiShapeKey, KaiCustomForm, KaiMultiverseStyle, KaiTemperament } from '../types';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { forgeKaiFromImage } from '../services/aiService';

export const KAI_TEMPERAMENTS = [
  {
    id: 'stoic' as KaiTemperament,
    label: 'Estoico',
    fullName: 'Estoico / Firme',
    icon: '🛡️',
    description: 'Mirada seria, ceño de guerrero y boca recta determinada. Sin sonrisas tontas.',
  },
  {
    id: 'mischievous' as KaiTemperament,
    label: 'Pícaro',
    fullName: 'Pícaro / Astuto',
    icon: '😼',
    description: 'Media sonrisa ladeada, mirada de reojo y actitud desafiante.',
  },
  {
    id: 'fierce' as KaiTemperament,
    label: 'Feroz',
    fullName: 'Feroz / Táctico',
    icon: '⚡',
    description: 'Mirada afilada e intensa, visor de combate y postura de batalla.',
  },
  {
    id: 'mystic' as KaiTemperament,
    label: 'Místico',
    fullName: 'Místico / Sabio',
    icon: '🧘',
    description: 'Ojos serenos semi-cerrados, calma zen y sabiduría cósmica.',
  },
  {
    id: 'cheerful' as KaiTemperament,
    label: 'Alegre',
    fullName: 'Alegre / Radiante',
    icon: '🌟',
    description: 'Sonrisa vivaz y ojos brillantes llenos de entusiasmo.',
  },
  {
    id: 'zen' as KaiTemperament,
    label: 'Dormilón',
    fullName: 'Zen / Dormilón',
    icon: '🥱',
    description: 'Párpados pesados, actitud lánguida y pacífica.',
  },
];

interface KaiWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop?: () => void;
}

type WorkshopTab = 'forge' | 'vault' | 'shapes' | 'evolution' | 'armory';

const renderStyleMiniPreview = (styleId: KaiMultiverseStyle) => {
  switch (styleId) {
    case 'pixar':
      return (
        <svg viewBox="0 0 50 50" className="w-10 h-10 drop-shadow-[0_2px_6px_rgba(249,115,22,0.5)]">
          <defs>
            <radialGradient id="mini-pixar-body" cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </radialGradient>
            <radialGradient id="mini-pixar-eye-l" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0369a1" />
            </radialGradient>
          </defs>
          {/* Body - smooth rounded 3D sphere shape */}
          <ellipse cx="25" cy="30" rx="17" ry="14" fill="url(#mini-pixar-body)" />
          {/* Head / face area */}
          <circle cx="25" cy="18" r="11" fill="url(#mini-pixar-body)" />
          {/* Eyes - large expressive Pixar style */}
          <circle cx="20" cy="16" r="4.5" fill="white" />
          <circle cx="30" cy="16" r="4.5" fill="white" />
          <circle cx="20" cy="17" r="2.8" fill="url(#mini-pixar-eye-l)" />
          <circle cx="30" cy="17" r="2.8" fill="#0369a1" />
          <circle cx="20" cy="17" r="1.4" fill="#0f172a" />
          <circle cx="30" cy="17" r="1.4" fill="#0f172a" />
          {/* Catchlights */}
          <circle cx="21.5" cy="15.5" r="0.9" fill="white" />
          <circle cx="31.5" cy="15.5" r="0.9" fill="white" />
          {/* Smile */}
          <path d="M20,23 Q25,27 30,23" fill="none" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'cartoon':
      return (
        <svg viewBox="0 0 50 50" className="w-10 h-10 drop-shadow-[0_2px_6px_rgba(239,68,68,0.5)]">
          {/* Cartoon Network style - thick outlines, flat color, geometric */}
          <circle cx="25" cy="18" r="12" fill="#facc15" stroke="#050505" strokeWidth="3" />
          <rect x="10" y="28" width="30" height="16" rx="3" fill="#ef4444" stroke="#050505" strokeWidth="3" />
          {/* Big cartoon eyes */}
          <circle cx="20" cy="16" r="5" fill="white" stroke="#050505" strokeWidth="2.5" />
          <circle cx="30" cy="16" r="5" fill="white" stroke="#050505" strokeWidth="2.5" />
          <circle cx="20" cy="17" r="2.5" fill="#050505" />
          <circle cx="30" cy="17" r="2.5" fill="#050505" />
          <circle cx="21" cy="15.5" r="1" fill="white" />
          <circle cx="31" cy="15.5" r="1" fill="white" />
          {/* Thick eyebrows floating */}
          <rect x="15" y="8" width="7" height="3" rx="1.5" fill="#050505" transform="rotate(-8,18.5,9.5)" />
          <rect x="28" y="8" width="7" height="3" rx="1.5" fill="#050505" transform="rotate(8,31.5,9.5)" />
          {/* Big grin */}
          <path d="M18,22 Q25,28 32,22" fill="#050505" stroke="#050505" strokeWidth="0.5" />
        </svg>
      );

    case 'anime':
      return (
        <svg viewBox="0 0 50 50" className="w-10 h-10 drop-shadow-[0_2px_6px_rgba(99,102,241,0.6)]">
          <defs>
            <linearGradient id="mini-anime-eye" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#3730a3" />
            </linearGradient>
          </defs>
          {/* Face */}
          <ellipse cx="25" cy="22" rx="13" ry="14" fill="#fde8d8" stroke="#111827" strokeWidth="1.8" />
          {/* Spiky hair */}
          <polygon points="14,14 12,4 18,12" fill="#4f46e5" stroke="#111827" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points="19,11 18,2 24,11" fill="#4f46e5" stroke="#111827" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points="24,11 25,2 30,11" fill="#4f46e5" stroke="#111827" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points="29,12 34,3 36,13" fill="#4f46e5" stroke="#111827" strokeWidth="1.2" strokeLinejoin="round" />
          {/* Anime eyes - tall almond shape with gradient */}
          <ellipse cx="19" cy="21" rx="4" ry="5.5" fill="url(#mini-anime-eye)" stroke="#111827" strokeWidth="1.8" />
          <ellipse cx="31" cy="21" rx="4" ry="5.5" fill="url(#mini-anime-eye)" stroke="#111827" strokeWidth="1.8" />
          <ellipse cx="19" cy="21" rx="2" ry="2.8" fill="#1e1b4b" />
          <ellipse cx="31" cy="21" rx="2" ry="2.8" fill="#1e1b4b" />
          <circle cx="17.5" cy="18.5" r="1.2" fill="white" opacity="0.9" />
          <circle cx="29.5" cy="18.5" r="1.2" fill="white" opacity="0.9" />
          {/* Mouth */}
          <path d="M22,29 Q25,32 28,29" fill="none" stroke="#c2410c" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'pop':
      return (
        <svg viewBox="0 0 50 50" className="w-10 h-10 drop-shadow-[0_2px_6px_rgba(236,72,153,0.5)]">
          <defs>
            <radialGradient id="mini-pop-head" cx="35%" cy="25%" r="65%">
              <stop offset="0%" stopColor="#f9a8d4" />
              <stop offset="100%" stopColor="#db2777" />
            </radialGradient>
          </defs>
          {/* Funko-style big head */}
          <circle cx="25" cy="17" r="14" fill="url(#mini-pop-head)" />
          {/* Vinyl shine highlight */}
          <ellipse cx="20" cy="11" rx="5" ry="3" fill="white" opacity="0.5" transform="rotate(-20,20,11)" />
          {/* Small compact body */}
          <rect x="15" y="29" width="20" height="15" rx="4" fill="#db2777" />
          {/* Iconic button eyes */}
          <circle cx="19.5" cy="16" r="3.5" fill="#0f172a" />
          <circle cx="30.5" cy="16" r="3.5" fill="#0f172a" />
          <circle cx="18.5" cy="14.5" r="1.2" fill="white" opacity="0.8" />
          <circle cx="29.5" cy="14.5" r="1.2" fill="white" opacity="0.8" />
          {/* Simple smile */}
          <path d="M20,22 Q25,25.5 30,22" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'doodle':
      return (
        <svg viewBox="0 0 50 50" className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {/* Organic doodle face - hand-drawn feel */}
          <ellipse cx="25" cy="23" rx="14" ry="16" fill="none" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Cross-hatching shadow lines */}
          <line x1="13" y1="26" x2="37" y2="30" stroke="#0f172a" strokeWidth="0.8" opacity="0.4" />
          <line x1="13" y1="29" x2="37" y2="33" stroke="#0f172a" strokeWidth="0.8" opacity="0.4" />
          <line x1="13" y1="32" x2="30" y2="36" stroke="#0f172a" strokeWidth="0.8" opacity="0.4" />
          {/* Doodle eyes */}
          <circle cx="19" cy="20" r="4" fill="white" stroke="#0f172a" strokeWidth="2.2" />
          <circle cx="31" cy="20" r="4" fill="white" stroke="#0f172a" strokeWidth="2.2" />
          <circle cx="19" cy="21" r="2" fill="#0f172a" />
          <circle cx="31" cy="21" r="2" fill="#0f172a" />
          {/* Doodle smile */}
          <path d="M19,29 Q25,34 31,29" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
          {/* Posca color accent touches */}
          <circle cx="19" cy="20" r="1.5" fill="#f59e0b" opacity="0.7" />
          <circle cx="31" cy="20" r="1.5" fill="#f59e0b" opacity="0.7" />
          {/* Doodle stars orbiting */}
          <path d="M6,10 L7,8 L8,10 L6,9 L8,9Z" fill="#0f172a" />
          <path d="M42,14 L43,12 L44,14 L42,13 L44,13Z" fill="#0f172a" />
          <path d="M40,38 L41,36 L42,38 L40,37 L42,37Z" fill="#0f172a" />
        </svg>
      );

    case 'clay3d':
    default:
      return (
        <svg viewBox="0 0 50 50" className="w-10 h-10 drop-shadow-[0_2px_6px_rgba(249,115,22,0.4)]">
          <defs>
            <radialGradient id="mini-clay-body" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>
            <radialGradient id="mini-clay-eye-l" cx="30%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </radialGradient>
          </defs>
          {/* Clay body - soft rounded edges like real clay */}
          <circle cx="25" cy="22" r="15" fill="url(#mini-clay-body)" />
          {/* Clay highlight - matte shine */}
          <ellipse cx="19" cy="14" rx="6" ry="4" fill="white" opacity="0.22" transform="rotate(-15,19,14)" />
          {/* Clay ball eyes */}
          <circle cx="19" cy="19" r="5" fill="url(#mini-clay-eye-l)" />
          <circle cx="31" cy="19" r="5" fill="url(#mini-clay-eye-l)" />
          <circle cx="19" cy="19" r="2.5" fill="#1a2e05" />
          <circle cx="31" cy="19" r="2.5" fill="#1a2e05" />
          <circle cx="17.5" cy="17.5" r="1.2" fill="white" opacity="0.7" />
          <circle cx="29.5" cy="17.5" r="1.2" fill="white" opacity="0.7" />
          {/* Clay mouth - indented groove */}
          <path d="M19,27 Q25,31 31,27" fill="none" stroke="#9a3412" strokeWidth="2.5" strokeLinecap="round" />
          {/* Tubular arms - clay style */}
          <circle cx="10" cy="32" r="4" fill="#f97316" />
          <circle cx="40" cy="32" r="4" fill="#f97316" />
        </svg>
      );
  }
};

export const KaiWorkshopModal: React.FC<KaiWorkshopModalProps> = ({
  isOpen,
  onClose,
  onOpenShop,
}) => {

  const { stats, setStats } = usePlayerStore();
  const habitMastery = useAppStore((state) => state.habitMastery);
  const customHabits = useTaskStore((state) => state.customHabits);

  const habitList = useMemo(() => {
    const list: { id: string; title: string; streak: number }[] = [];
    const addedIds = new Set<string>();

    (customHabits || []).forEach((h) => {
      addedIds.add(h.id);
      list.push({
        id: h.id,
        title: h.title,
        streak: habitMastery?.[h.id]?.currentStreak || 0,
      });
    });

    Object.entries(habitMastery || {}).forEach(([id, mastery]) => {
      if (!addedIds.has(id)) {
        list.push({
          id,
          title: `Hábito #${id.slice(-4)}`,
          streak: mastery?.currentStreak || 0,
        });
      }
    });

    return list;
  }, [customHabits, habitMastery]);

  const [activeTab, setActiveTab] = useState<WorkshopTab>('shapes');

  // Neural Forge States
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [forgePrompt, setForgePrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<KaiMultiverseStyle>('pixar');

  const [selectedMood, setSelectedMood] = useState<KaiTemperament>('stoic');
  const [isForging, setIsForging] = useState(false);
  const [forgedResult, setForgedResult] = useState<KaiCustomForm | null>(null);
  const [liveDetectedObject, setLiveDetectedObject] = useState<string | null>(null);
  const [forgeProgressText, setForgeProgressText] = useState<string>('');
  const [forgeError, setForgeError] = useState<string | null>(null);
  const [equippedFeedback, setEquippedFeedback] = useState(false);
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

  // Cargas de Forja (Modo libre de pruebas ilimitadas)
  const forgeCharges: number = stats.kaiNeuralForgeCharges ?? 9999;

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
    // Resetear valor para que volver a seleccionar la misma foto dispare onChange
    e.target.value = '';
  };

  const handleRunNeuralForge = async () => {
    if (!capturedImageBase64) return;

    soundFX.playClick();
    setIsForging(true);
    setForgedResult(null);
    setLiveDetectedObject(null);
    setForgeError(null);
    setForgeProgressText('Paso 1: Analizando imagen con tu compañero KAI...');

    try {
      const customForm = await forgeKaiFromImage({
        imageBase64: capturedImageBase64,
        promptDescription: forgePrompt.trim(),
        artStyle: selectedStyle,
        mood: selectedMood,
        onProgress: (stage, data) => {
          if (stage === 'vision' && data?.detectedObject) {
            setLiveDetectedObject(data.detectedObject);
            setForgeProgressText(`¡Objeto identificado: "${data.detectedObject}"!`);
          } else if (stage === 'generation') {
            setForgeProgressText(`Paso 2: Forjando compañero (${selectedStyle.toUpperCase()})...`);
          }
        },
      });

      if (customForm) {
        soundFX.playFanfare();
        triggerShockwave({ color: 'violet', intensity: 'epic' });
        setForgedResult(customForm);
        setLiveDetectedObject(customForm.detectedObject || null);

        // Registrar forma conservando modo libre
        setStats((prev) => ({
          ...prev,
          kaiNeuralForgeCharges: 9999,
        }));
      } else {
        setForgeError('No se pudo procesar la silueta. Intenta con un objeto con fondo más despejado.');
      }
    } catch (err: any) {
      console.error('[Forja Neural] Error procesando:', err);
      setForgeError(err?.message || 'Error de conexión con el motor neural. Inténtalo de nuevo.');
    } finally {
      setIsForging(false);
    }
  };

  const handleEquipCustomForm = (targetForm?: KaiCustomForm) => {
    const formToEquip = targetForm || forgedResult;
    if (!formToEquip) return;
    soundFX.playFanfare();
    triggerShockwave({ color: 'gold', intensity: 'epic' });

    const entryWithId: KaiCustomForm = {
      ...formToEquip,
      id: formToEquip.id || `relic_${Date.now()}`,
      createdAt: formToEquip.createdAt || new Date().toISOString(),
    };

    setStats((prev) => {
      const currentVault = prev.kaiVault ? [...prev.kaiVault] : [];
      if (prev.kaiCustomForm && !currentVault.some(v => v.id === prev.kaiCustomForm?.id || v.name === prev.kaiCustomForm?.name)) {
        currentVault.push(prev.kaiCustomForm);
      }
      const existingIdx = currentVault.findIndex(v => v.id === entryWithId.id || (v.name === entryWithId.name && v.detectedObject === entryWithId.detectedObject));
      if (existingIdx >= 0) {
        currentVault[existingIdx] = entryWithId;
      } else {
        currentVault.unshift(entryWithId);
      }
      return {
        ...prev,
        kaiCustomForm: entryWithId,
        kaiShape: 'custom',
        kaiVault: currentVault,
      };
    });
    setEquippedFeedback(true);
    setTimeout(() => setEquippedFeedback(false), 4500);
  };

  const handleLinkHabitToRelic = (relicId: string, habitId: string, habitTitle: string) => {
    soundFX.playClick();
    setStats((prev) => {
      const updatedVault = (prev.kaiVault || []).map(r => {
        if (r.id === relicId) {
          return {
            ...r,
            habitIdLinked: habitId || undefined,
            habitTitleLinked: habitTitle || undefined,
          };
        }
        return r;
      });
      const updatedCustom = prev.kaiCustomForm?.id === relicId
        ? { ...prev.kaiCustomForm, habitIdLinked: habitId || undefined, habitTitleLinked: habitTitle || undefined }
        : prev.kaiCustomForm;
      return {
        ...prev,
        kaiVault: updatedVault,
        kaiCustomForm: updatedCustom,
      };
    });
  };

  const handleDeleteRelic = (relicId: string) => {
    soundFX.playClick();
    setStats((prev) => {
      const updatedVault = (prev.kaiVault || []).filter(r => r.id !== relicId);
      let updatedCustom = prev.kaiCustomForm;
      let updatedShape = prev.kaiShape;
      if (prev.kaiCustomForm?.id === relicId) {
        if (updatedVault.length > 0) {
          updatedCustom = updatedVault[0];
        } else {
          updatedCustom = null;
          updatedShape = 'prism';
        }
      }
      return {
        ...prev,
        kaiVault: updatedVault,
        kaiCustomForm: updatedCustom,
        kaiShape: updatedShape,
      };
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#030712] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden text-white">
        
        {/* ─── ENCABEZADO MINIMALISTA ─── */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#040814]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Taller de KAI</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 font-normal">
                  Activo: {stats.kaiShape === 'custom' ? (stats.kaiCustomForm?.name || 'Forja IA') : (KAI_OFFICIAL_SHAPES.find(s => s.id === stats.kaiShape)?.name || 'El Prisma')}
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── BARRA DE PESTAÑAS ─── */}
        <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto scrollbar-none px-4 pt-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('forge'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'forge'
                ? 'border-b-2 border-fuchsia-400 text-fuchsia-300 bg-fuchsia-950/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Forja Neural (IA)</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('vault'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vault'
                ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bóveda / Museo</span>
            {((stats.kaiVault?.length || 0) > 0 || stats.kaiCustomForm) && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {stats.kaiVault?.length || (stats.kaiCustomForm ? 1 : 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('shapes'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shapes'
                ? 'border-b-2 border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Forma Génesis</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('evolution'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'evolution'
                ? 'border-b-2 border-amber-400 text-amber-300 bg-amber-950/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Evolución</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); setActiveTab('armory'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'armory'
                ? 'border-b-2 border-purple-400 text-purple-300 bg-purple-950/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Armería</span>
          </button>
        </div>

        {/* ─── CONTENIDO DE PESTAÑAS ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-800">
          
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: 🏛️ BÓVEDA / MUSEO DE KAI (RELIQUIAS & GUARDIANES DE HÁBITOS) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'vault' && (() => {
            const vaultItems: KaiCustomForm[] = [];
            const idsSeen = new Set<string>();

            if (stats.kaiVault && stats.kaiVault.length > 0) {
              for (const item of stats.kaiVault) {
                const key = item.id || item.name;
                if (!idsSeen.has(key)) {
                  idsSeen.add(key);
                  vaultItems.push(item);
                }
              }
            }

            if (stats.kaiCustomForm) {
              const key = stats.kaiCustomForm.id || stats.kaiCustomForm.name;
              if (!idsSeen.has(key)) {
                idsSeen.add(key);
                vaultItems.unshift(stats.kaiCustomForm);
              }
            }

            return (
              <div className="space-y-5">
                {/* Cabecera del Museo */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#041018] to-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Museo & Bóveda de KAI</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {vaultItems.length} {vaultItems.length === 1 ? 'Reliquia' : 'Reliquias'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Tus compañeros creados. Vincula un KAI a cualquier hábito para protegerlo.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { soundFX.playClick(); setActiveTab('forge'); }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border border-emerald-400 text-emerald-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Forjar Nuevo</span>
                  </button>
                </div>

                {/* Si no hay reliquias aún */}
                {vaultItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Tu Bóveda está vacía</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Crea tu primer compañero con la Forja Neural para asignarlo a tus hábitos.
                    </p>
                    <button
                      type="button"
                      onClick={() => { soundFX.playClick(); setActiveTab('forge'); }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Ir a la Forja Neural
                    </button>
                  </div>
                ) : (
                  /* Grid de Reliquias */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vaultItems.map((relic, idx) => {
                      const relicId = relic.id || `relic_${idx}`;
                      const isEquipped = stats.kaiShape === 'custom' && (stats.kaiCustomForm?.id === relicId || stats.kaiCustomForm?.name === relic.name);
                      const linkedHabit = habitList.find(h => h.id === relic.habitIdLinked || h.title === relic.habitTitleLinked);

                      return (
                        <div
                          key={relicId}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                            isEquipped
                              ? 'bg-emerald-950/30 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50'
                              : 'bg-[#040814] border-white/10 hover:border-emerald-500/30 hover:bg-[#05111b]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-16 h-16 shrink-0 relative flex items-center justify-center bg-black/60 rounded-xl border border-white/5 p-1 overflow-hidden">
                                <KAICompanion
                                  customForm={relic}
                                  shapeId="custom"
                                  size={60}
                                  interactive={false}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-sm font-bold text-white truncate">{relic.name}</h4>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRelic(relicId)}
                                    title="Retirar de la Bóveda"
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400 block truncate">
                                  🎯 {relic.detectedObject || 'Objeto Forjado'}
                                </span>
                                <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/5 border border-white/10 text-slate-400 uppercase">
                                  {relic.artStyle || 'Multiverso'}
                                </span>
                              </div>
                            </div>

                            {/* Frase de Personalidad */}
                            {relic.personalityQuote && (
                              <p className="text-[10px] text-slate-300 italic bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 line-clamp-2 mb-3">
                                "{relic.personalityQuote}"
                              </p>
                            )}

                            {/* Selector de Hábito Custodiado */}
                            <div className="space-y-1 mb-3 pt-2 border-t border-white/5">
                              <label className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1 font-bold">
                                <Link className="w-3 h-3 text-cyan-400" />
                                <span>Hábito que Custodia:</span>
                              </label>

                              {habitList.length > 0 ? (
                                <select
                                  value={relic.habitIdLinked || ''}
                                  onChange={(e) => {
                                    const selectedId = e.target.value;
                                    const matched = habitList.find(h => h.id === selectedId);
                                    handleLinkHabitToRelic(relicId, selectedId, matched?.title || '');
                                  }}
                                  className="w-full bg-[#0a121f] border border-white/10 text-white rounded-lg px-2 py-1 text-[10px] font-mono focus:border-emerald-400 focus:outline-none cursor-pointer"
                                >
                                  <option value="">(Sin vincular a hábito)</option>
                                  {habitList.map((h) => (
                                    <option key={h.id} value={h.id}>
                                      {h.title} ({h.streak || 0}d racha)
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  Crea hábitos en la app para vincular este KAI.
                                </span>
                              )}

                              {linkedHabit && (
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mt-1">
                                  <Flame className="w-3 h-3 text-amber-400" />
                                  <span>Racha protegida: {linkedHabit.streak || 0} días</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Botón de Equipar */}
                          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-500">
                              {relic.createdAt ? new Date(relic.createdAt).toLocaleDateString() : 'Activo'}
                            </span>

                            {isEquipped ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-400/50 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Activo
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEquipCustomForm(relic)}
                                className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-500 hover:text-black font-mono text-[10px] font-bold text-emerald-200 transition-all cursor-pointer"
                              >
                                Equipar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: FORMA GÉNESIS (EL PRISMA) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'shapes' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Compañero Génesis & Creaciones
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  Forma Sagrada Día 0
                </span>
              </div>

              {/* Grid: El Prisma Cuántico y Compañero Forjado IA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {/* 1. EL PRISMA CUÁNTICO */}
                {(() => {
                  const isSelected = stats.kaiShape !== 'custom';
                  return (
                    <div
                      onClick={() => handleSelectShape('prism')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/60'
                          : 'bg-[#040814] border-white/10 hover:border-cyan-500/40 hover:bg-[#061022]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 shrink-0 relative flex items-center justify-center bg-black/50 rounded-xl border border-white/5 p-1">
                          <KaiVectorGraphics
                            shapeId="prism"
                            activeColor={isSelected ? '#00f0ff' : '#94a3b8'}
                            secondaryColor="#0284c7"
                            glowFilterId="preview-genesis-prism"
                            has21Days={has21Days}
                            has66Days={has66Days}
                            ascensionCrystalsCount={ascensionCrystals}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🔺</span>
                            <h4 className="text-xs font-bold text-white truncate">El Prisma</h4>
                          </div>
                          <span className="text-[9px] font-mono text-cyan-300 block mt-0.5">
                            ORÁCULO // PRIMA
                          </span>
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/5 border border-white/10 text-slate-400">
                            Visión & Foco Mental
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 mt-2.5 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-slate-400">
                          {isSelected ? 'Compañero Activo' : 'Compañero Génesis'}
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
                              handleSelectShape('prism');
                            }}
                            className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500 hover:text-black font-mono text-[10px] font-bold text-cyan-200 transition-all cursor-pointer"
                          >
                            Equipar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Tarjeta de Forma Forjada por IA (Si existe) */}
                {stats.kaiCustomForm && (
                  <div
                    onClick={() => handleSelectShape('custom')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                      stats.kaiShape === 'custom'
                        ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)] ring-1 ring-fuchsia-400/60'
                        : 'bg-[#040814] border-fuchsia-500/30 hover:border-fuchsia-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-14 h-14 shrink-0 relative flex items-center justify-center bg-black/50 rounded-xl border border-fuchsia-500/30 p-1">
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
                          <h4 className="text-xs font-bold text-fuchsia-200 truncate">{stats.kaiCustomForm.name}</h4>
                        </div>
                        <span className="text-[9px] font-mono text-fuchsia-400 block mt-0.5">
                          FORJA NEURAL IA
                        </span>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                          {stats.kaiCustomForm.detectedObject || 'Personalizado'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-fuchsia-500/20 flex items-center justify-end">
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
                          className="px-3 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500 hover:text-black font-mono text-[10px] font-bold text-fuchsia-200 transition-all cursor-pointer border border-fuchsia-500/40"
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
                      Ascensión Cuántica
                    </span>
                    <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      <span>KAI {has66Days ? `Grado ${ascensionGrade}` : (has21Days ? 'Guardián 21d' : 'Forma Inicial')}</span>
                      {has66Days && <Crown className="w-4 h-4 text-amber-400" />}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                      {has66Days
                        ? `${habits66Count} hábitos dominados a 66 días. Cristales orbitales activos.`
                        : has21Days
                        ? 'Inercia de 21 días superada. Auras desbloqueadas.'
                        : 'Alcanza 21 días de racha en un hábito para despertar auras.'}
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
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: 📸 FORJA NEURAL POR FOTO (IA MULTIMODAL) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'forge' && (
            <div className="space-y-4">
              {/* Selector de Estilos Minimalista */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Estilo de Personaje
                  </span>
                  <span className="text-[10px] font-mono font-bold text-fuchsia-300">
                    {KAI_MULTIVERSE_STYLES.find(s => s.id === selectedStyle)?.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {KAI_MULTIVERSE_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const shortName = style.name.split('/')[0].trim();
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setSelectedStyle(style.id);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-fuchsia-950/60 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)] ring-1 ring-fuchsia-400/50'
                            : 'bg-[#040814] border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-0.5">
                          {renderStyleMiniPreview(style.id)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {shortName}
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 block truncate">
                            {style.badge.replace('VECTOR // ', '').replace('ILUSTRACIÓN ', '').replace('VECTOR ', '')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Área Principal de Creación (2 Columnas) */}
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

                  {/* Zona de Imagen */}
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
                          <img src={capturedImageBase64} alt="Captura" className="max-h-full max-w-full object-contain" />
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
                            onClick={() => { setCapturedImageBase64(null); setForgedResult(null); }}
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
                        <div className="w-9 h-9 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Tomar o subir foto
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Fotografía nítida del objeto que cobrará vida
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Limpio de Detalle o Rasgo Especial */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                      <span>2. Detalle o Rasgo Especial</span>
                      <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
                    </label>
                    <input
                      type="text"
                      value={forgePrompt}
                      onChange={(e) => setForgePrompt(e.target.value)}
                      placeholder="Ej: Con cuernos de fuego, con bufanda ninja..."
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400/80 transition-colors"
                    />
                  </div>

                  {forgeError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span className="text-[11px]">{forgeError}</span>
                    </div>
                  )}

                  {/* Botón Principal */}
                  <button
                    type="button"
                    onClick={handleRunNeuralForge}
                    disabled={!capturedImageBase64 || isForging}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 hover:opacity-95 disabled:opacity-30 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(217,70,239,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {isForging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span className="truncate">{forgeProgressText || 'Materializando con IA...'}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Dar Vida al Personaje</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Columna Derecha: Escenario Holográfico */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#040814] via-[#060c20] to-[#040814] border border-white/10 space-y-3 flex flex-col items-center justify-between relative overflow-hidden min-h-[300px]">
                  
                  {/* Luz de fondo sutil */}
                  <div className="absolute inset-0 bg-radial from-fuchsia-600/10 via-transparent to-transparent pointer-events-none blur-xl" />

                  {/* Header de la columna derecha */}
                  <div className="w-full flex items-center justify-between z-10">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-fuchsia-400" />
                      <span>{forgedResult ? 'Compañero Revelado' : 'Pedestal Holográfico'}</span>
                    </span>
                    {forgedResult ? (
                      <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-400/50 px-2 py-0.5 rounded-full">
                        ✨ ¡Listo!
                      </span>
                    ) : isForging ? (
                      <span className="text-[9px] font-mono text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded-full animate-pulse">
                        ⚡ Forjando...
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
                      <div className="text-center p-3 text-cyan-300 space-y-2 z-10 animate-pulse flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-cyan-950/70 border border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                          <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
                        </div>
                        <div className="space-y-0.5 max-w-[180px]">
                          <span className="text-xs font-bold text-white block truncate">
                            {liveDetectedObject ? `🎯 "${liveDetectedObject}"` : 'Escaneando objeto...'}
                          </span>
                          <span className="text-[9px] text-cyan-300/80 font-mono block leading-tight">
                            {forgeProgressText || 'Procesando con IA'}
                          </span>
                        </div>
                      </div>
                    ) : forgeError ? (
                      <div className="text-center p-3 text-rose-300 space-y-2 z-10 max-w-[200px] flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-xs font-bold text-rose-200 block">
                          No se pudo completar
                        </span>
                        <span className="text-[9px] text-rose-300/80 font-mono block line-clamp-2">
                          {forgeError}
                        </span>
                      </div>
                    ) : forgedResult ? (
                      <motion.div
                        key={forgedResult.name}
                        initial={{ scale: 0.5, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 220, damping: 18 }}
                        className="relative z-10 w-48 h-48 flex items-center justify-center"
                      >
                        <KAICompanion
                          customForm={forgedResult}
                          shapeId="custom"
                          size={175}
                        />
                      </motion.div>
                    ) : stats.kaiCustomForm ? (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <KAICompanion
                          customForm={stats.kaiCustomForm}
                          shapeId="custom"
                          size={175}
                        />
                      </div>
                    ) : (
                      <div className="text-center p-4 text-slate-500 space-y-2 z-10">
                        <div className="w-10 h-10 mx-auto rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/20 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-fuchsia-400/60" />
                        </div>
                        <span className="text-[11px] block leading-relaxed text-slate-400">
                          Sube una foto y toca <strong>Dar Vida</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Diálogo & Acción de Equipar */}
                  {forgedResult ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full space-y-2.5 z-10"
                    >
                      {/* Cita carismática */}
                      <div className="p-2.5 rounded-xl bg-black/60 border border-fuchsia-500/30 text-center relative">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono uppercase text-fuchsia-300 font-bold">
                            💬 {forgedResult.name}:
                          </span>
                        </div>
                        <p className="text-xs text-white italic font-medium leading-relaxed">
                          "{forgedResult.personalityQuote || '¡He despertado con forma y voluntad propia!'}"
                        </p>
                      </div>

                      {/* Badges de ADN */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {forgedResult.detectedObject && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-medium">
                            🎯 {forgedResult.detectedObject}
                          </span>
                        )}
                        {forgedResult.artStyle && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-fuchsia-950/70 border border-fuchsia-400/40 text-[10px] font-mono text-fuchsia-200 uppercase font-medium">
                            {KAI_MULTIVERSE_STYLES.find(s => s.id === forgedResult.artStyle)?.icon || '🎨'} {forgedResult.artStyle}
                          </span>
                        )}
                      </div>

                      {/* Botón Adoptar */}
                      <button
                        type="button"
                        onClick={() => handleEquipCustomForm()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:opacity-95 text-white font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>¡Adoptar & Equipar!</span>
                      </button>
                    </motion.div>
                  ) : stats.kaiCustomForm ? (
                    <div className="w-full space-y-2 z-10 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs font-bold text-white">{stats.kaiCustomForm.name}</span>
                        {stats.kaiCustomForm.detectedObject && (
                          <span className="text-[10px] font-mono text-fuchsia-300">({stats.kaiCustomForm.detectedObject})</span>
                        )}
                      </div>

                      {stats.kaiShape === 'custom' ? (
                        <span className="inline-block py-1 px-3 rounded-lg bg-fuchsia-950/60 border border-fuchsia-500/40 text-[10px] font-mono text-fuchsia-300 font-bold">
                          ✓ Equipado en tu Interfaz
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectShape('custom')}
                          className="w-full py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Equipar este KAI
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Toast de Éxito al Equipar */}
                  {equippedFeedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full p-2 rounded-xl bg-emerald-950/90 border border-emerald-400 text-center font-mono text-[11px] font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10"
                    >
                      🎉 ¡Compañero Equipado en toda la App!
                    </motion.div>
                  )}
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
                  { id: 'none', name: 'Presencia Pura', icon: '⚪', badge: 'CANÓNICO', desc: 'Silueta limpia y minimalista sin accesorios.' },
                  { id: 'plasma_lightning', name: 'Rayos de Plasma', icon: '⚡', badge: 'ALTO VOLTAJE', desc: 'Arcos eléctricos crepitando con resplandor neón en tiempo real.' },
                  { id: 'wings', name: 'Alas Cibernéticas', icon: '🪽', badge: 'AERO TÁCTICO', desc: 'Alas biomecánicas holográficas desplegadas a ambos lados.' },
                  { id: 'hex_shield', name: 'Escudo Hexagonal', icon: '🛡️', badge: 'CAMPO FUERZA', desc: 'Cúpula protectora con rejilla de colmena giratoria.' },
                  { id: 'solar', name: 'Corona & Orbes', icon: '👑', badge: 'ASCENSIÓN', desc: 'Corona dorada con 3 orbes de energía en órbita continua.' },
                  { id: 'hud_visor', name: 'Visor HUD Militar', icon: '🎯', badge: 'CYBER TÁCTICO', desc: 'Retícula de combate con escáner láser horizontal activo.' },
                  { id: 'matrix', name: 'Tormenta Digital', icon: '🟩', badge: 'MATRIX', desc: 'Cascatas de código binario fluyendo alrededor de tu compañero.' },
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
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{item.icon}</span>
                          <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold tracking-wider">
                            {item.badge}
                          </span>
                        </div>
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
