import { WineType } from '@/types';
import { WINE_TYPE_COLORS } from '@/lib/wineTypeColors';

interface WineTypeBadgeProps {
  type: WineType;
  size?: 'sm' | 'md';
}

export function WineTypeBadge({ type, size = 'md' }: WineTypeBadgeProps) {
  const colors = WINE_TYPE_COLORS[type] ?? WINE_TYPE_COLORS['Other'];
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span style={{
      backgroundColor: colors.bg,
      color: colors.text,
      fontSize,
      fontWeight: 600,
      padding,
      borderRadius: '4px',
      letterSpacing: '0.03em',
      display: 'inline-block',
      lineHeight: '1.4',
    }}>
      {type}
    </span>
  );
}
