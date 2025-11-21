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
- **Authentication & Authorization**: JWT-based authentication with role-based access control and business isolation. Staff members have restricted access to only their assigned bookings to protect client PII.
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
### Staff Approval Workflow Implementation
- **Demo Data**: Added phone number (07123456789) to Sarah Walker (walker1@demo.com) demo staff account
- **Field Compatibility**: Fixed field name mismatch by adding `dateTime` alias in `enrichJob()` function (backend used `start`, frontend expected `dateTime`)
- **API Endpoints**: Created three staff approval endpoints with full JWT authentication and authorization:
  - `POST /bookings/:id/staff-confirm` - Staff confirms PENDING → BOOKED
  - `POST /bookings/:id/staff-decline` - Staff declines, removes staffId (admin can reassign)
  - `POST /bookings/:id/staff-cancel` - Staff cancels PENDING → CANCELLED
- **UI Implementation**: Added staff approval buttons to `StaffToday.jsx` and `StaffMobileJobDetail.jsx` with proper error handling
- **Security Hardening**: Applied role-based authorization checks to 13+ booking endpoints:
  - GET/POST endpoints now verify staff can only access assigned bookings
  - Admin-only operations (create, update, approve, decline) block staff entirely
  - All role checks use case-insensitive comparison (`auth.user.role?.toUpperCase() === 'STAFF'`)
- **Socket PII Protection**: Created `emitBookingStatusChanged()` function that emits only minimal data ({id, status, staffId, businessId}) for decline/cancel actions to prevent exposing client PII to unassigned staff

### Known Architectural Limitation
The current authorization model uses inline role checks duplicated across many endpoints. **Future Enhancement Recommended**: Refactor to role-specific authentication helpers (`requireAdminUser`, `requireStaffUserWithAssignment`) and implement automated API tests to prevent authorization regressions. See architect recommendations for comprehensive authorization matrix and policy-based middleware implementation.

## External Dependencies
- **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
- **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`.
- **Third-Party Services**: Stripe (payment processing, stubbed), Nominatim API (geocoding), OpenStreetMap (map embeds, no API key required).
- **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`.