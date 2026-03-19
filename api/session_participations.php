<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

/* =========================
   GET: Récupérer les participations
========================= */
header('Content-Type: application/json');

if ($method === 'GET') {
    $action = $_GET['action'] ?? null;
    $sessionId = $_GET['session_id'] ?? null;
    
    if ($action === 'all') {
        // Retourner TOUTES les participations de toutes les séances
        $sql = "SELECT sp.id, sp.session_id, sp.player_id, p.name, p.studentNum,
                sp.arrivedAt, sp.eliminateAt, sp.position, sp.placementPoints
                FROM session_participations sp
                LEFT JOIN players p ON sp.player_id = p.id
                ORDER BY sp.session_id, sp.position ASC";
        
        $result = $conn->query($sql);
        if ($result === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
            exit;
        }
        
        $participations = [];
        while ($row = $result->fetch_assoc()) {
            $participations[] = $row;
        }
        
        echo json_encode($participations);
    }
    elseif ($sessionId) {
        // Retourner les participations pour une séance spécifique
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
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'session_id ou action=all manquant']);
        exit;
    }
}

/* =========================
   POST: Ajouter un joueur à une séance
========================= */
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $sessionId = $data['session_id'] ?? null;
    $playerId = $data['player_id'] ?? null;
    $arrivedAt = $data['arrivedAt'] ?? null;
    
    if (!$sessionId || !$playerId) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id et player_id sont obligatoires']);
        exit;
    }
    
    // Si arrivedAt n'est pas fourni, utiliser l'heure actuelle
    if (!$arrivedAt) {
        $arrivedAt = (int)(microtime(true) * 1000);
    }
    
    $stmt = $conn->prepare(
        "INSERT INTO session_participations (session_id, player_id, arrivedAt) 
         VALUES (?, ?, ?)"
    );
    $stmt->bind_param('iii', $sessionId, $playerId, $arrivedAt);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id,
            'message' => 'Joueur ajouté à la séance'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

/* =========================
   PUT: Mettre à jour une participation
========================= */
elseif ($method === 'PUT') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalide']);
        exit;
    }
    
    $id = $data['id'] ?? null;
    $eliminateAt = isset($data['eliminateAt']) ? $data['eliminateAt'] : null;
    $position = isset($data['position']) ? $data['position'] : null;
    $placementPoints = isset($data['placementPoints']) ? $data['placementPoints'] : null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de participation manquant']);
        exit;
    }
    
    // Vérifier qu'au moins un champ est fourni
    if ($eliminateAt === null && $position === null && $placementPoints === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Au moins un champ doit être fourni']);
        exit;
    }
    
    // Construire la requête dynamiquement
    $setParts = [];
    if ($eliminateAt !== null) {
        $setParts[] = "eliminateAt = " . (int)$eliminateAt;
    }
    if ($position !== null) {
        $setParts[] = "position = " . (int)$position;
    }
    if ($placementPoints !== null) {
        $setParts[] = "placementPoints = " . (int)$placementPoints;
    }
    
    if (empty($setParts)) {
        http_response_code(400);
        echo json_encode(['error' => 'Aucun champ à mettre à jour']);
        exit;
    }
    
    $sql = "UPDATE session_participations SET " . implode(', ', $setParts) . " WHERE id = " . (int)$id;
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'message' => 'Participation mise à jour']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non supportée']);
}

$conn->close();
?>
