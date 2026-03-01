/**
 * buildCatalog — joins Vinosmith data into CatalogWine[] + CatalogProducer[]
 *
 * Data sources:
 *   RB1 (inventory_detailed.xlsx) — primary active wine list: pricing, availability
 *   wine_properties.csv            — supplemental: farming flags, varietals, tasting notes
 *   RA21                           — rank badges (top sellers)
 *   RA30                           — new arrival flags
 *
 * Server-only. Called from Server Components.
 */

import { CatalogWine, CatalogProducer } from '@/types';
import { getWinePropertiesRows, getRb1Rows, getRa21Rows, getRa30Rows } from './vinosmith';
import { parseWinePropertiesFromRows } from '@/parsers/winePropertiesParser';
import { parseRb1FromRows } from '@/parsers/rb1Parser';
import { parseRa21FromRows } from '@/parsers/ra21Parser';
import { parseRa30FromRows } from '@/parsers/ra30Parser';
import { slugify } from './slugify';

function normCode(code: string): string {
  return code.toString().trim().toUpperCase();
}

function isNewArrival(placedAt: string | null): boolean {
  if (!placedAt) return false;
  const placed = new Date(placedAt);
  const now = new Date();
  const diffDays = (now.getTime() - placed.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 90;
}

async function buildCatalogInternal(): Promise<{ wines: CatalogWine[]; producers: CatalogProducer[] }> {
  let rb1Raw: unknown[][] = [];
  let wpRaw: unknown[][] = [];
  let ra21Raw: unknown[][] = [];
  let ra30Raw: unknown[][] = [];

  try {
    [rb1Raw, wpRaw, ra21Raw, ra30Raw] = await Promise.all([
      getRb1Rows(),
      getWinePropertiesRows(),
      getRa21Rows(),
      getRa30Rows(),
    ]);
  } catch (err) {
    console.warn('[buildCatalog] Vinosmith fetch failed — returning empty catalog:', err instanceof Error ? err.message : err);
    return { wines: [], producers: [] };
  }

  const rb1Rows = parseRb1FromRows(rb1Raw);
  const wpRows = parseWinePropertiesFromRows(wpRaw);
  const ra21Rows = parseRa21FromRows(ra21Raw);
  const ra30Rows = parseRa30FromRows(ra30Raw);

  // Build lookup maps by normalized wine code
  const wpMap = new Map(wpRows.map((r) => [normCode(r.wineCode), r]));
  const ra21Map = new Map(ra21Rows.map((r) => [normCode(r.wineCode), r]));
  const ra30Map = new Map(ra30Rows.map((r) => [normCode(r.wineCode), r]));

  // Build catalog from RB1 (active wines), enrich with wine-properties metadata
  const wines: CatalogWine[] = rb1Rows.map((rb1) => {
    const nc = normCode(rb1.wineCode);
    const wp = wpMap.get(nc) ?? null;
    const ra21 = ra21Map.get(nc) ?? null;
    const ra30 = ra30Map.get(nc) ?? null;

    // RB1 is ground truth for name, pricing, availability
    // wine-properties supplements farming flags and detailed metadata
    return {
      code: rb1.wineCode,
      name: rb1.name,
      fullName: rb1.name,
      producer: rb1.producer,
      producerSlug: slugify(rb1.producer),
      country: rb1.country,
      region: rb1.appellation || rb1.region,
      wineType: rb1.wineType,
      varietal: rb1.varietal || (wp?.varietal ?? ''),
      vintage: rb1.vintage,
      bottlePrice: rb1.bottlePrice,
      // Farming flags come from wine-properties (has Biodynamic/Organic columns)
      isNatural: wp?.isNatural ?? false,
      isBiodynamic: wp?.isBiodynamic ?? false,
      isDirect: rb1.importer.toLowerCase().includes('chausse') || (wp?.isDirect ?? false),
      isNewArrival: ra30 ? isNewArrival(ra30.placedAt) : false,
      rank: ra21 ? ra21.rank : null,
    };
  });

  // Build producers by grouping wines
  const producerMap = new Map<string, CatalogWine[]>();
  for (const wine of wines) {
    if (!producerMap.has(wine.producer)) producerMap.set(wine.producer, []);
    producerMap.get(wine.producer)!.push(wine);
  }

  const producers: CatalogProducer[] = Array.from(producerMap.entries())
    .map(([name, pw]) => {
      const first = pw[0];
      return {
        name,
        slug: slugify(name),
        country: first.country,
        region: first.region,
        isDirect: pw.some((w) => w.isDirect),
        wineCount: pw.length,
        wines: pw,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { wines, producers };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getCatalog(): Promise<{ wines: CatalogWine[]; producers: CatalogProducer[] }> {
  return buildCatalogInternal();
}

export async function getAllWines(): Promise<CatalogWine[]> {
  const { wines } = await getCatalog();
  return wines;
}

export async function getAllProducers(): Promise<CatalogProducer[]> {
  const { producers } = await getCatalog();
  return producers;
}

export async function getWineByCode(code: string): Promise<CatalogWine | null> {
  const { wines } = await getCatalog();
  const nc = normCode(code);
  return wines.find((w) => normCode(w.code) === nc) ?? null;
}

export async function getProducerBySlug(slug: string): Promise<CatalogProducer | null> {
  const { producers } = await getCatalog();
  return producers.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedWines(codes: string[]): Promise<CatalogWine[]> {
  const { wines } = await getCatalog();
  const wineMap = new Map(wines.map((w) => [normCode(w.code), w]));
  const featured: CatalogWine[] = [];
  for (const code of codes) {
    const wine = wineMap.get(normCode(code));
    if (wine) featured.push(wine);
  }
  // Fallback to RA21 top 6 if featured.json is empty or codes don't resolve
  if (featured.length < 6) {
    const ranked = wines
      .filter((w) => w.rank !== null && !featured.some((f) => f.code === w.code))
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    for (const w of ranked) {
      if (featured.length >= 6) break;
      featured.push(w);
    }
  }
  return featured;
}

export async function getNewArrivalWines(): Promise<CatalogWine[]> {
  const { wines } = await getCatalog();
  return wines.filter((w) => w.isNewArrival);
}
