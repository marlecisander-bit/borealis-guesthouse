'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { validateCmsPage } from '@/lib/admin/validation';
import { cmsPageRepository } from '@/lib/repositories/admin/cms-pages';
import type { AdminActionState } from '@/types/admin';

export async function saveHomepage(_:AdminActionState,formData:FormData):Promise<AdminActionState>{const session=await requireAdmin(['owner','manager','editor']);const validated=validateCmsPage(formData);if(!validated.data)return validated.state!;try{await cmsPageRepository.save(session,'homepage',validated.data);revalidatePath('/admin/content');revalidatePath('/admin/content/homepage');revalidatePath('/');return{ok:true,message:validated.data.status==='published'?'Homepage saved and published.':'Homepage draft saved.'}}catch{return{ok:false,message:'The homepage could not be saved. Confirm that cms-foundation.sql has been applied.'}}}
export async function archiveHomepage(){const session=await requireAdmin(['owner','manager','editor']);await cmsPageRepository.archive(session,'homepage');revalidatePath('/admin/content');revalidatePath('/');}
