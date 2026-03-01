export const revalidate = 3600;

import Link from 'next/link';
import {
  getAllWines,
  getAllProducers,
  getFeaturedWines,
  getNewArrivalWines,
} from '@/lib/buildCatalog';
import { WineCard } from '@/components/WineCard';
import { WineTypeBadge } from '@/components/WineTypeBadge';
import featuredData from '@/data/featured.json';
import { WineType } from '@/types';

const WINE_TYPES: WineType[] = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange', 'Vermouth', 'Tea/NA'];

export default async function HomePage() {
  const [allWines, producers, featuredWines, newArrivals] = await Promise.all([
    getAllWines(),
    getAllProducers(),
    getFeaturedWines(featuredData as string[]),
    getNewArrivalWines(),
  ]);

  const countries = new Set(allWines.map((w) => w.country).filter(Boolean));

  const latestArrivals = newArrivals.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section style={{
        backgroundColor: '#8B4513',
        color: '#fff',
        padding: '5rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}>
            Chausse Selections
          </h1>
          <p style={{
            fontSize: '1.1rem',
            opacity: 0.88,
            marginBottom: '2rem',
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: '0 auto 2rem',
          }}>
            Curated natural, biodynamic &amp; direct-import wines for discerning trade buyers.
          </p>
          <Link
            href="/wines"
            style={{
              display: 'inline-block',
              backgroundColor: '#B8963E',
              color: '#fff',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            Browse Wines →
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #E7E5E4',
        padding: '1rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '3rem',
          flexWrap: 'wrap',
          fontSize: '0.95rem',
          color: '#44403C',
        }}>
          <StatItem value={allWines.length} label="wines" />
          <StatItem value={producers.length} label="producers" />
          <StatItem value={countries.size} label="countries" />
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Browse by Type */}
        <section style={{ marginBottom: '3.5rem' }}>
          <SectionHeader title="Browse by Type" href="/wines" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {WINE_TYPES.map((type) => (
              <Link
                key={type}
                href={`/wines?type=${encodeURIComponent(type)}`}
                style={{ textDecoration: 'none' }}
              >
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  border: '1px solid #D6D3D1',
                  backgroundColor: '#fff',
                  fontSize: '0.9rem',
                  color: '#44403C',
                  fontWeight: 500,
                  cursor: 'pointer',
                  gap: '0.4rem',
                  transition: 'border-color 0.15s',
                }}>
                  <WineTypeBadge type={type} size="sm" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Wines */}
        {featuredWines.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <SectionHeader title="Featured Wines" href="/wines" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
            }}>
              {featuredWines.map((wine) => (
                <WineCard key={wine.code} wine={wine} />
              ))}
            </div>
          </section>
        )}

        {/* New to the Portfolio */}
        {latestArrivals.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <SectionHeader title="New to the Portfolio" href="/new-arrivals" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
            }}>
              {latestArrivals.map((wine) => (
                <WineCard key={wine.code} wine={wine} showNewBadge />
              ))}
            </div>
            {newArrivals.length > 4 && (
              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <Link
                  href="/new-arrivals"
                  style={{
                    color: '#8B4513',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                  }}
                >
                  View all {newArrivals.length} new arrivals →
                </Link>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span style={{ fontWeight: 700, color: '#8B4513', fontSize: '1.15rem' }}>{value}</span>
      {' '}
      <span style={{ color: '#78716C' }}>{label}</span>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: '1.25rem',
    }}>
      <h2 style={{
        fontFamily: 'var(--font-playfair), serif',
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#1C1917',
      }}>
        {title}
      </h2>
      <Link href={href} style={{ fontSize: '0.85rem', color: '#8B4513', textDecoration: 'none', fontWeight: 500 }}>
        View all →
      </Link>
    </div>
  );
}
