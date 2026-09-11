export const supportedCurrencies = [
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'ALL', label: 'ALL — Albanian Lek' },
] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number]['value'];

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return supportedCurrencies.some((currency) => currency.value === value);
}
