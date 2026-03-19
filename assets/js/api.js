/* =========================
   API Client pour Poker
   
   Toutes les requêtes vers le backend PHP
========================= */

const API_BASE = 'http://localhost/form%20poker/api';

class PokerAPI {
  /* =========================
     PLAYERS
  ========================= */
  static async getAllPlayers() {
    try {
      const response = await fetch(`${API_BASE}/players.php?action=all`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllPlayers:', error);
      return [];
    }
  }

  static async createPlayer(name, studentNum = null) {
    try {
      const response = await fetch(`${API_BASE}/players.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, studentNum })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur createPlayer:', error);
      return { error: error.message };
    }
  }

  /* =========================
     SESSIONS
  ========================= */
  static async getAllSessions(filter = 'all') {
    try {
      const action = filter === 'archived' ? 'archived' : 'all';
      const response = await fetch(`${API_BASE}/sessions.php?action=${action}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllSessions:', error);
      return [];
    }
  }

  static async getSessionDetail(sessionId) {
    try {
      const response = await fetch(`${API_BASE}/sessions.php?action=detail&id=${sessionId}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getSessionDetail:', error);
      return null;
    }
  }

  static async createSession(date, status = 'created') {
    try {
      const response = await fetch(`${API_BASE}/sessions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, status })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur createSession:', error);
      return { error: error.message };
    }
  }

  static async updateSessionStatus(sessionId, status) {
    try {
      const response = await fetch(`${API_BASE}/sessions.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, status })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur updateSessionStatus:', error);
      return { error: error.message };
    }
  }

  static async archiveSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE}/sessions.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur archiveSession:', error);
      return { error: error.message };
    }
  }

  static async restoreSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE}/sessions.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, isArchived: 0 })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur restoreSession:', error);
      return { error: error.message };
    }
  }

  /* =========================
     SESSION PARTICIPATIONS
  ========================= */
  static async getSessionParticipations(sessionId) {
    try {
      const response = await fetch(`${API_BASE}/session_participations.php?session_id=${sessionId}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getSessionParticipations:', error);
      return [];
    }
  }

  static async getAllParticipations() {
    try {
      const response = await fetch(`${API_BASE}/session_participations.php?action=all`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllParticipations:', error);
      return [];
    }
  }

  static async addPlayerToSession(sessionId, playerId, arrivedAt = null) {
    try {
      const response = await fetch(`${API_BASE}/session_participations.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, player_id: playerId, arrivedAt })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur addPlayerToSession:', error);
      return { error: error.message };
    }
  }

  static async updateParticipation(participationId, eliminatedAt = null, position = null, placementPoints = null) {
    try {
      const response = await fetch(`${API_BASE}/session_participations.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: participationId, 
          eliminateAt: eliminatedAt,
          position, 
          placementPoints 
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur updateParticipation:', error);
      return { error: error.message };
    }
  }

  /* =========================
     TOURNAMENTS
  ========================= */
  static async getAllTournaments(filter = 'all') {
    try {
      const action = filter === 'archived' ? 'archived' : 'all';
      const response = await fetch(`${API_BASE}/tournaments.php?action=${action}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllTournaments:', error);
      return [];
    }
  }

  static async createTournament(name, winnerId, date = null) {
    try {
      const response = await fetch(`${API_BASE}/tournaments.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, winner_id: winnerId, date })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur createTournament:', error);
      return { error: error.message };
    }
  }

  static async archiveTournament(tournamentId) {
    try {
      const response = await fetch(`${API_BASE}/tournaments.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tournamentId })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur archiveTournament:', error);
      return { error: error.message };
    }
  }

  static async restoreTournament(tournamentId) {
    try {
      const response = await fetch(`${API_BASE}/tournaments.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tournamentId, isArchived: 0 })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur restoreTournament:', error);
      return { error: error.message };
    }
  }

  /* =========================
     RANKING
  ========================= */
  static async getRanking() {
    try {
      const response = await fetch(`${API_BASE}/ranking.php?action=general`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getRanking:', error);
      return [];
    }
  }

  static async getPlayerStats(playerId) {
    try {
      const response = await fetch(`${API_BASE}/ranking.php?action=player&id=${playerId}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getPlayerStats:', error);
      return null;
    }
  }

  /* =========================
     USERS (Auth)
  ========================= */
  static async register(email, password, role = 'player') {
    try {
      const response = await fetch(`${API_BASE}/users.php?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur register:', error);
      return { error: error.message };
    }
  }

  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/users.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur login:', error);
      return { error: error.message };
    }
  }

  static async getUser(userId) {
    try {
      const response = await fetch(`${API_BASE}/users.php?id=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur getUser:', error);
      return null;
    }
  }
}

// Export pour utilisation
window.PokerAPI = PokerAPI;
