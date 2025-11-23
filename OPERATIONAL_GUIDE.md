# 🔧 Pawtimation CRM - Operational Guide

**Last Updated:** November 23, 2025  
**Version:** 1.0.0

---

## 📁 1. Current Stack Configuration

### Project Structure (Monorepo)

```
Pawtimation/
├── apps/
│   ├── api/              # Backend (Fastify + Node.js)
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints (14 modules)
│   │   │   ├── services/ # Business logic (PDF, geocoding, routes)
│   │   │   ├── lib/      # Auth helpers, socket events
│   │   │   ├── middleware/ # Security, permissions, logging
│   │   │   ├── utils/    # Encryption, backups, GDPR, validation
│   │   │   ├── stripe/   # Stripe integration
│   │   │   ├── agents/   # Automation engine
│   │   │   ├── db.js     # Drizzle ORM connection
│   │   │   ├── storage.js # Database operations layer
│   │   │   ├── repo.js   # Repository pattern (1,702 lines)
│   │   │   └── index.js  # Server entry point
│   │   └── package.json
│   │
│   └── web/              # Frontend (React + Vite + Tailwind)
│       ├── src/
│       │   ├── screens/  # All pages (admin, staff, client)
│       │   ├── components/ # Reusable UI components
│       │   ├── contexts/ # React contexts (Business, DataRefresh)
│       │   ├── lib/      # API wrappers, utilities
│       │   ├── hooks/    # Custom React hooks
│       │   ├── ui/       # Design system (tokens, atoms)
│       │   └── styles/   # Global CSS
│       └── package.json
│
├── shared/
│   └── schema.js         # Drizzle ORM schema (20+ tables)
│
├── drizzle.config.js     # Database migration config
├── package.json          # Root dependencies
├── start.sh             # Development/production startup script
└── .replit              # Replit configuration
```

**Key Characteristics:**
- **Monorepo**: Shared dependencies at root + app-specific packages
- **ES Modules**: `"type": "module"` in package.json (use `import/export`)
- **Full-Stack**: Backend serves API + static frontend in production

---

### Deployment Architecture

#### **Development Mode** (`.replit.dev` domain)
```bash
# When REPL_DEPLOYMENT != 1
# Runs TWO servers in parallel:

Process 1: API Server
  - Location: apps/api
  - Command: node src/index.js
  - Port: 8787 (internal)
  - Serves: REST API + WebSocket

Process 2: Vite Dev Server
  - Location: apps/web
  - Command: npm run dev --host 0.0.0.0 --port 5000
  - Port: 5000 (public)
  - Serves: Hot-reloaded React app
  - Features: HMR, source maps, fast refresh
```

**Development URLs:**
- Frontend: `https://[repl-id].replit.dev` (port 5000)
- API: `https://[repl-id].replit.dev:3000` (port 8787)

#### **Production Mode** (Deployment)
```bash
# When REPL_DEPLOYMENT = 1
# Runs ONE server only:

API Server (with static frontend)
  - Location: apps/api
  - Command: node src/index.js
  - Port: 8787
  - Serves: 
    1. REST API endpoints (/api/*)
    2. Static built frontend (apps/web/dist)
    3. SPA fallback (serves index.html for all non-API routes)
```

**Production URLs:**
- Primary: `https://[app-name].replit.app`
- Custom Domains:
  - https://pawtimation.co.uk
  - https://www.pawtimation.co.uk
  - https://app.pawtimation.co.uk

#### Replit Deployment Configuration (`.replit`)

```toml
[deployment]
run = ["node", "apps/api/src/index.js"]
deploymentTarget = "autoscale"
ignorePorts = false
build = ["sh", "-c", "cd apps/web && npm install && npm run build"]

[workflows.workflow.metadata]
outputType = "webview"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "bash start.sh"
waitForPort = 5000
```

**Deployment Type:** **Autoscale**
- Automatically scales based on traffic
- Spins down when inactive (free tier)
- Spins up on first request (~5s cold start)
- Best for: Stateless APIs and web apps

**Build Process:**
1. `cd apps/web && npm install` - Install frontend dependencies
2. `npm run build` - Vite builds to `apps/web/dist`
3. API server serves static files from `dist/`

---

### Environment Variables & Secrets Management

