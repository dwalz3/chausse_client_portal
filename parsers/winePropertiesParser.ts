/**
 * Wine Properties Parser — server-side (raw rows, no File API)
 * Columns: Wine Code, Wine Name (full), Producer, Importer, Country, Region,
 *          Category/Type, Vintage, Varietal
 */

import { WinePropertyRow, WineType } from '@/types';
import { parseWineName } from './parseWineName';

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

function parseWineType(raw: string): WineType {
  const s = raw.trim().toLowerCase();
  if (s.includes('sparkling') || s.includes('champagne') || s.includes('prosecco') || s.includes('cava') || s.includes('crémant'))
    return 'Sparkling';
  if (s.includes('orange')) return 'Orange';
  if (s.includes('ros')) return 'Rosé';
  if (s.includes('red') || s.includes('rouge') || s.includes('tinto') || s.includes('rosso')) return 'Red';
  if (s.includes('white') || s.includes('blanc') || s.includes('bianco') || s.includes('blanco')) return 'White';
  if (s.includes('vermouth') || s.includes('aperitif')) return 'Vermouth';
  if (s.includes('tea') || s.includes('n/a') || s.includes('non-alc') || s.includes('dealc')) return 'Tea/NA';
  return 'Other';
}

function parseFarmingFlags(name: string, importer: string): { isNatural: boolean; isBiodynamic: boolean } {
  const combined = `${name} ${importer}`.toLowerCase();
  return {
    isNatural: combined.includes('natural') || combined.includes('nature'),
    isBiodynamic: combined.includes('biodynamic') || combined.includes('biodynamique') || combined.includes('demeter'),
  };
}

export function parseWinePropertiesFromRows(raw: unknown[][]): WinePropertyRow[] {
  if (raw.length < 2) return [];

  const headers = (raw[0] as unknown[]).map(norm);
  const colCode = findCol(headers, 'wine code', 'item code', 'code', 'sku');
  const colName = findCol(headers, 'wine name', 'name', 'description', 'item name');
  const colProducer = findCol(headers, 'producer', 'supplier', 'winery');
  const colImporter = findCol(headers, 'importer');
  const colCountry = findCol(headers, 'country', 'origin');
  const colRegion = findCol(headers, 'region', 'area', 'appellation');
  const colType = findCol(headers, 'category', 'type', 'product type', 'varietal type', 'wine type');
  const colVintage = findCol(headers, 'vintage', 'year');
  const colVarietal = findCol(headers, 'varietal', 'grape', 'variety');

  const rows: WinePropertyRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    const wineCode = colCode >= 0 ? String(r[colCode] ?? '').trim() : '';
    if (!wineCode) continue;

    const rawName = colName >= 0 ? String(r[colName] ?? '').trim() : '';
    const parsed = parseWineName(rawName);

    const producer = colProducer >= 0 ? String(r[colProducer] ?? '').trim() : parsed.producer;
    const importer = colImporter >= 0 ? String(r[colImporter] ?? '').trim() : '';
    const country = colCountry >= 0 ? String(r[colCountry] ?? '').trim() : '';
    const region = colRegion >= 0 ? String(r[colRegion] ?? '').trim() : '';
    const typeRaw = colType >= 0 ? String(r[colType] ?? '').trim() : '';
    const wineType = parseWineType(typeRaw || rawName);
    const vintage = colVintage >= 0 ? String(r[colVintage] ?? '').trim() : parsed.vintage;
    const varietal = colVarietal >= 0 ? String(r[colVarietal] ?? '').trim() : '';

    const { isNatural, isBiodynamic } = parseFarmingFlags(rawName, importer);

    rows.push({
      wineCode,
      name: rawName,
      wineName: parsed.wineName || rawName,
      producer,
      importer,
      country,
      region,
      varietal,
      wineType,
      vintage,
      caseSize: parsed.caseSize,
      bottleSize: parsed.bottleSize,
      isNatural,
      isBiodynamic,
      isDirect: importer.toLowerCase().includes('chausse'),
    });
  }

  return rows;
}
