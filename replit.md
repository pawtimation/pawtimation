# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed for dog-walking and pet care businesses. It offers a comprehensive CRM solution to streamline operations by managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a dedicated staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization, ultimately providing a powerful tool for pet care businesses.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Pawtimation employs a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
-   **Framework**: Fastify (ES modules) with schema validation.
-   **Data Storage**: PostgreSQL database with Drizzle ORM, utilizing a repository pattern for data abstraction across all entities (businesses, users, clients, dogs, services, jobs, invoices, availability, recurring jobs, analytics).
-   **Real-Time Updates**: Socket.io for immediate UI synchronization.
-   **CRM Data Model**: Supports multiple businesses with distinct entities for businesses, users (staff/admins), clients, dogs, services, jobs, invoices, availability, and recurring jobs.
-   **Address Management**: Client addresses include automatic GPS geocoding via Nominatim API.
-   **Authentication & Authorization**: JWT-based authentication with role-specific guards ensuring business isolation and preventing PII exposure. Features a staff approval workflow for bookings.
-   **Booking Workflow**: Supports dual-path booking creation: client-initiated requests requiring admin/staff approval, and admin-created bookings that can be either pending staff approval or immediately confirmed.
-   **Invoice Management**: Multi-item invoicing with professional PDF generation and branding.
-   **Financial Analytics**: Reporting system for revenue, trends, forecasts, and breakdowns.
-   **Walking Route Generation**: Geometric algorithm for circular walking routes based on client geolocation and service duration, stored in GeoJSON and exportable as GPX.
-   **Security**: Sanitized socket emissions for sensitive actions.

### Frontend Architecture
-   **Build Tool**: Vite.
-   **Styling**: Tailwind CSS with custom CSS variables.
-   **State Management**: React hooks integrated with `DataRefreshContext` for Socket.io.
-   **Routing**: React Router facilitates distinct admin, staff, and client portals with role-aware navigation.
-   **Data Visualization**: Recharts library for financial graphs.
-   **User Portals**: Dedicated interfaces for admins, staff, and clients, featuring role-specific dashboards, calendars, and settings.
-   **UI/UX Decisions**: Consistent design elements include a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, a 6-step client onboarding wizard, and mobile optimization with dynamic business branding.
-   **Technical Implementations**: Comprehensive staff scheduling with intelligent ranking, conflict detection, bulk booking tools, and a unified `DateTimePicker`.
-   **Route Display Components**: Reusable components for displaying OpenStreetMap embeds, route metrics, and navigation options.

### System Design Choices
-   **Staff Assignment Intelligence**: Ranks staff based on qualifications, availability, and conflict status.
-   **Repository Pattern**: Abstracts data operations via `repo.js`.
-   **Client Portal**: Features booking workflows, secure API endpoints, ownership validation, and notifications.
-   **Admin Workflow**: Includes admin approval for client booking requests, booking management, and invoice itemization.
-   **Admin Settings System**: Comprehensive settings for business profile, working hours, branding, finance, services, and automation.
-   **Role-Based Permissions**: Granular control enforced via middleware and frontend helpers.

## External Dependencies
-   **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
-   **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`.
-   **Third-Party Services**: Stripe (payment processing, stubbed), Nominatim API (geocoding), OpenStreetMap (map embeds).
-   **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`.

## Recent Changes (November 21, 2025)

### Complete Homepage Brand Redesign ✅ COMPLETE (Nov 21, 2025)
**Implementation**: Professional marketing homepage with correct brand color #0E9385
- **Brand Color Update**: Changed from #008080 to official brand teal #0E9385 throughout homepage
- **Hero Section Redesign**: 
  - Extra-bold headline "Effortless Dog-Walking Management — Simple. Smart. Powerful."
  - Clean UI mockup illustration showing calendar tile, staff tile, and booking list
  - Soft light grey background with brand teal accents (#0E9385)
  - Dog avatars (Hector, Luna, Milo) with service labels (30-min Walk, Group Walk, Puppy Visit)
  - Primary CTA: Brand teal button with white text
  - Secondary CTA: White button with brand teal outline and text
- **Feature Cards**: 3 cards (Smart Scheduling, Staff & Client Portals, Invoicing & Payments) with brand teal icons
- **Hector's Photo Styling**: 
  - Saturation reduced by 12% (filter: saturate(0.88))
  - White overlay at 5% opacity
  - Teal shadow (#0E9385 at 8% opacity)
  - Size reduced by 17% (from 96px to 80px)
- **"See Pawtimation in Action" Cards**: Clean illustrated mockups using only brand teal and neutrals, no navy/dark backgrounds
- **Testimonial Section**: Brand teal avatars and background
- **No Gradients or Neon Colors**: All elements use flat brand teal #0E9385 or light neutrals
- **Mobile Optimized**: Fully responsive design tested on mobile and desktop
- **Paw Logo**: 4 toe beans + rounded pad design in exact brand color #0E9385

### Professional Footer & Legal Pages ✅ COMPLETE (Nov 21, 2025)
**Implementation**: Clean, compliant footer with comprehensive legal documentation
- **Footer Design**: Three-section layout (Branding, Legal & Support, Company Details)
- **Content**: "Smart CRM for Dog Walking & Pet Care Businesses" tagline
- **Legal Compliance**: No physical address (legal for pre-registration UK business)
- **Contact**: pawtimation.uk@gmail.com for support
- **Ownership**: "Pawtimation is a product by Andrew James, Registered in the United Kingdom"
- **Legal Pages - FULLY POPULATED**: 
  - Terms of Service (`/legal/terms`) - 11 comprehensive sections covering service use, eligibility, data privacy, liability
  - Privacy Policy (`/legal/privacy`) - Full UK GDPR compliance with data collection, usage, retention policies
  - Cookie Policy (`/legal/cookies`) - Essential and analytics cookie documentation
  - Data Protection & GDPR (`/legal/data-protection`) - Data processor/controller relationship and subject rights
- **Support Pages - FULLY POPULATED**:
  - Help Centre (`/support/help`) - Complete platform guide (Getting Started, Bookings, Invoicing, Account Management)
  - Report an Issue (`/support/report`) - Bug reporting guidelines with contact details
- **Branding**: Teal paw SVG brand icon (not emoji) used consistently across all pages
- **Design**: Professional slate/teal color scheme, well-structured sections with proper headings, typography, and spacing