# Pawtimation

## Overview

Pawtimation is a UK-focused pet care booking platform that connects pet owners with trusted friends or professional Pet Companions. The platform operates on a dual-channel model: a cost-effective "Friends" channel (£15/day suggested) and a premium "Pet Companions" marketplace with insurance and vetting. Key features include invite-based friend booking, companion browsing with smart recommendations, daily photo updates with AI-generated diary summaries, escrow payments via Stripe Connect with BNPL options (Klarna/Affirm), cancellation management with UK-specific policies, key handover coordination, GPS-based arrival/departure tracking, push notifications for Apple Watch and devices, emoji reactions for updates, and customer service chat widget.

The platform provides two distinct user journeys via a landing page: pet owners can add their pets and book companions, while Pet Companions can create profiles, manage services, and view their bookings.

## User Preferences

Preferred communication style: Simple, everyday language.

**Feature Preferences** (noted for future implementation):
- Dashboard sliders for improved UX
- Profile pictures for pet profiles
- Visual enhancements to dashboards

## System Architecture

### Monorepo Structure
The project uses a workspace-based monorepo with two main applications:
- **apps/api** - Backend API service
- **apps/web** - Frontend React application

### Backend Architecture (Fastify)

**Framework Choice**: Fastify with ES modules
- **Rationale**: Lightweight, fast HTTP framework with built-in schema validation support
- **Alternatives**: Express (considered but Fastify chosen for performance)
- **Pros**: Type-safe routing, plugin ecosystem, excellent performance
- **Cons**: Smaller community than Express

**Data Storage**: In-memory JavaScript objects (MVP)
- **Problem**: Rapid prototyping without database setup
- **Solution**: Simple object stores in `store.js` with repository pattern abstraction
- **Rationale**: Enables quick iteration; repository pattern allows easy migration to persistent storage
- **Pros**: Zero setup, simple to understand, fast for MVP
- **Cons**: Data lost on restart, not production-ready, no scalability

**Repository Pattern**: Abstraction layer (`repo.js`)
- **Problem**: Need to separate business logic from data access
- **Solution**: Repository functions that wrap direct database access
- **Rationale**: Makes future migration to Postgres/Drizzle straightforward
- **Pros**: Clean separation of concerns, easy to test, migration-ready
- **Cons**: Additional abstraction layer

**Route Organization**: Modular route files
- Access routes (`accessRoutes.js`) - Key handover logistics
- Agreements routes (`agreementsRoutes.js`) - Legal document signing
- Cancellation routes (`cancellationRoutes.js`) - UK cancellation policy logic
- Stripe Connect routes (`stripeConnectRoutes.js`) - Payment processing
- Arrival routes (`arrivalRoutes.js`) - Check-in/check-out tracking with GPS
- Owners routes (`ownersRoutes.js`) - Pet management for owners
- Sitter routes (`sitterRoutes.js`) - Sitter profile and dashboard
- Pawtimate routes (`pawtimateRoutes.js`) - Booking flow with smart sitter recommendations

### Frontend Architecture (React + Vite)

**Build Tool**: Vite
- **Problem**: Need fast development experience with HMR
- **Solution**: Vite with React plugin
- **Pros**: Extremely fast HMR, modern ESM-based, simple configuration
- **Cons**: Relatively newer than Webpack

**Styling**: Tailwind CSS
- **Rationale**: Utility-first approach for rapid UI development with consistent design tokens
- **Pros**: No CSS file proliferation, design system in config, excellent DX
- **Cons**: Verbose className attributes

**State Management**: React hooks (useState, useEffect)
- **Problem**: Simple local state needs
- **Solution**: Component-level state with hooks
- **Rationale**: No complex global state requirements yet
- **Pros**: Simple, built-in, no additional dependencies
- **Cons**: Props drilling for deeper trees (can migrate to Context/Redux later)

**Component Structure**:
- Screen-level components (App, Landing, OwnerOnboarding, SitterDashboard, PawtimateFlow, FriendsInvite, BookingFeed, BrowseSitters, TrustCard, CancelBooking)
- Reusable components (Header, Footer, AccessPlan, CheckInCard, Paw icon)

### Payment Architecture

**Stripe Integration**: Stripe Connect for marketplace payments
- **Problem**: Platform needs to facilitate payments between owners and sitters with commission
- **Solution**: Stripe Connect with separate accounts for sitters
- **Rationale**: Standard marketplace payment solution, handles compliance
- **Pros**: Built-in compliance, seller onboarding, commission handling
- **Cons**: Complexity, requires KYC for sitters

**Escrow Model**: Payment intents held until service completion
- **Problem**: Need to protect both owners and sitters
- **Solution**: Create payment intent at booking, release after service
- **Rationale**: Industry standard for service marketplaces
- **Pros**: Trust and safety for both parties
- **Cons**: Additional complexity in refund scenarios

### AI Integration (Stub)

**Daily Diary**: AI-generated summary of pet care updates
- **Problem**: Sitters upload photos/notes; owners want cohesive narrative
- **Solution**: Currently stubbed function that formats updates into readable diary
- **Rationale**: Template-based approach for MVP, ready for OpenAI integration later
- **Pros**: Simple stub allows frontend development
- **Cons**: Not real AI yet

### Agent System

**Background Jobs**: Automated recurring tasks
- Daily digest emails
- Recruiter automation (disabled)
- Compliance checks (disabled)
- Growth tracking (disabled)

**Design**: Timer-based agents with feature flags
- **Problem**: Need scheduled background tasks
- **Solution**: Interval timers with on/off flags
- **Rationale**: Simple for MVP, no external job queue needed
- **Pros**: Zero dependencies, easy to control
- **Cons**: Not production-grade (use BullMQ/Inngest later)

