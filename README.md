# Pawtimation

UK-focused pet care booking platform connecting pet owners with trusted friends or professional Pet Companions.

## Quick Links

- **Landing Page**: [/](/)
- **Browse Companions** (Free): [/browse](/browse)
- **Account Settings**: [/account](/account)
  - Billing & Subscription: [/account#billing](/account#billing)
  - Security Settings: [/account#security](/account#security)
  - Preferences: [/account#preferences](/account#preferences)
- **Demo Companion Profile**: [/c/demo](/c/demo)
- **Health Check**: [/health.txt](/health.txt)
- **Legal Pages**:
  - [Terms of Service](/legal/terms)
  - [Privacy Policy](/legal/privacy)
  - [Cookie Policy](/legal/cookies)

## Development

### Toggle Subscription Plans

```javascript
// Switch between plans in browser console or localStorage
localStorage.setItem('pt_plan', 'free')    // Free tier
localStorage.setItem('pt_plan', 'plus')    // Plus tier
localStorage.setItem('pt_plan', 'premium') // Premium tier
```

### Admin Access

Users with `@aj-beattie.com` email automatically receive admin privileges.

## Key Features

- **Dual Channel**: Friends/family bookings + professional marketplace
- **AI Matching**: Smart companion recommendations (Plus/Premium)
- **Plan Gating**: FREE, PLUS, PREMIUM tiers with progressive features
- **Browse Companions**: Free manual search by location, services, tier
- **Reviews**: Stub review system on public profiles
- **Legal**: Terms, Privacy, Cookies with env-guarded cookie banner
- **Admin Tools**: Masquerade, support queue, metrics, demo data reset

## Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend**: Fastify (apps/api)
- **Payments**: Stripe Connect with escrow
- **Storage**: In-memory (MVP) with repository pattern

## Getting Started

1. Install dependencies: `npm install`
2. Run backend: `cd apps/api && npm start`
3. Run frontend: `cd apps/web && npm run dev`
4. Visit: http://localhost:5000

## Environment Variables

```
# Optional Analytics (triggers cookie banner)
VITE_POSTHOG_KEY=your_key

# Optional Cookie Banner (without analytics)
VITE_COOKIE_BANNER=1

# SEO Control
VITE_NOINDEX=1  # Adds noindex in dev/staging
```

## License

Proprietary - All rights reserved
