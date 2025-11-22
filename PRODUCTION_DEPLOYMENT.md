# Production Deployment Guide - Pawtimation CRM

## Pre-Launch Configuration Changes

### CRITICAL: ALLOWED_ORIGINS Environment Variable

**Current Value (Development + Production):**
```
https://11fad5e5-edd3-4200-a173-25a2f450b6eb-00-1eyk9cxzpzzhl.worf.replit.dev,https://pawtimation.co.uk,https://www.pawtimation.co.uk,https://app.pawtimation.co.uk
```

**Production-Only Value (Use this before launch):**
```
https://pawtimation.co.uk,https://www.pawtimation.co.uk,https://app.pawtimation.co.uk
```

**How to Update:**
1. Go to Replit Secrets/Environment Variables
2. Find `ALLOWED_ORIGINS` in shared environment
3. Replace the entire value with the production-only value above
4. Restart the application

**Security Note:** The application will EXIT on startup if ALLOWED_ORIGINS is not set when NODE_ENV=production. This prevents accidental exposure.

---

## Database Migration Status

✅ **COMPLETED** - Database schema is synchronized
- Unique constraint added to event_rsvps table
- All tables ready for production

---

## Environment Variables Checklist

Verify all required secrets are set:

- ✅ `NODE_ENV=production` (shared)
- ✅ `JWT_SECRET` (shared) - 128 character secret set
- ⚠️ `ALLOWED_ORIGINS` (shared) - **UPDATE TO PRODUCTION-ONLY BEFORE LAUNCH**
- ✅ `DATABASE_URL` (secret)
- ✅ `RESEND_API_KEY` (secret)
- ✅ `STRIPE_SECRET_KEY` (via integration)
- ✅ `MAPTILER_API_KEY` (secret)
- ✅ `OPENROUTESERVICE_API_KEY` (secret)

---

## Pre-Launch Testing Checklist

### Authentication & Security
- [ ] Test admin login/logout
- [ ] Test staff login/logout  
- [ ] Test client login/logout
- [ ] Test owner portal login
- [ ] Verify masquerade START logging
- [ ] Verify masquerade END logging
- [ ] Test role-based access controls
- [ ] Verify CORS blocks unauthorized domains

### Core Functionality
- [ ] Create and edit bookings
- [ ] Assign staff to jobs
- [ ] Generate invoices
- [ ] Process Stripe payments
- [ ] Send email notifications
- [ ] Upload staff photos
- [ ] Upload dog photos
- [ ] Upload walk media

### Beta/Trial/Paid Flow
- [ ] Beta signup flow
- [ ] Trial activation
- [ ] Trial expiry blocking (staff/client)
- [ ] Stripe checkout → PAID status
- [ ] Payment failure grace period
- [ ] Suspension after grace period

### Mobile Responsiveness
- [ ] Test admin portal on mobile
- [ ] Test staff portal on mobile
- [ ] Test client portal on mobile
- [ ] Test touch interactions
- [ ] Verify no zoom issues

### Map & GPS Features
- [ ] Load map with MapTiler tiles
- [ ] Generate walking route with OpenRouteService
- [ ] Save and load GeoJSON routes
- [ ] Edit waypoints with drag-and-drop
- [ ] View routes in client portal

### Performance
- [ ] Run Lighthouse audit (target: 90+ performance)
- [ ] Check bundle size (<500KB initial load)
- [ ] Verify lazy loading of charts/maps
- [ ] Test database query performance
- [ ] Verify automation jobs run on schedule

### Email System
- [ ] Welcome email sends
- [ ] Trial welcome email sends
- [ ] Founder follow-up email (6 hours)
- [ ] Feedback summary email (21:00 UK)
- [ ] Invoice reminder emails
- [ ] Payment failure warnings
- [ ] Referral reward emails

---

## Deployment Steps

1. **Update ALLOWED_ORIGINS to production-only domains** (see above)
2. Restart application to apply changes
3. Test critical user flows (login, booking, payment)
4. Monitor system logs for errors (first 2 hours)
5. Monitor webhook logs for Stripe events
6. Monitor automation job execution
7. Verify email delivery via Resend dashboard

---

## Post-Launch Monitoring

### First 24 Hours
- Check system logs every 2 hours
- Monitor Stripe webhook success rate
- Track email delivery rates
- Watch for authentication errors
- Monitor database performance

### First Week
- Review feedback submissions
- Check invoice reminder automation
- Verify trial expiry enforcement
- Monitor referral conversions
- Review performance metrics

---

## Rollback Procedure

If critical issues arise:

1. Use Replit's built-in rollback feature
2. Revert to last known good checkpoint
3. Review system logs to identify issue
4. Fix in development environment
5. Re-test before re-deploying

---

## Support Contacts

- **Technical Issues:** Developer team
- **Stripe Issues:** Stripe dashboard
- **Email Issues:** Resend dashboard
- **Database Issues:** Replit PostgreSQL logs

---

## Production URLs

- **Main Site:** https://pawtimation.co.uk
- **WWW Redirect:** https://www.pawtimation.co.uk
- **Application:** https://app.pawtimation.co.uk
- **Owner Portal:** https://app.pawtimation.co.uk/owner

All URLs must be HTTPS only - no HTTP redirects.
