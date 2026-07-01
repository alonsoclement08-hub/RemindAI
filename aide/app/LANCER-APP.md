# Comment lancer l'app RemindAI

## Avant de commencer — Docker

**Docker Desktop doit être ouvert** (l'icône de baleine dans la barre du haut doit être verte).
Sans Docker, la base de données ne tourne pas et l'app ne peut pas se connecter.

---

## Ouvrir le terminal

1. Appuie sur **Cmd + Espace** pour ouvrir Spotlight
2. Tape **Terminal** et appuie sur Entrée
3. Une fenêtre noire s'ouvre — tu es prêt

---

## Lancer l'app

Dans le terminal, tape simplement :

```
run-app
```

C'est tout. Le script va automatiquement :
- Libérer les ports si un ancien serveur tourne encore
- Démarrer le **backend** (le serveur qui gère les données)
- Créer un **tunnel ngrok** pour que ton téléphone puisse joindre le backend
- Démarrer **Expo** avec le QR code

---

## Quel terminal regarder ?

- Si tu as lancé `run-app` : tout se passe **dans le même terminal** où tu as tapé la commande. Le QR code apparaît juste en dessous.
- Si tu as lancé `run-total` : **deux nouvelles fenêtres** de terminal s'ouvrent automatiquement.
  - La fenêtre **de l'app** est celle qui affiche `Tunnel ready` puis un QR code
  - L'autre fenêtre (qui affiche `VITE ... ready`) est celle du back-office — ce n'est pas celle-là pour l'app

**Astuce** : appuie sur **Cmd + `** (sous Échap) pour faire défiler les fenêtres Terminal ouvertes.

---

## Scanner le QR code

Une fois que le terminal affiche un QR code :

1. Ouvre l'app **Expo Go** sur ton iPhone
2. Appuie sur **Scan QR Code**
3. Scanne le code dans le terminal
4. L'app se lance sur ton téléphone

---

## En cas de problème

| Problème | Solution |
|---|---|
| QR code qui ne s'affiche pas | Attends 10-20 secondes que Metro Bundler démarre |
| "Tunnel connection has been closed" | Fais `Ctrl+C` puis relance `run-app` |
| App qui ne charge pas | Vérifie ta connexion internet (le tunnel ngrok en a besoin) |
| "Serveur inaccessible" à l'inscription | Le tunnel n'est pas encore prêt — attends que le script affiche l'URL ngrok |
| Erreurs backend | Regarde le fichier `backend.log` à la racine du projet |

---

## Lancer l'app ET le back-office en même temps

```
run-total
```

Ouvre deux nouvelles fenêtres : une pour l'app (Expo), une pour le back-office. Voir [le guide back-office](../erp/LANCER-ERP.md).
