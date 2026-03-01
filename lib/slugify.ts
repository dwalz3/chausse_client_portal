/**
 * Convert a producer name to a URL-safe slug.
 * "Domaine de la Côte" → "domaine-de-la-cote"
 */
export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric
    .trim()
    .replace(/[\s]+/g, '-')          // spaces to hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
}
