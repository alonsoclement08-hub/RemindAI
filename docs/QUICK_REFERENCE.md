# QUICK REFERENCE — RemindAI
**À côté de toi pendant que tu codes**

---

## ARCHITECTURE EN 1 PAGE

```
┌────────────────────────────────────────────────┐
│           YOUR SERVER (4GB RAM)                │
├────────────────────────────────────────────────┤
│                                                │
│  Ollama (localhost:11434) ← AI inference     │
│  PostgreSQL (5432) ← Reminders data          │
│  Redis (6379) ← Cache + Sessions              │
│  Node/Express (3000) ← API                    │
│                                                │
└────────────────────────────────────────────────┘
              ▲
              │ HTTPS (encrypted)
              ▼
┌────────────────────────────────────────────────┐
│        USER'S PHONE (iOS + Android)            │
├────────────────────────────────────────────────┤
│                                                │
│  React Native App                             │
│  SQLite (local) ← Reminders cache             │
│  Sync Engine ← Upload/download changes        │
│                                                │
└────────────────────────────────────────────────┘
```

---

## TECH STACK

| Layer | Tech | Why |
|-------|------|-----|
| **Backend** | Node.js + Express | Fast, JS ecosystem, easy deploy |
| **Database** | PostgreSQL | Relational, JSON support, reliable |
| **Cache** | Redis | Session tokens, AI context cache |
| **AI** | Ollama (Mistral 7B) | Local inference, zero cost |
| **Frontend** | React Native | iOS + Android same codebase |
| **Local Storage** | SQLite | Offline-first, lightweight |
| **State** | Zustand | Minimal, easy to use |
| **Sync** | Custom (last-write-wins) | Offline support, conflict resolution |

---

## DATABASE SCHEMA

```sql
users
├─ id (PK)
├─ email (UNIQUE)
├─ password_hash
├─ tier (free|pro|business)
├─ created_at

reminders
├─ id (PK)
├─ user_id (FK → users)
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
├─ created_at

notification_history
├─ id (PK)
├─ user_id (FK)
├─ reminder_id (FK)
├─ sent_at
├─ opened_at
├─ platform
```

---

## API ENDPOINTS

### Authentication
```
POST   /api/auth/signup
Body:  { email, password, name }
Response: { user, accessToken, refreshToken }

POST   /api/auth/login
Body:  { email, password }
Response: { user, accessToken, refreshToken }

POST   /api/auth/refresh
Body:  { refreshToken }
Response: { accessToken }

POST   /api/auth/logout
Response: { success: true }
```

### Reminders (all need Bearer token)
```
GET    /api/reminders
Response: [{ id, title, scheduled_at, context_ai, ... }]

POST   /api/reminders
Body:  { title, scheduled_at, category, priority, ... }
Response: { id, ... }
Check:   FREE tier max 20 active → 429 if exceeded

GET    /api/reminders/:id
Response: { id, title, ... }

PUT    /api/reminders/:id
Body:  { title, category, priority, ... }
Response: { id, ... }

DELETE /api/reminders/:id
Response: { success: true }

PATCH  /api/reminders/:id/complete
Response: { id, completed_at: NOW() }

PATCH  /api/reminders/:id/snooze
Body:  { minutes: 15 }
Response: { id, scheduled_at: NOW() + 15min }
```

### AI
```
POST   /api/ai/parse
Body:  { text: "Appelle Jean demain 15h" }
Response: { 
  title: "Appeler Jean",
  scheduled_at: "2024-03-15T15:00:00Z",
  category: "work",
  priority: 2
}

POST   /api/ai/generate-context/:reminderId
Response: { context: "Jean is waiting for..." }
Time:     < 3 seconds (cached if possible)
```

### Sync
```
POST   /api/sync
Body:  {
  client_timestamp: 1234567890,
  changes: [
    { action: "create", reminder: {...} },
    { action: "update", id: 5, reminder: {...} },
    { action: "delete", id: 3 }
  ]
}
Response: {
  server_timestamp: 1234567900,
  applied: 3,
  conflicts: [],
  server_changes: [...]
}
```

