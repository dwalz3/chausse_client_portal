/**
 * RA21 Parser — Top Wines by Sales (server-side, raw rows)
 * Expected columns: Rank, Wine Code, Wine Name, Total Qty, Total Revenue
 */

import { Ra21Row } from '@/types';

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
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export function parseRa21FromRows(raw: unknown[][]): Ra21Row[] {
  if (raw.length < 2) return [];

  const headers = (raw[0] as unknown[]).map(norm);
  const colRank = findCol(headers, 'rank', '#');
  const colCode = findCol(headers, 'wine code', 'item code', 'code', 'sku');
  const colName = findCol(headers, 'wine name', 'name', 'description', 'item name');
  const colQty = findCol(headers, 'total qty', 'qty', 'quantity', 'cases', 'bottles');
  const colRevenue = findCol(headers, 'total revenue', 'revenue', 'sales', 'amount');

  const rows: Ra21Row[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || r.every((v) => v == null || v === '')) continue;

    const wineCode = colCode >= 0 ? String(r[colCode] ?? '').trim() : '';
    if (!wineCode) continue;

    const rank = colRank >= 0 ? Math.round(toNum(r[colRank])) || (i) : i;
    const wineName = colName >= 0 ? String(r[colName] ?? '').trim() : '';
    const totalQty = colQty >= 0 ? toNum(r[colQty]) : 0;
    const totalRevenue = colRevenue >= 0 ? toNum(r[colRevenue]) : 0;

    rows.push({ wineCode, rank, wineName, totalQty, totalRevenue });
  }

  return rows;
}
