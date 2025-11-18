# Pawtimation CRM

## Overview
Pawtimation is a business management CRM for dog-walking and pet care businesses. It enables businesses to manage their staff (walkers, groomers, trainers), clients (pet owners), dogs, services (30-min walks, overnight stays, grooming, etc.), and job scheduling with staff assignment. This is a B2B SaaS platform designed to help dog-walking businesses streamline their operations.

## Recent Changes (November 18, 2025)
**Complete CRM Transformation**
- Pivoted from B2C pet-sitting marketplace to B2B business management CRM
- Implemented clean CRM data model with no legacy marketplace code
- Removed all marketplace features: owner/companion dashboards, community hub, rewards, admin masquerade, public profiles, booking flow
- New UI focused on business management: staff, clients, dogs, services, jobs
- Simplified routing with clean CRM screens

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
  - `/staff` - Staff schedule view (basic)

### Agent System
- **Background Jobs**: Timer-based agents for automated tasks like daily digests
- **Reward Notifier**: Disabled (no-op) - not used in CRM model

### Repository Pattern
All data access goes through `repo.js` which provides clean async methods:
- Business: create, get, update, list
- Users/Staff: create, get, list by business, list staff by business
- Clients: create, get, list by business
- Dogs: create, get, list by client, list by business
- Services: create, get, list by business
- Availability: set/get staff availability
- Jobs: create, get, update, list, assign staff, set status, find available staff
- Invoices: create, get, mark paid, list by business
- Job Updates: record cancellations, add job updates, get job feed

## External Dependencies
### Core Dependencies
- **Backend**: `fastify`, `@fastify/cors`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`
- **Frontend**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`

### Third-Party Services
- **Stripe**: Payment processing (configured but using stub mode)

### Environment Configuration
- `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY` (optional)
