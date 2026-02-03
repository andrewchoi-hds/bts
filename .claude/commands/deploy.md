# /deploy - Deployment Management

Manage deployments, run pre-deploy checks, and guide deployment process.

## Instructions

You are the **DevOps Agent**. Facilitate safe and successful deployments.

### Usage

```
/deploy [action] [--env=ENV] [--dry-run]
```

### Actions

| Action | Description |
|--------|-------------|
| `check` | Run pre-deployment checklist (default) |
| `status` | Check current deployment status |
| `prepare` | Prepare release (build, test) |
| `rollback` | Guide rollback process |
| `history` | Show deployment history |

### Parameters

- **--env**: Target environment
  - `dev`: Development
  - `staging`: Staging (default)
  - `prod` / `production`: Production
- **--dry-run**: Simulate without executing

### Action: Check (default)

Run comprehensive pre-deployment checklist.

```
/deploy check --env=prod
```

**Output**:
```
## Pre-Deployment Check: Production

**Target**: production
**Branch**: main
**Commit**: abc1234 "feat: add user auth"
**Time**: 2024-01-15 10:30 UTC

---

### 1. Code Quality

| Check | Status | Details |
|-------|--------|---------|
| Tests | ✅ Pass | 156/156 passed |
| Lint | ✅ Pass | No errors |
| Type Check | ✅ Pass | No errors |
| Build | ✅ Pass | Built in 45s |

### 2. Security

| Check | Status | Details |
|-------|--------|---------|
| Dependency Audit | ⚠️ Warn | 2 moderate vulnerabilities |
| Secrets Scan | ✅ Pass | No secrets detected |
| SAST | ✅ Pass | No issues found |

⚠️ **Action Required**: Review dependency vulnerabilities
```bash
npm audit
```

### 3. Environment

| Check | Status | Details |
|-------|--------|---------|
| ENV Variables | ❌ Fail | Missing: STRIPE_KEY |
| Config Files | ✅ Pass | All present |
| Feature Flags | ✅ Pass | 3 flags configured |

❌ **Blocker**: Missing required environment variable
```
STRIPE_KEY - Stripe API key for payments
```

### 4. Database

| Check | Status | Details |
|-------|--------|---------|
| Pending Migrations | ⚠️ Warn | 2 migrations pending |
| Backup Status | ✅ Pass | Backup from 1h ago |
| Connection | ✅ Pass | Database reachable |

⚠️ **Note**: Review migrations before deploying:
```sql
-- 001_add_user_role.sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';

-- 002_add_payments.sql
CREATE TABLE payments (...);
```

### 5. Dependencies

| Check | Status | Details |
|-------|--------|---------|
| External APIs | ✅ Pass | All healthy |
| Cache (Redis) | ✅ Pass | Connected |
| Queue (RabbitMQ) | ✅ Pass | Connected |

---

## Summary

| Category | Status |
|----------|--------|
| Code Quality | ✅ Ready |
| Security | ⚠️ Warnings |
| Environment | ❌ Blocked |
| Database | ⚠️ Warnings |
| Dependencies | ✅ Ready |

**Overall**: ❌ NOT READY FOR DEPLOYMENT

### Blockers (Must Fix)
1. [ ] Add missing STRIPE_KEY environment variable

### Warnings (Should Review)
1. [ ] Review 2 moderate dependency vulnerabilities
2. [ ] Verify database migrations are safe

### Next Steps
1. Fix blockers listed above
2. Run `/deploy check --env=prod` again
3. When all checks pass, proceed with deployment
```

### Action: Status

Check current deployment status.

```
/deploy status --env=prod
```

**Output**:
```
## Deployment Status: Production

### Current Deployment
| Property | Value |
|----------|-------|
| Version | v2.1.0 |
| Commit | abc1234 |
| Deployed | 2024-01-14 15:30 UTC |
| Deployed By | @username |
| Status | 🟢 Healthy |

### Health Checks
| Service | Status | Response |
|---------|--------|----------|
| API | 🟢 Up | 45ms |
| Web | 🟢 Up | 120ms |
| Worker | 🟢 Up | - |

### Metrics (Last 1h)
| Metric | Value | Trend |
|--------|-------|-------|
| Requests | 12,450 | ↑ 5% |
| Errors | 12 (0.1%) | ↓ 2% |
| P95 Latency | 230ms | → 0% |
| CPU | 45% | → 0% |
| Memory | 62% | ↑ 3% |

### Recent Alerts
- None in last 24 hours

### Pending Changes
- 3 commits ahead of production
- 1 migration pending
```

### Action: Prepare

Prepare release for deployment.

```
/deploy prepare --env=staging
```

**Output**:
```
## Preparing Release: Staging

### Step 1: Build
```bash
npm run build
```
✅ Build successful (45s)
- Bundle size: 1.2MB (gzip: 380KB)
- Assets: 15 files

### Step 2: Test
```bash
npm test
```
✅ All tests passed (156/156)

### Step 3: Generate Release Notes
```markdown
## v2.2.0

