import { NarrativeMode } from '../types';

/**
 * Microcopia obligatoria de refuerzo de seguridad en modales de acceso, registro y respaldo.
 */
export const AUTH_SECURITY_MICROCOPY =
  '🔒 Privacidad blindada. Datos sincronizados con cifrado de extremo a extremo y soporte 100% offline';

/**
 * Propuesta Única de Valor (UVP) explícita y microcopia de mitigación de objeciones
 * para el cascarón de bienvenida y pantallas de entrada.
 */
export const WELCOME_UVP = {
  badge: 'LA SOLUCIÓN · SISTEMA DE ENFOQUE Y HÁBITOS',
  headline: 'Elimina la procrastinación y convierte tu día en progreso visible.',
  description:
    'Organiza tareas en 1 toque, construye hábitos duraderos en ciclos de 21 y 66 días y recupera tu enfoque con temporizador Pomodoro adaptativo en una sola app.',
  primaryCta: 'Crear mi sistema de enfoque',
  frictionPills: [
    'Sin tarjeta de crédito',
    'Almacenamiento privado y local en tu dispositivo',
    'Cero venta de datos personales',
  ] as const,
  frictionSummary:
    '100% gratis · Sin tarjeta de crédito · Guardado local privado en tu dispositivo · Cero venta de datos personales.',
} as const;

export const NARRATIVE_MODE_OPTIONS: Record<
  NarrativeMode,
  {
    id: NarrativeMode;
    label: string;
    shortLabel: string;
    badge: string;
    description: string;
    examples: readonly [string, string, string];
  }
> = {
  tactical: {
    id: 'tactical',
    label: 'Modo Táctico / Lore Completo',
    shortLabel: 'Táctico / Lore',
    badge: 'Inmersión RPG',
    description:
      'Mantiene la estética de ascenso, misiones, arquetipos, jefes de enfoque y vocabulario épico en toda la aplicación.',
    examples: ['Ceremonia del Despertar', 'Asimilar Poder', 'Forja Neural (IA)'],
  },
  minimal: {
    id: 'minimal',
    label: 'Modo Productividad Minimalista',
    shortLabel: 'Minimalista',
    badge: 'Cero Fricción',
    description:
      'Traduce jerga de ficción a lenguaje claro orientado a resultados: ideal para trabajo profundo, estudio o mentes que buscan simplicidad.',
    examples: ['Configuración Inicial', 'Reclamar recompensa', 'Estudio Visual (IA)'],
  },
};

export interface NarrativeCopySet {
  // Cascarón de bienvenida y privacidad
  consentHeaderBadge: string;
  consentIntroLead: string;
  consentBulletStorageTitle: string;
  consentBulletStorageDesc: string;
  consentBulletRecoveryTitle: string;
  consentBulletRecoveryDesc: string;
  consentAcceptCta: string;

  // Onboarding y Perfil Inicial
  onboardingWelcomeCta: string;
  awakeningModalTitle: string;
  awakeningQuickModeBtn: string;
  awakeningCarouselModeLabel: string;
  awakeningCompanionTitle: string;
  awakeningArchetypeTitle: string;
  awakeningSelectArchetypeCta: string;
  awakeningSuccessBanner: string;
  awakeningSubmitCta: string;
  profileRepeatSetupCta: string;
  profileArchetypeSectionTitle: string;
  profileSwitchArchetypeBtn: string;
  profileAiStudioLabel: string;

  // Ciclo del día (HUD + Cierre Nocturno)
  startDayCompact: string;
  startDayFull: string;
  startDayTooltip: string;
  closeDayCompact: string;
  closeDayFull: string;
  closeDayTooltip: string;
  nightlyHeaderBadge: string;
  nightlyRankLabel: string;
  nightlyConsolidatePrefix: string;

  // Modales de progreso y recompensas
  levelUpBadge: string;
  levelUpRankAssigned: string;
  levelUpCoinsGranted: string;
  levelUpAscensionTag: string;
  levelUpCta: string;

