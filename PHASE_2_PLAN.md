# Phase 2 - Admin Core Development Plan

**Phase 1 Status**: ✓ Complete - Foundation established

## Phase 2 Overview

Phase 2 focuses on building the admin dashboard core, enabling the owner to manage rooms, amenities, rates, availability, and website content without technical assistance.

## Key Deliverables

### A. Admin Authentication & Layout
- [ ] Admin login page (`/admin/login`)
- [ ] Protected admin routes with authentication check
- [ ] Admin sidebar navigation
- [ ] Admin header with user menu
- [ ] Logout functionality
- [ ] Session management

**Files to Create**:
- `src/app/admin/layout.tsx`
- `src/app/admin/login/page.tsx`
- `src/components/layout/AdminHeader.tsx`
- `src/components/layout/AdminSidebar.tsx`
- `src/lib/supabase/middleware.ts` (auth middleware)

### B. Dashboard
- [ ] Overview page showing key metrics:
  - Upcoming arrivals/departures
  - Current occupancy
  - New bookings (once Phase 3 complete)
  - Recent activities
- [ ] Quick stats cards

**Files to Create**:
- `src/app/admin/dashboard/page.tsx`
- `src/components/admin/DashboardStats.tsx`
- `src/components/admin/UpcomingArrivals.tsx`

### C. Rooms Management
- [ ] List all rooms with filters
- [ ] Create new room
- [ ] Edit room details
- [ ] Delete/archive room
- [ ] Bulk operations
- [ ] Room type management
- [ ] View room images (preview)

**Files to Create**:
- `src/app/admin/rooms/page.tsx`
- `src/app/admin/rooms/[id]/page.tsx`
- `src/app/admin/rooms/new/page.tsx`
- `src/components/admin/RoomForm.tsx`
- `src/components/admin/RoomTable.tsx`
- `src/app/admin/room-types/page.tsx`
- `src/components/admin/RoomTypeForm.tsx`

### D. Amenities Management
- [ ] Create amenity catalogue
- [ ] Edit amenities
- [ ] Delete amenities
- [ ] Assign amenities to rooms
- [ ] Bulk amenity assignment
- [ ] Icon selection

**Files to Create**:
- `src/app/admin/amenities/page.tsx`
- `src/app/admin/amenities/new/page.tsx`
- `src/app/admin/amenities/[id]/page.tsx`
- `src/components/admin/AmenityForm.tsx`
- `src/components/admin/AmenityTable.tsx`
- `src/components/admin/RoomAmenitiesSelector.tsx`

### E. Rates Management
- [ ] Set base prices per room type
- [ ] Create rate rules (seasonal, discounts)
- [ ] Manage minimum stay requirements
- [ ] View rate calendar/matrix
- [ ] Bulk price updates

**Files to Create**:
- `src/app/admin/rates/page.tsx`
- `src/app/admin/rates/[roomTypeId]/edit/page.tsx`
- `src/components/admin/RateForm.tsx`
- `src/components/admin/RateRuleForm.tsx`
- `src/components/admin/RateMatrix.tsx`

### F. Availability Management
- [ ] Visual calendar (month view)
- [ ] Open/close dates for rooms
- [ ] Block unavailable dates
- [ ] Quick availability toggle
- [ ] Multi-room operations

**Files to Create**:
- `src/app/admin/availability/page.tsx`
- `src/components/admin/AvailabilityCalendar.tsx`
- `src/components/admin/AvailabilityBulkActions.tsx`

### G. Media Library
- [ ] Upload images (via Supabase Storage)
- [ ] Organize by room/property
- [ ] Edit image metadata (alt text, title)
- [ ] Delete images
- [ ] Reorder images (for galleries)
- [ ] Thumbnail preview

**Files to Create**:
- `src/app/admin/media/page.tsx`
- `src/components/admin/MediaUpload.tsx`
- `src/components/admin/MediaGallery.tsx`
- `src/components/admin/MediaEditor.tsx`

