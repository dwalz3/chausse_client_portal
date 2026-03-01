import { Suspense } from 'react';
import { getAllWines } from '@/lib/buildCatalog';
import { CatalogClient } from '@/components/CatalogClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Our Wines — Chausse Selections',
  description: 'Browse the full Chausse Selections wine catalog.',
};

export default async function WinesPage() {
  const wines = await getAllWines();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{
        fontFamily: 'var(--font-playfair), serif',
        fontSize: '2rem',
        fontWeight: 700,
        color: '#1C1917',
        marginBottom: '0.5rem',
      }}>
        Our Wines
      </h1>
      <p style={{ color: '#78716C', marginBottom: '2rem', fontSize: '0.95rem' }}>
        {wines.length} wines in the portfolio
      </p>
      <Suspense fallback={<div style={{ color: '#78716C' }}>Loading catalog...</div>}>
        <CatalogClient wines={wines} />
      </Suspense>
    </div>
  );
}
