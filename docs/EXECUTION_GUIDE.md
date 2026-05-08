# EXECUTION GUIDE — RemindAI
**8 Semaines • Du code à l'App Store**

---

## COMMENT UTILISER CE GUIDE

**Chaque matin:**
1. Ouvre ce guide
2. Trouve ton jour/semaine
3. Lis la checklist
4. Code les tasks listées
5. Vérifie avec la checklist de fin de jour

**Si tu sais pas comment faire quelque chose:**
- Demande à Claude Code: "Comment je fais X?"
- Il aura accès à tous tes documents de prépa

---

## SEMAINE 1: PRODUCT SPEC & VALIDATION

### Jour 1: Vision & Personas
- [ ] Lis SEMAINE_1_Spec_Produit.md
- [ ] Comprends la vision: "L'IA qui pense à ta place"
- [ ] Comprends Thomas (freelancer): 5-10 clients, perte de follow-ups
- [ ] Comprends Julie (manager): 2 kids, stress, oublie trucs
- [ ] Valide mentalement: ça résout leurs problèmes? ✅

**À la fin du jour:** Tu peux expliquer le problème à quelqu'un d'autre

---

### Jour 2: Features & Pricing
- [ ] Lire: Freemium model (20 reminders free, 4.99€/month pro)
- [ ] Comprendre: Why 20? (Thomas et Julie hit limit rapidement)
- [ ] Valider: Conversion trigger logique?
- [ ] Décider: Est-ce que le pricing fait sens pour toi?

**À la fin du jour:** Tu peux expliquer le model économique

---

### Jour 3-4: Competitors & Differentiation
- [ ] Lire: SEMAINE_2_Concurrence_Pricing.md
- [ ] Comprendre: Todoist (11€) vs RemindAI (4.99€)
- [ ] Comprendre: Things 3 (design) vs RemindAI (IA)
- [ ] USP unique: "Détection proactive = market gap"
- [ ] Valider: Est-ce qu'on peut vraiment faire ça?

**À la fin du jour:** Tu sais pourquoi RemindAI gagne sur chaque competitor

---

### Jour 5: Success Metrics
- [ ] Lire: Retention targets (D1>60%, D7>35%, D30>15%)
- [ ] Lire: Conversion > 5% free→pro
- [ ] Lire: NPS > 50 target
- [ ] Comprendre: Comment tu vas mesurer ça?

**À la fin du jour:** Tu sais exactement ce qui veut dire "succès" pour ton app

---

## SEMAINE 2: ARCHITECTURE & TECH STACK

### Jour 1: Backend Architecture
- [ ] Lire: SEMAINE_3_Architecture_Backend.md
- [ ] Comprendre: Node/Express + PostgreSQL + Redis
- [ ] Comprendre: Pourquoi Node? (Faster MVP, JS end-to-end)
- [ ] Comprendre: Pourquoi Ollama local? (Zero cost vs 1000€/month Claude API)
- [ ] Décider: Stack OK pour toi?

**À la fin du jour:** Tu peux draw l'architecture (user → API → Ollama → DB)

---

### Jour 2: Database Schema
- [ ] Lire: 5 tables (users, reminders, suggestions, sync_logs, notifications)
- [ ] Comprendre: Pourquoi chaque table?
- [ ] Comprendre: Quels indexes? (scheduled_at, sync_status)
- [ ] Validation: Ça couvre tous les use cases de Thomas & Julie?

**À la fin du jour:** Tu sais créer les tables

---

### Jour 3: API Endpoints
- [ ] Lire: 15 endpoints listés (auth, reminders CRUD, sync, suggestions)
- [ ] Comprendre: POST /reminders crée + vérifie tier limit
- [ ] Comprendre: POST /sync = bi-directional sync
- [ ] Validation: Endpoints suffisent pour MVP?

**À la fin du jour:** Tu peux écrire la spec OpenAPI

---

### Jour 4: Frontend Architecture
- [ ] Lire: React Native + SQLite + Zustand
- [ ] Comprendre: Offline-first sync (crée localement, sync après)
- [ ] Comprendre: Last-write-wins conflict resolution
- [ ] Décider: React Native OK ou tu veux Swift native?

