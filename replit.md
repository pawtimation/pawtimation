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
-   **Database Backup System**: Automated PostgreSQL backups to Replit Object Storage with configurable schedule (monthly until Dec 31, 2025, then weekly from Jan 1, 2026). Backups run at 2am UTC, retain last 12 backups with automatic cleanup, and include manual trigger capability via Owner Portal API. System handles JavaScript timeout limitations for long-term scheduling and uses lazy-loaded Object Storage client for reliability.
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
-   **Build Tool**: Vite with production-optimized bundle splitting.
-   **Bundle Optimization**: Manual chunks for vendor libraries (React, Recharts, Leaflet, utilities) reducing initial load time.
-   **Lazy Loading**: Charts and maps lazy-loaded with React.Suspense for performance.
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

## Session Management
-   **Session Keys**: Multi-role session isolation using dedicated localStorage keys:
    -   `pawtimation_admin_session` - Admin portal sessions
    -   `pawtimation_staff_session` - Staff portal sessions
    -   `pawtimation_client_session` - Client portal sessions
    -   `pawtimation_super_admin_session` - Owner portal sessions
-   **Role-Specific APIs**: All frontend API calls use role-aware helpers (`adminApi`, `staffApi`, `clientApi`) that automatically attach the correct session token, preventing cross-portal data leakage.
-   **Legacy Migration**: Automatic migration from legacy `pt_token` keys to new session format on first access.

## Production Deployment
-   **Required Environment Variables**:
    -   `NODE_ENV=production` (shared)
    -   `ALLOWED_ORIGINS` (shared) - **CRITICAL**: Comma-separated list of allowed domains
        -   **Development**: Currently includes Replit dev domain + placeholder production domains
        -   **Before Production Launch**: Remove dev domain and add only your actual production domains
        -   **Example**: `https://pawtimation.co.uk,https://www.pawtimation.co.uk,https://app.pawtimation.co.uk`
        -   **Security**: Application will EXIT if this is not set correctly in production mode
    -   `JWT_SECRET` (shared) - 128+ character random string (already set)
    -   `DATABASE_URL` (secret) - PostgreSQL connection string
    -   `RESEND_API_KEY` (secret) - Email service API key
    -   `STRIPE_SECRET_KEY` (via Stripe integration)
    -   `MAPTILER_API_KEY` (secret) - Map tiles API key
    -   `OPENROUTESERVICE_API_KEY` (secret) - Route calculation API key
-   **Pre-Launch Checklist**:
    1. **CRITICAL**: Update `ALLOWED_ORIGINS` to remove dev domain and add only production domains
    2. Verify all secrets are set in production environment
    3. Run database migrations via `npm run db:push`
    4. Test all role-based access controls
    5. Verify mobile responsiveness across devices
    6. Run Lighthouse performance audit
    7. Test Stripe webhooks with production account
    8. Verify masquerade logging (both START and END events in system logs)
-   **Mission-Critical Security Hardening (Phase 1 - PRODUCTION DEPLOYED)**:
    -   **Security Headers**: CSP with Stripe (js.stripe.com) and Replit domain allowlists, X-Frame-Options: SAMEORIGIN, HSTS, COEP, COOP
    -   **Comprehensive Log Sanitization**: Automated scrubbing of ALL sensitive data from logs
        *   Bearer tokens (with base64 support): `Bearer xyz...` → `[BEARER_TOKEN]`
        *   JWTs (3-segment base64url): `eyJ0...` → `[JWT]`
        *   API keys with prefixes (hyphen/underscore): `sk_live_...`, `xoxb-...`, `ghp_...` → `[API_KEY]`
        *   Base64 secrets (AWS, Firebase, HTTP Basic): 20+ chars with `/+=` → `[BASE64_SECRET:prefix...]`
        *   Generic tokens: 30+ chars with `_-` (UUID-exempt) → `[TOKEN:prefix...]`
        *   Emails: `user@domain.com` → `use***@domain.com`
        *   Phone numbers, card numbers, passwords → `[REDACTED]`
        *   Unified architecture: `sanitizeLogMessage` → `sanitizeObject` delegation
        *   Coverage: String-only logs, objects (with/without messages), variadic args, child loggers
        *   Catches standalone AND embedded tokens in all contexts
    -   **File Upload Security (PRODUCTION-GRADE)**:
        *   Authoritative MIME detection using `file-type` library (detects from file content, NOT client input)
        *   Magic number verification for JPG (FFD8FF), PNG (89504E47), WEBP (RIFF+WEBP), MP4/MOV (ftyp variants)
        *   Server-generated filenames (`UUID.ext`) prevent spoofing - client names stored only for display
        *   Filename sanitization: strict whitelist, 100-char max, leading/trailing dot removal
        *   Category-based size limits: 10MB images, 100MB videos, 5MB documents
        *   Rate limiting: 20 uploads/15min, 100 downloads/15min
        *   Malicious content blocking: executables, scripts, archives, dangerous extensions
    -   **GDPR Compliance (OPERATIONAL)**:
        *   Data export: Complete PII export for clients (profile, dogs, bookings, invoices, messages, media)
        *   Right to erasure: Proper Object Storage `.delete()` API with storage key validation
        *   Path traversal prevention: Validates keys, blocks `..` patterns
        *   Failed deletion audit logging with error details
        *   Owner portal endpoints for GDPR operations
    -   **Database Backup System (VERIFIED & AUTOMATED)**:
        *   Upload verification: Checks `uploadResult.ok` before proceeding
        *   Integrity validation: Post-upload size comparison ensures completeness
        *   Automated schedule: Monthly backups (switches to weekly Jan 1, 2026) at 2am UTC
        *   Error handling: 1-hour auto-retry on failure with critical warnings
        *   Retention: Keeps last 12 backups with automatic cleanup
        *   Manual trigger: Owner portal API for on-demand backups
    -   **Security Monitoring (ACTIVE)**:
        *   Failed login tracking with IP/user agent/timestamp logging
        *   File access audit: Successful/failed downloads with requester details
        *   Payment failure monitoring: Stripe payment/subscription failure tracking
        *   Auto-cleanup: 30-day retention for stale security events
        *   Owner portal integration: Query APIs for security event analysis
    -   **Signed File URLs**: 5-minute expiry with comprehensive audit logging (IP, user agent, success/failure status)
    -   **Command Injection Prevention**: spawn() with array args instead of shell exec
    -   **CORS**: Restricted to whitelisted origins only
    -   **Rate Limiting**: All auth endpoints protected against brute-force attacks
    -   **JWT Tokens**: 8-hour expiry (super admin), 24-hour expiry (other roles)
    -   **Stripe API**: All calls wrapped in retry logic with exponential backoff
    -   **Business Isolation**: Enforced at database query level
-   **Security Hardening (Phase 2 - PLANNED)**:
    -   **Field-Level Encryption**: Infrastructure created for sensitive financial data (Stripe account IDs). Requires systematic repository-layer integration across all read/write paths, webhook handlers, and status checks. Includes AES-256-GCM encryption utility, encrypted database column (`stripeConnectedAccountIdEncrypted`), migration script, and partial integration in account creation endpoint. Full deployment requires centralized abstraction to ensure all code paths use encrypted storage.