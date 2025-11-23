# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform designed to streamline operations for dog-walking and pet care businesses. It offers a comprehensive CRM solution for managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a dedicated staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization, culminating in a production-ready MVP with integrated payment processing.

## Recent Changes (November 23, 2025)
- **Client Dog Management**: Implemented comprehensive dog management for clients with modal-based add/edit interface matching admin style, displaying all dog details (behaviour, medical, feeding, walking notes), secured via clientApi endpoints
- **Client Settings Always Editable**: Removed edit toggle, all fields now always editable with "Save Changes" button for simpler self-service UX
- **Staff Quick Login Fix**: Corrected owner portal quick login redirect from `/staff/today` to `/staff` (correct route)
- **Admin Dashboard Preview**: Updated homepage banner to show realistic admin dashboard with 8 stat cards matching actual dashboard layout
- **Footer Visibility**: Admin pages now display footer with legal/support links; client and staff mobile pages have no footer for clean UI
- **Staff Availability Time Pickers**: Updated StaffSettings availability section to use TimePicker component (matching admin working hours style) for consistent, searchable time selection across the platform
- **ClientGuard Security Enhancement**: Implemented secure authentication guard with in-memory validation caching (3-min freshness), exponential backoff retry logic (5 attempts over ~6s) to handle cookie propagation races, authoritative server validation, and automatic session cleanup on failure
- **Booking Edit Fix**: Added dogs array reset in BookingFormModal before loading client dogs, preventing null reference errors that caused ErrorBoundary "Oops" screen when editing bookings

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Pawtimation utilizes a monorepo structure, separating the backend (`apps/api`) and frontend (`apps/web`).

### UI/UX Decisions
The frontend employs consistent design elements including a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, a 6-step client onboarding wizard, and dynamic business branding. It features dedicated interfaces for admins, staff, and clients with role-specific dashboards, calendars, and settings, optimized for mobile with touch-friendly components. Reusable components for interactive and read-only maps utilize MapTiler tiles and mobile-optimized controls. Staff Messages rebuilt to match Admin Messages format using inbox API instead of booking messages, with client-based messaging, search functionality, and consistent teal theme. Client portal simplified with Message button removed from home dashboard. Client Settings page enhanced with editable name, emergency contact details, and veterinary information. Staff Availability features premium UI with gradient backgrounds, enhanced typography, and mobile-responsive design.

### Technical Implementations
The backend is built with Fastify (ES modules) using schema validation and PostgreSQL with Drizzle ORM and a repository pattern. Real-time updates are handled by Socket.io. Authentication is JWT-based with role-specific guards and multi-session isolation. Media and file storage are integrated with Replit Object Storage, featuring business isolation and role-based access control. The frontend uses Vite, React, and Tailwind CSS, with Recharts for data visualization and React Router for navigation. Performance optimizations include production indexes, N+1 query elimination, database query batching, and lazy loading for charts and maps. Automated database backups to Replit Object Storage are implemented.

### Feature Specifications
The platform supports a comprehensive CRM data model for businesses, users, clients, pets, services, jobs, and invoices. Key features include intelligent staff assignment based on qualifications and availability, client address management with GPS geocoding, and a robust booking workflow supporting both client-initiated requests and admin-created bookings. Invoice management includes multi-item invoicing, professional PDF generation, automated overdue calculations, and email reminders. Financial analytics provide reporting for revenue and trends. Walking route generation combines geometric algorithms with OpenRouteService integration. The system also includes a beta/trial management system, plan status tracking with automated access control, and a pricing tier framework. An events system, enhanced feedback system, and a Super Admin Owner Portal are also part of the platform. GDPR compliance is operational with data export and right to erasure capabilities. Security hardening includes comprehensive log sanitization, production-grade file upload security (MIME detection, magic number verification, server-generated filenames), signed file URLs, command injection prevention, strict CORS, rate limiting, and business isolation. Field-level encryption for sensitive financial data is planned.

### System Design Choices
Core architectural patterns include a monorepo structure, a repository pattern for data operations, and a robust role-based permission system enforced via middleware. Session management uses multi-role isolated localStorage keys and role-aware API helpers (clientApi, staffApi, adminApi) with /me endpoints for identity resolution, preventing cross-portal data leakage and eliminating legacy localStorage auth dependencies. Security is a primary concern, with features like rate-limited authentication endpoints, comprehensive log sanitization, and strict file upload validation.

## External Dependencies
-   **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `@fastify/rate-limit`, `@replit/object-storage`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
-   **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`, `leaflet`, `react-leaflet`.
-   **Third-Party Services**: Stripe (payment processing, Stripe Connect), Nominatim API (geocoding), MapTiler (map tiles), OpenRouteService (walking route calculation).