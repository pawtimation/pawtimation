# Record of Processing Activities (ROPA)

**Data Controller/Processor**: Andrew James Beattie / Pawtimation  
**Contact**: pawtimation.uk@gmail.com  
**Address**: Lytchett House, 13 Freeland Park, Wareham Road, Poole, Dorset BH16 6FA, United Kingdom  
**Last Updated**: 26 November 2025  
**Status**: Internal Document — Required under UK GDPR Article 30

---

## 1. Organisation Details

| Field | Details |
|-------|---------|
| Organisation Name | Pawtimation |
| Legal Entity | Sole Trader (Andrew James Beattie) |
| Role | Data Processor (for business client data) / Data Controller (for platform operations) |
| Supervisory Authority | Information Commissioner's Office (ICO) |
| Contact for Data Protection | pawtimation.uk@gmail.com |

---

## 2. Processing Activities Overview

### 2.1 User Account Management

| Attribute | Details |
|-----------|---------|
| Processing Activity | User registration, authentication, profile management |
| Categories of Data Subjects | Business administrators, staff members, clients |
| Categories of Personal Data | Name, email address, password hash, role, phone (optional) |
| Purpose | Account creation, platform access, identity verification |
| Legal Basis | Contract (Terms of Service) |
| Retention Period | Duration of account + 30 days post-deletion |
| Data Recipients | Internal platform systems only |
| International Transfers | USA (Replit/Neon hosting) — SCCs in place |

### 2.2 Client Management

| Attribute | Details |
|-----------|---------|
| Processing Activity | Storage and management of client records for pet-care businesses |
| Categories of Data Subjects | Clients of pet-care businesses (pet owners) |
| Categories of Personal Data | Name, email, phone, address, emergency contact, notes |
| Purpose | Enable businesses to manage their customer relationships |
| Legal Basis | Contract (service provision), Legitimate Interest (business operations) |
| Retention Period | Duration of business subscription + 90 days |
| Data Recipients | Business administrators, assigned staff members |
| International Transfers | USA (Replit/Neon hosting) — SCCs in place |

### 2.3 Pet Profile Management

| Attribute | Details |
|-----------|---------|
| Processing Activity | Storage of pet information for service delivery |
| Categories of Data Subjects | Pets (associated with client owners) |
| Categories of Personal Data | Pet name, breed, age, behaviour notes, medical notes, photos |
| Purpose | Customise service delivery, ensure pet safety |
| Legal Basis | Contract (service provision) |
| Retention Period | Duration of client relationship + 90 days |
| Data Recipients | Business administrators, assigned staff members |
| International Transfers | USA (Replit/Neon hosting, Object Storage) — SCCs in place |

### 2.4 Booking and Scheduling

| Attribute | Details |
|-----------|---------|
| Processing Activity | Creation and management of service bookings |
| Categories of Data Subjects | Clients, staff members |
| Categories of Personal Data | Names, addresses, booking dates/times, service notes, GPS routes |
| Purpose | Schedule and fulfil pet-care services |
| Legal Basis | Contract (service provision) |
| Retention Period | 7 years (financial record keeping requirement) |
| Data Recipients | Business administrators, assigned staff, client portal |
| International Transfers | USA (Replit/Neon), EU (MapTiler, OpenRouteService) |

### 2.5 Invoicing and Payments

| Attribute | Details |
|-----------|---------|
| Processing Activity | Invoice generation, payment processing, financial reporting |
| Categories of Data Subjects | Clients |
| Categories of Personal Data | Name, email, invoice amounts, payment status, Stripe customer ID |
| Purpose | Billing for services, financial record keeping |
| Legal Basis | Contract, Legal Obligation (financial records) |
| Retention Period | 7 years (UK HMRC requirement) |
| Data Recipients | Stripe (payment processing), business administrators |
| International Transfers | USA (Stripe, Replit/Neon) — SCCs in place |
| Special Measures | AES-256-GCM encryption for sensitive financial data |

### 2.6 Messaging and Communication

| Attribute | Details |
|-----------|---------|
| Processing Activity | In-platform messaging between businesses and clients |
| Categories of Data Subjects | Business administrators, staff, clients |
| Categories of Personal Data | Message content, timestamps, sender/recipient IDs |
| Purpose | Business-client communication regarding services |
| Legal Basis | Contract (service provision) |
| Retention Period | Duration of client relationship + 90 days |
| Data Recipients | Message participants only |
| International Transfers | USA (Replit/Neon hosting) — SCCs in place |

