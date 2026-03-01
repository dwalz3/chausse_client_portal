/**
 * Pricing Parser — server-side (raw rows, no File API)
 * Columns: Wine Code, Default Price / Bottle Price
 */

import { PricingRow } from '@/types';

function norm(s: unknown): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findCol(headers: string[], ...keywords: string[]): number {
  for (const kw of keywords) {
    const idx = headers.findIndex((h) => h.includes(kw));
    if (idx !== -1) return idx;
  }
  return -1;
}

function toNum(val: unknown): number {
  if (val == null) return 0;
  // Strip currency symbols
  const s = String(val).replace(/[$,]/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function parsePricingFromRows(raw: unknown[][]): PricingRow[] {
  if (raw.length < 2) return [];

  const headers = (raw[0] as unknown[]).map(norm);
  const colCode = findCol(headers, 'wine code', 'item code', 'code', 'sku');
  const colPrice = findCol(headers, 'bottle price', 'default price', 'price', 'unit price', 'retail');

  if (colCode < 0) return [];

  const rows: PricingRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    const wineCode = colCode >= 0 ? String(r[colCode] ?? '').trim() : '';
    if (!wineCode) continue;

    const bottlePrice = colPrice >= 0 ? toNum(r[colPrice]) : 0;
    rows.push({ wineCode, bottlePrice });
  }

  return rows;
}
