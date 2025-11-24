# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed to streamline operations for dog-walking and pet care businesses. It offers a comprehensive CRM solution for managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a dedicated staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization, culminating in a production-ready MVP with integrated payment processing.

## User Preferences
Preferred communication style: Simple, everyday language.
Terminology: Use "pet-care" and "dog-walking & pet-care" phrasing, not dog-walking centric language.

## System Architecture
Pawtimation utilizes a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### Recent Changes (November 24, 2025)
**Multi-Factor Authentication (MFA) for Platform Owner**: Implemented production-ready TOTP-based MFA system using challenge-based authentication. Features include: encrypted secret storage (AES-256-GCM), IP-bound challenges with 5-minute expiry, attempt tracking (max 5 per challenge), backup code generation (hashed SHA-256, one-time use), and comprehensive rate limiting. All MFA management routes require SUPER_ADMIN role with password confirmation. System passed security review with no vulnerabilities detected. Requires DATA_ENCRYPTION_KEY environment variable.

**Client Address Schema Update**: Fixed critical bug where admin edits to client details weren't saving. Updated database schema to use individual address columns (addressLine1, city, postcode, accessNotes, lat, lng, emergencyName, emergencyPhone) instead of JSON blobs. Added compatibility layer in repo.js to support both legacy JSON format and new flat columns during transition period. This ensures backward compatibility while allowing new code to use the improved schema.

### UI/UX Decisions
The frontend employs consistent design elements including a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, a 6-step client onboarding wizard, and dynamic business branding. It features dedicated interfaces for admins, staff, and clients with role-specific dashboards, calendars, and settings, optimized for mobile with touch-friendly components. Reusable components for interactive and read-only maps utilize MapTiler tiles. The system includes personalized time-based greetings, enhanced calendar and home page UIs for staff and clients, and improved dog management interfaces.

### Technical Implementations
The backend is built with Fastify (ES modules) using schema validation and PostgreSQL with Drizzle ORM and a repository pattern. Real-time updates are handled by Socket.io. Authentication is JWT-based with role-specific guards and multi-session isolation. Media and file storage are integrated with Replit Object Storage, featuring business isolation and role-based access control. The frontend uses Vite, React, and Tailwind CSS, with Recharts for data visualization and React Router for navigation. Performance optimizations include production indexes, N+1 query elimination, database query batching, and lazy loading. Automated database backups are implemented. Secure authentication guards with in-memory validation caching and robust retry logic are in place.

### Feature Specifications
The platform supports a comprehensive CRM data model for businesses, users, clients, pets, services, jobs, and invoices. Key features include intelligent staff assignment based on qualifications and availability, client address management with GPS geocoding, and a robust booking workflow. Invoice management includes multi-item invoicing, professional PDF generation, automated overdue calculations, and email reminders. Financial analytics provide reporting for revenue and trends. Walking route generation combines geometric algorithms with OpenRouteService integration. The system also includes a beta/trial management system, plan status tracking, a pricing tier framework, an events system, an enhanced feedback system, a Super Admin Owner Portal for system health and business monitoring, and GDPR compliance. Security hardening includes log sanitization, production-grade file upload security, signed file URLs, command injection prevention, strict CORS, rate limiting, business isolation, and multi-factor authentication for platform owners. Automated email triggers for staff invites, booking confirmations, invoice sent, and payment received are integrated.

### System Design Choices
Core architectural patterns include a monorepo structure, a repository pattern for data operations, and a robust role-based permission system enforced via middleware. Session management uses multi-role isolated localStorage keys and role-aware API helpers with `/me` endpoints for identity resolution, preventing cross-portal data leakage. Security is a primary concern, with features like rate-limited authentication endpoints, comprehensive log sanitization, strict file upload validation, and challenge-based multi-factor authentication with IP binding. MFA secrets are encrypted at rest using AES-256-GCM, backup codes are hashed with SHA-256, and all verification attempts are tracked server-side with strict limits.

## External Dependencies
-   **Third-Party Services**: Stripe (payment processing, Stripe Connect), Nominatim API (geocoding), MapTiler (map tiles), OpenRouteService (walking route calculation).
-   **Required Environment Variables**: DATA_ENCRYPTION_KEY (for MFA secret encryption), DATABASE_URL, STRIPE_SECRET_KEY, MAPTILER_API_KEY, OPENROUTESERVICE_API_KEY.