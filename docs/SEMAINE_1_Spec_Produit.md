# SEMAINE 1 — SPEC PRODUIT COMPLÈTE
**RemindAI • App Rappels IA Proactive**

---

## VISION & POSITIONING

### Le problème
Les gens oublient des choses importantes. Todoist, Things, et Reminders natif te font créer et gérer manuellement les rappels — c'est du travail. RemindAI te décharge complètement: l'app détecte ce que tu dois rappeler, te l'interdits au bon moment et au bon endroit, et t'offre des suggestions intelligentes.

### Notre positionnement
**RemindAI = "l'IA qui pense à ta place"**

Pas un task manager — un assistant proactif qui apprend tes habitudes et te suggère ce que tu devrais faire, avant même que tu n'y penses.

---

## USER PERSONAS

### Persona 1: Thomas — Le Freelancer (MVP Priority)

**Profil:**
- Âge: 35 ans
- Métier: Freelancer (consultant, développeur, designer)
- Revenu: 3-5k€/mois
- **Problème clé:** Gère 5-10 clients, perd des follow-ups, laisse des emails sans réponse 1-2 semaines
- Tech-savvy: Oui (utilise Slack, Notion, Gmail)
- Comportement: Matin check emails | Midi réunions/calls | Soir peu actif
- Pain points: Manque de système; perd argent quand oublie follow-up client

**Cas d'usage clé:**
> "Je reçois un email de client le lundi 10h. Je réponds pas de suite. Mercredi, RemindAI me dit 'Email de Jean sans réponse depuis 48h — appelle-le maintenant'. Je vois le rappel, me dis ouais faut que j'appelle, et bam — deal sauvé, client heureux."

**Willingness to pay:** Pro 4,99€/mois = easy (économise 100€+ en clients perdus)

---

### Persona 2: Julie — La Mère Professionnelle

**Profil:**
- Âge: 40 ans
- Métier: Manager en startup (Product Manager, Ops Lead)
- Revenu: 50-70k€/year
- **Problème clé:** Jongle work + 2 enfants + perso. Oublie rdv (médecin), courses, devoirs
- Tech-savvy: Modéré (Outlook, Teams, Google Calendar)
- Comportement: Matin fou (enfants) | Midi réunions | Soir surcharge mentale
- Pain points: Stress constant; oublie choses importantes; se sent débordée

**Cas d'usage clé:**
> "Vendredi 17h, RemindAI me dit 'Ton retour passe au Carrefour Voltaire jusqu'à 21h — tu dois passer prendre le colis avant 18h. Tu seras à côté à 17h45.' Boom — j'oublie plus de colis, plus de stress."

**Willingness to pay:** Pro 4,99€/mois = justifiable si décharge vraiment

---

## STRATÉGIE FREEMIUM

### Gratuit (Free tier)
- ✅ Jusqu'à **20 rappels actifs** (simultanément)
- ✅ Création manuelle illimitée
- ✅ Notifications basiques
- ✅ Résumé IA quotidien
- ✅ 3 commandes vocales/jour
- ❌ PAS de détection proactive
- ❌ PAS de géo-rappels
- ❌ PAS d'intégrations

**Pourquoi 20 rappels?**
- Thomas: gère 5-10 clients = 5-10 rappels = franchit limit rapidement → converts
- Julie: ~15 rappels (rdv, courses, devoirs, habits) = presque au limit → converts

### Pro (4,99€/mois)
- ✅ Rappels illimités
- ✅ Voix illimitée (multi-langues)
- ✅ Géo-rappels ultra-précis (lieu exact + temps de trajet)
- ✅ Détection proactive (Gmail, Outlook, Slack)
- ✅ Suggestions IA 24/7
- ✅ Intégrations (Notion, Calendar, Slack)
- ✅ Mode focus + statistiques
- ✅ Priorité support

---

## SPEC PRODUIT MVP

