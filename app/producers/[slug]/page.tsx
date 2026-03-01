import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProducerBySlug } from '@/lib/buildCatalog';
import { WineCard } from '@/components/WineCard';

// On-demand ISR: pages rendered on first visit, cached 1 hour
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // pre-build nothing; render on demand
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const producer = await getProducerBySlug(slug);
  if (!producer) return { title: 'Producer Not Found' };
  return {
    title: `${producer.name} — Chausse Selections`,
    description: `${producer.name} · ${producer.country} · ${producer.wineCount} wines`,
  };
}

export default async function ProducerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const producer = await getProducerBySlug(slug);
  if (!producer) notFound();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.85rem', color: '#78716C', marginBottom: '1.5rem' }}>
        <Link href="/producers" style={{ color: '#8B4513', textDecoration: 'none' }}>Producers</Link>
        {' / '}
        {producer.name}
      </nav>

      {/* Producer header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1C1917',
          }}>
            {producer.name}
          </h1>
          {producer.isDirect && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#B8963E',
              border: '1px solid #B8963E',
              borderRadius: '4px',
              padding: '3px 8px',
            }}>
              Direct Import
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#78716C' }}>
          {[producer.country, producer.region].filter(Boolean).join(' · ')}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#78716C', marginTop: '0.25rem' }}>
          {producer.wineCount} {producer.wineCount === 1 ? 'wine' : 'wines'} in portfolio
        </div>
      </div>

      {/* Wine grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1rem',
      }}>
        {producer.wines.map((wine) => (
          <WineCard key={wine.code} wine={wine} />
        ))}
      </div>
    </div>
  );
}
