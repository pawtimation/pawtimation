# Pawtimation

## Overview
Pawtimation is a UK-focused pet care booking platform connecting pet owners with trusted friends or professional Pet Companions. It offers a dual-channel model: a cost-effective "Friends" channel and a premium, vetted "Pet Companions" marketplace. The platform provides features like invite-based friend booking, AI-driven companion matching, AI-generated pet diary summaries, secure escrow payments via Stripe Connect with BNPL options, UK-specific cancellation management, GPS tracking, and comprehensive pet/companion profiles. Pawtimation aims to deliver seamless user experiences and foster reliable pet care connections, with ambitions for AI-driven objective matching in the future.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project utilizes a monorepo containing `apps/api` for the backend and `apps/web` for the frontend.

### Backend Architecture
- **Framework**: Fastify (ES modules) for high performance and schema validation.
- **Data Storage**: In-memory JavaScript objects (MVP) with a repository pattern, designed for future migration to persistent storage (e.g., Postgres/Drizzle).
- **Modularity**: Modular route files.

### Frontend Architecture
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with a consistent teal/emerald/cyan color palette and custom CSS variables for design tokens.
- **Visual Design**: Personal dog photos (Hector) are integrated creatively across landing, dashboards, and community sections for branding.
- **State Management**: React hooks.
- **Component Structure**: Organized into screen-level and reusable components, with a focus on shared UI primitives (e.g., `BackButton`, `PageHeader`, `Page Layout Wrapper`).
- **Routing**: React Router with a clean, minimal top navigation (Home • Community • Account) and role-based dashboards (`/owner`, `/companion`).
- **Authentication**: AuthGuard protects routes, redirecting unauthenticated users to sign-in with `returnTo` parameters.
- **Dashboard System**: Role-specific dashboards for Owners and Companions, and a role selection screen for users with dual access.
- **Companion Onboarding**: A 5-step checklist (Photo, Bio, Services, Availability, Verification) guides companions, including a quick-add calendar and AI-matched opportunities.
- **Account Hub**: Accordion-based account management with deep linking, role-aware UI, centralized plan management, and consolidated user preferences.
- **Customer Engagement**: Features include a floating chat widget for support, push notifications, public companion profiles, and a Community Hub with posts, reactions, and tips (all stored in localStorage).
- **Booking Flow**: A guided multi-step booking system with a ranking algorithm for companion recommendations based on various factors.
- **Image Uploads**: In-memory storage for various profile and pet images.
- **Admin Dashboard**: Role-gated admin panel with user masquerade functionality, support queue, verification review, and platform metrics. Admin access is granted to specific email domains.

### Payment Architecture
- **Stripe Integration**: Stripe Connect facilitates marketplace payments, handling transactions and platform commissions.
- **Escrow Model**: Payments are held until service completion for trust and security.

### AI Integration
- **Daily Diary**: AI-generated summaries of pet care updates.
- **Support Chatbot (PawBot)**: AI-powered support assistant with rule-based responses and escalation to human support.

### Agent System
- **Background Jobs**: Timer-based agents for automated tasks like daily digests and reward notifications.

### Reward System
- Tracks completed bookings and revenue, issuing thank-you packages at milestones.

### Subscription Tiers & Plan Gating
- **Owner Plans**: FREE, PLUS, PREMIUM tiers unlock progressive features.
- **Feature Gating**: Backend middleware enforces plan requirements, and frontend components display upgrade prompts.

### Duty of Care & Legal Protection
- **Incident Reporting**: Evidence-based reporting with automatic suspension for violations.
- **Legal Framework**: Incorporates UK Animal Welfare Act 2006 and Consumer Rights Act 2015.

### UK-Specific Features
- **Cancellation Policy**: Tiered forfeit system.
- **Legal Documents**: Modular system for Owner Terms of Service, Privacy Policy, and Sitter-specific agreements.

## External Dependencies
### Core Dependencies
- **Backend**: `fastify`, `@fastify/cors`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`.
- **Frontend**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`.

### Third-Party Services
- **Stripe**: Payment processing, escrow, and Stripe Connect.
- **Resend**: Transactional email service (optional).
- **Klarna and Affirm**: BNPL options via Stripe integration.

### Environment Configuration
- `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`.