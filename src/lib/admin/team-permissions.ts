export const permissionGroups = [
  {label:'Bookings', items:[
    ['bookings.view','View reservations'], ['bookings.contacts','View guest contact details'],
    ['bookings.manage','Change reservations'], ['bookings.export','Export reservations'],
  ]},
  {label:'Inventory and offers',items:[
    ['availability.manage','View the calendar and manage blocks'], ['rooms.content','Edit room content and select approved photos'],
    ['rooms.capacity','Change room occupancy'], ['rates.manage','Manage standard nightly rates'],
    ['offers.manage','Manage experiences and transfers'],
  ]},
  {label:'Website',items:[
    ['website.draft','Save and preview website drafts'], ['website.publish','Publish website changes'],
  ]},
] as const;

export type TeamPermission = typeof permissionGroups[number]['items'][number][0];
export const teamPresets: Record<string, readonly TeamPermission[]> = {
  'Property Manager':['bookings.view','bookings.contacts','bookings.manage','availability.manage','rooms.content','rooms.capacity','rates.manage','offers.manage'],
  'Rooms Editor':['rooms.content'],
  'Availability Operator':['availability.manage'],
  'Bookings Viewer':['bookings.view'],
  'Website Editor':['website.draft'],
};

export const dependsOn: Partial<Record<TeamPermission, TeamPermission>> = {
  'bookings.contacts':'bookings.view','bookings.manage':'bookings.view','bookings.export':'bookings.view',
  'website.publish':'website.draft',
};
export const permissionLabels = new Map<TeamPermission,string>(permissionGroups.flatMap<readonly [TeamPermission,string]>(group=>[...group.items]));
export function effectiveTeamPermissions(values: readonly string[]): TeamPermission[] {
  const unique = new Set<TeamPermission>();
  for (const value of values) {
    const permission = value as TeamPermission;
    if (!permissionLabels.has(permission)) throw new Error('Unknown permission.');
    unique.add(permission);
    const dependency = dependsOn[permission];
    if (dependency) unique.add(dependency);
  }
  return [...unique].sort();
}

export const teamWorkspaces = [
  {key:'calendar', label:'Calendar', permission:'availability.manage'},
  {key:'bookings', label:'Bookings', permission:'bookings.view'},
  {key:'website', label:'Website', permission:'website.draft'},
  {key:'rooms', label:'Rooms', permission:'rooms.content'},
  {key:'capacity', label:'Occupancy', permission:'rooms.capacity'},
  {key:'rates', label:'Rates', permission:'rates.manage'},
  {key:'offers', label:'Offers', permission:'offers.manage'},
] as const;
