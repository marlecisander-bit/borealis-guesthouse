import { AmenityIcon } from '@/components/amenities/AmenityIcon';
import type { Amenity } from '@/types/public';

export function Amenities({ items, compact = false }: { items: Amenity[]; compact?: boolean }) {
  return (
    <ul className={`grid ${compact ? 'grid-cols-2 gap-x-4 gap-y-2' : 'gap-3 sm:grid-cols-2'}`}>
      {items.map((item) => (
        <li key={item.id} className={`flex items-center ${compact ? 'gap-2 text-sm text-muted' : 'gap-3 rounded-2xl bg-ivory px-5 py-4 text-sm font-medium text-lake'}`}>
          <span aria-hidden="true" className={`grid shrink-0 place-items-center text-green ${compact ? 'size-5' : 'size-8 rounded-full bg-white/70'}`}>
            <AmenityIcon name={item.icon} className={compact ? 'size-4' : 'size-5'} />
          </span>
          <span>{item.name}</span>
        </li>
      ))}
    </ul>
  );
}
