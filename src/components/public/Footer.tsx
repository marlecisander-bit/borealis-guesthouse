import Link from 'next/link';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { HomeLink } from './HomeLink';
import { isHomeNavigationItem } from '@/lib/navigation/home';
import { getContactInfo, getNavigation, getSiteDocument } from '@/services/site-content';

export async function Footer() {
  const [contact, cms, managed] = await Promise.all([getContactInfo(), getSiteDocument('footer'), getNavigation('footer')]);
  const links = managed.length ? managed : [{ label: 'Rooms', href: '/rooms' }, { label: 'Experiences', href: '/experiences' }, { label: 'Explore Koman', href: '/explore-koman' }, { label: 'Gallery', href: '/gallery' }];

  return <footer className="bg-lake pb-24 pt-16 text-white md:pb-10 md:pt-20">
    <div className="shell">
      <div className="grid gap-12 border-b border-white/15 pb-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <HomeLink ariaLabel="Borealis Guest House — Home" className="inline-block"><BorealisLogo variant="light" className="h-32 w-auto" /></HomeLink>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{cms.description || 'A boutique lakeside guesthouse for quiet stays, local journeys and unhurried time in Koman, Albania.'}</p>
          <Link href="/book" className="mt-7 inline-block min-h-12 rounded-full bg-sand px-6 py-3 text-xs font-bold uppercase tracking-[.12em] text-lake">Book your stay</Link>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-sand">Explore</h2>
          <nav className="mt-5 grid gap-3 text-sm text-white/70">{links.map(x => isHomeNavigationItem(x.label, x.href) ? <HomeLink key={`${x.href}-${x.label}`}>{x.label}</HomeLink> : <Link key={`${x.href}-${x.label}`} href={x.href}>{x.label}</Link>)}</nav>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-sand">Find us</h2>
          <div className="mt-5 grid gap-3 text-sm text-white/70">
            <p>{contact.address}</p>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {contact.phone && <a href={`tel:${contact.phone}`}>Call us</a>}
            {contact.whatsapp && <a href={contact.whatsapp}>WhatsApp</a>}
            {contact.instagram && <a href={contact.instagram}>Instagram</a>}
            {contact.mapsUrl && <a href={contact.mapsUrl}>Google Maps</a>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
        <p>{cms.copyright || `© ${new Date().getFullYear()} Borealis Guest House`}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {cms.privacyUrl && <Link href={cms.privacyUrl}>{cms.privacyLabel || 'Privacy'}</Link>}
          {cms.bookingPolicyUrl && <Link href={cms.bookingPolicyUrl}>{cms.bookingPolicyLabel || 'Booking policy'}</Link>}
          {cms.termsUrl && <Link href={cms.termsUrl}>{cms.termsLabel || 'Terms'}</Link>}
        </div>
      </div>
    </div>
  </footer>;
}
