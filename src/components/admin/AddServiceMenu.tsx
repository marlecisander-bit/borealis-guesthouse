import Link from 'next/link';

const services = [
  ['Experience', '/admin/experiences/new'],
  ['Equipment rental', '/admin/experiences/new?type=rental'],
  ['Transfer', '/admin/transfers/new'],
] as const;

export function AddServiceMenu({ canAddTransfer }: { canAddTransfer: boolean }) {
  return <details className="relative">
    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg bg-brand px-4 text-sm font-bold text-white">
      Add service <span aria-hidden="true" className="ml-2">▾</span>
    </summary>
    <ul className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-stone-200 bg-white p-1 shadow-lg">
      {services.filter(([label]) => label !== 'Transfer' || canAddTransfer).map(([label, href]) =>
        <li key={href}><Link href={href} className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:bg-ivory">{label}</Link></li>
      )}
    </ul>
  </details>;
}