#### **Shared Environment Variables** (Visible)
Configured in `.replit` → `[userenv.shared]`

```bash
JWT_SECRET=bb390822...735a56       # JWT signing key (256-bit)
NODE_ENV=production               # Environment mode
ALLOWED_ORIGINS=https://11fad5e5...  # CORS whitelist
```

#### **Secrets** (Encrypted, Not Visible in Code)
Managed via Replit Secrets Tool (AES-256 encrypted)

**Database:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` - Individual DB credentials

**Third-Party APIs:**
- `RESEND_API_KEY` - Email service (Resend)
- `MAPTILER_API_KEY` - Map tiles (MapTiler)
- `OPENROUTESERVICE_API_KEY` - Walking route generation

**Security:**
- `SESSION_SECRET` - Session encryption key
- `ENCRYPTION_KEY` - AES encryption for sensitive data

**Replit Internal:**
- `REPLIT_DOMAINS` - List of replit.dev domains
- `REPLIT_DEV_DOMAIN` - Development URL (not available in production)
- `REPL_ID` - Unique Replit app identifier

#### **How to Manage Secrets:**

**1. Add a Secret:**
```
1. Click "Secrets" in left sidebar (🔒 icon)
2. Click "New secret"
3. Enter key (e.g., STRIPE_SECRET_KEY)
4. Enter value
5. Click "Add secret"
```

**2. Access in Code:**
```javascript
// Backend (Node.js)
const apiKey = process.env.RESEND_API_KEY;

// Frontend (Vite - only VITE_ prefix exposed)
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**3. Different Environments:**
```
Development: Secrets from Workspace
Production: Secrets from Deployment Settings
  - Automatically synced from workspace
  - Can override individual values
```

**⚠️ Security Best Practices:**
- Never commit secrets to `.replit` file
- Never log secrets (log sanitizer catches this)
- Use `VITE_` prefix for frontend-only secrets
- Rotate secrets regularly

---

## 🛠️ 2. Operational Tooling

### CI/CD & Deployment Workflow

#### **Current Setup: Manual Deployment**

Pawtimation uses **Replit's built-in deployment** with manual publish:

1. **Develop in Workspace** (Continuous)
   - Edit code in Replit editor
   - Changes auto-save
   - Dev server hot-reloads (`npm run dev`)
   - Test on `.replit.dev` URL

2. **Publish to Production** (Manual)
   ```
   Click "Publish" button in top-right
   → Select existing deployment
   → Deployment builds and deploys
   → Live on .replit.app + custom domains
   ```

3. **Build Process** (Automatic on Publish)
   ```bash
   # Defined in .replit [deployment] section
   
   # 1. Build frontend
   cd apps/web && npm install && npm run build
   
   # 2. Start production server
   node apps/api/src/index.js
   ```

#### **Development Workflow:**

```bash
# Local development (Replit workspace)
bash start.sh
  → Starts API server (port 8787)
  → Starts Vite dev server (port 5000)
  → Hot reload enabled

# Frontend builds
cd apps/web
npm run build          # Production build → dist/
npm run dev           # Dev server with HMR

# Root commands
npm run build         # Build both API and web
npm run db:push       # Push schema changes to database
npm run db:studio     # Open Drizzle Studio (DB GUI)
```

#### **Deployment Checklist:**

**Before Publishing:**
- ✅ Test all features in development
- ✅ Check logs for errors (`refresh_all_logs`)
- ✅ Verify environment variables are set
- ✅ Run database migrations (`npm run db:push`)
- ✅ Check frontend build succeeds (`npm run build`)

**After Publishing:**
- ✅ Test production URL works
- ✅ Check custom domains resolve
- ✅ Verify database connection (Neon may suspend)
- ✅ Monitor for errors in deployment logs

---

### Database Migrations

#### **Migration Strategy: Push-Based (Drizzle)**

Pawtimation uses **Drizzle Kit Push** instead of traditional migrations:

**Why Push?**
- No manual SQL migration files
- Schema is source of truth
- Instant synchronization
- Perfect for rapid development

**How It Works:**
```
1. Edit schema.js (add/modify tables)
2. Run: npm run db:push
3. Drizzle compares schema → database
4. Generates + executes SQL automatically
5. Database updated ✅
```

