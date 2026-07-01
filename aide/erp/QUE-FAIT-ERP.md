# Qu'est-ce que le Back-office RemindAI ?

Le back-office est un panneau d'administration web séparé de l'app mobile, réservé aux comptes **admin**. Il permet de gérer les utilisateurs, surveiller la sécurité, analyser les attaques avec l'IA, et recevoir des alertes en temps réel.

---

## Fonctionnalités principales

### Tableau de bord
- Vue d'ensemble : nombre total d'utilisateurs, comptes actifs/bloqués, admins, rappels actifs, événements de sécurité récents
- Widgets **déplaçables** (glisser-déposer) et personnalisables (ajout/retrait)
- Disposition sauvegardée automatiquement

### Gestion des comptes
- Liste de tous les comptes avec recherche et filtres (admin / utilisateur / pro / bloqué)
- Promouvoir un compte en admin ou le rétrograder
- Bloquer / débloquer un compte
- Supprimer un compte avec toutes ses données associées
- Impossible de te bloquer ou de te rétrograder toi-même (protection anti-erreur)

### Sécurité — Journal des événements
- Journal de **tous** les événements suspects : tentatives de connexion échouées, accès refusés, dépassements de quota, inscriptions, activités suspectes
- **Deux sources** visibles dans le même journal :
  - 🔵 **App mobile** : les événements envoyés directement depuis l'application (ex: quelqu'un essaie de se connecter sur l'app avec un mauvais mot de passe)
  - ⚪ **API Backend** : les événements détectés côté serveur (ex: quelqu'un attaque l'API directement)
- Filtres par sévérité (High / Medium / Low), source (App / API), et type d'événement
- Affiche jusqu'à 500 événements sans limite de date

### Analyse IA des attaques
- Bouton **"Analyser"** sur chaque événement → l'IA (Groq) analyse l'attaque en détail
- L'analyse explique :
  1. Ce qui s'est passé exactement
  2. Le niveau de risque réel
  3. Les indices suspects (fréquence, IP, pattern)
  4. Ce que tu dois faire maintenant
  5. Comment renforcer la sécurité pour éviter que ça se reproduise

### Alertes push en temps réel
- Dès qu'un événement **Medium** ou **High** est détecté, les admins reçoivent une **notification push** sur leur téléphone
- La notification indique le type d'événement, l'email concerné et l'IP
- Tu es alerté immédiatement, même si le back-office n'est pas ouvert

### Assistant IA
- Chat propulsé par **Groq** (llama-3.3-70b-versatile)
- Aide à analyser les comptes et les événements de sécurité
- Suggestions de questions prêtes à l'emploi

### Thème
- Bascule Auto / Clair / Sombre dans la barre latérale

---

## Sécurité du back-office

| Protection | Détail |
|---|---|
| Accès réservé aux admins | Vérifié côté serveur à chaque requête |
| Session courte | Token valable 30 minutes, sans renouvellement automatique |
| Token isolé | Un token back-office ne fonctionne pas sur l'app mobile (et inversement) |
| Verrouillage anti-bruteforce | 5 tentatives de connexion échouées → blocage 15 minutes |
| Limite de requêtes | Quotas séparés pour la lecture, les modifications de comptes et l'IA |
| Origine restreinte (CORS) | Seul `localhost:5173` peut appeler l'API depuis un navigateur |
| Journal d'audit | Toute modification de compte est enregistrée avec qui l'a faite |
| Comptes bloqués | Un compte bloqué est déconnecté immédiatement sur toutes les requêtes |

---

## Stack technique

- **Frontend** : React + Vite (port 5173)
- **Backend** : le même backend Node.js que l'app mobile (port 4000), routes dédiées sous `/api/admin`
- **Base de données** : PostgreSQL via Prisma (table `security_events` dédiée)
- **IA** : API Groq (llama-3.3-70b-versatile)
