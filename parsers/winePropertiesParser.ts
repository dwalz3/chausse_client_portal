/**
 * Wine Properties Parser — server-side (raw rows, no File API)
 * Source: Vinosmith wine_properties.csv
 *
 * Key columns: Code, Name, Producer, Importer, Country, Region,
 *   Varietals, Product Type, Vintage, Biodynamic, Organic,
 *   Default Price, Sum Available Qty, Disabled?
 */

import { WinePropertyRow, WineType } from '@/types';
import { parseWineName } from './parseWineName';

function norm(s: unknown): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findCol(headers: string[], ...keywords: string[]): number {
  for (const kw of keywords) {
    const idx = headers.findIndex((h) => h === kw || h.includes(kw));
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

function isYes(val: unknown): boolean {
  const s = String(val ?? '').trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1';
}

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export function parseWinePropertiesFromRows(raw: unknown[][]): WinePropertyRow[] {
  if (raw.length < 2) return [];

  const headers = (raw[0] as unknown[]).map(norm);

  // Actual Vinosmith wine_properties.csv columns
  const colCode = findCol(headers, 'code');
  const colName = findCol(headers, 'name');
  const colProducer = findCol(headers, 'producer');
  const colImporter = findCol(headers, 'importer');
  const colCountry = findCol(headers, 'country');
  const colRegion = findCol(headers, 'region');
  const colVarietal = findCol(headers, 'varietals', 'varietal');
  const colType = findCol(headers, 'product type', 'category', 'type');
  const colVintage = findCol(headers, 'vintage');
  const colBiodynamic = findCol(headers, 'biodynamic');
  const colOrganic = findCol(headers, 'organic');
  const colDefaultPrice = findCol(headers, 'default price');
  const colAvailableQty = findCol(headers, 'sum available qty', 'available qty');
  const colDisabled = findCol(headers, 'disabled?', 'disabled');

  const rows: WinePropertyRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    const wineCode = colCode >= 0 ? String(r[colCode] ?? '').trim() : '';
    if (!wineCode) continue;

    // Skip disabled wines
    if (colDisabled >= 0 && isYes(r[colDisabled])) continue;

    const rawName = colName >= 0 ? String(r[colName] ?? '').trim() : '';
    const parsed = parseWineName(rawName);

    const producer = colProducer >= 0 ? String(r[colProducer] ?? '').trim() : parsed.producer;
    const importer = colImporter >= 0 ? String(r[colImporter] ?? '').trim() : '';
    const country = colCountry >= 0 ? String(r[colCountry] ?? '').trim() : '';
    const region = colRegion >= 0 ? String(r[colRegion] ?? '').trim() : '';
    const varietal = colVarietal >= 0 ? String(r[colVarietal] ?? '').trim() : '';
    const typeRaw = colType >= 0 ? String(r[colType] ?? '').trim() : '';
    const wineType = parseWineType(typeRaw || rawName);
    const vintage = colVintage >= 0 ? String(r[colVintage] ?? '').trim() : parsed.vintage;
    const isBiodynamic = colBiodynamic >= 0 ? isYes(r[colBiodynamic]) : false;
    // Treat organic + biodynamic as "natural" in the natural farming sense
    const isOrganic = colOrganic >= 0 ? isYes(r[colOrganic]) : false;
    const isNatural = isOrganic || isBiodynamic;
    const bottlePrice = colDefaultPrice >= 0 ? toNum(r[colDefaultPrice]) : 0;
    const availableQty = colAvailableQty >= 0 ? toNum(r[colAvailableQty]) : -1;

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
      bottlePrice,
      availableQty,
    });
  }

  return rows;
}
