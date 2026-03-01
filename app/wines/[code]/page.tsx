import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getWineByCode } from '@/lib/buildCatalog';
import { WineTypeBadge } from '@/components/WineTypeBadge';
import { TechSheetButton } from '@/components/TechSheetButton';

// On-demand ISR: pages rendered on first visit, cached 1 hour
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // pre-build nothing; render on demand
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const wine = await getWineByCode(decodeURIComponent(code));
  if (!wine) return { title: 'Wine Not Found' };
  return {
    title: `${wine.name || wine.fullName} — Chausse Selections`,
    description: `${wine.producer} · ${wine.country} · ${wine.wineType}`,
  };
}

export default async function WineDetailPage({ params }: PageProps) {
  const { code } = await params;
  const wine = await getWineByCode(decodeURIComponent(code));
  if (!wine) notFound();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.85rem', color: '#78716C', marginBottom: '1.5rem' }}>
        <Link href="/wines" style={{ color: '#8B4513', textDecoration: 'none' }}>Wines</Link>
        {' / '}
        {wine.producer}
      </nav>

      {/* Type badge + new arrival */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <WineTypeBadge type={wine.wineType} />
        {wine.isNewArrival && (
          <span style={{
            backgroundColor: '#D1FAE5', color: '#065F46',
            fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 8px', borderRadius: '4px',
          }}>New Arrival</span>
        )}
        {wine.rank !== null && (
          <span style={{
            backgroundColor: '#FEF3C7', color: '#92400E',
            fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 8px', borderRadius: '4px',
          }}>#{wine.rank} Top Wine</span>
        )}
      </div>

      {/* Wine name */}
      <h1 style={{
        fontFamily: 'var(--font-playfair), serif',
        fontSize: '2rem',
        fontWeight: 700,
        color: '#1C1917',
        lineHeight: 1.2,
        marginBottom: '0.25rem',
      }}>
        {wine.name || wine.fullName}
        {wine.vintage && (
          <span style={{ color: '#78716C', fontWeight: 400, fontSize: '1.5rem' }}> {wine.vintage}</span>
        )}
      </h1>

      {/* Producer link */}
      <Link
        href={`/producers/${wine.producerSlug}`}
        style={{ color: '#8B4513', fontSize: '1.1rem', fontWeight: 500, textDecoration: 'none' }}
      >
        {wine.producer}
      </Link>

      {/* Specs grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
        margin: '2rem 0',
        backgroundColor: '#fff',
        border: '1px solid #E7E5E4',
        borderRadius: '8px',
        padding: '1.5rem',
      }}>
        <SpecItem label="Country" value={wine.country} />
        <SpecItem label="Region" value={wine.region} />
        <SpecItem label="Varietal" value={wine.varietal} />
        <SpecItem label="Vintage" value={wine.vintage} />
        {wine.bottlePrice > 0 && (
          <SpecItem label="Bottle Price" value={`$${wine.bottlePrice.toFixed(2)}`} highlight />
        )}
      </div>

      {/* Farming */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {wine.isNatural && <FarmingTag label="Natural" color="#6B8C5E" />}
        {wine.isBiodynamic && <FarmingTag label="Biodynamic" color="#6B8C5E" />}
        {wine.isDirect && <FarmingTag label="Direct Import" color="#B8963E" />}
      </div>

      {/* Tech sheet */}
      <TechSheetButton wine={wine} />

      {/* Full name (if different from parsed name) */}
      {wine.fullName !== wine.name && wine.fullName && (
        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#78716C' }}>
          Full name: {wine.fullName}
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#78716C', fontWeight: 500, marginBottom: '2px' }}>{label}</div>
      <div style={{
        fontSize: '0.95rem',
        fontWeight: 600,
        color: highlight ? '#8B4513' : '#1C1917',
      }}>{value}</div>
    </div>
  );
}

function FarmingTag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.8rem',
      fontWeight: 600,
      color,
      border: `1px solid ${color}`,
      borderRadius: '4px',
      padding: '3px 8px',
    }}>
      {label}
    </span>
  );
}
