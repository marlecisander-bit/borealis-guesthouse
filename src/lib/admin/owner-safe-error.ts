const friendlyMessages: Record<string, string> = {
  '23505': 'A matching item already exists. Review the existing item and try again.',
  '23503': 'This item is still in use and cannot be changed that way.',
  '42501': 'You do not have permission to make this change.',
  '23P01': 'Those dates are no longer available. Refresh and choose another option.',
};

/** Keeps database and service implementation details out of normal owner screens. */
export function ownerSafeError(error: unknown, fallback: string) {
  console.error('[owner-workspace action]', error);
  if (error && typeof error === 'object' && 'code' in error) {
    const known = friendlyMessages[String(error.code)];
    if (known) return known;
  }
  return fallback;
}
