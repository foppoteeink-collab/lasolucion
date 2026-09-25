import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Terminal, Loader2, ShieldCheck, Database, Radio, Sparkles } from 'lucide-react';
import { soundFX } from '../../utils/audio';

interface OracleTheatricalLoaderProps {
  userContext?: {
    class?: string;
    rank?: string;
    name?: string;
  };
}

const DECRYPTION_STAGES = [
  {
    title: 'ESTABLECIENDO PUENTE CUÁNTICO',
    desc: 'Inicializando conexión con el Núcleo Central a través del túnel cifrado TLS...',
    logs: [
      '⚡ [INIT] Petición entrante desde terminal de calibración.',
      '🌐 [ROUTE] Encaminando a través de la subred VPN cuántica.',
      '🔑 [AUTH] Token de sesión verificado por el agente de Zero-Trust.'
    ]
  },
  {
    title: 'SINCRO-ANÁLISIS DE DATOS PERFIL',
    desc: 'Extrayendo telemetría vital del Operador para ajustar coeficientes de fatiga...',
    logs: [
      '📈 [STATS] Leyendo nivel de disciplina, fuerza y energía.',
      '🧠 [CORE] Cargando mapa de arquetipos de Carl Jung.',
      '⚙️ [ALGO] Modificadores de recompensa alineados con la clase.'
    ]
  },
  {
    title: 'EJECUTANDO COMPILADOR HEURÍSTICO',
    desc: 'Deduplicando bloques horarios, detectando colisiones y blindando descansos...',
    logs: [
      '🔍 [SCAN] Detectando solapamientos temporales en agenda previa.',
      '🛠️ [DEDUP] Aplicando filtros de congruencia para misiones repetidas.',
      '📊 [MODEL] Generando bloques maestros estructurados (Time-Blocking).'
    ]
  },
  {
    title: 'FORJANDO DIRECTIVAS DE ACCIÓN',
    desc: 'Inyectando recompensas calibradas, misiones tácticas y directivas vitales...',
    logs: [
      '🛡️ [SHIELD] Configurando resiliencia de racha diaria.',
      '💎 [ECONOMY] Calculando deltas óptimos de XP y Oro.',
      '🧬 [FINALIZE] Preparando interfaz de edición visual.'
    ]
  }
];

