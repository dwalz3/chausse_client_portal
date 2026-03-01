import Link from 'next/link';
import { CatalogWine } from '@/types';
import { WineTypeBadge } from './WineTypeBadge';

interface WineCardProps {
  wine: CatalogWine;
  showNewBadge?: boolean;
}

export function WineCard({ wine, showNewBadge }: WineCardProps) {
  const price = wine.bottlePrice > 0
    ? `$${wine.bottlePrice.toFixed(2)}`
    : null;

  return (
    <Link
      href={`/wines/${encodeURIComponent(wine.code)}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #E7E5E4',
        borderRadius: '8px',
        padding: '1.25rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          (e.currentTarget as HTMLDivElement).style.borderColor = '#B8963E';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLDivElement).style.borderColor = '#E7E5E4';
        }}
      >
        {/* Header row: type badge + new badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <WineTypeBadge type={wine.wineType} size="sm" />
          {(showNewBadge || wine.isNewArrival) && (
            <span style={{
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
            }}>New</span>
          )}
          {wine.rank !== null && wine.rank <= 10 && (
            <span style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
            }}>#{wine.rank}</span>
          )}
        </div>

        {/* Wine name */}
        <div style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#1C1917',
          lineHeight: 1.3,
          flexGrow: 1,
        }}>
          {wine.name || wine.fullName}
          {wine.vintage && (
            <span style={{ color: '#78716C', fontWeight: 400, fontSize: '0.9rem' }}> {wine.vintage}</span>
          )}
        </div>

        {/* Producer */}
        <div style={{ fontSize: '0.85rem', color: '#44403C', fontWeight: 500 }}>
          {wine.producer}
        </div>

        {/* Country / Region */}
        <div style={{ fontSize: '0.8rem', color: '#78716C' }}>
          {[wine.country, wine.region].filter(Boolean).join(' · ')}
        </div>

        {/* Farming badges */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {wine.isNatural && <FarmingBadge label="Natural" />}
          {wine.isBiodynamic && <FarmingBadge label="Biodynamic" />}
          {wine.isDirect && <FarmingBadge label="Direct" color="#B8963E" />}
        </div>

        {/* Price */}
        {price && (
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#8B4513', marginTop: '0.25rem' }}>
            {price} / bottle
          </div>
        )}
      </div>
    </Link>
  );
}

function FarmingBadge({ label, color = '#6B8C5E' }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: '0.65rem',
      fontWeight: 600,
      color,
      border: `1px solid ${color}`,
      borderRadius: '3px',
      padding: '1px 5px',
      letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  );
}
