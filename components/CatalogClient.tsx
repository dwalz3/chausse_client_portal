'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Fuse from 'fuse.js';
import { CatalogWine, WineType } from '@/types';
import { WineCard } from './WineCard';

const WINE_TYPES: WineType[] = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange', 'Vermouth', 'Tea/NA', 'Other'];

interface CatalogClientProps {
  wines: CatalogWine[];
}

const STORAGE_KEY = 'chausse_rb1_override';

export function CatalogClient({ wines: serverWines }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Check localStorage for admin-uploaded RB1 override
  const [wines, setWines] = useState<CatalogWine[]>(serverWines);
  const [hasOverride, setHasOverride] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const overrideWines = JSON.parse(raw) as CatalogWine[];
        if (overrideWines.length > 0) {
          setWines(overrideWines);
          setHasOverride(true);
        }
      } catch {
        // ignore malformed data
      }
    }
  }, []);

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [selectedType, setSelectedType] = useState<WineType | ''>(
    (searchParams.get('type') ?? '') as WineType | ''
  );
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') ?? '');
  const [farmingFilter, setFarmingFilter] = useState<'natural' | 'biodynamic' | 'direct' | ''>('');

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedType) params.set('type', selectedType);
    if (selectedCountry) params.set('country', selectedCountry);
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [query, selectedType, selectedCountry, pathname, router]);

  // Country list
  const countries = useMemo(() => {
    const set = new Set(wines.map((w) => w.country).filter(Boolean));
    return Array.from(set).sort();
  }, [wines]);

  // Fuse.js instance
  const fuse = useMemo(() => new Fuse(wines, {
    keys: ['name', 'fullName', 'producer', 'country', 'varietal'],
    threshold: 0.35,
    includeScore: true,
  }), [wines]);

  // Filtered wines
  const filtered = useMemo(() => {
    let result: CatalogWine[] = query
      ? fuse.search(query).map((r) => r.item)
      : [...wines];

    if (selectedType) {
      result = result.filter((w) => w.wineType === selectedType);
    }
    if (selectedCountry) {
      result = result.filter((w) => w.country === selectedCountry);
    }
    if (farmingFilter === 'natural') {
      result = result.filter((w) => w.isNatural);
    } else if (farmingFilter === 'biodynamic') {
      result = result.filter((w) => w.isBiodynamic);
    } else if (farmingFilter === 'direct') {
      result = result.filter((w) => w.isDirect);
    }
    return result;
  }, [query, selectedType, selectedCountry, farmingFilter, wines, fuse]);

  function clearFilters() {
    setQuery('');
    setSelectedType('');
    setSelectedCountry('');
    setFarmingFilter('');
  }

  const hasFilters = query || selectedType || selectedCountry || farmingFilter;

  return (
    <div>
      {/* Override banner */}
      {hasOverride && (
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '6px',
          padding: '0.6rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: '#92400E',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>Showing uploaded RB1 data ({wines.length} wines)</span>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setWines(serverWines); setHasOverride(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontWeight: 600, fontSize: '0.8rem' }}
          >
            Revert to live ×
          </button>
        </div>
      )}

      {/* Search + filter bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        alignItems: 'center',
      }}>
        {/* Search input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wines, producers, varietals..."
          style={{
            flex: '1 1 240px',
            padding: '0.5rem 0.75rem',
            border: '1px solid #D6D3D1',
            borderRadius: '6px',
            fontSize: '0.9rem',
            backgroundColor: '#fff',
            color: '#1C1917',
            outline: 'none',
          }}
        />

        {/* Country dropdown */}
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #D6D3D1',
            borderRadius: '6px',
            fontSize: '0.9rem',
            backgroundColor: '#fff',
            color: selectedCountry ? '#1C1917' : '#78716C',
            cursor: 'pointer',
          }}
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Farming toggle */}
        <select
          value={farmingFilter}
          onChange={(e) => setFarmingFilter(e.target.value as typeof farmingFilter)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #D6D3D1',
            borderRadius: '6px',
            fontSize: '0.9rem',
            backgroundColor: '#fff',
            color: farmingFilter ? '#1C1917' : '#78716C',
            cursor: 'pointer',
          }}
        >
          <option value="">All Farming</option>
          <option value="natural">Natural</option>
          <option value="biodynamic">Biodynamic</option>
          <option value="direct">Direct Import</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #E7E5E4',
              borderRadius: '6px',
              fontSize: '0.85rem',
              backgroundColor: 'transparent',
              color: '#78716C',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Type pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1.5rem',
      }}>
        {WINE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? '' : type)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: selectedType === type ? '2px solid #8B4513' : '1px solid #D6D3D1',
              backgroundColor: selectedType === type ? '#8B4513' : '#fff',
              color: selectedType === type ? '#fff' : '#44403C',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.1s ease',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: '0.85rem', color: '#78716C', marginBottom: '1rem' }}>
        {filtered.length} {filtered.length === 1 ? 'wine' : 'wines'}
        {hasFilters ? ' matching filters' : ' in portfolio'}
      </div>

      {/* Wine grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#78716C' }}>
          No wines found. Try adjusting your search or filters.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map((wine) => (
            <WineCard key={wine.code} wine={wine} />
          ))}
        </div>
      )}
    </div>
  );
}
