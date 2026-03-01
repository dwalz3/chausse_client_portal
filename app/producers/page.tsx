import { getAllProducers } from '@/lib/buildCatalog';
import { ProducerCard } from '@/components/ProducerCard';

export const revalidate = 3600;

export const metadata = {
  title: 'Producers — Chausse Selections',
  description: 'Meet the producers behind the Chausse Selections portfolio.',
};

export default async function ProducersPage() {
  const producers = await getAllProducers();

  // Group by country
  const byCountry = new Map<string, typeof producers>();
  for (const producer of producers) {
    const country = producer.country || 'Other';
    if (!byCountry.has(country)) byCountry.set(country, []);
    byCountry.get(country)!.push(producer);
  }
  const countries = Array.from(byCountry.keys()).sort();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{
        fontFamily: 'var(--font-playfair), serif',
        fontSize: '2rem',
        fontWeight: 700,
        color: '#1C1917',
        marginBottom: '0.5rem',
      }}>
        Producers
      </h1>
      <p style={{ color: '#78716C', marginBottom: '2rem', fontSize: '0.95rem' }}>
        {producers.length} producers across {countries.length} countries
      </p>

      {countries.map((country) => {
        const countryProducers = byCountry.get(country)!;
        return (
          <section key={country} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#44403C',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E7E5E4',
            }}>
              {country}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}>
              {countryProducers.map((producer) => (
                <ProducerCard key={producer.slug} producer={producer} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
