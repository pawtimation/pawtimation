# Pawtimation CRM

## Overview
Pawtimation is a business management CRM for dog-walking and pet care businesses. It enables businesses to manage their staff (walkers, groomers, trainers), clients (pet owners), dogs, services (30-min walks, overnight stays, grooming, etc.), and job scheduling with staff assignment. This is a B2B SaaS platform designed to help dog-walking businesses streamline their operations.

## Recent Changes (November 19, 2025)
**Weekly Grid Calendar System (Patch 12)**
- Replaced FullCalendar with custom weekly grid calendar for cleaner, integrated design
- Created CalendarWeekGrid component with time slots (6:00-20:30 in 30-min intervals)
- Built calendar utilities: getWeekDates, groupBookingsByDay, getTimeSlots, bookingOverlaps
- Updated BusinessCalendar screen with week navigation (Previous, Today, Next)
- Updated StaffCalendar screen for individual staff schedule views
- Color-coded booking statuses: Requested (amber), Scheduled/Approved (teal/emerald), Complete (blue), Declined/Cancelled (rose)
- Click any booking to open edit modal
- Displays service name, client name, and start time on each booking tile
- Week label shows date range (e.g., "17 Nov - 23 Nov 2025")

**Staff Scheduling System (Patch 11)**
- Implemented comprehensive staff scheduling with weekly availability management
- Added staff services assignment: admins can specify which services each staff member can perform
- Created repo methods: saveStaffWeeklyAvailability, getStaffWeeklyAvailability, saveStaffServices, findAvailableStaffForSlot
- Built AdminStaffAvailability screen (/admin/staff/availability) with weekly schedule editor for each day (Mon-Sun)
- Built AdminStaffServices screen (/admin/staff/services) for managing staff service permissions
- Staff data model extended: weeklyAvailability (object with day keys), services (array of serviceIds)
- Intelligent staff assignment logic: checks service qualifications, weekly availability, and booking conflicts
- Added sidebar navigation links for Staff Availability and Staff Services
- Smart availability checking uses BLOCKING_STATUSES to ignore non-blocking job states

**Bookings Management System**
- Created BookingsList screen (/admin/bookings) with table view of all jobs/bookings
- Built BookingFormModal component with comprehensive booking creation/editing:
  - Client selection with dynamic dog loading
  - Multi-dog selection (checkboxes)
  - Service selection
  - Date/time picker with auto-calculated end time
  - Status dropdown (8 states: Pending, Requested, Scheduled, Approved, Complete, Completed, Declined, Cancelled)
  - Price in £ (converted to/from pence)
  - Notes field
- Uses existing jobs infrastructure (createJob, updateJob, listJobsByBusiness)
- Added "Bookings" link to admin sidebar between Services and Calendar

**Client Onboarding Wizard (Patch 10)**
- Added 6-step client onboarding wizard at /client/onboarding capturing:
  - Step 1: Client name, email, phone
  - Step 2: Address and access instructions
  - Step 3: Emergency contact and vet details
  - Step 4: Dog information (name, breed) with repo persistence
  - Step 5: Behaviour and medical notes
  - Step 6: Review and complete
- Created ClientGuard component that blocks access to booking features until profile is complete
- Wrapped all client routes (/client/dashboard, /client/book, /client/flexi, /client/invoices) with ClientGuard
- Client records now track profileComplete flag and onboardingStep (1-999)
- Incremental save: Each step saves progress to allow users to resume later
- Demo client (demo@client.com / test123) starts with incomplete profile for testing
- Updated AdminDashboard with analytics-focused design showing business metrics:
  - Total jobs, active jobs, total clients, revenue, pending requests, unpaid invoices
  - Quick actions grid for common CRM tasks
  - Getting started guidance for new users
- Removed legacy admin panel features (masquerade, support queue, verification)

## Recent Changes (November 18, 2025)
**Sidebar Navigation Update (Patch 9)**
- Updated DashboardLayout with separate admin and staff navigation menus
- Admin menu: Dashboard, Clients, Calendar, Invoicing, Staff, Settings, Admin Panel
- Staff menu: Dashboard, Calendar, My Jobs, My Availability, Settings
- Created new staff screens: StaffDashboard, StaffJobs, StaffAvailability, StaffSettings
- Created new admin screens: AdminSettings, AdminPanel
- Added routes for all new staff screens (/staff/jobs, /staff/availability, /staff/settings)
- Case-insensitive role detection to handle ADMIN/admin properly
- Null-safe role normalization to prevent runtime errors

**Sidebar Layout (Patch 8)**
- Added DashboardLayout component with persistent left sidebar for all admin and staff screens
- Clean white sidebar with teal accent colors for active navigation
- Role-aware navigation: admin sees full menu, staff sees limited menu
- Removed Header/Footer/ChatWidget from admin and staff routes for cleaner interface
- User info and logout button in sidebar footer
- Responsive full-height layout with main content area

**Bulk Recurring Bookings (Patch 6 & 7)**
- Admin bulk recurring bookings at /admin/recurring for creating weekly patterns of SCHEDULED jobs
- Client flexi week bookings at /client/flexi for requesting multiple walks in a single week
- Both tools support selecting days of week (Mon-Sun) with visual toggles
- Admin tool: generates jobs over multiple weeks (1-52 weeks), auto-assigns to client/dog
- Client tool: requests jobs for one week at a time, creates REQUESTED status for approval
- Loading states and error handling during job creation
- Success feedback shown before navigation (client) or persistent display (admin)
- Schedule preview showing total jobs to be created
- Added "Bulk recurring bookings" to admin QuickActions
- Added "Flexi week booking" to client dashboard


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
- **Calendar System**: Custom weekly grid calendar with time-slot visualization (apps/web/src/utils/calendar.js, apps/web/src/components/calendar/)
- **Routing**: Clean React Router setup with CRM-focused routes:
  - `/` or `/admin` - Admin dashboard with stats and quick actions
  - `/admin/staff` - Manage staff members
  - `/admin/staff/availability` - Set weekly availability schedules for staff
  - `/admin/staff/services` - Assign service permissions to staff
  - `/admin/clients` - Manage clients
  - `/admin/dogs` - Manage dogs
  - `/admin/services` - Manage services (walks, stays, grooming, etc.)
  - `/admin/bookings` - View and manage all bookings with create/edit modal
  - `/admin/jobs` - List all jobs
  - `/admin/jobs/new` - Create new job
  - `/admin/requests` - View and approve/decline booking requests from clients
  - `/admin/invoices` - View all invoices with WhatsApp sharing
  - `/admin/calendar` - Business-wide team calendar with filters
  - `/admin/recurring` - Bulk recurring bookings tool for weekly patterns
  - `/staff` - Staff schedule view (basic)
  - `/staff/calendar` - Staff-specific calendar view
  - `/client/login` - Client login portal (demo: demo@client.com / test123)
  - `/client/register` - Client registration
  - `/client/dashboard` - Client view of bookings and dogs
  - `/client/book` - Client booking request form
  - `/client/flexi` - Flexi week booking tool for quick weekly requests
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
