import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Lock, Cpu, Sparkles, ChevronRight, Moon } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { soundFX } from '../utils/audio';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import { AUTH_SECURITY_MICROCOPY, WELCOME_UVP } from '../data/narrativeCopy';

const BETA_CONSENT_KEY = 'la_solucion_beta_consent_v1';

export const BetaConsentModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAgreedCheck, setHasAgreedCheck] = useState(true);
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
    if (!hasAgreedCheck) return;

    soundFX.playClick();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(BETA_CONSENT_KEY, 'true');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/88 animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#000f24] border border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-950/80 bg-gradient-to-b from-[#001836] to-[#000f24] relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/90 font-bold block">
                {copy.consentHeaderBadge}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Bienvenido a La Solución · Privacidad y Enfoque Local
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto text-xs text-slate-300 leading-relaxed relative z-10 custom-scrollbar">
          {/* Tarjeta de bienvenida y propuesta de valor directa */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/70 via-[#04152b] to-indigo-950/50 border border-cyan-400/50 space-y-2 shadow-[0_0_24px_rgba(0,240,255,0.15)]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300 block">
              Tu Espacio de Enfoque y Productividad
            </span>
            <h3 className="text-sm sm:text-base font-black text-white leading-snug">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Sin muros de pago ni tarjetas</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Asistente inteligente KAI</span>
              </span>
            </div>
          </div>

          {/* Garantías clave directas (sin muros de texto legal) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#00152b]/80 border border-cyan-950 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong className="text-white block font-semibold">Tus datos te pertenecen</strong>
                <span className="text-slate-400">Todo se almacena de forma segura en tu navegador y puedes exportar tus registros en cualquier momento.</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#00152b]/80 border border-cyan-950 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong className="text-white block font-semibold">Oráculo KAI a tu ritmo</strong>
                <span className="text-slate-400">KAI te sugiere hábitos y desglosa tareas complejas de forma opcional y totalmente privada.</span>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-[#002244]/40 border border-cyan-500/30 hover:border-cyan-500/60 cursor-pointer transition-colors mt-1">
            <input
              type="checkbox"
              checked={hasAgreedCheck}
              onChange={(e) => setHasAgreedCheck(e.target.checked)}
              className="mt-0.5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 bg-[#00152b] w-4 h-4 cursor-pointer"
            />
            <span className="text-[11px] text-slate-200 select-none">
              Acepto comenzar gratis con almacenamiento local privado en mi dispositivo y acompañamiento de mi primera semana.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-cyan-950/80 bg-[#001229] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start sm:items-center gap-1.5 text-[10px] text-emerald-300/90 font-mono leading-snug">
            <span>{AUTH_SECURITY_MICROCOPY}</span>
          </div>

          <button
            type="button"
            onClick={handleAccept}
            disabled={!hasAgreedCheck}
            className={`chicle-btn px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 ${
              hasAgreedCheck
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{copy.consentAcceptCta}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
