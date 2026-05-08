# SEMAINE 3 — ARCHITECTURE BACKEND & TECH STACK
**RemindAI • Mois 1**

---

## OBJECTIFS SEMAINE 3

1. ✅ Concevoir l'architecture globale (user → API → Ollama → DB)
2. ✅ Choisir le stack technique (Frontend + Backend)
3. ✅ Définir la database schema
4. ✅ Planifier l'intégration Ollama
5. ✅ Spécifier les endpoints API

---

## ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                    VOTRE SERVEUR CENTRALISÉ                 │
│                   (DigitalOcean/Hetzner 4GB)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  OLLAMA LOCAL    │  │   BACKEND    │  │  DATABASE    │  │
│  │                  │  │              │  │              │  │
│  │ • Mistral 7B     │  │ Node/Express │  │ PostgreSQL   │  │
│  │ • Llama 2 13B    │  │              │  │              │  │
│  │ • Fine-tuned     │  │ • Auth (JWT) │  │ • Users      │  │
│  │                  │  │ • API Routes │  │ • Reminders  │  │
│  │ (localhost:11434)│  │ • Sync logic │  │ • Logs       │  │
│  │                  │  │              │  │              │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
│           ▲                    ▲                   ▲         │
│           │                    │                   │         │
│           └────────────────────┼───────────────────┘         │
│                                │                             │
│            Internal HTTP API (localhost only)                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS API
                          │ (users → backend)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              APP MOBILE (Chaque utilisateur)                 │
│          (iOS/Android • React Native ou Swift)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  STOCKAGE LOCAL  │  │     SYNC ENGINE                  │ │
│  │                  │  │                                  │ │
│  │ • SQLite         │  │ • Upload: local reminders → API │ │
│  │ • Reminders      │  │ • Download: API → local         │ │
│  │ • Settings       │  │ • Conflict resolution           │ │
│  │ • Cache          │  │ • Offline queue                 │ │
│  │                  │  │                                  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS (encrypted)
                          │
                          ▼
┌──────────────────────────────────────┐
│      External Services (Optional)    │
│                                      │
│ • Gmail/Outlook (OAuth) — v1.1      │
│ • Slack (OAuth) — v1.1              │
│ • Firebase (push notifs)             │
│ • Sentry (error tracking)            │
│                                      │
└──────────────────────────────────────┘
```

---

## TECH STACK RECOMMANDÉ

### Backend
```
Framework:    Node.js + Express (ou Python + FastAPI)
Runtime:      Node 18+
Database:     PostgreSQL 14+
Cache:        Redis (pour rate limiting + session)
ORM:          Prisma (Node) ou SQLAlchemy (Python)
Auth:         JWT (AccessToken + RefreshToken)
Testing:      Jest + Supertest
Deployment:   Docker + Docker Compose
```

**Pourquoi Node/Express:**
- ✅ JavaScript end-to-end (même langage frontend/backend)
- ✅ Excellent pour les APIs REST
- ✅ Écosystème riche (100k+ packages)
- ✅ Hot reload en dev
- ✅ Facile à déployer sur DigitalOcean

**Alternative: Python/FastAPI**
- ✅ Si tu veux ML/AI plus tard (pandas, scikit-learn)
- ❌ Mais pour MVP pur API, Node est plus rapide

### Frontend Mobile

**Option A: React Native** (Recommandé pour MVP)
```
Framework:    React Native
State:        Redux ou Zustand
Navigation:   React Navigation
Database:     SQLite (via expo-sqlite)
Sync:         Custom sync engine
Testing:      Jest + Detox
Platform:     iOS + Android en parallèle
```

**Avantages:**
- ✅ Code partagé iOS/Android
- ✅ Hot reload en dev
- ✅ Très populaire (beaucoup de resources)
- ✅ Communauté énorme

**Option B: Swift Native** (iOS only)
```
Framework:    SwiftUI
Database:     CoreData ou SQLite (GRDB)
Sync:         custom
Testing:      XCTest
Platform:     iOS only
```

**Avantages:**
- ✅ Performance native
- ✅ Design super clean (tu as le design déjà)
- ❌ iOS only (pas Android)
- ❌ Plus de code à écrire

**Recommendation:** React Native MVP (speed), puis Swift natif si ça marche

### Frontend Web (optional v1.1)
```
Framework:    React + Vite
State:        Zustand
Styling:      Tailwind CSS
Build:        Vite
Testing:      Vitest
```

---

## DATABASE SCHEMA

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  tier VARCHAR(50) DEFAULT 'free', -- free | pro | business
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reminders table
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- work, personal, health, errand, habit
  scheduled_at TIMESTAMP,
  due_at TIMESTAMP,
  completed_at TIMESTAMP,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule VARCHAR(255), -- RRULE format
  priority INTEGER DEFAULT 1, -- 1=low, 2=normal, 3=high, 4=urgent
  location VARCHAR(255),
  lat FLOAT,
  lng FLOAT,
  context_ai TEXT, -- "J'ai trouvé un brouillon Notion..."
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX(user_id),
  INDEX(scheduled_at)
);

-- Suggestions table (AI-generated suggestions)
CREATE TABLE suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reminder_id INTEGER REFERENCES reminders(id),
  type VARCHAR(50), -- auto_generated, manual_input
  title VARCHAR(255),
  reason TEXT, -- "Tu n'as pas répondu à Jean depuis 48h"
  created_at TIMESTAMP DEFAULT NOW(),
  accepted BOOLEAN DEFAULT NULL,
  accepted_at TIMESTAMP
);

-- Sync logs (for offline-first sync)
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(50), -- create, update, delete
  reminder_id INTEGER,
  sync_status VARCHAR(50), -- pending, synced, conflict
  client_timestamp TIMESTAMP,
  server_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification history (for tracking sent notifs)
CREATE TABLE notification_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reminder_id INTEGER NOT NULL REFERENCES reminders(id),
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  platform VARCHAR(50) -- ios, android, web
);
```

