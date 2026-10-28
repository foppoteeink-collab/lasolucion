import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  CheckCircle2,
  BookOpen,
  Calendar,
  ShoppingBag,
  FlaskConical,
  Settings,
} from 'lucide-react';
import { soundFX } from '../utils/audio';

export interface KaiRadialMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  action: () => void;
}

interface KaiRadialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  radius?: number;
  onNavigate: (tab: string) => void;
}

/**
 * Menú Radial Táctico de KAI basado en el motor Moxen Radial.
 * Distribuye los 7 accesos directos de la aplicación en una órbita circular
 * perfecta usando trigonometría pura (Math.cos / Math.sin), con física
 * de resorte cuántica, micro-tooltips holográficos y colores Neón (Cian y Verde).
 */
export const KaiRadialMenu: React.FC<KaiRadialMenuProps> = ({
  isOpen,
  onClose,
  radius = 100,
  onNavigate,
}) => {
  const menuItems: KaiRadialMenuItem[] = [
    {
      id: 'stats',
      label: 'Perfil',
      icon: <BarChart3 className="w-5 h-5" />,
      accentColor: '#00f0ff',
      glowColor: 'rgba(0, 240, 255, 0.55)',
      action: () => onNavigate('stats'),
    },
    {
      id: 'missions',
      label: 'Misiones',
      icon: <CheckCircle2 className="w-5 h-5" />,
      accentColor: '#00f0ff',
      glowColor: 'rgba(0, 240, 255, 0.55)',
      action: () => onNavigate('dashboard'),
    },
    {
      id: 'journal',
      label: 'Bitácora',
      icon: <BookOpen className="w-5 h-5" />,
      accentColor: '#10e29d',
      glowColor: 'rgba(16, 226, 157, 0.55)',
      action: () => onNavigate('journal'),
    },
    {
      id: 'planner',
      label: 'Planificador',
      icon: <Calendar className="w-5 h-5" />,
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.55)',
      action: () => onNavigate('planner'),
    },
    {
      id: 'shop',
      label: 'Tienda',
      icon: <ShoppingBag className="w-5 h-5" />,
      accentColor: '#d6f421',
      glowColor: 'rgba(214, 244, 33, 0.55)',
      action: () => onNavigate('shop'),
    },
    {
      id: 'skills',
      label: 'Lab',
      icon: <FlaskConical className="w-5 h-5" />,
      accentColor: '#c084fc',
      glowColor: 'rgba(192, 132, 252, 0.55)',
      action: () => onNavigate('skills'),
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: <Settings className="w-5 h-5" />,
      accentColor: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.55)',
      action: () => onNavigate('settings'),
    },
  ];

  const totalItems = menuItems.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="kai-radial-menu-container absolute inset-0 flex items-center justify-center pointer-events-none z-[80]">
          {/* Anillo orbital holográfico rotatorio de fondo */}
          <motion.svg
            initial={{ scale: 0.2, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.2, opacity: 0, rotate: 30 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="absolute overflow-visible pointer-events-none"
            style={{ width: 0, height: 0 }}
          >
            {/* Círculo guía punteado */}
            <circle
              cx={0}
              cy={0}
              r={radius}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              opacity="0.35"
              className="animate-spin"
              style={{ animationDuration: '30s', transformOrigin: '0 0' }}
            />
            {/* Halo exterior suave */}
            <circle
              cx={0}
              cy={0}
              r={radius + 8}
              fill="none"
              stroke="#d6f421"
              strokeWidth="0.8"
              opacity="0.2"
            />
          </motion.svg>

          {/* Nodos del menú radial distribuidos trigonométricamente */}
          {menuItems.map((item, index) => {
            // Empezar en la parte superior (-90 grados = -PI / 2) y avanzar en el sentido de las agujas del reloj
            const angle = (index / totalItems) * Math.PI * 2 - Math.PI / 2;
            const targetX = Math.round(Math.cos(angle) * radius);
            const targetY = Math.round(Math.sin(angle) * radius);

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playClick();
                  item.action();
                  onClose();
                }}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: targetX,
                  y: targetY,
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 0,
                  transition: { duration: 0.18, ease: 'easeIn' },
                }}
                transition={{
                  type: 'spring',
                  damping: 18,
                  stiffness: 320,
                  mass: 0.7,
                  delay: index * 0.035,
                }}
                whileHover={{ scale: 1.18 }}
                whileTap={{ scale: 0.92 }}
                style={{
                  position: 'absolute',
                  backgroundColor: 'rgba(2, 8, 16, 0.92)',
                  borderColor: item.accentColor,
                  boxShadow: `0 0 16px ${item.glowColor}, inset 0 0 8px ${item.glowColor}`,
                }}
                className="chicle-btn w-11 h-11 sm:w-12 sm:h-12 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer pointer-events-auto group select-none shadow-lg transition-colors"
                title={item.label}
              >
                {/* Ícono con color dinámico */}
                <div
                  className="transition-transform duration-200 group-hover:scale-110"
                  style={{ color: item.accentColor }}
                >
                  {item.icon}
                </div>

                {/* Micro-etiqueta holográfica flotante */}
                <span
                  className="absolute -bottom-5 pointer-events-none text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-black/95 border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-30"
                  style={{
                    borderColor: `${item.accentColor}80`,
                    color: item.accentColor,
                    boxShadow: `0 0 8px ${item.glowColor}`,
                  }}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
};

export default KaiRadialMenu;
