# REMINDAI — EVERYTHING IN ONE
**Le projet complet en un seul document**

---

# 📖 TABLE OF CONTENTS

1. **PROJECT OVERVIEW** — Quoi, pourquoi, comment
2. **PERSONAS & PROBLEMS** — Thomas et Julie
3. **ARCHITECTURE** — Système complet
4. **TECH STACK** — Technos choisies
5. **BUSINESS MODEL** — Freemium pricing
6. **WEEKS 1-8** — Implementation roadmap
7. **EXECUTION GUIDE** — Checklist quotidienne
8. **QUICK REFERENCE** — Tech ref rapide

---

# 1️⃣ PROJECT OVERVIEW

## 🎯 THE IDEA
**RemindAI = L'app qui détecte ce que tu dois faire et te le rappelle au bon moment**

### Problem
- People forget important things
- Existing apps (Todoist, Things, Apple) = tu crées manuellement
- **Solution: L'app détecte ce que tu oublies ET te le suggère**

### Positioning
"L'IA qui pense à ta place" — Pas un task manager, un assistant proactif

### Timeline
- **8 weeks total**
- **Month 1 (W1-4):** Backend core
- **Month 2 (W5-8):** Frontend + Features + Launch
- **After 8 weeks:** Ready for App Store

---

# 2️⃣ PERSONAS & PROBLEMS

## 👨‍💼 THOMAS — Le Freelancer

**Profile:**
- Age: 35 ans
- Job: Consultant/Developer (5-10 clients)
- Income: 3-5k€/month
- Problem: Loses follow-ups, forgets emails for 1-2 weeks
- Tech-savvy: Yes (Slack, Notion, Gmail)

**Pain Points:**
- Manages 5-10 clients simultaneously
- Emails piling up without response
- Loses money when forgets client follow-ups
- No system = chaos

**Key Use Case:**
> "Client Jean emails Monday 10am. I don't reply. Wednesday, RemindAI says 'Email from Jean 48h ago — call him now'. I see reminder, call him, deal saved, client happy."

**Willingness to Pay:** 4.99€/month = easy (saves 100€+ in lost clients)

---

## 👩‍💼 JULIE — La Manager

**Profile:**
- Age: 40 ans
- Job: Product Manager / Ops Lead (startup)
- Income: 50-70k€/year
- Problem: Juggles work + 2 kids, forgets appointments
- Tech-savvy: Moderate (Outlook, Teams, Calendar)

**Pain Points:**
- Work + 2 kids + personal = constant juggling
- Forgets doctor appointments, grocery shopping, homework
- Constant stress and mental overload
- No time to organize reminders

**Key Use Case:**
> "Friday 5pm, RemindAI says 'Parcel pickup closes at 6pm, you pass by at 5:45pm'. I get reminder, pick it up, no stress."

**Willingness to Pay:** 4.99€/month = justifiable if really helps

---

## 📊 USE STORIES (HIGH LEVEL)

### Thomas's Stories
1. Create reminder by voice: "Call Jean tomorrow 3pm" → Done in 30 sec
2. AI suggests: "Jean emailed 48h ago" → Add reminder + context
3. Swipe right to complete → Satisfying, instant
4. Offline creation → Syncs when online
5. Settings: quiet hours, notification tone

### Julie's Stories
1. Geo-reminder: "Pass Carrefour Friday 5:45pm → Pick colis"
2. Daily summary: "3 urgent tasks today"
3. Recurring habit: "Meditate 10min every morning 8am"
4. Quiet hours: No notifs after 8pm
5. Calendar integration: Shows context ("Board at 9:30am")

---

# 3️⃣ ARCHITECTURE