#### **Migration Workflow:**

**1. Schema Changes:**
```javascript
// shared/schema.js
export const newTable = pgTable('new_table', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
```

**2. Push to Database:**
```bash
npm run db:push

# Output:
# Introspecting database...
# Comparing schema...
# Changes detected:
#   - CREATE TABLE new_table
# Apply changes? [y/N]: y
# ✅ Applied successfully
```

**3. If Data Loss Warning:**
```bash
npm run db:push --force

# Use with caution! This bypasses safety checks
# Only use when you're certain changes are safe
```

#### **Database Management Commands:**

```bash
# View database GUI (Drizzle Studio)
npm run db:studio
# Opens: https://local.drizzle.studio

# Check current schema (without applying)
npm run db:push --dry-run

# Generate SQL migrations (advanced)
drizzle-kit generate:pg
```

#### **Configuration:**

```javascript
// drizzle.config.js
module.exports = {
  schema: './shared/schema.js',    // Schema definition
  out: './drizzle',                // Migration files (not used with push)
  dialect: 'postgresql',           // Database type
  dbCredentials: {
    url: process.env.DATABASE_URL  // Neon connection string
  }
};
```

**⚠️ Important Notes:**
- **Never change primary key types** (serial ↔ varchar) - causes data loss
- **Backup before destructive changes** (automated backups run monthly)
- **Neon free tier** may suspend endpoint after inactivity (restart server to reconnect)

---

### Logs, Backups, and Monitoring

#### **Logging Strategy**

**Current State:**
- ✅ Console logging (541 statements across codebase)
- ✅ Log sanitization (PII redaction enabled)
- ❌ No structured logging library (Winston, Pino)
- ❌ No external log aggregation (Logtail, Papertrail)

**Log Types:**
```javascript
// Security events
console.log('[SECURITY_ALERT] 5 failed login attempts from IP 1.2.3.4');

// System operations
console.log('[BACKUP] ✅ Backup completed: 12.5 MB');

// API requests (sanitized)
console.log('[API] POST /api/bookings/create - 201 Created');

// Errors (sanitized)
console.error('[Email] Failed to send:', error.message);
```

**Access Logs:**
```bash
# Development (Replit workspace)
- View in Console pane
- Auto-scrolls with new entries
- Saved to /tmp/logs/ (ephemeral)

# Production (Deployment)
- Click deployment → "Logs" tab
- Real-time stream
- Search/filter capabilities
- Not persisted long-term
```

#### **Automated Database Backups**

**Configuration:**
```javascript
// apps/api/src/utils/databaseBackup.js

Schedule: MONTHLY (switches to WEEKLY on Jan 1, 2026)
Location: Replit Object Storage (db-backups/)
Format: PostgreSQL dump (.sql)
Retention: 12 most recent backups
Process: pg_dump → Object Storage upload → integrity verification
```

**Backup Process:**
1. **Export** - `pg_dump` creates SQL dump
2. **Upload** - Saved to Object Storage with metadata
3. **Verify** - File size and existence confirmed
4. **Cleanup** - Deletes backups beyond retention limit (keeps 12)

**Backup Files:**
```
db-backups/pawtimation-backup-2025-11-23T10-30-00-000Z.sql
db-backups/pawtimation-backup-2025-10-23T10-30-00-000Z.sql
...
(12 total files)
```

**Manual Backup:**
```javascript
// Trigger backup via API (Super Admin only)
POST /api/owner/backup

// Or via code:
import { DatabaseBackup } from './utils/databaseBackup.js';
const backup = new DatabaseBackup();
await backup.createBackup();
```

**Restore Process:**
```bash
# 1. Download backup from Object Storage
# 2. Restore to database
psql $DATABASE_URL < pawtimation-backup-2025-11-23.sql

# Note: Automated restore not yet implemented
```

#### **Monitoring**

**Current State:**
- ❌ **No error monitoring** (Sentry, Bugsnag, etc.)
- ❌ **No APM** (Application Performance Monitoring)
- ❌ **No uptime monitoring** (Pingdom, UptimeRobot)
- ✅ **Basic health check** endpoint (`/health`)
- ✅ **Security monitoring** (failed login tracking, rate limits)

