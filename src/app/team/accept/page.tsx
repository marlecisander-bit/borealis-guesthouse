import { InvitationAcceptance } from '@/components/admin/InvitationAcceptance';

export const metadata = { title:'Accept Borealis invitation', robots:{index:false,follow:false}, referrer:'no-referrer' };

export default async function Page({searchParams}:{searchParams:Promise<{invitation?:string}>}) {
  const {invitation=''} = await searchParams;
  return <InvitationAcceptance invitation={/^[\da-f-]{36}$/i.test(invitation)?invitation:''}/>;
}
