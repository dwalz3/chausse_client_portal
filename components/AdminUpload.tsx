'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { CatalogWine } from '@/types';
import { WineCard } from './WineCard';

const STORAGE_KEY = 'chausse_rb1_override';
const PASS_KEY = 'chausse_admin_auth';

interface AdminUploadProps {
  adminPass: string; // passed from server (NEXT_PUBLIC_ADMIN_PASS)
}

export function AdminUpload({ adminPass }: AdminUploadProps) {
  const [authed, setAuthed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PASS_KEY) === adminPass;
  });
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);

  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [wines, setWines] = useState<CatalogWine[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [hasOverride, setHasOverride] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEY);
  });

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passInput === adminPass) {
      localStorage.setItem(PASS_KEY, adminPass);
      setAuthed(true);
    } else {
      setPassError(true);
    }
  }

  async function parseFile(file: File) {
    setStatus('parsing');
    setErrorMsg('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });

      // Try "Inventory" sheet first, fall back to first sheet
      const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === 'inventory') ?? wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Dynamically import the parser (avoids bundling server code)
      const { parseRb1FromRows } = await import('@/parsers/rb1Parser');
      const { slugify } = await import('@/lib/slugify');
      const rb1Rows = parseRb1FromRows(raw);

      if (rb1Rows.length === 0) {
        setErrorMsg('No active wines found. Check the file has an "Inventory" sheet with a "Status" column.');
        setStatus('error');
        return;
      }

      // Convert Rb1Row → CatalogWine (no farming flags from this source alone)
      const parsed: CatalogWine[] = rb1Rows.map((rb1) => ({
        code: rb1.wineCode,
        name: rb1.name,
        fullName: rb1.name,
        producer: rb1.producer,
        producerSlug: slugify(rb1.producer),
        importer: rb1.importer,
        country: rb1.country,
        region: rb1.appellation || rb1.region,
        wineType: rb1.wineType,
        varietal: rb1.varietal,
        vintage: rb1.vintage,
        bottlePrice: rb1.bottlePrice,
        availableQty: rb1.availableQty,
        isNatural: false,
        isBiodynamic: false,
        isDirect: rb1.importer.toLowerCase().includes('chausse'),
        isNewArrival: false,
        rank: null,
      }));

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setHasOverride(true);
      setWines(parsed);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Parse failed');
      setStatus('error');
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  function clearOverride() {
    localStorage.removeItem(STORAGE_KEY);
    setHasOverride(false);
    setWines([]);
    setStatus('idle');
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: '360px', margin: '4rem auto', padding: '2rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#8B4513',
          marginBottom: '1.5rem',
        }}>
          Admin Access
        </h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="password"
            value={passInput}
            onChange={(e) => { setPassInput(e.target.value); setPassError(false); }}
            placeholder="Password"
            style={{
              padding: '0.6rem 0.75rem',
              border: passError ? '1px solid #991B1B' : '1px solid #D6D3D1',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          />
          {passError && <p style={{ fontSize: '0.8rem', color: '#991B1B' }}>Incorrect password</p>}
          <button
            type="submit"
            style={{
              padding: '0.6rem 1rem',
              backgroundColor: '#8B4513',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#1C1917',
          }}>
            Catalog Upload
          </h1>
          <p style={{ color: '#78716C', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Upload an RB1 XLSX to preview or override the live catalog data.
          </p>
        </div>
        {hasOverride && (
          <button
            onClick={clearOverride}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #E7E5E4',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#78716C',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Clear Override
          </button>
        )}
      </div>

      {/* Override banner */}
      {hasOverride && status !== 'done' && (
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#92400E',
        }}>
          Active override in localStorage — catalog pages are showing uploaded data. Upload a new file or click &quot;Clear Override&quot; to revert to live Vinosmith data.
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        style={{
          border: `2px dashed ${isDragging ? '#8B4513' : '#D6D3D1'}`,
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: isDragging ? '#FFF7F5' : '#fff',
          transition: 'all 0.15s ease',
          marginBottom: '2rem',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('rb1-upload')?.click()}
      >
        <input
          id="rb1-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        {status === 'parsing' ? (
          <p style={{ color: '#78716C' }}>Parsing file...</p>
        ) : (
          <>
            <p style={{ color: '#44403C', fontWeight: 500, marginBottom: '0.5rem' }}>
              Drop RB1 XLSX here, or click to select
            </p>
            <p style={{ color: '#78716C', fontSize: '0.85rem' }}>
              Expects the Vinosmith Inventory export (sheet: &quot;Inventory&quot;)
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {status === 'error' && (
        <div style={{
          backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '6px',
          padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#991B1B', fontSize: '0.875rem',
        }}>
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {status === 'done' && wines.length > 0 && (
        <>
          <div style={{
            backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '6px',
            padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#065F46', fontSize: '0.875rem',
          }}>
            Loaded {wines.length} active wines from RB1. Override saved to localStorage — catalog pages will show this data.
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1rem',
          }}>
            {wines.map((wine) => (
              <WineCard key={wine.code} wine={wine} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
