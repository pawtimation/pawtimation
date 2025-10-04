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

### Customer Engagement Features
- **Chat Widget**: A floating paw icon provides access to a customer service chat panel.
- **Push Notifications**: A NotificationCenter component supports alerts for events like walk completion, photo uploads, and daily reports, including an emoji reaction system.
- **Payment Installments**: Integration with Klarna and Affirm for "Pay in 4" and flexible monthly payment plans, leveraging Stripe's BNPL capabilities.
- **My Circle**: Owner-specific friend management system with invite capabilities (copy link + mailto email), preferred friend toggles, and deterministic direct messaging. Accessed via Owner Start screen, replacing the old Friends header link.
- **Community Chat**: Real-time chat functionality with Socket.IO, supporting both a public Community room, random private chat rooms, and deterministic DMs between owners and friends (`dm_<ownerId>_<friendId>`).
- **Join Invite Page**: Dedicated screen at `/join?token=...` for friends to accept invites, with auto-routing when URL contains token parameter.
- **Explore Panel**: Floating navigation panel (bottom-right corner) to quickly jump between screens, auto-opens with `?explore=1` query parameter.

### Pawtimate Booking Flow
- A smart, guided multi-step booking system that uses a ranking algorithm to recommend companions based on tier, rating, reputation, and booking history.

### Duty of Care Enforcement & Legal Protection
- **Incident Reporting System**: Allows for evidence-based reporting of violations (Critical, High, Medium), with automatic suspension for critical violations to enforce duty of care and platform integrity.
- **Legal Framework**: Incorporates UK Animal Welfare Act 2006 and Consumer Rights Act 2015, with updated Terms of Service and clear platform liability disclaimers.

### Arrival/Departure Tracking
- **GPS Check-In/Check-Out**: Uses browser geolocation to record sitter arrival and departure times, providing accountability and proof of service delivery, with privacy-conscious GPS storage.

### UK-Specific Features
- **Cancellation Policy**: A tiered forfeit system based on notice period (7+ days: full refund; 3-7 days: 50% forfeit; <3 days: 100% forfeit).
- **Legal Documents**: Modular system for Owner Terms of Service, Privacy Policy, and Sitter-specific agreements.

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
- Replit-specific configurations include Vite accepting `.repl.co` hosts, server binding to `0.0.0.0`, and open CORS for development.