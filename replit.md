# Pawtimation

## Overview

Pawtimation is a UK-focused pet care booking platform connecting pet owners with trusted friends or professional Pet Companions. It features a dual-channel model: a cost-effective "Friends" channel and a premium "Pet Companions" marketplace with insurance and vetting. Key capabilities include invite-based friend booking, AI-driven companion browsing and recommendations, daily photo updates with AI-generated diary summaries, escrow payments via Stripe Connect with BNPL options (Klarna/Affirm), UK-specific cancellation management, key handover coordination, GPS-based arrival/departure tracking, push notifications, emoji reactions, and a customer service chat widget. The platform aims to provide seamless user journeys for both pet owners and Pet Companions, with a vision for AI-driven objective matching to ensure fair and unbiased connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project utilizes a monorepo with `apps/api` for the backend and `apps/web` for the frontend.

### Backend Architecture (Fastify)
- **Framework**: Fastify (ES modules) chosen for its lightweight, high-performance nature, and built-in schema validation.
- **Data Storage**: In-memory JavaScript objects (MVP) with a repository pattern abstraction for rapid prototyping and future migration to persistent storage (e.g., Postgres/Drizzle).
- **Route Organization**: Modular route files for various functionalities like access, agreements, cancellations, Stripe integration, arrival tracking, owner/sitter management, and the Pawtimate booking flow.

### Frontend Architecture (React + Vite)
- **Build Tool**: Vite for fast development and Hot Module Replacement (HMR).
- **Styling**: Tailwind CSS for a utility-first approach, enabling rapid and consistent UI development.
- **State Management**: React hooks for component-level state, with plans for Context/Redux if global state needs evolve.
- **Component Structure**: Organized into screen-level and reusable components.

### Payment Architecture
- **Stripe Integration**: Stripe Connect facilitates marketplace payments, handling transactions between owners and sitters with platform commission and compliance.
- **Escrow Model**: Payment intents are held until service completion, providing trust and safety for both parties.

### AI Integration
- **Daily Diary**: Currently a stubbed function for AI-generated summaries of pet care updates, designed for future integration with services like OpenAI.

### Agent System
- **Background Jobs**: Uses simple timer-based agents with feature flags for automated tasks like daily digests and reward notifications. This is an MVP solution, with plans for production-grade job queues like BullMQ/Inngest.

### Reward System
- Tracks completed bookings and revenue for both owners and companions. Users reaching milestones (10+ bookings AND £500+ revenue) receive automated thank-you packages (£30 value) with API endpoints for tracking and fulfillment.

### Subscription Tiers
- **Owner Plans**: Three subscription tiers (Free, Plus £9.99/mo, Premium £19.99/mo) with progressive feature unlocks including unlimited pets, enhanced AI diary, live tracking, vet chat, priority support, behaviour insights, PawPoints rewards, automatic booking discounts, and per-booking insurance.
- **UI Integration**: Subscription plans accessible via "View Subscriptions" button in owner onboarding, with detailed comparison table, FAQs, and "Why Premium?" benefits widget.
- **Payment**: Currently UI-only; backend payment integration pending.

### Companion & Owner Profiles
- **Companion Profiles**: Rich, editable profiles with bio, city, postcode, avatar, banner, years of experience, services (day care, walking, home visits), pricing, availability calendar, cancellation policies, and verification badges (email, SMS, Stripe, Trainee/Pro status).
- **Availability Calendar**: Interactive month calendar component (`MonthCalendar.jsx`) for toggling unavailable dates. Features month navigation (← / →), visual date selection (red for unavailable), and synchronized text input for manual editing.
- **Locality Map**: Google Maps embed based on postcode or city, displaying approximate service area without revealing exact address.
- **Social Integration**: Social media links (Instagram, TikTok, X) with auto-post preferences for diary highlights (OAuth implementation pending).
- **Pet Management**: Comprehensive pet profiles for owners including species, breed, age, weight, vet information, medical details (allergies, medications), behaviour traits (recall, good with dogs, anxious), and custom notes for carers.
- **Public Companion Pages**: Beautifully formatted public-facing profiles showcasing companion services, ratings, reviews, pricing, social media presence, and postcode.
- **Demo Companion**: Pre-seeded companion "Becci" (s_demo_companion) from Beaconsfield (HP9) for testing with Pro verification, 2 years experience, 3 services, and 4.9★ rating (12 reviews).

