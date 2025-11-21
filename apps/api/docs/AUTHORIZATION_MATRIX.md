# API Authorization Matrix

This document provides a comprehensive matrix of all booking/job API endpoints and their authorization requirements. All endpoints use role-based access control with centralized authentication helpers.

## Authentication Helpers

| Helper | Allowed Roles | Use Case |
|--------|---------------|----------|
| `requireAdminUser` | Admin/Business only | Admin-only operations (create, approve, modify bookings) |
| `requireStaffUser` | Staff only | Staff-only operations (rarely used, most endpoints allow admin too) |
| `requireClientUser` | Client only | Client portal operations |
| `requireBusinessUser` | Admin OR Staff | Operations accessible to both admin and staff |
| `requireStaffUserWithAssignment` | Admin OR assigned Staff | View/modify bookings (staff must be assigned) |
| `requireStaffJobOwnership` | Assigned Staff only | Staff approval actions (admin blocked) |

## Booking Endpoints Authorization Matrix

### Admin-Only Endpoints (requireAdminUser)
Operations that only administrators can perform. Staff are completely blocked.

| Endpoint | Method | Purpose | Staff Access | Notes |
|----------|--------|---------|--------------|-------|
| `/bookings/create` | POST | Create new booking | ❌ BLOCKED | Admin creates bookings for clients |
| `/bookings/create-recurring` | POST | Create recurring bookings | ❌ BLOCKED | Bulk booking creation |
| `/bookings/:id/update` | POST | Update booking details | ❌ BLOCKED | Modify time, service, staff, price |
| `/jobs/pending` | GET | List all PENDING jobs | ❌ BLOCKED | Admin approval queue |
| `/jobs/approve` | POST | Approve PENDING→BOOKED | ❌ BLOCKED | Admin approves client requests |
| `/jobs/decline` | POST | Decline PENDING→CANCELLED | ❌ BLOCKED | Admin declines client requests |

### Business Endpoints with Role-Based Filtering (requireBusinessUser)
Both admin and staff can access, but staff see filtered results.

| Endpoint | Method | Purpose | Staff Access | Staff Filtering |
|----------|--------|---------|--------------|-----------------|
| `/bookings/list` | GET | List all bookings | ✅ FILTERED | Only returns bookings where `staffId === user.id` |
| `/bookings/by-date` | GET | Calendar view bookings | ✅ FILTERED | Only returns assigned bookings for staff |

### Staff Assignment-Aware Endpoints (requireStaffUserWithAssignment)
Admin can access all bookings. Staff can only access bookings assigned to them.

| Endpoint | Method | Purpose | Staff Access | Authorization Logic |
|----------|--------|---------|--------------|-------------------|
| `/bookings/:id` | GET | Get booking details | ✅ IF ASSIGNED | Admin: all jobs<br>Staff: only if `job.staffId === user.id` |
| `/bookings/:id/move` | POST | Drag-and-drop reschedule | ✅ IF ASSIGNED | Admin: all jobs<br>Staff: only assigned |
| `/bookings/:id/generate-route` | POST | Generate walking route | ✅ IF ASSIGNED | Admin: all jobs<br>Staff: only assigned |
| `/bookings/:id/download-gpx` | GET | Download GPX file | ✅ IF ASSIGNED | Admin: all jobs<br>Staff: only assigned |

### Staff-Only Approval Endpoints (requireStaffJobOwnership)
Only the assigned staff member can perform these actions. Admins are blocked.

| Endpoint | Method | Purpose | Admin Access | Requirements |
|----------|--------|---------|--------------|--------------|
| `/bookings/:id/staff-confirm` | POST | Staff confirms PENDING→BOOKED | ❌ BLOCKED | Must be assigned staff + PENDING status |
| `/bookings/:id/staff-decline` | POST | Staff declines (reassign) | ❌ BLOCKED | Must be assigned staff + PENDING status |
| `/bookings/:id/staff-cancel` | POST | Staff cancels PENDING→CANCELLED | ❌ BLOCKED | Must be assigned staff + PENDING status |

### Client Endpoints (requireClientUser)
Client portal operations. Only accessible by client users.

