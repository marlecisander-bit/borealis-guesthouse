# Team & Access

The Team & Access release candidate uses the existing Supabase sign-in. The migration is `database/migrations/20261118_045_team_access.sql`. It adds explicit permissions to existing property memberships and leaves their Auth user IDs intact. It also adds a property invitation ledger, an audit log and a lock for ownership changes.

## Permission matrix

| Preset | Granted operations |
| --- | --- |
| Super Admin | Existing owner operations and Team & Access. An active owner membership is required. Owner memberships are provisioned in Supabase. |
| Property Manager | Masked booking views, guest contacts and cancellation; calendar and blocks; room content and occupancy; standard rates; offer descriptions. |
| Rooms Editor | Room descriptions, room amenities and selection of approved property photos. |
| Availability Operator | Calendar occupancy and manual blocks. Calendar output includes room, dates and status. |
| Bookings Viewer | Reservation reference, dates, reservation status, payment status and guest count. |
| Website Editor | Save and preview copy drafts for supported CMS pages and select approved photos for supported page heroes. |
| Saved role | Name a reusable permission set and assign it to an existing member or invitation. Separately grant contact access, cancellation, CSV export, availability, room content, occupancy, standard rates, offer descriptions, draft edits or publication. Contact access, cancellation and export imply booking view. Publication implies draft access. |

Assignments copy the saved permissions to the membership or invitation.

The permission-based workspace currently has a narrower operation set than the legacy screens. It lacks manual creation and editing of reservations, seasonal rate and rule editing, full offer editing, Homepage CMS editing, and full public-layout draft preview across every page. Rooms, Gallery and Contact preview saved draft copy in their public layouts. Other supported editors show the saved text in a private preview. Team & Access, sensitive integrations and other existing broad screens remain unavailable to restricted memberships. New permission keys start with no grants.

## Existing access and upgrade

- An active legacy `owner` maps to Super Admin with the same Auth account. All existing owners map this way. Before release, reconcile the owner list with the property owner and confirm which accounts should retain ownership.
- Legacy manager, editor and staff memberships keep their existing grants. Their labels in the directory say Legacy. Saving an explicit permission set replaces those grants. Review each legacy membership before conversion. Suspension works for both models.
- Apply migration 045 to the schema that already has the booking, CMS, storage and Web Push changes. Coordinate the database migration and app deployment.
- The owner signs in with the existing Supabase account, opens **Settings → Team & Access**, and selects **Create role**. Save the role name and permissions, then select it in a member’s access form or when inviting someone.
- A database trigger rejects removal or demotion of the last active owner and serializes such changes by property.

## Auth delivery

Configure the server-side Supabase service key and a trusted `APP_URL`. In Supabase Auth add the acceptance URL on that origin to Allowed Redirect URLs and verify that the invitation email uses Supabase's confirmation link with the provided redirect. Configure and test the project's mail delivery separately.

The membership is reserved before the app requests email delivery. If Supabase rejects delivery, the invitation stays pending and can be resent. An already-registered user can use the acceptance link and sign in with the matching verified Auth email. Acceptance atomically binds that verified Auth user ID to the invitation's property and consumes the invitation. An expired or cancelled link cannot activate access. Reinviting a cancelled address issues a new invitation ID. Delivery acceptance from Supabase is not proof of arrival in an inbox. Provider behavior for resending to an unconfirmed existing Auth account still needs an isolated hosted Auth test.

## Access audit

| Surface | Enforcement |
| --- | --- |
| Admin pages and actions | Legacy entry points use the shared current identity check. The restricted workspace has separate server gates and filtered navigation. SQL checks the current active membership again for each protected operation. |
| Dashboard, search, bookings and export | Legacy dashboard and search are unavailable to restricted memberships. Restricted bookings and CSV use explicit projections. Guest fields require the contact grant, and CSV requires a separate export grant. |
| Calendar and inventory | Restricted calendar uses a projection with no guest identifiers, names or contacts. Its writes select property-owned rooms and manual blocks. The database's inventory and overlap safeguards remain in use. |
| CMS and homepage | Legacy editor and preview routes keep their role checks. Restricted CMS reads and writes project approved fields and separate draft and publish operations. The migration also denies direct draft-column reads. |
| Rooms, rates and media | Restricted operations use dedicated RPCs with field allowlists. The storage path policy requires a legacy active role . Selecting existing approved assets does not confer upload or delete access. |
| Invitations and revocation | Only an active owner may manage the team. The service key is used only to request Auth email delivery after authorization and reservation. Membership operations and role creation are logged without passwords, invitation tokens or session secrets. |
| Notifications | Restricted accounts do not access the existing notification inbox or push routes. The database worker eligibility check excludes suspended and permission-based accounts. Before claiming owner email, the dispatcher excludes suspended and explicit-permission membership addresses. External notification recipients remain property settings and should be reviewed separately. |
| Public routes | Public booking and published content retain their own entry points. The team RPCs require an authenticated current membership. |

The SQL integration tests use PGlite, an isolated schema fixture and synthetic claims. They exercise the actual migration and authenticated SQL grants. Browser UI checks use synthetic Supabase responses. Before release, test owner sign-in, email acceptance and resend, concurrent last-owner protection against the target database, and every deployed policy including older manually applied policies. Do not infer the live policy inventory from this fixture.
