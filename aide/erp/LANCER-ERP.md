# Comment lancer le Back-office RemindAI

## Avant de commencer — Docker

**Docker Desktop doit être ouvert** (l'icône de baleine dans la barre du haut doit être verte).
Sans Docker, la base de données ne tourne pas et tout échoue avec "Internal Server Error".

---

## Ouvrir le terminal

1. Appuie sur **Cmd + Espace** pour ouvrir Spotlight
2. Tape **Terminal** et appuie sur Entrée
3. Une fenêtre noire s'ouvre — tu es prêt

---

## Lancer le back-office

Dans le terminal, tape simplement :

```
run-back-office
```

C'est tout. Le script va automatiquement :
- Libérer les ports si un ancien serveur tourne encore
- Démarrer le **backend** (le même que celui utilisé par l'app)
- Démarrer le **back-office** (le panneau web d'administration)

---

## Quel terminal regarder ?

- Si tu as lancé `run-back-office` : tout se passe **dans le même terminal** où tu as tapé la commande.
- Si tu as lancé `run-total` : **deux nouvelles fenêtres** de terminal s'ouvrent automatiquement.
  - La fenêtre **du back-office** est celle qui affiche `VITE ... ready` et l'adresse `http://localhost:5173`
  - L'autre fenêtre (qui affiche `Tunnel ready` + un QR code) est celle de l'app

**Astuce** : appuie sur **Cmd + `** (sous Échap) pour faire défiler les fenêtres Terminal ouvertes.

---

## Ouvrir le back-office dans le navigateur

Une fois le terminal prêt, ouvre cette adresse dans ton navigateur :

```
http://localhost:5173
```

Connecte-toi avec ton compte admin (`alonso.clement08@gmail.com`).

---

## En cas de problème

| Problème | Solution |
|---|---|
| "Internal Server Error" | Docker n'est pas démarré — ouvre Docker Desktop et attends que la baleine soit verte |
| Page blanche | Attends quelques secondes que Vite démarre, puis rafraîchis |
| Connexion échouée "accès refusé" | Ton compte n'a pas le rôle admin |
| "Too many auth attempts" | 5 tentatives échouées → attends 15 minutes |
| Session expirée | La session dure 30 minutes — reconnecte-toi |
| Erreurs backend | Regarde le fichier `backend.log` à la racine du projet |

---

## Lancer le back-office ET l'app en même temps

```
run-total
```

Ouvre deux nouvelles fenêtres : une pour l'app (Expo), une pour le back-office. Voir [le guide de l'app](../app/LANCER-APP.md) pour le QR code.
