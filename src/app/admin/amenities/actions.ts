'use server';
import {revalidatePath} from 'next/cache';import {requireAdmin} from '@/lib/admin/auth';import {validateAmenity} from '@/lib/admin/amenity-validation';import {adminAmenitiesRepository} from '@/lib/repositories/admin/amenities';import type {AmenityFormState} from '@/types/amenities-admin';
const refresh=()=>{revalidatePath('/admin/amenities');revalidatePath('/admin/rooms');revalidatePath('/rooms')};
export async function saveAmenity(_:AmenityFormState,data:FormData):Promise<AmenityFormState>{const session=await requireAdmin(['owner','manager','editor']);const validated=validateAmenity(data);if(!validated.data)return validated.state!;try{const id=await adminAmenitiesRepository.save(session,String(data.get('id')||'')||null,validated.data);refresh();return{ok:true,id,message:validated.data.status==='published'?'Amenity saved and published.':'Amenity draft saved.'}}catch(error){return{ok:false,message:error instanceof Error?error.message:'Amenity could not be saved.'}}}
export async function archiveAmenity(id:string){const session=await requireAdmin(['owner','manager','editor']);await adminAmenitiesRepository.setStatus(session,id,'archived');refresh()}
export async function restoreAmenity(id:string){const session=await requireAdmin(['owner','manager','editor']);await adminAmenitiesRepository.setStatus(session,id,'draft');refresh()}
export async function reorderAmenity(id:string,direction:'up'|'down'){const session=await requireAdmin(['owner','manager','editor']);await adminAmenitiesRepository.reorder(session,id,direction);refresh()}