### H. Website CMS
- [ ] Edit homepage hero image
- [ ] Edit page titles and descriptions
- [ ] Manage page sections (show/hide, reorder)
- [ ] Edit page content (markdown or WYSIWYG)
- [ ] Preview pages
- [ ] SEO fields editor (title, meta description, slug)

**Files to Create**:
- `src/app/admin/website/page.tsx`
- `src/app/admin/website/pages/[pageId]/edit/page.tsx`
- `src/components/admin/PageEditor.tsx`
- `src/components/admin/SEOEditor.tsx`
- `src/components/admin/PagePreview.tsx`

### I. Settings
- [ ] Property information (name, location, description)
- [ ] Contact details (email, phone, WhatsApp)
- [ ] Check-in/check-out times
- [ ] Currency and language settings
- [ ] Social media links
- [ ] Policies (cancellation, refunds, etc.)

**Files to Create**:
- `src/app/admin/settings/page.tsx`
- `src/components/admin/SettingsForm.tsx`

## UI Components to Create

### Shared Admin Components
- `AdminButton.tsx` - Consistent button styling
- `AdminCard.tsx` - Card container for content
- `AdminTable.tsx` - Reusable data table
- `AdminForm.tsx` - Reusable form wrapper
- `AdminModal.tsx` - Reusable modal dialog
- `AdminTabs.tsx` - Tab navigation
- `AdminSearchBar.tsx` - Search functionality
- `AdminPagination.tsx` - Pagination control
- `AdminNotification.tsx` - Toast/notification system
- `ConfirmDialog.tsx` - Confirmation dialog
- `FileUpload.tsx` - File upload component

## Database Queries/Hooks Needed

Create hooks in `src/hooks/` for common operations:
- `useRooms()` - CRUD operations for rooms
- `useRoomTypes()` - CRUD for room types
- `useAmenities()` - CRUD for amenities
- `useRates()` - CRUD for rates
- `useAvailability()` - Calendar and availability updates
- `useMediaAssets()` - Upload, organize, delete media
- `usePages()` - CMS page operations
- `useSettings()` - Settings management
- `useProperty()` - Property information

## Development Priorities

1. **Week 1**: Auth & Dashboard Layout
   - Admin login flow
   - Protected routes
   - Dashboard skeleton
   - Navigation structure

2. **Week 2**: Rooms & Room Types
   - Full CRUD for rooms
   - Room type management
   - Room listing and search

3. **Week 3**: Amenities & Rates
   - Amenity management
   - Room-amenity assignment
   - Rate configuration

4. **Week 4**: Availability & Media
   - Calendar interface
   - Availability management
   - Media upload and management

5. **Week 5**: CMS & Settings
   - Page editor
   - Content management
   - Settings interface
   - Final integration and testing

## Testing Requirements

- [ ] All admin pages load correctly when authenticated
- [ ] Create/Edit/Delete operations work for all modules
- [ ] Form validation prevents invalid data entry
- [ ] Bulk operations handle multiple items correctly
- [ ] Images upload successfully to Supabase Storage
- [ ] Changes persist in database correctly
- [ ] Proper error handling and user feedback
- [ ] Responsive design works on tablet and desktop
- [ ] Loading states show during async operations

## Database Permissions

- Create admin user accounts during setup
- Implement Row Level Security (RLS) policies:
  - Admin can only access their property's data
  - Different permission levels (Owner > Manager > Staff)
  - Audit trail for changes

## Success Criteria

- ✓ Owner can manage all room inventory without code editing
- ✓ Owner can update prices and availability independently
- ✓ Owner can upload and organize property images
- ✓ Owner can edit website content through CMS
- ✓ All changes immediately reflect in database
- ✓ System provides clear feedback on all operations
- ✓ Admin interface is intuitive and mobile-friendly for initial setup

## Next Phase

After Phase 2 completion:
- Phase 3 will implement the booking engine using the room/availability data
- Phase 4 will add experiences and transfers
- Phase 5 will create the public-facing website using the same data

---

**Estimated Duration**: 3-4 weeks
**Team Size**: 1-2 developers
**Next Update**: When Phase 1 is reviewed and approved