### Customer Engagement Features
- **Chat Widget**: A floating paw icon provides access to a customer service chat panel. Positioned at bottom-20 on mobile (bottom-6 on desktop) to prevent content overlap.
- **Support Chatbot**: AI-powered support assistant with automatic escalation system. Features include rule-based bot responses for booking, pricing, policies, safety, and community queries; keyword-based escalation (complaint, emergency, lost dog, etc.); too-many-turns escalation (4+ exchanges without resolution); negative CSAT escalation; email alerts via SendGrid/webhook; paw up/down voting; admin metrics dashboard tracking total chats, bot-handled chats, escalations, and CSAT scores. Metrics are mutually exclusive (chats are either handled by bot OR escalated, never both).
- **Push Notifications**: A NotificationCenter component supports alerts for events like walk completion, photo uploads, and daily reports, including an emoji reaction system.
- **Payment Installments**: Integration with Klarna and Affirm for "Pay in 4" and flexible monthly payment plans, leveraging Stripe's BNPL capabilities.
- **My Circle**: Owner-specific friend management system with invite capabilities (copy link + mailto email), preferred friend toggles, and deterministic direct messaging. Accessed via Owner Start screen, replacing the old Friends header link.
- **Community Chat**: Real-time chat functionality with Socket.IO, supporting both a public Community room, random private chat rooms, and deterministic DMs between owners and friends (`dm_<ownerId>_<friendId>`).
- **Community Events**: UK locality-based meetups with Beaconsfield (HP9) as the default demo location. Features include event listings, RSVP functionality (events marked "Confirmed" when 5+ attendees), and a live RSVP counter badge in the top navigation showing total attendance across all events.
- **Join Invite Page**: Dedicated screen at `/join?token=...` for friends to accept invites, with auto-routing when URL contains token parameter.
- **Explore Panel**: Floating navigation panel (bottom-right corner) to quickly jump between screens, auto-opens with `?explore=1` query parameter.

### Pawtimate Booking Flow
- A smart, guided multi-step booking system that uses a ranking algorithm to recommend companions based on tier, rating, reputation, and booking history.

### Auto-Booking System
- **Smart Companion Matching**: Explainable scoring algorithm that ranks companions based on multiple factors:
  - **Locality (35%)**: Postcode and city matching using UK-specific patterns (e.g., HP9 vs HP20 outward codes)
  - **Reputation (25%)**: Rating (0-5 stars) and number of reviews
  - **Verification (15%)**: Pro status (100%), Trainee (60%), or basic (30%)
  - **Price Fit (15%)**: How well the price matches the owner's budget
  - **Recency (10%)**: Activity within last 90 days (based on lastActive or availability updates)
- **Transparent Scoring**: Full breakdown of all 5 components shown to owners for each recommended companion
- **API Endpoints**: `/bookings/auto-assign` (POST) returns ranked companions with scores; `/bookings` (POST) confirms booking
- **Owner Experience**: Three-step flow with no booking created until final confirmation:
  1. Fill booking form (owner details, service, dates, budget) → "Find a Companion"
  2. View recommendations with scoring → "View Match Details" for top pick or alternatives
  3. Review full companion profile on match page → "Continue with [name]" creates booking OR "See Other Options" to go back
- **Match Display Page** (`BookingMatched.jsx`): Beautiful companion showcase with banner, avatar, verification badges, rating stars, bio, services, pricing, and "Why This Match?" explanation. Prevents duplicate bookings by only creating booking on final confirmation.

