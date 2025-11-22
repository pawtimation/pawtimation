# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed to streamline operations for dog-walking and pet care businesses. It offers a comprehensive CRM solution for managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a dedicated staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization, culminating in a production-ready MVP with integrated payment processing.

## Recent Changes (November 22, 2025)
**Performance & Security Hardening**:
1. **Rate Limiting**: Implemented @fastify/rate-limit with protection for auth endpoints (register: 5/15min, login: 10/15min with IP+email keying), Stripe webhooks (100/min), and custom 429 error responses with retry-after seconds
2. **Database Performance**: Added 14 production indexes (users.email/businessId, clients.email/businessId, services.businessId, jobs.businessId/clientId/staffId/start/status, invoices.businessId/clientId) optimizing auth, calendar, and invoice queries
3. **N+1 Query Optimization**: Fixed invoice list endpoint to batch client lookups using Map instead of sequential queries (reduced from N queries to 1 batch)
4. **Mobile UX**: Production-ready mobile interface with touch-friendly job filtering (All/Today/Upcoming/Pending/Completed), chat-style messaging, and 44x44px minimum touch targets for accessibility
5. **Authentication Security Refactor**: Eliminated ~70 deprecated auth.user references and implemented route-aware multi-session isolation preventing cross-portal data leakage when admin/staff/client sessions coexist. BusinessContext, App.jsx, and AccountMenu.jsx now use getCurrentSessionForRoute() with window.location.pathname to select the correct session based on current route (/admin, /staff, /client, /owner), preventing stale session exposure during navigation

**Interactive Walking Route Enhancement**:
1. **Map Integration**: Integrated MapTiler for modern map tiles and React-Leaflet for interactive mapping across all portals
2. **Interactive Route Builder**: Created InteractiveRouteMap component with drag-and-drop waypoints, multi-stop route planning, paw-print markers (#2BA39B teal branding), and mobile-friendly controls for Admin/Staff views
3. **Read-Only Map Display**: Created ReadOnlyRouteMap component for Client portal showing planned routes with navigation options
4. **Secure API Proxy**: Implemented /api/proxy/route backend endpoint to keep OpenRouteService API key server-side, preventing credential exposure to browsers
5. **Real-Time Route Snapping**: Routes snap to walking paths using OpenRouteService foot-walking API with automatic distance/duration calculations
6. **Component Sync Fix**: Fixed state synchronization so maps update when external route data changes (regeneration, admin edits)
7. **Environment Configuration**: Configured MapTiler API key via Vite, secured OpenRouteService key server-side only

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
-   **Authentication & Authorization**: JWT-based authentication with role-specific guards (SUPER_ADMIN, ADMIN, STAFF, CLIENT) ensuring business isolation and PII protection. Features staff approval workflow for bookings and platform-wide super admin access with masquerade capability. Route-aware multi-session isolation implemented via getCurrentSessionForRoute() prevents cross-portal data leakage when concurrent admin/staff/client sessions coexist. Session resolution uses window.location.pathname to select the correct role-specific session based on current route, eliminating deprecated auth.user references and stale session exposure. Rate-limited auth endpoints prevent brute-force attacks (5 req/15min registration, 10 req/15min login).
-   **Performance Optimization**: Production indexes on high-traffic queries (businessId, email, clientId, staffId, start dates), N+1 query elimination in invoice endpoints, and database query batching for optimal performance.
-   **System Logs**: Audit trail table (`systemLogs`) tracks critical events with severity levels.
-   **Booking Workflow**: Supports client-initiated requests (admin/staff approval) and admin-created bookings.
-   **Invoice Management**: Multi-item invoicing with professional PDF generation and branding.
-   **Financial Analytics**: Reporting for revenue, trends, and forecasts.
-   **Walking Route Generation**: Dual approach combining geometric algorithm for basic circular routes and OpenRouteService integration for snap-to-path walking routes. Backend proxy endpoint (/api/proxy/route) secures API credentials while enabling real-time route calculation with distance/duration metrics.
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
-   **Route Display Components**: Reusable components including InteractiveRouteMap (editable waypoints with drag-and-drop for Admin/Staff), ReadOnlyRouteMap (view-only for Client portal), and legacy RouteDisplay for simple map embeds. All use MapTiler tiles, paw-print markers, and mobile-optimized controls.

### System Design Choices
-   **Staff Assignment Intelligence**: Ranks staff based on qualifications, availability, and conflict status.
-   **Repository Pattern**: Abstracts data operations via `repo.js`.
-   **Client Portal**: Features booking workflows, secure API endpoints, ownership validation, and notifications.
-   **Admin Workflow**: Includes admin approval for client booking requests, booking management, and invoice itemization.
-   **Admin Settings System**: Comprehensive settings for business profile, working hours, branding, finance, services, and automation.
-   **Role-Based Permissions**: Granular control enforced via middleware and frontend helpers.

## External Dependencies
-   **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `@fastify/rate-limit`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
-   **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`, `leaflet`, `react-leaflet`.
-   **Third-Party Services**: Stripe (payment processing), Nominatim API (geocoding), MapTiler (map tiles), OpenRouteService (walking route calculation via secure backend proxy).
-   **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`, `BETA_ENABLED`, `BETA_END_DATE`, `BETA_MAX_ACTIVE_TESTERS`, `TRIAL_DEFAULT_DAYS`, `FOUNDER_EMAIL_DELAY_HOURS`, `MAPTILER_API_KEY`, `OPENROUTESERVICE_API_KEY`.