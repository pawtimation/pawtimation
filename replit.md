# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform for dog-walking and pet care businesses. It offers a comprehensive CRM to manage staff, clients, dogs, services, and job scheduling with intelligent staff assignment. The platform aims to streamline operations and enhance efficiency for pet care service providers.

## Recent Updates (November 21, 2025)
- **Reliable Seeded Admin**: Created production-ready seeded admin account (demo-admin@pawtimation.com / demo123) with fixed ID `u_pawtimation_admin` tied to demo business. Automatically seeded on server startup for reliable access.
- **Codebase Cleanup**: Removed 52 unused screen files that were not referenced anywhere in the app, significantly reducing bundle size and improving developer clarity. Recreated AdminStaffAvailability.jsx and AdminStaffServices.jsx as simple navigation screens for staff management tabs.
- **Business Name Update Fix**: Implemented event-based refresh pattern so sidebar updates immediately when business name is saved in settings (web or mobile). After saving business profile, app calls `/api/business/me` to refresh user data, updates localStorage, and dispatches 'businessNameUpdated' custom event. App.jsx listens for this event and triggers React re-render using state management with `syncBusinessName()` helper and `useMemo` for derived user objects. No more full page reloads when updating business name.
- **Real-Time Dashboard Stats**: Replaced placeholder numbers in AdminDashboard and AdminMobileDashboard with real API data. All stats now pull from live backend endpoints: `/stats/bookings/upcoming-count` (BOOKED jobs), `/stats/bookings/pending-count` (PENDING requests), `/stats/clients/count` (active clients), `/stats/invoices/revenue-week` (weekly revenue), and `/stats/bookings/upcoming?limit=5` (upcoming jobs preview). Stats update in real-time via socket.io events when bookings, invoices, or stats change. Pending approvals show in red when count > 0. Desktop and mobile dashboards now display accurate, live business metrics.
- **15-Minute Time Increments**: All time pickers throughout the app now use 15-minute increments instead of minute-by-minute scrolling. DateTimePicker component uses custom dropdown with `generateTimeSlots(0, 24, 15)`. Working hours section uses identical pattern with select dropdowns for consistent 15-minute intervals across all browsers. All time/clock functions use the same unified pattern.
- **Map Integration**: Added interactive Google Maps display for service locations. Created reusable AddressMap component using Google Maps iframe embed (no API key required) with z=15 zoom level. Maps show in client detail profile tab and booking forms when client with address is selected. Component includes "Open in Google Maps" link for navigation and displays address below map. Properly handles null/empty addresses and normalizes input with trim().
- **B2B CRM Branding Update**: Updated all page metadata in index.html from "Trusted Pet Care for UK Families" to "Dog Walking & Pet Care CRM" to accurately reflect the B2B business management platform positioning. Updated meta descriptions across OG and Twitter cards. Test client address updated to UK format (Old Trafford, Manchester M16 0RA).
- **Staff Management Architecture Fix**: Fixed critical architectural violation in Staff.jsx where it was importing backend repo directly. Migrated to use business-scoped API calls (`/users/by-business/:id`) matching the pattern used in AdminStaffAvailability and AdminStaffServices. All three staff tabs now properly enforce business isolation and display consistent data.
- **Logo Upload & Display**: Added business logo upload functionality in branding settings with file validation (JPG, PNG, WebP, max 2MB). Logo displays in sidebar at bottom above user profile. Converts uploaded images to base64 data URLs and saves to `business.settings.branding.logoUrl`. Includes upload, change, and remove buttons with live preview. Logo updates immediately in sidebar after save for own business. Initial implementation uses base64 storage (suitable for logos under 2MB).
- **Full Colour Palette Editor**: Added comprehensive colour customization in branding settings with 5 colour controls (Primary, Secondary, Accent, Background, Text). Each colour includes visual colour picker (HTML5 input type="color") paired with hex text input for precise control. Defaults: primary #00a58a, secondary #0f172a, accent #f59e0b, background #ffffff, text #1e293b. Pattern validation ensures valid hex codes. Form state syncs via useEffect when switching businesses to prevent stale values. All colour data saved to `business.settings.branding.*Color` fields.
- **Business Profile Layout Redesign**: Redesigned business profile section to remove cramped grid-heavy "boxy" layout. Changed to cleaner vertical spacing (space-y-6) with strategic use of grids only for logical field groupings. Full-width fields for business name, service area, and address line 1. Side-by-side grids only for email/phone and city/postcode pairs. Improved visual hierarchy and breathing room throughout settings forms.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project uses a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
- **Framework**: Fastify (ES modules) with schema validation and modular routes.
- **Data Storage**: In-memory JavaScript objects with a repository pattern, designed for future migration to persistent storage (e.g., Postgres/Drizzle).
- **Real-Time Updates**: Socket.io for instant UI updates across clients on CRD operations for bookings, invoices, and stats.
- **CRM Data Model**: Multi-business CRM with core entities: `businesses`, `users` (staff/admins), `clients`, `dogs`, `services`, `jobs`, `invoices`, `availability`, and `recurringJobs`.
- **Authentication & Authorization**: JWT-based authentication for client and business/admin users, enforcing role-based access control and business isolation.
- **Booking Endpoints**: Separate endpoints for client-requested bookings (`/jobs/create`) and admin-approved bookings (`/bookings/create`).
- **Staff Assignment Workflow**: Comprehensive system for staff selection, auto-assignment using `listAvailableStaffForSlot`, and manual override. All bookings require a `staffId`.
- **Invoice Itemization System**: Multi-item invoicing workflow where completed jobs create pending invoice items grouped by client, allowing manual invoice generation with multiple line items.
- **Recurring Bookings**: Full system for daily/weekly/fortnightly/custom interval recurring bookings, generating multiple jobs based on recurrence patterns, with staff availability checks and auto-assignment.
- **PDF Invoice Generation**: Professional branded PDF invoices using pdfkit with dynamic business branding colors, itemized service breakdown, and client details, downloadable via an authenticated endpoint.
- **Demo Seeding**: Automatic creation of demo business, multiple admin accounts (including reliable `demo-admin@pawtimation.com`), staff, client, dog, and services on server startup for testing.
- **Financial Analytics Engine**: Complete financial reporting system with aggregation helpers for total revenue, monthly trends, revenue forecasts, and breakdowns by service, staff, and client, using only paid invoices and calculating in cents.
- **Settings Persistence**: Business settings stored in `businesses[id].settings` with deep-merge logic for partial updates.
- **Services Management**: CRUD operations for business services including name, price, duration, fees, visibility, and staff assignment rules.

