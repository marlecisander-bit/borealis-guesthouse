/** Convert an editor-provided label into a safe, predictable URL segment. */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Respect an entered slug, or generate one from the record's primary label. */
export function slugFrom(value: string, fallback: string) {
  return slugify(value.trim() || fallback.trim());
}