| Endpoint | Method | Purpose | Authorization Logic |
|----------|--------|---------|---------------------|
| `/jobs/client/:clientId` | GET | List client's bookings | Must match authenticated client's ID |
| `/jobs/create` | POST | Client creates booking request | Creates PENDING booking for own account |
| `/jobs/cancel` | POST | Client cancels booking | Must own the booking |
| `/jobs/update` | POST | Client updates booking | Must own the booking |
| `/jobs/:id` | GET | Get single job | Must own the booking |
| `/clients/:clientId/dogs` | GET | List client's dogs | Must be the authenticated client |

## Security Principles

### 1. Least Privilege
- Staff can only view/modify bookings assigned to them
- Clients can only access their own bookings
- Admins have full access within their business

### 2. Business Isolation
All endpoints verify:
```javascript
if (job.businessId !== auth.businessId) {
  return 403 Forbidden
}
```

### 3. Role Normalization
All role checks are case-insensitive:
```javascript
normalizeRole(user.role) // 'staff' → 'STAFF'
```

### 4. Socket Security
Staff decline/cancel actions emit sanitized payloads:
```javascript
emitBookingStatusChanged(id, status, staffId, businessId)
// NOT: emitBookingUpdated(enrichedJobWithClientPII)
```

### 5. Progressive Enhancement
- Auth helpers return the job object when assignment is checked
- No need to re-fetch the job after authorization
- Reduces database queries and improves performance

## Testing Authorization

### Manual Testing Checklist

**Admin Tests:**
- ✅ Can create bookings
- ✅ Can approve PENDING bookings
- ✅ Can view all business bookings
- ✅ Can modify any booking
- ❌ Cannot use staff-confirm/decline/cancel endpoints

**Staff Tests:**
- ✅ Can see only assigned bookings in list
- ✅ Can confirm/decline/cancel PENDING bookings assigned to them
- ✅ Can download GPX for assigned bookings
- ❌ Cannot see unassigned bookings
- ❌ Cannot create bookings
- ❌ Cannot approve/decline (admin endpoints)
- ❌ Cannot modify unassigned bookings

**Client Tests:**
- ✅ Can create booking requests (PENDING)
- ✅ Can view own bookings
- ❌ Cannot view other clients' bookings
- ❌ Cannot access admin/staff endpoints

### Automated Testing (Future Enhancement)

Recommended test coverage:
```javascript
// Admin authorization
test('admin can create bookings', ...)
test('admin can approve PENDING bookings', ...)
test('admin can view all business bookings', ...)

// Staff authorization
test('staff can only see assigned bookings', ...)
test('staff cannot see unassigned bookings', ...)
test('staff can confirm assigned PENDING bookings', ...)
test('staff cannot approve bookings (admin-only)', ...)

// Client authorization
test('client can create booking requests', ...)
test('client cannot access other clients bookings', ...)
test('client cannot access admin endpoints', ...)
```

## Migration Notes

### Before Refactoring (Anti-Pattern)
```javascript
// OLD: Inline role checks duplicated across endpoints
const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
if (!auth) return;

if (auth.user.role?.toUpperCase() === 'STAFF') {
  // Manual filtering or blocking
  if (job.staffId !== auth.user.id) {
    return 403
  }
}
```

**Problems:**
- Duplicated authorization logic across 13+ endpoints
- Case-sensitivity bugs (staff vs STAFF)
- Easy to forget checks or implement inconsistently
- Hard to audit security coverage

### After Refactoring (Best Practice)
```javascript
// NEW: Centralized, reusable helpers
const auth = await requireStaffUserWithAssignment(fastify, req, reply, jobId);
if (!auth) return;

// auth.job already validated for business ownership and staff assignment
// auth.isStaff flag available if needed
```

**Benefits:**
- Single source of truth for authorization logic
- Consistent case-insensitive role handling
- Easier to audit and test
- Reduced code duplication (~76 lines eliminated)
- Better separation of concerns

## Future Enhancements

1. **API Testing**: Add automated tests for each authorization scenario
2. **Rate Limiting**: Add role-specific rate limits (staff vs admin)
3. **Audit Logging**: Log all authorization failures for security monitoring
4. **Permission Policies**: Consider policy-based authorization for finer-grained control
5. **Role Hierarchy**: Implement inheritance (e.g., super-admin > admin > staff)

## Related Documentation

- `apps/api/src/lib/authHelpers.js` - Authentication helper implementations
- `apps/api/src/routes/jobRoutes.js` - Booking endpoint implementations
- `apps/api/src/lib/socketEvents.js` - Real-time event broadcasting with PII protection
- `replit.md` - System architecture and recent changes
