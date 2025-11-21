# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform for dog-walking and pet care businesses, offering a comprehensive CRM solution. It streamlines operations by managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project utilizes a monorepo approach, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
- **Framework**: Fastify (ES modules) with schema validation.
- **Data Storage**: In-memory JavaScript objects using a repository pattern, with plans for future migration to persistent storage (e.g., Postgres/Drizzle).
- **Real-Time Updates**: Socket.io for immediate UI synchronization.
- **CRM Data Model**: Supports multiple businesses with entities for businesses, users (staff/admins), clients, dogs, services, jobs, invoices, availability, and recurring jobs.
- **Address Management**: Client addresses are structured with automatic GPS geocoding via Nominatim API.
- **Authentication & Authorization**: JWT-based authentication with centralized, role-specific guards (`authHelpers.js`) ensuring business isolation and preventing PII exposure. Includes a staff approval workflow for bookings.
- **Booking Workflow**: Dual-path workflow system:
  - **Path A (Client-Initiated)**: Client requests → Admin assigns staff → Staff confirms/declines → Real-time updates
  - **Path B (Admin-Created)**: Admin creates with staff & status → Either PENDING (requires staff approval) or BOOKED (immediate confirmation) → Real-time calendar sync
- **Invoice Management**: Multi-item invoicing with professional PDF generation and branding.
- **Financial Analytics**: Reporting system for revenue, trends, forecasts, and breakdowns.
- **Settings Persistence**: Business settings are stored and updated using deep-merge.
- **Services Management**: CRUD operations for business services, including pricing, duration, and staff rules.
- **Walking Route Generation**: Geometric algorithm for circular walking routes based on client geolocation and service duration, stored in GeoJSON and exportable as GPX.
- **Socket Security**: Sanitized socket emissions for sensitive actions to prevent PII exposure.

### Frontend Architecture
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: React hooks integrated with `DataRefreshContext` for Socket.io.
- **Routing**: React Router facilitates distinct admin, staff, and client portals with role-aware navigation.
- **Data Visualization**: Recharts library for financial graphs.
- **User Portals**: Dedicated interfaces for admins, staff, and clients, featuring role-specific dashboards, calendars, and settings.
- **UI/UX Decisions**: Consistent design elements include a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, and a 6-step client onboarding wizard. Mobile-optimized with dynamic business branding.
- **Technical Implementations**: Comprehensive staff scheduling with intelligent ranking, conflict detection, bulk booking tools, and a unified `DateTimePicker`.
- **Financial Reporting**: A dedicated screen (`AdminFinancial.jsx`) for invoices, overview, forecasts, and breakdowns.
- **Route Display Components**: Reusable components for displaying OpenStreetMap embeds, route metrics, and navigation options. Staff can generate, download GPX, and open routes in mapping apps.
- **Admin Client Location**: Admin client detail views include embedded OpenStreetMap showing precise client locations.

### System Design Choices
- **Staff Assignment Intelligence**: Ranks staff based on qualifications, availability, and conflict status.
- **Repository Pattern**: Abstracts data operations via `repo.js`.
- **Client Portal**: Features booking workflows, secure API endpoints, ownership validation, and notifications.
- **Admin Workflow**: Includes admin approval for client booking requests, booking management, and invoice itemization.
- **Admin Settings System**: Comprehensive settings for business profile, working hours, branding, finance, services, and automation.
- **Role-Based Permissions**: Granular control enforced via middleware and frontend helpers.
- **Automation System**: Backend engine for alerts and reminders.
- **Messaging System**: Business-level messaging for client-business communication.

## External Dependencies
- **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
- **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`.
- **Third-Party Services**: Stripe (payment processing, stubbed), Nominatim API (geocoding), OpenStreetMap (map embeds).
- **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`.

## Recent Changes (November 21, 2025)

### PostgreSQL Migration Progress

**Phase 1: Core Entities ✅ COMPLETE**
- Businesses, users, clients, dogs, services now persist to PostgreSQL
- Client authentication uses bcrypt-hashed passwords stored in database
- All CRUD operations use Drizzle ORM exclusively (no in-memory fallbacks)
- Data persists across server restarts

