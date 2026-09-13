'use server';
import { experiencesRevalidatePath as revalidatePath } from '@/lib/revalidate-public-content';
import { requireAdmin } from '@/lib/admin/auth';
import { ownerSafeError } from '@/lib/admin/owner-safe-error';
import { validateExperience } from '@/lib/admin/experience-validation';
import { adminExperiencesRepository } from '@/lib/repositories/admin/experiences';
import type { ExperienceFormState } from '@/types/experiences-admin';
const refresh=()=>{revalidatePath('/admin/experiences');revalidatePath('/experiences');revalidatePath('/book')};
export async function saveExperience(_:ExperienceFormState,d:FormData):Promise<ExperienceFormState>{const s=await requireAdmin(['owner','manager','editor']),v=validateExperience(d);if(!v.data)return v.state!;try{const id=await adminExperiencesRepository.save(s,String(d.get('id')||'')||null,v.data);refresh();return{ok:true,message:v.data.status==='published'?'Experience published.':'Draft saved.',id}}catch(e){return{ok:false,message:ownerSafeError(e,'Experience could not be saved. Please review the details and try again.')}}}
export async function archiveExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.status(s,id,'archived');refresh()}
export async function restoreExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.status(s,id,'draft');refresh()}
export async function unpublishExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.status(s,id,'draft');refresh()}
export async function duplicateExperience(id:string){const s=await requireAdmin(['owner','manager','editor']);await adminExperiencesRepository.duplicate(s,id);refresh()}
