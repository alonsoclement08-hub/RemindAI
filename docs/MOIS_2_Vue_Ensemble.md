# MOIS 2 — VUE D'ENSEMBLE
**RemindAI • Semaines 6-8**

---

## OBJECTIFS MOIS 2

À la fin du Mois 2, RemindAI doit être:
1. ✅ **Complètement fonctionnelle** (backend + frontend intégrés)
2. ✅ **Optimisée et polie** (UX smooth, perf, bug fixes)
3. ✅ **Avec IA intégrée** (Ollama génère contexte sur chaque rappel)
4. ✅ **Prêt pour beta testing** (testable par utilisateurs réels)
5. ✅ **Submittable à App Store** (iOS) + Google Play (Android)

**Résultat:** Une app mobile complète, prête à acquérir ses premiers utilisateurs.

---

## TIMELINE MOIS 2

```
┌─────────────────────────────────────────────────────────────────┐
│ MOIS 2: SEMAINES 6-8 (21 jours)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Semaine 6: POLISH & OPTIMIZATIONS                               │
│ ├─ Push Notifications (Firebase Cloud Messaging)                │
│ ├─ Paywall & In-App Purchase Setup                              │
│ ├─ Settings Screen (notifications, quiet hours, theme)          │
│ ├─ Onboarding Screens (3 slides, animations)                    │
│ ├─ UI Polish (colors, spacing, animations)                      │
│ ├─ Performance tuning (lazy loading, caching)                   │
│ └─ Bug fixes + testing                                           │
│                                                                   │
│ Semaine 7: IA INTEGRATION                                        │
│ ├─ Ollama endpoint integration (http://localhost:11434)         │
│ ├─ AI context generation on reminder create                     │
│ ├─ Streaming AI responses (real-time parsing)                   │
│ ├─ Cache strategy for AI outputs                                │
│ ├─ Natural language parsing (date/time extraction)              │
│ ├─ Proactive detection (future: v1.1)                           │
│ └─ Fine-tuning models (Mistral 7B prompts)                      │
│                                                                   │
│ Semaine 8: BETA TESTING & LAUNCH PREP                           │
│ ├─ Internal testing with Thomas & Julie personas                │
│ ├─ Bug fixes & UX iterations                                    │
│ ├─ Security audit (auth, data, privacy)                         │
│ ├─ App Store metadata (icons, screenshots, description)         │
│ ├─ TestFlight / Google Play Beta setup                          │
│ ├─ Documentation (privacy policy, terms of service)             │
│ ├─ Analytics setup (Sentry, Mixpanel)                           │
│ └─ GO/NO-GO decision                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## DEPENDENCIES & CRITICAL PATH

```
Mois 1                          Mois 2
┌──────────┬──────────────────────────────────────────────────────┐
│ S1-S4    │ S5          │ S6         │ S7        │ S8             │
│ Design   │ Frontend    │ Polish     │ AI        │ Beta + Launch  │
│ Backend  │ MVP         │ Features   │ Core      │                │
│ Core     │             │ Push Notif │ Ollama    │                │
│          │             │ Paywall    │ Context   │                │
│          │             │ Settings   │ Gen       │                │
│          │             │            │           │                │
│ ✅ Done  │ ✅ Done    │ → In Prog  │ → Pending │ → Pending      │
└──────────┴──────────────────────────────────────────────────────┘

