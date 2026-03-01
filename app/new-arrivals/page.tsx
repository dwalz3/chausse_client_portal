import Link from 'next/link';
import { getAllWines } from '@/lib/buildCatalog';
import { WineCard } from '@/components/WineCard';
import newArrivalsData from '@/data/new-arrivals.json';
import { NewArrivalEntry } from '@/types';

export const revalidate = 3600;

export const metadata = {
  title: 'New Arrivals — Chausse Selections',
  description: 'The latest additions to the Chausse Selections portfolio.',
};

export default async function NewArrivalsPage() {
  const allWines = await getAllWines();
  const manualEntries = newArrivalsData as NewArrivalEntry[];

  // Build a map of manual arrival dates by code (normalized)
  const manualMap = new Map(
    manualEntries.map((e) => [e.code.trim().toUpperCase(), e])
  );

  // All wines flagged as new arrivals (from RA30)
  const newWines = allWines.filter((w) => w.isNewArrival || manualMap.has(w.code.trim().toUpperCase()));

  // Sort: manual entries first (by arrivedAt desc), then RA30 arrivals
  newWines.sort((a, b) => {
    const aEntry = manualMap.get(a.code.trim().toUpperCase());
    const bEntry = manualMap.get(b.code.trim().toUpperCase());
    if (aEntry && bEntry) {
      return new Date(bEntry.arrivedAt).getTime() - new Date(aEntry.arrivedAt).getTime();
    }
    if (aEntry) return -1;
    if (bEntry) return 1;
    return 0;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.85rem', color: '#78716C', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#8B4513', textDecoration: 'none' }}>Home</Link>
        {' / '}
        New Arrivals
      </nav>

      <h1 style={{
        fontFamily: 'var(--font-playfair), serif',
        fontSize: '2rem',
        fontWeight: 700,
        color: '#1C1917',
        marginBottom: '0.5rem',
      }}>
        New Arrivals
      </h1>
      <p style={{ color: '#78716C', marginBottom: '2rem', fontSize: '0.95rem' }}>
        {newWines.length === 0
          ? 'Check back soon for new additions to the portfolio.'
          : `${newWines.length} recent additions to the portfolio`}
      </p>

      {newWines.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem',
          color: '#78716C',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #E7E5E4',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🍷</div>
          <div>More wines coming soon.</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {newWines.map((wine) => {
            const entry = manualMap.get(wine.code.trim().toUpperCase());
            return (
              <div key={wine.code}>
                <WineCard wine={wine} showNewBadge />
                {entry?.note && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#78716C',
                    fontStyle: 'italic',
                    padding: '0.5rem 0.25rem 0',
                  }}>
                    {entry.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
