# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform for dog-walking and pet care businesses, offering a comprehensive CRM to streamline operations. It manages staff, clients, pets, services, and job scheduling with intelligent staff assignment. The platform aims to boost efficiency and support business growth through features like a dedicated staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization.

## Recent Changes (November 2025)
**Feedback & Telemetry System** (November 22, 2025): Comprehensive feedback collection platform with feedback_items table (type: BUG, IDEA, PRAISE, OTHER; domain auto-tagging: ADMIN, STAFF, CLIENT, OWNER, PUBLIC; status workflow: NEW, IN_PROGRESS, RESOLVED, ARCHIVED). Features include: POST /api/feedback endpoint accessible to all users (authenticated and anonymous), automatic domain detection from JWT role, optional email capture for public feedback, feedback widget integrated into SupportChat component across all portals, Owner Portal feedback management dashboard (/owner/feedback) with filtering and status updates, and daily email digest automation (21:00 UK time) sending summaries to hello@pawtimation.co.uk with breakdown by type and source. Email service (emailService.js) uses Resend API when RESEND_API_KEY is set, gracefully falls back to console.log in development.

**Super Admin Owner Portal** (November 22, 2025): Implemented platform-wide management portal for founder access. Features include: SUPER_ADMIN role with dedicated session key (pawtimation_super_admin_session), SuperAdminGuard route protection, comprehensive business dashboard showing all businesses with stats (staff count, client count, bookings, referrals, plan status, trial dates), business management actions (masquerade as admin, suspend business, extend trial, reset password), system logs viewer with filtering (logType, severity), and demo super admin account (owner@pawtimation.com / owner123). Access at /owner route. All actions logged to systemLogs table for audit trail.

**Multi-Session Authentication Isolation** (November 22, 2025): Implemented role-scoped session management to allow Admin, Staff, and Client users to be logged in simultaneously without session conflicts. Implementation includes role-specific session keys (pawtimation_admin_session, pawtimation_staff_session, pawtimation_client_session) and role-specific API wrappers (adminApi, staffApi, clientApi). **Migration Status**: Core authentication system updated; gradual migration of api() call sites to role-specific wrappers in progress. Files migrated: StaffSettings.jsx, ClientSettings.jsx, ClientInbox.jsx, ClientMessagesNew.jsx. Remaining files with api() calls need migration to fully prevent cross-role token leakage.

**Beta-to-Trial Transition System**: Implemented comprehensive beta program management with automated workflows, referral tracking, and trial period management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Pawtimation utilizes a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
-   **Framework**: Fastify (ES modules) with schema validation.
-   **Data Storage**: PostgreSQL with Drizzle ORM, using a repository pattern for all entities.
-   **Real-Time Updates**: Socket.io for UI synchronization.
-   **CRM Data Model**: Supports multiple businesses with distinct entities (businesses, users, clients, dogs, services, jobs, invoices, availability, recurring jobs, analytics, beta_testers, referrals).
-   **Address Management**: Client addresses include automatic GPS geocoding via Nominatim API.
-   **Authentication & Authorization**: JWT-based authentication with role-specific guards (SUPER_ADMIN, ADMIN, STAFF, CLIENT) ensuring business isolation and PII protection; staff approval workflow for bookings; platform-wide super admin access for founder with masquerade capability.
-   **System Logs**: Audit trail table (systemLogs) tracks all critical events including authentication, errors, webhooks, emails, and admin actions with severity levels (INFO, WARN, ERROR) and metadata.
-   **Booking Workflow**: Supports client-initiated requests (admin/staff approval) and admin-created bookings (pending staff approval or confirmed).
-   **Invoice Management**: Multi-item invoicing with professional PDF generation and branding.
-   **Financial Analytics**: Reporting for revenue, trends, forecasts.
-   **Walking Route Generation**: Geometric algorithm for circular walking routes based on client geolocation and service duration, stored in GeoJSON and exportable as GPX.
-   **Beta/Trial Management**: Environment-driven beta program with 15-tester cap, automated activation workflow, 6-hour founder email automation, referral tracking, waiting list management, and trial period enforcement.
-   **Plan Status Tracking**: Businesses track planStatus (BETA, FREE_TRIAL, PAID, SUSPENDED) with beta/trial start/end dates and automated access control middleware.

### Frontend Architecture
-   **Build Tool**: Vite.
-   **Styling**: Tailwind CSS with custom CSS variables.
-   **State Management**: React hooks integrated with `DataRefreshContext` for Socket.io.
-   **Routing**: React Router facilitates distinct admin, staff, and client portals with role-aware navigation.
-   **Data Visualization**: Recharts library for financial graphs.
-   **User Portals**: Dedicated interfaces for admins, staff, and clients, featuring role-specific dashboards, calendars, and settings.
-   **UI/UX Decisions**: Consistent design elements including a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, a 6-step client onboarding wizard, and mobile optimization with dynamic business branding.
-   **Route Display Components**: Reusable components for OpenStreetMap embeds, route metrics, and navigation options.

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
-   **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`, `BETA_ENABLED`, `BETA_END_DATE`, `BETA_MAX_ACTIVE_TESTERS`, `TRIAL_DEFAULT_DAYS`, `FOUNDER_EMAIL_DELAY_HOURS`.