export const OracleTheatricalLoader: React.FC<OracleTheatricalLoaderProps> = ({ userContext }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [decryptedText, setDecryptedText] = useState('');
  const [progress, setProgress] = useState(0);

  // Decryption text glitch effect
  useEffect(() => {
    const targetText = DECRYPTION_STAGES[currentStageIndex]?.title || '';
    let iteration = 0;
    const chars = 'ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789@#$%/&*+=';
    
    const interval = setInterval(() => {
      setDecryptedText(() => {
        return targetText
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return targetText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
      });

      if (iteration >= targetText.length) {
        clearInterval(interval);
      }
      iteration += 1 / 2;
    }, 30);

    return () => clearInterval(interval);
  }, [currentStageIndex]);

  // Stage rotation and log streaming
  useEffect(() => {
    const currentStage = DECRYPTION_STAGES[currentStageIndex];
    if (!currentStage) return;

    // Stream logs for the current stage
    let logIndex = 0;
    setDisplayedLogs([]);
    
    const logInterval = setInterval(() => {
      if (logIndex < currentStage.logs.length) {
        setDisplayedLogs(prev => [...prev, currentStage.logs[logIndex]]);
        try {
          soundFX.playClick();
        } catch (e) {}
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 600);

    // Dynamic progress bar updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const step = 100 / DECRYPTION_STAGES.length;
        const currentTarget = (currentStageIndex + 1) * step;
        if (prev < currentTarget) {
          return Math.min(100, prev + 1);
        }
        return prev;
      });
    }, 50);

    // Switch to next stage after some time
    const stageTimeout = setTimeout(() => {
      if (currentStageIndex < DECRYPTION_STAGES.length - 1) {
        setCurrentStageIndex(prev => prev + 1);
        try {
          soundFX.playGlitch();
        } catch (e) {}
      }
    }, 3200);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [currentStageIndex]);

  const activeStage = DECRYPTION_STAGES[currentStageIndex];

  return (
    <div className="p-5 sm:p-8 bg-[#020006] border border-[#9600ff]/50 rounded-2xl flex flex-col space-y-6 shadow-[0_0_40px_rgba(150,0,255,0.25)] relative overflow-hidden font-mono text-xs text-slate-300">
      {/* Decorative scanning line */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,10,36,0)_0%,rgba(150,0,255,0.15)_50%,rgba(18,10,36,0)_100%)] h-1/2 w-full animate-pulse pointer-events-none z-0" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(3,0,10,0.95)_100%)] pointer-events-none z-0" />

      <div className="relative z-10 flex items-center justify-between border-b border-[#9600ff]/30 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#d6f421] animate-spin" style={{ animationDuration: '4s' }} />
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm">
              Sintonizador Neural Oráculo
            </h4>
            <p className="text-[10px] text-slate-400 uppercase">
              Operador: {userContext?.name || 'Iniciado'} // Rango: {userContext?.rank || 'Fase Inicial'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#9600ff]/20 border border-[#9600ff]/50 text-[#d6f421] text-[10px] uppercase font-black tracking-widest animate-pulse">
          <Radio className="w-3.5 h-3.5" /> ONLINE
        </div>
      </div>

      {/* Main decryption visualization */}
      <div className="relative z-10 bg-[#000000]/80 border border-[#9600ff]/30 rounded-xl p-4 min-h-[160px] flex flex-col justify-between shadow-inner">
        <div>
          <div className="flex items-center justify-between text-[#d6f421] font-black uppercase mb-1 tracking-wider text-xs sm:text-sm">
            <span>{decryptedText || 'INICIALIZANDO...'}</span>
            <span className="text-slate-500 text-[10px] font-normal">Fase {currentStageIndex + 1}/{DECRYPTION_STAGES.length}</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
            {activeStage?.desc}
          </p>
        </div>

        {/* Live log stream */}
        <div className="space-y-1 bg-[#03000a] p-3 rounded-lg border border-[#9600ff]/20 max-h-[85px] overflow-y-auto custom-scrollbar">
          {displayedLogs.length === 0 ? (
            <div className="text-slate-600 italic text-[10px] animate-pulse">Esforzándose por enganchar multiplexor...</div>
          ) : (
            displayedLogs.map((log, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] leading-snug tracking-wider text-slate-300 font-mono flex items-start gap-1"
              >
                <span className="text-[#9600ff]/80 font-black">&gt;&gt;</span>
                <span>{log}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Quantum Calibration Progress Bar */}
      <div className="relative z-10 space-y-1.5">
        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 text-[#d6f421] animate-spin" />
            <span>Calibrando Estabilidad Temporal</span>
          </span>
          <span className="font-bold text-white">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-black rounded-full border border-[#9600ff]/50 p-0.5 overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-[#9600ff] via-purple-500 to-[#d6f421] shadow-[0_0_10px_rgba(150,0,255,0.5)]"
            style={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.1 }}
          />
        </div>
      </div>

      {/* Footer warning */}
      <div className="relative z-10 flex items-center gap-2 p-2.5 bg-[#0e001f] border border-[#9600ff]/30 rounded-lg">
        <Sparkles className="w-4 h-4 text-[#d6f421]" />
        <p className="text-[10px] text-slate-300 leading-snug">
          <strong>NOTA DE RENDIMIENTO:</strong> El Oráculo está ejecutando análisis cuánticos para optimizar tu agenda. No cierres el modal para asegurar la coherencia del enlace.
        </p>
      </div>
    </div>
  );
};
