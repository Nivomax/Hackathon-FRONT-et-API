/* =========================
   Data Synchronization avec API
   
   Remplace localStorage par les appels API
========================= */

// Variables pour stocker en mémoire
let players = [];
let sessions = [];
let tournaments = [];
let archivedSessions = [];
let archivedTournaments = [];
let liveSession = null;

// Charger les données au démarrage
async function initializeFromAPI() {
  console.log('📡 Initialisation des données depuis l\'API...');
  
  try {
    // Charger les joueurs
    players = await PokerAPI.getAllPlayers();
    console.log(`✅ ${players.length} joueurs chargés`);
    
    // Charger les séances (sans participations pour l'instant)
    const rawSessions = await PokerAPI.getAllSessions();
    sessions = rawSessions.map(s => ({
      ...s,
      rows: []
    }));
    console.log(`✅ ${sessions.length} séances chargées`);
    
    // Charger TOUTES les participations
    const rawParticipations = await PokerAPI.getAllParticipations();
    
    
    // Mapper les participations dans les séances correspondantes
    for (const part of rawParticipations) {
      const session = sessions.find(s => s.id === part.session_id);
      if (session) {
        // Convertir les dates texte en timestamps millisecondes
        let arrivedAtMs = part.arrivedAt;
        let eliminatedAtMs = part.eliminateAt;
        
        // Si c'est une string de chiffres (timestamp), la convertir en nombre
        if (typeof part.arrivedAt === 'string' && part.arrivedAt) {
          if (/^\d+$/.test(part.arrivedAt)) {
            // C'est un timestamp numérique en string
            arrivedAtMs = parseInt(part.arrivedAt, 10);
          } else {
            // C'est une date texte "YYYY-MM-DD HH:MM:SS"
            arrivedAtMs = new Date(part.arrivedAt).getTime();
          }
        } else if (typeof part.arrivedAt === 'number' && part.arrivedAt > 0) {
          arrivedAtMs = part.arrivedAt;
        } else {
          arrivedAtMs = null;
        }
        
        if (typeof part.eliminateAt === 'string' && part.eliminateAt) {
          if (/^\d+$/.test(part.eliminateAt)) {
            // C'est un timestamp numérique en string
            eliminatedAtMs = parseInt(part.eliminateAt, 10);
          } else {
            // C'est une date texte "YYYY-MM-DD HH:MM:SS"
            eliminatedAtMs = new Date(part.eliminateAt).getTime();
          }
        } else if (typeof part.eliminateAt === 'number' && part.eliminateAt > 0) {
          eliminatedAtMs = part.eliminateAt;
        } else {
          eliminatedAtMs = null;
        }
        
        // Calculer LXP
        let lxp = 0;
        if (arrivedAtMs != null && eliminatedAtMs != null) {
          const diffMs = eliminatedAtMs - arrivedAtMs;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          lxp = Math.max(1, hours);
        }
        
        session.rows.push({
          participationId: part.id,
          playerName: part.name,
          playerId: part.player_id,
          studentNum: part.studentNum,
          arrivedAt: arrivedAtMs,
          eliminatedAt: eliminatedAtMs,
          position: part.position,
          placementPoints: part.placementPoints,
          lxp: lxp,
          winner: part.position === 1
        });
      }
    }
    console.log(`✅ ${rawParticipations.length} participations chargées`);
    
    // Charger les tournois
    tournaments = await PokerAPI.getAllTournaments();
    
    // Mapper winner_id vers winner (nom du joueur)
    tournaments = tournaments.map(t => {
      if (t.winner_id) {
        const winnerId = parseInt(t.winner_id, 10);
        const winner = players.find(p => {
          const playerId = typeof p.id === 'string' ? parseInt(p.id, 10) : p.id;
          return playerId === winnerId;
        });
        t.winner = winner ? winner.name : null;
      }
      return t;
    });
    
    console.log(`✅ ${tournaments.length} tournois chargés`);
    
    // Charger les tournois archivés
    archivedTournaments = await PokerAPI.getAllTournaments('archived') ?? [];
    
    // Mapper winner_id vers winner pour les tournois archivés aussi
    archivedTournaments = archivedTournaments.map(t => {
      if (t.winner_id) {
        const winnerId = parseInt(t.winner_id, 10);
        const winner = players.find(p => {
          const playerId = typeof p.id === 'string' ? parseInt(p.id, 10) : p.id;
          return playerId === winnerId;
        });
        t.winner = winner ? winner.name : null;
      }
      return t;
    });
    
    console.log(`✅ ${archivedTournaments.length} tournois archivés chargés`);
    const rawArchivedSessions = await PokerAPI.getAllSessions('archived');
    archivedSessions = rawArchivedSessions.map(s => ({
      ...s,
      rows: []
    }));
    
    // Mapper aussi les participations pour les séances archivées si nécessaire
    for (const part of rawParticipations) {
      const archivedSession = archivedSessions.find(s => s.id === part.session_id);
      if (archivedSession) {
        // Convertir les dates texte en timestamps millisecondes
        let arrivedAtMs = part.arrivedAt;
        let eliminatedAtMs = part.eliminateAt;
        
        if (typeof part.arrivedAt === 'string' && part.arrivedAt) {
          if (/^\d+$/.test(part.arrivedAt)) {
            arrivedAtMs = parseInt(part.arrivedAt, 10);
          } else {
            arrivedAtMs = new Date(part.arrivedAt).getTime();
          }
        } else if (typeof part.arrivedAt === 'number' && part.arrivedAt > 0) {
          arrivedAtMs = part.arrivedAt;
        } else {
          arrivedAtMs = null;
        }
        
        if (typeof part.eliminateAt === 'string' && part.eliminateAt) {
          if (/^\d+$/.test(part.eliminateAt)) {
            eliminatedAtMs = parseInt(part.eliminateAt, 10);
          } else {
            eliminatedAtMs = new Date(part.eliminateAt).getTime();
          }
        } else if (typeof part.eliminateAt === 'number' && part.eliminateAt > 0) {
          eliminatedAtMs = part.eliminateAt;
        } else {
          eliminatedAtMs = null;
        }
        
        let lxp = 0;
        if (arrivedAtMs != null && eliminatedAtMs != null) {
          const diffMs = eliminatedAtMs - arrivedAtMs;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          lxp = Math.max(1, hours);
        }
        
        archivedSession.rows.push({
          participationId: part.id,
          playerName: part.name,
          playerId: part.player_id,
          studentNum: part.studentNum,
          arrivedAt: arrivedAtMs,
          eliminatedAt: eliminatedAtMs,
          position: part.position,
          placementPoints: part.placementPoints,
          lxp: lxp,
          winner: part.position === 1
        });
      }
    }
    
    console.log(`✅ ${archivedSessions.length} séances archivées chargées`);
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
  }
}

