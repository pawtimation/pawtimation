# Pawtimation CRM

## Overview
Pawtimation is a B2B SaaS platform for dog-walking and pet care businesses, offering a comprehensive CRM solution. It streamlines operations by managing staff, clients, pets, services, and job scheduling, including intelligent staff assignment. The platform aims to enhance efficiency and support business growth through features like a staff UI, drag-and-drop calendar rescheduling, dynamic walking route generation, real-time dashboards, and extensive branding customization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project utilizes a monorepo approach, separating the backend (`apps/api`) and frontend (`apps/web`).

### Backend Architecture
- **Framework**: Fastify (ES modules) with schema validation.
- **Data Storage**: In-memory JavaScript objects using a repository pattern, with plans for future migration to persistent storage (e.g., Postgres/Drizzle).
- **Real-Time Updates**: Socket.io for immediate UI synchronization.
- **CRM Data Model**: Supports multiple businesses with entities for businesses, users (staff/admins), clients, dogs, services, jobs, invoices, availability, and recurring jobs.
- **Address Management**: Client addresses are structured with automatic GPS geocoding via Nominatim API.
- **Authentication & Authorization**: JWT-based authentication with centralized, role-specific guards (`authHelpers.js`) ensuring business isolation and preventing PII exposure. Includes a staff approval workflow for bookings.
- **Booking Workflow**: A multi-step process from client request to admin assignment and staff confirmation/decline/cancellation.
- **Invoice Management**: Multi-item invoicing with professional PDF generation and branding.
- **Financial Analytics**: Reporting system for revenue, trends, forecasts, and breakdowns.
- **Settings Persistence**: Business settings are stored and updated using deep-merge.
- **Services Management**: CRUD operations for business services, including pricing, duration, and staff rules.
- **Walking Route Generation**: Geometric algorithm for circular walking routes based on client geolocation and service duration, stored in GeoJSON and exportable as GPX.
- **Socket Security**: Sanitized socket emissions for sensitive actions to prevent PII exposure.

### Frontend Architecture
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: React hooks integrated with `DataRefreshContext` for Socket.io.
- **Routing**: React Router facilitates distinct admin, staff, and client portals with role-aware navigation.
- **Data Visualization**: Recharts library for financial graphs.
- **User Portals**: Dedicated interfaces for admins, staff, and clients, featuring role-specific dashboards, calendars, and settings.
- **UI/UX Decisions**: Consistent design elements include a persistent left sidebar, modern card-grid dashboards, standardized color-coded booking statuses, and a 6-step client onboarding wizard. Mobile-optimized with dynamic business branding.
- **Technical Implementations**: Comprehensive staff scheduling with intelligent ranking, conflict detection, bulk booking tools, and a unified `DateTimePicker`.
- **Financial Reporting**: A dedicated screen (`AdminFinancial.jsx`) for invoices, overview, forecasts, and breakdowns.
- **Route Display Components**: Reusable components for displaying OpenStreetMap embeds, route metrics, and navigation options. Staff can generate, download GPX, and open routes in mapping apps.
- **Admin Client Location**: Admin client detail views include embedded OpenStreetMap showing precise client locations.

### System Design Choices
- **Staff Assignment Intelligence**: Ranks staff based on qualifications, availability, and conflict status.
- **Repository Pattern**: Abstracts data operations via `repo.js`.
- **Client Portal**: Features booking workflows, secure API endpoints, ownership validation, and notifications.
- **Admin Workflow**: Includes admin approval for client booking requests, booking management, and invoice itemization.
- **Admin Settings System**: Comprehensive settings for business profile, working hours, branding, finance, services, and automation.
- **Role-Based Permissions**: Granular control enforced via middleware and frontend helpers.
- **Automation System**: Backend engine for alerts and reminders.
- **Messaging System**: Business-level messaging for client-business communication.

## External Dependencies
- **Backend Libraries**: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/cookie`, `dotenv`, `stripe` (stubbed), `nanoid`, `node-fetch`, `raw-body`, `socket.io`, `bcryptjs`, `pdfkit`, `dayjs`.
- **Frontend Libraries**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dayjs`.
- **Third-Party Services**: Stripe (payment processing, stubbed), Nominatim API (geocoding), OpenStreetMap (map embeds).
- **Environment Variables**: `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`.