# PAWTIMATION CRM - COMPLETE SYSTEM AUDIT
**Generated:** November 23, 2025  
**Audit Scope:** Data models, workflows, events, notifications, permissions, edge cases

---

## 🟦 SECTION 1 — DATA MODELS

### 1. BOOKINGS MODEL (jobs table)

**All Fields & Types:**
- `id` (varchar, PK)
- `businessId` (varchar, FK → businesses)
- `clientId` (varchar, FK → clients)
- `serviceId` (varchar, FK → services)
- `staffId` (varchar, FK → users, **nullable**)
- `recurringJobId` (varchar, FK → recurringJobs, nullable)
- `dogIds` (jsonb array)
- `start` (timestamp)
- `end` (timestamp)
- `status` (varchar, default='PENDING')
- `priceCents` (integer, **nullable** - allows price overrides)
- `notes` (text)
- `walkRoute` (jsonb)
- `completedAt` (timestamp)
- `cancelledAt` (timestamp)
- `cancellationReason` (text)
- `createdAt` (timestamp, auto)
- `updatedAt` (timestamp, auto)

**Key Design Decisions:**
✅ **Booking prices ARE stored statically** via `priceCents` field  
✅ Defaults to service price but can be overridden by admin  
✅ Service type stored via `serviceId` (FK to services table)  
✅ Admin who created it: NOT directly tracked (could be inferred from business context)  
✅ Timestamps: created, updated, completed, cancelled all tracked

---

### 2. INVOICES MODEL

**All Fields & Types:**
- `id` (varchar, PK)
- `businessId` (varchar, FK → businesses)
- `clientId` (varchar, FK → clients)
- `jobId` (varchar, FK → jobs, **nullable** - supports multi-item invoices)
- `amountCents` (integer)
- `status` (varchar, default='DRAFT')
- `paidAt` (timestamp)
- `sentToClient` (timestamp)
- `paymentMethod` (varchar)
- `paymentUrl` (varchar)
- `stripePaymentUrl` (varchar)
- `dueDate` (timestamp)
- `invoiceNumber` (varchar)
- `notes` (text)
- `meta` (jsonb - stores additional data like item arrays)
- `lastReminderAt` (timestamp)
- `reminderCount` (integer, default=0)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Invoice Items Table (invoice_items):**
- `id` (varchar, PK)
- `invoiceId` (varchar, FK → invoices)
- `jobId` (varchar, FK → jobs, nullable)
- `businessId` (varchar)
- `clientId` (varchar)
- `description` (text)
- `quantity` (integer, default=1)
- `priceCents` (integer)
- `date` (timestamp)
- `status` (varchar, default='PENDING')
- `billedAt` (timestamp)
- `createdAt` (timestamp)

**Invoice Status Flow:**
- `DRAFT` → `PENDING` → `PAID` → (optional) `VOID` or `UNCOLLECTIBLE`

**Multi-Booking Support:**
✅ **YES** - via `invoice_items` table  
✅ An invoice can contain multiple completed jobs  
✅ Items are batched manually via `/invoices/generate` endpoint

**Payment Tracking:**
✅ Payment method stored in `paymentMethod` field  
✅ Payment timestamp in `paidAt`  
✅ Supports: cash, card, Stripe, check  
✅ "Sent" tracked via `sentToClient` timestamp

---

### 3. CLIENT MODEL

**All Fields & Types:**
- `id` (varchar, PK)
- `businessId` (varchar, FK)
- `name` (varchar)
- `email` (varchar)
- `phone` (varchar)
- `address` (jsonb - includes lat/lng for GPS)
- `notes` (text)
- `vetDetails` (text)
- `emergencyContact` (jsonb)
- `dogIds` (jsonb array)
- `passwordHash` (varchar)
- `profileComplete` (boolean, default=false)
- `onboardingStep` (integer, default=1)
- **`isActive` (boolean, default=true)**
- `deactivatedAt` (timestamp)
- `reactivationExpiresAt` (timestamp)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Active/Inactive Determination:**
✅ Explicit `isActive` boolean field  
✅ Deactivation timestamp tracked  
✅ Reactivation expiry supported

**Outstanding Balance:**
❌ **NO dedicated field** - must be calculated from unpaid invoices  
⚠️ Dashboard calculates this on-demand via invoice queries

---

### 4. STAFF MODEL (users table with role='STAFF')

