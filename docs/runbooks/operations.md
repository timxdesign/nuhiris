# NUHIRIS Operations Runbook

## 1. Deployment

### Rolling Deploy (API)
```bash
kubectl set image deployment/nuhiris-api api=nuhiris/api:<new-tag> -n nuhiris
kubectl rollout status deployment/nuhiris-api -n nuhiris
```

### Rollback
```bash
kubectl rollout undo deployment/nuhiris-api -n nuhiris
kubectl rollout status deployment/nuhiris-api -n nuhiris
```

### Web Portal Deploy
```bash
kubectl set image deployment/nuhiris-web web=nuhiris/web:<new-tag> -n nuhiris
kubectl rollout status deployment/nuhiris-web -n nuhiris
```

## 2. Database Operations

### Run Migrations
```bash
kubectl exec -it deployment/nuhiris-api -n nuhiris -- npx typeorm migration:run -d dist/config/typeorm-cli.config.js
```

### Create Backup
```bash
pg_dump -h <rds-endpoint> -U nuhiris_admin -d nuhiris -F c -f backup-$(date +%Y%m%d).dump
```

### Restore from Backup
```bash
pg_restore -h <rds-endpoint> -U nuhiris_admin -d nuhiris -c backup-YYYYMMDD.dump
```

### Check Connection Pool
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'nuhiris';
```

## 3. Monitoring & Alerts

### Check API Health
```bash
curl -s https://api.nuhiris.health.gov.ng/health | jq .
```

### View Prometheus Metrics
```bash
curl -s https://api.nuhiris.health.gov.ng/metrics
```

### Grafana Dashboard
- URL: `https://grafana.nuhiris.health.gov.ng`
- Main dashboard: "NUHIRIS Overview"
- Check: Error rate < 1%, Latency p95 < 500ms

### Common Alerts & Response

| Alert | Severity | Response |
|-------|----------|----------|
| HighErrorRate (>5% 5xx) | Critical | Check API logs: `kubectl logs -l app=nuhiris-api -n nuhiris --tail=100`. Rollback if deploy-related. |
| HighLatency (>2s avg) | Warning | Check DB connections and Redis. Scale API replicas if CPU-bound. |
| APIDown | Critical | Check pod status: `kubectl get pods -n nuhiris`. Restart if OOMKilled. |
| PostgresDown | Critical | Check RDS console. Failover to standby if multi-AZ. |
| AuditWriteFailure | Critical | IMMEDIATE: Audit logging is a compliance requirement. Check DB disk space and connections. |
| HighAuthFailureRate | Warning | Possible brute force. Check IPs in audit log. Consider temporary IP block. |

## 4. Scaling

### Manual Scale API
```bash
kubectl scale deployment/nuhiris-api --replicas=5 -n nuhiris
```

### HPA is configured for production (auto-scales 3-10 replicas based on CPU/memory)

## 5. Vault Operations

### Check Vault Status
```bash
vault status -address=http://vault:8200
```

### Rotate Encryption Keys
```bash
vault write -f transit/keys/nuhiris-column-key/rotate
```

### Read Current Secrets (admin only)
```bash
vault kv get secret/nuhiris
```

## 6. Redis Operations

### Check Memory
```bash
redis-cli -h redis -a $REDIS_PASSWORD INFO memory
```

### Flush Cache (if stale data suspected)
```bash
redis-cli -h redis -a $REDIS_PASSWORD FLUSHDB
```

## 7. Incident Response

### Severity Levels
- **P0 (Critical):** System down, data breach → Immediate response, notify CISO
- **P1 (High):** Major feature broken → Response within 30 minutes
- **P2 (Medium):** Degraded performance → Response within 2 hours
- **P3 (Low):** Minor issue → Next business day

### Data Breach Procedure
1. Contain: Isolate affected service
2. Assess: Determine data exposed, number of records
3. Notify: CISO → NDPC (within 72 hours per NDPA 2023) → Affected patients
4. Remediate: Fix vulnerability, rotate secrets
5. Document: Full incident report with timeline