### Frontend Architecture
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: React hooks with `DataRefreshContext` for real-time updates via Socket.io.
- **Calendar System**: Custom weekly grid calendar component.
- **Routing**: React Router for distinct admin, staff, and client portals with role-aware navigation.
- **Data Visualization**: Recharts library for financial charts and revenue analytics.
- **Authentication Routes**: Dedicated login routes for business/admin, staff, and client users with role-based redirects.
- **Staff Detail Page**: Comprehensive staff detail screen with tabs for overview, jobs, calendar, and availability.
- **UI/UX Decisions**: Persistent left sidebar with role-aware navigation, distinct admin/staff menus, color-coded booking statuses, modern card grid dashboard, and a 6-step client onboarding wizard.
- **Technical Implementations**: Comprehensive staff scheduling with weekly availability, intelligent staff ranking, real-time conflict detection, and booking forms. Includes bulk recurring and flexi-week booking tools.
- **Unified DateTimePicker**: Reusable component (`DateTimePicker.jsx`) with 15-minute time interval normalization, business hours constraints, and calendar-based date selection.
- **Mobile Admin Interface**: Mobile-optimized admin interface with viewport-based auto-redirect and fixed bottom navigation. Includes mobile dashboard, daily job view calendar, job detail screen with inline editing, client list/detail screens, invoice list/detail screens, and settings interface.
- **Financial Reporting Interface**: Comprehensive 4-tab Financial Reports screen (`AdminFinancial.jsx`) with Invoices, Overview (KPIs, monthly trends), Forecasts (projections), and Breakdowns (by service, staff, client) using Recharts.

### System Design Choices
- **Staff Assignment Intelligence**: Logic to rank staff based on qualifications, availability, and conflict status.
- **Repository Pattern**: Abstraction of all data operations via `repo.js`.
- **Client Portal**: Features booking workflows (create, edit, repeat, display), secure API endpoints, ownership validation, onboarding wizard, and notifications.
- **Admin Workflow**: Includes admin approval for client booking requests with auto-staff assignment, booking management, invoice itemization, and PDF invoice download.
- **Admin Settings System**: Comprehensive 8-section settings page for business profile, working hours, policies, branding, finance, service pricing, staff permissions, and automation rules.
- **Role-Based Permissions System**: Granular permission control with role definitions stored in business settings, using middleware and frontend helpers.
- **Automation System**: Backend engine with 6 types: booking reminders, invoice overdue reminders, daily summaries, auto-mark jobs completed, staff conflict alerts, and weekly revenue snapshots.
- **Messaging System**: Business-level messaging for client-business communication, supporting booking-specific and general inbox messages.
- **Demo Client Seeder**: Automatically creates a demo client account on startup.

## External Dependencies
- **Backend Libraries**: `fastify`, `@fastify/cors`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`.
- **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`.
- **Third-Party Services**: Stripe (payment processing, stubbed).
- **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`.