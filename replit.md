# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed to streamline operations for dog-walking and pet care businesses. It offers a comprehensive CRM solution for managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a dedicated staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization, culminating in a production-ready MVP with integrated payment processing.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Pawtimation utilizes a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### UI/UX Decisions
The frontend employs consistent design elements including a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, a 6-step client onboarding wizard, and dynamic business branding. It features dedicated interfaces for admins, staff, and clients with role-specific dashboards, calendars, and settings, optimized for mobile with touch-friendly components. Reusable components for interactive and read-only maps utilize MapTiler tiles. The system includes personalized time-based greetings, enhanced calendar and home page UIs for staff and clients, and improved dog management interfaces.

### Technical Implementations
The backend is built with Fastify (ES modules) using schema validation and PostgreSQL with Drizzle ORM and a repository pattern. Real-time updates are handled by Socket.io. Authentication is JWT-based with role-specific guards and multi-session isolation. Media and file storage are integrated with Replit Object Storage, featuring business isolation and role-based access control. The frontend uses Vite, React, and Tailwind CSS, with Recharts for data visualization and React Router for navigation. Performance optimizations include production indexes, N+1 query elimination, database query batching, and lazy loading. Automated database backups are implemented. Secure authentication guards with in-memory validation caching and robust retry logic are in place.

### Feature Specifications
The platform supports a comprehensive CRM data model for businesses, users, clients, pets, services, jobs, and invoices. Key features include intelligent staff assignment based on qualifications and availability, client address management with GPS geocoding, and a robust booking workflow. Invoice management includes multi-item invoicing, professional PDF generation, automated overdue calculations, and email reminders. Financial analytics provide reporting for revenue and trends. Walking route generation combines geometric algorithms with OpenRouteService integration. The system also includes a beta/trial management system, plan status tracking, a pricing tier framework, an events system, an enhanced feedback system, a Super Admin Owner Portal for system health and business monitoring, and GDPR compliance. Security hardening includes log sanitization, production-grade file upload security, signed file URLs, command injection prevention, strict CORS, rate limiting, and business isolation. Automated email triggers for staff invites, booking confirmations, invoice sent, and payment received are integrated.

### System Design Choices
Core architectural patterns include a monorepo structure, a repository pattern for data operations, and a robust role-based permission system enforced via middleware. Session management uses multi-role isolated localStorage keys and role-aware API helpers with `/me` endpoints for identity resolution, preventing cross-portal data leakage. Security is a primary concern, with features like rate-limited authentication endpoints, comprehensive log sanitization, and strict file upload validation.

## External Dependencies
-   **Third-Party Services**: Stripe (payment processing, Stripe Connect), Nominatim API (geocoding), MapTiler (map tiles), OpenRouteService (walking route calculation).