CRITICAL DEPENDENCIES:
- S6 dépend de S5 (frontend MVP)
- S7 dépend de S6 (tout doit être stable avant AI)
- S8 dépend de S7 (AI doit marcher pour être lancé)
- Push Notifications (S6) nécessite backend /api/notifications
- Paywall (S6) dépend de tier logic côté backend
```

---

## SEMAINE 6: POLISH & OPTIMIZATIONS

### Objectifs
- ✅ App visuellement polie (onboarding, animations, colors)
- ✅ Push notifications fonctionnelles
- ✅ Paywall avec in-app purchases
- ✅ Settings screen complet
- ✅ Performance tuning
- ✅ 0 crashs critiques

### Deliverables
| Composant | Description | Status |
|-----------|-------------|--------|
| OnboardingFlow | 3 slides avec animations (proactive, voice, context) | TODO |
| PushNotifications | FCM integration + scheduling | TODO |
| Paywall | Free → Pro upgrade flow | TODO |
| SettingsScreen | Notifications, quiet hours, theme | TODO |
| UIPolish | Colors, spacing, fonts standardisés | TODO |
| PerformanceTuning | Lazy loading, image optimization, caching | TODO |
| Tests | Unit + e2e covering all flows | TODO |

### Timeline
- Days 1-2: Onboarding + UI polish
- Days 3-4: Push notifications + paywall
- Day 5: Settings + testing + bug fixes

---

## SEMAINE 7: IA INTEGRATION

### Objectifs
- ✅ Ollama intégré et fonctionnel
- ✅ Contexte IA généré sur chaque reminder
- ✅ Natural language parsing (date/time/lieu)
- ✅ Caching lourd pour éviter latence
- ✅ Streaming responses en temps réel

### Deliverables
| Composant | Description | Status |
|-----------|-------------|--------|
| OllamaBackend | Backend routes for /api/ai/generate | TODO |
| ContextGeneration | Prompt engineering + inference | TODO |
| NLPParsing | Extract task, when, where, who | TODO |
| StreamingUI | Real-time parsing display | TODO |
| CacheStrategy | Redis caching for AI outputs | TODO |
| ModelFineTuning | Optimize Mistral 7B for French | TODO |

### Timeline
- Days 1-2: Backend Ollama routes + caching
- Days 3-4: Frontend streaming UI + NLP
- Day 5: Fine-tuning + testing + optimization

---

## SEMAINE 8: BETA TESTING & LAUNCH

### Objectifs
- ✅ App testé par vrais utilisateurs (Thomas, Julie)
- ✅ 0 bugs critiques
- ✅ Security audit complet
- ✅ App Store / Google Play ready
- ✅ GO decision pour public launch

### Deliverables
| Composant | Description | Status |
|-----------|-------------|--------|
| BetaTesting | 10-20 beta testers internes | TODO |
| BugTracking | Fix all P0 issues | TODO |
| SecurityAudit | Auth, data, privacy review | TODO |
| AppStoreMetadata | Icons, screenshots, description | TODO |
| TestFlightSetup | iOS beta distribution | TODO |
| GooglePlayBeta | Android beta track | TODO |
| LegalDocs | Privacy policy, ToS, EULA | TODO |
| Analytics | Sentry + Mixpanel setup | TODO |

### Timeline
- Days 1-2: Internal beta testing + bug fixes
- Days 3-4: App Store submission + metadata
- Day 5: GO/NO-GO review + decision

---

## ARCHITECTURE GLOBALE (END OF MOIS 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                  USER'S INFRASTRUCTURE                           │
│               (DigitalOcean / Hetzner 4GB)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   OLLAMA     │  │   BACKEND    │  │  DATABASE    │           │
│  │              │  │              │  │              │           │
│  │ Mistral 7B   │  │ Node/Express │  │ PostgreSQL   │           │
│  │ Llama 2 13B  │  │              │  │              │           │
│  │              │  │ • Auth       │  │ • Users      │           │
│  │ Generate:    │  │ • CRUD       │  │ • Reminders  │           │
│  │ • Context    │  │ • AI routes  │  │ • Sync logs  │           │
│  │ • Summaries  │  │ • Sync       │  │ • Analytics  │           │
│  │              │  │ • Push notif │  │              │           │
│  │              │  │              │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│           ▲                 ▲                 ▲                   │
│           └─────────────────┼─────────────────┘                   │
│                    Internal HTTP (localhost)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Redis Cache (optional)                  │       │
│  │  • AI context cache (24h TTL)                        │       │
│  │  • Session tokens                                    │       │
│  │  • Rate limiting                                     │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS API
                          │ (users → backend)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              REMINDAI MOBILE (iOS + Android)                    │
│          (Each user has local copy on their phone)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│  │   LOCAL STORAGE      │  │    SYNC + OFFLINE ENGINE        │ │
│  │                      │  │                                 │ │
│  │ • SQLite DB          │  │ • Upload changes → server       │ │
│  │ • Reminders          │  │ • Download server changes       │ │
│  │ • User Settings      │  │ • Conflict resolution           │ │
│  │ • Cache (AI context) │  │ • Offline queue management      │ │
│  │ • Tokens (secure)    │  │                                 │ │
│  │                      │  │                                 │ │
│  └──────────────────────┘  └─────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         PUSH NOTIFICATIONS (FCM)                         │   │
│  │  • Scheduled reminders                                   │   │
│  │  • Proactive suggestions                                 │   │
│  │  • Daily summaries                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS (encrypted)
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│      EXTERNAL SERVICES (Optional / Future)          │
│                                                      │
│ • Firebase Cloud Messaging (push)                  │
│ • Sentry (error tracking)                          │
│ • Mixpanel (analytics)                             │
│ • Gmail/Outlook OAuth (v1.1 proactive detection)   │
│ • Slack OAuth (v1.1)                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## SUCCESS METRICS (END OF MOIS 2)

### Technical
| Métrique | Target | How to Measure |
|----------|--------|---|
| App Stability | 0 crashes in 100+ test sessions | Sentry dashboard |
| Load Time | < 2s cold start, < 500ms screens | Profiler |
| Sync Success | 99% sync success rate | Backend logs |
| AI Latency | < 3s for context generation | Backend metrics |
| Offline Usability | Full CRUD while offline | Manual testing |

### User Experience
| Métrique | Target | How to Measure |
|----------|--------|---|
| Onboarding Completion | > 80% | Analytics |
| Time to 1st Reminder | < 2 minutes | Session logs |
| Paywall Conversion | > 5% free → pro | Backend |
| NPS (Beta) | > 50 | Survey |
| Feature Discovery | > 70% know voice input | Mixpanel |

### Security
| Métrique | Target | How to Measure |
|----------|--------|---|
| Auth Token Security | JWT + refresh + secure storage | Code review |
| Data Encryption | HTTPS only, encrypted at rest | SSL certificate check |
| Password Hashing | bcrypt with 10 rounds | Backend code check |
| User Data Isolation | 100% isolation, no leaks | Security audit |

---

## RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Push Notification Setup Delays | Blocking Semaine 6 | Medium | Start Firebase setup early (Day 1) |
| Ollama Inference Too Slow | Users frustrated | Medium | Heavy caching + optimize prompts |
| AI Context Generation Breaks | Core feature broken | Low | Fallback to static context |
| App Store Rejection | Launch delayed | Low | Comply with guidelines early |
| Battery Drain from Sync | Users uninstall | Medium | Background sync every 12h, WiFi only |
| Data Loss on Sync Failure | Users angry | Low | Robust conflict resolution + backups |

---

## BUDGET & RESOURCES

### Hosting (DigitalOcean/Hetzner)
- **Months 1-2:** 4GB / 2CPU / 50GB SSD = ~$20-25/month
- **Month 3+:** Upgrade to 8GB if needed

### External Services
- **Firebase Cloud Messaging:** Free (up to 1M messages)
- **Sentry:** Free tier (5k errors/month)
- **Mixpanel:** Free tier (10M events/month)
- **App Store:** $99/year (developer account)
- **Google Play:** $25 one-time (developer account)

**Total:** ~$150 for Month 2 infrastructure

### Development Hours
- **Mois 2:** ~80-100 hours (5 weeks, 20h/week)
- **Solo development:** Faisable

---

## GO/NO-GO CRITERIA (Semaine 8)

### GO Criteria (All must be YES)
- [ ] ✅ 0 P0 (critical) bugs
- [ ] ✅ App doesn't crash on any test
- [ ] ✅ Auth login/signup works 100%
- [ ] ✅ Reminders create + notify correctly
- [ ] ✅ Sync works offline + online
- [ ] ✅ AI context generates in < 3s
- [ ] ✅ Push notifications deliver
- [ ] ✅ Paywall workflow tested
- [ ] ✅ Thomas & Julie give thumbs up
- [ ] ✅ Privacy policy approved
- [ ] ✅ App Store ready to submit

### NO-GO Criteria (If any YES, delay launch)
- [ ] ❌ Auth broken or security issues
- [ ] ❌ Data loss on any operation
- [ ] ❌ Sync failing > 5% of time
- [ ] ❌ NPS < 40 from beta testers
- [ ] ❌ Crashes affecting > 10% sessions
- [ ] ❌ Compliance issues (privacy, security)

---

## NEXT: DÉTAILS PAR SEMAINE

Prêt pour:
1. **Semaine 6:** POLISH & OPTIMIZATIONS
2. **Semaine 7:** IA INTEGRATION
3. **Semaine 8:** BETA TESTING & LAUNCH

---

**MOIS 2 — RECAP VISION**

À la fin du Mois 2:
- ✅ App complètement fonctionnelle
- ✅ Prêt pour App Store / Google Play
- ✅ Première vague d'utilisateurs beta
- ✅ Toutes les features MVP implémentées
- ✅ Prêt pour lancer publiquement en Mois 3

**Momentum: From zero to launchable in 8 weeks.** 🚀
