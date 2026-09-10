export interface SEOData { title: string; description: string; canonical?: string; image?: string }
export interface Amenity { id: string; name: string; icon?: string }
export interface Property { name: string; tagline: string; description: string; location: string; heroImage: string; amenities: Amenity[]; seo: SEOData }
export interface RoomType { id: string; name: string; description: string; capacity: number }
export interface Room { id: string; slug: string; name: string; eyebrow: string; description: string; longDescription: string; image: string; gallery: string[]; priceFrom: number; capacity: number; beds: string; size: string; viewType: string; amenities: Amenity[]; seo: SEOData }
export interface Experience { id: string; slug: string; title: string; description: string; longDescription: string; image: string; gallery: string[]; duration: string; capacity: string; priceFrom: number | null; priceType: string; availability: string; meetingPoint: string; included: string[]; notes: string[]; bookingRequirements: string[]; category: string; seo: SEOData }
export interface TransferRoute { id: string; origin: string; destination: string; description: string; duration: string; capacity: number | null; vehicleServiceType: string; pricingMethod: 'fixed' | 'from' | 'quote'; price: number | null; bookingNotice: string; active: boolean; image: string }
export interface TourismCategory { id: string; name: string; slug: string }
export interface TourismArticle { id: string; slug: string; title: string; excerpt: string; body: string[]; image: string; category: TourismCategory; readTime: string; seo: SEOData }
export interface GalleryItem { id: string; src: string; alt: string; category: string }
export interface Review { id: string; quote: string; author: string; origin: string }
export interface ContactInfo { email: string; phone: string; phoneLabel: string; whatsapp: string; whatsappLabel: string; instagram: string; instagramLabel: string; address: string; mapsUrl: string; placeholder: boolean }
export interface AboutSection { id: string; eyebrow: string; title: string; copy: string; image: string; imageAlt: string }
export interface AboutContent { heroTitle: string; heroCopy: string; heroImage: string; sections: AboutSection[]; philosophy: string[] }