### Customer Engagement Features

**Chat Widget** (October 2025):
- Floating paw icon launcher in bottom-right corner
- Opens chat panel for customer service support
- Accessible across all pages for instant help
- Implementation: `ChatWidget.jsx` component with z-index layering

**Push Notifications** (October 2025):
- NotificationCenter component for Apple Watch and device alerts
- Browser compatibility checks for graceful degradation
- MVP stub ready for production service worker registration
- Supports walk complete, photo upload, and daily report notifications
- Emoji reaction system (❤️ 👍 😊 🐾 ✨) on all feed updates
- Production requirements: Service worker registration, VAPID keys, push subscription API

**Payment Installments** (October 2025):
- Klarna "Pay in 4" interest-free installments
- Affirm flexible monthly payment plans (3-12 months)
- PaymentOptions component with clear escrow messaging
- Payment method selection flows through booking API
- MVP implementation ready for Stripe Connect BNPL integration
- Production requirements: Stripe PaymentIntent/Source configuration per method

### Pawtimate Booking Flow

**Smart Booking System**: Guided multi-step booking flow with intelligent companion matching
- **Problem**: Owners need a streamlined way to book care with the right sitter for their needs
- **Solution**: "Pawtimate" wizard that guides owners through pet selection, dates, and sitter discovery
- **Rationale**: Reduces friction in booking process while ensuring appropriate sitter matches
- **Pros**: Clear user journey, smart recommendations, supports both friend and professional paths
- **Cons**: Multi-step flow may feel lengthy for repeat bookings

**Implementation**:
- API endpoints: `/pawtimate/request`, `/pawtimate/sitters`, `/pawtimate/book`
- Ranking algorithm scores sitters by tier, rating, reputation, and booking history
- Demo sitter data with 5 varied profiles (TRAINEE, VERIFIED, PREMIUM tiers)
- Availability management endpoints (stubbed for MVP, ready for calendar integration)
- UI component (`PawtimateFlow`) with 4 steps: pet selection → dates → choice (friends/sitters) → results

**Ranking Algorithm**:
- Tier weights: PREMIUM (+100), VERIFIED (+70), TRAINEE (+40)
- Rating contribution: rating × 10
- Reputation score: up to +100
- Booking history: up to +50 based on total bookings
- Results sorted by total score descending

**Future Enhancement**:
- Real-time calendar sync (Google Calendar, Outlook)
- Availability filtering based on sitter schedules
- Machine learning for personalized recommendations

### Arrival/Departure Tracking

**GPS Check-In/Check-Out**: Location-based attendance tracking
- **Problem**: Need to verify sitter arrival and departure times
- **Solution**: Browser geolocation API with server-side GPS coordinate storage
- **Rationale**: Provides accountability and proof of service delivery
- **Pros**: Automatic timestamp recording, location verification, duration calculation
- **Cons**: Requires device GPS permission, browser geolocation support

**Implementation**:
- API endpoints: `/bookings/:id/attendance`, `/bookings/:id/checkin`, `/bookings/:id/checkout`
- GPS coordinates rounded to 3 decimal places (±100m precision) for privacy
- Automatic feed updates for CHECKIN and CHECKOUT events
- Duration calculation in minutes between arrival and departure
- UI component (`CheckInCard`) with geolocation integration

**Privacy**:
- Approximate GPS storage (±100m)
- Auto-clear after 7 days (to be implemented)
- Visible to both owner and sitter

### UK-Specific Features

**Cancellation Policy**: Tiered forfeit system based on notice period
- 7+ days: Full refund
- 3-7 days: 50% forfeit
- <3 days: 100% forfeit

**Legal Documents**: Modular agreements system
- Owner Terms of Service
- Privacy Policy
- Sitter-specific agreements tracked per user

## External Dependencies

### Core Dependencies

**Backend (API)**:
- `fastify` (^4.26.2) - HTTP server framework
- `@fastify/cors` (^8.4.1) - CORS middleware
- `dotenv` (^16.4.5) - Environment variable management
- `stripe` (^14.0.0) - Payment processing
- `nanoid` (^4.0.2) - Unique ID generation
- `node-fetch` (^3.3.2) - HTTP client for external APIs
- `raw-body` (^2.5.2) - Request body parsing

**Frontend (Web)**:
- `react` (^18.2.0) - UI framework
- `react-dom` (^18.2.0) - React DOM rendering
- `vite` (^5.4.0) - Build tool and dev server
- `@vitejs/plugin-react` (^4.2.0) - React support for Vite
- `tailwindcss` (^3.4.7) - CSS framework
- `autoprefixer` (^10.4.19) - CSS vendor prefixing
- `postcss` (^8.4.39) - CSS processing

### Third-Party Services

**Stripe**:
- Payment processing and escrow
- Stripe Connect for sitter accounts
- Requires `STRIPE_SECRET_KEY` environment variable
- Marketplace application fee: 15% (1500 basis points)

**Resend** (Email, optional):
- Transactional email service
- Requires `RESEND_API_KEY` environment variable
- Falls back to console logging if not configured

### Environment Configuration

Required environment variables:
- `API_PORT` (default: 8787) - Backend server port
- `VITE_API_BASE` - API base URL for frontend
- `STRIPE_SECRET_KEY` - Stripe API key (optional for MVP)
- `RESEND_API_KEY` - Email service key (optional)
- `ADMIN_EMAIL` - Admin email for digest notifications

### Deployment Configuration

**Replit-Specific**:
- Vite configured to accept `.repl.co` hosts
- Server binds to `0.0.0.0` for external access
- Frontend preview port: 5173
- CORS set to `*` for development (should be restricted in production)