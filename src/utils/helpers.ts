/**
 * Format date to ISO string
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse ISO date string to Date object
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00Z');
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency: string = 'EUR',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Handle API errors with consistent formatting
 */
export function handleError(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      message:
        (typeof err.message === 'string' && err.message) ||
        (typeof err.error_description === 'string' && err.error_description) ||
        'An error occurred',
      code:
        (typeof err.code === 'string' && err.code) ||
        (typeof err.error === 'string' && err.error) ||
        undefined,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
