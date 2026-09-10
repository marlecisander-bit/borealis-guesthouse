# Borealis Guest House Digital Platform

A comprehensive mobile-first digital platform for Borealis guest house featuring a public booking website, direct booking engine, experiences/transfers marketplace, and complete admin CMS.

## Project Structure

```
src/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components
│   └── layout/              # Layout components (Header, Footer, Sidebar)
├── lib/
│   └── supabase/            # Supabase configuration
│       ├── client.ts        # Client-side Supabase client
│       └── server.ts        # Server-side Supabase client
├── hooks/                   # React hooks
│   └── useAuth.ts          # Authentication hook
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   └── helpers.ts          # Utility functions
└── styles/                  # Additional stylesheets
```

## Technology Stack

- **Frontend**: Next.js 16 + TypeScript
- **UI Framework**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: Netlify
- **Email**: Resend (phase 7)
- **Analytics**: Google Analytics 4 + Search Console

## Development Phases

### Phase 1 - Foundation ✓ (Current)
- Repository and Next.js structure setup
- Supabase project configuration
- Database schema planning
- Authentication infrastructure
- Design system foundation
- **Status**: Core setup complete, ready for Phase 2

### Phase 2 - Admin Core (Next)
- Dashboard & operational overview
- Rooms, room types & amenities management
- Rates, seasons & availability
- Website CMS & media library
- Settings management

### Phase 3 - Booking Engine
- Room search functionality
- Availability validation
- Booking lifecycle management
- Confirmation workflow
- Admin booking management

### Phase 4 - Experiences & Transfers
- Bookable activities management
- Route management
- Combined booking logic
- Cart functionality

### Phase 5 - Public Experience
- Mobile-first homepage
- Rooms catalog
- Experiences & transfers booking
- Gallery
- About & Contact pages

### Phase 6 - Explore Koman & SEO
- Tourism content CMS
- Article management
- Technical SEO implementation
- Multilingual framework
- Analytics integration

### Phase 7 - Integrations & Launch
- Email notifications (Resend)
- Payment integration
- External calendar sync
- Channel manager ready
- QA & Netlify deployment

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd borealis-webapp
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Run development server
```bash
npm run dev
```

Navigate to `http://localhost:3000`

## Environment Variables

Required environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_NAME=Borealis
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Schema

The platform uses a multi-property ready schema with the following main entities:

- **Properties**: Guest house/property information
- **Rooms**: Individual rooms
- **RoomTypes**: Room type categories
- **Amenities**: Room amenities
- **Rates**: Pricing configuration
- **RateRules**: Seasonal and dynamic pricing
- **Availability**: Room availability calendar
- **Bookings**: Guest reservations
- **Experiences**: Bookable activities
- **Transfers**: Transportation services
- **MediaAssets**: Images and media files
- **Pages**: CMS content
- **AdminUsers**: User access control
- **Settings**: System configuration

## Design System

The platform uses Tailwind CSS for styling with a custom configuration supporting:
- Mobile-first responsive design
- Dark mode support (ready for Phase 5)
- Consistent color palette
- Typography system
- Component library

## Authentication

Authentication is handled via Supabase Auth with support for:
- Email/password authentication
- Session management
- Role-based access control (Owner, Manager, Staff)
- Protected routes (admin panel)

## API & Database Access

- Database queries use Supabase client SDK
- Server-side operations use Server Components
- Client-side data fetching uses React hooks
- Real-time subscriptions ready (Phase 2+)

## Key Principles

1. **Content is Dynamic**: The platform allows owners to create and manage all content through the admin panel
2. **Mobile-First**: Design and development prioritizes mobile experience
3. **Multi-Property Ready**: Database schema supports multiple properties from day one
4. **Owner-Managed**: System designed so owners can operate independently without technical support for normal tasks
5. **SEO-Optimized**: Architecture supports strong SEO from the ground up

## Contributing

Development follows the phase-by-phase approach outlined above. Each phase should:
1. Complete all defined features
2. Pass testing requirements
3. Maintain backward compatibility
4. Update documentation

## Next Steps

Phase 2 will focus on building the admin dashboard core, starting with:
1. Admin layout and navigation
2. Rooms management interface
3. Amenities management
4. Basic rates configuration
5. Media library setup

---

**Last Updated**: 2026-09-02
**Phase**: 1 - Foundation
**Status**: Ready for Phase 2 Development
