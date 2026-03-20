# 🎰 POKER APP - Architecture avec API

## ✅ État actuel

- **Base de données:** 5 tables créées et validées ✅
- **API REST:** 6 endpoints PHP créés ✅
- **Frontend JS:** `app.js` (API + synchro + UI) ✅

---

## 📡 Comment utiliser l'API depuis le frontend

### Exemple 1: Ajouter un joueur

```javascript
// Créer un joueur
const result = await createPlayerAPI('Lucas Petit', '00123');

if (result) {
  console.log('✅ Joueur créé avec ID:', result.id);
  // players array est automatiquement mis à jour
}
```

### Exemple 2: Créer une séance

```javascript
// Créer une séance pour aujourd'hui
const date = todayISO(); // ex: "2026-03-19"
const session = await createSessionAPI(date);

if (session) {
  console.log('✅ Séance créée avec ID:', session.id);
  liveSession = session; // utiliser pour la séance en cours
}
```

### Exemple 3: Ajouter un joueur à une séance

```javascript
// Ajouter Lucas (ID 1) à la séance
const result = await addPlayerToSessionAPI(liveSession.id, 1);

if (result) {
  // La première ligne (participations) est ajoutée à liveSession.rows
  renderLiveSession(); // Raffraîchir l'affichage
}
```

### Exemple 4: Clôturer une séance

```javascript
// Quand on clique sur "Clôturer la séance"
const result = await closeSessionAPI(liveSession.id);

if (result.success) {
  // La séance est sauvegardée en BD
  session.status = 'closed';
  sessions.push(session); // Sauvegarder en attente
  liveSession = null;
  renderSessionsGrid();
}
```

---

## 🔄 Flux de données

```
Frontend (app.js)
    ↓
Point d'entree unique (/api/index.php?endpoint=...)
    ↓
MySQL BD
```

---

## 📝 À modifier dans app.js

Ces fonctions utilisent `localStorage`. Il faut les adapter pour utiliser l'API:

1. **addPlayer()** → utiliser `createPlayerAPI()`
2. **openSession()** → utiliser `createSessionAPI()`
3. **addPlayerRow()** → utiliser `addPlayerToSessionAPI()`
4. **closeSession()** → utiliser `closeSessionAPI()`
5. **addTournamentWinner()** → utiliser `createTournamentAPI()`

---

## 🧪 Tester l'API

### Depuis le navigateur console:

```javascript
// Récupérer tous les joueurs
const players = await PokerAPI.getAllPlayers();
console.log(players);

// Créer un joueur
const result = await PokerAPI.createPlayer('Test', '001');
console.log(result);

// Récupérer le classement
const ranking = await PokerAPI.getRanking();
console.log(ranking);
```

---

## 📊 Endpoints API disponibles

### Nouveau format (recommande)

Point d'entree unique:

`/api/index.php?endpoint=...`

| Endpoint unique | Methode | Fonction |
|-----------------|---------|----------|
| `/api/index.php?endpoint=players&action=all` | GET | Recuperer tous les joueurs |
| `/api/index.php?endpoint=players` | POST | Creer un joueur |
| `/api/index.php?endpoint=sessions&action=all` | GET | Recuperer les seances |
| `/api/index.php?endpoint=sessions&action=detail&id=X` | GET | Details d'une seance |
| `/api/index.php?endpoint=sessions` | POST | Creer une seance |
| `/api/index.php?endpoint=sessions` | PUT | Modifier le status/isArchived d'une seance |
| `/api/index.php?endpoint=session_participations` | GET/POST/PUT | Participations |
| `/api/index.php?endpoint=tournaments` | GET/POST/PUT/DELETE | Tournois |
| `/api/index.php?endpoint=ranking&action=general` | GET | Classement general |
| `/api/index.php?endpoint=ranking&action=player&id=X` | GET | Stats d'un joueur |
| `/api/index.php?endpoint=users&action=register` | POST | Creer un compte |
| `/api/index.php?endpoint=users&action=login` | POST | Connexion |

Architecture backend actuelle:

- API metier: `api/index.php`
- Configuration DB/CORS: `api/config.php`

---

## ⚠️ Prochaines étapes

1. **Modifier app.js** pour utiliser `createPlayerAPI()`, `createSessionAPI()`, etc.
2. **Tester chaque fonction** dans la console du navigateur
3. **Ajouter l'authentification** (login/register page)
4. **Ajouter les Foreign Keys** dans la BD (optionnel mais recommandé)

---

**Status:** 🟢 API fonctionnelle et prête!