---

## API ENDPOINTS (MVP)

### Auth
```
POST   /api/auth/signup          — Register
POST   /api/auth/login           — Login + get JWT
POST   /api/auth/refresh         — Refresh access token
POST   /api/auth/logout          — Logout (invalidate token)
```

### Reminders (CRUD)
```
GET    /api/reminders            — List all user reminders
POST   /api/reminders            — Create new reminder
GET    /api/reminders/:id        — Get single reminder
PUT    /api/reminders/:id        — Update reminder
DELETE /api/reminders/:id        — Delete reminder
PATCH  /api/reminders/:id/complete — Mark as done
PATCH  /api/reminders/:id/snooze — Snooze reminder (+15min, tomorrow, etc.)
```

### Suggestions
```
GET    /api/suggestions          — Get current suggestions
POST   /api/suggestions/:id/accept — Accept a suggestion (creates reminder)
DELETE /api/suggestions/:id      — Dismiss suggestion
```

### Sync
```
POST   /api/sync                 — Bi-directional sync (upload + download changes)
```

### User Settings
```
GET    /api/user/profile         — Get user profile
PUT    /api/user/profile         — Update profile
GET    /api/user/settings        — Get notification settings
PUT    /api/user/settings        — Update settings
```

---

## OLLAMA INTEGRATION

### Setup (Semaine 3)
```bash
# On your server, install Ollama
curl https://ollama.ai/install.sh | sh

# Pull models
ollama pull mistral:7b
ollama pull llama2:13b

# Ollama runs on localhost:11434 (no auth needed, internal only)
```

### Backend Integration (Node)
```javascript
const axios = require('axios');

async function generateAIContext(reminder) {
  const prompt = `
    Task: ${reminder.title}
    When: ${reminder.scheduled_at}
    Category: ${reminder.category}
    
    Generate a smart context (1-2 sentences) explaining why this task matters
    or what the user should know about it.
    
    Be concise, friendly, and helpful.
  `;
  
  const response = await axios.post(
    'http://localhost:11434/api/generate',
    {
      model: 'mistral:7b',
      prompt: prompt,
      stream: false,
    }
  );
  
  return response.data.response;
}
```

### What Ollama Does (MVP)
- ✅ Generate "Contexte IA" on each reminder
- ✅ Parse natural language (task, when, where, who)
- ✅ Generate daily summary ("Tu as 3 choses urgentes")
- ❌ Proactive detection — NOT in MVP (v1.1)

