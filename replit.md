# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed for dog-walking and pet care businesses. It provides a comprehensive CRM solution for managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform's core purpose is to streamline operations, enhance efficiency for pet care service providers, and support business growth through robust management tools. It features a complete staff UI system, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project uses a monorepo, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
- **Framework**: Fastify (ES modules) with schema validation.
- **Data Storage**: In-memory JavaScript objects with a repository pattern, designed for future migration to persistent storage (e.g., Postgres/Drizzle).
- **Real-Time Updates**: Socket.io for instant UI updates.
- **CRM Data Model**: Multi-business CRM with entities for `businesses`, `users` (staff/admins), `clients` (with lat/lng and structured address fields), `dogs`, `services`, `jobs` (with route data), `invoices`, `availability`, and `recurringJobs`.
- **Address Management**: Client addresses stored in structured fields (`addressLine1`, `city`, `postcode`) with automatic GPS geocoding via Nominatim API. Combined address string generated for display in lists.
- **Authentication & Authorization**: JWT-based authentication with centralized authentication helpers (`authHelpers.js`) providing role-specific guards (`requireAdminUser`, `requireStaffUser`, `requireClientUser`, `requireBusinessUser`, `requireStaffUserWithAssignment`, `requireStaffJobOwnership`). All role checks are case-insensitive and enforce business isolation. Staff members have restricted access to only their assigned bookings to protect client PII.
- **Staff Approval Workflow**: Complete implementation for staff to confirm, decline, or cancel PENDING bookings assigned to them with real-time notifications.
- **Booking Workflow**: Supports client-requested and admin-approved bookings, comprehensive staff assignment, and recurring booking generation.
- **Invoice Management**: Multi-item invoicing, including professional PDF invoice generation with branding.
- **Financial Analytics**: Complete reporting system for revenue, trends, forecasts, and breakdowns.
- **Settings Persistence**: Business settings stored in `businesses[id].settings` with deep-merge for updates.
- **Services Management**: CRUD for business services with pricing, duration, and staff assignment rules.
- **Walking Route Generation**: Geometric algorithm for circular walking routes based on client geolocation and service duration, stored in GeoJSON format. GPX export functionality for staff navigation apps.
- **Socket Security**: Sanitized socket emissions for staff decline/cancel actions emit only minimal data (id, status, staffId, businessId) to prevent PII exposure to unassigned staff.

### Frontend Architecture
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: React hooks with `DataRefreshContext` for Socket.io integration.
- **Routing**: React Router for distinct admin, staff, and client portals with role-aware navigation.
- **Data Visualization**: Recharts library for financial charts.
- **User Portals**: Dedicated admin, staff, and client interfaces with role-specific dashboards, calendars, job management, and settings.
- **UI/UX Decisions**: Persistent left sidebar, modern card grid dashboards, standardized color-coded booking statuses (PENDING=grey, BOOKED=green, STARTED=amber, COMPLETED=teal, CANCELLED=rose), and a 6-step client onboarding wizard.
- **Technical Implementations**: Comprehensive staff scheduling with availability, intelligent ranking, conflict detection, and bulk booking tools. Unified `DateTimePicker` with 15-minute intervals. Mobile-optimized admin interface.
- **Financial Reporting**: 4-tab Financial Reports screen (`AdminFinancial.jsx`) for Invoices, Overview, Forecasts, and Breakdowns.
- **Route Display Components**: Reusable components for displaying walking route maps (OpenStreetMap embed), metrics, and navigation buttons.
- **Staff Route Management**: Staff can generate routes, download GPX files, and open routes in Apple Maps or Google Maps.
- **Admin Client Location**: Admin client detail view includes embedded OpenStreetMap showing client's precise location with GPS coordinates.