**All Fields & Types:**
- `id` (varchar, PK)
- `businessId` (varchar, FK)
- `role` (varchar) - 'STAFF', 'ADMIN', or 'SUPER_ADMIN'
- `name` (varchar)
- `email` (varchar)
- `phone` (varchar)
- `password` (varchar)
- `crmClientId` (varchar - links staff to client record if needed)
- `address` (jsonb)
- `emergencyContact` (jsonb)
- `bio` (text)
- `yearsExperience` (integer)
- `skills` (jsonb)
- `weeklyAvailability` (jsonb)
- `services` (jsonb - qualified services)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Availability Storage (separate table):**
```
availability table:
- id (serial, PK)
- staffId (varchar, FK → users)
- day (varchar) - e.g., 'mon', 'tue', 'wed'
- start (varchar) - e.g., '09:00'
- end (varchar) - e.g., '17:00'
- createdAt (timestamp)
```

**Active Determination:**
✅ Staff is "active" if they have ANY availability records with slots  
✅ Counted in dashboard via `getActiveStaffStats()` repository method  
✅ No explicit active/inactive boolean field

---

### 5. BUSINESS OWNER MODEL

**Identification:**
- `businesses.ownerUserId` (varchar) → points to user with role='ADMIN'
- Business-level settings stored in `businesses.settings` (jsonb)

**Business Settings Include:**
- Currency (defaults to GBP)
- Tax settings
- Payment terms
- Business branding (colors, logo)
- Contact details

---

### 6. SUPER ADMIN MODEL

**How Many Exist:**
- Currently: **1** (andy@pawtimation)
- Role: `SUPER_ADMIN` in users table
- businessId: Associated with demo business (but has cross-business access)

**Permissions Beyond Business Admin:**
✅ Access to `/owner/*` routes (Owner Portal)  
✅ View all businesses across platform  
✅ Sales & billing analytics for all businesses  
✅ System health monitoring  
✅ User feedback across all businesses  
✅ System logs (platform-wide)  
✅ Beta tester management  
✅ GDPR data export/deletion for any business  
✅ Bypass business isolation rules

---

## 🟧 SECTION 2 — BOOKING WORKFLOW LOGIC

### 1. BOOKING CREATION

**Who Can Create:**
- ✅ **Admin** - via `/bookings/create` (instant creation)
- ✅ **Client** - via `/jobs/request-booking` (creates PENDING)
- ❌ **Staff** - cannot create, only confirm/decline assigned bookings

**Default Status:**
- Admin-created: `BOOKED` (or custom status if specified)
- Client-requested: `PENDING` (requires approval)

**Instant Dashboard Effect:**
✅ **YES** - Socket.IO events fired immediately:
```javascript
emitBookingCreated(booking);
emitStatsChanged({ scope: 'bookings' });
```

**Pending Goes into Forecasts:**
⚠️ **CONDITIONAL** - PENDING bookings appear in:
- Admin bookings list (all statuses)
- Staff dashboard (if assigned to them)
- Forecasting queries (if date-filtered)

---

### 2. STAFF ASSIGNMENT

**When Assigning Staff:**

✅ **Does it notify staff?**  
- Real-time: YES via Socket.IO `booking:updated` event
- Email/SMS: NO (not implemented in current system)

✅ **Appears on staff dashboards?**  
- YES - staff see all PENDING bookings assigned to them
- Filter: `staffId === auth.user.id || (status === 'PENDING' && !staffId)`

✅ **Appears on staff calendars?**  
- YES - enriched with client, service, dog details

✅ **Updates client calendar?**  
- YES - client portal shows all their bookings regardless of status

✅ **Updates admin dashboards?**  
- YES - via `emitStatsChanged()` socket event

**If Staff Declines:**
```javascript
// POST /bookings/:id/staff-decline
// Removes staffId, keeps status=PENDING
// Admin can reassign to different staff
{ staffId: null, status: 'PENDING' }
```

**If Admin Overrides:**
```javascript
// POST /bookings/:id/admin-update
// Admin can change any field including staffId and status
// Emits booking:updated event
```

---

### 3. STATUS TRANSITIONS

**Complete Workflow:**

```
CLIENT REQUEST:
  ↓
PENDING (awaiting admin approval)
  ↓
  ├─→ CANCELLED (client cancels OR admin declines)
  │
  └─→ BOOKED (admin approves OR staff confirms)
      ↓
      ├─→ COMPLETED (staff or admin marks complete)
      │   └─→ Auto-creates invoice item
      │
      └─→ CANCELLED (client/staff/admin cancels)
```

**Detailed Transition Triggers:**

