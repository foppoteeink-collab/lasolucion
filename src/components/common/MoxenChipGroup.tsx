import React from 'react';
import { Icon, IconName } from './Icon';
import { soundFX } from '../../utils/audio';

export interface MoxenChipItem<T extends string = string> {
  id: T;
  label: string;
  shortLabel?: string;
  icon?: IconName | React.ReactNode;
  iconColor?: string;
  badge?: string | number;
  title?: string;
}

interface MoxenChipGroupProps<T extends string = string> {
  items: MoxenChipItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  ariaLabel?: string;
  variant?: 'default' | 'compact' | 'bare';
  size?: 'md' | 'sm';
  nowrap?: boolean;
  className?: string;
  chipClassName?: string;
}

export function MoxenChipGroup<T extends string = string>({
  items,
  activeId,
  onSelect,
  ariaLabel = 'Filtro por área',
  variant = 'default',
  size = 'md',
  nowrap = false,
  className = '',
  chipClassName = '',
}: MoxenChipGroupProps<T>) {
  const containerVariantClass =
    variant === 'compact'
      ? 'mf-chip-group--compact'
      : variant === 'bare'
      ? 'mf-chip-group--bare'
      : '';

  return (
    <div
      className={`mf-8-menu-chip-group mf-chip-group ${containerVariantClass} ${
        nowrap ? 'mf-chip-group--nowrap' : ''
      } ${className}`.trim()}
      role="listbox"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={isActive}
            title={item.title || item.label}
            onClick={() => {
              soundFX.playClick();
              onSelect(item.id);
            }}
            className={`mf-8-menu-chip-group__chip mf-chip ${
              size === 'sm' ? 'mf-chip--sm' : ''
            } ${
              isActive ? 'mf-8-menu-chip-group__chip--active mf-chip--active' : ''
            } ${chipClassName}`.trim()}
          >
            {typeof item.icon === 'string' ? (
              <Icon
                name={item.icon as IconName}
                className="w-3.5 h-3.5 shrink-0 transition-colors"
                style={
                  !isActive && item.iconColor
                    ? { color: item.iconColor }
                    : undefined
                }
              />
            ) : (
              item.icon
            )}

            {item.shortLabel ? (
              <>
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </>
            ) : (
              <span>{item.label}</span>
            )}

            {item.badge !== undefined && item.badge !== '' && (
              <span className="mf-chip__badge font-mono tabular-nums">{item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default MoxenChipGroup;
