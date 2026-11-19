import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, CheckCircle2, Lock, Cpu, Sparkles, ChevronRight, Moon, ExternalLink, FileText } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { soundFX } from '../utils/audio';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import { AUTH_SECURITY_MICROCOPY, WELCOME_UVP } from '../data/narrativeCopy';

const BETA_CONSENT_KEY = 'la_solucion_beta_consent_v1';
const AI_CONSENT_KEY = 'la_solucion_ai_consent_v1';

export const BetaConsentModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(true);
  const [hasAgreedAI, setHasAgreedAI] = useState(true);
  const copy = useNarrativeCopy();

  const stats = usePlayerStore((s) => s.stats);
  const setStats = usePlayerStore((s) => s.setStats);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const localConsent = window.localStorage.getItem(BETA_CONSENT_KEY);
    const storeConsent = stats.betaConsentAccepted;

    // Solo se muestra si no existe aceptación previa ni en localStorage ni en Zustand
    if (localConsent !== 'true' && !storeConsent) {
      setIsOpen(true);
    }
  }, [stats.betaConsentAccepted]);

  const handleAccept = () => {
    if (!hasAgreedTerms) return;

    soundFX.playClick();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(BETA_CONSENT_KEY, 'true');
        window.localStorage.setItem(AI_CONSENT_KEY, hasAgreedAI ? 'true' : 'false');
      } catch (err) {
        console.warn('[BetaConsent] Error guardando en LocalStorage:', err);
      }
    }

    setStats((prev) => ({
      ...prev,
      betaConsentAccepted: true,
      betaConsentDate: new Date().toISOString(),
    }));

    soundFX.playLevelUp();
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="beta-consent-modal-title"
            className="relative isolate w-full max-w-lg bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] flex flex-col max-h-[90dvh] overflow-hidden text-left"
          >
            {/* Micrograno táctil */}
            <span className="vi-grano opacity-5" aria-hidden="true" />

            {/* Filamento especular superior */}
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-[#040814]/[0.96] relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary aura-glow-subtle shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase aura-text-primary font-bold block">
                    {copy.consentHeaderBadge}
                  </span>
                  <h2 id="beta-consent-modal-title" className="text-base sm:text-lg font-anton uppercase tracking-wider text-white">
                    Bienvenido a La Solución · Privacidad y Enfoque Local
                  </h2>
                </div>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto text-xs text-slate-300 leading-relaxed relative z-10 custom-scrollbar">
              {/* Tarjeta de bienvenida y propuesta de valor directa */}
              <div className="p-4 rounded-2xl bg-[#040814]/80 border aura-border-subtle space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest aura-text-soft block">
                  Tu Espacio de Enfoque y Productividad
                </span>
                <h3 className="text-sm sm:text-base font-anton uppercase tracking-wider text-white leading-snug">
                  Controla tus tareas, hábitos diarios y jornadas de trabajo sin agobios
                </h3>
                <p className="text-[11.5px] text-slate-200 leading-relaxed">
                  La Solución está diseñada para llevarte de la mano paso a paso: registrar tus misiones diarias, recordarte iniciar y cerrar turnos, y consolidar tus hábitos con recompensas reales.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>100% Privado en tu dispositivo</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full aura-bg-soft border aura-border-subtle aura-text-soft text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Sin muros de pago ni tarjetas</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-300 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Asistente inteligente KAI</span>
                  </span>
                </div>
              </div>

              {/* Garantías clave directas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 aura-text-primary shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <strong className="text-white block font-semibold">Tus datos te pertenecen</strong>
                    <span className="text-slate-400">Todo se almacena en tu navegador. Puedes exportar o purgar tus registros en cualquier momento.</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <strong className="text-white block font-semibold">Oráculo KAI opcional</strong>
                    <span className="text-slate-400">KAI te sugiere hábitos y desglosa tareas complejas de forma privada con IA de Google Gemini.</span>
                  </div>
                </div>
              </div>

              {/* Botón para leer la Política de Privacidad Completa */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  useUIStore.getState().openPrivacyPolicy();
                }}
                className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:aura-border-primary text-slate-300 hover:text-white flex items-center justify-between transition-colors text-[11px] font-mono cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Leer Política de Privacidad y Términos (Ley 8968 / GDPR)</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Consent Checkboxes Granulares */}
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-[#040814]/80 border aura-border-subtle hover:aura-border-primary cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={hasAgreedTerms}
                    onChange={(e) => setHasAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-white/25 bg-black/60 w-4 h-4 cursor-pointer accent-cyan-400 shrink-0"
                  />
                  <span className="text-[11px] text-slate-200 select-none leading-snug">
                    <strong className="text-white">Requerido:</strong> Acepto los Términos y la Política de Privacidad con almacenamiento local en mi dispositivo.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-[#040814]/80 border border-white/10 hover:border-purple-400/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={hasAgreedAI}
                    onChange={(e) => setHasAgreedAI(e.target.checked)}
                    className="mt-0.5 rounded border-white/25 bg-black/60 w-4 h-4 cursor-pointer accent-purple-400 shrink-0"
                  />
                  <span className="text-[11px] text-slate-200 select-none leading-snug">
                    <strong className="text-purple-300">Opcional:</strong> Habilitar sugerencias tácticas inteligentes mediante el Oráculo KAI (asistido por la API de Google Gemini).
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#040814]/[0.96] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-start sm:items-center gap-1.5 text-[10px] text-emerald-300/90 font-mono leading-snug">
                <span>{AUTH_SECURITY_MICROCOPY}</span>
              </div>

              <button
                type="button"
                onClick={handleAccept}
                disabled={!hasAgreedTerms}
                className={`chicle-btn px-6 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0 ${
                  hasAgreedTerms
                    ? 'aura-btn-gradient optic-active-card cursor-pointer'
                    : 'bg-white/[0.05] border border-white/10 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <span>{copy.consentAcceptCta}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
