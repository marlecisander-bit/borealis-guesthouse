import { timingSafeEqual } from 'node:crypto';
import { synchronizeEnabledExternalCalendars } from '@/services/ical-sync';
export const runtime='nodejs';
export const dynamic='force-dynamic';

function authorized(request:Request){
  const secret=process.env.ICAL_SYNC_SECRET,provided=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
  if(!secret||secret.length<32||provided.length!==secret.length)return false;
  return timingSafeEqual(Buffer.from(provided),Buffer.from(secret));
}
export async function POST(request:Request){
  if(!authorized(request))return Response.json({error:'Unauthorized'},{status:401});
  try{const results=await synchronizeEnabledExternalCalendars();return Response.json({synchronized:results.length,successful:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results});}
  catch(error){return Response.json({error:error instanceof Error?error.message:'Calendar synchronization failed.'},{status:500});}
}

