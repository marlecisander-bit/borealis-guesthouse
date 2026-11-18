type PropertyContact = {
  phone?: string | null;
  email?: string | null;
  instagram_url?: string | null;
  address_line?: string | null;
  location?: string | null;
};

/** Null represents a legacy unset value. An explicit blank disables the channel. */
export function resolvePropertyContact(property: PropertyContact | null, legacy: Record<string, string>) {
  return {
    phone: property?.phone ?? legacy.phone ?? '',
    email: property?.email ?? legacy.email ?? '',
    instagram: property?.instagram_url ?? legacy.instagram ?? '',
    address: property?.address_line ?? (property?.location || legacy.address || ''),
  };
}
