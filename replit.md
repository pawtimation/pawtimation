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
-   **Address Management**: Client addresses include automatic GPS geocoding via Nominatim API.
-   **Authentication & Authorization**: JWT-based authentication with role-specific guards (SUPER_ADMIN, ADMIN, STAFF, CLIENT) ensuring business isolation and PII protection. Features staff approval workflow for bookings and platform-wide super admin access with masquerade capability. Multi-session authentication isolation allows concurrent logins for different roles.
-   **System Logs**: Audit trail table (`systemLogs`) tracks critical events with severity levels.
-   **Booking Workflow**: Supports client-initiated requests (admin/staff approval) and admin-created bookings.
-   **Invoice Management**: Multi-item invoicing with professional PDF generation and branding.
-   **Financial Analytics**: Reporting for revenue, trends, and forecasts.
-   **Walking Route Generation**: Geometric algorithm for circular walking routes based on client geolocation and service duration.
-   **Beta/Trial Management**: Environment-driven beta program with automated workflows, referral tracking, and trial period enforcement.
-   **Plan Status Tracking**: Businesses track `planStatus` (BETA, FREE_TRIAL, PAID, SUSPENDED) with automated access control middleware.
-   **Stripe Integration**: Comprehensive Stripe integration for subscription management, checkout flow, and webhook processing, handling plan upgrades, downgrades, and business suspension.
-   **Events System**: Database-backed community events system with RSVP functionality.
-   **Feedback System**: Enhanced feedback system with detailed categorization, automated context capture, and daily digest emails.
-   **Mobile UX Optimization**: Production-ready mobile interfaces for key user roles (Admin, Client) with touch-friendly components and accessibility considerations.
-   **Pricing Tier Framework**: Infrastructure for plan-based feature gating with defined tiers (SOLO, TEAM, GROWING, AGENCY) and enforcement mechanisms.
-   **Super Admin Owner Portal**: Centralized management portal for super administrators, providing business oversight, user management, and system log viewing.

### Frontend Architecture
-   **Build Tool**: Vite.
-   **Styling**: Tailwind CSS with custom CSS variables.
-   **State Management**: React hooks integrated with `DataRefreshContext` for Socket.io.
-   **Routing**: React Router facilitates distinct admin, staff, and client portals with role-aware navigation.
-   **Data Visualization**: Recharts library for financial graphs and feedback analytics.
-   **User Portals**: Dedicated interfaces for admins, staff, and clients with role-specific dashboards, calendars, and settings.
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
-   **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
-   **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`.
-   **Third-Party Services**: Stripe (payment processing), Nominatim API (geocoding), OpenStreetMap (map embeds).
-   **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`, `BETA_ENABLED`, `BETA_END_DATE`, `BETA_MAX_ACTIVE_TESTERS`, `TRIAL_DEFAULT_DAYS`, `FOUNDER_EMAIL_DELAY_HOURS`.