**Available Endpoints:**
```javascript
// Health check
GET /health
Response: { ok: true, ts: "2025-11-23T10:30:00.000Z" }

// For monitoring services to ping
```

**Security Monitoring:**
```javascript
// Failed login tracking
Threshold: 5 attempts / 15 minutes
Action: Log alert to console + database
Location: apps/api/src/utils/securityMonitoring.js

// Suspicious file access
Threshold: 50 downloads / 5 minutes
Action: Log alert

// Payment failures
Threshold: 3 failures / 24 hours
Action: Log alert
```

**Recommendations:**
1. Add Sentry for error tracking
2. Add uptime monitoring service
3. Replace console.log with structured logging (Pino)
4. Set up log aggregation (Logtail)
5. Add performance monitoring (New Relic)

---

## 🎨 3. Branding & Design System

### Color Palette

#### **Primary Brand Colors** (Official)

```css
/* CSS Variables (apps/web/src/ui/tokens.css) */
:root {
  --brand: #3F9C9B;        /* Primary teal */
  --brandDark: #006666;    /* Dark teal (hover states) */
  --brandSoft: #A8E6CF;    /* Light mint (subtle highlights) */
}
```

**Hex Codes:**
- **Primary Teal:** `#3F9C9B` - Main brand color, buttons, links, accents
- **Dark Teal:** `#006666` - Hover states, active buttons, emphasis
- **Soft Mint:** `#A8E6CF` - Background tints, ghost button hover

**Usage Examples:**
```jsx
// Primary button
<button className="bg-teal-600 hover:bg-teal-700">Save</button>

// Brand-colored text
<span style={{ color: 'var(--brand)' }}>Pawtimation</span>

// Gradient header
<div className="bg-gradient-to-r from-teal-600 to-emerald-600">
```

#### **Extended Palette**

```css
/* CSS Variables */
:root {
  --graphite: #2A2D34;     /* Dark text, headers */
  --cloud: #F5F7FA;        /* Light backgrounds */
  --mint: #A8E6CF;         /* Same as brandSoft */
  --error: #E63946;        /* Error states, destructive actions */
  --success: #4CAF50;      /* Success states, confirmations */
  --slate: #1C1E21;        /* Body text */
}
```

**Purpose:**
- **Graphite** (`#2A2D34`) - Dark text, headings, important labels
- **Cloud** (`#F5F7FA`) - Page backgrounds, card backgrounds
- **Mint** (`#A8E6CF`) - Subtle highlights, success tints
- **Error** (`#E63946`) - Error messages, delete buttons, alerts
- **Success** (`#4CAF50`) - Success messages, completed states
- **Slate** (`#1C1E21`) - Body text, standard content

#### **Tailwind Configuration**

```javascript
// apps/web/tailwind.config.cjs
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#3F9C9B',      // Primary
          graphite: '#2A2D34',  // Dark text
          cloud: '#F5F7FA',     // Light bg
          mint: '#A8E6CF',      // Soft accent
          error: '#E63946',     // Error
          success: '#4CAF50',   // Success
          slate: '#1C1E21'      // Body text
        }
      }
    }
  }
}
```

**Usage in Components:**
```jsx
<div className="bg-brand-cloud text-brand-graphite">
  <button className="bg-brand-teal hover:bg-brand-teal/90">
    Click me
  </button>
</div>
```

---

### Tailwind Color Classes (Most Common)

#### **Background Colors:**
```css
bg-white           /* Pure white (#FFFFFF) */
bg-slate-50        /* Very light gray (#F8FAFC) */
bg-slate-100       /* Light gray (#F1F5F9) */
bg-teal-50         /* Very light teal (#F0FDFA) */
bg-teal-600        /* Primary brand (#0D9488) */
bg-teal-700        /* Dark teal hover (#0F766E) */
bg-emerald-600     /* Emerald accent (#059669) */
bg-green-50        /* Light success bg (#F0FDF4) */
bg-red-50          /* Light error bg (#FEF2F2) */
bg-yellow-50       /* Light warning bg (#FEFCE8) */
```