#### **PENDING → BOOKED**
- **Triggers:**
  - Admin: `/jobs/approve`
  - Staff: `/bookings/:id/staff-confirm`
- **Effects:**
  - ✅ Emits `booking:updated`
  - ✅ Emits `stats:changed`
  - ✅ Admin dashboard "This Week's Jobs" updates
  - ✅ Staff dashboard shows as confirmed
  - ❌ No invoice created yet

#### **PENDING → CANCELLED**
- **Triggers:**
  - Client: `/jobs/cancel` (PENDING only)
  - Staff: `/bookings/:id/staff-cancel`
  - Admin: `/jobs/decline`
- **Effects:**
  - ✅ Emits `booking:updated`
  - ✅ Emits `stats:changed`
  - ✅ Removes from active job counts
  - ✅ Sets `cancelledAt` timestamp
  - ✅ Records `cancellationReason` (if provided)

#### **BOOKED → COMPLETED**
- **Triggers:**
  - Staff: `/bookings/:id/update` (status='COMPLETED')
  - Admin: `/bookings/:id/update` (status='COMPLETED')
- **Effects:**
  - ✅ Emits `booking:updated`
  - ✅ Emits `stats:changed`
  - ✅ **AUTO-CREATES INVOICE ITEM** (critical!)
  - ✅ Sets `completedAt` timestamp
  - ✅ Updates "Jobs Completed" dashboard count
  - ✅ Updates "Service Breakdown" chart
  - ✅ Does NOT create full invoice (manual step)

#### **BOOKED → CANCELLED**
- **Triggers:**
  - Admin/Staff: Manual cancellation
- **Effects:**
  - ✅ Same as PENDING → CANCELLED
  - ⚠️ Does NOT undo invoice items (if already created)

---

### 4. BOOKING COMPLETION

**Who Can Complete:**
- ✅ **Staff** - only jobs assigned to them (`staffId === auth.user.id`)
- ✅ **Admin** - any job in their business

**Completion Triggers:**

```javascript
// From repo.js setJobStatus()
if (newStatus === 'COMPLETED' && job.status !== 'COMPLETED') {
  // Auto-create invoice item
  await createInvoiceItem({
    jobId: job.id,
    clientId: job.clientId,
    businessId: job.businessId,
    description: "Service (date)",
    priceCents: job.priceCents || service.priceCents,
    status: 'PENDING'
  });
}
```

**What Gets Updated:**
- ✅ **Invoice item creation** - YES (automatic)
- ✅ **Revenue updates** - NO (only when invoice paid)
- ✅ **Job counts on dashboards** - YES (via socket events)
- ✅ **Service breakdown refresh** - YES (live recalc)
- ❌ **Staff earnings** - Not tracked separately
- ❌ **Super admin usage analytics** - Not directly (would need aggregation)

---

### 5. BOOKING CANCEL/EDIT LOGIC

**Does Cancel Undo Financial Allocation?**
⚠️ **PARTIAL** - Cancelling a booking:
- ✅ Removes from active job counts
- ✅ Sets status to CANCELLED
- ❌ Does NOT delete invoice items (if already created)
- ⚠️ Invoice items remain as "orphaned" pending items

**Does Editing Price/Duration Recalc Dashboards?**
✅ **YES** - via Socket.IO events:
```javascript
emitBookingUpdated(job);
emitStatsChanged();
// Dashboards listening to these events refresh
```

**How is Editing Tracked?**
✅ **Audit Trail:**
- `updatedAt` timestamp updated
- ❌ No dedicated audit log table
- ⚠️ System logs capture some changes (AUTH, ERROR logs)
- ❌ No field-level change history

---

## 🟪 SECTION 3 — INVOICE + PAYMENT PIPELINE

### 1. INVOICE GENERATION

**When Does Invoice Get Created?**

**TWO-STEP PROCESS:**

**Step 1: Auto-Create Invoice Items**
```javascript
// When job status → COMPLETED
// Creates invoice_item with status='PENDING'
await createInvoiceItem({
  jobId: job.id,
  clientId: job.clientId,
  priceCents: job.priceCents || service.priceCents,
  status: 'PENDING'
});
```

**Step 2: Manual Batching into Invoice**
```javascript
// Admin manually groups items via:
// POST /invoices/generate
{
  clientId: "client_123",
  itemIds: ["item_1", "item_2", "item_3"]
}
// Creates single invoice containing multiple jobs
```

**Can Invoices Contain Multiple Bookings?**
✅ **YES** - via invoice_items table  
✅ Admin selects which completed jobs to include  
✅ All items must belong to same client

