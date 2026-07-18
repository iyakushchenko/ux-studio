/** Build canonical project id: `boots-pharmacy` or `boots` when no sub-brand. */
export function formatProjectId(brand: string, subbrand?: string): string {
  const brandSlug = brand.trim().toLowerCase();
  const subSlug = subbrand?.trim().toLowerCase();
  return subSlug ? `${brandSlug}-${subSlug}` : brandSlug;
}
