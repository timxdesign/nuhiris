# NUHIRIS Pilot Support Plan

## Pilot Scope
- **Facilities:** 5 facilities across Lagos and Abuja (2 tertiary, 2 secondary, 1 primary)
- **Duration:** 8 weeks
- **Expected Users:** ~50 providers, ~200 front desk staff, ~5000 patients
- **Go-live Date:** TBD

## Support Structure

### Tier 1 — Facility IT Support (On-site)
- 1 trained IT support per facility
- Handles: login issues, device troubleshooting, basic navigation questions
- Escalates to Tier 2 after 15 minutes unresolved
- Available: facility operating hours

### Tier 2 — NUHIRIS Help Desk (Remote)
- 3 support engineers (2 shifts covering 7am-10pm WAT)
- Handles: system errors, data correction requests, biometric device issues
- Escalates to Tier 3 for bugs/outages
- Contact: WhatsApp group + dedicated phone line
- SLA: 30-minute first response

### Tier 3 — Engineering Team (Remote)
- Core development team
- Handles: bugs, system outages, security incidents
- SLA: P0 = 15 min, P1 = 1 hour, P2 = 4 hours

## Pre-Launch Checklist

- [ ] All pilot facility accounts created in Keycloak
- [ ] Provider credentials distributed securely
- [ ] Biometric devices installed and tested at each facility
- [ ] Geofence boundaries configured for each facility
- [ ] Network connectivity verified (minimum 2 Mbps per facility)
- [ ] Backup internet (mobile hotspot) available at each facility
- [ ] Training completed for all front desk and provider staff
- [ ] Training materials printed and distributed
- [ ] Monitoring dashboards reviewed by ops team
- [ ] Alerting notifications configured (Slack/email/SMS)
- [ ] Runbooks reviewed by on-call team
- [ ] Data backup verified
- [ ] DPIA filed with NDPC
- [ ] Patient consent forms printed and available

## Success Metrics

| Metric | Target |
|--------|--------|
| System uptime | > 99.5% |
| Patient registration success rate | > 95% |
| Biometric verification success rate | > 90% |
| Average registration time | < 3 minutes |
| Encounter open-to-close time | Provider workflow dependent |
| User satisfaction (survey) | > 4/5 |
| Data sync success (mobile) | > 99% |
| Zero data breaches | Mandatory |

## Feedback Collection
- Weekly feedback surveys via WhatsApp for providers
- Monthly facility visits by product team
- Dedicated feedback form in the web portal
- Biweekly review meetings with facility administrators

## Escalation Matrix

| Issue | Contact | Method |
|-------|---------|--------|
| Login / access | Tier 1 (on-site IT) | In-person |
| System error | Tier 2 help desk | WhatsApp / phone |
| Data breach / security | CISO direct | Phone + email |
| Device failure | Tier 2 + device vendor | WhatsApp |
| System outage | Tier 3 engineering | PagerDuty |