## 🏗️ SYSTEM DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR SERVER (4GB)                        │
│                   (DigitalOcean/Hetzner)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   OLLAMA     │  │   BACKEND    │  │  DATABASE    │       │
│  │              │  │              │  │              │       │
│  │ Mistral 7B   │  │ Node/Express │  │ PostgreSQL   │       │
│  │ Llama 2 13B  │  │              │  │              │       │
│  │              │  │ • Auth       │  │ • Users      │       │
│  │ Generate:    │  │ • CRUD       │  │ • Reminders  │       │
│  │ • Context    │  │ • API routes │  │ • Sync logs  │       │
│  │ • Summaries  │  │ • Sync logic │  │ • Analytics  │       │
│  │              │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│           ▲                 ▲                 ▲               │
│           └─────────────────┼─────────────────┘               │
│                    Internal HTTP (localhost)                 │
│                                                               │
│  ┌──────────────────────────────────────────┐               │
│  │         Redis Cache (optional)            │               │
│  │ • AI context cache (24h TTL)              │               │
│  │ • Session tokens                          │               │
│  │ • Rate limiting                           │               │
│  └──────────────────────────────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
              ▲
              │ HTTPS (encrypted)
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              USER'S PHONE (iOS + Android)                  │
│              (React Native App)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐  ┌─────────────────────────────┐ │
│  │   LOCAL STORAGE      │  │    SYNC ENGINE              │ │
│  │                      │  │                             │ │
│  │ • SQLite DB          │  │ • Upload changes → server   │ │
│  │ • Reminders          │  │ • Download server changes   │ │
│  │ • Settings           │  │ • Conflict resolution       │ │
│  │ • Cache              │  │ • Offline queue             │ │
│  │                      │  │                             │ │
│  └──────────────────────┘  └─────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 DATA FLOW

1. **User creates reminder locally** (on phone)
   - Stored immediately in SQLite
   - User sees it instantly (offline works!)

2. **App syncs in background** (WiFi + charging optimal)
   - Uploads to server
   - Downloads any changes from other devices
   - Resolves conflicts (last-write-wins)

3. **Server stores in PostgreSQL**
   - Persists user's data
   - Accessible from other devices
   - Ready for Ollama AI processing

4. **AI processes reminder** (Ollama on server)
   - Generates context ("Jean is waiting for...")
   - Caches result in Redis (24h)
   - Fast next time (< 1ms)

5. **Notification sent at right time**
   - Respects quiet hours
   - Groups intelligently
   - Pushes via Firebase Cloud Messaging

---

# 4️⃣ TECH STACK

## ⚙️ BACKEND LAYER

| Component | Tech | Why |
|-----------|------|-----|
| **Runtime** | Node.js 18+ | Fast, JS everywhere, easy deploy |
| **Framework** | Express.js | Lightweight, flexible, proven |
| **Database** | PostgreSQL 14+ | Relational, reliable, JSON support |
| **Cache** | Redis | Sessions, AI context cache, rate limiting |
| **ORM** | Prisma | Type-safe, migrations, fast dev |
| **Auth** | JWT | Stateless, mobile-friendly, secure |
| **Password** | bcrypt | Industry standard, secure hashing |
| **Testing** | Jest + Supertest | Complete unit + integration testing |
| **Deployment** | Docker + Docker Compose | Consistent across machines |

## 🧠 AI LAYER

| Component | Tech | Why |
|-----------|------|-----|
| **LLM** | Ollama (Mistral 7B) | Local = zero cost (vs 1000€/month Claude API) |
| **Models** | Mistral 7B, Llama 2 13B | Fast inference, good French support |
| **Inference** | localhost:11434 | Private, fast, no API calls needed |
| **Caching** | Redis (24h TTL) | AI contexts cached heavily |

## 📱 FRONTEND LAYER

| Component | Tech | Why |
|-----------|------|-----|
| **Framework** | React Native | iOS + Android same codebase |
| **State** | Zustand | Minimal, easy, performant |
| **Navigation** | React Navigation | Standard RN navigation library |
| **Local Storage** | SQLite | Offline-first, reliable |
| **API Client** | Axios | Promise-based, interceptors for JWT |
| **State Mgmt** | Zustand | Simple + powerful |
| **Testing** | Jest + Detox | Unit + e2e tests |
| **Build** | Expo / EAS | Simplified mobile development |

## 🔐 SECURITY LAYER

| Aspect | Implementation | Why |
|--------|-----------------|-----|
| **HTTPS** | SSL certificate | All traffic encrypted |
| **Passwords** | bcrypt 10 rounds | Industry standard |
| **Tokens** | JWT (1h access, 7d refresh) | Stateless, secure |
| **Token Storage** | SecureStore (not AsyncStorage) | Encrypted on device |
| **Database** | Encryption at rest | Optional tier 2 |
| **User Isolation** | All queries filtered by user_id | No data leaks |
| **Rate Limiting** | 100 req/min per user | Prevent abuse |
| **Auth Attempts** | 3 fails = 15min lockout | Prevent brute force |

