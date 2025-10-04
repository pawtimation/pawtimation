# Pawtimation

## Overview
Pawtimation is a UK-focused pet care booking platform connecting pet owners with trusted friends or professional Pet Companions. It offers a dual-channel model: a cost-effective "Friends" channel and a premium, vetted "Pet Companions" marketplace. Key features include invite-based friend booking, AI-driven companion matching, daily AI-generated pet diary summaries, secure escrow payments via Stripe Connect with BNPL options, UK-specific cancellation management, GPS tracking, and comprehensive pet/companion profiles. The platform aims to provide seamless user experiences and foster reliable pet care connections, with a future vision for AI-driven objective matching.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Monorepo Structure
The project uses a monorepo with `apps/api` for the backend and `apps/web` for the frontend.

### Backend Architecture
- **Framework**: Fastify (ES modules) for high performance and schema validation.
- **Data Storage**: In-memory JavaScript objects (MVP) with a repository pattern, designed for future migration to persistent storage (e.g., Postgres/Drizzle).
- **Modularity**: Modular route files for various functionalities.

### Frontend Architecture
- **Build Tool**: Vite for rapid development.
- **Styling**: Tailwind CSS for a utility-first UI approach.
- **State Management**: React hooks, with potential for Context/Redux as needs evolve.
- **Component Structure**: Organized into screen-level and reusable components.
- **Navigation System**: Clean, minimal navigation with role-based dashboards. Header shows [Home] [Community] [Account] only. Landing page presents two role cards (Pet Owner / Pet Companion) with Sign in/Create account buttons when unauthenticated, or "Open my dashboard" when authenticated.
- **Authentication Flow**: After sign-in/sign-up, users are routed to a dashboard chooser screen allowing them to select between Owner or Companion dashboard. AuthGuard component protects dashboard routes and redirects unauthenticated users to sign-in.
- **Dashboard System**: 
  - `/dashboard/owner` - Auto-book Companion, Manage Pets, My Circle, Community Chat
  - `/dashboard/companion` - Edit Profile, Preview Public Page, Services & Pricing, Availability Calendar
  - `/dashboard/choose` - Role selection screen for users who can access both dashboards
- **Route Protection**: AuthGuard initializes from localStorage and triggers redirects for protected routes, ensuring authenticated users retain access after page reload.

### Payment Architecture
- **Stripe Integration**: Stripe Connect for marketplace payments, handling transactions and platform commission.
- **Escrow Model**: Payments held until service completion for trust and safety.

### AI Integration
- **Daily Diary**: AI-generated summaries of pet care updates.
- **Support Chatbot (PawBot)**: AI-powered support assistant with rule-based responses, keyword-based escalation, and negative feedback escalation to human support.

### Agent System
- **Background Jobs**: Simple timer-based agents for automated tasks (e.g., daily digests, reward notifications), with plans for production-grade job queues.

### Reward System
- Tracks completed bookings and revenue for owners and companions, automatically issuing thank-you packages upon reaching milestones.

### Subscription Tiers & Plan Gating
- **Owner Plans**: Three tiers (FREE, PLUS, PREMIUM) offering progressive feature unlocks (e.g., unlimited pets, enhanced AI diary, live tracking, vet chat).
- **Feature Gating**: Backend API with middleware to enforce plan requirements, returning `PLAN_REQUIRED` errors for unauthorized access. Frontend `FeatureGate` component displays upgrade prompts.

### Companion & Owner Profiles
- **Companion Profiles**: Rich, editable profiles including bio, services, pricing, availability calendar, cancellation policies, and verification badges. Features interactive availability calendar and locality map (Google Maps embed).
- **Pet Management**: Comprehensive pet profiles for owners covering species, breed, age, vet info, medical details, and behavior traits.
- **New User Profiles**: Auto-created on registration and ready for customization.

### Customer Engagement Features
- **Chat Widget**: Floating paw icon for customer service access.
- **Push Notifications**: NotificationCenter component for alerts and emoji reactions.
- **Payment Installments**: Klarna and Affirm integration via Stripe for BNPL options.
- **My Circle**: Owner-specific friend management with invite capabilities and direct messaging.
- **Community Chat**: Real-time chat via Socket.IO for public rooms, random private chats, and direct messages.
- **Community Events**: UK locality-based meetups with RSVP functionality and live attendance counters. Event creation is plan-gated.
- **Explore Panel**: Floating navigation for quick screen access.

### Pawtimate Booking Flow
- A guided multi-step booking system using a ranking algorithm to recommend companions based on tier, rating, reputation, and booking history. The auto-booking system utilizes a transparent scoring algorithm (Locality, Reputation, Verification, Price Fit, Recency) to provide ranked companion recommendations.

### Duty of Care Enforcement & Legal Protection
- **Incident Reporting System**: Evidence-based reporting with automatic suspension for critical violations.
- **Legal Framework**: Incorporates UK Animal Welfare Act 2006 and Consumer Rights Act 2015, with clear platform liability disclaimers.

### Arrival/Departure Tracking
- **GPS Check-In/Check-Out**: Browser geolocation for sitter arrival and departure times, ensuring accountability.

### UK-Specific Features
- **Cancellation Policy**: Tiered forfeit system based on notice period.
- **Legal Documents**: Modular system for Owner Terms of Service, Privacy Policy, and Sitter-specific agreements.

## External Dependencies
### Core Dependencies
- **Backend**: `fastify`, `@fastify/cors`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`.
- **Frontend**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`.

### Third-Party Services
- **Stripe**: Payment processing, escrow, and Stripe Connect for marketplace functionality.
- **Resend**: Optional transactional email service.

### Environment Configuration
- `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`.