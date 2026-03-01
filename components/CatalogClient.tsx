'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Fuse from 'fuse.js';
import { CatalogWine, WineType } from '@/types';
import { WINE_TYPE_COLORS } from '@/lib/wineTypeColors';

const WINE_TYPES: WineType[] = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange', 'Vermouth', 'Tea/NA', 'Other'];
const STORAGE_KEY = 'chausse_rb1_override';

type SortKey = 'name' | 'bottlePrice' | 'availableQty' | 'country' | 'region' | 'wineType' | 'producer' | 'importer';
type SortDir = 'asc' | 'desc';

// Deterministic pastel chip color from string value
const CHIP_PALETTE = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FFEDD5', text: '#9A3412' },
  { bg: '#CCFBF1', text: '#134E4A' },
  { bg: '#F0F9FF', text: '#075985' },
];

function chipColor(val: string) {
  let h = 0;
  for (let i = 0; i < val.length; i++) h = ((h << 5) - h + val.charCodeAt(i)) | 0;
  return CHIP_PALETTE[Math.abs(h) % CHIP_PALETTE.length];
}

function Chip({ value }: { value: string }) {
  if (!value) return <span style={{ color: '#78716C', fontSize: '0.78rem' }}>—</span>;
  const c = chipColor(value);
  return (
    <span style={{
      backgroundColor: c.bg,
      color: c.text,
      fontSize: '0.72rem',
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: '999px',
      whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>
      {value}
    </span>
  );
}

interface CatalogClientProps {
  wines: CatalogWine[];
}

export function CatalogClient({ wines: serverWines }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // localStorage override (admin upload)
  const [wines, setWines] = useState<CatalogWine[]>(serverWines);
  const [hasOverride, setHasOverride] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const override = JSON.parse(raw) as CatalogWine[];
        if (override.length > 0) { setWines(override); setHasOverride(true); }
      }
    } catch { /* ignore */ }
  }, []);

  // Filter state
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [selectedType, setSelectedType] = useState<WineType | ''>((searchParams.get('type') ?? '') as WineType | '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') ?? '');
  const [farmingFilter, setFarmingFilter] = useState<'natural' | 'biodynamic' | 'direct' | ''>('');

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedType) params.set('type', selectedType);
    if (selectedCountry) params.set('country', selectedCountry);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [query, selectedType, selectedCountry, pathname, router]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const countries = useMemo(() => Array.from(new Set(wines.map(w => w.country).filter(Boolean))).sort(), [wines]);

  const fuse = useMemo(() => new Fuse(wines, {
    keys: ['fullName', 'name', 'producer', 'country', 'varietal', 'region'],
    threshold: 0.35,
  }), [wines]);

  const filtered = useMemo(() => {
    let result = query ? fuse.search(query).map(r => r.item) : [...wines];
    if (selectedType) result = result.filter(w => w.wineType === selectedType);
    if (selectedCountry) result = result.filter(w => w.country === selectedCountry);
    if (farmingFilter === 'natural') result = result.filter(w => w.isNatural);
    else if (farmingFilter === 'biodynamic') result = result.filter(w => w.isBiodynamic);
    else if (farmingFilter === 'direct') result = result.filter(w => w.isDirect);
    return result;
  }, [query, selectedType, selectedCountry, farmingFilter, wines, fuse]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'name':      av = a.fullName; bv = b.fullName; break;
        case 'bottlePrice': av = a.bottlePrice; bv = b.bottlePrice; break;
        case 'availableQty': av = a.availableQty; bv = b.availableQty; break;
        case 'country':   av = a.country; bv = b.country; break;
        case 'region':    av = a.region; bv = b.region; break;
        case 'wineType':  av = a.wineType; bv = b.wineType; break;
        case 'producer':  av = a.producer; bv = b.producer; break;
        case 'importer':  av = a.importer; bv = b.importer; break;
      }
      const cmp = typeof av === 'number'
        ? av - (bv as number)
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const hasFilters = query || selectedType || selectedCountry || farmingFilter;

  function SortArrow({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ color: '#C4B5A5', marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: '#8B4513', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const thStyle = (col: SortKey): React.CSSProperties => ({
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#78716C',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid #E7E5E4',
    backgroundColor: '#F5F5F2',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  });

  return (
    <div>
      {/* Override banner */}
      {hasOverride && (
        <div style={{
          backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '6px',
          padding: '0.5rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#92400E',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Showing uploaded RB1 data · {wines.length} wines</span>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setWines(serverWines); setHasOverride(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontWeight: 700, fontSize: '0.8rem' }}>
            Revert to live ×
          </button>
        </div>
      )}

      {/* Search + dropdowns */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search wines, producers, varietals..."
          style={{
            flex: '1 1 220px', padding: '0.45rem 0.75rem',
            border: '1px solid #D6D3D1', borderRadius: '6px',
            fontSize: '0.875rem', backgroundColor: '#fff', color: '#1C1917',
          }}
        />
        <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
          style={{ padding: '0.45rem 0.65rem', border: '1px solid #D6D3D1', borderRadius: '6px', fontSize: '0.875rem', backgroundColor: '#fff', color: selectedCountry ? '#1C1917' : '#78716C' }}>
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={farmingFilter} onChange={e => setFarmingFilter(e.target.value as typeof farmingFilter)}
          style={{ padding: '0.45rem 0.65rem', border: '1px solid #D6D3D1', borderRadius: '6px', fontSize: '0.875rem', backgroundColor: '#fff', color: farmingFilter ? '#1C1917' : '#78716C' }}>
          <option value="">All Farming</option>
          <option value="natural">Natural / Organic</option>
          <option value="biodynamic">Biodynamic</option>
          <option value="direct">Direct Import</option>
        </select>
        {hasFilters && (
          <button onClick={() => { setQuery(''); setSelectedType(''); setSelectedCountry(''); setFarmingFilter(''); }}
            style={{ padding: '0.45rem 0.75rem', border: '1px solid #E7E5E4', borderRadius: '6px', fontSize: '0.82rem', background: 'transparent', color: '#78716C', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Type pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
        {WINE_TYPES.map(type => (
          <button key={type} onClick={() => setSelectedType(selectedType === type ? '' : type)}
            style={{
              padding: '0.25rem 0.75rem', borderRadius: '999px', cursor: 'pointer',
              border: selectedType === type ? `2px solid ${WINE_TYPE_COLORS[type].text}` : '1px solid #D6D3D1',
              backgroundColor: selectedType === type ? WINE_TYPE_COLORS[type].bg : '#fff',
              color: selectedType === type ? WINE_TYPE_COLORS[type].text : '#44403C',
              fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.1s',
            }}>
            {type}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: '0.8rem', color: '#78716C', marginBottom: '0.5rem' }}>
        {sorted.length} {sorted.length === 1 ? 'wine' : 'wines'}{hasFilters ? ' matching' : ''}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #E7E5E4', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle('name'), width: '32px', textAlign: 'center', paddingLeft: '6px', cursor: 'default' }}>#</th>
              <th style={{ ...thStyle('name'), minWidth: '320px' }} onClick={() => toggleSort('name')}>
                Name <SortArrow col="name" />
              </th>
              <th style={{ ...thStyle('bottlePrice'), width: '80px' }} onClick={() => toggleSort('bottlePrice')}>
                Price <SortArrow col="bottlePrice" />
              </th>
              <th style={{ ...thStyle('availableQty'), width: '64px' }} onClick={() => toggleSort('availableQty')}>
                Avail <SortArrow col="availableQty" />
              </th>
              <th style={{ ...thStyle('wineType'), width: '90px' }} onClick={() => toggleSort('wineType')}>
                Type <SortArrow col="wineType" />
              </th>
              <th style={{ ...thStyle('importer'), width: '160px' }} onClick={() => toggleSort('importer')}>
                Importer <SortArrow col="importer" />
              </th>
              <th style={{ ...thStyle('region'), width: '140px' }} onClick={() => toggleSort('region')}>
                Region <SortArrow col="region" />
              </th>
              <th style={{ ...thStyle('country'), width: '90px' }} onClick={() => toggleSort('country')}>
                Country <SortArrow col="country" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#78716C' }}>
                  No wines match your filters.
                </td>
              </tr>
            ) : (
              sorted.map((wine, idx) => {
                const typeColor = WINE_TYPE_COLORS[wine.wineType];
                return (
                  <tr
                    key={wine.code}
                    onClick={() => router.push(`/wines/${encodeURIComponent(wine.code)}`)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #F5F5F0' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FBF9F7')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    {/* Row number */}
                    <td style={{ padding: '7px 6px', textAlign: 'center', color: '#C4B5A5', fontSize: '0.72rem', verticalAlign: 'middle' }}>
                      {idx + 1}
                    </td>
                    {/* Name — with left type-color border */}
                    <td style={{
                      padding: '7px 10px',
                      borderLeft: `3px solid ${typeColor.text}`,
                      verticalAlign: 'middle',
                      lineHeight: 1.3,
                    }}>
                      <span style={{ color: '#1C1917', fontWeight: 500 }}>{wine.fullName}</span>
                      {wine.isNewArrival && (
                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', fontWeight: 700, color: '#065F46', backgroundColor: '#D1FAE5', padding: '1px 5px', borderRadius: '3px' }}>New</span>
                      )}
                      {wine.rank !== null && wine.rank <= 20 && (
                        <span style={{ marginLeft: '4px', fontSize: '0.65rem', fontWeight: 700, color: '#92400E', backgroundColor: '#FEF3C7', padding: '1px 5px', borderRadius: '3px' }}>#{wine.rank}</span>
                      )}
                    </td>
                    {/* Price */}
                    <td style={{ padding: '7px 10px', verticalAlign: 'middle', color: wine.bottlePrice > 0 ? '#1C1917' : '#C4B5A5', fontWeight: wine.bottlePrice > 0 ? 600 : 400, whiteSpace: 'nowrap' }}>
                      {wine.bottlePrice > 0 ? `$${wine.bottlePrice.toFixed(2)}` : '—'}
                    </td>
                    {/* Available */}
                    <td style={{ padding: '7px 10px', verticalAlign: 'middle', textAlign: 'right', color: wine.availableQty > 0 ? '#1C1917' : '#C4B5A5', fontWeight: 500 }}>
                      {wine.availableQty > 0 ? wine.availableQty : '0'}
                    </td>
                    {/* Type */}
                    <td style={{ padding: '7px 10px', verticalAlign: 'middle' }}>
                      <span style={{
                        backgroundColor: typeColor.bg, color: typeColor.text,
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: '3px',
                      }}>
                        {wine.wineType}
                      </span>
                    </td>
                    {/* Importer */}
                    <td style={{ padding: '7px 10px', verticalAlign: 'middle' }}>
                      <Chip value={wine.importer} />
                    </td>
                    {/* Region */}
                    <td style={{ padding: '7px 10px', verticalAlign: 'middle' }}>
                      <Chip value={wine.region} />
                    </td>
                    {/* Country */}
                    <td style={{ padding: '7px 10px', verticalAlign: 'middle' }}>
                      <Chip value={wine.country} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
