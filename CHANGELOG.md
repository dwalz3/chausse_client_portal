# Changelog — Chausse Client Portal

## v1.2.1 — 2026-03-01

### Fixed
- `components/CatalogClient.tsx` — stale localStorage schema validation: auto-clears override data uploaded before `importer` field was added (v1.2.0), preventing `—` placeholder in Importer column

### Added
- `components/CatalogClient.tsx` — Varietal column in spreadsheet table (sortable); Varietal added to sort key union type and Fuse.js search fields already included it

---

## v1.2.0 — 2026-03-01

### Added
- `parsers/rb1Parser.ts` — RB1 inventory XLSX parser (Inventory sheet, Status=Active filter); provides importer, availableQty, pricing
- `components/AdminUpload.tsx` — password-gated /admin upload page; drag-drop RB1 XLSX → client-side parse → localStorage override
- `app/admin/page.tsx` — admin route (hidden, password-protected)
- `types/index.ts` — added `importer: string` and `availableQty: number` to `CatalogWine`; added `Rb1Row` parser type
- `lib/vinosmith.ts` — added `getRb1Rows()` (inventory_detailed.xlsx); fixed URL format to vinosmith.com/ext/exports/rep/{UUID}/
- `lib/buildCatalog.ts` — RB1 as primary active wine list; wine_properties.csv supplements farming flags
- `components/CatalogClient.tsx` — full rewrite: spreadsheet table UI replacing card grid; sortable columns; Fuse.js search; type/country/farming filters; hash-colored Importer/Region/Country chips; localStorage override with revert banner

---

## v1.0.0 — 2026-03-01

Initial build. Public-facing wine catalog for trade buyers.

### Added
- `types/index.ts` — CatalogWine, CatalogProducer, WinePropertyRow, Ra21Row, Ra30Row, PricingRow, NewArrivalEntry
- `lib/slugify.ts` — producer name → URL slug
- `lib/wineTypeColors.ts` — light-theme badge colors for all 7 wine types
- `lib/vinosmith.ts` — server-only Vinosmith XLSX fetchers with `unstable_cache` (hourly ISR)
- `lib/buildCatalog.ts` — joins wine-properties + RA21 + RA30 into CatalogWine[]/CatalogProducer[]
- `parsers/parseWineName.ts` — parse Vinosmith name format 'Producer, Wine, Vintage - CaseSize/BottleSize'
- `parsers/winePropertiesParser.ts` — server-side wine properties parser (no File API)
- `parsers/ra21Parser.ts` — server-side RA21 (top wines) parser
- `parsers/ra30Parser.ts` — server-side RA30 (new placements) parser
- `parsers/pricingParser.ts` — server-side pricing parser
- `data/featured.json` — Dave-curated featured wine codes (edit to update homepage)
- `data/new-arrivals.json` — manual PO-based arrival entries
- `app/layout.tsx` — root layout with Playfair Display + Inter fonts, Navbar, Footer
- `app/globals.css` — design system colors (terracotta, gold, sage)
- `components/Navbar.tsx` — sticky nav with CHAUSSE_ logo + links
- `components/Footer.tsx` — minimal footer
- `components/WineTypeBadge.tsx` — light-theme wine type badge
- `components/WineCard.tsx` — card with type badge, name, producer, country, farming badges, price
- `components/ProducerCard.tsx` — producer card with country, wine count, direct import badge
- `components/CatalogClient.tsx` — client-side search (Fuse.js) + type/country/farming filters with URL params
- `components/TechSheetButton.tsx` — jsPDF tech sheet download (client component)
- `app/page.tsx` — homepage: hero, stats bar, browse by type, featured wines, new arrivals
- `app/wines/page.tsx` — server page: all wines → CatalogClient
- `app/wines/[code]/page.tsx` — wine detail: specs, farming badges, tech sheet download
- `app/producers/page.tsx` — producer index grouped by country
- `app/producers/[slug]/page.tsx` — producer detail with wine grid
- `app/new-arrivals/page.tsx` — new arrivals from RA30 + manual new-arrivals.json
