import React, { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { soundFX } from '../../utils/audio';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { BetaConsentModal } from '../BetaConsentModal';
import { DayRhythmModal } from '../task-list/DayRhythmModal';
import { getTodayDateString } from '../../utils/date';
import { PlayerStats, TaskItem, PomodoroSession } from '../../types';
import { CloudSyncResult } from '../../hooks/useCloudSync';

// Lazy-loaded modal modules for code-splitting
const DayTemplatesModal = lazy(() => import('../DayTemplatesModal').then(m => ({ default: m.DayTemplatesModal })));
const DailyRewardsModal = lazy(() => import('../DailyRewardsModal').then(m => ({ default: m.DailyRewardsModal })));
const LevelUpModal = lazy(() => import('../LevelUpModal').then(m => ({ default: m.LevelUpModal })));
const DeleteConfirmModal = lazy(() => import('../DeleteConfirmModal').then(m => ({ default: m.DeleteConfirmModal })));
const KaiAssistantModal = lazy(() => import('../KaiAssistantModal').then(m => ({ default: m.KaiAssistantModal })));
const NeuralAnalysisModal = lazy(() => import('../NeuralAnalysisModal').then(m => ({ default: m.NeuralAnalysisModal })));
const DailyFinanceModal = lazy(() => import('../DailyFinanceModal').then(m => ({ default: m.DailyFinanceModal })));
const NightlyTunnel = lazy(() => import('../NightlyTunnel').then(m => ({ default: m.NightlyTunnel })));
const KaiWelcomeOnboarding = lazy(() => import('../common/KaiWelcomeOnboarding').then(m => ({ default: m.KaiWelcomeOnboarding })));
const KaiInteractiveSpotlightTour = lazy(() => import('../common/KaiInteractiveSpotlightTour').then(m => ({ default: m.KaiInteractiveSpotlightTour })));
const PomodoroTimer = lazy(() => import('../PomodoroTimer').then(m => ({ default: m.PomodoroTimer })));
const KaiWorkshopModal = lazy(() => import('../KaiWorkshopModal').then(m => ({ default: m.KaiWorkshopModal })));
const VoiceDictationModal = lazy(() => import('../VoiceDictationModal').then(m => ({ default: m.VoiceDictationModal })));
const HelpCenterModal = lazy(() => import('../HelpCenterModal').then(m => ({ default: m.HelpCenterModal })));
const PrivacyPolicyModal = lazy(() => import('../PrivacyPolicyModal').then(m => ({ default: m.PrivacyPolicyModal })));

export interface ModalPortalHostProps {
  stats: PlayerStats;
  currentViewDate: string;
  tasks: TaskItem[];
  pomodoroSessions: PomodoroSession[];
  cloudSync: CloudSyncResult;
  isOracleOpen: boolean;
  oracleInitialPrompt?: string;
  onCloseOracle: () => void;
  isNeuralAnalysisOpen: boolean;
  onCloseNeuralAnalysis: () => void;
  isFinanceModalOpen: boolean;
  onCloseFinanceModal: () => void;
  isKaiWorkshopOpen: boolean;
  onCloseKaiWorkshop: () => void;
  isAwakeningOpen: boolean;
  onCloseAwakening: () => void;
  handleConfirmFinishDayLocal: (bonusXp: number, bonusCoins: number, manualBedtime?: string) => void;
  handleClaimDailyReward: (day: number, xp: number, coins: number, bonusItem?: string) => void;
  handleSaveReflection: (date: string, note: string) => void;
  handlePomodoroComplete: (session: any) => void;
  handleApplyTemplate: (template: any, mode: 'replace' | 'merge') => void;
  executeDeleteTask: () => void;
  handleOpenOracleWithPrompt: (promptText?: string) => void;
  setActiveTab: (tab: any) => void;
}

export const ModalPortalHost: React.FC<ModalPortalHostProps> = ({
  stats,
  currentViewDate,
  tasks,
  pomodoroSessions,
  cloudSync,
  isOracleOpen,
  oracleInitialPrompt,
  onCloseOracle,
  isNeuralAnalysisOpen,
  onCloseNeuralAnalysis,
  isFinanceModalOpen,
  onCloseFinanceModal,
  isKaiWorkshopOpen,
  onCloseKaiWorkshop,
  isAwakeningOpen,
  onCloseAwakening,
  handleConfirmFinishDayLocal,
  handleClaimDailyReward,
  handleSaveReflection,
  handlePomodoroComplete,
  handleApplyTemplate,
  executeDeleteTask,
  handleOpenOracleWithPrompt,
  setActiveTab,
}) => {
  const isDailyRewardsOpen = useUIStore((s) => s.isDailyRewardsOpen);
  const isLevelUpOpen = useUIStore((s) => s.isLevelUpOpen);
  const isFinishDayOpen = useUIStore((s) => s.isFinishDayOpen);
  const isDayTemplatesOpen = useUIStore((s) => s.isDayTemplatesOpen);
  const isPomodoroOpen = useUIStore((s) => s.isPomodoroOpen);
  const isNightlyReflectionOpen = useUIStore((s) => s.isNightlyReflectionOpen);
  const deleteConfirmTask = useUIStore((s) => s.deleteConfirmTask);
  const setDeleteConfirmTask = useUIStore((s) => s.setDeleteConfirmTask);
  const setModalState = useUIStore((s) => s.setModalState);
  const isTacticalGuideOpen = useUIStore((s) => s.isTacticalGuideOpen);
  const isVoiceDictationOpen = useUIStore((s) => s.isVoiceDictationOpen);
  const closeVoiceDictation = useUIStore((s) => s.closeVoiceDictation);
  const isHelpCenterOpen = useUIStore((s) => s.isHelpCenterOpen);
  const closeHelpCenter = useUIStore((s) => s.closeHelpCenter);
  const isPrivacyPolicyOpen = useUIStore((s) => s.isPrivacyPolicyOpen);
  const closePrivacyPolicy = useUIStore((s) => s.closePrivacyPolicy);

  const levelUpData = useAppStore((s) => s.levelUpData);
  const pomodoroPreFill = useAppStore((s) => s.pomodoroPreFill);

  return (
    <>
      {/* Protocolo de Consentimiento Beta y Privacidad P0 */}
      <BetaConsentModal />

      {/* Modal de Calibración de Ritmo y Jornada Diaria */}
      <DayRhythmModal />

      {/* Day Routine Templates Modal */}
      {isDayTemplatesOpen && (
        <Suspense fallback={null}>
          <DayTemplatesModal 
            isOpen={isDayTemplatesOpen}
            onClose={() => setModalState('isDayTemplatesOpen', false)}
            currentDate={currentViewDate}
            currentTasks={tasks}
            onApplyTemplate={handleApplyTemplate}
          />
        </Suspense>
      )}

      {/* Daily Rewards Modal */}
      {isDailyRewardsOpen && (
        <Suspense fallback={null}>
          <DailyRewardsModal
            isOpen={isDailyRewardsOpen}
            onClose={() => setModalState('isDailyRewardsOpen', false)}
            stats={stats}
            onClaimReward={handleClaimDailyReward}
          />
        </Suspense>
      )}

      {/* Level Up Celebration Modal */}
      {isLevelUpOpen && (
        <Suspense fallback={null}>
          <LevelUpModal
            isOpen={isLevelUpOpen}
            onClose={() => setModalState('isLevelUpOpen', false)}
            newLevel={levelUpData?.level || 1}
            newRankTitle={levelUpData?.rank || 'Aventurero'}
            stats={stats}
          />
        </Suspense>
      )}

      {/* Delete Task Confirmation Modal */}
      {deleteConfirmTask && (
        <Suspense fallback={null}>
          <DeleteConfirmModal
            task={deleteConfirmTask}
            onClose={() => setDeleteConfirmTask(null)}
            onConfirm={executeDeleteTask}
          />
        </Suspense>
      )}

      {/* Asistente IA de Planificación KAI */}
      {isOracleOpen && (
        <Suspense fallback={null}>
          <KaiAssistantModal 
            isOpen={isOracleOpen}
            initialPrompt={oracleInitialPrompt}
            onClose={onCloseOracle}
          />
        </Suspense>
      )}

      {/* Neural Analysis Modal */}
      {isNeuralAnalysisOpen && (
        <Suspense fallback={null}>
          <NeuralAnalysisModal
            isOpen={isNeuralAnalysisOpen}
            onClose={onCloseNeuralAnalysis}
          />
        </Suspense>
      )}

      {/* Daily Finance Express Modal */}
      {isFinanceModalOpen && (
        <Suspense fallback={null}>
          <DailyFinanceModal
            isOpen={isFinanceModalOpen}
            onClose={onCloseFinanceModal}
            currentDate={currentViewDate}
            tasks={tasks}
            onOpenStats={() => {
              onCloseFinanceModal();
              setActiveTab('stats');
            }}
          />
        </Suspense>
      )}

      {/* Nightly Tunnel — Sequential End-of-Day Flow */}
      {(isNightlyReflectionOpen || isFinishDayOpen) && (
        <Suspense fallback={null}>
          <NightlyTunnel
            isOpen={isNightlyReflectionOpen || isFinishDayOpen}
            onClose={() => {
              setModalState('isNightlyReflectionOpen', false);
              setModalState('isFinishDayOpen', false);
            }}
            stats={stats}
            allTasks={tasks}
            pomodoroSessions={pomodoroSessions}
            onConfirmFinishDay={handleConfirmFinishDayLocal}
            onClaimDailyReward={handleClaimDailyReward}
            onAddJournalEntry={(note) => {
              const today = getTodayDateString();
              handleSaveReflection(today, note);
            }}
          />
        </Suspense>
      )}

      {/* Onboarding y Guía de Bienvenida Cálida de KAI */}
      {isAwakeningOpen && (
        <Suspense fallback={null}>
          <KaiWelcomeOnboarding
            isOpen={isAwakeningOpen}
            initialStep={1}
            onClose={onCloseAwakening}
            stats={stats}
            cloudSync={cloudSync}
          />
        </Suspense>
      )}

      {/* Guía Interactiva Spotlight de KAI */}
      {isTacticalGuideOpen && (
        <Suspense fallback={null}>
          <KaiInteractiveSpotlightTour />
        </Suspense>
      )}

      {/* Floating Pomodoro Pop-up Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isPomodoroOpen && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Modo Foco Pomodoro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto portal-modal-root"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    soundFX.playClick();
                    setModalState('isPomodoroOpen', false);
                  }
                }}
              >
                <motion.div
                  initial={{ scale: 0.94, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 16 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                  className="w-full max-w-lg my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Suspense fallback={null}>
                    <PomodoroTimer
                      onSessionComplete={handlePomodoroComplete}
                      initialTaskTitle={pomodoroPreFill.title}
                      initialCategory={pomodoroPreFill.category}
                      onClose={() => setModalState('isPomodoroOpen', false)}
                    />
                  </Suspense>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* TALLER CUÁNTICO DE KAI */}
      {isKaiWorkshopOpen && (
        <Suspense fallback={null}>
          <KaiWorkshopModal
            isOpen={isKaiWorkshopOpen}
            onClose={onCloseKaiWorkshop}
            onOpenShop={() => setActiveTab('shop')}
          />
        </Suspense>
      )}

      {/* HÁBLAME — CENTRO UNIFICADO DE VOZ E IA DE KAI */}
      {isVoiceDictationOpen && (
        <Suspense fallback={null}>
          <VoiceDictationModal
            isOpen={isVoiceDictationOpen}
            onClose={closeVoiceDictation}
            onOpenOracleWithPrompt={handleOpenOracleWithPrompt}
            onOpenTemplates={() => setModalState('isDayTemplatesOpen', true)}
          />
        </Suspense>
      )}

      {/* CENTRO DE AYUDA Y GLOSARIO AUTÓNOMO */}
      {isHelpCenterOpen && (
        <Suspense fallback={null}>
          <HelpCenterModal
            isOpen={isHelpCenterOpen}
            onClose={closeHelpCenter}
            onOpenShop={() => setActiveTab('shop')}
          />
        </Suspense>
      )}

      {/* POLÍTICA DE PRIVACIDAD Y DERECHOS ARCO (LEY 8968 / GDPR) */}
      {isPrivacyPolicyOpen && (
        <Suspense fallback={null}>
          <PrivacyPolicyModal
            isOpen={isPrivacyPolicyOpen}
            onClose={closePrivacyPolicy}
          />
        </Suspense>
      )}
    </>
  );
};
