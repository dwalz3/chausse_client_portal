/**
 * buildCatalog — joins Vinosmith data into CatalogWine[] + CatalogProducer[]
 * Server-only. Called from Server Components.
 */

import { CatalogWine, CatalogProducer } from '@/types';
import { getWinePropertiesRows, getRa21Rows, getRa30Rows } from './vinosmith';
import { parseWinePropertiesFromRows } from '@/parsers/winePropertiesParser';
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

let catalogCache: { wines: CatalogWine[]; producers: CatalogProducer[] } | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in-process cache

async function buildCatalogInternal(): Promise<{ wines: CatalogWine[]; producers: CatalogProducer[] }> {
  let wpRaw: unknown[][] = [];
  let ra21Raw: unknown[][] = [];
  let ra30Raw: unknown[][] = [];

  try {
    [wpRaw, ra21Raw, ra30Raw] = await Promise.all([
      getWinePropertiesRows(),
      getRa21Rows(),
      getRa30Rows(),
    ]);
  } catch (err) {
    console.warn('[buildCatalog] Vinosmith fetch failed — returning empty catalog:', err instanceof Error ? err.message : err);
    return { wines: [], producers: [] };
  }

  const wpRows = parseWinePropertiesFromRows(wpRaw);
  const ra21Rows = parseRa21FromRows(ra21Raw);
  const ra30Rows = parseRa30FromRows(ra30Raw);

  // Build lookup maps by normalized wine code
  const ra21Map = new Map(ra21Rows.map((r) => [normCode(r.wineCode), r]));
  const ra30Map = new Map(ra30Rows.map((r) => [normCode(r.wineCode), r]));

  const wines: CatalogWine[] = wpRows.map((wp) => {
    const nc = normCode(wp.wineCode);
    const ra21 = ra21Map.get(nc) ?? null;
    const ra30 = ra30Map.get(nc) ?? null;

    return {
      code: wp.wineCode,
      name: wp.wineName || wp.name,
      fullName: wp.name,
      producer: wp.producer,
      producerSlug: slugify(wp.producer),
      country: wp.country,
      region: wp.region,
      wineType: wp.wineType,
      varietal: wp.varietal,
      vintage: wp.vintage,
      bottlePrice: 0, // pricing not from wine-properties; can be extended later
      isNatural: wp.isNatural,
      isBiodynamic: wp.isBiodynamic,
      isDirect: wp.isDirect,
      isNewArrival: ra30 ? isNewArrival(ra30.placedAt) : false,
      rank: ra21 ? ra21.rank : null,
    };
  });

  // Build producers by grouping wines
  const producerMap = new Map<string, CatalogWine[]>();
  for (const wine of wines) {
    const key = wine.producer;
    if (!producerMap.has(key)) producerMap.set(key, []);
    producerMap.get(key)!.push(wine);
  }

  const producers: CatalogProducer[] = Array.from(producerMap.entries()).map(([name, pw]) => {
    const first = pw[0];
    const anyDirect = pw.some((w) => w.isDirect);
    return {
      name,
      slug: slugify(name),
      country: first.country,
      region: first.region,
      isDirect: anyDirect,
      wineCount: pw.length,
      wines: pw,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return { wines, producers };
}

export async function getCatalog(): Promise<{ wines: CatalogWine[]; producers: CatalogProducer[] }> {
  const now = Date.now();
  if (catalogCache && now - cacheBuiltAt < CACHE_TTL_MS) {
    return catalogCache;
  }
  const result = await buildCatalogInternal();
  catalogCache = result;
  cacheBuiltAt = now;
  return result;
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
  // fallback to RA21 top 6 if not enough
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