### Caching Strategy (Critical!)
```javascript
// Don't call Ollama for every reminder — cache heavily!

const redis = require('redis');
const client = redis.createClient();

async function getOrGenerateContext(reminder) {
  const cacheKey = `context:${reminder.id}`;
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) return cached;
  
  // If not cached, generate with Ollama
  const context = await generateAIContext(reminder);
  
  // Cache for 24 hours
  await client.setex(cacheKey, 86400, context);
  
  return context;
}
```

**Why caching?**
- Ollama inference = ~2-5 seconds per call
- If you call it for 10 reminders = 20-50 seconds = too slow
- Caching = instant, users happy

---

## SYNC STRATEGY (Offline-First)

### How it works:
```
1. User creates reminder locally (on phone)
   → stored in SQLite immediately
   → user sees it instantly

2. App syncs in background (wifi + charging)
   → uploads to server
   → downloads any changes from other devices

3. If offline:
   → keep creating/editing locally
   → sync happens when connection back

4. Conflict resolution:
   → last-write-wins (server timestamp wins)
   → user can manual resolve if needed
```

### Sync Logic (Backend)
```javascript
POST /api/sync
Body: {
  client_timestamp: 1234567890,
  changes: [
    { action: 'create', reminder: {...} },
    { action: 'update', id: 5, reminder: {...} },
    { action: 'delete', id: 3 }
  ]
}

Response: {
  server_timestamp: 1234567900,
  applied: 3,
  conflicts: [],
  server_changes: [
    { action: 'create', id: 10, reminder: {...} }
  ]
}
```

---

## SECURITY CONSIDERATIONS

### Authentication
```
✅ JWT tokens (access + refresh)
✅ Refresh token rotation (new token per refresh)
✅ Secure storage (HTTP-only cookies for web)
✅ CORS properly configured
```

### Data Protection
```
✅ All data encrypted in transit (HTTPS only)
✅ Passwords hashed (bcrypt, not plain)
✅ Database encryption at rest (optional, tier 2)
✅ User data isolation (user A cannot see user B's data)
```

### Rate Limiting
```
✅ Limit API calls per user (100 requests/min)
✅ Limit login attempts (3 fails = 15min lockout)
✅ Rate limit Ollama calls (per user/day quota)
```

---

## DEPLOYMENT ARCHITECTURE

### Dev Environment (Your machine)
```
Docker Compose:
  - Node backend (port 3000)
  - PostgreSQL (port 5432)
  - Redis (port 6379)
  - Ollama (port 11434)

docker-compose up -d
```

### Production (DigitalOcean/Hetzner)
```
Server: 4GB RAM, 2 CPU, 50GB SSD (month 1-6)
Upgrade to: 8GB RAM + GPU if needed (month 7+)

Services:
  - Docker container with backend
  - PostgreSQL (managed database optional)
  - Redis (optional, can use in-memory)
  - Ollama (runs on main server)
  - Nginx (reverse proxy, SSL)

Monitoring:
  - Sentry (error tracking)
  - Prometheus (metrics)
  - Uptime.com (health checks)
```

---

## DECISION MATRIX

| Component | Option A | Option B | **Choice** |
|-----------|----------|----------|-----------|
| Backend | Node/Express | Python/FastAPI | **Node** (faster MVP) |
| Frontend | React Native | Swift Native | **React Native** (MVP), Swift later |
| Database | PostgreSQL | MySQL | **PostgreSQL** (better for json) |
| Cache | Redis | Memcached | **Redis** (more flexible) |
| Deployment | Docker | Heroku | **Docker** (more control) |
| LLM | Ollama | Replicate | **Ollama** (local = zero cost) |

---

## NEXT STEPS (Semaine 3 Concrètement)

### Tasks:
1. ✅ Validate this architecture with Claude Pro
2. ✅ Create docker-compose.yml for local dev
3. ✅ Initialize Node project (package.json)
4. ✅ Setup PostgreSQL schema (migrations)
5. ✅ Plan API routes in detail

### Deliverables:
- ✅ architecture.md (ce doc)
- ✅ tech_stack.md (choix justifiés)
- ✅ database_schema.sql (create tables)
- ✅ api_spec.openapi.yaml (endpoints détaillés)
- ✅ docker-compose.yml (dev setup)

---

**FIN SEMAINE 3 ✅**

Prêt pour **Semaine 4**: Backend Core Implementation (Auth + CRUD)
