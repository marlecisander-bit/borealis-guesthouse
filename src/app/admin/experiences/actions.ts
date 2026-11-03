'use server';
import { experiencesRevalidatePath as revalidatePath } from '@/lib/revalidate-public-content';
import { requireAdmin } from '@/lib/admin/auth';
import { ownerSafeError } from '@/lib/admin/owner-safe-error';
import { validateExperience } from '@/lib/admin/experience-validation';
import { adminExperiencesRepository } from '@/lib/repositories/admin/experiences';
import type { ExperienceFormState } from '@/types/experiences-admin';
const refresh=()=>{revalidatePath('/admin/experiences');revalidatePath('/admin/services');revalidatePath('/experiences');revalidatePath('/book')};
export async function saveExperience(previous:ExperienceFormState,d:FormData):Promise<ExperienceFormState>{const s=await requireAdmin(['owner','manager','editor']),v=validateExperience(d);if(!v.data)return{...v.state!,savedStatus:previous.savedStatus};try{const id=await adminExperiencesRepository.save(s,String(d.get('id')||'')||null,v.data);refresh();return{ok:true,message:v.data.status==='published'?'Experience published.':'Draft saved.',savedStatus:v.data.status,id}}catch(e){return{ok:false,message:ownerSafeError(e,'Experience could not be saved. Please review the details and try again.')}}}
export async function archiveExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.status(s,id,'archived');refresh()}
export async function restoreExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.status(s,id,'draft');refresh()}
export async function unpublishExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.status(s,id,'draft');refresh()}
export async function duplicateExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.duplicate(s,id);refresh()}

export async function orderExperience(id:string,data:FormData){const s=await requireAdmin(['owner','manager','editor']);const order=Number(data.get('sortOrder'));if(!Number.isSafeInteger(order)||Math.abs(order)>100000)throw new Error('Enter a display order between -100000 and 100000');const{createServerSupabaseClient}=await import('@/lib/supabase/server');const db=await createServerSupabaseClient();const{error}=await db.from('experiences').update({sort_order:order,updated_by:s.userId}).eq('id',id).eq('property_id',s.propertyId);if(error)throw error;refresh();revalidatePath('/admin/services')}
export async function disableExperienceBookings(id:string){const s=await requireAdmin(['owner','manager','editor']),item=await adminExperiencesRepository.get(s,id);if(!item)throw new Error('Service not found');const{createServerSupabaseClient}=await import('@/lib/supabase/server');const db=await createServerSupabaseClient();const{error}=await db.from('experiences').update({bookable:false,book_independently:false,...(item.rentalConfig?{rental_config:{...item.rentalConfig,roomAddon:false,standalone:false}}:{}),updated_by:s.userId}).eq('id',id).eq('property_id',s.propertyId);if(error)throw error;refresh();revalidatePath('/admin/services')}
