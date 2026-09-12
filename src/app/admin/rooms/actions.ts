'use server';
import { revalidatePath } from 'next/cache';import { requireAdmin } from '@/lib/admin/auth';import {ownerSafeError}from'@/lib/admin/owner-safe-error';import { validatePhysicalRoom,validateRoomType } from '@/lib/admin/room-validation';import { adminRoomsRepository } from '@/lib/repositories/admin/rooms';import {createServerSupabaseClient}from '@/lib/supabase/server';import type { RoomFormState } from '@/types/rooms-admin';
const refresh=()=>{revalidatePath('/admin/rooms');revalidatePath('/rooms');revalidatePath('/')};
const saveError=(error:unknown)=>ownerSafeError(error,'Room could not be saved. Please review the details and try again.');
export async function saveRoomType(_:RoomFormState,data:FormData):Promise<RoomFormState>{const session=await requireAdmin(['owner','manager','editor']);const validated=validateRoomType(data);if(!validated.data)return validated.state!;try{const id=await adminRoomsRepository.saveRoomType(session,String(data.get('id')||'')||null,validated.data);refresh();return{ok:true,message:validated.data.status==='published'?'Room saved and published. It is now visible on the public Rooms page.':'Room draft saved.',id}}catch(error){return{ok:false,message:saveError(error)}}}
export async function savePhysicalRoom(_:RoomFormState,data:FormData):Promise<RoomFormState>{const session=await requireAdmin(['owner','manager']);const validated=validatePhysicalRoom(data);if(!validated.data)return validated.state!;try{const id=await adminRoomsRepository.savePhysicalRoom(session,String(data.get('id')||'')||null,validated.data);refresh();return{ok:true,message:'Room unit saved.',id}}catch(error){return{ok:false,message:ownerSafeError(error,'Room unit could not be saved. Please try again.')}}}
export async function archiveRoomType(id:string){const session=await requireAdmin(['owner','manager','editor']);await adminRoomsRepository.setRoomTypeStatus(session,id,'archived');refresh()}
export async function restoreRoomType(id:string){const session=await requireAdmin(['owner','manager','editor']);await adminRoomsRepository.setRoomTypeStatus(session,id,'draft');refresh()}
export async function duplicateRoomType(id:string){const session=await requireAdmin(['owner','manager','editor']);await adminRoomsRepository.duplicateRoomType(session,id);refresh()}
export async function archivePhysicalRoom(id:string){const session=await requireAdmin(['owner','manager']);await adminRoomsRepository.setPhysicalRoomStatus(session,id,'archived');refresh()}
export async function restorePhysicalRoom(id:string){const session=await requireAdmin(['owner','manager']);await adminRoomsRepository.setPhysicalRoomStatus(session,id,'draft');refresh()}
export type RoomMediaState={ok:boolean;message:string};
export async function attachExistingRoomMedia(roomTypeId:string,_:RoomMediaState,data:FormData):Promise<RoomMediaState>{
  const session=await requireAdmin(['owner','manager','editor']),mediaAssetId=String(data.get('mediaAssetId')||'').trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mediaAssetId))return{ok:false,message:'Choose an image from the Media Library first.'};
  const db=await createServerSupabaseClient();
  const[roomResult,assetResult,countResult,existingResult]=await Promise.all([
    db.from('room_types').select('id,slug').eq('id',roomTypeId).eq('property_id',session.propertyId).single(),
    db.from('media_assets').select('id').eq('id',mediaAssetId).eq('property_id',session.propertyId).neq('status','archived').single(),
    db.from('room_images').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).eq('room_type_id',roomTypeId).neq('status','archived'),
    db.from('room_images').select('id').eq('property_id',session.propertyId).eq('room_type_id',roomTypeId).eq('media_asset_id',mediaAssetId).maybeSingle(),
  ]);
  if(roomResult.error||!roomResult.data)return{ok:false,message:'This room is no longer available.'};
  if(assetResult.error||!assetResult.data)return{ok:false,message:'This image is unavailable or belongs to another property.'};
  if(countResult.error||existingResult.error)return{ok:false,message:ownerSafeError(countResult.error||existingResult.error,'The room gallery could not be checked. Please try again.')};
  const values={status:'published' as const,is_visible:true,is_featured:(countResult.count||0)===0,sort_order:(countResult.count||0)*10,updated_by:session.userId};
  const result=existingResult.data
    ?await db.from('room_images').update(values).eq('id',existingResult.data.id).eq('property_id',session.propertyId)
    :await db.from('room_images').insert({property_id:session.propertyId,room_type_id:roomTypeId,media_asset_id:mediaAssetId,...values,created_by:session.userId});
  if(result.error)return{ok:false,message:ownerSafeError(result.error,'The image could not be added. Please try again.')};
  revalidatePath(`/admin/rooms/${roomTypeId}`);
  revalidatePath(`/rooms/${roomResult.data.slug}`);
  refresh();
  return{ok:true,message:existingResult.data?'Image restored to the room gallery.':'Image added to the room gallery.'};
}
