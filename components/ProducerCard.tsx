import Link from 'next/link';
import { CatalogProducer } from '@/types';

interface ProducerCardProps {
  producer: CatalogProducer;
}

export function ProducerCard({ producer }: ProducerCardProps) {
  return (
    <Link
      href={`/producers/${producer.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #E7E5E4',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
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
        {/* Producer name */}
        <div style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '1.05rem',
          fontWeight: 600,
          color: '#1C1917',
          lineHeight: 1.3,
        }}>
          {producer.name}
        </div>

        {/* Country / region */}
        <div style={{ fontSize: '0.8rem', color: '#78716C' }}>
          {[producer.country, producer.region].filter(Boolean).join(' · ')}
        </div>

        {/* Direct import badge */}
        {producer.isDirect && (
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: '#B8963E',
            border: '1px solid #B8963E',
            borderRadius: '3px',
            padding: '1px 5px',
            letterSpacing: '0.04em',
            display: 'inline-block',
            width: 'fit-content',
          }}>
            Direct Import
          </span>
        )}

        {/* Wine count */}
        <div style={{ fontSize: '0.8rem', color: '#78716C', marginTop: '0.25rem' }}>
          {producer.wineCount} {producer.wineCount === 1 ? 'wine' : 'wines'}
        </div>
      </div>
    </Link>
  );
}
