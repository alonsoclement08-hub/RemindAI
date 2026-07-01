# Aide RemindAI

Bienvenue. Cette documentation est organisée en 2 groupes selon ce que tu veux faire.

---

## 📱 App mobile

- [Comment lancer l'app](app/LANCER-APP.md)
- [Qu'est-ce que l'app fait](app/QUE-FAIT-APP.md)

## 🖥️ Back-office (panneau d'administration)

- [Comment lancer le back-office](erp/LANCER-ERP.md)
- [Qu'est-ce que le back-office fait](erp/QUE-FAIT-ERP.md)

---

## Commandes rapides

| Commande | Ce qu'elle fait |
|---|---|
| `run-app` | Lance le backend + l'app mobile (Expo, tunnel ngrok) |
| `run-back-office` | Lance le backend + le back-office web (`localhost:5173`) |
| `run-total` | Lance les deux en même temps dans deux fenêtres de terminal séparées |

L'app et le back-office partagent le **même backend** (port 4000) — pas besoin de le démarrer deux fois si l'un des deux tourne déjà.

---

## Prérequis avant de lancer quoi que ce soit

**Docker Desktop doit être ouvert.** Sans lui, la base de données et Redis ne tournent pas, et tout échoue avec "Internal Server Error".

1. Ouvre **Docker Desktop** depuis tes Applications (ou Spotlight)
2. Attends que l'icône de baleine soit verte
3. Lance ensuite `run-app` ou `run-back-office`

---

## Dépannage général

- **"Internal Server Error" partout** : Docker n'est pas démarré — voir ci-dessus
- **Le backend ne démarre pas** : regarde le fichier `backend.log` à la racine du projet
- **Un port est déjà utilisé** : les scripts `run-*` libèrent automatiquement les ports, mais en cas de doute ferme manuellement le terminal concerné
- **Connexion impossible** : vérifie que le backend tourne (`http://localhost:4000/api/health` doit répondre `{"status":"ok"}`)
- **Accès admin refusé** : seul un compte avec le rôle **admin** peut se connecter au back-office
- **Tunnel Expo coupé** : message "Tunnel connection has been closed" → tape `Ctrl+C` puis relance `run-app`
