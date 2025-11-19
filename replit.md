# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed for dog-walking and pet care businesses. It provides a comprehensive CRM for managing staff, clients, dogs, services, and job scheduling with intelligent staff assignment, aiming to streamline operations and enhance efficiency for pet care service providers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project is structured as a monorepo, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
- **Framework**: Fastify (ES modules) for high performance, with schema validation and modular route files.
- **Data Storage**: Currently uses in-memory JavaScript objects with a repository pattern, designed for future migration to persistent storage (e.g., Postgres/Drizzle).
- **CRM Data Model**: A multi-business CRM model with core entities including `businesses`, `users` (staff/admins), `clients`, `dogs`, `services`, `jobs`, `invoices`, `availability`, and `recurringJobs`.
- **Authentication & Authorization**: Dual JWT-based authentication for client users and business/admin users, enforcing role-based access control and business isolation.
- **Settings Persistence**: Business settings are stored in `businesses[id].settings` encompassing profile, working hours, policies, branding, finance, and services. Deep-merge logic (`mergeBusinessSettings`) handles partial updates.
- **Services Management**: Complete CRUD operations for business services, including name, price, duration, fees, visibility, and staff assignment rules.

### Frontend Architecture
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with a teal/emerald/cyan palette and custom CSS variables.
- **State Management**: React hooks.
- **Calendar System**: Custom weekly grid calendar component.
- **Routing**: React Router setup supporting distinct admin, staff, and client portals with role-aware navigation.
- **UI/UX Decisions**: Persistent left sidebar with role-aware navigation, distinct admin/staff menus, color-coded booking statuses, modern card grid dashboard, and a 6-step client onboarding wizard.
- **Technical Implementations**: Comprehensive staff scheduling with weekly availability and service assignment, intelligent staff ranking for auto-assignment, real-time conflict detection, and booking forms. Includes bulk recurring and flexi-week booking tools.
- **Mobile Admin Interface**: Complete mobile-optimized admin interface with viewport-based auto-redirect and fixed bottom navigation. Mobile dashboard displays real-time stats (Upcoming Jobs, Pending Approvals with red highlight when > 0, Active Clients, Revenue This Week in GBP) and upcoming jobs preview with enriched data. Mobile calendar (`AdminMobileCalendar.jsx`) provides daily job view with date navigation (←/→ buttons), displaying jobs for selected date with client names, service names, start times, and addresses. Mobile job detail screen (`AdminMobileJobDetail.jsx`) provides complete view/edit functionality with state-preserving error handling, inline editing for start time/service/staff/status, and enriched data display including client info, dogs, notes, and direct messaging links. Mobile client list (`AdminMobileClients.jsx`) displays all clients with name, email, and phone in card format. Mobile client detail screen (`AdminMobileClientDetail.jsx`) provides view/edit functionality with state-preserving error handling, inline editing for contact and address fields, dogs list display, and action buttons for messaging and job history. Mobile invoice list (`AdminMobileInvoices.jsx`) displays all invoices with client name, amount (GBP), due date, and color-coded status. Mobile invoice detail screen (`AdminMobileInvoiceDetail.jsx`) provides complete invoice view with client contact info, itemized breakdown, mark-as-paid functionality, and resend capability. Mobile settings interface (`AdminMobileSettings.jsx`) provides menu-driven access to business configuration with dedicated screens for business details (`AdminMobileBusinessDetails.jsx`), working hours (`AdminMobileHours.jsx`), policies (`AdminMobilePolicies.jsx`), and branding (`AdminMobileBranding.jsx`), each supporting view and edit modes with live backend updates. Dedicated API endpoints for stats, calendar, jobs, clients, invoices, and business settings provide authenticated business-scoped analytics and CRUD operations with multi-tenant isolation.

### System Design Choices
- **Staff Assignment Intelligence**: Sophisticated logic to rank staff based on qualifications, availability, and conflict status.
- **Repository Pattern**: Abstraction of all data operations via `repo.js` for consistent management of core entities.
- **Client Portal**: Features comprehensive booking workflows (create, edit, repeat, display), secure API endpoints with JWT authentication, dog/service ownership validation, a 6-step onboarding wizard, and automatic notification system for booking status changes.
- **Admin Workflow**: Includes admin approval workflow for client booking requests, comprehensive booking management, and invoice generation.
- **Admin Settings System**: Comprehensive 8-section settings page with detailed configuration for business profile, working hours, policies, branding, finance, service pricing, staff permissions, and automation rules.
- **Role-Based Permissions System**: Granular permission control with role definitions stored in business settings, using middleware for protection and frontend helpers for conditional UI rendering.
- **Automation System**: Backend automation engine with 6 types: booking reminders, invoice overdue reminders, daily summaries, auto-mark jobs completed, staff conflict alerts, and weekly revenue snapshots.
- **Messaging System**: Complete business-level messaging infrastructure for client-business communication, supporting booking-specific and general inbox messages with read/unread tracking and UI implementation.
- **Demo Client Seeder**: Automatically creates a demo client account on startup for testing.

## External Dependencies
- **Backend Libraries**: `fastify`, `@fastify/cors`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`.
- **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`.
- **Third-Party Services**: Stripe (payment processing, stubbed).
- **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`.