---

# 5️⃣ BUSINESS MODEL

## 💰 FREEMIUM STRATEGY

### FREE TIER
**Limit:** 20 active reminders (simultaneously)

**Why 20?**
- Thomas (5-10 clients) → 5-10 reminders → hits limit in 2-3 weeks
- Julie (15 reminders) → 15 reminders → hits limit quickly
- Generous enough to test → Natural conversion

**Features:**
- ✅ Unlimited reminder creation
- ✅ Basic notifications
- ✅ Daily AI summary
- ✅ 3 voice commands/day
- ❌ NO proactive detection
- ❌ NO geo-reminders
- ❌ NO integrations

**Segment:** Testers + light users (0-30% conversion)

---

### PRO TIER
**Price:** 4.99€/month

**Why 4.99€?**
- Less than a coffee/day
- Psychological sweet spot for consumer SaaS
- At 100k users, 5% conversion = 2,500€/month
- At 1M users, 5% conversion = 25k€/month

**Conversion Trigger:**
- User hits 20 reminders → Paywall auto-shows
- NPS > 50 before paywall (don't annoy if app not good)

**Features:**
- ✅ Unlimited reminders
- ✅ Unlimited voice input
- ✅ Geo-reminders (precise location + travel time)
- ✅ Proactive detection (Gmail, Slack, calendar)
- ✅ Suggestions 24/7
- ✅ Integrations (Notion, Calendar, Slack)
- ✅ Mode focus + stats
- ✅ Priority support

---

### BUSINESS TIER (Future - v1.1)
**Price:** 12€/seat/month

**Target:** SMEs (5-50 people)

**Rationale:**
- Company of 20 = 240€/month (affordable for small company)
- At 50 companies = 12k€/month ARR
- Huge market but address in v1.1+ (not MVP)

**Features:**
- Everything Pro +
- Team management
- Admin dashboard
- Custom automations
- API access
- Priority support

---

## 📊 SUCCESS METRICS

### Retention
- Day 1: > 60%
- Day 7: > 35%
- Day 30: > 15%

### Conversion
- Free → Pro: > 5% (goal 7%)
- Trigger: User hits 20 reminders limit

### Engagement
- Reminders created / user / day: > 1
- Reminders completed: > 70% (not snoozed)
- Suggestions accepted: > 30%

### NPS
- Target: > 50 (excellent for productivity app)

---

# 6️⃣ WEEKS 1-8 DETAILED

## 📅 WEEK 1: PRODUCT SPEC & VALIDATION

### 🎯 Objectives
- [ ] Validate vision with personas
- [ ] Define core features
- [ ] Understand competitive landscape
- [ ] Define success metrics

### 📋 Daily Tasks

**Day 1: Vision & Personas**
- [ ] Read/understand vision: "The AI that thinks for you"
- [ ] Profile Thomas: freelancer, 5-10 clients, loses follow-ups
- [ ] Profile Julie: manager, 2 kids, forgets appointments
- [ ] Validate: Does this solve their problems? ✅

**Day 2: Features & Pricing**
- [ ] Freemium model: 20 reminders free, 4.99€/month pro
- [ ] Why 20? (Thomas + Julie hit limit quickly)
- [ ] Conversion trigger: paywall at 20
- [ ] Validate: Pricing makes sense?

**Day 3-4: Competitors & Differentiation**
- [ ] Todoist: 11€/month, zero AI, zero proactive
- [ ] Things 3: 40€ one-time, design, zero AI
- [ ] Apple Reminders: Free, basic, zero AI
- [ ] Microsoft To Do: Free, basic, zero AI
- [ ] **USP: "Detects what you should do" = market gap**

**Day 5: Success Metrics**
- [ ] D1 retention > 60%, D7 > 35%, D30 > 15%
- [ ] Free→Pro conversion > 5%
- [ ] NPS > 50
- [ ] How to measure? Analytics setup

### ✅ End of Week 1
You understand:
- The problem (Thomas, Julie)
- The solution (AI detects)
- The market (everyone else does manual)
- The monetization (freemium 20→pro)

---

## 📅 WEEK 2: ARCHITECTURE & DATABASE

### 🎯 Objectives
- [ ] Validate tech stack
- [ ] Design database schema
- [ ] Plan API endpoints
- [ ] Plan deployment strategy

### 📋 Daily Tasks

**Day 1: Backend Architecture**
- [ ] Why Node/Express? (Fast MVP, JS everywhere)
- [ ] Why Ollama local? (Zero cost vs 1000€/month Claude)
- [ ] Why PostgreSQL? (Relational, JSON support)
- [ ] Why Redis? (Cache, sessions)
- [ ] Validate: Tech stack OK? ✅

**Day 2: Database Schema**
- [ ] 5 tables: users, reminders, suggestions, sync_logs, notification_history
- [ ] Users: id, email, password_hash, tier, created_at
- [ ] Reminders: id, user_id, title, scheduled_at, context_ai, priority, etc.
- [ ] Indexes: scheduled_at, sync_status (for performance)

**Day 3: API Endpoints**
- [ ] Auth: POST /signup, /login, /refresh, /logout
- [ ] CRUD: GET/POST/PUT/DELETE /reminders/:id
- [ ] Sync: POST /sync (bi-directional)
- [ ] AI: POST /api/ai/parse, POST /api/ai/generate-context
- [ ] Notifications: POST /notifications/register-device

**Day 4: Frontend Architecture**
- [ ] React Native + SQLite (offline-first)
- [ ] Sync engine (queue + last-write-wins)
- [ ] Zustand for state
- [ ] Axios client with JWT interceptors

**Day 5: Deployment Strategy**
- [ ] Docker Compose for local dev
- [ ] Production: DigitalOcean 4GB (month 1-2)
- [ ] Upgrade to 8GB if needed (month 3+)
- [ ] Monitoring: Sentry, Prometheus

### ✅ End of Week 2
You have:
- Architecture diagram
- Database schema
- API spec (15 endpoints)
- Tech stack validated
- Deployment plan

---

## 📅 WEEK 3-4: BACKEND CORE

### 🎯 Objectives
- [ ] Project setup (Node, Express, Prisma)
- [ ] Database setup (PostgreSQL, migrations)
- [ ] Auth implementation (JWT, bcrypt)
- [ ] CRUD endpoints (reminders)
- [ ] Tier limit enforcement (free = 20 max)
- [ ] Tests (Jest + Supertest)
- [ ] Docker setup

### 📋 Daily Tasks (Week 3)

**Day 1: Project Setup**
- [ ] `npm init remindai-backend`
- [ ] Install: express, prisma, jwt, bcrypt, pg
- [ ] Create: .env with DATABASE_URL, JWT_SECRET
- [ ] Setup: docker-compose.yml with postgres, redis, ollama

**Day 2: Database Setup**
- [ ] Create: schema.prisma (5 tables)
- [ ] Run: `npx prisma migrate dev`
- [ ] Verify: Tables exist in postgres

**Day 3: Auth Routes**
- [ ] POST /auth/signup (email, password, name)
- [ ] Implement: bcrypt.hash(password, 10)
- [ ] Implement: JWT tokens (1h access, 7d refresh)
- [ ] Test: curl POST /auth/signup

**Day 4: CRUD Routes**
- [ ] POST /reminders (create)
- [ ] GET /reminders (list)
- [ ] PUT /reminders/:id (update)
- [ ] DELETE /reminders/:id (delete)
- [ ] Implement: Tier limit (free max 20) → 429 error

**Day 5: Tests & Docker**
- [ ] Jest tests (auth, CRUD)
- [ ] Dockerfile for backend
- [ ] npm test (all pass)
- [ ] docker-compose up (everything runs)

### 📋 Daily Tasks (Week 4)

**Days 1-5: Bug Fixes & Refinement**
- [ ] Fix auth edge cases
- [ ] Verify tier limit works
- [ ] Add proper error handling
- [ ] Add rate limiting
- [ ] Final testing

### ✅ End of Week 4
You have:
- Working backend API
- Authentication system
- CRUD endpoints
- Tier limit enforcement
- Passing tests
- Docker setup

---

## 📅 WEEK 5: FRONTEND MVP

### 🎯 Objectives
- [ ] React Native project setup
- [ ] Auth flow (login/signup)
- [ ] SQLite local storage
- [ ] Sync engine (offline-first)
- [ ] Home screen (reminders list)
- [ ] Create screen (voice + text)
- [ ] Swipe gestures (complete, snooze)

### 📋 Daily Tasks

**Day 1: Project Setup**
- [ ] `expo init RemindAI-Mobile`
- [ ] Install: react-native, expo-sqlite, zustand, axios
- [ ] Setup: Navigation (React Navigation)
- [ ] Create: folder structure (auth, app tabs)

**Day 2: Auth Flow**
- [ ] Create: login screen
- [ ] Create: signup screen
- [ ] Implement: API client (axios + JWT)
- [ ] Implement: SecureStore for tokens
- [ ] Test: Login → home ✅

**Day 3: SQLite & Sync**
- [ ] Create: SQLite schema (reminders table)
- [ ] Implement: localDB.createReminder()
- [ ] Implement: Sync engine (queue + bi-directional)
- [ ] Test: Offline → online sync

**Day 4: Home Screen**
- [ ] Sections: Today, Tomorrow, Later
- [ ] Swipe right: Complete
- [ ] Swipe left: Snooze
- [ ] Test: Create 5 reminders → see on home

**Day 5: Create Screen**
- [ ] Text input for reminders
- [ ] Voice input button
- [ ] NLP parsing (client-side)
- [ ] Test: "Call Jean tomorrow 3pm" → parsed correctly

### ✅ End of Week 5
You have:
- Complete React Native app
- Auth working
- Offline storage
- Sync engine
- Home screen + create screen
- Swipe gestures

---

## 📅 WEEK 6: POLISH & OPTIMIZATIONS

### 🎯 Objectives
- [ ] Push notifications (Firebase)
- [ ] Paywall (in-app purchase)
- [ ] Settings screen
- [ ] Onboarding (3 slides)
- [ ] UI polish
- [ ] Performance tuning
- [ ] 0 crashes

### 📋 Daily Tasks

**Days 1-2: Push Notifications**
- [ ] Firebase Cloud Messaging setup
- [ ] Device token registration
- [ ] Backend cron (send notifications)
- [ ] Test: Get push when reminder due

**Days 2-3: Paywall**
- [ ] In-app purchase (iOS + Android)
- [ ] Paywall UI (feature comparison)
- [ ] Test: Hit 20 reminders → paywall shows

**Days 3-4: Settings**
- [ ] Notifications toggle
- [ ] Quiet hours (start/end)
- [ ] Theme selection
- [ ] Test: Quiet hours work

**Day 4-5: Onboarding**
- [ ] 3 slides (proactive, voice, context)
- [ ] Animations
- [ ] Skip button
- [ ] Test: Smooth flow

### ✅ End of Week 6
You have:
- Push notifications working
- Paywall triggering
- Settings functional
- Onboarding complete
- 0 crashes
- Smooth UI/UX

---

## 📅 WEEK 7: AI INTEGRATION

### 🎯 Objectives
- [ ] Ollama integration
- [ ] AI context generation
- [ ] Natural language parsing
- [ ] Streaming responses
- [ ] Redis caching
- [ ] Performance < 3s

### 📋 Daily Tasks

**Day 1: Ollama Setup**
- [ ] `docker-compose up ollama`
- [ ] `ollama pull mistral:7b`
- [ ] Test: curl http://localhost:11434/api/tags

**Day 2: Backend AI Routes**
- [ ] POST /api/ai/parse (NLP parsing)
- [ ] Mistral inference (parse French)
- [ ] Return: {title, when, category, priority}
- [ ] Test: Parse "Appelle Jean demain 15h"

**Day 3: Context Generation**
- [ ] POST /api/ai/generate-context
- [ ] Redis caching (24h TTL)
- [ ] Fallback if Ollama slow
- [ ] Test: Generate context < 3s

**Day 4: Frontend Streaming**
- [ ] Call /api/ai/parse
- [ ] Show parsed result in real-time
- [ ] Test: Voice input → shows parsing

**Day 5: Performance & Testing**
- [ ] Measure inference latency
- [ ] Cache hit rate (target > 80%)
- [ ] Optimize prompts if slow
- [ ] Load test

### ✅ End of Week 7
You have:
- Ollama working locally
- AI parsing French
- Context generation
- Streaming UI
- Performance targets met
- 80%+ cache hit rate

---

## 📅 WEEK 8: BETA TESTING & LAUNCH

### 🎯 Objectives
- [ ] Beta test with 5 users
- [ ] Fix P0 bugs (crashes)
- [ ] Security audit
- [ ] App Store metadata
- [ ] TestFlight + Google Play beta
- [ ] Legal docs
- [ ] GO/NO-GO decision

### 📋 Daily Tasks

**Day 1: Beta Setup**
- [ ] Invite Thomas, Julie, 3 team members
- [ ] Slack channel #beta-feedback
- [ ] Daily feedback collection

**Days 2-4: Testing & Fixes**
- [ ] Daily: Read feedback
- [ ] Daily: Fix P0 bugs (crashes)
- [ ] Daily: Fix P1 bugs (broken features)
- [ ] Weekly: Debrief call (30 min)

**Day 5: Launch Prep**
- [ ] Security audit (passwords, tokens, HTTPS)
- [ ] Privacy policy (GDPR)
- [ ] Terms of Service
- [ ] App Store metadata (screenshots, description)
- [ ] Submit to TestFlight (iOS)
- [ ] Submit to Google Play beta (Android)

### Security Checklist
- [ ] Passwords hashed (bcrypt 10+)
- [ ] JWT tokens secure (1h access, 7d refresh)
- [ ] HTTPS only
- [ ] Database encrypted
- [ ] No secrets in code
- [ ] User data isolated
- [ ] Rate limiting enabled

### App Store Checklist
- [ ] 5 screenshots (onboarding, home, create, paywall, settings)
- [ ] App description (4000 chars)
- [ ] Keywords
- [ ] Support email
- [ ] Privacy policy URL
- [ ] Terms of service URL

### GO/NO-GO Criteria
**GO if:**
- ✅ 0 P0 crashes
- ✅ All critical flows work
- ✅ NPS > 50 from beta testers
- ✅ Thomas says "Saves me 30 min/week"
- ✅ Julie says "Helps me stay organized"
- ✅ Security audit passed
- ✅ Legal docs complete

**NO-GO if:**
- ❌ Auth broken
- ❌ Data loss on any operation
- ❌ Sync failing > 5% of time
- ❌ NPS < 40
- ❌ Crashes > 10% of sessions
- ❌ Compliance issues

### ✅ End of Week 8 (LAUNCH!)
You have:
- App tested by 5+ users
- 0 P0 crashes
- NPS > 50
- Security audit passed
- App Store ready
- **GO DECISION: READY TO LAUNCH** 🚀

---

# 7️⃣ EXECUTION GUIDE

## 📋 DAILY CHECKLIST FORMAT

Each day, use this format:

```
🗓️ WEEK X, DAY Y
📌 Task: [What you're doing]
✅ Checklist:
  - [ ] Step 1
  - [ ] Step 2
  - [ ] Step 3

🎯 Success Criteria:
  - [ ] Feature works offline
  - [ ] No console errors
  - [ ] Tests pass
  - [ ] No crashes

📝 Notes:
  [Any insights or blockers]
```

---

## 🔄 DAILY WORKFLOW

### Morning
1. Open EXECUTION_GUIDE.md
2. Find your week/day
3. Read checklist
4. Code the tasks

### During Coding
- Keep QUICK_REFERENCE.md nearby
- Reference API endpoints as needed
- Check database schema
- Copy command examples

### When Blocked
- Ask Claude: "I'm at Week X Day Y, blocker: X"
- Claude has all 12 docs
- Claude understands architecture

### End of Day
- Check off completed items
- Run tests
- Verify checklist items ✅

---

## 🎯 SPRINT STRUCTURE

### Each Week Is:
- **Monday-Friday:** 5 days of implementation
- **Each day:** 1-2 main tasks (2-4 hours work)
- **Each Friday:** Verify everything works

### Weekly Gate:
```
✅ Week complete if:
- All daily checklists done
- Code compiles
- Tests pass
- No P0 bugs
- Deliverables ready
```

---

# 8️⃣ QUICK REFERENCE

## 📊 DATABASE SCHEMA

```sql
users
├─ id (PK)
├─ email (UNIQUE)
├─ password_hash
├─ tier (free|pro)
├─ created_at

reminders
├─ id (PK)
├─ user_id (FK)
├─ title
├─ scheduled_at (INDEX)
├─ completed_at
├─ priority (1-4)
├─ category (work|personal|health|errand|habit)
├─ context_ai
├─ sync_status (INDEX)
├─ deleted_at (soft delete)

sync_logs
├─ id (PK)
├─ user_id (FK)
├─ action (create|update|delete)
├─ reminder_id
├─ sync_status (pending|synced|conflict)
├─ client_timestamp
├─ server_timestamp

device_tokens
├─ id (PK)
├─ user_id (FK)
├─ token (UNIQUE)
├─ platform (ios|android)

notification_history
├─ id (PK)
├─ user_id (FK)
├─ reminder_id (FK)
├─ sent_at
├─ opened_at
├─ platform
```

---

## 🔗 API ENDPOINTS (SUMMARY)

### Auth
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Reminders
```
GET    /api/reminders
POST   /api/reminders
GET    /api/reminders/:id
PUT    /api/reminders/:id
DELETE /api/reminders/:id
PATCH  /api/reminders/:id/complete
PATCH  /api/reminders/:id/snooze
```

### AI
```
POST   /api/ai/parse
POST   /api/ai/generate-context/:id
GET    /api/ai/health
```

### Sync
```
POST   /api/sync
```

### Notifications
```
POST   /api/notifications/register-device
```

### User
```
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/settings
PUT    /api/user/settings
DELETE /api/user/account
```

---

## 🛠️ COMMON COMMANDS

```bash
# Backend
npm run dev              # Start + watch
npm test                 # Run tests
npm run migrate          # Database migrations
docker-compose up -d     # Start services

# Frontend
npm start                # Expo bundler
npm run ios              # iOS simulator
npm run android          # Android emulator
npm test                 # Jest tests

# Database
psql remindai_dev        # Connect
\dt                      # Show tables

# Ollama
ollama pull mistral:7b   # Download model
```

---

## 🚨 CRITICAL LOGIC

### Tier Limit Check
```
if (user.tier === 'free' && activeReminders >= 20) {
  return 429; // Paywall!
}
```

### Sync Conflict Resolution
```
if (serverReminder.updated_at > clientReminder.updated_at) {
  use serverReminder;
} else {
  use clientReminder;
}
```

### Token Refresh
```
if (response.status === 401) {
  newToken = await POST /auth/refresh;
  retry original request;
}
```

### AI Caching
```
cacheKey = `context:${reminderId}`;
cached = await redis.get(cacheKey);
if (cached) return cached; // < 1ms

// Cache miss:
context = await ollama.generate(prompt);
await redis.setex(cacheKey, 86400, context); // 24h
```

---

## 📌 KEY CONSTRAINTS

| Constraint | Value | Why |
|-----------|-------|-----|
| Free max | 20 reminders | Conversion trigger |
| Access token | 1 hour | Security |
| Refresh token | 7 days | Convenience |
| AI timeout | 30s | Don't freeze UI |
| API timeout | 10s | Mobile friendly |
| Cache TTL | 24h | Freshness |
| Push notif delay | < 5s | UX |

---

## 🔍 WHEN YOU'RE STUCK

**In Claude Terminal:**
```
Week X Day Y. I'm stuck on [specific problem].

Here's what I tried: [code]
Here's the error: [error message]

Read QUICK_REFERENCE.md and help me fix it.
```

Claude will:
- Understand architecture (has all docs)
- See your exact code
- Know the context
- Give specific help

---

# 🚀 RECAP ULTRA-COURT

| What | Where |
|------|-------|
| **The Idea** | RemindAI = AI that detects what you forget |
| **The Problem** | Thomas loses follow-ups, Julie forgets appointments |
| **The Solution** | Proactive AI suggestions + smart notifications |
| **Timeline** | 8 weeks (4 backend, 4 frontend + AI + launch) |
| **Tech** | Node/Express/PostgreSQL backend, React Native frontend, Ollama AI |
| **Pricing** | FREE: 20 reminders, PRO: 4.99€/month unlimited |
| **Success** | Day 30 retention > 15%, NPS > 50, conversion > 5% |
| **Next** | Week 1: Understand the problem. Week 3: Start backend. Week 5: Start frontend. Week 8: Launch! |

---

# 📞 SUPPORT

- **Stuck on architecture?** → See "ARCHITECTURE" section above
- **Don't know API endpoints?** → See "QUICK REFERENCE" section
- **Need database schema?** → See "DATABASE SCHEMA" section
- **Daily checklist?** → See "EXECUTION GUIDE" section
- **Specific coding help?** → Ask Claude with week/day context

---

**You have everything in ONE document. Go build! 🚀**