**À la fin du jour:** Tu peux expliquer le sync engine

---

### Jour 5: Deployment Strategy
- [ ] Lire: Docker Compose (local dev)
- [ ] Lire: Production (DigitalOcean 4GB)
- [ ] Comprendre: Monitoring (Sentry, Prometheus)
- [ ] Validation: Budget OK? (~$25/month month 1-2)

**À la fin du jour:** Tu sais comment déployer

---

## SEMAINE 3: BACKEND CORE

### Jour 1: Project Setup
- [ ] npm init remindai-backend
- [ ] Install: express, prisma, jwt, bcrypt, pg
- [ ] Créer: .env avec DATABASE_URL, JWT_SECRET
- [ ] Setup: docker-compose.yml avec postgres, redis, ollama

**Check:** docker-compose up devrait tout lancer sans erreur

---

### Jour 2: Database Setup
- [ ] Créer: schema.prisma (5 tables)
- [ ] Créer: première migration
- [ ] Run: npx prisma migrate dev
- [ ] Valider: Tables existent dans postgres

**Check:** psql remindai_dev → \dt (show tables)

---

### Jour 3: Auth Routes
- [ ] Créer: POST /auth/signup (email, password, name)
- [ ] Implémenter: bcrypt.hash(password, 10)
- [ ] Implémenter: JWT tokens (access 1h, refresh 7d)
- [ ] Tester: curl POST /auth/signup

**Check:** Peut créer user + reçoit tokens

---

### Jour 4: CRUD Routes
- [ ] Créer: POST /reminders (create)
- [ ] Créer: GET /reminders (list)
- [ ] Créer: PUT /reminders/:id (update)
- [ ] Implémenter: Tier limit (free users max 20)
- [ ] Tester: curl POST /reminders avec Bearer token

**Check:** Tier limit blocking à 20 reminders

---

### Jour 5: Tests & Docker
- [ ] Créer: Jest tests (auth, CRUD)
- [ ] Créer: Dockerfile pour backend
- [ ] Vérifier: npm test (tous pass)
- [ ] Vérifier: docker build works

**Check:** docker-compose up → server running on :3000

---

## SEMAINE 4: FRONTEND MVP

### Jour 1: React Native Setup
- [ ] expo init RemindAI-Mobile
- [ ] npm install: react-native, expo-sqlite, zustand, axios
- [ ] Créer: app structure (auth, app tabs)
- [ ] Setup: navigation (React Navigation)

**Check:** npm start → can see onboarding screen

---

### Jour 2: Auth Flow
- [ ] Créer: login screen
- [ ] Créer: signup screen
- [ ] Implémenter: API client (axios + JWT)
- [ ] Implémenter: Token storage (SecureStore)
- [ ] Tester: Login → home screen ✅

**Check:** Can login with backend user

---

### Jour 3: SQLite & Sync
- [ ] Créer: SQLite schema (reminders table)
- [ ] Implémenter: localDB.createReminder()
- [ ] Implémenter: Sync engine (queue + bi-directional)
- [ ] Tester: Créer reminder offline → sync online

**Check:** Offline reminder syncs to server

---

### Jour 4: Home Screen
- [ ] Créer: Home screen avec reminder list
- [ ] Implémenter: Swipe right = complete
- [ ] Implémenter: Swipe left = snooze
- [ ] Implémenter: Sections (Today, Tomorrow, Later)
- [ ] Tester: Créer 5 reminders → voir sur home screen

**Check:** Reminders appear + can swipe to complete

---

### Jour 5: Create Screen
- [ ] Créer: Create screen avec text input
- [ ] Créer: Voice input button
- [ ] Implémenter: NLP parsing (client-side)
- [ ] Tester: "Appelle Jean demain 15h" → parsed correctly

**Check:** Can create reminder from text/voice

---

## SEMAINE 5: OPTIMIZATIONS

### Jour 1-2: Push Notifications
- [ ] Setup Firebase Cloud Messaging
- [ ] Implémenter: Device token registration
- [ ] Implémenter: Backend cron (send notifications)
- [ ] Tester: Get push notification when reminder is due

