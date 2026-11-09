import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Lock, Cpu, Sparkles, ChevronRight, Moon } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { soundFX } from '../utils/audio';

const BETA_CONSENT_KEY = 'la_solucion_beta_consent_v1';

export const BetaConsentModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAgreedCheck, setHasAgreedCheck] = useState(true);

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
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
                Protocolo de Blindaje • Entorno Beta v1.0
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Términos de Prueba y Privacidad Local
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-300 leading-relaxed relative z-10 custom-scrollbar">
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 text-[11px] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Estás ingresando al periodo de validación operativa de <strong className="text-white">La Solución PWA</strong>. Para garantizar tu privacidad y la continuidad del sistema, requerimos tu consentimiento explícito antes de inicializar la base de datos local.
            </p>
          </div>

          {/* Section 1: Almacenamiento Local y Resiliencia */}
          <div className="space-y-1.5 bg-[#00152b]/60 p-3.5 rounded-xl border border-blue-950">
            <h4 className="font-bold text-white flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              1. Persistencia Local & Cero Venta de Datos
            </h4>
            <p className="text-[11px] text-slate-400">
              Tus tareas, hábitos, balance financiero personal y reflexiones residen de forma prioritaria en el almacenamiento local de tu navegador (IndexedDB y LocalStorage). No comercializamos ni transferimos tus datos a terceros con fines publicitarios.
            </p>
          </div>

          {/* Section 2: Datos de Sueño y Bienestar */}
          <div className="space-y-1.5 bg-[#00152b]/60 p-3.5 rounded-xl border border-blue-950">
            <h4 className="font-bold text-white flex items-center gap-2 text-xs">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              2. Métricas de Bienestar y Ciclo Nocturno
            </h4>
            <p className="text-[11px] text-slate-400">
              El sistema registra horas estimadas de descanso y hora de despertar con el único fin de calcular bonificaciones de regeneración RPG en el ciclo diario de las 3:00 AM. Estos registros permanecen bajo tu custodia y pueden ser exportados o purgados desde la vista de Configuración.
            </p>
          </div>

          {/* Section 3: IA Táctica y Telemetría Operacional */}
          <div className="space-y-1.5 bg-[#00152b]/60 p-3.5 rounded-xl border border-blue-950">
            <h4 className="font-bold text-white flex items-center gap-2 text-xs">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              3. Telemetría Operativa y Consultas a KAI IA
            </h4>
            <p className="text-[11px] text-slate-400">
              Recopilamos eventos anónimos de estabilidad y tiempos de respuesta para corregir errores de sincronización offline. Las consultas de asistente táctico con KAI se transmiten de forma cifrada mediante las APIs de Google Gemini bajo demanda y nunca son utilizadas para entrenar modelos públicos.
            </p>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-[#002244]/40 border border-cyan-500/30 hover:border-cyan-500/60 cursor-pointer transition-colors mt-2">
            <input
              type="checkbox"
              checked={hasAgreedCheck}
              onChange={(e) => setHasAgreedCheck(e.target.checked)}
              className="mt-0.5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 bg-[#00152b] w-4 h-4 cursor-pointer"
            />
            <span className="text-[11px] text-slate-200 select-none">
              Acepto los términos del periodo beta, autorizo el almacenamiento de mis registros en este dispositivo y confirmo el tratamiento de métricas operacionales.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-cyan-950/80 bg-[#001229] flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encriptación PWA Activa</span>
          </div>

          <button
            type="button"
            onClick={handleAccept}
            disabled={!hasAgreedCheck}
            className={`chicle-btn px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${
              hasAgreedCheck
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <span>Aceptar y Comenzar Prueba</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
