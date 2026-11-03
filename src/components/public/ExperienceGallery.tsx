import type {ResponsiveHeroProps} from './ResponsiveHeroImage';
import { RoomGallery } from './RoomGallery';
export function ExperienceGallery({ images, title, hero }: { images: string[]; title: string;hero?:Omit<ResponsiveHeroProps,'desktopImage'> }) { return <RoomGallery images={images} roomName={title} hero={hero} />; }