**Prices Pulled From:**
✅ **Bookings table first** (`job.priceCents`)  
✅ Falls back to services table if no override  
✅ Price is STATIC once invoice item created

---

### 2. SENDING INVOICES

**Status Flows:**
```
DRAFT → PENDING → PAID
         ↓
         VOID (admin cancels)
         ↓
         UNCOLLECTIBLE (bad debt)
```

**How Sends Update Status:**
- WhatsApp: Sets `sentToClient` timestamp
- In-app client portal: Client can view without "sent" status
- Email: Would set `sentToClient` timestamp (if implemented)

**Current Implementation:**
⚠️ `sentToClient` field exists but may not be consistently updated  
⚠️ No dedicated "SENT" status (uses timestamps instead)

---

### 3. PAYMENT LOGIC

**Admin Records Cash Payment:**
```javascript
// POST /invoices/:id/mark-paid
{
  paymentMethod: 'CASH' // or 'CARD', 'CHECK'
}
// Sets:
// - status: 'PAID'
// - paidAt: now()
// - paymentMethod: 'CASH'
```

**Stripe Confirms Payment:**
- Webhook receives payment confirmation
- Marks invoice as PAID
- Sets `paidAt` timestamp
- Sets `paymentMethod: 'STRIPE'`

**Partial Payments:**
❌ **NOT SUPPORTED** - invoice is either PAID or not  
⚠️ Would require additional `payments` table to track partials

**Refunds:**
⚠️ **LIMITED** - No dedicated refund workflow  
⚠️ Admin would manually void invoice or create credit

**Payment Timestamps:**
✅ **YES** - `paidAt` field stores payment date/time

---

### 4. OVERDUE LOGIC

**How is Overdue Calculated?**
```javascript
// In dashboard stats endpoints:
const now = new Date();
const overdueInvoices = invoices.filter(i => 
  i.status === 'PENDING' &&
  i.dueDate &&
  new Date(i.dueDate) < now
);
```

**What Sets Due Dates?**
- Admin sets manually when creating invoice
- Default: 30 days from invoice creation (if not specified)

**Daily Recalculation:**
❌ **NO** - calculated on-demand when dashboard loads  
⚠️ Could implement nightly job to pre-calculate

**Where Overdue Appears:**
✅ **Admin Dashboard** - "Overdue Invoices" KPI card (red/green)  
✅ **Finance Overview** - Overdue list  
✅ **Super Admin Dashboard** - Aggregated across businesses

---

### 5. FINANCIAL DASHBOARDS

**What Fields are Dashboards Reading?**

**Admin Dashboard KPIs:**
```javascript
// Revenue Last 7 Days
SELECT SUM(amountCents) FROM invoices
WHERE paidAt >= (now - 7 days)
  AND businessId = ?

// Unpaid Invoices
SELECT COUNT(*), SUM(amountCents) FROM invoices
WHERE status IN ('DRAFT', 'PENDING')
  AND businessId = ?

// Overdue Invoices
SELECT COUNT(*), SUM(amountCents) FROM invoices
WHERE status = 'PENDING'
  AND dueDate < now()
  AND businessId = ?

// Paid This Month
SELECT SUM(amountCents) FROM invoices
WHERE paidAt >= first_day_of_month
  AND paidAt <= last_day_of_month
  AND businessId = ?
```

**Are Values Cached or Live?**
✅ **LIVE** - Recalculated on every dashboard load  
✅ Socket events trigger frontend refresh  
❌ **NO SERVER-SIDE CACHING** of dashboard metrics

**Does Marking "Paid" Instantly Update KPIs?**
✅ **YES** - via Socket.IO:
```javascript
emitInvoiceUpdated(invoice);
emitStatsChanged({ scope: 'invoices' });
// Frontend listens and refreshes dashboard
```

---

## 🟨 SECTION 4 — DASHBOARD UPDATE MECHANICS

### 1. ADMIN DASHBOARD

**Metrics & Queries:**

**Today's Jobs:**
```sql
SELECT COUNT(*) FROM jobs
WHERE DATE(start) = CURRENT_DATE
  AND status != 'CANCELLED'
  AND businessId = ?
```

**This Week's Jobs:**
```sql
SELECT COUNT(*) FROM jobs
WHERE start >= week_start
  AND start < week_end
  AND status != 'CANCELLED'
  AND businessId = ?
```

**Active Clients:**
```sql
SELECT COUNT(*) FROM clients
WHERE isActive = true
  AND businessId = ?
```

