import { RoomGallery } from './RoomGallery';
export function ExperienceGallery({ images, title }: { images: string[]; title: string }) { return <RoomGallery images={images} roomName={title} />; }
