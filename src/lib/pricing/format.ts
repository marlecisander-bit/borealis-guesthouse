export function formatMoney(amount:number,currency:string){return currency==='ALL'?`ALL ${new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(amount)}`:new Intl.NumberFormat('en',{style:'currency',currency,maximumFractionDigits:2}).format(amount)}
export function formatRoomRate(amount:number|null,currency:string){return amount===null?'Rate on request':formatMoney(amount,currency)}
