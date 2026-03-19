/* =========================
   Utils
========================= */

function pad2(n) { return String(n).padStart(2, "0"); }

function formatDateISOToFR(iso) {
  // iso: YYYY-MM-DD
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

/**
 * Règle LXP :
 * diff = eliminatedAt - arrivedAt (ms) => heures entières arrondies à l'inférieur
 * min 1
 */
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

/**
 * Affiche une modal de confirmation au lieu d'utiliser window.confirm()
 * @param {string} message - Message de confirmation
 * @returns {Promise<boolean>} - true si confirmé, false si annulé
 */
function showConfirmation(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmationModal");
    const msgEl = document.getElementById("confirmationMessage");
    const confirmBtn = document.getElementById("confirmationConfirmBtn");
    
    msgEl.textContent = message;
    
    // Listener unique pour le bouton
    const handleConfirm = () => {
      confirmBtn.removeEventListener("click", handleConfirm);
      modal.close();
      resolve(true);
    };
    
    confirmBtn.addEventListener("click", handleConfirm);
    
    // Si on ferme la modal sans confirmer, retourner false
    modal.addEventListener("close", () => {
      confirmBtn.removeEventListener("click", handleConfirm);
      if (modal.returnValue !== "confirm") {
        resolve(false);
      }
    }, { once: true });
    
    modal.showModal();
  });
}

/* =========================
   State (définies dans sync.js)
========================= */

// Les variables players, sessions, tournaments, etc. sont maintenant
// déclarées et gérées dans sync.js avec l'API

let rankingExpanded = false;

/**
 * liveSession = {
 *   id, date, createdAt,
 *   rows: [
 *     {
 *       rowId,
 *       playerName,
 *       status: "draft"|"active"|"eliminated"|"winner",
 *       arrivedAt,
 *       eliminatedAt,
 *       lxp,
 *       position,
 *       placementPoints,
 *       totalPoints
 *     }
 *   ]
 * }
 * (liveSession est déclaré dans sync.js)
 */

/* =========================
   DOM
========================= */

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

/* =========================
   Ranking (cumul)
========================= */

function computePlacementPointsByPlayer() {
  // total = somme placementPoints de chaque séance + 250 par tournoi gagné
  const map = new Map(); // name => points
  for (const s of sessions) {
    for (const r of s.rows) {
      const cur = map.get(r.playerName) ?? 0;
      const pts = r.placementPoints ? parseInt(r.placementPoints, 10) : 0;
      map.set(r.playerName, cur + pts);
    }
  }
  
  // ajouter 250 points par victoire en tournoi
  for (const t of tournaments) {
    if (t.winner) {
      const cur = map.get(t.winner) ?? 0;
      map.set(t.winner, cur + 250);
    }
  }
  
  // inclure membres qui n'ont jamais joué => 0 (optionnel)
  for (const p of players) {
    if (!map.has(p.name)) map.set(p.name, 0);
  }
  return map;
}

function computeLXPPointsByPlayer() {
  // total = somme lxp de chaque séance
  const map = new Map(); // name => lxp
  for (const s of sessions) {
    for (const r of s.rows) {
      const cur = map.get(r.playerName) ?? 0;
      const lxp = r.lxp ? parseInt(r.lxp, 10) : 0;
      map.set(r.playerName, cur + lxp);
    }
  }
  // inclure membres qui n'ont jamais joué => 0 (optionnel)
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

  // Masquer le bouton et le texte
  btnSeeMore.classList.add("hidden");
  rankingInfo.textContent = "";
}

/* =========================
   Historique séances
========================= */

