/**
 * RA30 Parser — New Placements (server-side, raw rows)
 * Expected columns: Wine Code, Wine Name, First Placed Date, Account Count
 */

import { Ra30Row } from '@/types';

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

function parseDate(val: unknown): string | null {
  if (!val) return null;
  // Handle Excel serial dates
  if (typeof val === 'number' && val > 40000) {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  const s = String(val).trim();
  if (!s) return null;
  // Try parsing as date string
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

export function parseRa30FromRows(raw: unknown[][]): Ra30Row[] {
  if (raw.length < 2) return [];

  const headers = (raw[0] as unknown[]).map(norm);
  const colCode = findCol(headers, 'wine code', 'item code', 'code', 'sku');
  const colName = findCol(headers, 'wine name', 'name', 'description', 'item name');
  const colDate = findCol(headers, 'first placed', 'placed', 'date', 'first order', 'first sale');
  const colAccounts = findCol(headers, 'account count', 'accounts', 'account #', '# accounts', 'num accounts');

  const rows: Ra30Row[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || r.every((v) => v == null || v === '')) continue;

    const wineCode = colCode >= 0 ? String(r[colCode] ?? '').trim() : '';
    if (!wineCode) continue;

    const wineName = colName >= 0 ? String(r[colName] ?? '').trim() : '';
    const placedAt = colDate >= 0 ? parseDate(r[colDate]) : null;
    const accountCount = colAccounts >= 0 ? Math.round(toNum(r[colAccounts])) : 0;

    rows.push({ wineCode, wineName, placedAt, accountCount });
  }

  return rows;
}
