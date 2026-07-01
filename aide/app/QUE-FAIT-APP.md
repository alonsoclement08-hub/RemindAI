# Qu'est-ce que RemindAI ?

RemindAI est une application mobile de gestion de rappels intelligente, développée avec React Native / Expo et connectée à un backend Node.js.

---

## Fonctionnalités principales

### Rappels
- Créer, modifier, compléter et archiver des rappels
- Catégories : Travail, Santé, Courses, Habitudes, Personnel, Appels
- Rappels récurrents (quotidien, hebdomadaire, mensuel)
- Notifications push sur le téléphone
- **Détection de conflits** : si tu crées un rappel à une heure déjà occupée (±30 min), l'app te prévient avant de sauvegarder

### Assistant IA (tab IA)
L'onglet IA propose deux modes, sélectionnables avec un toggle :

**Mode "Créer un rappel"**
- Écris ou dicte ton rappel en langage naturel : *"Appeler maman demain à 18h"*
- L'IA (Groq, llama-3.3-70b) extrait automatiquement la date, l'heure, la catégorie et la priorité
- Elle pose des questions si des infos manquent (QCM interactif)
- Elle propose des recommandations liées à ta demande
- Tu confirmes et le rappel est créé

**Mode "Poser une question"**
- Chat conversationnel : pose n'importe quelle question à Rem (l'IA)
- Rem connaît ton agenda et tes rappels
- Exemples : *"Qu'est-ce que j'ai prévu aujourd'hui ?"*, *"Des conseils pour mieux m'organiser ?"*

### Résumé quotidien
- Chaque matin à **8h**, l'app envoie une notification push avec un résumé de ta journée généré par l'IA
- Le résumé s'adapte à tes rappels du jour, ta progression, et tes habitudes

### Routines
- Créer des routines composées de plusieurs étapes
- Exécuter une routine d'un seul tap pour compléter toutes ses étapes

### Tableau de bord
- Résumé quotidien de tes rappels et progression
- Recommandations intelligentes basées sur tes habitudes
- Suivi de budget par catégorie
- Statistiques et patterns

### Comparaison de prix (rappels Courses)
- Sur un rappel de type "Courses", l'app affiche les prix comparés pour le produit

---

## Sécurité

- Si quelqu'un essaie de se connecter avec un mauvais mot de passe, l'event est automatiquement signalé aux admins
- Si ton compte est bloqué par un admin, l'app te déconnecte immédiatement
- Les données locales sont isolées par compte : si tu changes de compte, les données du précédent sont effacées

---

## Compte utilisateur

- Inscription et connexion par email
- Connexion avec Google (OAuth)
- Stockage des données sur le backend + base de données locale SQLite pour l'accès hors ligne
- Plan gratuit : 20 rappels actifs maximum
- Plan Pro : rappels illimités + fonctionnalités avancées

---

## Intégrations

| Service | Ce qu'il fait |
|---|---|
| **Google Calendar** | Synchronise tes rappels dans ton calendrier Google |
| **Spotify** | Lance une playlist automatiquement quand tu complètes un rappel |
| **Notion** | Exporte tes rappels complétés dans une base Notion |
| **Apple Health** | Enregistre tes activités sport et santé |

---

## Stack technique

- **Frontend** : React Native + Expo SDK 54 + expo-router
- **Backend** : Node.js/Express (port 4000) + PostgreSQL + Redis
- **IA** : Groq API (llama-3.3-70b-versatile) — réponses en moins d'1 seconde
- **Base de données locale** : SQLite (expo-sqlite)
- **Tunnel** : ngrok (pour accéder au backend depuis le téléphone)

---

## Administration

Il existe un back-office web séparé pour gérer les comptes, surveiller la sécurité et analyser les attaques avec l'IA. Voir [le guide back-office](../erp/QUE-FAIT-ERP.md).
