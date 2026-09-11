import type { ContactInfo } from '@/types/public';
import { getGoogleMapsEmbedUrl } from '@/services/google-maps';

export async function MapPlaceholder({ contact, className = 'min-h-[28rem]' }: { contact: ContactInfo; className?: string }) {
  const embedUrl = await getGoogleMapsEmbedUrl(contact.mapsUrl, contact.address);
  if (!embedUrl) return <MapFallback contact={contact} className={className}/>;
  return <div data-testid="property-map" data-map-state={embedUrl ? 'interactive' : 'fallback'} className={`relative overflow-hidden rounded-[1.75rem] bg-green text-white ${className}`}>
    <>
      <iframe
        title="Borealis Guest House location on Google Maps"
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full border-0"
        allowFullScreen={false}
      />
      <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 rounded-full bg-white/95 px-5 py-3 text-sm font-bold text-lake shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        View on Google Maps
      </a>
    </>
  </div>;
}

export function MapFallback({ contact, className = 'min-h-[28rem]' }: { contact: ContactInfo; className?: string }) {
  return <div data-testid="property-map" data-map-state="fallback" className={`relative overflow-hidden rounded-[1.75rem] bg-green text-white ${className}`}>
    <div className="absolute inset-5 rounded-[1.25rem] border border-white/20 bg-[radial-gradient(circle_at_65%_30%,rgba(232,222,208,.35),transparent_22%),linear-gradient(135deg,rgba(255,255,255,.08),transparent)]"/>
    <div className="absolute inset-0 grid place-items-center p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-full bg-sand font-serif text-2xl text-lake">B</span><h2 className="mt-4 font-serif text-3xl">Borealis · Koman</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/65">{contact.address}</p><p className="mt-5 text-xs font-bold uppercase tracking-widest text-sand">Location map coming soon</p></div></div>
  </div>;
}
