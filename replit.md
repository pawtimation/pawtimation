# Pawtimation CRM

## Overview
Pawtimation is a business management CRM for dog-walking and pet care businesses. It enables businesses to manage their staff (walkers, groomers, trainers), clients (pet owners), dogs, services (30-min walks, overnight stays, grooming, etc.), and job scheduling with staff assignment. This is a B2B SaaS platform designed to help dog-walking businesses streamline their operations.

## Recent Changes (November 18, 2025)
**FullCalendar Integration (Patch 5)**
- Business-wide team calendar at /admin/calendar with staff and service filters
- Staff-specific calendar at /staff/calendar showing individual schedules
- Visual calendar with time slots, color-coded job statuses, and event details
- Filter by staff member or service type on admin calendar
- Events display service name, client name, and status (Requested, Confirmed, Completed, etc.)
- Status-based color coding: amber for requested, emerald for confirmed, slate for completed, rose for declined/cancelled
- Added "Open team calendar" as primary action on admin dashboard

**Invoicing + Payments + WhatsApp Integration (Patch 4)**
- Auto-generate invoices when jobs are marked COMPLETE or COMPLETED
- Admin invoice screen at /admin/invoices with payment links and WhatsApp sharing
- Client invoice screen at /client/invoices showing payment status
- Payment URLs generated for each invoice (Stripe stubbed for demo)
- WhatsApp integration: admins can send invoice links directly via WhatsApp
- Demo client seeder: Creates demo@client.com / test123 for instant testing
- Added "View invoices" links to both admin and client dashboards

**Client Portal with Booking Request System (Patch 3)**
- Added client-facing booking request feature: clients can request new bookings with status REQUESTED
- Created admin approval workflow at /admin/requests for reviewing pending booking requests
- Implemented smart availability logic: only SCHEDULED/APPROVED/COMPLETE/COMPLETED jobs block staff availability
- REQUESTED, PENDING, DECLINED, CANCELLED jobs do NOT block availability for accurate auto-assignment
- Admin can approve requests with automatic or manual staff assignment
- ClientDashboard shows booking status with clear labels (Requested, Confirmed, Declined, etc.)
- Added "Request booking" button to client portal and "View booking requests" to admin quick actions

**Complete CRM Transformation**
- Pivoted from B2C pet-sitting marketplace to B2B business management CRM
- Implemented clean CRM data model with no legacy marketplace code
- Removed all marketplace features: owner/companion dashboards, community hub, rewards, admin masquerade, public profiles, booking flow
- New UI focused on business management: staff, clients, dogs, services, jobs
- Simplified routing with clean CRM screens
- Added client portal with QR code onboarding (Patch 1)
- Added client authentication with plain-text passwords (demo-only, NOT for production)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project utilizes a monorepo containing `apps/api` for the backend and `apps/web` for the frontend.

### Backend Architecture
- **Framework**: Fastify (ES modules) for high performance and schema validation.
- **Data Storage**: In-memory JavaScript objects (MVP) with a repository pattern, designed for future migration to persistent storage (e.g., Postgres/Drizzle).
- **Modularity**: Modular route files.

### CRM Data Model
The platform uses a clean multi-business CRM model for professional pet care businesses.

**Core CRM Entities:**
- `businesses` - Multi-tenant support for pet care businesses with configurable settings
- `users` - Staff members and administrators with role-based access (ADMIN | STAFF)
- `clients` - Pet owners who book services from businesses
- `dogs` - Pets associated with clients
- `services` - Bookable services offered by businesses (walks, sits, grooming, etc.)
- `jobs` - Scheduled appointments/bookings with staff assignments
- `invoices` - Financial records linked to jobs for billing and payment tracking
- `availability` - Staff availability schedules for intelligent job assignment
- `recurringJobs` - Repeating appointment templates for regular clients

**Legacy Buckets (Retained for Compatibility):**
- `bookings` - Mirrored to `jobs` for digest/cancellation utilities
- `updates` - Job notes and walk reports
- `cancellations` - Cancellation records
- Empty legacy buckets: `usersLegacy`, `pets`, `sitters`, `invites`, `agreements`

### Frontend Architecture
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with teal/emerald/cyan color palette and custom CSS variables
- **State Management**: React hooks
- **Component Structure**: Reuses existing Header, Footer, ChatWidget components
- **Routing**: Clean React Router setup with CRM-focused routes:
  - `/` or `/admin` - Admin dashboard with stats and quick actions
  - `/admin/staff` - Manage staff members
  - `/admin/clients` - Manage clients
  - `/admin/dogs` - Manage dogs
  - `/admin/services` - Manage services (walks, stays, grooming, etc.)
  - `/admin/jobs` - List all jobs
  - `/admin/jobs/new` - Create new job
  - `/admin/requests` - View and approve/decline booking requests from clients
  - `/admin/invoices` - View all invoices with WhatsApp sharing
  - `/admin/calendar` - Business-wide team calendar with filters
  - `/staff` - Staff schedule view (basic)
  - `/staff/calendar` - Staff-specific calendar view
  - `/client/login` - Client login portal (demo: demo@client.com / test123)
  - `/client/register` - Client registration
  - `/client/dashboard` - Client view of bookings and dogs
  - `/client/book` - Client booking request form
  - `/client/invoices` - Client view of invoices with payment links
  - `/qr/:businessId` - QR code onboarding entry point

### Agent System
- **Background Jobs**: Timer-based agents for automated tasks like daily digests
- **Reward Notifier**: Disabled (no-op) - not used in CRM model

### Repository Pattern
All data access goes through `repo.js` which provides clean async methods:
- Business: create, get, update, list
- Users/Staff: create, get, list by business, list staff by business
- Clients: create, get, list by business, authenticate (demo plain-text passwords)
- Dogs: create, get, list by client, list by business
- Services: create, get, list by business
- Availability: set/get staff availability
- Jobs: create, get, update, list, assign staff, set status, find available staff
  - Availability blocking: only SCHEDULED/APPROVED/COMPLETE/COMPLETED jobs block staff availability
  - Non-blocking statuses: REQUESTED, PENDING, DECLINED, CANCELLED
  - Auto-invoicing: When job status changes to COMPLETE or COMPLETED, invoice is auto-generated
- Invoices: create, get, mark paid, list by business, list by client
  - Includes payment URLs (Stripe stubbed for demo)
  - Tracks PAID/UNPAID status
- Job Updates: record cancellations, add job updates, get job feed

### Demo Client Seeder
On startup, the system creates a demo client account if none exists:
- Email: demo@client.com
- Password: test123
- Linked to the first business in the system
- Allows instant testing of the client portal without manual registration

## External Dependencies
### Core Dependencies
- **Backend**: `fastify`, `@fastify/cors`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`
- **Frontend**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`
- **Calendar**: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`

### Third-Party Services
- **Stripe**: Payment processing (configured but using stub mode)

### Environment Configuration
- `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY` (optional)
