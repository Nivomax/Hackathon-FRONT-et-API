<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';
$action = $_GET['action'] ?? '';

if (!$endpoint) {
    http_response_code(404);
    echo json_encode([
        'error' => 'Endpoint non trouve',
        'available' => ['players', 'sessions', 'session_participations', 'tournaments', 'ranking', 'users'],
    ]);
    $conn->close();
    exit;
}

switch ($endpoint) {
    case 'players':
        handlePlayers($conn, $method, $action);
        break;
    case 'sessions':
        handleSessions($conn, $method, $action);
        break;
    case 'session_participations':
        handleSessionParticipations($conn, $method, $action);
        break;
    case 'tournaments':
        handleTournaments($conn, $method, $action);
        break;
    case 'ranking':
        handleRanking($conn, $method, $action);
        break;
    case 'users':
        handleUsers($conn, $method, $action);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint non trouve']);
        break;
}

$conn->close();

function readJsonBody() {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function handlePlayers($conn, $method, $action) {
    if ($method === 'GET') {
        if ($action === 'all' || !$action) {
            $sql = "SELECT id, name, studentNum FROM players ORDER BY name ASC";
            $result = $conn->query($sql);

            $players = [];
            while ($row = $result->fetch_assoc()) {
                $players[] = $row;
            }

            echo json_encode($players);
            return;
        }
    }

    if ($method === 'POST') {
        $data = readJsonBody();
        $name = $data['name'] ?? null;
        $studentNum = $data['studentNum'] ?? null;
        $user_id = $data['user_id'] ?? null;

        if (!$name) {
            http_response_code(400);
            echo json_encode(['error' => 'Le nom du joueur est obligatoire']);
            return;
        }

        $stmt = $conn->prepare("INSERT INTO players (name, studentNum, user_id) VALUES (?, ?, ?)");
        $stmt->bind_param('ssi', $name, $studentNum, $user_id);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'id' => $stmt->insert_id,
                'message' => 'Joueur cree avec succes',
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Methode non supportee']);
}

function handleSessions($conn, $method, $action) {
    if ($method === 'GET') {
        if ($action === 'all' || !$action) {
            $sql = "SELECT id, date, status, createdAt FROM sessions WHERE isArchived = 0 ORDER BY date DESC";
            $result = $conn->query($sql);

            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
                return;
            }

            $sessions = [];
            while ($row = $result->fetch_assoc()) {
                $sessions[] = $row;
            }

            echo json_encode($sessions);
            return;
        }

        if ($action === 'archived') {
            $sql = "SELECT id, date, status, createdAt FROM sessions WHERE isArchived = 1 ORDER BY date DESC";
            $result = $conn->query($sql);

            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
                return;
            }

            $sessions = [];
            while ($row = $result->fetch_assoc()) {
                $sessions[] = $row;
            }

            echo json_encode($sessions);
            return;
        }

        if ($action === 'detail') {
            $sessionId = $_GET['id'] ?? null;

            if (!$sessionId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de seance manquant']);
                return;
            }

            $sql = "SELECT s.id, s.date, s.status, s.createdAt,
                    sp.id as participationId, sp.player_id, p.name, p.studentNum,
                    sp.arrivedAt, sp.eliminateAt, sp.position, sp.placementPoints
                    FROM sessions s
                    LEFT JOIN session_participations sp ON s.id = sp.session_id
                    LEFT JOIN players p ON sp.player_id = p.id
                    WHERE s.id = ?
                    ORDER BY sp.position ASC";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param('i', $sessionId);
            $stmt->execute();
            $result = $stmt->get_result();

            $rows = [];
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }

            $session = null;
            if (!empty($rows)) {
                $session = [
                    'id' => $rows[0]['id'],
                    'date' => $rows[0]['date'],
                    'status' => $rows[0]['status'],
                    'createdAt' => $rows[0]['createdAt'],
                    'participations' => array_filter($rows, fn($r) => $r['participationId'] !== null),
                ];
            }

            echo json_encode($session);
            $stmt->close();
            return;
        }
    }

    if ($method === 'POST') {
        $data = readJsonBody();
        $date = $data['date'] ?? null;
        $status = $data['status'] ?? 'created';

        if (!$date) {
            http_response_code(400);
            echo json_encode(['error' => 'La date est obligatoire']);
            return;
        }

        $stmt = $conn->prepare("INSERT INTO sessions (date, status) VALUES (?, ?)");
        $stmt->bind_param('ss', $date, $status);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'id' => $stmt->insert_id,
                'message' => 'Seance creee avec succes',
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    if ($method === 'PUT') {
        $data = readJsonBody();
        $id = $data['id'] ?? null;
        $status = $data['status'] ?? null;
        $isArchived = $data['isArchived'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID est obligatoire']);
            return;
        }

        $setParts = [];
        $types = '';
        $params = [];

        if ($status !== null) {
            $setParts[] = 'status = ?';
            $types .= 's';
            $params[] = $status;
        }

        if ($isArchived !== null) {
            $setParts[] = 'isArchived = ?';
            $types .= 'i';
            $params[] = (int)$isArchived;
        }

        if (empty($setParts)) {
            http_response_code(400);
            echo json_encode(['error' => 'Au moins un champ doit etre fourni']);
            return;
        }

        $params[] = $id;
        $types .= 'i';

        $sql = 'UPDATE sessions SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Seance mise a jour']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    if ($method === 'DELETE') {
        $data = readJsonBody();
        $id = $data['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de seance manquant']);
            return;
        }

        $stmt = $conn->prepare('UPDATE sessions SET isArchived = 1 WHERE id = ?');
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Seance archivee']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Methode non supportee']);
}

