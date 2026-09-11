'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import type { AdminNotification } from '@/types/notifications';

type NotificationRow = { id: string; type: AdminNotification['type']; title: string; message: string; booking_id: string | null; is_read: boolean; created_at: string };
const mapRow = (row: NotificationRow): AdminNotification => ({ id: row.id, type: row.type, title: row.title, message: row.message, bookingId: row.booking_id, isRead: row.is_read, createdAt: row.created_at });

export function NotificationBell() {
  const db = useMemo(() => createClient(), []);
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  useOutsideClick(ref, () => setOpen(false), open);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) return;
      const { data: profile } = await db.from('admin_profiles').select('property_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
      if (!active || !profile?.property_id) return;
      setPropertyId(profile.property_id);
      const [{ data }, { count }] = await Promise.all([
        db.from('notifications').select('id,type,title,message,booking_id,is_read,created_at').eq('property_id', profile.property_id).order('created_at', { ascending: false }).limit(8),
        db.from('notifications').select('id', { count: 'exact', head: true }).eq('property_id', profile.property_id).eq('is_read', false),
      ]);
      if (active) setItems(((data || []) as NotificationRow[]).map(mapRow));
      if (active) setUnread(count || 0);
    })();
    return () => { active = false; };
  }, [db]);

  useEffect(() => {
    if (!propertyId) return;
    const channel = db.channel(`admin-notifications-${propertyId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `property_id=eq.${propertyId}` }, payload => {
      setItems(current => [mapRow(payload.new as NotificationRow), ...current].slice(0, 8));
      if (!(payload.new as NotificationRow).is_read) setUnread(current => current + 1);
    }).subscribe();
    return () => { void db.removeChannel(channel); };
  }, [db, propertyId]);

  async function markRead(item: AdminNotification) {
    if (item.isRead) return;
    const now = new Date().toISOString();
    setItems(current => current.map(existing => existing.id === item.id ? { ...existing, isRead: true } : existing));
    setUnread(current => Math.max(0, current - 1));
    await db.from('notifications').update({ is_read: true, read_at: now, updated_at: now }).eq('id', item.id).eq('property_id', propertyId);
  }
  async function markAll() {
    const now = new Date().toISOString();
    setItems(current => current.map(item => ({ ...item, isRead: true })));
    setUnread(0);
    await db.from('notifications').update({ is_read: true, read_at: now, updated_at: now }).eq('property_id', propertyId).eq('is_read', false);
  }

  return <div ref={ref} className="relative">
    <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(value => !value)} className="relative grid size-11 place-items-center rounded-xl border border-[#d3e4e2] bg-white text-[#164b59] transition hover:bg-[#eaf4f3]">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>
      {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#b84f36] px-1 text-[0.65rem] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#cfe0de] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="font-bold text-[#123c45]">Notifications</h2><p className="text-xs text-slate-500">{unread ? `${unread} unread` : 'You are up to date'}</p></div>{unread > 0 && <button type="button" onClick={() => void markAll()} className="text-xs font-bold text-[#257d86]">Mark all read</button>}</div>
      <div className="max-h-96 overflow-y-auto">{items.length ? items.map(item => <Link key={item.id} href={item.bookingId ? `/admin/bookings/${item.bookingId}` : '/admin/notifications'} onClick={() => { void markRead(item); setOpen(false); }} className={`block border-b border-slate-100 p-4 transition hover:bg-[#f4f9f8] ${item.isRead ? '' : 'bg-[#edf7f5]'}`}><div className="flex gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.isRead ? 'bg-slate-300' : 'bg-[#257d86]'}`}/><div className="min-w-0"><p className="font-semibold text-[#123c45]">{item.title}</p><p className="mt-1 truncate text-sm text-slate-600">{item.message}</p><time className="mt-1 block text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</time></div></div></Link>) : <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>}</div>
      <Link href="/admin/notifications" onClick={() => setOpen(false)} className="block p-4 text-center text-sm font-bold text-[#164b59] hover:bg-[#f4f9f8]">View all notifications</Link>
    </div>}
  </div>;
}