### Features
- Add OAuth2 authentication (#123)
- Implement rate limiting (#124)

### Bug Fixes
- Fix memory leak in WebSocket handler (#125)

### Breaking Changes
- None
```

### Step 4: Create Git Tag
```bash
git tag -a v2.2.0 -m "Release v2.2.0"
```
✅ Tag created

### Release Ready

**Version**: v2.2.0
**Artifacts**:
- Docker image: `ghcr.io/org/app:v2.2.0`
- Build: `.next/` (12MB)

### Deploy Commands

**Staging**:
```bash
# Via GitHub Actions
gh workflow run deploy.yml -f environment=staging -f version=v2.2.0

# Via CLI
kubectl set image deployment/app app=ghcr.io/org/app:v2.2.0 -n staging
```

**Production** (after staging verification):
```bash
gh workflow run deploy.yml -f environment=production -f version=v2.2.0
```
```

### Action: Rollback

Guide through rollback process.

```
/deploy rollback --env=prod
```

**Output**:
```
## Rollback Guide: Production

### Current State
- **Current Version**: v2.2.0 (deployed 2h ago)
- **Previous Version**: v2.1.0

### ⚠️ Rollback Checklist

Before rolling back, verify:
- [ ] Issue is confirmed in production
- [ ] Rollback will fix the issue
- [ ] No database migrations that can't be reversed
- [ ] Stakeholders notified

### Database Considerations

**Migrations in v2.2.0**:
```sql
-- 001_add_payments.sql (REVERSIBLE)
CREATE TABLE payments (...);
-- Rollback: DROP TABLE payments;
```

⚠️ **Warning**: If payments table has data, consider:
1. Keep table, rollback code only
2. Export data before dropping

### Rollback Commands

**Option 1: Redeploy Previous Version**
```bash
# GitHub Actions
gh workflow run deploy.yml -f environment=production -f version=v2.1.0

# Kubernetes
kubectl set image deployment/app app=ghcr.io/org/app:v2.1.0 -n production
```

**Option 2: Git Revert (for hotfix)**
```bash
git revert HEAD --no-commit
git commit -m "Revert: rollback v2.2.0 changes"
git push origin main
# Then deploy
```

### Post-Rollback

1. [ ] Verify rollback successful
2. [ ] Check health endpoints
3. [ ] Monitor error rates
4. [ ] Create incident report
5. [ ] Plan fix for next release
```

### Action: History

Show deployment history.

```
/deploy history --env=prod
```

**Output**:
```
## Deployment History: Production

| Version | Deployed | By | Status | Duration |
|---------|----------|-----|--------|----------|
| v2.2.0 | 2024-01-15 10:30 | @dev1 | 🟢 Active | 2h |
| v2.1.0 | 2024-01-10 14:00 | @dev2 | ⬜ Previous | 5d |
| v2.0.1 | 2024-01-05 09:00 | @dev1 | ⬜ Archived | 5d |
| v2.0.0 | 2024-01-01 00:00 | @dev1 | ⬜ Archived | 4d |

### v2.2.0 Details
```
Commit: abc1234
Message: feat: add OAuth2 authentication

Changes:
- 15 files changed
- +450 / -120 lines
- 2 migrations

Deployment:
- Duration: 3m 45s
- Downtime: 0s (rolling update)
```

### Quick Actions
- Rollback to v2.1.0: `/deploy rollback --env=prod --version=v2.1.0`
- Compare versions: `git diff v2.1.0..v2.2.0`
```

### CI/CD Integration

Detects and integrates with:
- **GitHub Actions**: `.github/workflows/`
- **GitLab CI**: `.gitlab-ci.yml`
- **CircleCI**: `.circleci/config.yml`
- **Jenkins**: `Jenkinsfile`

### Environment Configuration

```yaml
# Expected environment structure
environments:
  dev:
    url: https://dev.example.com
    auto_deploy: true
    approvals: 0

  staging:
    url: https://staging.example.com
    auto_deploy: true
    approvals: 0

  production:
    url: https://example.com
    auto_deploy: false
    approvals: 1
    protected: true
```

### Error Handling

**No CI/CD configuration**:
```
## Warning: No CI/CD Detected

No CI/CD configuration found.

### Manual Deployment Checklist
1. [ ] Run tests locally
2. [ ] Build application
3. [ ] Run security scan
4. [ ] Deploy to server
5. [ ] Verify deployment
6. [ ] Monitor for errors

### Recommended Setup
Add CI/CD with: `/doc --type=cicd`
```

## Examples

**Pre-deploy check**:
```
/deploy check --env=prod
```

**Check staging status**:
```
/deploy status --env=staging
```

**Prepare release**:
```
/deploy prepare --env=prod
```

**Rollback production**:
```
/deploy rollback --env=prod
```

**Dry run check**:
```
/deploy check --env=prod --dry-run
```

## Notes

- Always run checks before production deploys
- Use staging to verify before production
- Keep rollback plan ready
- Monitor after every deployment
- Document incidents for learning
