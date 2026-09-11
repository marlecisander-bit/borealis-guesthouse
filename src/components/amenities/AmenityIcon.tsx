import type { ReactNode } from 'react';
import { amenityIconRegistry } from '@/lib/amenities/icon-registry';

export const amenityIconOptions = amenityIconRegistry.map(({ key, label, category }) => ({ id: key, label, category }));

const drawings: Record<string, ReactNode> = {
  wifi: <><path d="M4.5 10.5a11 11 0 0 1 15 0"/><path d="M7.7 14a6.4 6.4 0 0 1 8.6 0"/><path d="M10.8 17.4a1.8 1.8 0 0 1 2.4 0"/><circle cx="12" cy="20" r=".6" fill="currentColor" stroke="none"/></>,
  parking: <><circle cx="12" cy="12" r="9"/><path d="M9.5 17V7h3.2a3.2 3.2 0 0 1 0 6.4H9.5"/></>,
  'airport-shuttle': <><path d="M3 8h13.5a3 3 0 0 1 3 3v6H3z"/><path d="M6 8V5h6"/><path d="M3 13h16.5M7 13V8"/><circle cx="7" cy="18" r="1.7"/><circle cx="16" cy="18" r="1.7"/><path d="m4 4 2-1"/></>,
  'non-smoking': <><path d="M3.5 16h12M18 16h1.5a1.5 1.5 0 0 1 0 3H8"/><path d="M16 16v3M13.5 11c2-1.2.7-2.4 2.1-3.5"/><path d="M3 3l18 18"/></>,
  'room-service': <><path d="M4 16h16M6.5 16a5.5 5.5 0 0 1 11 0"/><path d="M12 8V6"/><circle cx="12" cy="5" r="1"/></>,
  'family-rooms': <><circle cx="8" cy="8" r="2.5"/><circle cx="17" cy="9" r="2"/><path d="M3.5 19v-2.2A4.5 4.5 0 0 1 8 12.3a4.5 4.5 0 0 1 4.5 4.5V19"/><path d="M14 13.5a4 4 0 0 1 6.5 3.1V19"/></>,
  'coffee-maker': <><path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4v2M12 4v2"/></>,
  breakfast: <><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10"/><path d="M16 3v18M16 3c3 1 4 4 4 7h-4"/></>,
  bar: <><path d="M4 4h16l-8 9zM12 13v7M8 20h8"/><path d="M7 7h10"/></>,
  'private-beach': <><path d="M3 20c2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0"/><path d="M7 16 12 5M5 10c2.5-4.5 8.5-6 13-2.5-2.7-.2-4.5.7-5.5 2.8-1.8-1.5-4.3-1.7-7.5-.3Z"/></>,
  'lake-view': <><path d="m3 16 5-6 4 4 3-3 6 5"/><path d="M4 20c2-1 4-1 6 0 2-1 4-1 6 0 1.5-.8 3-.9 4.5-.2"/><circle cx="17.5" cy="6.5" r="2.5"/></>,
  'air-conditioning': <><path d="M12 2v20M4.2 6.5l15.6 11M4.2 17.5l15.6-11"/><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2"/></>,
  'private-bathroom': <><path d="M5 11h14M7 11V7a4 4 0 0 1 7.5-2"/><path d="M6 11v3a6 6 0 0 0 12 0v-3M8 20v2M16 20v2"/></>,
  balcony: <><path d="M5 20V5h14v15M5 10h14M3 14h18M7 14v6M12 14v6M17 14v6"/></>,
  accessible: <><circle cx="12" cy="4.5" r="2"/><path d="m10 8-1 6h5l3 5M9.5 11.5a5 5 0 1 0 5.5 7.8"/></>,
  tv: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="m9 3 3 3 3-3M9 21h6"/></>,
  minibar: <><path d="M6 3h5v18H6zM7.5 7h2M15 8h4l-1 5a2 2 0 0 1-2 1.5A2 2 0 0 1 14 13zM16 14.5V20M14 20h4"/></>,
  door: <><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 21V6h7v15M13.5 13h.5"/></>,
  shirt: <><path d="m8 4-5 3 2 4 3-1v10h8V10l3 1 2-4-5-3a4.5 4.5 0 0 1-8 0Z"/></>,
  iron: <><path d="M4 16h16v4H4zM6 16c1-5 4-8 9-8h2l3 8M13 8V5h4v3"/></>,
  armchair: <><path d="M6 12V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4M4 11a2 2 0 0 0-2 2v5h20v-5a2 2 0 0 0-2-2M5 18v3M19 18v3"/></>,
  utensils: <><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M16 3v18M16 3c3 1 4 4 4 7h-4"/></>,
  table: <><path d="M4 8h16M6 8v12M18 8v12M3 5h18v3H3z"/></>,
  stairs: <><path d="M3 19h5v-4h4v-4h4V7h5M16 3h5v4"/></>,
  bed: <><path d="M3 19V7M21 19v-7H8a4 4 0 0 0-4 4v1h17M7 12V9h5a3 3 0 0 1 3 3"/></>,
  kitchen: <><path d="M4 3v18M20 3v18M4 8h16M4 15h16M9 8v7M16 11h1"/></>,
  refrigerator: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/></>,
  oven: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M7 6h.1M11 6h.1M15 6h.1"/><rect x="7" y="12" width="10" height="6" rx="1"/></>,
  washing: <><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="5"/><path d="M7 6h.1M10 6h6"/></>,
  shower: <><path d="M6 20V8a5 5 0 0 1 10 0M13 8h6M15 12v.1M18 12v.1M15 16v.1M18 16v.1"/></>,
  towel: <><path d="M6 3h12v18H6zM6 9h12M10 9v12"/></>,
  wind: <><path d="M3 8h11a2 2 0 1 0-2-3M3 12h16a2 2 0 1 1-2 3M3 16h8"/></>,
  'toilet-paper': <><circle cx="9" cy="10" r="6"/><circle cx="9" cy="10" r="2"/><path d="M9 4h7a4 4 0 0 1 4 4v10h-7v-8"/></>,
  toiletries: <><path d="M7 7h10v14H7zM9 3h6v4M5 11H3v8h4M10 12h4M12 10v4"/></>,
  leaf: <><path d="M20 4C10 4 5 9 5 16c5 1 12-2 15-12ZM4 21c2-6 6-9 12-13"/></>,
  mountain: <><path d="m3 19 7-12 4 6 2-3 5 9ZM8 10l2 2 2-2"/></>,
  waves: <><path d="M3 8c2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0M3 13c2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0M3 18c2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0 2-1.5 4-1.5 6 0"/></>,
  building: <><path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h2M14 8h2M8 12h2M14 12h2M10 21v-5h4v5"/></>,
  heating: <><path d="M8 4c-2 3 2 4 0 7s2 4 0 7M13 4c-2 3 2 4 0 7s2 4 0 7M18 4c-2 3 2 4 0 7s2 4 0 7"/></>,
  bbq: <><path d="M4 10h16a8 8 0 0 1-16 0ZM7 18l-2 4M17 18l2 4M8 6c-1-1-1-2 0-3M12 6c-1-1-1-2 0-3M16 6c-1-1-1-2 0-3"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
  luggage: <><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V4h6v3M9 11v6M15 11v6"/></>,
  fishing: <><path d="M6 20V7a4 4 0 0 1 8 0v8a3 3 0 0 0 6 0M3 20h6M18 12v3"/></>,
  hiking: <><circle cx="13" cy="4" r="2"/><path d="m10 21 2-7-3-3 2-4 4 3h4M12 14l4 7M9 11l-4 5"/></>,
  kayaking: <><path d="M4 15c3-4 13-4 16 0-3 4-13 4-16 0ZM7 4l10 8M15 3l3 3M6 12l3 3"/></>,
  fallback: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></>,
};

export function AmenityIcon({ name, className = 'size-5' }: { name?: string | null; className?: string }) {
  const definition = amenityIconRegistry.find((item) => item.key === name);
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {drawings[definition?.drawAs || 'fallback'] || drawings.fallback}
    </svg>
  );
}
