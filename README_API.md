# 🎰 POKER APP - Architecture avec API

## ✅ État actuel

- **Base de données:** 5 tables créées et validées ✅
- **API REST:** 6 endpoints PHP créés ✅
- **Client API:** `api.js` chargé et prêt ✅
- **Synchronisation:** `sync.js` gère la synchro API ↔ Frontend ✅

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
  api.js
    ↓
jQuery endpoint (ex: /api/players.php)
    ↓
MySQL BD
```

**sync.js** = passerelle entre app.js et api.js

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

| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/players.php` | GET | Récupérer tous les joueurs |
| `/api/players.php` | POST | Créer un joueur |
| `/api/sessions.php` | GET | Récupérer les séances |
| `/api/sessions.php?action=detail&id=X` | GET | Détails d'une séance |
| `/api/sessions.php` | POST | Créer une séance |
| `/api/sessions.php` | PUT | Modifier le status d'une séance |
| `/api/session_participations.php` | GET | Participations d'une séance |
| `/api/session_participations.php` | POST | Ajouter joueur à séance |
| `/api/session_participations.php` | PUT | Mettre à jour participation |
| `/api/tournaments.php` | GET | Récupérer les tournois |
| `/api/tournaments.php` | POST | Créer un tournoi |
| `/api/ranking.php?action=general` | GET | Classement général |
| `/api/ranking.php?action=player&id=X` | GET | Stats d'un joueur |
| `/api/users.php?action=register` | POST | Créer un compte |
| `/api/users.php?action=login` | POST | Connexion |

---

## ⚠️ Prochaines étapes

1. **Modifier app.js** pour utiliser `createPlayerAPI()`, `createSessionAPI()`, etc.
2. **Tester chaque fonction** dans la console du navigateur
3. **Ajouter l'authentification** (login/register page)
4. **Ajouter les Foreign Keys** dans la BD (optionnel mais recommandé)

---

**Status:** 🟢 API fonctionnelle et prête!
