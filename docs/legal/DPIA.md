# Data Protection Impact Assessment (DPIA)

**Document Owner**: Andrew James Beattie  
**Last Reviewed**: 26 November 2025  
**Status**: Internal Document — Not for Public Distribution

---

## 1. Introduction

This Data Protection Impact Assessment (DPIA) evaluates the data protection risks associated with the Pawtimation CRM platform for dog-walking and pet-care businesses.

### 1.1 Purpose

This DPIA is conducted to:
- Identify and assess privacy risks to data subjects
- Document measures to mitigate identified risks
- Demonstrate compliance with UK GDPR and Data Protection Act 2018
- Support accountability and transparency requirements

### 1.2 Scope

This assessment covers:
- Processing of personal data by business administrators, staff, and clients
- Data storage, transmission, and retention practices
- Third-party data sharing and international transfers
- Technical and organisational security measures

---

## 2. Processing Description

### 2.1 Nature of Processing

Pawtimation processes personal data to provide a customer relationship management (CRM) platform for pet-care businesses. Key processing activities include:

| Activity | Data Types | Purpose |
|----------|------------|---------|
| User registration | Name, email, password hash | Account creation and authentication |
| Client management | Name, email, phone, address | Service delivery and communication |
| Pet profiles | Pet name, breed, behaviour, medical notes | Service customisation |
| Booking management | Dates, times, locations, service details | Scheduling and job fulfilment |
| Staff management | Name, email, availability | Job assignment and scheduling |
| Invoicing | Service records, amounts, payment status | Billing and financial records |
| Messaging | Message content, timestamps | Business-client communication |
| Media storage | Photos, documents | Service documentation |

### 2.2 Data Subjects

- **Business Administrators**: Pet-care business owners and managers
- **Staff Members**: Employees of pet-care businesses
- **Clients**: Customers of pet-care businesses (pet owners)

### 2.3 Data Controller/Processor Relationship

- **Pawtimation**: Data Processor
- **Pet-Care Businesses**: Data Controllers (for their client data)
- **Andrew James Beattie**: Platform owner and Data Controller for platform operations

---

## 3. Legal Basis for Processing

| Processing Activity | Legal Basis | Justification |
|--------------------|-------------|---------------|
| Account management | Contract | Necessary to provide the service |
| Booking processing | Contract | Necessary for service delivery |
| Marketing emails | Consent | Opt-in only |
| Security logging | Legitimate Interest | Platform security and fraud prevention |
| Analytics (if enabled) | Consent | Performance improvement |
| Legal compliance | Legal Obligation | UK GDPR, financial regulations |

---

## 4. Risk Assessment

### 4.1 Identified Risks

| Risk | Likelihood | Impact | Overall |
|------|------------|--------|---------|
| Unauthorised access to personal data | Low | High | Medium |
| Data breach via third-party service | Low | High | Medium |
| Excessive data retention | Low | Medium | Low |
| Cross-border transfer compliance | Medium | Medium | Medium |
| Insider threat (staff access) | Low | Medium | Low |
| Loss of data availability | Low | High | Medium |

### 4.2 Risk Mitigation Measures

| Risk | Mitigation Measures |
|------|---------------------|
| Unauthorised access | JWT authentication, RBAC, session management, rate limiting, MFA for platform owner |
| Third-party breach | Vendor due diligence, SCCs for international transfers, minimal data sharing |
| Excessive retention | Retention schedule, GDPR deletion tools, automated anonymisation |
| Cross-border transfers | SCCs with US providers, privacy policy disclosure, monitoring for adequacy decisions |
| Insider threat | Role-based permissions, audit logging, staff isolation by business |
| Data availability | Database backups, Neon managed hosting, error monitoring |

---

## 5. Technical and Organisational Measures

### 5.1 Technical Measures

- **Encryption in Transit**: TLS/HTTPS for all connections
- **Encryption at Rest**: AES-256-GCM for sensitive financial data
- **Authentication**: JWT tokens with secure cookie storage
- **Authorisation**: Role-based access control (ADMIN, STAFF, CLIENT)
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Log Sanitisation**: PII redaction in error logs
- **Input Validation**: Schema validation on all API endpoints

### 5.2 Organisational Measures

- **Access Controls**: Least privilege principle for staff access
- **Business Isolation**: Each business's data is segregated
- **Incident Response**: Error logging and monitoring
- **Training**: Staff onboarding includes data protection awareness
- **Documentation**: Privacy policy, terms of service, this DPIA

---

## 6. Data Subject Rights

Pawtimation provides mechanisms for exercising data subject rights:

| Right | Implementation |
|-------|----------------|
| Right of Access | Data export functionality, support email |
| Right to Rectification | User profile editing, support requests |
| Right to Erasure | GDPR deletion tool, anonymisation option |
| Right to Restrict Processing | Account suspension, support requests |
| Right to Data Portability | JSON data export via GDPR tools |
| Right to Object | Unsubscribe links, account deletion |

---

## 7. International Transfers

### 7.1 Third-Party Processors

| Processor | Location | Purpose | Safeguards |
|-----------|----------|---------|------------|
| Replit/Neon | USA | Hosting & Database | SCCs |
| Stripe | USA | Payment Processing | SCCs, PCI DSS |
| Resend | USA | Email Delivery | SCCs |
| MapTiler | EU | Map Services | EU Adequacy |
| OpenRouteService | EU | Route Calculation | EU Adequacy |

### 7.2 Transfer Mechanisms

- Standard Contractual Clauses (SCCs) approved by UK ICO
- Supplementary measures where required
- Regular monitoring of international transfer legal landscape

---

## 8. Consultation

### 8.1 Internal Stakeholders

- Platform development team
- Business operations

### 8.2 Data Subjects

- Privacy policy accessible to all users
- Contact email for data protection queries
- Cookie consent mechanism for analytics

### 8.3 Supervisory Authority

No consultation with ICO required at this stage as residual risks are assessed as low-medium and adequately mitigated.

---

## 9. Conclusion

This DPIA demonstrates that Pawtimation has:

1. Identified the personal data processed and associated risks
2. Implemented appropriate technical and organisational measures
3. Established lawful bases for all processing activities
4. Provided mechanisms for data subject rights
5. Documented international transfer safeguards

**Residual Risk Assessment**: LOW-MEDIUM

The processing may proceed with the documented safeguards in place.

---

## 10. Review Schedule

This DPIA will be reviewed:
- Annually
- When significant changes are made to processing activities
- Following any data breach or security incident
- Upon changes to relevant legislation

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 26 Nov 2025 | Andrew James Beattie | Initial DPIA |

---

*This is an internal document. For public-facing privacy information, see the Privacy Policy.*
