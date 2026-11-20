'use client';

export function NotificationTrigger({ unread = 0, open = false, busy = false, onClick }: {
  unread?: number;
  open?: boolean;
  busy?: boolean;
  onClick?: () => void;
}) {
  return <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
    aria-busy={busy || undefined} onClick={onClick}
    className="relative grid size-11 place-items-center rounded-xl border border-[#d3e4e2] bg-white text-[#164b59] transition hover:bg-[#eaf4f3]">
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>
    {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#b84f36] px-1 text-[0.65rem] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
  </button>;
}