### Notifications
```
POST   /api/notifications/register-device
Body:  { deviceToken: "xyz...", platform: "ios" }
Response: { success: true }
```

### User
```
GET    /api/user/profile
Response: { id, email, tier, ... }

PUT    /api/user/profile
Body:  { name, ... }
Response: { id, ... }

GET    /api/user/settings
Response: { notificationsEnabled, quietHourStart, ... }

PUT    /api/user/settings
Body:  { notificationsEnabled, quietHourStart, ... }
Response: { ... }

DELETE /api/user/account
Response: { success: true }
```

---

## ENV VARIABLES

### Backend (.env)
```
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/remindai_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
OLLAMA_URL=http://localhost:11434
API_PORT=3000
```

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_SENTRY_DSN=...
```

---

## KEY FILES STRUCTURE

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── reminders.js
│   │   ├── ai.js
│   │   ├── sync.js
│   │   └── notifications.js
│   ├── middleware/
│   │   ├── auth.js (JWT verification)
│   │   ├── tier-limit.js (20 reminder check)
│   │   └── security.js (helmet, CORS)
│   ├── services/
│   │   ├── ollama.service.js
│   │   ├── sync.service.js
│   │   └── cache.service.js
│   ├── db/
│   │   ├── index.js (postgres client)
│   │   └── migrations/
│   └── app.js (express server)
├── package.json
├── docker-compose.yml
└── Dockerfile

frontend/
├── app/
│   ├── (auth)/
│   │   ├── login.jsx
│   │   ├── signup.jsx
│   │   └── onboarding.jsx
│   └── (app)/
│       ├── home.jsx
│       ├── create.jsx
│       └── settings.jsx
├── src/
│   ├── api/
│   │   ├── client.js (axios + interceptors)
│   │   └── endpoints.js
│   ├── db/
│   │   ├── sqlite.js
│   │   └── schema.js
│   ├── store/
│   │   ├── auth.store.js (Zustand)
│   │   ├── reminders.store.js
│   │   └── ui.store.js
│   ├── services/
│   │   ├── sync.service.js
│   │   ├── notifications.service.js
│   │   └── payment.service.js
│   └── utils/
│       ├── nlp.js
│       ├── date.js
│       └── storage.js (SecureStore)
├── package.json
└── app.json
```

---

## CRITICAL LOGIC

### Tier Limit Check
```javascript
// Happens BEFORE creating reminder
if (user.tier === 'free') {
  const count = await db.query(
    'SELECT COUNT(*) FROM reminders WHERE user_id=$1 AND completed_at IS NULL'
  );
  if (count >= 20) return 429; // Paywall!
}
```

### Sync Conflict Resolution
```javascript
// Rule: last-write-wins (server timestamp beats client)
if (serverReminder.updated_at > clientReminder.updated_at) {
  use serverReminder;
} else {
  use clientReminder;
}
```

### Token Refresh
```javascript
// Happens automatically in API client interceptor
if (response.status === 401) {
  newToken = await POST /auth/refresh with refreshToken;
  retry original request with newToken;
}
```

### AI Context Caching
```javascript
// Always check Redis first
cacheKey = `context:${reminderId}`;
cached = await redis.get(cacheKey);
if (cached) return cached; // < 1ms

// Cache miss: generate + store
context = await ollama.generate(prompt);
await redis.setex(cacheKey, 86400, context); // 24h TTL
```

---

## IMPORTANT CONSTRAINTS

| Constraint | Value | Why |
|-----------|-------|-----|
| Free reminders max | 20 | Conversion trigger |
| Access token expiry | 1 hour | Security |
| Refresh token expiry | 7 days | Convenience |
| AI inference timeout | 30 seconds | Don't freeze UI |
| API request timeout | 10 seconds | Mobile friendly |
| Sync max records | 100 | Batch size |
| Cache TTL (context) | 24 hours | Freshness |
| Cache TTL (session) | 7 days | Token lifespan |
| Push notif delay | < 5 sec | User experience |
| Quiet hours | User-defined | Customizable |

---

## PASSWORDS & SECURITY