  surpriseBossBadge: string;
  surpriseBossRewardLabel: string;
  surpriseBossCta: string;

  collapseBadge: string;
  collapseTitle: string;
  collapsePenaltyLabel: string;
  collapseRecoveryLabel: string;

  dailyRewardsSubtitle: string;
  backToDashboardCta: string;

  // Tareas, Tienda, Taller y Boss Diario
  emptyClearHeadline: string;
  emptyClearDescription: string;
  emptyFilterDescription: string;
  emptyPrimaryCta: string;
  emptyResetDayCta: string;

  shopTitle: string;
  shopSubtitle: string;
  shopCreateCta: string;
  shopModalCreateTitle: string;

  workshopTabForge: string;
  workshopCustomFallback: string;
  workshopVaultTitle: string;
  workshopVaultEmptyCta: string;

  bossEntropyLabel: string;
  bossDefeatedBadge: string;
  bossCountermeasureLabel: string;
  bossBonusLabel: string;
  bossClaimCta: string;

  // Sistema y Configuración
  loadingModuleText: string;
  settingsHeaderTitle: string;
  settingsTabGameplay: string;
  settingsTabFinances: string;
  settingsSoundDescription: string;
  settingsAiEquippedTag: string;
  settingsAiCustomDesc: string;
  settingsWorkshopBtn: string;
}