**Revenue Last 7 Days:**
```sql
SELECT SUM(amountCents) FROM invoices
WHERE paidAt >= (now - 7 days)
  AND businessId = ?
```

**Jobs Over Time Chart:**
- Period toggles: 7d, 30d, 90d
- Groups by day
- Filters by status != 'CANCELLED'

**Service Breakdown Chart:**
- Groups jobs by serviceId
- Counts completed jobs per service
- Calculates percentage

**Revenue Trend Chart:**
- Last 6 months
- Groups by month
- SUM(amountCents) WHERE status='PAID'

**WHEN Do These Update?**
✅ **On Socket Events:**
- `booking:updated` → refetch booking stats
- `stats:changed` → refetch all KPIs
- `invoice:updated` → refetch financial stats

✅ **On Page Load:**
- Fresh data fetched from backend
- No stale cached data

---

### 2. STAFF DASHBOARD

**What Triggers Updates?**
- `booking:updated` events (filtered by staffId)
- Staff confirms/declines → instant UI update
- Admin assigns/reassigns → real-time notification

**Are Accepted/Declined Events Linked?**
✅ **YES** - via:
```javascript
// Staff confirms: PENDING → BOOKED
// Staff declines: removes staffId, stays PENDING
// Staff cancels: PENDING → CANCELLED
```

**Do Cancelled Bookings Disappear?**
✅ **YES** - filtered out from active views  
✅ Admin can view cancelled history

---

### 3. CLIENT PORTAL

**What Drives Client Calendar?**
- All bookings WHERE `clientId = auth.clientId`
- Shows ALL statuses (PENDING, BOOKED, COMPLETED, CANCELLED)

**Pending vs Confirmed Logic:**
- PENDING: Shows as "Awaiting Confirmation"
- BOOKED: Shows as "Confirmed"
- COMPLETED: Shows in history

**Do Completed Jobs Appear?**
✅ **YES** - in "Recent Activity" section  
✅ Historical bookings viewable

---

### 4. SUPER ADMIN DASHBOARD

**How Are Global Metrics Calculated?**
```sql
-- Total Platform Revenue
SELECT SUM(amountCents) FROM invoices
WHERE status = 'PAID'
  AND paidAt >= ?
  AND paidAt <= ?

-- Total Active Businesses
SELECT COUNT(*) FROM businesses
WHERE planStatus != 'CANCELLED'

-- Total Platform Jobs
SELECT COUNT(*) FROM jobs
WHERE status = 'COMPLETED'
```

**Does It Aggregate Per Business or Raw Events?**
✅ **RAW AGGREGATION** - queries across all businesses  
✅ No per-business pre-calculation  
✅ Could be optimized with materialized views

**Uses Own Logs or Business Data?**
✅ **BOTH:**
- System logs for error tracking
- Business data for metrics
- Separate queries for each metric type

---

## 🟥 SECTION 5 — NOTIFICATIONS + MESSAGING

### 1. STAFF NOTIFICATIONS

**How Are Staff Notified?**

**New Assignments:**
✅ **Real-time:** Socket.IO `booking:updated` event  
❌ **Email:** Not implemented  
❌ **SMS:** Not implemented  
❌ **Push:** Not implemented

**Cancellations:**
✅ Socket.IO events  
⚠️ Staff sees booking disappear/change status

**Schedule Changes:**
✅ Socket.IO `booking:updated` when admin edits  
⚠️ No dedicated "change notification" system

**Are Notifications Logged?**
❌ **NO** - Socket events are ephemeral  
⚠️ System logs capture some events but not all

---

### 2. CLIENT NOTIFICATIONS

**Booking Reminders:**
❌ **NOT IMPLEMENTED** currently  
⚠️ Would require scheduled job system

**Invoice Notifications:**
⚠️ **PARTIAL:**
- Invoice can be "sent" via WhatsApp/email
- `sentToClient` timestamp recorded
- Client can view in portal anytime

**Payment Receipts:**
❌ **NOT IMPLEMENTED** - no auto-receipt sending

---

### 3. ADMIN NOTIFICATIONS

**Staff Declined:**
✅ Via Socket.IO (admin sees booking update)  
❌ No explicit alert/badge system

**Failed Payments:**
⚠️ Stripe webhooks log failures  
⚠️ No admin dashboard alert

**Overdue Invoices:**
✅ **Dashboard KPI** shows count  
✅ Action Centre shows overdue items  
❌ No email/SMS alerts to admin

