/* =========================
   Storage helpers
========================= */

const LS_KEYS = {
  players: "poker_players_v1",
  sessions: "poker_sessions_v1",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeed() {
  const existingPlayers = loadJSON(LS_KEYS.players, null);
  const existingSessions = loadJSON(LS_KEYS.sessions, null);

  if (!existingPlayers) saveJSON(LS_KEYS.players, window.SEED_PLAYERS ?? []);
  if (!existingSessions) saveJSON(LS_KEYS.sessions, window.SEED_SESSIONS ?? []);
}

/* =========================
   Utils
========================= */

function pad2(n) { return String(n).padStart(2, "0"); }

function formatDateISOToFR(iso) {
  // iso: YYYY-MM-DD
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

/* =========================
   State
========================= */

ensureSeed();

let players = loadJSON(LS_KEYS.players, []);
let sessions = loadJSON(LS_KEYS.sessions, []);

let rankingExpanded = false;

// Séance en cours (non persistée tant que pas clôturée)
let liveSession = null;
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

const detailModal = document.getElementById("detailModal");
const detailDate = document.getElementById("detailDate");
const detailCount = document.getElementById("detailCount");
const detailBody = document.getElementById("detailBody");

const btnReset = document.getElementById("btnReset");

/* =========================
   Ranking (cumul)
========================= */

function computeTotalsByPlayer() {
  // total = somme totalPoints de chaque séance
  const map = new Map(); // name => points
  for (const s of sessions) {
    for (const r of s.rows) {
      const cur = map.get(r.playerName) ?? 0;
      map.set(r.playerName, cur + (r.totalPoints ?? 0));
    }
  }
  // inclure joueurs qui n’ont jamais joué => 0 (optionnel)
  for (const p of players) {
    if (!map.has(p)) map.set(p, 0);
  }
  return map;
}

function renderRanking() {
  const totals = computeTotalsByPlayer();
  const list = Array.from(totals.entries()).map(([playerName, total]) => ({ playerName, total }));

  list.sort((a, b) => b.total - a.total || a.playerName.localeCompare(b.playerName, "fr"));

  const shown = rankingExpanded ? list : list.slice(0, 10);

  rankingBody.innerHTML = "";
  shown.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="rankPos">${idx + 1}</td>
      <td class="points">${row.total}</td>
      <td class="playerName">${escapeHTML(row.playerName)}</td>
    `;
    rankingBody.appendChild(tr);
  });

  const totalCount = list.length;
  if (totalCount <= 10) {
    btnSeeMore.classList.add("hidden");
  } else {
    btnSeeMore.classList.remove("hidden");
    btnSeeMore.textContent = rankingExpanded ? "Voir moins" : "Voir plus";
  }

  rankingInfo.textContent = rankingExpanded
    ? `${totalCount} joueurs affichés`
    : `10 / ${totalCount} joueurs affichés`;
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
    const div = document.createElement("button");
    div.type = "button";
    div.className = "sessionCard";
    const count = s.rows?.length ?? 0;

    div.innerHTML = `
      <div class="sessionCard__date">${formatDateISOToFR(s.date)}</div>
      <div class="sessionCard__sub">${count} participant(s)</div>
    `;
    div.addEventListener("click", () => openSessionDetail(s.id));
    sessionsGrid.appendChild(div);
  }
}

function openSessionDetail(sessionId) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;

  detailDate.textContent = `${formatDateISOToFR(s.date)}`;
  detailCount.textContent = `${s.rows.length}`;

  // ordonner: winner (pos 1) puis positions croissantes
  const rows = [...s.rows].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

  detailBody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHTML(r.playerName)}</strong> ${r.winner ? `<span class="rowTag tag--winner">Gagnant</span>` : ""}</td>
      <td>${formatDateTime(r.arrivedAt)}</td>
      <td>${r.eliminatedAt ? formatDateTime(r.eliminatedAt) : "—"}</td>
      <td class="points">${r.lxp ?? 0}</td>
      <td class="points">${r.position ?? "—"}</td>
      <td class="points">${r.placementPoints ?? 0}</td>
      <td class="points">${r.totalPoints ?? 0}</td>
    `;
    detailBody.appendChild(tr);
  }

  detailModal.showModal();
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
  if (!name) return alert("Choisis un joueur.");

  // empêcher doublons dans la séance
  const already = liveSession.rows.some(r => r.rowId !== rowId && r.playerName === name && r.status !== "draft");
  if (already) return alert("Ce joueur est déjà présent dans la séance.");

  // si nouveau joueur (pas dans la liste globale) => on l'ajoute
  if (!players.includes(name)) {
    players.push(name);
    players.sort((a, b) => a.localeCompare(b, "fr"));
    saveJSON(LS_KEYS.players, players);
  }

  const row = liveSession.rows.find(r => r.rowId === rowId);
  if (!row) return;

  row.playerName = name;
  row.status = "active";
  row.arrivedAt = Date.now();

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
  // gagnant : pas éliminé
  row.eliminatedAt = null;

  recalcLiveSession(true);
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
    return alert("La séance n’est pas terminée : il faut un gagnant et tous les autres éliminés.");
  }

  // Construire séance persistée
  const persisted = {
    id: liveSession.id,
    date: liveSession.date,
    createdAt: liveSession.createdAt,
    rows: liveSession.rows.map(r => ({
      playerName: r.playerName,
      arrivedAt: r.arrivedAt,
      eliminatedAt: r.eliminatedAt,
      lxp: r.lxp,
      position: r.position,
      placementPoints: r.placementPoints,
      totalPoints: r.totalPoints,
      winner: r.status === "winner",
    })),
  };

  sessions.push(persisted);
  saveJSON(LS_KEYS.sessions, sessions);

  // reset live
  liveSession = null;
  liveSessionSection.classList.add("hidden");
  liveSessionBody.innerHTML = "";

  // refresh UI
  renderSessionsGrid();
  renderRanking();
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

    // colonne joueur
    let playerCellHTML = "";
    if (r.status === "draft") {
      playerCellHTML = `
        <div class="field">
          <input type="text" data-role="playerInput" data-row="${r.rowId}" placeholder="Nom du joueur..." list="playersList" />
        </div>
      `;
    } else {
      playerCellHTML = `<div><strong>${escapeHTML(r.playerName)}</strong> ${tagHTML}</div>`;
    }

    // action
    let actionHTML = "";
    if (r.status === "draft") {
      actionHTML = `<button class="btn btn--secondary" type="button" data-action="validate" data-row="${r.rowId}">Ajouter</button>`;
    } else if (r.status === "active") {
      // si c’est le dernier joueur "active" ET aucun gagnant => bouton gagnant
      const activeCount = liveSession.rows.filter(x => x.status === "active").length;
      const hasWinner = liveSession.rows.some(x => x.status === "winner");

      if (activeCount === 1 && !hasWinner) {
        actionHTML = `<button class="btn btn--primary" type="button" data-action="winner" data-row="${r.rowId}">Gagnant</button>`;
      } else {
        actionHTML = `<button class="btn btn--secondary" type="button" data-action="eliminate" data-row="${r.rowId}">Éliminer</button>`;
      }
    } else {
      actionHTML = `<span class="muted">—</span>`;
    }

    tr.innerHTML = `
      <td>${playerCellHTML}</td>
      <td>${r.arrivedAt ? formatDateTime(r.arrivedAt) : "—"}</td>
      <td>${r.eliminatedAt ? formatDateTime(r.eliminatedAt) : "—"}</td>
      <td class="points">${r.lxp ?? 0}</td>
      <td class="points">${r.position ?? "—"}</td>
      <td class="points">${r.placementPoints ?? 0}</td>
      <td class="points">${r.totalPoints ?? 0}</td>
      <td>${actionHTML}</td>
    `;

    liveSessionBody.appendChild(tr);
  }

  // datalist pour autocomplete
  ensurePlayersDatalist();

  // bind actions (délégation)
  liveSessionBody.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const rowId = btn.getAttribute("data-row");
      const action = btn.getAttribute("data-action");
      if (action === "validate") {
        const input = liveSessionBody.querySelector(`[data-role="playerInput"][data-row="${rowId}"]`);
        validateRow(rowId, input?.value ?? "");
      }
      if (action === "eliminate") eliminateRow(rowId);
      if (action === "winner") markWinner(rowId);
    });
  });

  updateLiveSessionStatus();
}

