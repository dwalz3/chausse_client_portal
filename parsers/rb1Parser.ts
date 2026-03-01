/**
 * RB1 Parser — Active Inventory / Current Wine List
 * Source: Vinosmith inventory_detailed.xlsx (sheet: "Inventory")
 *
 * Columns: Supplier, Code, Name, Appellation, Vintage, Producer, Importer,
 *   Region, Country, Varietal, Warehouse, BIN location, End of Stock,
 *   Product Category, Product Type, Product Family, Available, On Hand,
 *   On Hold, On Future, Pending Sync, On Order, On Transfer, Laid-In Cost,
 *   FOB Price, Default Price, Bottle Size, Unit Set, Wine UPC,
 *   External Identifier1, External Identifier2, Status,
 *   Pre-Arrival: Soonest Date, Pre-Arrival: Total Quantity,
 *   Inventory: Created, Qty Sold: Last 30 Days, Wine/Supplier Commission Rate (%)
 */

import { WineType } from '@/types';

export interface Rb1Row {
  wineCode: string;
  name: string;
  producer: string;
  importer: string;
  country: string;
  region: string;
  appellation: string;
  varietal: string;
  wineType: WineType;
  vintage: string;
  bottlePrice: number;
  fobPrice: number;
  laidInCost: number;
  availableQty: number;
  onHandQty: number;
  onOrderQty: number;
  last30DaySales: number;
  status: string;    // 'Active' | 'Inactive' etc.
  bottleSize: string;
}

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

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
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

export function parseRb1FromRows(raw: unknown[][]): Rb1Row[] {
  if (raw.length < 2) return [];

  // Find the header row (first row containing "Code" or "Name")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const normalized = (raw[i] as unknown[]).map(norm);
    if (normalized.some((h) => h === 'code' || h === 'name')) {
      headerIdx = i;
      break;
    }
  }

  const headers = (raw[headerIdx] as unknown[]).map(norm);

  const colCode = findCol(headers, 'code');
  const colName = findCol(headers, 'name');
  const colProducer = findCol(headers, 'producer');
  const colImporter = findCol(headers, 'importer');
  const colCountry = findCol(headers, 'country');
  const colRegion = findCol(headers, 'region');
  const colAppellation = findCol(headers, 'appellation');
  const colVarietal = findCol(headers, 'varietal');
  const colType = findCol(headers, 'product type', 'type');
  const colVintage = findCol(headers, 'vintage');
  const colDefaultPrice = findCol(headers, 'default price');
  const colFobPrice = findCol(headers, 'fob price');
  const colLaidIn = findCol(headers, 'laid-in cost', 'laid in cost', 'laidincost');
  const colAvailable = findCol(headers, 'available');
  const colOnHand = findCol(headers, 'on hand');
  const colOnOrder = findCol(headers, 'on order');
  const colLast30 = findCol(headers, 'qty sold: last 30', 'last 30');
  const colStatus = findCol(headers, 'status');
  const colBottleSize = findCol(headers, 'bottle size');

  const rows: Rb1Row[] = [];

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || r.every((v) => v == null || v === '')) continue;

    const wineCode = colCode >= 0 ? String(r[colCode] ?? '').trim() : '';
    if (!wineCode) continue;

    const status = colStatus >= 0 ? String(r[colStatus] ?? '').trim() : 'Active';
    // Only include Active wines
    if (status.toLowerCase() !== 'active') continue;

    const typeRaw = colType >= 0 ? String(r[colType] ?? '').trim() : '';
    const vintage = colVintage >= 0 ? String(r[colVintage] ?? '').trim() : '';

    rows.push({
      wineCode,
      name: colName >= 0 ? String(r[colName] ?? '').trim() : '',
      producer: colProducer >= 0 ? String(r[colProducer] ?? '').trim() : '',
      importer: colImporter >= 0 ? String(r[colImporter] ?? '').trim() : '',
      country: colCountry >= 0 ? String(r[colCountry] ?? '').trim() : '',
      region: colRegion >= 0 ? String(r[colRegion] ?? '').trim() : '',
      appellation: colAppellation >= 0 ? String(r[colAppellation] ?? '').trim() : '',
      varietal: colVarietal >= 0 ? String(r[colVarietal] ?? '').trim() : '',
      wineType: parseWineType(typeRaw),
      vintage,
      bottlePrice: colDefaultPrice >= 0 ? toNum(r[colDefaultPrice]) : 0,
      fobPrice: colFobPrice >= 0 ? toNum(r[colFobPrice]) : 0,
      laidInCost: colLaidIn >= 0 ? toNum(r[colLaidIn]) : 0,
      availableQty: colAvailable >= 0 ? toNum(r[colAvailable]) : 0,
      onHandQty: colOnHand >= 0 ? toNum(r[colOnHand]) : 0,
      onOrderQty: colOnOrder >= 0 ? toNum(r[colOnOrder]) : 0,
      last30DaySales: colLast30 >= 0 ? toNum(r[colLast30]) : 0,
      status,
      bottleSize: colBottleSize >= 0 ? String(r[colBottleSize] ?? '').trim() : '',
    });
  }

  return rows;
}