**New Client Signed Up:**
⚠️ Not explicitly tracked as notification  
✅ Visible in client list

---

### 4. DELIVERY STATUS

**Do You Track Success/Failure?**
❌ **NO** - Socket.IO events are fire-and-forget  
⚠️ No delivery confirmation system  
⚠️ Client connects → receives events  
⚠️ Client offline → misses events (must reload to sync)

---

## 🟩 SECTION 6 — PERMISSIONS + OVERRIDES

### 1. ADMIN POWER

**Can Admin Override Every Booking State?**
✅ **YES** - via `/bookings/:id/admin-update`  
✅ Can change: staffId, status, start, notes, dogIds

**Does Override Propagate To:**
- ✅ **Staff:** Via Socket.IO events
- ✅ **Client:** Via Socket.IO events
- ✅ **Dashboards:** Via `stats:changed` event
- ⚠️ **Invoices:** Only if status changed to COMPLETED
- ✅ **Super Admin:** Visible in platform-wide queries

---

### 2. STAFF POWER

**Can Staff Decline?**
✅ **YES** - `/bookings/:id/staff-decline`  
✅ Removes their assignment  
✅ Booking returns to PENDING for admin reassignment

**Can Staff Reassign to Other Staff?**
❌ **NO** - Only admin can reassign

**Can Staff Edit Price?**
❌ **NO** - Only admin can override price

**Can Staff Complete Job Alone?**
✅ **YES** - `/bookings/:id/update` (status='COMPLETED')  
✅ Triggers auto-invoice item creation

---

### 3. CLIENT POWER

**Can Clients Request Bookings?**
✅ **YES** - `/jobs/request-booking`  
✅ Creates PENDING booking requiring admin approval

**Can Clients Cancel?**
✅ **YES** - but only PENDING bookings  
✅ `/jobs/cancel` endpoint

**Who Approves Client Cancellations?**
✅ **INSTANT** - no approval needed for PENDING  
❌ **BOOKED/COMPLETED** - cannot cancel (admin must do it)

---

## 🟫 SECTION 7 — EVENT SYSTEM (CRITICAL)

### 1. EVENT-DRIVEN LOGIC

**Do You Have Event Handlers?**

✅ **YES** - Socket.IO based real-time events:

```javascript
// From apps/api/src/lib/socketEvents.js

export const DataEvents = {
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_DELETED: 'booking:deleted',
  INVOICE_CREATED: 'invoice:created',
  INVOICE_UPDATED: 'invoice:updated',
  STATS_CHANGED: 'stats:changed',
  CLIENT_UPDATED: 'client:updated',
  SERVICE_UPDATED: 'service:updated'
};

export function emitBookingCreated(booking) {
  emitDataEvent(DataEvents.BOOKING_CREATED, { booking });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'bookings' });
}

export function emitBookingUpdated(booking) {
  emitDataEvent(DataEvents.BOOKING_UPDATED, { booking });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'bookings' });
}

export function emitBookingStatusChanged(bookingId, status, staffId, businessId) {
  emitDataEvent(DataEvents.BOOKING_UPDATED, { 
    booking: { id: bookingId, status, staffId, businessId }
  });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'bookings' });
}

export function emitInvoiceCreated(invoice) {
  emitDataEvent(DataEvents.INVOICE_CREATED, { invoice });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'invoices' });
}

export function emitInvoiceUpdated(invoice) {
  emitDataEvent(DataEvents.INVOICE_UPDATED, { invoice });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'invoices' });
}
```

**OR Is Everything Recalculated Manually?**
✅ **HYBRID APPROACH:**
- Real-time events notify frontend
- Frontend refetches data from backend
- Backend recalculates on each request (no caching)

---

### 2. DO EVENTS TRIGGER DASHBOARD UPDATES?

✅ **YES** - via Socket.IO:

**Frontend Pattern:**
```javascript
// Frontend listens to socket events
socket.on('stats:changed', () => {
  // Refetch dashboard data
  loadDashboardStats();
});

socket.on('booking:updated', () => {
  // Refresh booking list
  loadBookings();
});

socket.on('invoice:updated', () => {
  // Refresh financial data
  loadInvoices();
});
```

**OR Page-Load Only?**
✅ **BOTH:**
- Socket events trigger live updates
- Page reload fetches fresh data
- No stale data issues

---

### 3. ARE ANY METRICS CACHED?

❌ **NO SERVER-SIDE CACHING** currently:
- Total revenue: recalculated on every request
- Total paid invoices: recalculated live
- Total jobs this week: recalculated live

