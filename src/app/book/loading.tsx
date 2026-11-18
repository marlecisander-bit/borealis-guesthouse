import { BookingFlowSkeleton, BookingStage } from '@/components/booking/BookingStage';
import { BorealisLogo } from '@/components/brand/BorealisLogo';

export default function BookingLoading() {
  return <>
    <div aria-hidden="true" className="public-header fixed inset-x-0 top-0 z-40 bg-ivory shadow-sm">
      <div className="public-header-bar shell flex items-center justify-between gap-4 border-b border-lake/10">
        <BorealisLogo priority className="block h-14 w-auto"/>
        <span className="text-xs font-semibold text-green">Opening booking…</span>
      </div>
    </div>
    <div aria-hidden="true" className="public-header-spacer"/>
    <main aria-label="Opening booking" aria-busy="true">
      <BookingStage><BookingFlowSkeleton/></BookingStage>
    </main>
  </>;
}