### Duty of Care Enforcement & Legal Protection
- **Incident Reporting System**: Allows for evidence-based reporting of violations (Critical, High, Medium), with automatic suspension for critical violations to enforce duty of care and platform integrity.
- **Legal Framework**: Incorporates UK Animal Welfare Act 2006 and Consumer Rights Act 2015, with updated Terms of Service and clear platform liability disclaimers.

### Arrival/Departure Tracking
- **GPS Check-In/Check-Out**: Uses browser geolocation to record sitter arrival and departure times, providing accountability and proof of service delivery, with privacy-conscious GPS storage.

### UK-Specific Features
- **Cancellation Policy**: A tiered forfeit system based on notice period (7+ days: full refund; 3-7 days: 50% forfeit; <3 days: 100% forfeit).
- **Legal Documents**: Modular system for Owner Terms of Service, Privacy Policy, and Sitter-specific agreements.

## Important Files
- **Backend**: `apps/api/src/sitterRoutes.js` (companion profiles with postcode support), `apps/api/src/petRoutes.js` (owner pets), `apps/api/src/ownerRoutes.js` (owner circle/invites), `apps/api/src/chatRoutes.js` (real-time chat), `apps/api/src/bookingRoutes.js` (auto-booking endpoints), `apps/api/src/assigner.js` (scoring algorithm), `apps/api/src/communityRoutes.js` (community events and RSVPs), `apps/api/src/authRoutes.js` (auth with /auth/health endpoint), `apps/api/src/supportRoutes.js` (support chatbot with escalations), `apps/api/src/supportConfig.js` (support configuration and thresholds).
- **Frontend**: `apps/web/src/screens/SitterEdit.jsx` (editable companion profile with clean header, calendar and map), `apps/web/src/screens/SitterPublic.jsx` (public companion page), `apps/web/src/screens/BookingAuto.jsx` (auto-booking flow), `apps/web/src/screens/BookingMatched.jsx` (matched companion display), `apps/web/src/components/MonthCalendar.jsx` (availability calendar), `apps/web/src/screens/PetManager.jsx`, `apps/web/src/screens/OwnerCircle.jsx`, `apps/web/src/screens/Chat.jsx`, `apps/web/src/screens/JoinInvite.jsx`, `apps/web/src/screens/Community.jsx` (community events), `apps/web/src/components/Header.jsx` (top nav with Community button and RSVP badge), `apps/web/src/components/SupportChat.jsx` (support chat widget), `apps/web/src/screens/SupportMetrics.jsx` (admin metrics dashboard).

## External Dependencies

### Core Dependencies
- **Backend**: `fastify`, `@fastify/cors`, `dotenv`, `stripe`, `nanoid`, `node-fetch`, `raw-body`, `socket.io` (for real-time chat).
- **Frontend**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `socket.io-client` (for real-time chat).

### Third-Party Services
- **Stripe**: For payment processing, escrow, and Stripe Connect for sitter accounts. Requires `STRIPE_SECRET_KEY`. A 15% marketplace application fee is applied.
- **Resend**: Optional transactional email service. Requires `RESEND_API_KEY`, with console logging fallback.

### Environment Configuration
- `API_PORT`, `VITE_API_BASE`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`.

### Deployment Configuration
- **Deployment Type**: Autoscale (stateless, scales to zero when inactive)
- **Build Command**: `npm run build` (installs dependencies and builds frontend to apps/web/dist)
- **Run Command**: `node apps/api/src/index.js` (starts Fastify server with static file serving)
- **Port Configuration**: Uses PORT environment variable (set by Replit deployment) or defaults to 8787 for development
- **Static Files**: API server serves built frontend files from apps/web/dist via @fastify/static
- **Health Checks**: Root endpoint (/) serves static HTML, /health endpoint returns JSON (both return 200 status)
- **Dependencies**: All runtime dependencies consolidated in root package.json for deployment compatibility
- Replit-specific configurations include Vite accepting `.repl.co` hosts, server binding to `0.0.0.0`, and open CORS for development.