### 2.7 Transactional Emails

| Attribute | Details |
|-----------|---------|
| Processing Activity | Sending system emails (booking confirmations, invoice notifications, password resets) |
| Categories of Data Subjects | All platform users |
| Categories of Personal Data | Name, email address, booking/invoice details |
| Purpose | Essential service communications |
| Legal Basis | Contract (necessary for service delivery) |
| Retention Period | Email logs: 30 days |
| Data Recipients | Resend (email delivery provider) |
| International Transfers | USA (Resend) — SCCs in place |

### 2.8 Media Storage

| Attribute | Details |
|-----------|---------|
| Processing Activity | Storage of photos, documents, and other media |
| Categories of Data Subjects | Pets, clients (via uploaded content) |
| Categories of Personal Data | Photos of pets, profile images, uploaded documents |
| Purpose | Service documentation, pet identification |
| Legal Basis | Contract, Consent (for profile photos) |
| Retention Period | Duration of associated record + 90 days |
| Data Recipients | Business administrators, assigned staff |
| International Transfers | USA (Replit Object Storage) — SCCs in place |
| Special Measures | Signed URLs for access control, file type validation |

### 2.9 Security and Audit Logging

| Attribute | Details |
|-----------|---------|
| Processing Activity | Logging of authentication events, errors, and admin actions |
| Categories of Data Subjects | All platform users |
| Categories of Personal Data | User IDs, IP addresses (sanitised), action types, timestamps |
| Purpose | Security monitoring, debugging, fraud prevention |
| Legal Basis | Legitimate Interest (security and system integrity) |
| Retention Period | 90 days |
| Data Recipients | Platform administrators only |
| International Transfers | USA (Replit/Neon hosting) — SCCs in place |
| Special Measures | PII sanitisation in logs, anonymised aggregation |

### 2.10 Beta Programme Management

| Attribute | Details |
|-----------|---------|
| Processing Activity | Management of beta tester registrations and feedback |
| Categories of Data Subjects | Beta programme participants |
| Categories of Personal Data | Name, email, business name, phone, feedback, referral codes |
| Purpose | Beta programme administration, product improvement |
| Legal Basis | Contract (Beta Agreement), Consent (feedback) |
| Retention Period | Duration of beta + 6 months |
| Data Recipients | Platform administrators |
| International Transfers | USA (Replit/Neon hosting) — SCCs in place |

---

## 3. Technical and Organisational Measures

| Measure | Implementation |
|---------|----------------|
| Encryption in Transit | TLS/HTTPS for all connections |
| Encryption at Rest | AES-256-GCM for financial data |
| Access Control | JWT authentication, role-based permissions |
| Business Isolation | Each business's data is segregated |
| Log Sanitisation | PII redacted from error logs |
| Rate Limiting | Brute force protection on auth endpoints |
| Backup | Managed database backups via Neon |
| Security Headers | CSP, HSTS, X-Frame-Options |

---

## 4. Data Subject Rights Fulfilment

| Right | Implementation | Contact |
|-------|----------------|---------|
| Access | Data export tool, email request | pawtimation.uk@gmail.com |
| Rectification | User profile editing, support request | pawtimation.uk@gmail.com |
| Erasure | GDPR deletion tool, email request | pawtimation.uk@gmail.com |
| Restriction | Account suspension capability | pawtimation.uk@gmail.com |
| Portability | JSON export functionality | pawtimation.uk@gmail.com |
| Objection | Unsubscribe, account deletion | pawtimation.uk@gmail.com |

---

## 5. Third-Party Processors

| Processor | Service | Location | Safeguards | Data Shared |
|-----------|---------|----------|------------|-------------|
| Replit/Neon | Hosting, Database | USA | SCCs | All platform data |
| Stripe | Payments | USA | SCCs, PCI DSS | Customer ID, payment metadata |
| Resend | Email Delivery | USA | SCCs | Email addresses, content |
| MapTiler | Map Tiles | EU | Adequacy | Location coordinates |
| OpenRouteService | Route Calculation | EU | Adequacy | Location coordinates |

---

## 6. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 26 Nov 2025 | Andrew James Beattie | Initial ROPA |

---

*This document is maintained to demonstrate compliance with UK GDPR Article 30.*
