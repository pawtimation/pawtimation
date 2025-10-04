# Pawtimation

## Overview

Pawtimation is a UK-focused pet care booking platform that connects pet owners with trusted friends or professional sitters. The platform operates on a dual-channel model: a cost-effective "Friends" channel (£15/day) and a premium "Professional Sitters" channel with insurance and vetting. Key features include invite-based friend booking, sitter browsing, daily photo updates with AI-generated diary summaries, escrow payments via Stripe Connect, cancellation management with UK-specific policies, and key handover coordination.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- Screen-level components (App, FriendsInvite, BookingFeed, BrowseSitters, TrustCard, CancelBooking)
- Reusable components (Header, Footer, AccessPlan)

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