function handleSessionParticipations($conn, $method, $action) {
    if ($method === 'GET') {
        $sessionId = $_GET['session_id'] ?? null;

        if ($action === 'all') {
            $sql = "SELECT sp.id, sp.session_id, sp.player_id, p.name, p.studentNum,
                    sp.arrivedAt, sp.eliminateAt, sp.position, sp.placementPoints
                    FROM session_participations sp
                    LEFT JOIN players p ON sp.player_id = p.id
                    ORDER BY sp.session_id, sp.position ASC";

            $result = $conn->query($sql);
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
                return;
            }

            $participations = [];
            while ($row = $result->fetch_assoc()) {
                $participations[] = $row;
            }

            echo json_encode($participations);
            return;
        }

        if ($sessionId) {
            $sql = "SELECT sp.id, sp.session_id, sp.player_id, p.name, p.studentNum,
                    sp.arrivedAt, sp.eliminateAt, sp.position, sp.placementPoints
                    FROM session_participations sp
                    LEFT JOIN players p ON sp.player_id = p.id
                    WHERE sp.session_id = ?
                    ORDER BY sp.position ASC";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param('i', $sessionId);
            $stmt->execute();
            $result = $stmt->get_result();

            $participations = [];
            while ($row = $result->fetch_assoc()) {
                $participations[] = $row;
            }

            echo json_encode($participations);
            $stmt->close();
            return;
        }

        http_response_code(400);
        echo json_encode(['error' => 'session_id ou action=all manquant']);
        return;
    }

    if ($method === 'POST') {
        $data = readJsonBody();
        $sessionId = $data['session_id'] ?? null;
        $playerId = $data['player_id'] ?? null;
        $arrivedAt = $data['arrivedAt'] ?? null;

        if (!$sessionId || !$playerId) {
            http_response_code(400);
            echo json_encode(['error' => 'session_id et player_id sont obligatoires']);
            return;
        }

        if (!$arrivedAt) {
            $arrivedAt = (int)(microtime(true) * 1000);
        }

        $stmt = $conn->prepare(
            'INSERT INTO session_participations (session_id, player_id, arrivedAt) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('iii', $sessionId, $playerId, $arrivedAt);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'id' => $stmt->insert_id,
                'message' => 'Joueur ajoute a la seance',
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    if ($method === 'PUT') {
        $data = readJsonBody();

        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'JSON invalide']);
            return;
        }

        $id = $data['id'] ?? null;
        $eliminateAt = array_key_exists('eliminateAt', $data) ? $data['eliminateAt'] : null;
        $position = array_key_exists('position', $data) ? $data['position'] : null;
        $placementPoints = array_key_exists('placementPoints', $data) ? $data['placementPoints'] : null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de participation manquant']);
            return;
        }

        if ($eliminateAt === null && $position === null && $placementPoints === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Au moins un champ doit etre fourni']);
            return;
        }

        $setParts = [];
        if ($eliminateAt !== null) {
            $setParts[] = 'eliminateAt = ' . (int)$eliminateAt;
        }
        if ($position !== null) {
            $setParts[] = 'position = ' . (int)$position;
        }
        if ($placementPoints !== null) {
            $setParts[] = 'placementPoints = ' . (int)$placementPoints;
        }

        $sql = 'UPDATE session_participations SET ' . implode(', ', $setParts) . ' WHERE id = ' . (int)$id;

        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Participation mise a jour']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
        }
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Methode non supportee']);
}