⚠️ **PERFORMANCE CONSIDERATION:**
- Works fine for current scale
- May need caching/materialized views at scale

---

### 4. DO YOU LOG EVENTS FOR AUDIT/DEBUGGING?

⚠️ **PARTIAL:**

**System Logs Table:**
```javascript
systemLogs {
  id, businessId, logType, severity, 
  message, metadata, userId, createdAt
}
```

**What Gets Logged:**
- ✅ Auth events (login, failed login)
- ✅ Payment failures
- ✅ Critical errors
- ❌ Booking state changes (not logged)
- ❌ Invoice updates (not logged)
- ❌ Staff assignments (not logged)

**Improvement Needed:**
⚠️ Add audit trail for:
- Booking status transitions
- Staff assignments/changes
- Price overrides
- Invoice generation/payment

---

## 🟧 SECTION 8 — PERFORMANCE + EDGE CASES

### 1. EDGE CASE HANDLING

**Booking Edited After Invoicing:**
⚠️ **PROBLEM:**
- Invoice item price is STATIC (from job.priceCents at completion)
- Editing job price AFTER completion does NOT update invoice item
- Creates price mismatch

**Solution Needed:**
- Prevent price edits after COMPLETED
- OR: Update invoice item when job price changes
- OR: Warn admin of mismatch

**Booking Cancelled After Completion:**
⚠️ **PROBLEM:**
- Invoice item remains PENDING
- Creates "orphaned" invoice item
- Admin must manually void invoice or exclude item

**Solution Needed:**
- Prevent cancelling COMPLETED bookings
- OR: Auto-void associated invoice items

**Staff Member Removed While Assigned:**
✅ **HANDLED:**
- Schema: `staffId` has `onDelete: 'set null'`
- Booking remains valid, staffId becomes null
- Admin can reassign

**Client Archived with Unpaid Invoices:**
⚠️ **PROBLEM:**
- Client can be marked inactive (`isActive = false`)
- Unpaid invoices remain
- No automatic collection/reminder stops

**Solution Needed:**
- Prevent deactivation with unpaid invoices
- OR: Auto-send final invoice before deactivation

---

### 2. TIMEZONE HANDLING

⚠️ **CURRENT APPROACH:**
- All timestamps stored in UTC (PostgreSQL default)
- Frontend displays in user's local timezone
- No explicit business timezone setting

⚠️ **EDGE CASE:**
- Multi-timezone businesses (e.g., London + Edinburgh)
- Staff in different timezones
- Solution: Add business.timezone setting

---

### 3. NIGHTLY BATCH RECALCULATION

❌ **NO NIGHTLY JOBS** currently for metrics

⚠️ **COULD IMPLEMENT:**
- Pre-calculate overdue invoices
- Send automated reminders
- Generate business reports
- Archive old data

---

## 🟥 SECTION 9 — RELATIONSHIP MAPPING

### 1. Bookings ↔ Invoices

**Relationship:**
```
bookings (jobs) ──→ invoice_items ──→ invoices
      1:many            many:1

One job → one invoice_item (auto-created on completion)
Many invoice_items → one invoice (manual batching)
```

**Key Points:**
- Jobs create invoice ITEMS, not full invoices
- Invoice items can be batched into single invoice
- Invoice can contain multiple jobs

---

### 2. Invoices ↔ Payments

**Relationship:**
```
invoices ──→ payments (via paymentMethod + paidAt)
   1:1 (current)
   
Could be 1:many (if partial payments added)
```

**Current:**
- Single payment per invoice
- Tracked via `paidAt` + `paymentMethod`

**Future:**
- Add `payments` table for multiple payments
- Support partial payments
- Track payment history

---

### 3. Bookings ↔ Staff

**Relationship:**
```
bookings.staffId ──→ users.id
       many:1

Many bookings → one staff member
Staff can have many assigned bookings
```

**Nullable:**
- Bookings can exist without staff (PENDING queue)
- Staff deletion sets `staffId` to null

---

### 4. Bookings ↔ Services

**Relationship:**
```
bookings.serviceId ──→ services.id
        many:1

Many bookings → one service
Service defines default price/duration
```

**Cascading:**
- `onDelete: 'restrict'` - prevents deleting service with active bookings

---

### 5. Services ↔ Pricing

**Relationship:**
```
services.priceCents (stored price)
  ↓
bookings.priceCents (defaults to service, can override)
  ↓
invoice_items.priceCents (static snapshot)
```