#### **Text Colors:**
```css
text-slate-600     /* Medium gray text (#475569) */
text-slate-700     /* Dark gray text (#334155) */
text-slate-900     /* Near-black text (#0F172A) */
text-teal-600      /* Brand teal text (#0D9488) */
text-teal-700      /* Dark teal text (#0F766E) */
text-white         /* White text (#FFFFFF) */
text-emerald-600   /* Success text (#059669) */
text-red-600       /* Error text (#DC2626) */
text-yellow-600    /* Warning text (#CA8A04) */
```

#### **Border Colors:**
```css
border-slate-200   /* Light gray border (#E2E8F0) */
border-slate-300   /* Medium gray border (#CBD5E1) */
border-teal-200    /* Light teal border (#99F6E4) */
border-teal-600    /* Primary brand border (#0D9488) */
```

---

### Status Colors (Booking System)

```javascript
// Color-coded booking statuses
const statusColors = {
  PENDING: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800'
  },
  BOOKED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800'
  },
  COMPLETED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800'
  },
  CANCELLED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800'
  }
};
```

**Visual Examples:**
- **PENDING** - Yellow (waiting for approval)
- **BOOKED** - Blue (confirmed appointment)
- **COMPLETED** - Green (finished successfully)
- **CANCELLED** - Red (cancelled/rejected)

---

### Button Styles

#### **Primary Button** (Brand Teal)
```css
/* Class: .btn-primary */
background: #0d9488;          /* teal-600 */
hover: #0f766e;              /* teal-700 */
active: #115e59;             /* teal-800 */
text: white;
font-weight: 600 (semibold);
border-radius: 12px (rounded-xl);
padding: 0 24px;
height: 40px;
```

**JSX Example:**
```jsx
<button className="btn-primary">Save Changes</button>
<button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 py-3">
  Book Now
</button>
```

#### **Secondary Button** (White/Gray)
```css
/* Class: .btn-secondary */
background: white;
border: 1px solid #cbd5e1;   /* slate-300 */
hover: #f9fafb;              /* gray-50 */
text: #0f172a;               /* slate-900 */
font-weight: 500 (medium);
```

**JSX Example:**
```jsx
<button className="btn-secondary">Cancel</button>
<button className="bg-white border border-slate-300 hover:bg-slate-50 rounded-xl px-6 py-3">
  Back
</button>
```

#### **Ghost Button** (Transparent)
```css
/* Class: .btn-ghost */
background: transparent;
hover: var(--brandSoft);     /* #A8E6CF */
text: var(--brand);          /* #3F9C9B */
font-weight: 600 (semibold);
```

**JSX Example:**
```jsx
<button className="btn-ghost">Learn More</button>
```

---

### Typography

#### **Font Family**
```css
/* Default: System font stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

#### **Text Styles**
```css
/* Headings */
.text-h1 { font-size: 2.25rem; font-weight: 700; }  /* 36px, bold */
.text-h2 { font-size: 1.875rem; font-weight: 700; } /* 30px, bold */
.text-h3 { font-size: 1.5rem; font-weight: 700; }   /* 24px, bold */
.text-h4 { font-size: 1.25rem; font-weight: 600; }  /* 20px, semibold */

/* Body */
.text-base { font-size: 1rem; }                     /* 16px (default) */
.text-sm { font-size: 0.875rem; }                   /* 14px */
.text-xs { font-size: 0.75rem; }                    /* 12px */
```

**Usage:**
```jsx
<h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
<p className="text-base text-slate-600">Welcome back!</p>
<span className="text-sm text-slate-500">Last updated 5 mins ago</span>
```

---

### Spacing & Layout

#### **Border Radius**
```css
rounded-lg  { border-radius: 14px; }   /* Cards, inputs */
rounded-xl  { border-radius: 18px; }   /* Buttons, modals */
rounded-2xl { border-radius: 24px; }   /* Large containers */
rounded-full { border-radius: 9999px; } /* Circles, pills */
```

#### **Shadows**
```css
shadow-sm   /* Subtle card shadow */
shadow      /* Standard card shadow */
shadow-md   /* Elevated elements */
shadow-lg   /* Modals, dropdowns */
shadow-xl   /* Overlays */
```

**Custom Shadow:**
```css
/* Design tokens */
--sh-card: 0 1px 2px rgba(0, 0, 0, 0.06), 0 6px 12px rgba(0, 0, 0, 0.04);
```

#### **Spacing Scale**
```css
gap-2  /* 8px */
gap-3  /* 12px */
gap-4  /* 16px (most common) */
gap-6  /* 24px */
gap-8  /* 32px */

