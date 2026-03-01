/**
 * Vinosmith data fetchers — server-only (never import in client components)
 * Base URL: https://vinosmith.com/ext/exports/rep/{UUID}/{filename}
 */

import { unstable_cache } from 'next/cache';
import * as XLSX from 'xlsx';

const BASE = () => `https://vinosmith.com/ext/exports/rep/${process.env.VINOSMITH_UUID ?? ''}`;

async function fetchXlsx(filename: string): Promise<unknown[][]> {
  if (!process.env.VINOSMITH_UUID) throw new Error('VINOSMITH_UUID not set');
  const url = `${BASE()}/${filename}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Vinosmith ${filename}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(Buffer.from(buf), { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' }) as unknown[][];
}

async function fetchCsv(filename: string): Promise<unknown[][]> {
  if (!process.env.VINOSMITH_UUID) throw new Error('VINOSMITH_UUID not set');
  const url = `${BASE()}/${filename}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Vinosmith ${filename}: HTTP ${res.status}`);
  const text = await res.text();
  // Parse CSV with quoted fields
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let cell = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cells.push(cell); cell = ''; }
      else { cell += ch; }
    }
    cells.push(cell);
    return cells.map((c) => c.trim());
  });
}

// wine_properties.csv — full catalog metadata (farming flags, varietals, tasting notes)
export const getWinePropertiesRows = unstable_cache(
  () => fetchCsv('wine_properties.csv'),
  ['vino-wine-props'],
  { revalidate: 3600 }
);

// inventory_detailed.xlsx — active wine list with pricing + availability (RB1)
export const getRb1Rows = unstable_cache(
  () => fetchXlsx('inventory_detailed.xlsx'),
  ['vino-rb1'],
  { revalidate: 3600 }
);

// ra21 — top wines by sales (rank badges)
export const getRa21Rows = unstable_cache(
  () => fetchXlsx('ra21'),
  ['vino-ra21'],
  { revalidate: 3600 }
);

// ra30 — new placements
export const getRa30Rows = unstable_cache(
  () => fetchXlsx('ra30'),
  ['vino-ra30'],
  { revalidate: 3600 }
);