// Créer un joueur ET le sauvegarder en BD
async function createPlayerAPI(name, studentNum = null) {
  try {
    const result = await PokerAPI.createPlayer(name, studentNum);
    
    if (result.error) {
      console.error('❌ Erreur création joueur:', result.error);
      return null;
    }
    
    // Ajouter le joueur à la liste locale
    const newPlayer = {
      id: result.id,
      name: name,
      studentNum: studentNum
    };
    
    players.push(newPlayer);
    console.log(`✅ Joueur créé: ${name}`);
    
    return newPlayer;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

// Créer une séance ET la sauvegarder en BD
async function createSessionAPI(date) {
  try {
    const result = await PokerAPI.createSession(date, 'created');
    
    if (result.error) {
      console.error('❌ Erreur création séance:', result.error);
      return null;
    }
    
    // Créer l'objet séance avec la structure app.js
    const newSession = {
      id: result.id,
      date: date,
      status: 'created',
      createdAt: Date.now(),
      rows: [] // Les participations seront ajoutées via addPlayerToSessionAPI
    };
    
    sessions.push(newSession);
    console.log(`✅ Séance créée: ${date}`);
    
    return newSession;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

// Ajouter un joueur à une séance
async function addPlayerToSessionAPI(sessionId, playerId, arrivedAt = null) {
  try {
    if (!arrivedAt) {
      arrivedAt = Date.now();
    }
    
    const result = await PokerAPI.addPlayerToSession(sessionId, playerId, arrivedAt);
    
    if (result.error) {
      console.error('❌ Erreur ajout joueur:', result.error);
      return null;
    }
    
    // Trouver la séance et ajouter la participation
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const player = players.find(p => p.id === playerId);
      
      session.rows.push({
        rowId: result.id,
        playerName: player?.name || 'Inconnu',
        status: 'active',
        arrivedAt: arrivedAt,
        eliminatedAt: null,
        lxp: 0,
        position: null,
        placementPoints: 0,
        totalPoints: 0,
        playerId: playerId // Garder l'ID pour synchro
      });
      
      console.log(`✅ Joueur ${player?.name} ajouté à la séance`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

// Clôturer une séance
async function closeSessionAPI(sessionId) {
  try {
    const result = await PokerAPI.updateSessionStatus(sessionId, 'closed');
    
    if (result.error) {
      console.error('❌ Erreur clôture séance:', result.error);
      return null;
    }
    
    // Mettre à jour en mémoire
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'closed';
    }
    
    console.log(`✅ Séance ${sessionId} clôturée`);
    return result;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

// Mettre à jour une participation (fin du jeu)
async function updateParticipationAPI(rowId, eliminatedAt, position, placementPoints) {
  try {
    const result = await PokerAPI.updateParticipation(rowId, eliminatedAt, position, placementPoints);
    
    if (result.error) {
      console.error('❌ Erreur update participation:', result.error);
      return null;
    }
    
    console.log(`✅ Participation ${rowId} mise à jour`);
    return result;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

// Créer un tournoi
async function createTournamentAPI(name, winnerId, date) {
  try {
    const result = await PokerAPI.createTournament(name, winnerId, date);
    
    if (result.error) {
      console.error('❌ Erreur création tournoi:', result.error);
      return null;
    }
    
    const winner = players.find(p => p.id === winnerId);
    const newTournament = {
      id: result.id,
      name: name,
      winner: winner?.name || 'Inconnu',
      date: date,
      createdAt: Date.now()
    };
    
    tournaments.push(newTournament);
    console.log(`✅ Tournoi créé: ${name}`);
    
    return newTournament;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

// Récupérer le classement général
async function getRankingAPI() {
  try {
    return await PokerAPI.getRanking();
  } catch (error) {
    console.error('❌ Erreur ranking:', error);
    return [];
  }
}

console.log('✅ Fichier sync.js chargé');
