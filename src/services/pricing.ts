import 'server-only';
import {cache} from 'react';
import {createClient} from '@supabase/supabase-js';
import {fetchSupabase} from '@/lib/supabase/fetch';
import {calculateStayPriceFromCatalog,getNightlyRateFromCatalog,type NightlyRate,type PricingCatalog} from '@/lib/pricing/core';

const emptyCatalog: PricingCatalog = { currency: 'EUR', baseRates: [], seasonalRates: [], minimumStayRules: [] };

const loadPricingScope = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetchSupabase } });
  const { data: property } = await db.from('properties').select('id,currency').eq('status', 'published').order('created_at').limit(1).maybeSingle();
  return property ? { db, property } : null;
});

const loadBaseRates = cache(async (): Promise<PricingCatalog['baseRates']> => {
  const scope = await loadPricingScope();
  if (!scope) return [];
  const { db, property } = scope;
  const { data } = await db.from('rates').select('room_type_id,base_price,currency')
    .eq('property_id', property.id).eq('status', 'published').eq('is_visible', true).eq('active', true);
  return (data || []).map(row => ({
    roomTypeId: row.room_type_id, amount: Number(row.base_price), currency: row.currency || property.currency || 'EUR', active: true,
  }));
});

const loadPricingCatalog = cache(async (): Promise<PricingCatalog> => {
  const scope = await loadPricingScope();
  if (!scope) return emptyCatalog;
  const { db, property } = scope;
  const [baseRates, {data:periods}, {data:links}, {data:minimums}] = await Promise.all([
    loadBaseRates(),
    db.from('seasonal_rate_periods').select('id,name,start_date,end_date,nightly_price,currency,active,status').eq('property_id',property.id).eq('status','published').eq('active',true),
    db.from('seasonal_rate_room_types').select('period_id,room_type_id').eq('property_id',property.id),
    db.from('pricing_rules').select('id,room_type_id,start_date,end_date,nights,active,status').eq('property_id',property.id).eq('rule_type','minimum_stay').eq('status','published').eq('active',true),
  ]);
  return{currency:property.currency||'EUR',baseRates,seasonalRates:(periods||[]).map(row=>({id:row.id,name:row.name,roomTypeIds:(links||[]).filter(link=>link.period_id===row.id).map(link=>link.room_type_id),startDate:row.start_date,endDate:row.end_date,amount:Number(row.nightly_price),currency:row.currency||property.currency||'EUR',active:row.active})),minimumStayRules:(minimums||[]).map(row=>({id:row.id,roomTypeId:row.room_type_id,startDate:row.start_date,endDate:row.end_date,nights:Number(row.nights),active:row.active}))};
});

export async function getNightlyRate(roomTypeId:string,date:string){return getNightlyRateFromCatalog(await loadPricingCatalog(),roomTypeId,date)}
export async function calculateStayPrice(roomTypeId:string,checkIn:string,checkOut:string){return calculateStayPriceFromCatalog(await loadPricingCatalog(),roomTypeId,checkIn,checkOut)}
export async function getRoomPriceFrom(roomTypeId:string){return (await getRoomPriceFromMap()).get(roomTypeId) ?? null}
export const getRoomPriceFromMap = cache(async () => {
  const baseRates = await loadBaseRates();
  const prices = new Map<string, NightlyRate>();
  for (const rate of baseRates) {
    if (!prices.has(rate.roomTypeId)) {
      prices.set(rate.roomTypeId, { date: '', amount: rate.amount, currency: rate.currency || 'EUR', source: 'base' });
    }
  }
  return prices;
});