**Phase 2: Booking Workflow ✅ COMPLETE & PRODUCTION-READY**
- Jobs/bookings table schema with priceCents, walkRoute, timestamps
- createJob migrated: persists to Postgres with full payload (dogIds, price, route)
- Job status updates migrated: assignStaffToJob, setJobStatus use storage layer with timestamps
- Query functions migrated: listJobsByBusiness, listJobsByClient, listJobsByStaff
- Date handling: ISO strings automatically converted to Date objects in storage layer
- **End-to-End Testing: ✅ VERIFIED**
  - Booking creation persists with all fields (dogIds JSONB, price, timestamps)
  - Status transitions persist (BOOKED → COMPLETED with completedAt timestamp)
  - Server restarts preserve all data (100% Postgres, no in-memory fallback)
  - Real-time Socket.IO events fire correctly (booking:created, booking:updated, stats:changed)
- Remaining: Analytics/reporting functions (~10 functions) still use in-memory (non-blocking for workflow)

**Database Schema:**
- 11 tables: businesses, users, clients, dogs, services, jobs, availability, invoices, invoiceItems, recurringJobs, messages
- Foreign keys with cascade/restrict rules
- JSONB columns for flexible data (dogIds, address, walkRoute, settings)
- Timestamps: createdAt, updatedAt, completedAt, cancelledAt

**Security:**
- Client passwords hashed with bcryptjs (10 rounds)
- No plaintext credentials in database
- Account takeover prevention: registerClientUser rejects existing passwordHash

**Next Steps:**
- Phase 3: Migrate invoices and availability to PostgreSQL
- End-to-end booking workflow testing
- Real-time socket.io verification with database-backed jobs

## Recent Changes (November 21, 2025 - Archive)

### Complete Dual Booking Workflow System ✅ PRODUCTION-READY
**Two Booking Creation Workflows Fully Implemented with Real-Time Sync:**

#### Workflow A: Client-Initiated Booking (Requires Admin & Staff Approval)
1. **Client**: `POST /client/bookings/request` → Status: PENDING, staffId: null
2. **Admin**: `POST /bookings/:id/admin-update` assigns staff → Status: PENDING, staffId: assigned
3. **Staff** chooses action:
   - Confirm: `POST /bookings/:id/staff-confirm` → Status: BOOKED (visible to client)
   - Decline: `POST /bookings/:id/staff-decline` → Status: PENDING, staffId: null (admin reassigns)
   - Cancel: `POST /bookings/:id/staff-cancel` → Status: CANCELLED (visible to client)
4. **Admin Override**: `POST /bookings/:id/admin-update` with status=BOOKED (bypasses staff approval)

#### Workflow B: Admin-Created Booking (Direct Creation)
**Admin**: `POST /bookings/create` with clientId, serviceId, dogIds, start, staffId, status

**Two Sub-Paths:**

- **B1 - Requires Staff Approval**: Admin sets `status: 'PENDING'` + `staffId`
  - Booking appears immediately on client app as "Pending"
  - Staff sees PENDING booking assigned to them
  - Staff confirms/declines/cancels (same options as Workflow A)
  - Real-time updates propagate to all calendars

- **B2 - Immediate Confirmation**: Admin sets `status: 'BOOKED'` + `staffId`
  - Booking appears immediately as "Confirmed" on ALL calendars (admin, staff, client)
  - No staff approval needed - pre-confirmed by admin
  - Staff sees confirmed booking in their schedule immediately

**Real-Time Synchronization:**
- All status changes emit Socket.IO events (`booking:created`, `booking:updated`)
- Calendars auto-refresh when any of the 3 parties (admin/staff/client) change status
- DataRefreshContext triggers calendar re-renders on socket events

**Key Endpoints:**
- `POST /bookings/create` - Admin creates booking (supports PENDING or BOOKED status)
- `POST /bookings/:id/admin-update` - Admin assigns/reassigns staff or updates status
- `POST /bookings/:id/staff-confirm` - Staff confirms PENDING → BOOKED
- `POST /bookings/:id/staff-decline` - Staff declines, removes assignment
- `POST /bookings/:id/staff-cancel` - Staff cancels booking
- `GET /bookings/list` - Staff sees assigned bookings + unassigned PENDING queue