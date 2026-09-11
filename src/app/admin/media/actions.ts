'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { adminMediaRepository } from '@/lib/repositories/admin/media';

const refresh = () => { revalidatePath('/admin/media'); revalidatePath('/admin/content/homepage'); revalidatePath('/'); };
export async function updateMedia(formData: FormData) { try { const session = await requireAdmin(['owner','manager','editor']); await adminMediaRepository.update(session, String(formData.get('id') || ''), { title: String(formData.get('title') || '').trim(), altText: String(formData.get('altText') || '').trim(), caption: String(formData.get('caption') || '').trim() }); refresh(); return {ok:true,message:'Image details saved.'}; } catch(error) { return {ok:false,message:error instanceof Error?error.message:'Could not save the image.'}; } }
export async function archiveMedia(id: string) { try { const session = await requireAdmin(['owner','manager','editor']); await adminMediaRepository.archive(session, id); refresh(); return {ok:true,message:'Image archived. You can restore it at any time.'}; } catch(error) { return {ok:false,message:error instanceof Error?error.message:'Could not archive the image.'}; } }
export async function restoreMedia(id: string) { try { const session = await requireAdmin(['owner','manager','editor']); await adminMediaRepository.restore(session, id); refresh(); return {ok:true,message:'Image restored.'}; } catch(error) { return {ok:false,message:error instanceof Error?error.message:'Could not restore the image.'}; } }