export const NARRATIVE_COPY: Record<NarrativeMode, NarrativeCopySet> = {
  tactical: {
    consentHeaderBadge: 'Sistema Seguro • Entorno Beta v1.0',
    consentIntroLead:
      'Para garantizar privacidad total y cero latencia, tu cuenta y progreso siguen una arquitectura local-first bajo tu control:',
    consentBulletStorageTitle: 'Almacenamiento Privado y Local en tu Dispositivo',
    consentBulletStorageDesc:
      'Tus tareas, rachas y progreso se guardan directo en tu dispositivo (soporte 100% offline), sin vender tus datos personales.',
    consentBulletRecoveryTitle: 'Sincronización Opcional y Respaldo Portátil',
    consentBulletRecoveryDesc:
      'Conecta tu cuenta de Google cuando quieras para respaldar tu progreso en la nube con cifrado o descarga una copia manual en cualquier momento.',
    consentAcceptCta: 'Aceptar y Crear mi Sistema',

    onboardingWelcomeCta: 'Comenzar mi primera semana',
    awakeningModalTitle: 'Configuración Inicial de tu Cuenta',
    awakeningQuickModeBtn: 'Inicio Rápido (30s)',
    awakeningCarouselModeLabel: 'Elegir Perfil',
    awakeningCompanionTitle: 'Tu Asistente KAI',
    awakeningArchetypeTitle: 'Elige tu Estilo de Trabajo',
    awakeningSelectArchetypeCta: 'Elegir este estilo',
    awakeningSuccessBanner: '¡SISTEMA LISTO!',
    awakeningSubmitCta: 'Comenzar ahora',
    profileRepeatSetupCta: 'Reconfigurar Perfil',
    profileArchetypeSectionTitle: 'Estilo de Trabajo Activo',
    profileSwitchArchetypeBtn: 'Cambiar Estilo →',
    profileAiStudioLabel: '✨ Asistente KAI',

    startDayCompact: 'INICIAR',
    startDayFull: 'Iniciar Jornada',
    startDayTooltip: 'Iniciar tu jornada y activar tus tareas del día',
    closeDayCompact: 'CERRAR',
    closeDayFull: 'Cerrar Jornada',
    closeDayTooltip: 'Cerrar el día, llenar tu bitácora y asegurar tu racha',
    nightlyHeaderBadge: 'Cierre de Jornada y Bitácora',
    nightlyRankLabel: 'DESEMPEÑO',
    nightlyConsolidatePrefix: 'Cerrar Jornada y Guardar Bitácora',

    levelUpBadge: '⚡ ¡Subiste de Nivel!',
    levelUpRankAssigned: 'Nivel Actual',
    levelUpCoinsGranted: 'Monedas ganadas:',
    levelUpAscensionTag: '★ Meta Lograda',
    levelUpCta: 'Reclamar recompensa',

    surpriseBossBadge: '¡OBJETIVO LOGRADO!',
    surpriseBossRewardLabel: 'Recompensa por tu constancia',
    surpriseBossCta: 'Reclamar recompensa',

    collapseBadge: '⚡ ENERGÍA AGOTADA',
    collapseTitle: 'Momento de Descanso',
    collapsePenaltyLabel: 'Aceptar ajuste',
    collapseRecoveryLabel: 'Recuperar energía',

    dailyRewardsSubtitle: 'Recompensa por tu constancia diaria',
    backToDashboardCta: 'Volver al Inicio',

    emptyClearHeadline: 'DÍA DESPEJADO',
    emptyClearDescription: 'No tienes tareas pendientes hoy. ¡Descansa o añade una nueva!',
    emptyFilterDescription: 'Sin tareas en esta vista.',
    emptyPrimaryCta: 'NUEVA TAREA',
    emptyResetDayCta: 'REINICIAR DÍA',

    shopTitle: 'Mis Premios',
    shopSubtitle: 'Canjea tus puntos por descansos o premios reales.',
    shopCreateCta: 'Añadir Premio',
    shopModalCreateTitle: 'Nuevo Premio',

    workshopTabForge: 'Personalizar KAI',
    workshopCustomFallback: 'Estudio KAI',
    workshopVaultTitle: 'Galería de KAI',
    workshopVaultEmptyCta: 'Personalizar KAI',

    bossEntropyLabel: 'OBJETIVO DEL DÍA',
    bossDefeatedBadge: 'COMPLETADO',
    bossCountermeasureLabel: 'Acción:',
    bossBonusLabel: 'Premio:',
    bossClaimCta: 'Reclamar Recompensa',

    loadingModuleText: 'Cargando...',
    settingsHeaderTitle: 'Configuración',
    settingsTabGameplay: 'Preferencias & KAI',
    settingsTabFinances: 'Finanzas',
    settingsSoundDescription: 'Efectos sonoros sutiles al completar tareas.',
    settingsAiEquippedTag: 'KAI Activo',
    settingsAiCustomDesc: 'Asistente personalizado con IA',
    settingsWorkshopBtn: 'Personalizar KAI',
  },

  minimal: {
    consentHeaderBadge: 'Privacidad Local • Beta v1.0',
    consentIntroLead:
      'Para proteger tu información desde el primer segundo, tus datos se guardan de forma privada siguiendo estos principios:',
    consentBulletStorageTitle: 'Privado y Local en tu Dispositivo (100% Offline)',
    consentBulletStorageDesc:
      'Tus tareas, hábitos y métricas viven directo en tu dispositivo sin suscripciones ni venta de datos personales.',
    consentBulletRecoveryTitle: 'Respaldo Cifrado Opcional y Exportación',
    consentBulletRecoveryDesc:
      'Vincula Google cuando quieras para respaldar y sincronizar entre dispositivos, o exporta tu copia local en 1 clic.',
    consentAcceptCta: 'Aceptar y Crear mi Sistema',

    onboardingWelcomeCta: 'Crear mi sistema de enfoque',
    awakeningModalTitle: 'Configura tu Perfil de Productividad en 30 Segundos',
    awakeningQuickModeBtn: 'Configuración Rápida (30s)',
    awakeningCarouselModeLabel: 'Vista Deslizable de Perfiles',
    awakeningCompanionTitle: 'Personaliza tu Asistente de Enfoque KAI',
    awakeningArchetypeTitle: 'Elige tu Estilo de Productividad',
    awakeningSelectArchetypeCta: 'Activar este Perfil',
    awakeningSuccessBanner: '¡PERFIL CONFIGURADO Y LISTO!',
    awakeningSubmitCta: 'Crear mi sistema de enfoque',
    profileRepeatSetupCta: 'Reconfigurar Perfil Inicial',
    profileArchetypeSectionTitle: 'Estilo de Productividad Activo',
    profileSwitchArchetypeBtn: 'Explorar 12 Estilos →',
    profileAiStudioLabel: '✨ Diseño Visual con IA',

    startDayCompact: 'INICIAR DÍA',
    startDayFull: 'Iniciar Día',
    startDayTooltip: 'Comenzar tu día y activar el seguimiento de progreso',
    closeDayCompact: 'CERRAR DÍA',
    closeDayFull: 'Cerrar y Analizar Día',
    closeDayTooltip: 'Cerrar día, analizar tu productividad y asegurar tu racha',
    nightlyHeaderBadge: 'Resumen y Cierre del Día',
    nightlyRankLabel: 'DESEMPEÑO',
    nightlyConsolidatePrefix: 'Cerrar Día y Analizar Progreso',

    levelUpBadge: '⚡ ¡Nuevo Nivel Alcanzado!',
    levelUpRankAssigned: 'Nivel de Avance Actual',
    levelUpCoinsGranted: 'Monedas ganadas:',
    levelUpAscensionTag: '★ Meta Superada',
    levelUpCta: 'Reclamar recompensa',

    surpriseBossBadge: '¡META DE ENFOQUE COMPLETADA!',
    surpriseBossRewardLabel: 'Recuperación de Energía y Puntos',
    surpriseBossCta: 'Reclamar recompensa (+Salud)',

    collapseBadge: '⚡ ENERGÍA DIARIA AGOTADA (0%)',
    collapseTitle: 'Pausa y Recuperación',
    collapsePenaltyLabel: 'Asumir ajuste del día (XP)',
    collapseRecoveryLabel: 'Recuperar Energía',

    dailyRewardsSubtitle: 'Premio diario • Recompensa por mantener tu hábito',
    backToDashboardCta: 'Volver al Panel',

    emptyClearHeadline: 'DÍA DESPEJADO',
    emptyClearDescription: 'No tienes tareas pendientes. Crea una nueva tarea o tómate un descanso.',
    emptyFilterDescription: 'Sin resultados en esta vista. Ajusta los filtros o crea una nueva tarea.',
    emptyPrimaryCta: 'NUEVA TAREA',
    emptyResetDayCta: 'REINICIAR RUTINA',

    shopTitle: 'Mis Recompensas',
    shopSubtitle: 'Canjea tus puntos por descansos y gustos reales sin culpa.',
    shopCreateCta: 'Nueva Recompensa',
    shopModalCreateTitle: 'Crear Nueva Recompensa',

    workshopTabForge: 'Estudio Visual (IA)',
    workshopCustomFallback: 'Diseño con IA',
    workshopVaultTitle: 'Galería Guardada de KAI',
    workshopVaultEmptyCta: 'Ir al Estudio Visual',

    bossEntropyLabel: 'CARGA PENDIENTE',
    bossDefeatedBadge: 'COMPLETADO',
    bossCountermeasureLabel: 'Acción clave:',
    bossBonusLabel: 'Bonificación:',
    bossClaimCta: 'Reclamar recompensa',

    loadingModuleText: 'Cargando sección...',
    settingsHeaderTitle: 'Configuración',
    settingsTabGameplay: 'Modo & KAI',
    settingsTabFinances: 'Finanzas',
    settingsSoundDescription: 'Efectos sonoros sutiles y avisos al completar tus tareas.',
    settingsAiEquippedTag: 'Diseño IA Activo',
    settingsAiCustomDesc: 'Asistente visual personalizado con IA',
    settingsWorkshopBtn: 'Personalizar KAI',
  },
};

export function getNarrativeCopy(mode: NarrativeMode = 'tactical'): NarrativeCopySet {
  return NARRATIVE_COPY[mode] || NARRATIVE_COPY.tactical;
}
