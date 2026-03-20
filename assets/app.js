

const API_BASE = 'http://localhost/form%20poker/api/index.php';

function buildApiUrl(endpoint, params = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set('endpoint', endpoint);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

class PokerAPI {
  static async getAllPlayers() {
    try {
      const response = await fetch(buildApiUrl('players', { action: 'all' }));
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllPlayers:', error);
      return [];
    }
  }

  static async createPlayer(name, studentNum = null) {
    try {
      const response = await fetch(buildApiUrl('players'), {
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

  static async getAllSessions(filter = 'all') {
    try {
      const action = filter === 'archived' ? 'archived' : 'all';
      const response = await fetch(buildApiUrl('sessions', { action }));
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllSessions:', error);
      return [];
    }
  }

  static async createSession(date, status = 'created') {
    try {
      const response = await fetch(buildApiUrl('sessions'), {
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
      const response = await fetch(buildApiUrl('sessions'), {
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
      const response = await fetch(buildApiUrl('sessions'), {
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
      const response = await fetch(buildApiUrl('sessions'), {
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

  static async getAllParticipations() {
    try {
      const response = await fetch(buildApiUrl('session_participations', { action: 'all' }));
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllParticipations:', error);
      return [];
    }
  }

  static async addPlayerToSession(sessionId, playerId, arrivedAt = null) {
    try {
      const response = await fetch(buildApiUrl('session_participations'), {
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
      const response = await fetch(buildApiUrl('session_participations'), {
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

  static async getAllTournaments(filter = 'all') {
    try {
      const action = filter === 'archived' ? 'archived' : 'all';
      const response = await fetch(buildApiUrl('tournaments', { action }));
      return await response.json();
    } catch (error) {
      console.error('Erreur getAllTournaments:', error);
      return [];
    }
  }

  static async createTournament(name, winnerId, date = null) {
    try {
      const response = await fetch(buildApiUrl('tournaments'), {
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
      const response = await fetch(buildApiUrl('tournaments'), {
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
      const response = await fetch(buildApiUrl('tournaments'), {
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

  static async getRanking() {
    try {
      const response = await fetch(buildApiUrl('ranking', { action: 'general' }));
      return await response.json();
    } catch (error) {
      console.error('Erreur getRanking:', error);
      return [];
    }
  }
}

window.PokerAPI = PokerAPI;

let players = [];
let sessions = [];
let tournaments = [];
let archivedSessions = [];
let archivedTournaments = [];
let liveSession = null;

function toTimestampMs(value) {
  if (typeof value === 'number' && value > 0) return value;
  if (typeof value === 'string' && value) {
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toSessionRow(part) {
  const arrivedAt = toTimestampMs(part.arrivedAt);
  const eliminatedAt = toTimestampMs(part.eliminateAt);
  const position = part.position != null ? Number(part.position) : null;
  const placementPoints = part.placementPoints != null ? Number(part.placementPoints) : 0;
  let lxp = 0;
  if (arrivedAt != null && eliminatedAt != null) {
    const diffMs = eliminatedAt - arrivedAt;
    lxp = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  }

  return {
    participationId: part.id,
    playerName: part.name,
    playerId: part.player_id,
    studentNum: part.studentNum,
    arrivedAt,
    eliminatedAt,
    position,
    placementPoints,
    lxp,
    winner: position === 1
  };
}

function fillSessionsWithParticipations(targetSessions, rawParticipations) {
  for (const part of rawParticipations) {
    const session = targetSessions.find(s => s.id === part.session_id);
    if (session) {
      session.rows.push(toSessionRow(part));
    }
  }
}

function mapWinnerName(list) {
  return list.map(t => {
    const winnerId = t.winner_id != null ? parseInt(t.winner_id, 10) : null;
    if (!winnerId) return { ...t, winner: null };
    const winner = players.find(p => Number(p.id) === winnerId);
    return { ...t, winner: winner ? winner.name : null };
  });
}

async function initializeFromAPI() {
  console.log('Initialisation des donnees depuis l API...');

  try {
    players = await PokerAPI.getAllPlayers();

    const rawSessions = await PokerAPI.getAllSessions();
    sessions = rawSessions.map(s => ({ ...s, rows: [] }));

    const rawParticipations = await PokerAPI.getAllParticipations();
    fillSessionsWithParticipations(sessions, rawParticipations);

    const rawTournaments = await PokerAPI.getAllTournaments();
    tournaments = mapWinnerName(rawTournaments);

    const rawArchivedTournaments = await PokerAPI.getAllTournaments('archived');
    archivedTournaments = mapWinnerName(rawArchivedTournaments ?? []);

    const rawArchivedSessions = await PokerAPI.getAllSessions('archived');
    archivedSessions = (rawArchivedSessions ?? []).map(s => ({ ...s, rows: [] }));
    fillSessionsWithParticipations(archivedSessions, rawParticipations);
  } catch (error) {
    console.error('Erreur lors du chargement des donnees:', error);
  }
}

async function createPlayerAPI(name, studentNum = null) {
  try {
    const result = await PokerAPI.createPlayer(name, studentNum);
    if (result.error) return null;

    const newPlayer = { id: result.id, name, studentNum };
    players.push(newPlayer);
    return newPlayer;
  } catch (error) {
    console.error('Erreur createPlayerAPI:', error);
    return null;
  }
}

async function createSessionAPI(date) {
  try {
    const result = await PokerAPI.createSession(date, 'created');
    if (result.error) return null;

    const newSession = {
      id: result.id,
      date,
      status: 'created',
      createdAt: Date.now(),
      rows: []
    };

    sessions.push(newSession);
    return newSession;
  } catch (error) {
    console.error('Erreur createSessionAPI:', error);
    return null;
  }
}

async function addPlayerToSessionAPI(sessionId, playerId, arrivedAt = null) {
  try {
    const timestamp = arrivedAt || Date.now();
    const result = await PokerAPI.addPlayerToSession(sessionId, playerId, timestamp);
    if (result.error) return null;

    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const player = players.find(p => Number(p.id) === Number(playerId));
      session.rows.push({
        rowId: result.id,
        playerName: player?.name || 'Inconnu',
        status: 'active',
        arrivedAt: timestamp,
        eliminatedAt: null,
        lxp: 0,
        position: null,
        placementPoints: 0,
        totalPoints: 0,
        playerId
      });
    }

    return result;
  } catch (error) {
    console.error('Erreur addPlayerToSessionAPI:', error);
    return null;
  }
}

async function closeSessionAPI(sessionId) {
  try {
    const result = await PokerAPI.updateSessionStatus(sessionId, 'closed');
    if (result.error) return null;

    const session = sessions.find(s => s.id === sessionId);
    if (session) session.status = 'closed';
    return result;
  } catch (error) {
    console.error('Erreur closeSessionAPI:', error);
    return null;
  }
}

async function updateParticipationAPI(rowId, eliminatedAt, position, placementPoints) {
  try {
    const result = await PokerAPI.updateParticipation(rowId, eliminatedAt, position, placementPoints);
    return result.error ? null : result;
  } catch (error) {
    console.error('Erreur updateParticipationAPI:', error);
    return null;
  }
}

async function createTournamentAPI(name, winnerId, date) {
  try {
    const result = await PokerAPI.createTournament(name, winnerId, date);
    if (result.error) return null;

    const winner = players.find(p => Number(p.id) === Number(winnerId));
    const newTournament = {
      id: result.id,
      name,
      winner: winner?.name || 'Inconnu',
      date,
      createdAt: Date.now()
    };

    tournaments.push(newTournament);
    return newTournament;
  } catch (error) {
    console.error('Erreur createTournamentAPI:', error);
    return null;
  }
}

async function getRankingAPI() {
  try {
    return await PokerAPI.getRanking();
  } catch (error) {
    console.error('Erreur getRankingAPI:', error);
    return [];
  }
}



function pad2(n) { return String(n).padStart(2, "0"); }

function formatDateISOToFR(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad2(d)}/${pad2(m)}/${y}`;
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function formatDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${formatTime(ts)}`;
}

function clampMin1(n) {
  return Math.max(1, n);
}


function computeLXP(arrivedAt, eliminatedAt) {
  if (!arrivedAt || !eliminatedAt) return 0;
  const diffMs = eliminatedAt - arrivedAt;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  return clampMin1(hours);
}

function placementPointsForPosition(pos) {
  if (pos === 1) return 100;
  if (pos === 2) return 75;
  if (pos === 3) return 50;
  if (pos === 4) return 40;
  if (pos === 5) return 30;
  if (pos === 6) return 20;
  if (pos === 7) return 10;
  return 0;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}


function showConfirmation(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmationModal");
    const msgEl = document.getElementById("confirmationMessage");
    const confirmBtn = document.getElementById("confirmationConfirmBtn");
    
    msgEl.textContent = message;
    const handleConfirm = () => {
      confirmBtn.removeEventListener("click", handleConfirm);
      modal.close();
      resolve(true);
    };
    
    confirmBtn.addEventListener("click", handleConfirm);
    modal.addEventListener("close", () => {
      confirmBtn.removeEventListener("click", handleConfirm);
      if (modal.returnValue !== "confirm") {
        resolve(false);
      }
    }, { once: true });
    
    modal.showModal();
  });
}



let rankingExpanded = false;





const rankingBody = document.getElementById("rankingBody");
const btnSeeMore = document.getElementById("btnSeeMore");
const rankingInfo = document.getElementById("rankingInfo");

const sessionsGrid = document.getElementById("sessionsGrid");
const btnOpenSession = document.getElementById("btnOpenSession");

const dateModal = document.getElementById("dateModal");
const sessionDateInput = document.getElementById("sessionDateInput");
const confirmOpenSession = document.getElementById("confirmOpenSession");

const addPlayerModal = document.getElementById("addPlayerModal");
const btnAddPlayer = document.getElementById("btnAddPlayer");
const playerFirstName = document.getElementById("playerFirstName");
const playerLastName = document.getElementById("playerLastName");
const playerStudentNum = document.getElementById("playerStudentNum");
const confirmAddPlayer = document.getElementById("confirmAddPlayer");

const liveSessionSection = document.getElementById("liveSessionSection");
const liveSessionDateLabel = document.getElementById("liveSessionDateLabel");
const liveSessionStatus = document.getElementById("liveSessionStatus");
const liveSessionBody = document.getElementById("liveSessionBody");
const btnAddRow = document.getElementById("btnAddRow");
const btnCloseSession = document.getElementById("btnCloseSession");

const liveSessionConfirmation = document.getElementById("liveSessionConfirmation");


const tournamentConfirmation = document.getElementById("tournamentConfirmation");

const playerConfirmation = document.getElementById("playerConfirmation");

const detailModal = document.getElementById("detailModal");
const detailDate = document.getElementById("detailDate");
const detailCount = document.getElementById("detailCount");
const detailBody = document.getElementById("detailBody");

const btnWinnerTournament = document.getElementById("btnWinnerTournament");
const tournamentModal = document.getElementById("tournamentModal");
const tournamentWinner = document.getElementById("tournamentWinner");
const tournamentDate = document.getElementById("tournamentDate");
const confirmAddTournament = document.getElementById("confirmAddTournament");
const tournamentsGrid = document.getElementById("tournamentsGrid");

const btnViewArchives = document.getElementById("btnViewArchives");
const archivesModal = document.getElementById("archivesModal");
const archivesContent = document.getElementById("archivesContent");



function computePlacementPointsByPlayer() {
  const map = new Map(); 
  for (const s of sessions) {
    for (const r of s.rows) {
      const cur = map.get(r.playerName) ?? 0;
      const pts = r.placementPoints ? parseInt(r.placementPoints, 10) : 0;
      map.set(r.playerName, cur + pts);
    }
  }
  for (const t of tournaments) {
    if (t.winner) {
      const cur = map.get(t.winner) ?? 0;
      map.set(t.winner, cur + 250);
    }
  }
  for (const p of players) {
    if (!map.has(p.name)) map.set(p.name, 0);
  }
  return map;
}

function computeLXPPointsByPlayer() {
  const map = new Map(); 
  for (const s of sessions) {
    for (const r of s.rows) {
      const cur = map.get(r.playerName) ?? 0;
      const lxp = r.lxp ? parseInt(r.lxp, 10) : 0;
      map.set(r.playerName, cur + lxp);
    }
  }
  for (const p of players) {
    if (!map.has(p.name)) map.set(p.name, 0);
  }
  return map;
}

function renderRanking() {
  const placementTotals = computePlacementPointsByPlayer();
  const lxpTotals = computeLXPPointsByPlayer();
  
  const list = Array.from(placementTotals.entries()).map(([playerName, placementPoints]) => ({
    playerName,
    placementPoints,
    lxpPoints: lxpTotals.get(playerName) ?? 0,
  }));

  list.sort((a, b) => b.placementPoints - a.placementPoints || a.playerName.localeCompare(b.playerName, "fr"));

  const shown = list;

  rankingBody.innerHTML = "";
  shown.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="rankPos">${idx + 1}</td>
      <td class="points">${row.placementPoints}</td>
      <td class="points">${row.lxpPoints}</td>
      <td class="playerName">${escapeHTML(row.playerName)}</td>
    `;
    rankingBody.appendChild(tr);
  });
  btnSeeMore.classList.add("hidden");
  rankingInfo.textContent = "";
}



function renderSessionsGrid() {
  sessionsGrid.innerHTML = "";

  const sorted = [...sessions].sort((a, b) => {
    const da = a.date ?? "";
    const db = b.date ?? "";
    if (da !== db) return db.localeCompare(da);
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });

  if (sorted.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.style.padding = "0 18px 18px";
    empty.textContent = "Aucune séance enregistrée.";
    sessionsGrid.appendChild(empty);
    return;
  }

  for (const s of sorted) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const div = document.createElement("button");
    div.type = "button";
    div.className = "sessionCard";
    const count = s.nbParticipants ?? s.rows?.length ?? 0;

    div.innerHTML = `
      <div class="sessionCard__date">${formatDateISOToFR(s.date)}</div>
      <div class="sessionCard__sub">${count} participant(s)</div>
    `;
    div.addEventListener("click", () => openSessionDetail(s.id));

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "sessionCard__delete";
    btnDelete.textContent = "✕";
    btnDelete.title = "Supprimer cette séance";
    btnDelete.addEventListener("click", async (e) => {
      e.stopPropagation();
      const confirmed = await showConfirmation("Êtes-vous sûr de vouloir supprimer cette séance ?");
      if (confirmed) {
        deleteSession(s.id);
      }
    });

    wrapper.appendChild(div);
    wrapper.appendChild(btnDelete);
    sessionsGrid.appendChild(wrapper);
  }
}

function openSessionDetail(sessionId) {
  let s = sessions.find(x => x.id === sessionId);
  if (!s) s = archivedSessions.find(x => x.id === sessionId);
  if (!s) return;

  detailDate.textContent = `${formatDateISOToFR(s.date)}`;
  detailCount.textContent = `${s.rows.length}`;
  const rows = [...s.rows].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

  detailBody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    let lxpDisplay = r.lxp ?? 0;
    if (r.position === 1 && r.arrivedAt != null && !r.eliminatedAt) {
      const diffMs = Date.now() - r.arrivedAt;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      lxpDisplay = Math.max(1, hours);
    }
    
    tr.innerHTML = `
      <td><strong>${escapeHTML(r.playerName)}</strong> ${r.winner ? `<span class="rowTag tag--winner">Gagnant</span>` : ""}</td>
      <td>${formatTime(r.arrivedAt)}</td>
      <td>${r.eliminatedAt ? formatTime(r.eliminatedAt) : "—"}</td>
      <td class="points">${lxpDisplay}</td>
      <td class="points">${r.position ?? "—"}</td>
      <td class="points">${r.placementPoints ?? 0}</td>
    `;
    detailBody.appendChild(tr);
  }

  detailModal.showModal();
}



function renderTournamentsGrid() {
  tournamentsGrid.innerHTML = "";

  const sorted = [...tournaments].sort((a, b) => {
    const da = a.date ?? "";
    const db = b.date ?? "";
    if (da !== db) return db.localeCompare(da);
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });

  if (sorted.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.style.padding = "0 18px 18px";
    empty.textContent = "Aucun tournoi enregistré.";
    tournamentsGrid.appendChild(empty);
    return;
  }

  for (const t of sorted) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const div = document.createElement("button");
    div.type = "button";
    div.className = "sessionCard";

    const dateStr = formatDateISOToFR(t.date);

    div.innerHTML = `
      <div class="sessionCard__date">${dateStr}</div>
      <div class="sessionCard__sub">${escapeHTML(t.winner)}</div>
    `;

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "sessionCard__delete";
    btnDelete.textContent = "✕";
    btnDelete.title = "Supprimer ce tournoi";
    btnDelete.addEventListener("click", async (e) => {
      e.stopPropagation();
      const confirmed = await showConfirmation("Êtes-vous sûr de vouloir supprimer ce tournoi ?");
      if (confirmed) {
        deleteTournament(t.id);
      }
    });

    wrapper.appendChild(div);
    wrapper.appendChild(btnDelete);
    tournamentsGrid.appendChild(wrapper);
  }
}

function addTournamentWinner(winner, date) {
  if (!winner) {
    alert("Un gagnant est obligatoire.");
    return;
  }

  if (!date) {
    alert("Une date est obligatoire.");
    return;
  }
  const winnerPlayer = players.find(p => p.name === winner);
  if (!winnerPlayer) {
    alert("Le gagnant n'existe pas.");
    return;
  }
  createTournamentAPI(`Tournoi ${formatDateISOToFR(date)}`, winnerPlayer.id, date).then(result => {
    if (result) {
      console.log('✅ Tournoi créé:', result.id);
      tournamentConfirmation.showModal();
      setTimeout(() => {
        tournamentConfirmation.close();
      }, 2500);
      initializeFromAPI().then(() => {
        renderTournamentsGrid();
        renderRanking();
      });
    }
  });
}

function deleteSession(sessionId) {
  PokerAPI.archiveSession(sessionId).then(result => {
    if (result.success) {
      console.log('✅ Séance archivée');
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        archivedSessions.push(session);
      }
      sessions = sessions.filter(s => s.id !== sessionId);
      
      if (liveSession && liveSession.id === sessionId) {
        liveSession = null;
        liveSessionSection.classList.add("hidden");
      }
      renderSessionsGrid();
      renderRanking();  
    }
  });
}

function deleteTournament(tournamentId) {
  PokerAPI.archiveTournament(tournamentId).then(result => {
    if (result.success) {
      console.log('✅ Tournoi archivé');
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        archivedTournaments.push(tournament);
      }
      tournaments = tournaments.filter(t => t.id !== tournamentId);
      renderTournamentsGrid();
      renderRanking();
    }
  });
}

function restoreSession(sessionId) {
  PokerAPI.restoreSession(sessionId).then(result => {
    if (result.success) {
      console.log('✅ Séance restaurée');
      const session = archivedSessions.find(s => s.id === sessionId);
      if (session) {
        sessions.push(session);
        archivedSessions = archivedSessions.filter(s => s.id !== sessionId);
      }
      renderSessionsGrid();
      renderArchives();
      renderRanking();
    }
  }).catch(error => {
    console.error('❌ Erreur restauration:', error);
  });
}

function restoreTournament(tournamentId) {
  PokerAPI.restoreTournament(tournamentId).then(result => {
    if (result.success) {
      console.log('✅ Tournoi restauré');
      const tournament = archivedTournaments.find(t => t.id === tournamentId);
      if (tournament) {
        tournaments.push(tournament);
        archivedTournaments = archivedTournaments.filter(t => t.id !== tournamentId);
      }
      renderTournamentsGrid();
      renderArchives();
      renderRanking();
    }
  }).catch(error => {
    console.error('❌ Erreur restauration:', error);
  });
}

function renderArchives() {
  archivesContent.innerHTML = "";

  if (archivedSessions.length === 0 && archivedTournaments.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.style.padding = "18px";
    empty.textContent = "Aucun élément supprimé.";
    archivesContent.appendChild(empty);
    return;
  }
  const mainContainer = document.createElement("div");
  mainContainer.style.display = "flex";
  mainContainer.style.gap = "24px";
  mainContainer.style.flexWrap = "wrap";
  if (archivedSessions.length > 0) {
    const sessionsSection = document.createElement("div");
    sessionsSection.style.flex = "1";
    sessionsSection.style.minWidth = "250px";

    const sessionsTitle = document.createElement("h3");
    sessionsTitle.textContent = "Séances supprimées";
    sessionsTitle.style.marginTop = "0";
    sessionsTitle.style.marginBottom = "12px";
    sessionsSection.appendChild(sessionsTitle);

    const sessionsList = document.createElement("div");
    sessionsList.style.marginBottom = "0";

    for (const s of archivedSessions) {
      const div = document.createElement("div");
      div.style.padding = "12px 18px";
      div.style.borderBottom = "1px solid var(--line)";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.gap = "12px";

      const info = document.createElement("div");
      info.innerHTML = `<strong>${formatDateISOToFR(s.date)}</strong> <span class="muted" style="font-size:12px;">${s.rows?.length ?? 0} participant(s)</span>`;
      info.style.display = "flex";
      info.style.alignItems = "center";
      info.style.gap = "12px";

      const buttonsContainer = document.createElement("div");
      buttonsContainer.style.display = "flex";
      buttonsContainer.style.gap = "8px";

      const btnDetail = document.createElement("button");
      btnDetail.type = "button";
      btnDetail.className = "btn btn--secondary";
      btnDetail.textContent = "Voir détail";
      btnDetail.style.whiteSpace = "nowrap";
      btnDetail.addEventListener("click", () => {
        openSessionDetail(s.id);
      });

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--secondary";
      btn.textContent = "Restaurer";
      btn.style.whiteSpace = "nowrap";
      btn.addEventListener("click", async () => {
        const confirmed = await showConfirmation("Restaurer cette séance ?");
        if (confirmed) {
          restoreSession(s.id);
        }
      });

      div.appendChild(info);
      buttonsContainer.appendChild(btnDetail);
      buttonsContainer.appendChild(btn);
      div.appendChild(buttonsContainer);
      sessionsList.appendChild(div);
    }

    sessionsSection.appendChild(sessionsList);
    mainContainer.appendChild(sessionsSection);
  }
  if (archivedTournaments.length > 0) {
    const tournamentsSection = document.createElement("div");
    tournamentsSection.style.flex = "1";
    tournamentsSection.style.minWidth = "250px";

    const tournamentsTitle = document.createElement("h3");
    tournamentsTitle.textContent = "Tournois supprimés";
    tournamentsTitle.style.marginTop = "0";
    tournamentsTitle.style.marginBottom = "12px";
    tournamentsSection.appendChild(tournamentsTitle);

    const tournamentsList = document.createElement("div");

    for (const t of archivedTournaments) {
      const div = document.createElement("div");
      div.style.padding = "12px 18px";
      div.style.borderBottom = "1px solid var(--line)";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.gap = "12px";

      const info = document.createElement("div");
      info.innerHTML = `<strong>${formatDateISOToFR(t.date)}</strong> <span class="muted" style="font-size:12px;">Gagnant: ${escapeHTML(t.winner)}</span>`;
      info.style.display = "flex";
      info.style.alignItems = "center";
      info.style.gap = "12px";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--secondary";
      btn.textContent = "Restaurer";
      btn.style.whiteSpace = "nowrap";
      btn.addEventListener("click", async () => {
        const confirmed = await showConfirmation("Restaurer ce tournoi ?");
        if (confirmed) {
          restoreTournament(t.id);
        }
      });

      div.appendChild(info);
      div.appendChild(btn);
      tournamentsList.appendChild(div);
    }

    tournamentsSection.appendChild(tournamentsList);
    mainContainer.appendChild(tournamentsSection);
  }

  archivesContent.appendChild(mainContainer);
}



function startLiveSession(dateISO) {
  liveSession = {
    id: uid("sess"),
    date: dateISO,
    createdAt: Date.now(),
    rows: [],
  };

  liveSessionDateLabel.textContent = formatDateISOToFR(dateISO);
  liveSessionSection.classList.remove("hidden");
  createSessionAPI(dateISO).then(result => {
    if (result) {
      liveSession.id = result.id; 
      console.log('✅ Séance créée en BD avec ID:', result.id);
    }
  });

  renderLiveSession();
}

function addDraftRow() {
  if (!liveSession) return;

  liveSession.rows.push({
    rowId: uid("row"),
    playerName: "",
    status: "draft",
    arrivedAt: null,
    eliminatedAt: null,
    lxp: 0,
    position: null,
    placementPoints: 0,
    totalPoints: 0,
  });

  renderLiveSession();
}

function validateRow(rowId, playerName) {
  if (!liveSession) return;

  const name = (playerName ?? "").trim();
  if (!name) return alert("Choisis un membre.");
  const already = liveSession.rows.some(r => r.rowId !== rowId && r.playerName === name && r.status !== "draft");
  if (already) return alert("Ce membre est déjà présent dans la séance.");
  const player = players.find(p => p.name === name);
  if (!player) return alert("Ce membre n'existe pas.");

  const row = liveSession.rows.find(r => r.rowId === rowId);
  if (!row) return;

  row.playerName = name;
  row.status = "active";
  row.arrivedAt = Date.now();
  row.playerId = player.id; 
  addPlayerToSessionAPI(liveSession.id, player.id, row.arrivedAt).then(result => {
    if (result && result.id) {
      row.participationId = result.id; 
      console.log('✅ Joueur ajouté à la séance, participationId:', result.id);
    }
  });

  recalcLiveSession();
  renderLiveSession();
}

function eliminateRow(rowId) {
  if (!liveSession) return;
  const row = liveSession.rows.find(r => r.rowId === rowId);
  if (!row || row.status !== "active") return;

  row.status = "eliminated";
  row.eliminatedAt = Date.now();
  row.lxp = computeLXP(row.arrivedAt, row.eliminatedAt);

  recalcLiveSession();
  renderLiveSession();
}

function markWinner(rowId) {
  if (!liveSession) return;
  for (const r of liveSession.rows) {
    if (r.status === "winner") {
      return alert("Le gagnant est déjà défini.");
    }
  }

  const row = liveSession.rows.find(r => r.rowId === rowId);
  if (!row || row.status !== "active") return;

  row.status = "winner";
  row.eliminatedAt = Date.now();

  recalcLiveSession(true);
  renderLiveSession();
}

function deleteRow(rowId) {
  if (!liveSession) return;
  const index = liveSession.rows.findIndex(r => r.rowId === rowId);
  if (index === -1) return;

  liveSession.rows.splice(index, 1);
  recalcLiveSession();
  renderLiveSession();
}

function canCloseSession() {
  if (!liveSession) return false;
  const active = liveSession.rows.filter(r => r.status === "active");
  const draft = liveSession.rows.filter(r => r.status === "draft");
  const winner = liveSession.rows.find(r => r.status === "winner");
  const eliminated = liveSession.rows.filter(r => r.status === "eliminated");

  if (draft.length > 0) return false; 
  if (!winner) return false;
  if (active.length > 0) return false;
  if (eliminated.length + (winner ? 1 : 0) !== liveSession.rows.length) return false;
  return true;
}

function closeSession() {
  if (!liveSession) return;

  if (!canCloseSession()) {
    return alert("La séance n'est pas terminée : il faut un gagnant et tous les autres éliminés.");
  }
  const updatePromises = [];
  for (const r of liveSession.rows) {
    if (r.participationId && typeof r.position === "number") {
      updatePromises.push(
        updateParticipationAPI(r.participationId, r.eliminatedAt, r.position, r.placementPoints)
      );
    }
  }
  Promise.all(updatePromises).then(() => {
    return closeSessionAPI(liveSession.id);
  }).then(result => {
    if (result.success) {
      console.log('✅ Séance clôturée avec succès');
      const closedSessionId = liveSession.id;
      liveSession = null;
      liveSessionSection.classList.add("hidden");
      liveSessionBody.innerHTML = "";
      liveSessionConfirmation.showModal();
      setTimeout(() => {
        liveSessionConfirmation.close();
      }, 2500);
      initializeFromAPI().then(() => {
        renderSessionsGrid();
        renderRanking();
      });
    }
  }).catch(error => {
    console.error('❌ Erreur lors de la clôture:', error);
    alert('Erreur lors de la clôture de la séance.');
  });
}

function recalcLiveSession(forceFinalize = false) {
  if (!liveSession) return;
  const rows = liveSession.rows.filter(r => r.status !== "draft");
  const winner = rows.find(r => r.status === "winner");
  const active = rows.filter(r => r.status === "active");
  const eliminated = rows.filter(r => r.status === "eliminated");
  for (const r of rows) {
    r.position = null;
    r.placementPoints = 0;
    r.totalPoints = (r.lxp ?? 0); 
  }
  if (!winner && !forceFinalize) {
    updateLiveSessionStatus();
    return;
  }

  if (!winner) {
    updateLiveSessionStatus();
    return;
  }
  winner.position = 1;
  if (winner.arrivedAt) {
    winner.lxp = computeLXP(winner.arrivedAt, Date.now());
  }
  const elimSorted = eliminated
    .filter(r => !!r.eliminatedAt)
    .sort((a, b) => (b.eliminatedAt ?? 0) - (a.eliminatedAt ?? 0));

  let pos = 2;
  for (const r of elimSorted) {
    r.position = pos++;
  }
  for (const r of active) {
    r.position = null;
    r.placementPoints = 0;
    r.totalPoints = (r.lxp ?? 0);
  }
  for (const r of rows) {
    if (typeof r.position === "number") {
      r.placementPoints = placementPointsForPosition(r.position);
      const lxp = r.lxp ?? 0;
      r.totalPoints = lxp + r.placementPoints;
    }
  }

  updateLiveSessionStatus();
}

function updateLiveSessionStatus() {
  if (!liveSession) return;

  const rows = liveSession.rows.filter(r => r.status !== "draft");
  const draftCount = liveSession.rows.filter(r => r.status === "draft").length;
  const active = rows.filter(r => r.status === "active");
  const eliminated = rows.filter(r => r.status === "eliminated");
  const winner = rows.find(r => r.status === "winner");

  let text = "En préparation";
  if (rows.length > 0) text = "En cours";
  if (winner && active.length === 0 && draftCount === 0) text = "Prêt à clôturer";

  liveSessionStatus.textContent = text;
  if (canCloseSession()) btnCloseSession.classList.remove("hidden");
  else btnCloseSession.classList.add("hidden");
}



function renderLiveSession() {
  if (!liveSession) return;

  const rows = liveSession.rows;

  liveSessionBody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    let tagHTML = "";
    if (r.status === "active") tagHTML = `<span class="rowTag tag--active">Ajouté</span>`;
    if (r.status === "eliminated") tagHTML = `<span class="rowTag tag--eliminated">Éliminé</span>`;
    if (r.status === "winner") tagHTML = `<span class="rowTag tag--winner">Gagnant</span>`;
    let playerCellHTML = "";
    if (r.status === "draft") {
      const playerOptions = players.map(p => `<option value="${escapeHTMLAttr(p.name)}">${escapeHTML(p.name)}</option>`).join("");
      playerCellHTML = `
        <div class="field">
          <select data-role="playerSelect" data-row="${r.rowId}">
            <option value="">-- Sélectionner un membre --</option>
            ${playerOptions}
          </select>
        </div>
      `;
    } else {
      playerCellHTML = `<div><strong>${escapeHTML(r.playerName)}</strong> ${tagHTML}</div>`;
    }
    let actionHTML = "";
    if (r.status === "draft") {
      actionHTML = `<button class="btn btn--secondary" type="button" data-action="validate" data-row="${r.rowId}">Ajouter</button>`;
      actionHTML += ` <button class="btn btn--ghost" type="button" data-action="delete" data-row="${r.rowId}" style="padding: 10px 8px; color: #ef4444;">✕</button>`;
    } else if (r.status === "active") {
      const activeCount = liveSession.rows.filter(x => x.status === "active").length;
      const hasWinner = liveSession.rows.some(x => x.status === "winner");

      if (activeCount === 1 && !hasWinner) {
        actionHTML = `<button class="btn btn--winner" type="button" data-action="winner" data-row="${r.rowId}">Gagnant</button>`;
      } else {
        actionHTML = `<button class="btn btn--eliminate" type="button" data-action="eliminate" data-row="${r.rowId}">Éliminer</button>`;
      }
    } else {
      actionHTML = `<span class="muted">—</span>`;
    }

    tr.innerHTML = `
      <td>${actionHTML}</td>
      <td>${playerCellHTML}</td>
      <td>${r.arrivedAt ? formatTime(r.arrivedAt) : "—"}</td>
      <td>${r.eliminatedAt ? formatTime(r.eliminatedAt) : "—"}</td>
      <td class="points">${r.lxp ?? 0}</td>
      <td class="points">${r.position ?? "—"}</td>
      <td class="points">${r.placementPoints ?? 0}</td>
    `;

    liveSessionBody.appendChild(tr);
  }
  liveSessionBody.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const rowId = btn.getAttribute("data-row");
      const action = btn.getAttribute("data-action");
      if (action === "validate") {
        const select = liveSessionBody.querySelector(`[data-role="playerSelect"][data-row="${rowId}"]`);
        validateRow(rowId, select?.value ?? "");
      }
      if (action === "eliminate") eliminateRow(rowId);
      if (action === "winner") markWinner(rowId);
      if (action === "delete") deleteRow(rowId);
    });
  });

  updateLiveSessionStatus();
}



btnSeeMore.addEventListener("click", () => {
  rankingExpanded = !rankingExpanded;
  renderRanking();
});

btnOpenSession.addEventListener("click", () => {
  sessionDateInput.value = todayISO();
  dateModal.showModal();
});

dateModal.addEventListener("close", () => {
  if (dateModal.returnValue !== "ok") return;
  const dateISO = sessionDateInput.value;
  if (!dateISO) return;
  startLiveSession(dateISO);
});

btnAddRow.addEventListener("click", () => addDraftRow());
btnCloseSession.addEventListener("click", () => closeSession());

btnAddPlayer.addEventListener("click", () => {
  playerFirstName.value = "";
  playerLastName.value = "";
  playerStudentNum.value = "";
  addPlayerModal.showModal();
});

confirmAddPlayer.addEventListener("click", async (e) => {
  e.preventDefault();
  
  const firstName = (playerFirstName.value ?? "").trim();
  const lastName = (playerLastName.value ?? "").trim();
  
  if (!firstName || !lastName) {
    alert("Prénom et nom sont obligatoires.");
    return;
  }
  
  const fullName = `${firstName} ${lastName}`;
  if (players.some(p => p.name === fullName)) {
    alert("Ce membre existe déjà.");
    return;
  }
  const result = await createPlayerAPI(fullName, null);
  
  if (!result) {
    alert("Erreur lors de l'ajout du membre.");
    return;
  }
  addPlayerModal.close();
  playerConfirmation.showModal();
  setTimeout(() => {
    playerConfirmation.close();
  }, 2500);
  renderRanking();
  playerFirstName.value = "";
  playerLastName.value = "";
});

btnWinnerTournament.addEventListener("click", () => {
  const options = players.map(p => `<option value="${escapeHTMLAttr(p.name)}">${escapeHTML(p.name)}</option>`).join("");
  tournamentWinner.innerHTML = `<option value="">-- Sélectionner un membre --</option>${options}`;
  
  tournamentWinner.value = "";
  tournamentDate.value = todayISO();
  tournamentModal.showModal();
});

tournamentModal.addEventListener("close", () => {
  if (tournamentModal.returnValue !== "ok") return;
  
  const winner = tournamentWinner.value;
  const date = tournamentDate.value;
  
  addTournamentWinner(winner, date);
});

btnViewArchives.addEventListener("click", () => {
  renderArchives();
  archivesModal.showModal();
});



function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;",
  }[s]));
}

function escapeHTMLAttr(str) {
  return escapeHTML(str).replace(/"/g, "&quot;");
}



function renderAll() {
  renderRanking();
  renderSessionsGrid();
  renderTournamentsGrid();
}

renderAll();