### System Design Choices
- **Staff Assignment Intelligence**: Ranks staff based on qualifications, availability, and conflict status.
- **Repository Pattern**: Abstraction of data operations via `repo.js`.
- **Client Portal**: Features booking workflows, secure API endpoints, ownership validation, and notifications.
- **Admin Workflow**: Includes admin approval for client booking requests, booking management, and invoice itemization.
- **Admin Settings System**: Comprehensive settings for business profile, working hours, policies, branding, finance, service pricing, staff permissions, and automation rules.
- **Role-Based Permissions**: Granular permission control using middleware and frontend helpers.
- **Automation System**: Backend engine for various alerts and reminders (e.g., booking, invoice, daily summaries).
- **Messaging System**: Business-level messaging for client-business communication.

## Recent Changes (November 21, 2025)
### Mobile UI Visual Enhancement (In Progress)
- **Foundation Components Created**: Built reusable mobile UI component library:
  - `MobilePageHeader` - Standardized page header with title, subtitle, and optional accent border
  - `MobileEmptyState` - Consistent empty state component with icon, title, and message
  - `MobileCard` - Reusable card component with rounded-xl borders and consistent shadow
  - `MobileStatCard` - Dashboard stat display card with icon support
- **Navigation Bar Modernization**: Enhanced both Client and Staff mobile layouts:
  - Increased navigation bar height from 64px to 80px for better touch targets
  - Larger icons (28px instead of 24px) for improved visibility
  - Improved screen padding (24px) and spacing (16px between elements)
  - Added shadow-lg to navigation bar for visual depth
  - Better transitions and hover states for interactive elements
  - Consistent background colors (gray-50) across both portals
- **Typography & Spacing System**: Implemented consistent design tokens:
  - Page titles: 24px font size
  - Section headings: 16-18px
  - Body text: 14-16px
  - Screen padding: 24px
  - Element spacing: 16px between major sections, 12px inside cards
- **Status**: Foundation complete, individual screen refactoring recommended as next step to fully realize the modernized mobile UI across all client and staff screens


### Authorization System Refactoring (Complete)
- **Centralized Authentication Helpers**: Created `authHelpers.js` module with 6 role-specific guards eliminating ~76 lines of duplicate code:
  - `requireAdminUser` - Admin-only operations (create, update, approve bookings)
  - `requireStaffUser` - Staff-only operations (rarely used)
  - `requireClientUser` - Client portal operations
  - `requireBusinessUser` - Operations accessible to both admin and staff (with role flags)
  - `requireStaffUserWithAssignment` - Admin OR assigned staff (helper returns validated job)
  - `requireStaffJobOwnership` - Assigned staff only, admins blocked (for staff approval actions)
- **Endpoint Refactoring**: Systematically refactored 18+ booking endpoints to use centralized helpers:
  - Removed legacy inline role checks from all endpoints
  - All helpers enforce case-insensitive role comparison via `normalizeRole()`
  - Business isolation verified in all authorization paths
  - Admin endpoints properly block staff access
  - Staff endpoints properly filter by assignment
- **Authorization Matrix**: Created comprehensive documentation (`apps/api/docs/AUTHORIZATION_MATRIX.md`) listing all endpoints, role requirements, security principles, and testing guidelines
- **Staff Approval Workflow**: Complete implementation for staff to confirm, decline, or cancel PENDING bookings:
  - `POST /bookings/:id/staff-confirm` - Staff confirms PENDING → BOOKED
  - `POST /bookings/:id/staff-decline` - Staff declines, removes staffId (admin can reassign)
  - `POST /bookings/:id/staff-cancel` - Staff cancels PENDING → CANCELLED
  - All endpoints use `requireStaffJobOwnership` to ensure only assigned staff can act
  - UI integration in `StaffToday.jsx` and `StaffMobileJobDetail.jsx`
- **Security Hardening**: Fixed authorization regressions ensuring admins can access unassigned bookings while staff remain restricted to assigned jobs
- **Socket PII Protection**: `emitBookingStatusChanged()` function emits only minimal data ({id, status, staffId, businessId}) for decline/cancel actions to prevent exposing client PII to unassigned staff
- **Demo Data**: Added phone number (07123456789) to Sarah Walker (walker1@demo.com) demo staff account for testing

## External Dependencies
- **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
- **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`.
- **Third-Party Services**: Stripe (payment processing, stubbed), Nominatim API (geocoding), OpenStreetMap (map embeds, no API key required).
- **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`.