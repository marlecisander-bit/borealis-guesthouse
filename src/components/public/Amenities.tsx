import type { Amenity } from '@/types/public';

export function Amenities({ items, compact = false }: { items: Amenity[]; compact?: boolean }) {
  return (
    <ul className={`grid ${compact ? 'grid-cols-2 gap-x-4 gap-y-2' : 'gap-3 sm:grid-cols-2'}`}>
      {items.map((item) => (
        <li key={item.id} className={compact ? 'text-sm text-muted' : 'rounded-2xl bg-ivory px-5 py-4 text-sm font-medium text-lake'}>
          <span aria-hidden="true" className="mr-2 text-green">•</span>{item.name}
        </li>
      ))}
    </ul>
  );
}
