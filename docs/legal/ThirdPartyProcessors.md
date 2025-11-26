# Third-Party Data Processors

**Last Updated**: 26 November 2025  
**Document Owner**: Andrew James Beattie / Pawtimation

---

## Overview

This document lists all third-party services that process personal data on behalf of Pawtimation. Each processor has been assessed for GDPR compliance and appropriate safeguards are in place for international data transfers.

---

## Processor List

### 1. Replit / Neon Database

| Attribute | Details |
|-----------|---------|
| **Service Provider** | Replit, Inc. / Neon |
| **Purpose** | Application hosting and PostgreSQL database |
| **Location** | United States |
| **Data Processed** | All platform data (user accounts, business data, clients, pets, bookings, invoices, messages) |
| **Transfer Safeguards** | Standard Contractual Clauses (SCCs) |
| **Security Measures** | Managed infrastructure, encrypted connections, access controls |
| **Privacy Policy** | https://replit.com/site/privacy |

---

### 2. Stripe

| Attribute | Details |
|-----------|---------|
| **Service Provider** | Stripe, Inc. |
| **Purpose** | Payment processing and subscription management |
| **Location** | United States (with EU processing available) |
| **Data Processed** | Stripe customer IDs, payment metadata, subscription status |
| **Data NOT Processed by Pawtimation** | Card numbers, CVV, bank account details (handled directly by Stripe) |
| **Transfer Safeguards** | Standard Contractual Clauses (SCCs), PCI DSS Level 1 compliance |
| **Security Measures** | PCI DSS, encryption, fraud detection |
| **Privacy Policy** | https://stripe.com/privacy |

---

### 3. Resend

| Attribute | Details |
|-----------|---------|
| **Service Provider** | Resend, Inc. |
| **Purpose** | Transactional email delivery |
| **Location** | United States |
| **Data Processed** | Email addresses, email content (booking confirmations, invoice notifications, password resets) |
| **Transfer Safeguards** | Standard Contractual Clauses (SCCs) |
| **Security Measures** | TLS encryption, SPF/DKIM/DMARC authentication |
| **Privacy Policy** | https://resend.com/legal/privacy-policy |

---

### 4. MapTiler

| Attribute | Details |
|-----------|---------|
| **Service Provider** | MapTiler AG |
| **Purpose** | Map tile rendering for location-based features |
| **Location** | Switzerland (EU adequacy decision applies) |
| **Data Processed** | Geographic coordinates (for map display only), browser metadata |
| **Transfer Safeguards** | EU Adequacy Decision (Switzerland) |
| **Security Measures** | HTTPS delivery, API key authentication |
| **Privacy Policy** | https://www.maptiler.com/privacy-policy/ |

---

### 5. OpenRouteService

| Attribute | Details |
|-----------|---------|
| **Service Provider** | HeiGIT gGmbH (Heidelberg Institute for Geoinformation Technology) |
| **Purpose** | Walking route calculation and optimisation |
| **Location** | Germany (EU) |
| **Data Processed** | Geographic coordinates (pickup/dropoff locations) |
| **Transfer Safeguards** | EU Processing (no international transfer) |
| **Security Measures** | HTTPS API, rate limiting |
| **Privacy Policy** | https://openrouteservice.org/privacy-policy/ |

---

### 6. Replit Object Storage

| Attribute | Details |
|-----------|---------|
| **Service Provider** | Replit, Inc. |
| **Purpose** | File and media storage (pet photos, documents) |
| **Location** | United States |
| **Data Processed** | Uploaded files (photos, documents), file metadata |
| **Transfer Safeguards** | Standard Contractual Clauses (SCCs) |
| **Security Measures** | Signed URLs for access control, file type validation |
| **Privacy Policy** | https://replit.com/site/privacy |

---

## Transfer Mechanisms

### Standard Contractual Clauses (SCCs)

For US-based processors, Pawtimation relies on the UK ICO-approved Standard Contractual Clauses to ensure adequate protection for personal data transferred outside the UK.

### EU Adequacy Decisions

For EU and EEA-based processors, transfers are covered under the UK's adequacy decision recognising the EU as providing adequate data protection.

---

## Processor Assessment Criteria

Before engaging a third-party processor, Pawtimation assesses:

1. **Data Protection Compliance** - Processor's GDPR/data protection policies
2. **Security Measures** - Technical safeguards (encryption, access controls)
3. **Transfer Mechanisms** - Appropriate safeguards for international transfers
4. **Data Minimisation** - Whether only necessary data is shared
5. **Breach Notification** - Processor's incident response procedures
6. **Subprocessors** - Whether processor uses additional subprocessors

---

## Changes to Processors

| Date | Change | Reason |
|------|--------|--------|
| Nov 2025 | Initial documentation | Platform launch |

---

## Contact

For questions about third-party data processing:

**Email**: pawtimation.uk@gmail.com

---

*This document supports the Pawtimation Privacy Policy and ROPA.*
