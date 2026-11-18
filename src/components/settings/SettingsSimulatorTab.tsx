import React, { Suspense, lazy } from 'react';

const ScenarioSimulatorPanel = lazy(() =>
  import('../ScenarioSimulatorPanel').then((m) => ({ default: m.ScenarioSimulatorPanel }))
);

export const SettingsSimulatorTab: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-4">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full aura-bg-primary animate-ping" />
            Cargando simulador táctico...
          </div>
        }
      >
        <ScenarioSimulatorPanel />
      </Suspense>
    </div>
  );
};
