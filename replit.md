# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed to streamline operations for dog-walking and pet care businesses. It provides a comprehensive CRM solution for managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment and dynamic walking route generation. The platform aims to enhance efficiency and support business growth through features like a dedicated staff UI, real-time dashboards, extensive branding customization, and integrated payment processing, culminating in a production-ready MVP.

## User Preferences
Preferred communication style: Simple, everyday language.
Terminology: Use "pet-care" and "dog-walking & pet-care" phrasing, not dog-walking centric language.

## System Architecture
Pawtimation utilizes a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### UI/UX Decisions
The frontend employs consistent design elements including a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, and dynamic business branding. It features dedicated interfaces for admins, staff, and clients with role-specific dashboards, calendars, and settings, optimized for mobile with touch-friendly components. Reusable components for interactive and read-only maps utilize MapTiler tiles. The system includes personalized time-based greetings, enhanced calendar and home page UIs for staff and clients, and improved dog management interfaces.

### Technical Implementations
The backend is built with Fastify (ES modules) using schema validation and PostgreSQL with Drizzle ORM and a repository pattern. Real-time updates are handled by Socket.io. Authentication is JWT-based with role-specific guards and multi-session isolation. Media and file storage are integrated with Replit Object Storage, featuring business isolation and role-based access control. The frontend uses Vite, React, and Tailwind CSS, with Recharts for data visualization and React Router for navigation. Performance optimizations include production indexes, N+1 query elimination, database query batching, and lazy loading. Automated database backups are implemented. Secure authentication guards with in-memory validation caching and robust retry logic are in place.

### Feature Specifications
The platform supports a comprehensive CRM data model for businesses, users, clients, pets, services, jobs, and invoices. Key features include intelligent staff assignment based on qualifications and availability, client address management with GPS geocoding, and a robust booking workflow. Invoice management includes multi-item invoicing, professional PDF generation, automated overdue calculations, and email reminders. Financial analytics provide reporting for revenue and trends. Walking route generation combines geometric algorithms with OpenRouteService integration. The system also includes a beta/trial management system, plan status tracking, a pricing tier framework, an events system, an enhanced feedback system, a Super Admin Owner Portal for system health and business monitoring, global error logging with heatmap analytics, and GDPR compliance. Security hardening includes log sanitization, production-grade file upload security, signed file URLs, command injection prevention, strict CORS, rate limiting, business isolation, and multi-factor authentication for platform owners. Automated email triggers for staff invites, booking confirmations, invoice sent, and payment received are integrated. The messaging system supports per-booking threads and general inbox conversations with proper business isolation and persists messages to PostgreSQL. Referral commission management enables businesses to earn recurring commissions, view detailed records, and process payouts. Comprehensive activity logging tracks business admin actions.

### System Design Choices
Core architectural patterns include a monorepo structure, a repository pattern for data operations, and a robust role-based permission system enforced via middleware. Session management uses multi-role isolated localStorage keys and role-aware API helpers with `/me` endpoints for identity resolution, preventing cross-portal data leakage. Security is a primary concern, with features like rate-limited authentication endpoints, comprehensive log sanitization, strict file upload validation, and challenge-based multi-factor authentication with IP binding. MFA secrets are encrypted at rest using AES-256-GCM, backup codes are hashed with SHA-256, and all verification attempts are tracked server-side with strict limits. The platform also features a global error logging system with PII sanitization, deduplication, and an LRU cache.

### GDPR & UK Compliance (Updated Nov 2025)
- **Age Verification**: Mandatory 18+ confirmation checkbox on all registration forms (business and client) with Terms/Privacy links, submit disabled until confirmed
- **Email Footer**: Standardized footer on all 15+ user-facing email templates with business identity: Andrew James Beattie (Sole Trader), Lytchett House, 13 Freeland Park, Wareham Road, Poole, Dorset BH16 6FA
- **Contact Email**: hello@pawtimation.co.uk standardized across all templates, legal docs, and components
- **Client Data Rights**: Self-service GDPR endpoints at `/client/gdpr/export` (JSON download) and `/client/gdpr/delete-request` (audit-logged deletion request)
- **Client UI**: "Your Data Rights" section in Client Settings with "Download My Data" and "Request Account Deletion" buttons
- **Deletion Workflow**: Deletion requests are audit-logged and trigger email notification to business owner for manual processing per GDPR requirements

### Maps & GPS Compliance System
The platform includes a comprehensive ENABLE_MAPS compliance system that allows complete disabling of all mapping, geocoding, and GPS-based features for data protection compliance:
- **Backend Flag**: `ENABLE_MAPS` (env var) controls geocodingService.js, routeGenerator.js, clientRoutes.js, jobRoutes.js, and securityHeaders.js
- **Frontend Flag**: `VITE_ENABLE_MAPS` (env var) with utility at `apps/web/src/lib/mapsEnabled.js`
- **When Disabled (default)**: No GPS coordinates collected/stored, no external map/routing API calls, all map components display text-only addresses, navigation buttons hidden, route generation disabled, browser geolocation API blocked via Permissions-Policy
- **Components Affected**: MapLibreRouteMap, InteractiveRouteMap, ReadOnlyRouteMap, AddressMap, LocationMap, RouteDisplay, RouteGenerator, buildNavigationURL, CheckInCard, StaffMobileJobDetail (Walking Route section)
- **Security Headers**: Permissions-Policy sets `geolocation=()` when ENABLE_MAPS=false, blocking browser geolocation at the permission level
- **Staff Check-in/Checkout**: GPS collection in CheckInCard is gated by isMapsEnabled() - returns null coordinates when disabled
- **To Enable**: Set `ENABLE_MAPS=true` and `VITE_ENABLE_MAPS=true` in environment variables

## Super Admin Access
-   **Login URL**: `/owner/login`
-   **Email**: `andy@pawtimation.co.uk`
-   **Password**: `N1!Szr7dkL6CL8CW&GF9`
-   Auto-created on all environments (development + production)

## External Dependencies
-   **Third-Party Services**: Stripe (payment processing, Stripe Connect), Nominatim API (geocoding), MapTiler (map tiles), OpenRouteService (walking route calculation).
-   **Required Environment Variables**: ENCRYPTION_KEY (or DATA_ENCRYPTION_KEY for legacy), DATABASE_URL, STRIPE_SECRET_KEY, MAPTILER_API_KEY, OPENROUTESERVICE_API_KEY.