function handleTournaments($conn, $method, $action) {
    if ($method === 'GET') {
        if ($action === 'all' || !$action) {
            $sql = 'SELECT * FROM tournaments WHERE isArchived = 0 ORDER BY date DESC';
            $result = $conn->query($sql);

            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => 'Query error: ' . $conn->error]);
                return;
            }

            $tournaments = [];
            while ($row = $result->fetch_assoc()) {
                $tournaments[] = $row;
            }

            echo json_encode($tournaments);
            return;
        }

        if ($action === 'archived') {
            $sql = 'SELECT * FROM tournaments WHERE isArchived = 1 ORDER BY date DESC';
            $result = $conn->query($sql);

            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => 'Query error: ' . $conn->error]);
                return;
            }

            $tournaments = [];
            while ($row = $result->fetch_assoc()) {
                $tournaments[] = $row;
            }

            echo json_encode($tournaments);
            return;
        }
    }

    if ($method === 'POST') {
        $data = readJsonBody();
        $name = $data['name'] ?? null;
        $winner_id = $data['winner_id'] ?? null;
        $date = $data['date'] ?? date('Y-m-d');

        if (!$name || !$winner_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Nom et ID du gagnant sont obligatoires']);
            return;
        }

        $stmt = $conn->prepare('INSERT INTO tournaments (name, winner_id, date) VALUES (?, ?, ?)');
        $stmt->bind_param('sis', $name, $winner_id, $date);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'id' => $stmt->insert_id,
                'message' => 'Tournoi cree avec succes',
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    if ($method === 'PUT') {
        $data = readJsonBody();
        $id = $data['id'] ?? null;
        $isArchived = $data['isArchived'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID est obligatoire']);
            return;
        }

        if ($isArchived === null) {
            http_response_code(400);
            echo json_encode(['error' => 'isArchived doit etre fourni']);
            return;
        }

        $stmt = $conn->prepare('UPDATE tournaments SET isArchived = ? WHERE id = ?');
        $stmt->bind_param('ii', $isArchived, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Tournoi mis a jour']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    if ($method === 'DELETE') {
        $data = readJsonBody();
        $id = $data['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de tournoi manquant']);
            return;
        }

        $stmt = $conn->prepare('UPDATE tournaments SET isArchived = 1 WHERE id = ?');
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Tournoi archive']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Methode non supportee']);
}