**Check:** Notification arrives on phone

---

### Jour 2-3: Paywall
- [ ] Créer: Paywall component
- [ ] Implémenter: In-app purchase (iOS + Android)
- [ ] Implémenter: Free tier limit (20 reminders) → paywall
- [ ] Tester: Hit 20 reminders → paywall shows

**Check:** Paywall triggers at 20 reminders

---

### Jour 3-4: Settings
- [ ] Créer: Settings screen
- [ ] Implémenter: Notifications toggle
- [ ] Implémenter: Quiet hours (start/end time)
- [ ] Tester: Change quiet hours → respect in notifications

**Check:** Notifications muted during quiet hours

---

### Jour 4-5: Onboarding
- [ ] Créer: 3 onboarding slides (proactive, voice, context)
- [ ] Implémenter: Animations
- [ ] Implémenter: Skip button
- [ ] Tester: Slide through onboarding

**Check:** Onboarding smooth, can skip

---

## SEMAINE 6: IA INTEGRATION

### Jour 1: Ollama Setup
- [ ] docker-compose up ollama
- [ ] ollama pull mistral:7b
- [ ] Tester: curl http://localhost:11434/api/tags

**Check:** Mistral model loaded

---

### Jour 2: Backend AI Routes
- [ ] Créer: POST /api/ai/parse (NLP parsing)
- [ ] Implémenter: Mistral inference (parse French text)
- [ ] Implémenter: Return: {title, when, category, priority}
- [ ] Tester: Parse "Appelle Jean demain 15h"

**Check:** Correctly parses to JSON

---

### Jour 3: Context Generation
- [ ] Créer: POST /api/ai/generate-context (generate reason why)
- [ ] Implémenter: Redis caching (24h TTL)
- [ ] Implémenter: Fallback if Ollama slow
- [ ] Tester: Generate context < 3 seconds

**Check:** Context generated, cached, latency OK

---

### Jour 4: Frontend Streaming
- [ ] Implémenter: Frontend calls /api/ai/parse
- [ ] Afficher: Parsed result in real-time
- [ ] Tester: Voice input → "Appeller Jean" → shows parsed fields

**Check:** Parsing shows in create screen

---

### Jour 5: Performance
- [ ] Mesurer: Inference latency (target < 3s)
- [ ] Vérifier: Cache hit rate (target > 80%)
- [ ] Optimiser: Prompts si trop slow
- [ ] Load test: 10 concurrent parses

**Check:** Performance targets met

---

## SEMAINE 7: BETA TESTING

### Jour 1: Beta Testers
- [ ] Invite: Thomas (freelancer)
- [ ] Invite: Julie (manager)
- [ ] Invite: 3 team members
- [ ] Setup: Slack channel #beta-feedback

**Check:** 5 people have TestFlight/Play Store beta

---

### Jour 2-5: Testing & Fixes
- [ ] Daily: Lire feedback dans Slack
- [ ] Daily: Fix P0 bugs (crashes)
- [ ] Daily: Fix P1 bugs (major features broken)
- [ ] Weekly: Call avec testers (30 min debrief)

**Check:** NPS from testers > 50

---

## SEMAINE 8: LAUNCH PREP

### Jour 1: Security Audit
- [ ] Vérifier: Passwords hashed (bcrypt)
- [ ] Vérifier: JWT tokens secure
- [ ] Vérifier: HTTPS only (no HTTP)
- [ ] Vérifier: Database encryption
- [ ] Vérifier: No secrets in code

**Check:** All security checklist items ✅

---

### Jour 2: Legal Docs
- [ ] Écrire: Privacy Policy (GDPR compliant)
- [ ] Écrire: Terms of Service
- [ ] Valider: User can delete account
- [ ] Valider: User can export data

**Check:** Privacy policy clear + complete

---

### Jour 3: App Store Metadata
- [ ] Créer: 5 screenshots (onboarding, home, create, paywall, settings)
- [ ] Écrire: App description (4000 chars)
- [ ] Écrire: Keywords
- [ ] Écrire: Support email

