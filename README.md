# Dossier — Backend

Backend Node.js/Express pour Dossier. Il fait deux choses que le frontend (artifact/React côté navigateur) **ne peut pas faire lui-même** à cause des restrictions réseau des artifacts Claude (qui n'autorisent que `api.anthropic.com`) :

1. **Recherche d'offres d'alternance** via l'API [La bonne alternance](https://api.apprentissage.beta.gouv.fr) (agrège France Travail + partenaires)
2. **Envoi réel d'emails** via l'API Gmail (OAuth2)

## 1. Installation locale

```bash
cd dossier-backend
npm install
cp .env.example .env
```

Remplis ensuite `.env` :

### a) Jeton La bonne alternance
1. Va sur https://api.apprentissage.beta.gouv.fr/fr/compte/profil et crée un compte
2. Récupère ton jeton d'accès → colle-le dans `ALTERNANCE_API_TOKEN`
3. **Important** : une fois connecté, ouvre la doc technique (Swagger) et vérifie le chemin exact de la route de recherche d'offres (tag `Offre-Emploi`, opération `jobSearch`). Ajuste `SEARCH_PATH` dans `src/services/alternanceApi.js` si besoin — c'est le seul endroit à toucher, tout le reste du backend n'a pas besoin de changer.

### b) OAuth Gmail
1. Va sur https://console.cloud.google.com/apis/credentials
2. Crée un OAuth Client ID de type "Web application"
3. Ajoute l'URI de redirection : `http://localhost:3001/api/auth/google/callback`
4. Active l'API Gmail (APIs & Services → Library → Gmail API → Enable)
5. Colle `Client ID` / `Client secret` dans `.env`

### Lancer le serveur
```bash
npm run dev
```
Le serveur tourne sur `http://localhost:3001`.

## 2. Endpoints disponibles

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Vérifie que le serveur tourne |
| GET | `/api/offres?romes=&latitude=&longitude=&radius=&diploma=&contractType=` | Recherche d'offres alternance |
| GET | `/api/auth/google?userId=xxx` | Renvoie l'URL de connexion Gmail |
| GET | `/api/auth/google/callback` | Callback OAuth (Google redirige ici) |
| GET | `/api/auth/google/status` | Statut de connexion Gmail (header `x-user-id` requis) |
| POST | `/api/auth/google/disconnect` | Déconnecte Gmail (header `x-user-id` requis) |
| POST | `/api/email/send` | Envoie un email (`{to, subject, body}`, header `x-user-id` requis) |

## 3. Brancher ton frontend existant

Dans ton CRM React actuel, remplace le flux "copier-coller" par un vrai appel :

```js
// Connexion Gmail (bouton "Connecter Gmail" dans les paramètres)
const { url } = await fetch(`${BACKEND_URL}/api/auth/google?userId=${userId}`).then(r => r.json());
window.location.href = url;

// Envoi d'un email de candidature
await fetch(`${BACKEND_URL}/api/email/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-user-id": userId },
  body: JSON.stringify({ to, subject, body }),
});

// Recherche d'offres
const { offres } = await fetch(
  `${BACKEND_URL}/api/offres?romes=M1805&latitude=48.85&longitude=2.35&radius=30`
).then(r => r.json());
```

## 4. Déploiement

Ce backend est un service Node classique — il se déploie sur **Railway**, **Render**, **Fly.io** ou un VPS. Pas compatible avec un déploiement "serverless pur" sans adaptation (le stockage de tokens via fichier JSON `src/data/db.json` suppose un disque persistant — pour Vercel/serverless, remplace `tokenStore.js` par une vraie base comme Postgres/Supabase).

**Avant la mise en prod réelle**, deux points à durcir :
- `requireUser` (middleware) est un placeholder qui fait confiance au header `x-user-id` envoyé par le frontend — à remplacer par une vraie session/JWT vérifiée côté serveur, en réutilisant l'auth de ton onboarding.
- Le stockage des tokens Gmail (`src/data/db.json`) doit passer sur une vraie base de données en production.

## 5. Structure

```
dossier-backend/
├── server.js                  # point d'entrée Express
├── src/
│   ├── routes/
│   │   ├── offres.routes.js   # recherche d'offres alternance
│   │   ├── auth.routes.js     # OAuth Gmail
│   │   └── email.routes.js    # envoi d'emails
│   ├── services/
│   │   ├── alternanceApi.js   # adaptateur API La bonne alternance
│   │   ├── gmail.js           # OAuth2 + envoi via Gmail API
│   │   └── tokenStore.js      # stockage des tokens (JSON, à remplacer en prod)
│   ├── middleware/
│   │   └── requireUser.js     # identification utilisateur (placeholder)
│   └── data/db.json           # généré automatiquement au premier lancement
```
