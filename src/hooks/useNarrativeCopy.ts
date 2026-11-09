import { useUIStore } from '../store/useUIStore';
import { getNarrativeCopy, NarrativeCopySet } from '../data/narrativeCopy';
import { NarrativeMode } from '../types';

export function useNarrativeCopy(): NarrativeCopySet & {
  narrativeMode: NarrativeMode;
  setNarrativeMode: (mode: NarrativeMode) => void;
} {
  const narrativeMode = useUIStore((s) => s.narrativeMode);
  const setNarrativeMode = useUIStore((s) => s.setNarrativeMode);
  const copy = getNarrativeCopy(narrativeMode);

  return {
    ...copy,
    narrativeMode,
    setNarrativeMode,
  };
}
