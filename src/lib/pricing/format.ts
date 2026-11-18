export function formatMoney(amount:number,currency:string){return currency==='ALL'?`ALL ${new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(amount)}`:new Intl.NumberFormat('en',{style:'currency',currency,maximumFractionDigits:2}).format(amount)}
export function formatRoomRate(amount:number|null,currency:string){return amount===null?'Rate on request':formatMoney(amount,currency)}

export function formatExperiencePrice(amount: number | null, currency: string, priceType: string) {
  if (amount === null || priceType === 'on request') return 'Price on request';
  const price = formatMoney(amount, currency);
  if (priceType === 'fixed') return `${price} total`;
  return priceType.startsWith('per ') ? `${price} ${priceType}` : price;
}
