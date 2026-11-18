import Link from 'next/link';
import { ContactForm } from '@/components/public/ContactForm';
import { MapPlaceholder } from '@/components/public/MapPlaceholder';
import { getContactInfo, getSiteDocument } from '@/services/site-content';

export async function ContactSection({draft}: {draft?: Record<string,string>} = {}) {
  const [contact, live] = await Promise.all([getContactInfo(), getSiteDocument('contact')]);
  const page = draft ? {...live,...draft} : live;
  const directDescription = /managed in Borealis settings/i.test(page.directDescription || '') ? '' : page.directDescription;

  return <>
    <section id="contact" className="shell public-section-anchor py-10 md:py-16">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">{page.eyebrow || 'Contact Borealis'}</p>
        <h2 className="mt-3 font-serif text-4xl text-lake md:text-6xl">Contact &amp; Directions</h2>
        <p className="mt-4 leading-7 text-muted">{page.introduction || 'Ask about a room, an experience, a transfer or the best way to reach us in Koman.'}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <aside className="rounded-3xl bg-lake p-6 text-white md:p-9">
          <h3 className="font-serif text-3xl">{page.directHeading || 'Talk to us directly.'}</h3>
          {directDescription && <p className="mt-4 text-sm leading-6 text-white/80">{directDescription}</p>}
          <div className="mt-5 grid gap-3">
            {contact.mapsUrl && <ContactAction label="Open in Google Maps" value={contact.address || 'Get directions'} href={contact.mapsUrl} newTab/>}
            {contact.phone && <ContactAction label="Call" value={contact.phoneLabel} href={`tel:${contact.phone}`}/>}
            {contact.whatsapp && <ContactAction label="WhatsApp" value={contact.whatsappLabel} href={contact.whatsapp} newTab/>}
            {contact.email && <ContactAction label="Email" value={contact.email} href={`mailto:${contact.email}`}/>}
            {contact.instagram && <ContactAction label="Instagram" value={contact.instagramLabel} href={contact.instagram} newTab/>}
            {contact.facebook && <ContactAction label="Facebook" value={contact.facebookLabel} href={contact.facebook} newTab/>}
          </div>
          {(contact.address || page.directionsText) && <div className="mt-6 border-t border-white/20 pt-5">
            {contact.address && <><p className="text-xs font-bold uppercase tracking-widest text-sand">{page.addressLabel || 'Address'}</p>
            <p className="mt-2 text-sm leading-6 text-white/85">{contact.address}</p></>}
            {page.directionsText && <p className="mt-3 text-sm leading-6 text-white/80">{page.directionsText}</p>}
          </div>}
        </aside>
        <ContactForm/>
      </div>
    </section>
    <section className="bg-ivory py-12 md:py-16">
      <div className="shell grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">{page.journeyEyebrow || 'How to reach Borealis'}</p>
          <h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">{page.journeyHeading || 'Plan the final part of your journey.'}</h2>
          <p className="mt-4 max-w-lg leading-7 text-muted">{page.journeyDescription || 'Koman connections can vary by route and season. Contact us for current directions and transfer options.'}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={page.primaryCtaTarget || '/transfers'} className="min-h-12 rounded-full bg-lake px-6 py-3 text-center text-sm font-bold text-white">{page.primaryCtaLabel || 'View transfers'}</Link>
            <Link href={page.secondaryCtaTarget || '/book'} className="min-h-12 rounded-full bg-sand px-6 py-3 text-center text-sm font-bold text-lake">{page.secondaryCtaLabel || 'Check availability'}</Link>
          </div>
        </div>
        <MapPlaceholder contact={contact}/>
      </div>
    </section>
  </>;
}

function ContactAction({ label, value, href, newTab }: { label: string; value: string; href: string; newTab?: boolean }) {
  return <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined} className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-2">
    <span>
      <span className="block text-xs font-bold uppercase tracking-widest text-sand">{label}</span>
      <span className="mt-1 block text-sm text-white/85">{value}</span>
    </span>
    <span aria-hidden="true" className="text-xl">→</span>
  </a>;
}
