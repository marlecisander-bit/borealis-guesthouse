import { supportedCurrencies } from '@/lib/currencies';

export function CurrencySelect({ defaultValue = 'EUR', className, id }: { defaultValue?: string; className?: string; id?: string }) {
  const selected = supportedCurrencies.some((currency) => currency.value === defaultValue) ? defaultValue : 'EUR';
  return (
    <select id={id} name="currency" defaultValue={selected} className={className}>
      {supportedCurrencies.map((currency) => <option key={currency.value} value={currency.value}>{currency.label}</option>)}
    </select>
  );
}
