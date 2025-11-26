# Data Retention Schedule

**Last Updated**: 26 November 2025  
**Document Owner**: Andrew James Beattie / Pawtimation

---

## Overview

This document defines the retention periods for different categories of personal data processed by Pawtimation. Retention periods are based on legal requirements, contractual obligations, and legitimate business needs.

---

## Retention Periods by Data Category

### 1. User Accounts

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Active user accounts | Duration of account | Contract | N/A |
| Inactive accounts (no login 24+ months) | 24 months, then notice + 30 days | Legitimate Interest | Anonymisation or deletion |
| Deleted accounts (soft delete) | 30 days recovery period | User protection | Hard delete after 30 days |
| Account credentials (password hashes) | Duration of account + 30 days | Security | Hard delete |

### 2. Client Records

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Active client profiles | Duration of business relationship | Contract | N/A |
| Inactive clients (no bookings 24+ months) | Flagged for review, business decision | Legitimate Interest | Anonymisation optional |
| Deleted client records | 90 days recovery + anonymised financial records | Business continuity | Anonymisation |

### 3. Pet Profiles

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Active pet profiles | Duration of client relationship | Contract | N/A |
| Pet photos | Duration of client relationship + 90 days | Service delivery | Hard delete |
| Deceased pet records | Optional retention by client | Client preference | Manual deletion on request |

### 4. Booking Records

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Booking details | 7 years from completion | Legal (financial records) | Anonymisation |
| GPS/walk route data | 12 months | Legitimate Interest | Hard delete |
| Booking notes | 7 years (part of booking record) | Legal (financial records) | Anonymisation |

### 5. Financial Records

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Invoices | 7 years from creation | Legal (UK HMRC) | Archive, then delete |
| Payment records | 7 years from transaction | Legal (UK HMRC) | Archive, then delete |
| Stripe customer IDs | Duration of subscription + 7 years | Legal (financial records) | Hard delete |

### 6. Communications

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| In-platform messages | Duration of client relationship + 90 days | Contract | Hard delete |
| Email delivery logs | 30 days | Operations | Automatic purge |
| System notifications | 90 days | Operations | Automatic purge |

### 7. Media and Files

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Pet photos | Duration of associated record + 90 days | Service delivery | Hard delete from Object Storage |
| Uploaded documents | Duration of associated record + 90 days | Contract | Hard delete |
| Profile images | Duration of account + 30 days | Contract | Hard delete |

### 8. Security and Audit Logs

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Authentication logs | 90 days | Security | Automatic purge |
| Error logs (sanitised) | 90 days | Operations | Automatic purge |
| Admin activity logs | 12 months | Audit/Accountability | Archive, then anonymise |
| Security incident logs | 3 years | Legal (incident response) | Archive |

### 9. Beta Programme Data

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Beta tester registrations | Duration of beta + 6 months | Contract | Hard delete or convert to customer |
| Feedback submissions | Indefinite (anonymised after 12 months) | Product improvement | Anonymisation |
| Referral codes | Duration of beta + 12 months | Programme administration | Hard delete |

### 10. Analytics Data (if enabled)

| Data Type | Retention Period | Basis | Deletion Method |
|-----------|------------------|-------|-----------------|
| Aggregated usage stats | Indefinite | Legitimate Interest | N/A (no PII) |
| Individual session data | 30 days | Consent | Automatic purge |

---

## Retention Triggers

### Account Deletion Request

When a user or business requests account deletion:

1. **Immediate** - Access revoked, account marked for deletion
2. **30 days** - Recovery period (can restore if requested)
3. **30+ days** - Hard delete of non-financial personal data
4. **Retained** - Anonymised financial records (7 years from creation)

### Business Subscription Cancellation

When a business cancels their subscription:

1. **Immediate** - Access to new features revoked
2. **30 days** - Data export available
3. **90 days** - Account and data deleted (except financial records)
4. **7 years** - Anonymised financial records retained for tax compliance

### Client Removal by Business

When a business deletes a client:

1. **Immediate** - Client record marked for deletion
2. **7 days** - Recovery period for accidental deletion
3. **7+ days** - Personal data deleted, financial records anonymised
4. **7 years** - Anonymised booking/invoice data retained

---

## Automated Retention Processes

### Current Implementation

| Process | Frequency | Status |
|---------|-----------|--------|
| Database backups | Daily | Active |
| Log rotation | Rolling 90-day window | Active |
| Email log purge | 30 days | Active |

### Planned Implementation

| Process | Frequency | Status |
|---------|-----------|--------|
| Inactive account flagging | Monthly | Planned |
| Automated client anonymisation | On deletion request | Implemented (GDPR tools) |
| Financial record archival | Annual | Planned |

---

## Legal Retention Requirements (UK)

| Record Type | Minimum Retention | Legal Basis |
|-------------|-------------------|-------------|
| Financial/tax records | 6 years | Companies Act 2006, HMRC |
| VAT records | 6 years | VAT Regulations |
| Employment records | 6 years after employment ends | Limitation Act 1980 |
| Health & safety records | 3 years | RIDDOR |
| Contracts | 6 years after completion | Limitation Act 1980 |

---

## Data Deletion Procedures

### Standard Deletion

1. User initiates deletion request (UI or email)
2. System marks record for deletion
3. Recovery period (if applicable)
4. Automated hard delete or anonymisation
5. Audit log entry created

### GDPR Erasure Request

1. Request received via email or GDPR portal
2. Identity verification
3. Data export provided (if requested)
4. Erasure executed within 30 days
5. Confirmation sent to data subject
6. Exception: retained anonymised financial data

### Business Termination

1. Business cancels subscription
2. 30-day data export window
3. 90-day grace period
4. Full data deletion (except financial records)
5. 7-year retention of anonymised financial data

---

## Exceptions to Retention Periods

Data may be retained beyond scheduled periods for:

1. **Legal proceedings** - If data is relevant to ongoing or anticipated legal action
2. **Regulatory investigation** - If required by supervisory authority
3. **Fraud prevention** - If data is needed to prevent or investigate fraud
4. **Tax audit** - If requested by HMRC

---

## Review Schedule

This retention schedule is reviewed:

- Annually
- When legal requirements change
- When new data categories are introduced
- Following data protection impact assessments

---

## Contact

For data retention enquiries:

**Email**: pawtimation.uk@gmail.com

---

*This document supports the Pawtimation Privacy Policy and GDPR compliance programme.*
