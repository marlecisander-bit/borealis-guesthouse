import Link from 'next/link';
import {AdminPageHeader} from '@/components/admin/ui';
import {RoomTypeForm} from '@/components/admin/RoomTypeForm';
import {requireAdmin} from '@/lib/admin/auth';
import {adminRoomsRepository} from '@/lib/repositories/admin/rooms';

export default async function NewRoomPage(){
  const session=await requireAdmin(['owner','manager','editor']);
  const[amenities,agePolicy]=await Promise.all([adminRoomsRepository.listAmenities(session),adminRoomsRepository.getAgePolicy(session)]);
  return <div className="space-y-8"><AdminPageHeader title="Add Room" description="Create the room guests will see and book. Borealis creates its inventory automatically." actions={<Link href="/admin/rooms" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-center text-sm font-semibold">Back to rooms</Link>}/><RoomTypeForm room={null} amenities={amenities} agePolicy={agePolicy}/></div>;
}
