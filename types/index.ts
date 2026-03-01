export type WineType = 'Red' | 'White' | 'Rosé' | 'Sparkling' | 'Orange' | 'Vermouth' | 'Tea/NA' | 'Other';

export interface CatalogWine {
  code: string;
  name: string;          // parsed wine name component
  fullName: string;      // raw full name from Vinosmith
  producer: string;
  producerSlug: string;  // for /producers/[slug]
  country: string;
  region: string;
  wineType: WineType;
  varietal: string;
  vintage: string;
  bottlePrice: number;   // 0 if not available in source data
  isNatural: boolean;
  isBiodynamic: boolean;
  isDirect: boolean;
  isNewArrival: boolean; // placement within last 90 days (from RA30)
  rank: number | null;   // RA21 rank if in top wines
}

export interface CatalogProducer {
  name: string;
  slug: string;
  country: string;
  region: string;
  isDirect: boolean;
  wineCount: number;
  wines: CatalogWine[];
}

// Raw parser row types

export interface WinePropertyRow {
  wineCode: string;
  name: string;
  wineName: string;
  producer: string;
  importer: string;
  country: string;
  region: string;
  varietal: string;
  wineType: WineType;
  vintage: string;
  caseSize: string;
  bottleSize: string;
  isNatural: boolean;
  isBiodynamic: boolean;
  isDirect: boolean;
  bottlePrice: number;
  availableQty: number;  // -1 = unknown, 0+ = actual qty
}

export interface Ra21Row {
  wineCode: string;
  rank: number;
  wineName: string;
  totalQty: number;
  totalRevenue: number;
}

export interface Ra30Row {
  wineCode: string;
  wineName: string;
  placedAt: string | null; // ISO date string or null
  accountCount: number;
}

export interface PricingRow {
  wineCode: string;
  bottlePrice: number;
}

export interface NewArrivalEntry {
  code: string;
  arrivedAt: string; // ISO date string
  note?: string;
}
