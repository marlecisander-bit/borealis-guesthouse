import type { ReactNode } from 'react';

const defaultIntro = {
  eyebrow: 'Book direct',
  heading: 'Your Koman stay, made simple.',
  description: 'Choose your room, add anything useful and review everything clearly before confirming.',
};

export function BookingStage({ intro, notice, children }: {
  intro?: Partial<typeof defaultIntro>;
  notice?: string;
  children: ReactNode;
}) {
  return <div data-booking-stage className="min-h-[calc(100svh-var(--public-header-height,4.5rem)-env(safe-area-inset-top))] bg-[#fbfaf7]">
    <section className="bg-ivory py-6 md:py-8">
      <div className="shell">
        <p className="eyebrow">{intro?.eyebrow || defaultIntro.eyebrow}</p>
        <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-none text-lake md:text-5xl">{intro?.heading || defaultIntro.heading}</h1>
        <p className="mt-3 max-w-xl leading-6 text-muted">{intro?.description || defaultIntro.description}</p>
        {notice && <p className="mt-4 max-w-xl whitespace-pre-line rounded-xl border border-lake/10 bg-white px-4 py-3 text-sm text-lake">{notice}</p>}
      </div>
    </section>
    <section className="py-5 md:py-8"><div className="shell">{children}</div></section>
  </div>;
}

export function BookingFlowSkeleton() {
  return <div role="status" aria-label="Preparing booking options" className="grid gap-10 motion-safe:animate-pulse lg:grid-cols-[1fr_23rem]">
    <div className="rounded-[1.5rem] bg-white p-5 shadow-sm md:p-8" aria-hidden="true">
      <div className="h-8 w-52 max-w-full rounded-full bg-brand-soft"/>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 rounded-xl bg-ivory"/>)}
      </div>
    </div>
    <div className="hidden h-72 rounded-[1.75rem] bg-brand-soft lg:block" aria-hidden="true"/>
  </div>;
}
