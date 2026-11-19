import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X, Lock, Database, EyeOff, FileText, CheckCircle2, Server } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const handleClose = () => {
    soundFX.playClick();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] portal-modal-root bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-title"
        className="relative isolate w-full max-w-2xl bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col max-h-[88dvh] overflow-hidden text-left"
      >
        {/* Micrograno y filamento superior */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold block">
                CUMPLIMIENTO LEGAL · LEY 8968 & GDPR
              </span>
              <h2 id="privacy-policy-title" className="text-sm sm:text-base font-anton uppercase tracking-wider text-white">
                Política de Privacidad y Soberanía de Datos
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal de privacidad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-300 leading-relaxed relative z-10 custom-scrollbar">
          {/* Declaración de Soberanía */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-emerald-300 uppercase font-mono tracking-wider">
                Compromiso de Privacidad por Diseño (Privacy by Design)
              </h3>
              <p className="text-[11.5px] text-slate-300 leading-relaxed">
                <strong>La Solución</strong> es una aplicación web progresiva (PWA) de productividad diaria orientada a la privacidad. Tu información pertenece únicamente a ti: no vendemos, no monetizamos ni comercializamos jamás tus hábitos, tareas o reflexiones personales con terceros ni redes de publicidad.
              </p>
            </div>
          </div>

          {/* 1. Responsable del Tratamiento */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-anton uppercase text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 aura-text-primary" /> 1. Responsable del Tratamiento
            </h4>
            <p className="text-slate-300 text-[11.5px]">
              En cumplimiento con la <strong>Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley N° 8968 de Costa Rica)</strong> y el <strong>Reglamento General de Protección de Datos (GDPR - Reglamento UE 2016/679)</strong>, el equipo de desarrollo de La Solución garantiza la custodia ética y confidencial de cualquier información procesada.
            </p>
          </div>

          {/* 2. Arquitectura de Almacenamiento Local Primario */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-anton uppercase text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" /> 2. Almacenamiento Local en tu Dispositivo
            </h4>
            <p className="text-slate-300 text-[11.5px]">
              Por defecto, todas tus misiones, registros de hábitos, bitácoras y finanzas se almacenan localmente en tu propio dispositivo utilizando las tecnologías de almacenamiento seguro del navegador (<strong>LocalStorage e IndexedDB</strong>). Si nunca vinculas una cuenta, tus datos nunca salen de tu equipo.
            </p>
          </div>

          {/* 3. Sincronización en la Nube (Opcional) */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-anton uppercase text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> 3. Sincronización Opcional en la Nube
            </h4>
            <p className="text-slate-300 text-[11.5px]">
              Si decides iniciar sesión con tu cuenta de Google, tus datos se sincronizan con servidores de <strong>Cloud Firestore (Google Cloud Platform)</strong> mediante canales cifrados (HTTPS / TLS 1.3). El acceso a tus datos está blindado por reglas de seguridad a nivel de servidor (Firestore Security Rules), que impiden terminantemente que cualquier otro usuario o tercero acceda a tus documentos.
            </p>
          </div>

          {/* 4. Asistente Inteligente (Google Gemini API) */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-anton uppercase text-white flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-purple-400" /> 4. Uso del Oráculo Inteligente (IA)
            </h4>
            <p className="text-slate-300 text-[11.5px]">
              Al utilizar las funciones de sugerencia de hábitos y desglose táctico del Oráculo KAI, la aplicación consulta la API de Google Gemini únicamente con el texto de la solicitud que tú envías. Estas peticiones no se utilizan para entrenar modelos públicos y son procesadas de forma puntual bajo los términos de privacidad empresarial de Google AI Studio.
            </p>
          </div>

          {/* 5. Derechos ARCO: Acceso, Rectificación, Cancelación y Portabilidad */}
          <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/10">
            <h4 className="text-xs font-anton uppercase text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> 5. Tus Derechos ARCO y Portabilidad
            </h4>
            <p className="text-slate-300 text-[11.5px]">
              En todo momento conservas tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] pt-1">
              <li><strong>Portabilidad (Art. 20 GDPR / Art. 7 Ley 8968):</strong> Puedes descargar en cualquier momento una copia íntegra de todos tus datos en formato JSON legible desde la pestaña de Datos en Ajustes.</li>
              <li><strong>Derecho de Supresión / Borrado Total:</strong> Puedes ejecutar el borrado permanente de tu cuenta, purgando automáticamente todos los registros de los servidores y de la memoria local de tu dispositivo.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 relative z-10">
          <span className="text-[10px] font-mono text-slate-400">
            Versión legal 2026.11 · La Solución
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="chicle-btn px-4 py-1.5 rounded-xl font-anton text-xs uppercase tracking-wider aura-btn-gradient optic-active-card cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
