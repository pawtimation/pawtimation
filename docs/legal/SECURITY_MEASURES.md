# PAWTIMATION SECURITY MEASURES OVERVIEW

**Version:** 1.0  
**Last Updated:** 26 November 2025  
**Status:** Internal & Public-Facing Compliance Document

This document sets out the technical and organisational measures ("TOMs") implemented by Pawtimation to protect personal data in accordance with UK GDPR Article 32 and industry best practices.

---

## 1. Overview

Pawtimation is a cloud-based CRM platform for pet-care businesses.
It processes personal data including business user details, staff, clients (pet owners), pet records, bookings, messages, invoices, and uploaded photos.

Pawtimation operates on:
- Replit (application hosting)
- Neon (managed PostgreSQL database)
- Resend (transactional emails)
- Stripe (disabled during beta)

Mapping, GPS, geocoding, and routing features are fully disabled and cannot process any location data.

---

## 2. Security Governance and Responsibility

Security responsibility is held by:

**Andrew James Beattie**  
Owner, Pawtimation  
hello@pawtimation.co.uk

Duties include:
- implementing and maintaining security controls
- enforcing access restrictions
- monitoring infrastructure
- coordinating incident response
- ensuring compliance with UK GDPR Article 32

---

## 3. Technical Measures

This section details all implemented technical protections.

### 3.1 Encryption

**In Transit**
- HTTPS enforced end-to-end
- TLS 1.2+
- HSTS enabled
- Secure cookies for session tokens

**At Rest**
- Database encryption provided by Neon
- AES-256-GCM encryption used for sensitive fields in application logic
- Encrypted storage for uploaded media via object storage provider

---

### 3.2 Access Controls

- Role-Based Access Control (RBAC)
  - BUSINESS_OWNER
  - STAFF
  - CLIENT
  - ADMIN (restricted)
- Server-side authorisation checks for all routes
- User isolation by business tenant
- Tokens validated for each request
- No shared accounts permitted

**Privileged Access**
- Administrative access only by the Owner
- No general support access to customer data
- Masquerade functions available only with explicit business request (audited)

---

### 3.3 Authentication Security

- Passwords hashed using a secure one-way hashing algorithm (bcrypt or equivalent)
- Never stored in plaintext
- Failed login rate limiting
- Email verification steps (where enabled)
- Session expiry enforced

---

### 3.4 API Security

- Input sanitisation
- JSON schema validation
- Parameterised queries (via Drizzle ORM)
- No raw SQL used
- Anti-forgery protections
- Rate limiting per IP address
- Safe error responses with no sensitive detail

---

### 3.5 Logging and Monitoring

- Extensive log sanitisation (no PII in logs)
- Error logs exclude message bodies, addresses or sensitive data
- Authentication activity tracked
- Monitoring dashboards used for uptime and stability
- No external log processors used

Retention: 30–90 days.

---

### 3.6 Content Security Policy (CSP)

Strict CSP applied to prevent:
- cross-site scripting (XSS)
- unauthorised external script loading
- inline script execution

Mapping domains (MapTiler, OpenRouteService) removed while mapping features are disabled.

---

### 3.7 Cross-Origin Resource Sharing (CORS)

- Specific whitelisted origins only
- Production environment blocks development origins
- Rejects unauthorised cross-domain requests

---

### 3.8 File Upload Security

- Only dog photographs are accepted
- MIME type validation
- File size limits
- Virus scanning (where supported by provider)
- Unique file naming
- Files stored in isolated object storage

---

### 3.9 Database Security

- Isolation per business via row-level security enforcement
- Proper indexing for performance and integrity
- Daily backups managed by Neon
- Backup expiry aligned with Neon retention policies
- No direct database access exposed

---

### 3.10 Removal of Mapping/GPS Features

All mapping/location functions disabled:
- No browser geolocation API
- No geocoding
- No route calculation
- No tile requests
- No coordinate storage
- No lat/lng written to the database
- Frontend components removed or conditionally hidden
- Backend endpoints gated by feature flags (ENABLE_MAPS = false)

This fully eliminates location-related security risks.

---

## 4. Organisational Measures

### 4.1 Internal Access Restrictions

- Only the Owner has administrative access
- No external contractors currently access live data
- Access logs reviewed regularly
- Privileged access used only when necessary and auditable

---

### 4.2 Staff and Contractor Policies

- Confidentiality agreements required
- Data minimisation training (internal)
- No use of customer data for development where not required
- Support processes require explicit customer permission

---

### 4.3 Security Policies and Documentation

- Privacy Policy
- Terms of Service
- DPIA
- ROPA
- Retention Schedule
- Data Processing Agreement
- Incident Response Procedure
- Backup and Recovery Outline

All reviewed regularly.

---

### 4.4 Incident Response

In case of a data breach:

1. Containment measures deployed immediately
2. Impact assessed
3. Controller notified without undue delay (if Pawtimation is Processor)
4. ICO notification evaluated (if Pawtimation is Controller)
5. Root cause analysis documented
6. Remediation steps implemented

---

### 4.5 Vendor and Sub-Processor Management

Sub-Processors reviewed for:
- GDPR compliance
- technical and organisational measures
- contractual safeguards (SCCs + UK Addendum)
- security certifications
- breach history
- data residency options

Updates communicated where material.

---

## 5. Data Minimisation and Privacy by Design

Pawtimation incorporates privacy by design by:
- minimising the data collected
- eliminating geolocation entirely
- storing addresses as plain text only
- no external analytics or advertising scripts
- strict RBAC
- limited retention windows
- sanitised logs
- isolating business data tenants
- controlling privileged access

---

## 6. Physical Security (Sub-Processor Level)

Physical protections provided by:
- Replit data centres
- Neon data centres
- Resend infrastructure
- Stripe (when enabled)

These include:
- secure data centre access controls
- environmental and network protections
- physical intrusion prevention
- 24/7 monitoring

---

## 7. Backup and Recovery Controls

- Managed backups via Neon
- Encrypted and stored separately from primary data
- Limited retention based on provider
- Periodic restore testing (as feasible)
- Backups inaccessible to customers and non-administrators

---

## 8. Continuous Improvement and Review

Security controls are reviewed:
- upon infrastructure changes
- quarterly
- after any incident
- before new feature launches
- when enabling features like mapping (requires new DPIA and review)

---

## 9. Security Contact

All security matters should be directed to:

**hello@pawtimation.co.uk**  
Lytchett House, 13 Freeland Park, Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom

---

**END OF SECURITY MEASURES OVERVIEW**
