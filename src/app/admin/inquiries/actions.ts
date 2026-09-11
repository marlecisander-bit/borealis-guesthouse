'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { adminInquiriesRepository, type ContactInquiry } from '@/lib/repositories/admin/inquiries';

export async function setInquiryStatus(id: string, data: FormData) {
  const session = await requireAdmin(['owner','manager','staff']);
  const status = String(data.get('status')) as ContactInquiry['status'];
  if (!['new','read','replied','archived'].includes(status)) throw new Error('Invalid enquiry status.');
  await adminInquiriesRepository.setStatus(session, id, status);
  revalidatePath('/admin/inquiries');
}