p-4    /* padding: 16px */
px-6   /* padding-left/right: 24px */
py-3   /* padding-top/bottom: 12px */
```

---

### Dynamic Business Branding

Businesses can customize their branding, which overrides default colors:

```javascript
// Backend: apps/api/src/repo.js
const defaultBranding = {
  primaryColor: '#00a58a',    // Fallback if not set
  showPoweredBy: true         // "Powered by Pawtimation" footer
};

// Usage in PDFs, emails, client portals:
const primaryColor = business.settings?.branding?.primaryColor || '#3F9C9B';
```

**Examples of Dynamic Branding:**
- **Invoice PDFs** - Use business primary color for header/footer
- **Client Portal** - Navigation uses business color
- **Email Templates** - Header gradient uses business colors
- **Booking Confirmations** - Brand-colored buttons

---

### Admin-Specific Colors

```css
/* Admin Ribbon (top banner when masquerading) */
background: linear-gradient(to right, #9333ea, #7e22ce);  /* purple-600 to purple-700 */
text: white;

/* Admin navigation active state */
background: #3F9C9B;  /* brand teal */
text: white;
```

---

### Mobile-First Design Patterns

#### **Mobile Card**
```jsx
<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
  <h3 className="text-lg font-bold text-slate-900">Card Title</h3>
  <p className="text-sm text-slate-600">Card content</p>
</div>
```

#### **Mobile Page Header**
```jsx
<div className="bg-gradient-to-r from-emerald-700/65 to-teal-600/45 p-6 text-white">
  <h1 className="text-2xl font-semibold">Page Title</h1>
  <p className="text-white/90">Subtitle</p>
</div>
```

#### **Mobile Navigation Bar**
```jsx
<div className="border-t bg-white h-14 flex">
  <button className="flex-1 flex items-center justify-center text-teal-600">
    <svg>...</svg>
  </button>
  <button className="flex-1 flex items-center justify-center text-slate-600">
    <svg>...</svg>
  </button>
</div>
```

---

### Gradients

```css
/* Header backgrounds */
bg-gradient-to-r from-emerald-600 to-teal-600    /* Primary gradient */
bg-gradient-to-r from-emerald-700 to-teal-600    /* Darker variant */
bg-gradient-to-br from-slate-50 to-slate-100     /* Subtle gray */

/* Email headers */
linear-gradient(135deg, #3F9C9B, #66B2B2)        /* Teal gradient */
```

---

## 📝 Quick Reference

### Common Tasks

**Start Development:**
```bash
bash start.sh
# Opens: https://[repl-id].replit.dev
```

**Deploy to Production:**
```
1. Click "Publish" button
2. Select deployment
3. Wait for build (~1-2 min)
4. Visit .replit.app URL
```

**Database Migration:**
```bash
npm run db:push           # Push schema changes
npm run db:push --force   # Force push (skip warnings)
npm run db:studio         # Open database GUI
```

**Add Environment Variable:**
```
1. Click "Secrets" (🔒)
2. Add key + value
3. Restart server
```

**View Logs:**
```
Development: Console pane
Production: Deployment → Logs tab
```

**Backup Database:**
```
Automatic: Monthly (switches to weekly Jan 1, 2026)
Manual: POST /api/owner/backup (Super Admin only)
```

---

## 🔗 Important Links

**Development:**
- Workspace: `https://replit.com/@[username]/[repl-name]`
- Dev URL: `https://[repl-id].replit.dev`

**Production:**
- Deployment: `https://[app-name].replit.app`
- Custom Domain: `https://pawtimation.co.uk`

**Databases:**
- Neon Dashboard: `https://console.neon.tech`
- Drizzle Studio: `npm run db:studio` → `https://local.drizzle.studio`

**Documentation:**
- Replit Docs: `https://docs.replit.com`
- Drizzle Docs: `https://orm.drizzle.team`
- Tailwind Docs: `https://tailwindcss.com`

---

**Last Updated:** November 23, 2025  
**Maintained By:** Development Team  
**Next Review:** December 23, 2025
