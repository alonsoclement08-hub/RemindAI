# RemindAI — Deployment Guide

## Architecture

```
Internet → Nginx/Caddy (TLS) → API (Node/Express) → PostgreSQL
                                                  → Redis
                                                  → Ollama (Mistral 7B)
Mobile (Expo) ← EAS Build → App Store / Google Play
```

---

## 1. Backend Deployment

### Prerequisites
- Docker & Docker Compose v2
- Domain pointed to your server (e.g. `api.remindai.app`)
- 4 GB RAM minimum (Mistral 7B requires ~3 GB)

### Steps

```bash
# 1. Clone & configure
git clone https://github.com/your-org/remindai-backend
cd remindai-backend
cp .env.production .env.production.local
# Edit .env.production.local — fill in all CHANGE_ME values

# 2. Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_REFRESH_SECRET

# 3. Start services
docker compose --env-file .env.production.local up -d

# 4. Pull Mistral 7B (first start only, ~4 GB)
docker exec -it remindai-backend-ollama-1 ollama pull mistral:7b

# 5. Run database migrations
docker compose exec api npx prisma migrate deploy

# 6. Verify health
curl https://api.remindai.app/api/health
```

Expected health response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 42,
  "responseMs": 3,
  "checks": { "db": true, "redis": true }
}
```

### Environment Variables (`.env.production`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | 64+ char random string |
| `JWT_REFRESH_SECRET` | Different 64+ char random string |
| `OLLAMA_URL` | Ollama server URL (internal: `http://ollama:11434`) |
| `LOG_LEVEL` | `info` in production, `debug` for troubleshooting |
| `PORT` | Default `3000` |

### Managed Services (Recommended)
- **Database**: Supabase (free tier → paid) or Railway
- **Redis**: Upstash (serverless, pay-per-request)
- **Hosting**: Railway, Render, Fly.io, or a VPS (DigitalOcean, Hetzner)
- **Ollama**: Self-hosted VPS with GPU, or use groq.com API as drop-in

### Monitoring

Structured logs are output as JSON (piped to your log aggregator):
```bash
# Local pretty-print
docker compose logs -f api | npx pino-pretty

# Production: ship to Datadog / Grafana Loki / Axiom
docker compose logs -f api | your-log-forwarder
```

Key metrics to alert on:
- `GET /api/health` returning non-200
- Response time p99 > 2s
- Error rate (5xx) > 1%
- Redis memory usage > 80%

---

## 2. Mobile App Deployment

### Prerequisites
- Expo account: https://expo.dev
- EAS CLI: `npm install -g eas-cli`
- Apple Developer account (iOS, $99/year)
- Google Play Console account (Android, $25 one-time)

### EAS Build Setup

```bash
cd remindai-mobile

# Login to Expo
eas login

# Configure project (links to EAS project ID)
eas build:configure

# Build for internal testing
eas build --profile preview --platform all

# Build for production
eas build --profile production --platform all
```

### iOS — TestFlight

```bash
# Submit to App Store Connect (TestFlight)
eas submit --profile production --platform ios

# Or manually: download the .ipa from EAS dashboard
# Upload via Transporter or Xcode Organizer
```

After submission, open App Store Connect → TestFlight → add internal testers.

### Android — Internal Testing

```bash
# Submit to Google Play internal track
eas submit --profile production --platform android

# Or download .aab from EAS and upload manually:
# Play Console → Your app → Internal testing → Create new release
```

### App Store Metadata

| Field | Value |
|---|---|
| **App Name** | RemindAI — Smart Reminders |
| **Subtitle** | AI-powered, works offline |
| **Category** | Productivity |
| **Keywords** | reminder, AI, rappel, offline, smart, schedule |
| **Description** | RemindAI uses Mistral AI to understand natural language reminders in French and English. Create reminders by speaking naturally. Works offline — syncs when you reconnect. |
| **Privacy URL** | https://remindai.app/privacy |
| **Support URL** | https://remindai.app/support |

### Version Bumping

```bash
# Bump version in app.json before each release
# iOS: increment "buildNumber"
# Android: increment "versionCode"
# Both: increment "version" for user-visible changes
```

---

## 3. Production URLs

| Service | URL |
|---|---|
| API | https://api.remindai.app |
| Health check | https://api.remindai.app/api/health |
| iOS App | https://apps.apple.com/app/remindai/idYOUR_APP_ID |
| Android App | https://play.google.com/store/apps/details?id=com.remindai.app |

> Note: Replace placeholder URLs with actual values after store approval.

---

## 4. Security Checklist

- [ ] JWT secrets are 64+ random characters (never committed to git)
- [ ] `.env.production` is in `.gitignore`
- [ ] Database password is strong and unique
- [ ] Redis is not publicly exposed (internal network only)
- [ ] Ollama port `11434` is firewalled (internal only)
- [ ] HTTPS enforced via reverse proxy (Caddy or Nginx)
- [ ] Rate limiting active on all API routes
- [ ] Token blacklist (Redis) clears on logout

---

## 5. Monitoring Dashboard (Grafana)

```bash
# Quick Grafana + Prometheus stack
docker run -d -p 3001:3000 grafana/grafana

# Key dashboards to import:
# - Node.js process metrics (ID: 11159)
# - PostgreSQL metrics (ID: 9628)
# - Redis metrics (ID: 11835)
```

Suggested alerts:
```yaml
- name: API Down
  expr: up{job="remindai-api"} == 0
  severity: critical

- name: High Error Rate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  severity: warning

- name: Slow Responses
  expr: histogram_quantile(0.99, http_request_duration_seconds) > 2
  severity: warning
```