### Goals (Mois 1-7)
- Lancer une app iOS/Android + web
- Acquérir 1000+ utilisateurs free et 50+ Pro en Month 7
- Prouver que la détection proactive fonctionne et plaît
- Avoir une NPS > 50 et retention > 40% au jour 30

### Non-Goals
- ❌ Team management (B2B) — v1.1 seulement
- ❌ Analytics avancées — basic seulement en Pro
- ❌ Custom automations — v1.1

### Core Features — MVP

#### 1. Création de rappel (Natural Language)
- Input: Texte ou voix ("Rappelle-moi d'appeler maman demain à 18h")
- IA parse en temps réel: tâche, quand, où, avec qui
- User peut éditer chaque champ
- Catégories auto-détectées (work, personal, health, errand, habit)

#### 2. Home Screen avec Contexte IA
- Hero card: "Tu as 3 choses urgentes. Le board à 9h30 est priorité."
- Reminder cards avec contexte intelligent
- Swipe: left = snooze, right = complete
- Progress ring FAB
- Sections: Aujourd'hui | Terminé | Demain

#### 3. Suggestions IA Inline
- "Tu pourrais ajouter: appeler Léa pour le brief produit"
- Basé sur: agenda, messages non-lus, patterns
- User peut add/dismiss

#### 4. Notifications Intelligentes
- Push au moment idéal (pas trop tôt, pas trop tard)
- Priorité urgence (rouge=urgent, orange=normal)
- Groupage smart (pas 5 notifs d'affilée)

#### 5. Auth & Sync
- Login: Email + password
- Stockage local SQLite
- Sync offline-first

### Features Future (Post-Launch)
- 🔮 Détection proactive (email unanswered, Slack) — v1.1
- 🔮 Géo-rappels avec lieu exact — v1.1
- 🔮 Intégrations (Notion, Calendar, Slack) — v1.2
- 🔮 Team management & Business plan — v1.3
- 🔮 Voice reminders (lire le rappel) — v1.2

---

## SUCCESS METRICS

### Retention
- Day 1 retention: > 60%
- Day 7 retention: > 35%
- Day 30 retention: > 15%

### Conversion
- Free → Pro: > 5% (goal 7%)
- Trigger: Utilisateur atteint limit de 20 rappels

### Engagement
- Rappels créés / utilisateur / jour: > 1
- Rappels complétés: > 70% (non snoozés)
- Suggestions acceptées: > 30%

### NPS
- Target: > 50 (excellent pour une app de productivité)

---

## USER FLOWS

### Flow 1: Thomas crée un rappel pour follow-up client
1. Thomas reçoit email du client Jean lundi 10h
2. Mardi 14h, RemindAI sug. "Tu n'as pas répondu à Jean depuis 28h. Appelle-le?". Il dit oui.
3. Mercredi 10h (heure de la standup), RemindAI notif: "Appeler Jean — tu disais mercredi. C'est maintenant." Swipe right → DONE.
4. Thomas voit "Appeler Jean" dans Terminé. Le rappel montre sa history ("Suggéré mardi par IA").

### Flow 2: Julie utilise un géo-rappel (future)
1. Lundi, Julie reçoit SMS: "Colis en attente au Point Relais Voltaire jusqu'à vendredi 18h". Elle dit-le à RemindAI.
2. Jeudi 17h45, RemindAI voit: "T'approches du Point Relais (tu seras là dans 5 min). Tu dois chercher le colis!". Notif push.
3. Julie voit la notif, pense "oh c'est bon, merci IA", passe au Point Relais en rentrant, cherche le colis. Julie: "C'est dingue, j'oublie jamais. Pro coûte combien? 5€? Done."

---

## LIVRABLES SEMAINE 1

✅ Spec produit complète (ce document)
✅ User personas détaillés
✅ User flows
✅ Strategy freemium validée
✅ Success metrics définies

---

**FIN SEMAINE 1 ✅**

Prêt pour **Semaine 2**: Validation concurrence + architecture backend
