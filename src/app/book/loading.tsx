export default function BookingLoading() {
  return <main className="min-h-screen bg-[#fbfaf7]" aria-label="Opening booking" aria-busy="true">
    <section className="bg-ivory py-12 md:py-20">
      <div className="shell animate-pulse">
        <div className="h-3 w-24 rounded-full bg-brand-soft" />
        <div className="mt-5 h-12 max-w-xl rounded-2xl bg-brand-soft md:h-16" />
        <div className="mt-5 h-5 max-w-lg rounded-full bg-brand-soft" />
      </div>
    </section>
    <section className="shell py-8 md:py-14">
      <div className="grid animate-pulse gap-10 lg:grid-cols-[1fr_23rem]">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm md:p-8">
          <div className="h-8 w-52 rounded-full bg-brand-soft" />
          <div className="mt-7 grid gap-3 sm:grid-cols-2">{Array.from({ length:4 },(_,index)=><div key={index} className="h-16 rounded-xl bg-ivory" />)}</div>
        </div>
        <div className="hidden h-72 rounded-[1.75rem] bg-brand-soft lg:block" />
      </div>
    </section>
  </main>;
}