```javascript
// DO: Hash password before storing
const hash = await bcrypt.hash(password, 10);
await db.query('INSERT INTO users ... VALUES (..., $1)', [hash]);

// DON'T: Store plain password
const hash = password; // ❌ WRONG

// DO: Use JWT for auth
const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

// DON'T: Use sessions (too complex for mobile)
req.session.userId = user.id; // ❌ For web, not mobile

// DO: Store tokens in SecureStore
await SecureStore.setItemAsync('accessToken', token);

// DON'T: Store in AsyncStorage
await AsyncStorage.setItem('accessToken', token); // ❌ Not encrypted
```

---

## PERFORMANCE TARGETS

| Metric | Target | How to Check |
|--------|--------|--------------|
| App cold start | < 2.5s | Time from tap to home screen |
| List scroll | 60 FPS | Smooth animation (no jank) |
| API response | < 500ms | Network tab in DevTools |
| AI parse | < 2s | Backend logs |
| AI context | < 3s | Sentry APM dashboard |
| Cache hit rate | > 80% | Redis stats |
| Sync success | > 99% | Server logs |

---

## TESTING CHECKLIST

### Before Each Feature
- [ ] Does it work offline?
- [ ] Does it sync online?
- [ ] No console errors?
- [ ] No crashes?
- [ ] Performance OK?

### Before Launch (Each Day)
- [ ] Run all unit tests: `npm test`
- [ ] Run e2e tests: `npm run e2e`
- [ ] Manual smoke test: create → complete → sync
- [ ] Check Sentry dashboard: any new errors?

### Before Submission
- [ ] 0 P0 crashes
- [ ] All major features working
- [ ] Offline → online sync works
- [ ] Paywall at 20 reminders
- [ ] Push notifications working
- [ ] Analytics logging events

---

## COMMON COMMANDS

```bash
# Backend
npm run dev              # Start backend + watch
npm test                 # Run tests
npm run migrate          # Run migrations
docker-compose up -d     # Start all services
docker-compose logs -f   # View logs

# Frontend
npm start                # Expo bundler
npm run ios              # Simulator
npm run android          # Emulator
npm test                 # Jest tests
npm run build:ios        # Build for iOS

# Database
psql remindai_dev        # Connect to postgres
\dt                      # Show tables
SELECT * FROM users;     # Query users

# Ollama
ollama pull mistral:7b   # Download model
curl http://localhost:11434/api/generate  # Test

# Redis
redis-cli                # Connect
keys *                   # See all keys
GET context:reminder_id  # Get cached context
```

---

## WHEN THINGS BREAK

| Symptom | Check | Fix |
|---------|-------|-----|
| Reminders not syncing | POST /sync working? | Check network + queue |
| Paywall not showing | Remind count = 20? | Query: `SELECT COUNT(*) FROM reminders WHERE ...` |
| Push notif not arriving | Device token registered? | Check Firebase console |
| AI too slow | Cache working? | Check Redis: `redis-cli keys context:*` |
| App crashes on create | Error in console? | Check Sentry dashboard |
| Login fails | DB connected? | `npm run migrate` + restart |
| Offline reminders lost | SQLite working? | Check phone storage permissions |

---

## KEY DECISIONS

1. **React Native:** iOS + Android same code (vs Swift native)
2. **Ollama local:** $0/month (vs Claude API $1000+/month)
3. **SQLite local:** Offline-first (vs cloud-only)
4. **Freemium 20:** Quick conversion trigger (vs 50)
5. **4.99€/month:** Psychological sweet spot (vs 9.99€)
6. **Last-write-wins:** Simple conflicts (vs complex 3-way merge)

---

## SUPPORT

Stuck? Ask Claude Code:
- "Comment je setup Ollama?"
- "Pourquoi ma sync ne marche pas?"
- "Comment je fais du caching avec Redis?"
- "Ça veut dire quoi cette erreur?"

Claude aura accès à:
- ✅ EXECUTION_GUIDE.md (ce que tu dois faire)
- ✅ QUICK_REFERENCE.md (ça, tech ref)
- ✅ SEMAINE_X.md (détails par semaine)
- ✅ Ton code
- ✅ Tes erreurs

---

**Tu as tout ce qu'il faut. À toi de jouer! 🚀**