**Check:** Metadata complete + ready to submit

---

### Jour 4: Submit
- [ ] Build: Final iOS version
- [ ] Build: Final Android version
- [ ] Submit: TestFlight (iOS)
- [ ] Submit: Google Play Beta (Android)
- [ ] Setup: Monitoring (Sentry dashboard)

**Check:** Apps in TestFlight + Play Store

---

### Jour 5: GO/NO-GO Decision
- [ ] Run: Final checklist (0 P0 crashes?)
- [ ] Ask: Thomas & Julie: "Ready to launch?"
- [ ] Decision: GO = submit to App Store | NO-GO = fix + retry

**Check:** GO decision + submit to App Store

---

## CHECKLISTS PAR SEMAINE

### SEMAINE 1: ✅ Si tu peux expliquer:
- [ ] Pourquoi RemindAI gagne vs Todoist
- [ ] Le freemium model (20 reminders free)
- [ ] Thomas & Julie use cases
- [ ] Success metrics (D30 retention, NPS, conversion)

---

### SEMAINE 2: ✅ Si tu as:
- [ ] Node/Express + PostgreSQL + Redis sur ta machine
- [ ] Docker Compose file créé
- [ ] Database schema compris
- [ ] API endpoints listés
- [ ] Architecture diagram (user → API → DB)

---

### SEMAINE 3: ✅ Si tu peux:
- [ ] npm test (auth + CRUD tests pass)
- [ ] curl POST /auth/signup → reçois JWT
- [ ] curl POST /reminders avec token → crée reminder
- [ ] curl GET /reminders → liste reminders
- [ ] docker-compose up → everything runs

---

### SEMAINE 4: ✅ Si tu peux:
- [ ] npm start → voir l'app sur phone
- [ ] Login → home screen
- [ ] Créer reminder (text) → appears on home
- [ ] Swipe right → complète reminder
- [ ] Offline create → syncs when online

---

### SEMAINE 5: ✅ Si tu peux:
- [ ] Get push notification when reminder due
- [ ] Hit 20 reminders → paywall shows
- [ ] Buy pro → create 21st reminder
- [ ] Change quiet hours → notifications respect it
- [ ] Slide through onboarding

---

### SEMAINE 6: ✅ Si tu peux:
- [ ] Parse "Appelle Jean demain 15h" → JSON
- [ ] Get context: "Jean is waiting for..."
- [ ] Inference latency < 3s
- [ ] Cache hit rate > 80%
- [ ] Create reminder shows context

---

### SEMAINE 7: ✅ Si:
- [ ] 5 beta testers feedback positive
- [ ] NPS > 50
- [ ] 0 P0 crashes
- [ ] < 5 P1 bugs
- [ ] Thomas: "Saves me 30 min/week"
- [ ] Julie: "Helps me stay organized"

---

### SEMAINE 8: ✅ Si:
- [ ] Security audit passed
- [ ] Privacy policy written
- [ ] App screenshots ready
- [ ] TestFlight build running
- [ ] Google Play beta running
- [ ] GO decision made ✅

---

## QUICK TROUBLESHOOT

**"Je peux pas créer une migration Prisma"**
→ `npx prisma migrate dev --name init`

**"Push notification pas reçue"**
→ Vérifier: Firebase config, device token registered, quiet hours off

**"Ollama trop lent"**
→ Vérifier: Cache hit (Redis), réduire batch size, optimiser prompt

**"Paywall pas qui trigger"**
→ Vérifier: User tier = 'free', active reminders count = 20

**"Sync fail offline→online"**
→ Vérifier: Queue persisted locally, POST /sync endpoint ok, conflict resolution logic

---

## WHEN YOU'RE STUCK

1. **Code question?** → Ask Claude Code: "Comment je fais X?"
2. **Architecture question?** → Read QUICK_REFERENCE.md
3. **Feature question?** → Read specific SEMAINE_X doc
4. **Bug?** → Check console logs + Sentry dashboard

---

**À chaque étape, tu sais ce qu'il faut faire. Go! 🚀**
