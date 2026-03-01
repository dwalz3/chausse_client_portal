/**
 * Vinosmith data fetchers — server-only (never import in client components)
 * Each report is cached with hourly ISR via unstable_cache.
 */

import { unstable_cache } from 'next/cache';
import * as XLSX from 'xlsx';

async function fetchXlsx(reportCode: string): Promise<unknown[][]> {
  const uuid = process.env.VINOSMITH_UUID;
  if (!uuid) throw new Error('VINOSMITH_UUID env var is not set');

  const url = `https://cloud.vinosmith.com/api/v1/reports/${reportCode}/export?uuid=${uuid}&format=xlsx`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Vinosmith ${reportCode}: HTTP ${res.status}`);

  const buf = await res.arrayBuffer();
  const wb = XLSX.read(Buffer.from(buf), { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
}

export const getWinePropertiesRows = unstable_cache(
  () => fetchXlsx('wine-properties'),
  ['vino-wine-props'],
  { revalidate: 3600 }
);

export const getRa21Rows = unstable_cache(
  () => fetchXlsx('ra21'),
  ['vino-ra21'],
  { revalidate: 3600 }
);

export const getRa30Rows = unstable_cache(
  () => fetchXlsx('ra30'),
  ['vino-ra30'],
  { revalidate: 3600 }
);
