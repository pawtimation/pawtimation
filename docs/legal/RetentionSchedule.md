# PAWTIMATION DATA RETENTION SCHEDULE

**Version:** 1.0  
**Last Updated:** 26 November 2025  
**Status:** Internal & Public-Facing Compliance Document

This Data Retention Schedule details how long Pawtimation retains personal data in accordance with the UK GDPR's storage limitation principle (Article 5(1)(e)).

Pawtimation retains data only for as long as necessary for:
- delivering the Service;
- meeting legal obligations;
- resolving disputes;
- maintaining accurate financial records;
- supporting business continuity.

---

## 1. Key Retention Principles

1. Retention periods are based on legal, regulatory, and operational requirements.
2. When a business account terminates, data is deleted according to the schedule below.
3. Users may request deletion of certain data before scheduled deletion.
4. Financial records must be retained for seven years under UK tax law.
5. Mapping, geolocation, and GPS data are not collected and therefore have no retention period.
6. Backups stored by Sub-Processors expire automatically according to their built-in schedules.

---

## 2. Retention Periods by Data Category

Below is the full, authoritative retention schedule.

### 2.1 User Accounts (Business Owners, Staff, Clients)

**Data:**
- name
- email
- phone
- password hash
- role
- profile details

**Retention:**
- Active account lifetime
- Deleted automatically 12 months after account becomes inactive

**Reason:**
- Operational integrity
- Allow reactivation
- Support audit trails

---

### 2.2 Client Records (Pet Owners)

**Data:**
- name
- address (text only)
- email
- phone
- emergency contacts
- vet information

**Retention:**
- Active + 12 months
- Hard-deleted thereafter (except details contained in invoices, which remain for 7 years)

**Reason:**
- Operational continuity
- Industry standard grace period
- Potential future service reactivation

---

### 2.3 Dog Profiles

**Data:**
- dog name
- breed
- age
- behaviour notes
- vet info
- photos

**Retention:**
- Active + 12 months

**Reason:**
- Maintain booking history integrity
- Allow reactivation if clients return

---

### 2.4 Bookings and Schedules

**Data:**
- booking dates
- service descriptions
- notes
- dog associations

**Retention:**
- Active + 12 months
- Summary data may remain in invoices for 7 years

**Reason:**
- Audit trail
- Operational support
- Troubleshooting

---

### 2.5 Messages (In-App Messaging)

**Data:**
- message body
- sender/recipient
- timestamp

**Retention:**
- Active + 12 months
- Hard-deleted thereafter (except where part of invoice metadata)

**Reason:**
- Customer service history
- Operational clarity
- GDPR minimal storage principles

---

### 2.6 Uploaded Media (Dog Photos and Walk Completion Photos)

**Data:**
- dog profile photos
- walk completion images (job photos)

**Retention:**
- Active + 12 months
- Deleted automatically from object storage
- Database reference removed simultaneously

**Reason:**
- Storage minimisation
- Prevent unnecessary data retention
- Business value retention window

---

### 2.7 Invoices and Financial Records

**Data:**
- invoice amounts
- client name
- services billed
- tax-related details
- payment status
- associated Stripe metadata (when enabled)

**Retention:**
- 7 years (legal requirement under HMRC rules)

**Reason:**
- HMRC compliance
- Mandatory for sole traders and limited companies

---

### 2.8 Authentication Logs

**Data:**
- login attempts
- timestamps
- IP address
- device metadata

**Retention:**
- 30 to 90 days depending on severity

**Reason:**
- Fraud detection
- Security audits
- Incident response

---

### 2.9 Error Logs and Operational Logs

**Data:**
- error codes
- stack traces (no PII)
- anonymised identifiers

**Retention:**
- 30 to 90 days

**Reason:**
- Troubleshooting
- Platform reliability
- Security monitoring

---

### 2.10 Email Metadata (Resend)

**Data:**
- email address
- timestamp
- delivery status

**Retention:**
- Approximately 30 days (managed by Resend)

**Reason:**
- Deliverability checks
- Anti-abuse protection

Pawtimation does not store email content long-term.

---

### 2.11 Business Administrative Records

**Data:**
- support emails
- internal notes
- account closure communications

**Retention:**
- 3 years unless regulatory obligations require longer

**Reason:**
- Dispute handling
- Administrative operations

---

### 2.12 Beta Test Data

**Data:**
- any data processed during beta (all categories)

**Retention:**
- Deleted at the end of the beta period or migrated into production
- Users will be notified before major changes

**Reason:**
- Clean transition to live system
- Avoid storing test artefacts
- Minimise retention obligations

---

## 3. Retention Review and Deletion Mechanisms

Pawtimation performs:
- automated retention enforcement
- scheduled deletion for expired accounts
- periodic manual audits
- Sub-Processor retention verification

Deletion includes:
- database record removal
- media purge from object storage
- cache and log removal
- backup expiry through Sub-Processor retention cycles

---

## 4. Data Integrity and Backups

Backups occur within the Neon-managed database infrastructure.

Backups:
- are encrypted
- are automatically cycled
- expire according to Neon's retention policy
- cannot be individually deleted on request (industry standard)

However:
- deleted data is not restored from backups except in disaster recovery scenarios
- restored systems undergo re-application of retention rules

---

## 5. Responsibility

Overall responsibility for retention compliance lies with:

**Andrew James Beattie**  
Owner, Pawtimation  
support@pawtimation.co.uk

---

**END OF DATA RETENTION SCHEDULE**