function handleRanking($conn, $method, $action) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Methode non supportee']);
        return;
    }

    if ($action === 'general') {
        $sql = "SELECT
                p.id, p.name, p.studentNum,
                COUNT(DISTINCT sp.session_id) as nbSessions,
                SUM(sp.placementPoints) as totalPoints,
                AVG(sp.position) as avgPosition,
                MIN(sp.position) as bestPosition
                FROM players p
                LEFT JOIN session_participations sp ON p.id = sp.player_id
                GROUP BY p.id
                ORDER BY totalPoints DESC, nbSessions DESC";

        $result = $conn->query($sql);
        $ranking = [];
        $position = 1;

        while ($row = $result->fetch_assoc()) {
            $row['position'] = $position;
            $ranking[] = $row;
            $position++;
        }

        echo json_encode($ranking);
        return;
    }

    if ($action === 'player') {
        $playerId = $_GET['id'] ?? null;

        if (!$playerId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID joueur manquant']);
            return;
        }

        $sql = 'SELECT id, name, studentNum FROM players WHERE id = ?';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $playerId);
        $stmt->execute();
        $playerResult = $stmt->get_result();

        if ($playerResult->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Joueur non trouve']);
            $stmt->close();
            return;
        }

        $player = $playerResult->fetch_assoc();
        $stmt->close();

        $sql = "SELECT
                s.id as sessionId, s.date,
                p.name, p.id,
                sp.arrivedAt, sp.eliminateAt, sp.position, sp.placementPoints
                FROM session_participations sp
                JOIN sessions s ON sp.session_id = s.id
                JOIN players p ON sp.player_id = p.id
                WHERE p.id = ?
                ORDER BY s.date DESC";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $playerId);
        $stmt->execute();
        $historyResult = $stmt->get_result();

        $history = [];
        while ($row = $historyResult->fetch_assoc()) {
            $history[] = $row;
        }

        $stmt->close();

        $sql = "SELECT
                COUNT(DISTINCT sp.session_id) as nbSessions,
                SUM(sp.placementPoints) as totalPoints,
                AVG(sp.position) as avgPosition,
                MIN(sp.position) as bestPosition,
                MAX(sp.position) as worstPosition
                FROM session_participations sp
                WHERE sp.player_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $playerId);
        $stmt->execute();
        $statsResult = $stmt->get_result();
        $stats = $statsResult->fetch_assoc();
        $stmt->close();

        echo json_encode([
            'player' => $player,
            'stats' => $stats,
            'history' => $history,
        ]);
        return;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Action non reconnue']);
}

function handleUsers($conn, $method, $action) {
    if ($method === 'POST' && $action === 'register') {
        $data = readJsonBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $role = $data['role'] ?? 'player';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email et mot de passe sont obligatoires']);
            return;
        }

        $stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cet email est deja utilise']);
            $stmt->close();
            return;
        }

        $stmt->close();

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $conn->prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
        $stmt->bind_param('sss', $email, $hashedPassword, $role);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'id' => $stmt->insert_id,
                'message' => 'Compte cree avec succes',
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        }

        $stmt->close();
        return;
    }

    if ($method === 'POST' && $action === 'login') {
        $data = readJsonBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email et mot de passe sont obligatoires']);
            return;
        }

        $stmt = $conn->prepare('SELECT id, email, password, role FROM users WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            http_response_code(401);
            echo json_encode(['error' => 'Email ou mot de passe incorrect']);
            $stmt->close();
            return;
        }

        $user = $result->fetch_assoc();

        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Email ou mot de passe incorrect']);
            $stmt->close();
            return;
        }

        $stmt->close();

        echo json_encode([
            'success' => true,
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ]);
        return;
    }

    if ($method === 'GET') {
        $userId = $_GET['id'] ?? null;

        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID utilisateur manquant']);
            return;
        }

        $stmt = $conn->prepare('SELECT id, email, role FROM users WHERE id = ?');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Utilisateur non trouve']);
            $stmt->close();
            return;
        }

        $user = $result->fetch_assoc();
        echo json_encode($user);
        $stmt->close();
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Methode non supportee']);
}
