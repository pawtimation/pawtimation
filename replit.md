# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed for dog-walking and pet care businesses. Its primary purpose is to streamline operations by providing a comprehensive CRM for managing staff, clients, dogs, services, and job scheduling with intelligent staff assignment. The platform aims to enhance efficiency and organization for pet care service providers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project is structured as a monorepo, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
- **Framework**: Fastify (ES modules) for high performance, featuring schema validation and modular route files.
- **Data Storage**: Currently uses in-memory JavaScript objects with a repository pattern, designed for future migration to persistent storage like Postgres/Drizzle.
- **CRM Data Model**: A clean, multi-business CRM model is implemented with core entities including `businesses`, `users` (staff/admins), `clients`, `dogs`, `services`, `jobs`, `invoices`, `availability`, and `recurringJobs`. Legacy buckets are retained for compatibility but are largely unused in the current CRM model.
- **Settings Persistence**: Business settings are stored in `businesses[id].settings` with comprehensive structure including profile (name, contact, address), working hours (per-day open/close times), policies (cancellation windows, payment terms), branding (color scheme, powered-by toggle), finance (auto-invoicing rules, bank details), and services (pricing, duration, visibility, staff assignment rules). Deep-merge logic (`mergeBusinessSettings`) ensures partial updates never lose existing data. Settings API routes include GET/PUT `/business/:id/settings` with authorization middleware ensuring only business owners, members, or admins can access settings.
- **Services Management**: Complete CRUD operations for business services stored in business settings. Service model includes name, price, duration, extra dog fees, weekend fees, client visibility, and staff assignment rules (any, seniorOnly, specific). API routes at `/business/:id/services` support GET, POST, PUT, and DELETE operations. Frontend service management UI integrated into Settings page with real-time updates.

### Frontend Architecture
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with a teal/emerald/cyan palette and custom CSS variables. Dedicated stylesheet modules for sidebar (`styles/sidebar.css`) and dashboard (`styles/dashboard.css`) components.
- **State Management**: React hooks.
- **Calendar System**: A custom weekly grid calendar component visualizes time slots and bookings, replacing FullCalendar.
- **Routing**: Clean React Router setup supporting distinct admin, staff, and client portals with role-aware navigation. Key routes include dashboards, staff management (availability, services), client management, service configuration, booking management, invoice viewing, bulk scheduling tools, and comprehensive admin settings.
- **UI/UX Decisions**: Features a persistent left sidebar with role-aware navigation for a cleaner interface, distinct admin and staff navigation menus with grouped Staff section (Team, Availability, Service Skills), and color-coded booking statuses for visual clarity (Requested: amber, Scheduled/Approved: teal/emerald, Complete: blue, Declined/Cancelled: rose). Dashboard features modern card grid with hover effects and chart placeholders. A 6-step client onboarding wizard ensures complete client profiles before booking access.
- **Technical Implementations**: Includes a comprehensive staff scheduling system with weekly availability management and service assignment, an intelligent staff ranking system for auto-assignment, real-time conflict detection, and a booking form modal for detailed job creation/editing. Bulk recurring booking and flexi-week booking tools are available for admins and clients, respectively.

### System Design Choices
- **Staff Assignment Intelligence**: Utilizes a sophisticated logic (`apps/web/src/lib/staff.js`) to rank staff based on qualifications, availability, and conflict status, providing a match score. This system also handles conflict detection and availability checking.
- **Repository Pattern**: All data operations are abstracted through `repo.js`, providing a consistent interface for managing businesses, users, clients, dogs, services, jobs, availability, invoices, and job updates. Job statuses are carefully managed, with only `SCHEDULED`, `APPROVED`, `COMPLETE`, and `COMPLETED` jobs blocking staff availability, and `COMPLETE`/`COMPLETED` jobs triggering automatic invoice generation.
- **Client Portal**: Features a client-facing portal with booking request capabilities, an onboarding wizard, and views for their bookings, invoices, and dog information. Client Guard restricts access to booking features until profile completion.
- **Admin Workflow**: Includes an admin approval workflow for client booking requests, comprehensive booking management, and invoice generation with payment links and WhatsApp sharing.
- **Admin Settings System**: Comprehensive 8-section settings page with left mini-menu navigation (Business profile, Working hours, Policies, Branding, Finance settings, Service pricing, Staff permissions, Automation rules). Finance settings section features full backend persistence with auto-invoicing configuration (frequency, trigger conditions, send mode), default payment terms, and bank details. Service pricing section provides complete service management with inline editing of prices, durations, fees, visibility, and staff assignment rules. Staff permissions section enables role-based access control with a permission matrix for admin and staff roles, controlling access to finances, settings, client information, invoices, and job approvals. Settings persist to backend via dedicated API helpers (`businessApi` for settings, `servicesApi` for service CRUD operations).
- **Role-Based Permissions System**: Granular permission control with role definitions stored in business settings. System supports admin and staff roles with customizable permissions including canSeeFinance, canEditBusinessSettings, canViewClients, canViewClientAddresses, canViewInvoices, canApproveJobs, and canAssignJobs. Permission middleware (`apps/api/src/middleware/permissions.js`) protects sensitive routes, and frontend helper (`apps/web/src/lib/permissions.js`) provides hasPermission() function for conditional UI rendering based on user roles.
- **Demo Client Seeder**: Automatically creates a demo client account (`demo@client.com / test123`) on startup for easy testing.

## External Dependencies
- **Backend Libraries**: `fastify`, `@fastify/cors`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`.
- **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`.
- **Third-Party Services**: Stripe (for payment processing, currently in stub mode).
- **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY` (optional).