function ensurePlayersDatalist() {
  let dl = document.getElementById("playersList");
  if (!dl) {
    dl = document.createElement("datalist");
    dl.id = "playersList";
    document.body.appendChild(dl);
  }
  dl.innerHTML = players.map(p => `<option value="${escapeHTMLAttr(p)}"></option>`).join("");
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

addPlayerModal.addEventListener("close", () => {
  if (addPlayerModal.returnValue !== "ok") return;
  
  const firstName = (playerFirstName.value ?? "").trim();
  const lastName = (playerLastName.value ?? "").trim();
  
  if (!firstName || !lastName) {
    alert("Prénom et nom sont obligatoires.");
    addPlayerModal.showModal(); // rouvrir pour corriger
    return;
  }
  
  const fullName = `${firstName} ${lastName}`;
  
  // vérifier que le joueur n'existe pas déjà
  if (players.includes(fullName)) {
    alert("Ce joueur existe déjà.");
    addPlayerModal.showModal();
    return;
  }
  
  // ajouter le joueur
  players.push(fullName);
  saveJSON(LS_KEYS.players, players);
  
  // rafraîchir l'UI (classement + datalist)
  renderRanking();
  ensurePlayersDatalist();
});

btnReset.addEventListener("click", () => {
  const ok = confirm("Réinitialiser les données locales (joueurs + séances) ?");
  if (!ok) return;
  localStorage.removeItem(LS_KEYS.players);
  localStorage.removeItem(LS_KEYS.sessions);
  ensureSeed();
  players = loadJSON(LS_KEYS.players, []);
  sessions = loadJSON(LS_KEYS.sessions, []);
  rankingExpanded = false;
  liveSession = null;
  liveSessionSection.classList.add("hidden");
  renderAll();
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
  ensurePlayersDatalist();
}

renderAll();