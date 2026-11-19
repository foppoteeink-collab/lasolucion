import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  HelpCircle, 
  X, 
  Search, 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Moon, 
  Cloud, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Lock,
  Zap,
  Target,
  CheckCircle2
} from 'lucide-react';
import { soundFX } from '../utils/audio';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop?: () => void;
}

interface FAQItem {
  id: string;
  category: 'mecanicas' | 'privacidad' | 'sincronizacion';
  question: string;
  answer: string;
  highlight?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose, onOpenShop }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mecanicas' | 'privacidad' | 'sincronizacion'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  if (!isOpen || typeof document === 'undefined') return null;

  const handleClose = () => {
    soundFX.playClick();
    onClose();
  };

  const toggleExpand = (id: string) => {
    soundFX.playClick();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const faqItems: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'mecanicas',
      question: '¿Cómo funcionan las rachas y la Regla 21/66?',
      answer: 'Científicamente (estudio de la Dra. Philippa Lally, UCL), un hábito requiere aproximadamente 21 días de repetición continua para asimilarse neurológicamente y 66 días para automatizarse por completo. Cada día que completas tu hábito prioritario, tu racha avanza +1. Al alcanzar el día 21 y 66, desbloqueas transformaciones evolutivas para tu compañero KAI.',
      highlight: '21 días = Asimilación. 66 días = Maestría definitiva.'
    },
    {
      id: 'faq-2',
      category: 'mecanicas',
      question: '¿Qué es el Bloqueo de +48h y cómo recupero una tarea archivada?',
      answer: 'Las jornadas con más de 48 horas se archivan para proteger tu salud mental y evitar la trampa de la culpa retrospectiva. Si necesitas reactivar o proteger una racha que se rompió por un imprevisto, puedes adquirir una "Poción de Resurrección" o forjar un "Escudo Místico" en la Tienda de Recompensas usando las monedas que ganas con tu disciplina.',
      highlight: 'Disponible en la Tienda de Recompensas.',
      action: onOpenShop ? {
        label: 'Abrir Tienda de Recompensas',
        onClick: () => {
          onClose();
          onOpenShop();
        }
      } : undefined
    },
    {
      id: 'faq-3',
      category: 'mecanicas',
      question: '¿Qué son los Escudos Místicos y Viales Tácticos?',
      answer: 'Los Escudos Místicos protegen automáticamente tu racha si un día no logras ingresar a la aplicación por fuerza mayor (puedes acumular hasta 3). Los Viales Tácticos te otorgan un multiplicador de 1.5x de experiencia (XP) durante tu jornada activa para subir de nivel más rápido.',
      highlight: 'Equípalos desde tu inventario táctico.'
    },
    {
      id: 'faq-4',
      category: 'privacidad',
      question: '¿Dónde se guardan mis datos personales y notas?',
      answer: 'Por diseño y compromiso ético (Privacy by Design), todos tus datos se almacenan de forma segura y cifrada en el almacenamiento local de tu navegador (LocalStorage e IndexedDB). No vendemos tus hábitos ni tus notas. Si decides conectar Google, tus datos se resguardan en servidores en la nube bajo reglas estrictas que impiden que nadie más acceda a ellos.',
      highlight: '100% privado en tu dispositivo.'
    },
    {
      id: 'faq-5',
      category: 'privacidad',
      question: '¿Cómo funciona la Inteligencia Artificial del Oráculo KAI?',
      answer: 'El Oráculo KAI utiliza la API de Google Gemini para sugerirte hábitos y desglosar misiones complejas en pasos pequeños. Tus notas personales no se usan para entrenar modelos públicos. El procesamiento es puntual, confidencial y puedes usar la aplicación sin IA si así lo prefieres.',
      highlight: 'Procesamiento puntual y confidencial.'
    },
    {
      id: 'faq-6',
      category: 'sincronizacion',
      question: '¿Puedo usar La Solución sin conexión a internet (Offline)?',
      answer: '¡Sí, al 100%! La Solución es una Progressive Web App (PWA) de arquitectura Offline-First. Puedes registrar tareas, usar el cronómetro Pomodoro y escribir en tu bitácora en un avión o sin señal. Cuando recuperes conexión, la cola inteligente de salida sincronizará todo automáticamente en segundo plano.',
      highlight: 'Soporte 100% fuera de línea garantizado.'
    },
    {
      id: 'faq-7',
      category: 'sincronizacion',
      question: '¿Cómo paso mi progreso de mi teléfono a mi computadora o tablet?',
      answer: 'Ve a Ajustes > Nube & Datos. Si estás conectado con tu cuenta de Google, pulsa "Subir datos a la nube". Luego, en tu otro dispositivo, abre la app, inicia sesión con el mismo correo y pulsa "Traer datos a este equipo". Tus misiones y nivel se sincronizarán en segundos.',
      highlight: 'Puente directo entre dispositivos en 1 clic.'
    }
  ];

  const filteredItems = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === '' ||
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqItems, selectedCategory, searchTerm]);

  return createPortal(
    <div className="fixed inset-0 z-[190] portal-modal-root bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-center-title"
        className="relative isolate w-full max-w-2xl bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col max-h-[88dvh] overflow-hidden text-left"
      >
        {/* Micrograno y filamento decorativo */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase aura-text-primary font-bold block">
                AUTOSERVICIO & GLOSARIO
              </span>
              <h2 id="help-center-title" className="text-sm sm:text-base font-anton uppercase tracking-wider text-white">
                Centro de Ayuda y Preguntas Frecuentes
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar centro de ayuda"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de búsqueda y categorías */}
        <div className="p-4 border-b border-white/10 bg-[#040814]/80 space-y-3 relative z-10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar duda, término (ej: racha, escudo, 48h, offline)..."
              className="w-full bg-[#030712] border border-white/15 focus:border-[var(--aura-color-1,#00f0ff)] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-anton uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'aura-bg-soft border aura-border-primary aura-text-primary font-bold'
                  : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              Todos ({faqItems.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('mecanicas')}
              className={`px-3 py-1 rounded-lg text-[11px] font-anton uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === 'mecanicas'
                  ? 'aura-bg-soft border aura-border-primary aura-text-primary font-bold'
                  : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              Mecánicas & Rachas
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('privacidad')}
              className={`px-3 py-1 rounded-lg text-[11px] font-anton uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === 'privacidad'
                  ? 'aura-bg-soft border aura-border-primary aura-text-primary font-bold'
                  : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              Privacidad & Datos
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('sincronizacion')}
              className={`px-3 py-1 rounded-lg text-[11px] font-anton uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === 'sincronizacion'
                  ? 'aura-bg-soft border aura-border-primary aura-text-primary font-bold'
                  : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              Offline & Nube
            </button>
          </div>
        </div>

        {/* Scrollable Accordion List */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto custom-scrollbar relative z-10 flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs space-y-1">
              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No se encontraron respuestas para "{searchTerm}".</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="text-cyan-400 text-[11px] hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'bg-[#040a1a] border-white/20 shadow-lg'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/15'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="text-xs font-anton uppercase tracking-wider text-white">
                      {item.question}
                    </span>
                    <div className="p-1 rounded-md bg-white/[0.05] text-slate-400 shrink-0">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 space-y-2.5 animate-fade-in">
                      <p className="text-[11.5px] text-slate-300">{item.answer}</p>

                      {item.highlight && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{item.highlight}</span>
                        </div>
                      )}

                      {item.action && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={item.action.onClick}
                            className="chicle-btn px-3 py-1.5 rounded-lg aura-btn-gradient text-[10.5px] font-anton uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{item.action.label}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 relative z-10">
          <span className="text-[10px] font-mono text-slate-400">
            Soporte Autónomo · La Solución
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="chicle-btn px-4 py-1.5 rounded-xl font-anton text-xs uppercase tracking-wider aura-btn-gradient optic-active-card cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
