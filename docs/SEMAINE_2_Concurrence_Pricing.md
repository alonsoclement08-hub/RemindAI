# SEMAINE 2 — VALIDATION CONCURRENCE & PRICING
**RemindAI • Mois 1**

---

## OBJECTIFS SEMAINE 2

1. ✅ Valider la spec avec cas d'usage réels des competitors
2. ✅ Affiner la stratégie de pricing
3. ✅ Identifier nos points de différenciation
4. ✅ Écrire les user stories MVP

---

## ANALYSE CONCURRENCE

### 1. Todoist
**Strengths:**
- ✅ Très populaire (millions d'utilisateurs)
- ✅ UX polishée et cohérente
- ✅ Intégrations massives (100+)
- ✅ Récurrences flexibles
- ✅ Labels + priorities bien pensés

**Weaknesses:**
- ❌ Aucune IA proactive (zero suggestions)
- ❌ Création manuelle = toujours du travail
- ❌ Pas de contexte intelligent ("pourquoi tu dois faire ça?")
- ❌ Pas de géo-rappels
- ❌ Pas de voice input natural (juste voice shortcuts)
- ❌ Pricing: 4€/mois gratuit, 11€/mois pro — plus cher que nous

**Notre avantage:**
🎯 IA proactive détecte ce qu'il FAUT rappeler
🎯 Voice naturel français ("Rappelle-moi de...")
🎯 Contexte intelligent sur chaque rappel
🎯 Géo-rappels (Todoist pas bon là-dessus)
🎯 Prix 4,99€ vs 11€

---

### 2. Things 3 (Apple only)
**Strengths:**
- ✅ Magnifique design Apple
- ✅ Très rapide et smooth
- ✅ Offline-first
- ✅ Loyal user base (designers, créatifs)

**Weaknesses:**
- ❌ Zéro IA
- ❌ Aucune détection proactive
- ❌ Aucune intégration cloud
- ❌ Zéro voice input
- ❌ Pricing: 40€ one-time (pas récurrent, mais cher)
- ❌ iOS only

**Notre avantage:**
🎯 IA + suggestions au lieu de "tu dois te souvenir"
🎯 Cross-platform (iOS + Android + Web)
🎯 Pricing récurrent 4,99€ vs 40€ one-time
🎯 Suggestions proactives = Things n'a rien

---

### 3. Apple Reminders (Native)
**Strengths:**
- ✅ Gratuit
- ✅ Intégré à iOS
- ✅ Géo-rappels natifs
- ✅ Siri voice input

**Weaknesses:**
- ❌ Aucune IA
- ❌ UX basique
- ❌ Pas de suggestions
- ❌ Pas de contexte
- ❌ Pas de cross-platform (iOS only, pas de web)
- ❌ Siri voice est limité en français

**Notre avantage:**
🎯 IA proactive VS zéro intelligence
🎯 Contexte intelligent ("pourquoi tu dois faire ça?")
🎯 Voice français naturel
🎯 Cross-platform
🎯 Suggestions intelligentes

---

### 4. Microsoft To Do
**Strengths:**
- ✅ Gratuit
- ✅ Intégré Microsoft ecosystem
- ✅ Simple et léger
- ✅ Cross-platform

**Weaknesses:**
- ❌ Zéro IA
- ❌ Aucune détection proactive
- ❌ Pas de contexte intelligent
- ❌ Pas de voice input natural
- ❌ UX basique, pas cool

**Notre avantage:**
🎯 IA proactive intelligente
🎯 Contexte + suggestions
🎯 Voice naturel français
🎯 UX moderne et agréable

---

## CONCLUSION ANALYSE CONCURRENCE

### Le marché des rappels est SATURÉ mais...
- ✅ **Personne n'a fait l'IA proactive bien**
- ✅ Todoist = task manager, pas assistant
- ✅ Things = design premium, pas IA
- ✅ Reminders/To Do = gratuit mais basique

### **Notre USP unique:**
> "L'app qui détecte ce que tu dois faire et te le rappelle au bon moment. Pas toi qui crées manuellement."

C'est le vrai différenciateur. **Tout le marché crée manuellement. Nous: détection automatique.**

---

## STRATÉGIE DE PRICING AFFINÉE

### Gratuit
**Limite:** 20 rappels actifs simultanés

**Rationale:**
- Thomas (5-10 clients) = hits limit en 2-3 semaines
- Julie (15 rappels) = hits limit rapidement aussi
- Assez généreux pour tester = conversion naturelle (pas forcée)

**Segment:** Testteurs + utilisateurs légers (0-30% conversion)

### Pro (4,99€/mois)
**Cible:** Thomas + Julie + power users

**Rationale:**
- 4,99€ = moins qu'un café/jour
- Sweet spot psychologique pour SaaS consumer
- À 100k users, 5% conversion = 2500€/mois
- À 1M users, 5% conversion = 25k€/mois

**Conversion trigger:**
- User atteint 20 rappels → paywall auto
- NPS > 50 avant paywall (on gène si app n'est pas bonne)

### Business (12€/siège/mois)
**Cible:** PMEs (5-50 people) en Phase 7+

**Rationale:**
- PME de 20 = 240€/mois (viable pour une petite boîte)
- À 50 PMEs = 12k€/mois ARR
- Marché énorme mais on adresse en v1.1+ (pas MVP)

---

## USER STORIES MVP

### Pour Thomas (Freelancer)

**US-1: Je crée un rappel par voix naturelle**
```
En tant que Thomas (freelancer avec 8 clients),
Je veux dicter rapidement "Rappelle-moi d'appeler Jean demain à 15h"
Afin de créer un rappel sans me perdre 5 min à taper.

Acceptance criteria:
- ✅ Je parle en français naturel
- ✅ L'app parse: tâche (appeler Jean) + quand (demain 15h)
- ✅ Je vois le parsing avant de confirmer
- ✅ Je peux éditer si mal compris
- ✅ Je crée le rappel en < 30 secondes
```

**US-2: Je reçois une suggestion proactive**
```
En tant que Thomas,
Je veux que RemindAI détecte "Jean t'a emailed mais tu n'as pas répondu"
Afin de ne pas oublier et de garder le client heureux.

Acceptance criteria:
- ✅ L'app lit mon calendrier + emails
- ✅ Elle détecte si j'ai oublié de répondre
- ✅ Elle me suggère: "Appeler Jean? Email depuis 48h"
- ✅ Je peux ajouter en 1 tap ou ignorer
- ✅ Si j'ignore, elle ne me spam pas (respects mes choix)
```

**US-3: Je swipe pour marquer un rappel fait**
```
En tant que Thomas,
Je veux swiper à droite pour dire "fait" rapidement
Afin de garder ma liste propre sans tapoter partout.

Acceptance criteria:
- ✅ Swipe droit = DONE (avec satisfying animation)
- ✅ Le rappel disparaît de "Aujourd'hui"
- ✅ Il apparaît dans "Terminé"
- ✅ Je vois l'historique (quand créé, quand complété)
```

### Pour Julie (Mère/Manager)

**US-4: Je reçois un rappel au bon moment**
```
En tant que Julie (maman + manager),
Je veux être rappelée de "passer au Carrefour" quand je suis à côté
Afin de ne pas oublier ET de pas être dérangée trop tôt.

Acceptance criteria:
- ✅ Je crée: "Acheter lait et œufs Carrefour Voltaire"
- ✅ L'app sait que je passe par là vendredi 17h45
- ✅ La notif arrive à 17h45, pas à 9h (quand je l'ai créé)
- ✅ La notif dit: "Tu approches du Carrefour"
- ✅ Je swipe RIGHT → DONE, plus besoin d'y penser
```

**US-5: Je vois un résumé IA le matin**
```
En tant que Julie,
Je veux voir "Tu as 3 choses urgentes aujourd'hui" le matin
Afin de commencer ma journée sans stress (je sais ce qu'il faut faire).

Acceptance criteria:
- ✅ Résumé arrive entre 7h-8h (customizable)
- ✅ Il liste: tâches urgentes + tâches normales
- ✅ Il donne du contexte: "Le board est à 9h30, c'est priorité"
- ✅ Je vois ma progression du jour (% complété)
```

**US-6: Je crée un rappel récurrent (habitude)**
```
En tant que Julie,
Je veux dire "Méditer 10 minutes tous les matins à 8h"
Afin de pas avoir à créer le rappel 365x.

Acceptance criteria:
- ✅ Je dis ou tape: "Méditer 10 min tous les matins 8h"
- ✅ L'app crée une habitude récurrente
- ✅ L'app me montre ma streak (14 jours d'affilée!)
- ✅ Si je rate un jour, elle ne me juge pas (pas de streak break en hard)
```

### General (Both)

**US-7: Je configure mes notifications**
```
En tant que Thomas/Julie,
Je veux choisir comment/quand être notifié
Afin de pas être spammé mais d'avoir les rappels importants.

Acceptance criteria:
- ✅ Je peux mute les notifications
- ✅ Je peux définir une "quiet hour" (19h-8h = pas de notif)
- ✅ Je peux prioritize certaines catégories
- ✅ Je vois mes settings sauvegardés
```

**US-8: Je vois le contexte IA sur chaque rappel**
```
En tant que Thomas/Julie,
Je veux voir "Pourquoi je dois faire ça?" sur chaque rappel
Afin de comprendre le contexte (si j'avais oublié).

Acceptance criteria:
- ✅ Chaque rappel a un "Contexte IA"
- ✅ Contexte dit: "J'ai trouvé un brouillon Notion updaté vendredi"
- ✅ Ou: "Le cabinet ouvre 9h et ferme 12h30-14h, 11h est idéal"
- ✅ Ou: "Tu as médité 14 jours d'affilée, c'est incroyable"
```

**US-9: Je peux snooze un rappel**
```
En tant que Thomas/Julie,
Je veux swiper à gauche pour "plus tard" sans le faire maintenant
Afin de repousser si je suis occupé.

Acceptance criteria:
- ✅ Swipe gauche = snooze (animation)
- ✅ Options: +15min, Demain, Dimanche
- ✅ Rappel disparaît et revient au moment choisi
- ✅ Si snooze 3x, je peux définir "arrête de me rappeler"
```

---

## NEXT STEPS

**Semaine 2 concrètement:**
1. ✅ Lire ce doc (validation concurrence)
2. ✅ Faire des screenshots des competitors
3. ✅ Écrire les user stories en détail (c'est commencé)
4. ✅ Valider pricing avec Thomas + Julie (mental test)
5. ✅ Créer feature_checklist.csv (feature priority)

**Deliverables:**
- ✅ competitive_analysis.md (ce doc)
- ✅ user_stories_detailed.txt (ci-dessus)
- ✅ pricing_strategy.md (ci-dessus)
- ✅ feature_checklist.csv (à créer)

---

**FIN SEMAINE 2 ✅**

Prêt pour **Semaine 3**: Architecture Backend Design
