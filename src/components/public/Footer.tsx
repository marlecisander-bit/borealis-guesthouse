import Link from 'next/link';
import Image from 'next/image';
import {DeferredMedia} from './DeferredMedia';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { HomeLink } from './HomeLink';
import { isHomeNavigationItem } from '@/lib/navigation/home';
import { getContactInfo, getNavigation, getSiteDocument } from '@/services/site-content';
import { BookingLink } from './BookingLink';

type HomepageFooterProps = {
  backgroundImage: string;
  backgroundAlt: string;
  showCta?: boolean;
  ctaEyebrow?: string;
  ctaTitle?: string;
  ctaBody?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const fallbackLinks = [
  { label: 'Rooms', href: '/rooms' },
  { label: 'Experiences', href: '/experiences' },
  { label: 'Explore Koman', href: '/explore-koman' },
  { label: 'Gallery', href: '/gallery' },
];

async function getFooterContent() {
  const [contact, cms, managed] = await Promise.all([getContactInfo(), getSiteDocument('footer'), getNavigation('footer')]);
  return { contact, cms, links: managed.length ? managed : fallbackLinks };
}

export async function Footer() {
  const { contact, cms, links } = await getFooterContent();

  return <footer className="bg-brand pb-24 pt-16 text-white md:pb-10 md:pt-20">
    <div className="shell">
      <div className="grid gap-12 border-b border-white/15 pb-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <HomeLink ariaLabel="Borealis Guest House — Home" className="inline-block"><BorealisLogo variant="light" className="h-32 w-auto" /></HomeLink>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{cms.description || 'A boutique lakeside guesthouse for quiet stays, local journeys and unhurried time in Koman, Albania.'}</p>
          <BookingLink href={cms.bookingCtaTarget||'/book'} className="mt-7 min-h-12 rounded-full bg-sand px-6 py-3 text-xs font-bold uppercase tracking-[.12em] text-lake">{cms.bookingCtaLabel||'Book your stay'}</BookingLink>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-sand">{cms.exploreHeading||'Explore'}</h2>
          <nav className="mt-5 grid gap-3 text-sm text-white/70">{links.map(x => isHomeNavigationItem(x.label, x.href) ? <HomeLink key={`${x.href}-${x.label}`}>{x.label}</HomeLink> : <Link key={`${x.href}-${x.label}`} href={x.href}>{x.label}</Link>)}</nav>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-sand">{cms.findUsHeading||'Find us'}</h2>
          <div className="mt-5 grid gap-3 text-sm text-white/70">
            <p>{contact.address}</p>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {contact.phone && <a href={`tel:${contact.phone}`}>Call us</a>}
            {contact.whatsapp && <a href={contact.whatsapp}>WhatsApp</a>}
            {contact.instagram && <a href={contact.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {contact.facebook && <a href={contact.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
            {contact.mapsUrl && <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">Google Maps</a>}
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

export async function HomepageFooter({
  backgroundImage,
  backgroundAlt,
  showCta = true,
  ctaEyebrow,
  ctaTitle,
  ctaBody,
  ctaLabel,
  ctaHref,
}: HomepageFooterProps) {
  const { contact, cms, links } = await getFooterContent();

  return <footer data-homepage-final-footer className="relative isolate overflow-hidden bg-brand text-white">
    <ImageBackground src={backgroundImage} alt={backgroundAlt} />
    <div className="shell relative z-10 flex min-h-[25rem] flex-col justify-center py-9 md:py-11 lg:h-[26rem] lg:min-h-0">
      <div className="grid gap-8 border-b border-white/20 pb-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.05fr_.8fr_1.15fr] lg:items-center lg:gap-12">
        <div className="lg:border-r lg:border-white/20 lg:pr-12">
          <HomeLink ariaLabel="Borealis Guest House — Home" className="inline-block">
            <BorealisLogo variant="light" className="h-20 w-auto md:h-24" />
          </HomeLink>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">{cms.description || 'A boutique lakeside guesthouse for quiet stays, local journeys and unhurried time in Koman, Albania.'}</p>
        </div>

        {showCta && <div className="text-left md:self-center lg:text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-sand">{ctaTitle || ctaEyebrow || 'Your stay in Koman starts here'}</p>
          {ctaBody && <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/70">{ctaBody}</p>}
          <BookingLink href={ctaHref || cms.bookingCtaTarget || '/book'} className="mt-5 min-h-12 rounded-full bg-sand px-7 py-3 text-xs font-bold uppercase tracking-[.12em] text-lake">
            {ctaLabel || cms.bookingCtaLabel || 'Book your stay'}
          </BookingLink>
        </div>}

        <div className={`grid grid-cols-2 gap-7 ${showCta ? 'md:col-span-2 lg:col-span-1' : 'lg:col-span-2'}`}>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-sand">{cms.exploreHeading || 'Explore'}</h2>
            <nav className="mt-4 grid gap-2.5 text-sm text-white/75">
              {links.map(x => isHomeNavigationItem(x.label, x.href) ? <HomeLink key={`${x.href}-${x.label}`}>{x.label}</HomeLink> : <Link key={`${x.href}-${x.label}`} href={x.href}>{x.label}</Link>)}
            </nav>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-sand">{cms.findUsHeading || 'Find us'}</h2>
            <div className="mt-4 grid gap-2.5 text-sm text-white/75">
              <p>{contact.address}</p>
              {contact.mapsUrl && <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">Google Maps</a>}
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`}>Call us</a>}
              {contact.whatsapp && <a href={contact.whatsapp}>WhatsApp</a>}
              {contact.instagram && <a href={contact.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
              {contact.facebook && <a href={contact.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 pt-5 text-center text-xs text-white/55 md:grid-cols-3 md:items-center">
        <p className="md:col-start-2">{cms.copyright || `© ${new Date().getFullYear()} Borealis Guest House`}</p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-end">
          {cms.privacyUrl && <Link href={cms.privacyUrl}>{cms.privacyLabel || 'Privacy'}</Link>}
          {cms.bookingPolicyUrl && <Link href={cms.bookingPolicyUrl}>{cms.bookingPolicyLabel || 'Booking policy'}</Link>}
          {cms.termsUrl && <Link href={cms.termsUrl}>{cms.termsLabel || 'Terms'}</Link>}
        </div>
      </div>
    </div>
  </footer>;
}

function ImageBackground({ src, alt }: { src: string; alt: string }) {
  return <>
    <DeferredMedia><Image src={src} alt={alt} fill sizes="100vw" className="object-cover object-center"/></DeferredMedia>
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,70,52,.78),rgba(11,70,52,.88))]" />
  </>;
}