**Price Flow:**
1. Service has base price
2. Booking inherits or overrides
3. Invoice item captures final price
4. Price changes DON'T affect past invoices

---

### 6. Businesses ↔ Staff/Clients

**Relationship:**
```
businesses
   ├──→ users (staff, admins)
   │      many:1
   │
   └──→ clients
          many:1

One business → many staff
One business → many clients
STRICT business isolation enforced
```

**Isolation:**
- All queries filter by businessId
- Staff cannot see other businesses
- Clients cannot see other businesses
- Only SUPER_ADMIN bypasses isolation

---

## 🟦 SECTION 10 — FAILURE SURFACE AREAS

### 1. HOW DOES SYSTEM ALERT ON FAILURES?

**Booking Incomplete:**
⚠️ **NO ALERTS** - silently stays in current state  
⚠️ Admin must manually check for stuck bookings

**Price Missing:**
✅ **DEFAULTS TO SERVICE PRICE** if booking.priceCents null  
⚠️ If service deleted → potential null price

**Invoice Not Created:**
⚠️ **SILENT FAILURE** - if invoice item creation fails  
⚠️ No retry mechanism  
⚠️ Admin must manually check unbilled completed jobs

---

### 2. DATA PERSISTENCE CHECKS

❌ **NO AUTOMATED CHECKS** currently

**Should Implement:**
- Completed jobs without invoice items
- Invoice items without parent invoice (orphaned)
- Invoices with wrong totals
- Bookings with missing clients/services
- Staff assigned to deleted jobs

---

### 3. ERROR LOGGING

**What Gets Logged:**

```javascript
// System logs table
{
  logType: 'AUTH' | 'ERROR' | 'PAYMENT' | 'SYSTEM',
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
  message: "Description",
  metadata: { details }
}
```

**Currently Logged:**
- ✅ Failed logins
- ✅ Super admin actions
- ✅ Payment failures
- ⚠️ Generic errors via console.error

**NOT Logged:**
- ❌ Failed booking updates
- ❌ Failed invoice creation
- ❌ Failed status transitions
- ❌ Broken references (orphaned data)

---

## 🔴 CRITICAL GAPS & RECOMMENDATIONS

### HIGH PRIORITY

1. **Audit Trail:**
   - Add booking_history table
   - Track all status changes
   - Track price overrides
   - Track staff reassignments

2. **Orphaned Invoice Items:**
   - Detect completed jobs without invoice items
   - Auto-create missing items via repair job
   - Alert admin of billing gaps

3. **Price Edit Protection:**
   - Prevent price changes after COMPLETED
   - OR: Update invoice items when job price changes
   - Warn of mismatches

4. **Client Notification System:**
   - Booking confirmations
   - Reminders (24h before)
   - Payment receipts
   - Invoice notifications

### MEDIUM PRIORITY

5. **Staff Notification Enhancement:**
   - Email/SMS for new assignments
   - Shift reminders
   - Cancellation alerts

6. **Admin Alerts:**
   - Overdue invoice reminders
   - Payment failure notifications
   - Staff declined booking alerts

7. **Data Integrity Checks:**
   - Nightly job to detect:
     - Orphaned invoice items
     - Broken booking references
     - Missing staff assignments
   - Email report to super admin

### LOW PRIORITY

8. **Partial Payments:**
   - Add payments table
   - Support installment plans
   - Track payment history

9. **Timezone Support:**
   - Add business.timezone setting
   - Display times in business timezone
   - Handle staff across timezones

10. **Metrics Caching:**
    - Cache frequently-accessed stats
    - Materialized views for reports
    - Reduce database load

---

## ✅ CONCLUSION

**System Strengths:**
- ✅ Solid data model with proper relationships
- ✅ Real-time updates via Socket.IO
- ✅ Auto-invoice item creation on completion
- ✅ Comprehensive dashboard metrics
- ✅ Strong permission system

**Critical Gaps:**
- ⚠️ No audit trail for booking/invoice changes
- ⚠️ Silent failures in invoice creation
- ⚠️ Limited client/staff notifications
- ⚠️ No orphaned data detection
- ⚠️ Price edit edge cases

**Overall Assessment:**
The system has a strong foundation with proper event-driven architecture and real-time capabilities. The main areas for improvement are around audit trails, error detection, and automated notifications. Most workflows are solid, but edge case handling needs attention.

**Recommended Next Steps:**
1. Implement audit trail system
2. Add data integrity checks
3. Enhance notification system
4. Improve error handling/alerting
5. Add automated billing gap detection

---

**End of Audit - All 10 Sections Complete**