function renderSessionsGrid() {
  sessionsGrid.innerHTML = "";

  const sorted = [...sessions].sort((a, b) => {
    // tri par date (desc), puis createdAt desc
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

  // ordonner: winner (pos 1) puis positions croissantes
  const rows = [...s.rows].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

  detailBody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    
    // Pour le gagnant (position 1), LXP = durée jusqu'à maintenant
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

/* =========================
   Tournaments
========================= */

function renderTournamentsGrid() {
  tournamentsGrid.innerHTML = "";

  const sorted = [...tournaments].sort((a, b) => {
    // tri par date desc
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

  // vérifier que le gagnant existe
  const winnerPlayer = players.find(p => p.name === winner);
  if (!winnerPlayer) {
    alert("Le gagnant n'existe pas.");
    return;
  }

  // Créer le tournoi via l'API
  createTournamentAPI(`Tournoi ${formatDateISOToFR(date)}`, winnerPlayer.id, date).then(result => {
    if (result) {
      console.log('✅ Tournoi créé:', result.id);
      
      // show confirmation
      tournamentConfirmation.showModal();
      setTimeout(() => {
        tournamentConfirmation.close();
      }, 2500);

      // Rafraîchir les données
      initializeFromAPI().then(() => {
        renderTournamentsGrid();
        renderRanking();
      });
    }
  });
}

function deleteSession(sessionId) {
  // Archiver la séance en BD au lieu de la supprimer
  PokerAPI.archiveSession(sessionId).then(result => {
    if (result.success) {
      console.log('✅ Séance archivée');
      
      // Retirer de la liste active
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        archivedSessions.push(session);
      }
      sessions = sessions.filter(s => s.id !== sessionId);
      
      if (liveSession && liveSession.id === sessionId) {
        liveSession = null;
        liveSessionSection.classList.add("hidden");
      }
      
      // Rafraîchir l'affichage
      renderSessionsGrid();
      renderRanking();  // ✅ Recalculer le ranking après suppression
    }
  });
}

function deleteTournament(tournamentId) {
  // Archiver le tournoi en BD au lieu de le supprimer
  PokerAPI.archiveTournament(tournamentId).then(result => {
    if (result.success) {
      console.log('✅ Tournoi archivé');
      
      // Retirer de la liste active
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        archivedTournaments.push(tournament);
      }
      tournaments = tournaments.filter(t => t.id !== tournamentId);
      
      // Rafraîchir l'affichage
      renderTournamentsGrid();
      renderRanking();
    }
  });
}

function restoreSession(sessionId) {
  // Restaurer la séance en BD (mettre isArchived = 0)
  PokerAPI.restoreSession(sessionId).then(result => {
    if (result.success) {
      console.log('✅ Séance restaurée');
      
      // Déplacer de archived vers sessions
      const session = archivedSessions.find(s => s.id === sessionId);
      if (session) {
        sessions.push(session);
        archivedSessions = archivedSessions.filter(s => s.id !== sessionId);
      }
      
      // Rafraîchir l'affichage
      renderSessionsGrid();
      renderArchives();
      renderRanking();
    }
  }).catch(error => {
    console.error('❌ Erreur restauration:', error);
  });
}

function restoreTournament(tournamentId) {
  // Restaurer le tournoi en BD (mettre isArchived = 0)
  PokerAPI.restoreTournament(tournamentId).then(result => {
    if (result.success) {
      console.log('✅ Tournoi restauré');
      
      // Déplacer de archived vers tournaments
      const tournament = archivedTournaments.find(t => t.id === tournamentId);
      if (tournament) {
        tournaments.push(tournament);
        archivedTournaments = archivedTournaments.filter(t => t.id !== tournamentId);
      }
      
      // Rafraîchir l'affichage
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

  // Conteneur principal pour afficher séances et tournois côte à côte
  const mainContainer = document.createElement("div");
  mainContainer.style.display = "flex";
  mainContainer.style.gap = "24px";
  mainContainer.style.flexWrap = "wrap";

  // Sections supprimés
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

  // Tournois supprimés
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
      btn.addEventListener("click", () => {
        if (confirm("Restaurer ce tournoi ?")) {
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

/* =========================
   Live session (formulaire dynamique)
========================= */

function startLiveSession(dateISO) {
  liveSession = {
    id: uid("sess"),
    date: dateISO,
    createdAt: Date.now(),
    rows: [],
  };

  liveSessionDateLabel.textContent = formatDateISOToFR(dateISO);
  liveSessionSection.classList.remove("hidden");

  // Créer la séance en BD (sans attendre la réponse pour l'UX)
  createSessionAPI(dateISO).then(result => {
    if (result) {
      liveSession.id = result.id; // Utiliser l'ID de la BD
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

  // empêcher doublons dans la séance
  const already = liveSession.rows.some(r => r.rowId !== rowId && r.playerName === name && r.status !== "draft");
  if (already) return alert("Ce membre est déjà présent dans la séance.");

  // Chercher le joueur dans la liste (qui vient de l'API)
  const player = players.find(p => p.name === name);
  if (!player) return alert("Ce membre n'existe pas.");

  const row = liveSession.rows.find(r => r.rowId === rowId);
  if (!row) return;

  row.playerName = name;
  row.status = "active";
  row.arrivedAt = Date.now();
  row.playerId = player.id; // Stocker l'ID du joueur pour plus tard

  // Ajouter le joueur à la séance en BD (async)
  addPlayerToSessionAPI(liveSession.id, player.id, row.arrivedAt).then(result => {
    if (result && result.id) {
      row.participationId = result.id; // Stocker le participationId pour les mises à jour futures
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

  // un seul gagnant
  for (const r of liveSession.rows) {
    if (r.status === "winner") {
      return alert("Le gagnant est déjà défini.");
    }
  }

  const row = liveSession.rows.find(r => r.rowId === rowId);
  if (!row || row.status !== "active") return;

  row.status = "winner";
  // Capturer l'heure de fin du jeu (pour calculer LXP jusqu'à maintenant)
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

  if (draft.length > 0) return false; // lignes non validées
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

  // Sauvegarder les résultats en BD
  const updatePromises = [];
  for (const r of liveSession.rows) {
    if (r.participationId && typeof r.position === "number") {
      updatePromises.push(
        updateParticipationAPI(r.participationId, r.eliminatedAt, r.position, r.placementPoints)
      );
    }
  }

  // Attendre que toutes les mises à jour soient faites
  Promise.all(updatePromises).then(() => {
    // Clôturer la séance
    return closeSessionAPI(liveSession.id);
  }).then(result => {
    if (result.success) {
      console.log('✅ Séance clôturée avec succès');
      
      // Reset live
      const closedSessionId = liveSession.id;
      liveSession = null;
      liveSessionSection.classList.add("hidden");
      liveSessionBody.innerHTML = "";

      // show confirmation
      liveSessionConfirmation.showModal();
      setTimeout(() => {
        liveSessionConfirmation.close();
      }, 2500);

      // Rafraîchir les données depuis l'API
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

  // participants = rows validées (active/eliminated/winner)
  const rows = liveSession.rows.filter(r => r.status !== "draft");

  // si un seul "active" restant et pas de winner => proposer automatiquement le bouton gagnant
  // (UI gérée dans renderLiveSession)

  // si winner est défini, on finalise positions/points
  const winner = rows.find(r => r.status === "winner");
  const active = rows.filter(r => r.status === "active");
  const eliminated = rows.filter(r => r.status === "eliminated");

  // Reset calculs par défaut (pour garder cohérence si ajout tardif)
  for (const r of rows) {
    r.position = null;
    r.placementPoints = 0;
    r.totalPoints = (r.lxp ?? 0); // total = LXP + placement (placement ajouté si position connue)
  }

  // Tant qu'il n'y a pas de winner, on peut déjà calculer LXP pour éliminés (déjà fait),
  // mais pas de positions définitives.
  if (!winner && !forceFinalize) {
    updateLiveSessionStatus();
    return;
  }

  if (!winner) {
    updateLiveSessionStatus();
    return;
  }

  // Positions finales :
  // winner = 1
  // autres = tri par eliminatedAt desc (éliminé plus tard => meilleure position)
  winner.position = 1;

  // Calculer le LXP du gagnant (du arrivedAt jusqu'à maintenant)
  if (winner.arrivedAt) {
    winner.lxp = computeLXP(winner.arrivedAt, Date.now());
  }

  // sécurité: tous les éliminés doivent avoir eliminatedAt
  const elimSorted = eliminated
    .filter(r => !!r.eliminatedAt)
    .sort((a, b) => (b.eliminatedAt ?? 0) - (a.eliminatedAt ?? 0));

  let pos = 2;
  for (const r of elimSorted) {
    r.position = pos++;
  }

  // Les "active" restants (si incohérence) -> pas clôturable
  for (const r of active) {
    r.position = null;
    r.placementPoints = 0;
    r.totalPoints = (r.lxp ?? 0);
  }

  // Placement points + totalPoints
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

  // bouton clôture
  if (canCloseSession()) btnCloseSession.classList.remove("hidden");
  else btnCloseSession.classList.add("hidden");
}

/* =========================
   Render live session table
========================= */

function renderLiveSession() {
  if (!liveSession) return;

  const rows = liveSession.rows;

  liveSessionBody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");

    // tag visuel
    let tagHTML = "";
    if (r.status === "active") tagHTML = `<span class="rowTag tag--active">Ajouté</span>`;
    if (r.status === "eliminated") tagHTML = `<span class="rowTag tag--eliminated">Éliminé</span>`;
    if (r.status === "winner") tagHTML = `<span class="rowTag tag--winner">Gagnant</span>`;

    // colonne membre
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

    // action
    let actionHTML = "";
    if (r.status === "draft") {
      actionHTML = `<button class="btn btn--secondary" type="button" data-action="validate" data-row="${r.rowId}">Ajouter</button>`;
      // ajouter bouton de suppression pour les brouillons
      actionHTML += ` <button class="btn btn--ghost" type="button" data-action="delete" data-row="${r.rowId}" style="padding: 10px 8px; color: #ef4444;">✕</button>`;
    } else if (r.status === "active") {
      // si c'est le dernier membre "active" ET aucun gagnant => bouton gagnant
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

  // datalist pour autocomplete
  // (remove: non nécessaire avec dropdown exclusif)

  // bind actions (délégation)
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

/* =========================
   UI events
========================= */

btnSeeMore.addEventListener("click", () => {
  rankingExpanded = !rankingExpanded;
  renderRanking();
});

btnOpenSession.addEventListener("click", () => {
  sessionDateInput.value = todayISO();
  dateModal.showModal();
});

dateModal.addEventListener("close", () => {
  // dialog.returnValue vaut "ok" ou "cancel"
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
  
  // vérifier que le membre n'existe pas déjà
  if (players.some(p => p.name === fullName)) {
    alert("Ce membre existe déjà.");
    return;
  }
  
  // Ajouter le membre via l'API
  const result = await createPlayerAPI(fullName, null);
  
  if (!result) {
    alert("Erreur lors de l'ajout du membre.");
    return;
  }
  
  // Fermer le modal
  addPlayerModal.close();
  
  // show confirmation
  playerConfirmation.showModal();
  setTimeout(() => {
    playerConfirmation.close();
  }, 2500);
  
  // rafraîchir l'UI (classement)
  renderRanking();
  
  // Clear inputs
  playerFirstName.value = "";
  playerLastName.value = "";
});

btnWinnerTournament.addEventListener("click", () => {
  // remplir les listes de sélection
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

/* =========================
   Escape helpers
========================= */

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
  // pour value=""
  return escapeHTML(str).replace(/"/g, "&quot;");
}

/* =========================
   Init
========================= */

function renderAll() {
  renderRanking();
  renderSessionsGrid();
  renderTournamentsGrid();
}

renderAll();