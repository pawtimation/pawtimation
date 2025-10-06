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
- **Styling**: Tailwind CSS for a utility-first UI approach. Consistent teal/emerald/cyan color palette throughout.
- **Visual Design**: Personal dog photos (Hector) used innovatively across the platform:
  - Landing page hero: Hector with ball as background overlay (40% opacity)
  - "Why Pawtimation?" section: User's dog photo showcasing happy pet care
  - Owner dashboard: Hector photo #2 as welcoming background (20% opacity, emerald gradient)
  - Companion dashboard: Hector photo #3 as background (20% opacity, teal/cyan gradient)
  - Community chat: Hector photo #4 as header background (15% opacity, blue gradient with backdrop blur buttons)
- **State Management**: React hooks, with potential for Context/Redux as needs evolve.
- **Component Structure**: Organized into screen-level and reusable components.
- **Routing**: React Router with URL-based navigation. Clean, minimal top navigation (Home • Community • Account).
- **Navigation System**: Minimal top nav with role-based dashboards. Header shows [Home] [Community] [Account] only (Account visible when signed in). Landing page presents two role cards (Pet Owner / Pet Companion) with Sign in/Create account buttons when unauthenticated, or "Open my dashboard" when authenticated.
- **Authentication Flow**: After sign-in/sign-up, users are redirected to their intended destination (via returnTo parameter) or dashboard chooser. AuthGuard component protects dashboard routes and redirects unauthenticated users to /auth/signin?returnTo=<path>.
- **Dashboard System**: 
  - `/owner` - Owner dashboard with Auto-book Companion, Manage Pets, My Circle, Community Chat
  - `/companion` - Companion dashboard with Profile Checklist, Opportunities, Messages, Calendar, Edit Profile, Preview Page, Services & Pricing
  - `/dashboard/choose` - Role selection screen for users who can access both dashboards
- **Route Protection**: AuthGuard initializes from localStorage and redirects to sign-in with returnTo parameter for protected routes. After authentication, users return to their intended destination.
- **Companion Onboarding**: 
  - Role-based signup captures mobile and location for companions
  - Companions redirected to checklist after registration
  - 5-step checklist: Photo, Bio (80+ chars), Services, Availability (3+ slots), Verification
  - CompanionCalendar with quick-add weekend slots (auto-populates 4 upcoming weekend days)
  - CompanionOpportunities shows AI-matched booking requests (demo mode with sample data)
  - CompanionMessages provides DM interface for owner communication
  - Backend API endpoints: `/companion/checklist`, `/companion/availability`, `/companion/opportunities`

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
- **Chat Widget**: Floating paw icon for customer service access with "❤️ Yes" and "✗ No" feedback buttons.
- **Push Notifications**: NotificationCenter component for alerts and emoji reactions.
- **Payment Installments**: Klarna and Affirm integration via Stripe for BNPL options.
- **My Circle**: Owner-specific friend management with invite capabilities and direct messaging.
- **Community Chat**: Real-time chat via Socket.IO for public rooms, random private chats, and direct messages.
- **Community Events**: UK locality-based meetups with RSVP functionality and live attendance counters. Event creation is plan-gated.
- **Image Uploads**: In-memory storage for profile pictures, pet photos, and banners (PNG/JPEG up to 10MB).

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

### Admin Dashboard
- **Access Control**: AdminGuard protects all /admin/* routes; only users with isAdmin role can access. Users with @aj-beattie.com emails automatically receive admin privileges upon registration.
- **Masquerade System**: Admins can act as any user (Owner or Companion) for support and debugging. Masquerade state persists in localStorage ('pt_masquerade') and displays AdminRibbon at the top with exit functionality.
- **Admin Screens**:
  - `/admin` - Dashboard home with navigation cards (Masquerade, Support Queue, Verification Queue, Metrics)
  - `/admin/masquerade` - Search users by email/ID and act as them
  - `/admin/support` - View escalated support conversations with chat transcripts
  - `/admin/verification` - Review and approve Pro companion applications (placeholder)
  - `/admin/metrics` - Platform health dashboard (bookings, support CSAT, system status)
- **Backend Endpoints**: `/api/admin/search-users`, `/api/admin/support-escalations`, `/api/admin/metrics` protected by requireAdmin middleware
- **Dev Tools**: POST `/api/auth/dev/make-admin` for testing (converts current user to admin)

## External Dependencies
### Core Dependencies
- **Backend**: `fastify`, `@fastify/cors`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io`.
- **Frontend**: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client`.

### Third-Party Services
- **Stripe**: Payment processing, escrow, and Stripe Connect for marketplace functionality.
- **Resend**: Optional transactional email service.

### Environment Configuration
- `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`.