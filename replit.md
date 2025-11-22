# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed to streamline operations for dog-walking and pet care businesses. It offers a comprehensive CRM solution for managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a dedicated staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization, culminating in a production-ready MVP with integrated payment processing.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Pawtimation utilizes a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
-   **Framework**: Fastify (ES modules) with schema validation.
-   **Data Storage**: PostgreSQL with Drizzle ORM, using a repository pattern.
-   **Real-Time Updates**: Socket.io for UI synchronization.
-   **CRM Data Model**: Supports multiple businesses with distinct entities (businesses, users, clients, dogs, services, jobs, invoices, etc.).
-   **Address Management**: Client addresses include automatic GPS geocoding.
-   **Authentication & Authorization**: JWT-based authentication with role-specific guards (SUPER_ADMIN, ADMIN, STAFF, CLIENT) ensuring business isolation and PII protection. Features staff approval workflow, platform-wide super admin access with masquerade capability, and route-aware multi-session isolation to prevent cross-portal data leakage. Rate-limited auth endpoints prevent brute-force attacks.
-   **Performance Optimization**: Production indexes on high-traffic queries, N+1 query elimination, and database query batching.
-   **System Logs**: Audit trail table (`systemLogs`) tracks critical events.
-   **Media & File Storage**: Replit Object Storage integration for staff, dog, and walk media (photos/videos) with business isolation, role-based access control, and metadata tracking.
-   **Booking Workflow**: Supports client-initiated requests (admin/staff approval) and admin-created bookings.
-   **Invoice Management**: Multi-item invoicing with professional PDF generation, branding, automated overdue calculation with server-side helpers (`isInvoiceOverdue`, `getOverdueDays`), and automated email reminders (daily 9am UK, 48-hour cooldown, 90-day cutoff). Invoices track `lastReminderAt` and `reminderCount` for reminder management.
-   **Financial Analytics**: Reporting for revenue, trends, and forecasts.
-   **Walking Route Generation**: Combines geometric algorithms and OpenRouteService integration for snap-to-path walking routes with a backend proxy for API key security.
-   **Beta/Trial Management**: Environment-driven beta program with automated workflows, referral tracking, and trial period enforcement.
-   **Plan Status Tracking**: Businesses track `planStatus` (BETA, FREE_TRIAL, PAID, SUSPENDED) with automated access control middleware.
-   **Stripe Integration**: Comprehensive integration for subscription management, checkout flow, and webhook processing.
-   **Stripe Connect**: Businesses connect their own Stripe accounts to accept online invoice payments. Payment links generate Stripe checkout sessions on connected accounts. Webhook handlers process payment events. Stripe processing fees passed directly to businesses with no platform fee.
-   **Events System**: Database-backed community events with RSVP functionality.
-   **Feedback System**: Enhanced feedback system with detailed categorization and automated context capture.
-   **Pricing Tier Framework**: Infrastructure for plan-based feature gating with defined tiers.
-   **Super Admin Owner Portal**: Centralized management portal for super administrators.

### Frontend Architecture
-   **Build Tool**: Vite.
-   **Styling**: Tailwind CSS with custom CSS variables.
-   **State Management**: React hooks integrated with `DataRefreshContext` for Socket.io.
-   **Routing**: React Router facilitates distinct admin, staff, and client portals with role-aware navigation.
-   **Data Visualization**: Recharts library for financial graphs and feedback analytics.
-   **User Portals**: Dedicated interfaces for admins, staff, and clients with role-specific dashboards, calendars, and settings. Mobile optimized with touch-friendly components.
-   **UI/UX Decisions**: Consistent design elements including a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, a 6-step client onboarding wizard, and dynamic business branding.
-   **Route Display Components**: Reusable components for interactive (editable waypoints with drag-and-drop for Admin/Staff) and read-only maps (Client portal), utilizing MapTiler tiles and mobile-optimized controls.

### System Design Choices
-   **Staff Assignment Intelligence**: Ranks staff based on qualifications, availability, and conflict status.
-   **Repository Pattern**: Abstracts data operations via `repo.js`.
-   **Client Portal**: Features booking workflows, secure API endpoints, ownership validation, and notifications.
-   **Admin Workflow**: Includes admin approval for client booking requests, booking management, and invoice itemization.
-   **Admin Settings System**: Comprehensive settings for business profile, working hours, branding, finance, services, and automation.
-   **Role-Based Permissions**: Granular control enforced via middleware and frontend helpers.

## External Dependencies
-   **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `@fastify/rate-limit`, `@replit/object-storage`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
-   **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`, `leaflet`, `react-leaflet`.
-   **Third-Party Services**: Stripe (payment processing), Nominatim API (geocoding), MapTiler (map tiles), OpenRouteService (walking route calculation via secure backend proxy).