<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['action']) ? $_GET['action'] : '';

/* =========================
   GET: Récupérer les séances
========================= */
if ($method === 'GET') {
    if ($request === 'all' || !$request) {
        // Récupérer juste les séances, pas les participations
        // Filtrer par isArchived = 0 pour exclure les séances supprimées
        $sql = "SELECT id, date, status, createdAt FROM sessions WHERE isArchived = 0 ORDER BY date DESC";
        $result = $conn->query($sql);
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
            exit;
        }
        
        $sessions = [];
        while ($row = $result->fetch_assoc()) {
            $sessions[] = $row;
        }
        
        echo json_encode($sessions);
    }
    elseif ($request === 'archived') {
        // Récupérer uniquement les séances archivées
        $sql = "SELECT id, date, status, createdAt FROM sessions WHERE isArchived = 1 ORDER BY date DESC";
        $result = $conn->query($sql);
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur SQL: ' . $conn->error]);
            exit;
        }
        
        $sessions = [];
        while ($row = $result->fetch_assoc()) {
            $sessions[] = $row;
        }
        
        echo json_encode($sessions);
    }
    elseif ($request === 'detail') {
        // Récupérer une séance spécifique avec ses détails
        $sessionId = $_GET['id'] ?? null;
        
        if (!$sessionId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de séance manquant']);
            exit;
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
        
        $session = null;
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        
        if (!empty($rows)) {
            $session = [
                'id' => $rows[0]['id'],
                'date' => $rows[0]['date'],
                'status' => $rows[0]['status'],
                'createdAt' => $rows[0]['createdAt'],
                'participations' => array_filter($rows, fn($r) => $r['participationId'] !== null)
            ];
        }
        
        echo json_encode($session);
        $stmt->close();
    }
}

/* =========================
   POST: Créer une nouvelle séance
========================= */
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $date = $data['date'] ?? null;
    $status = $data['status'] ?? 'created';
    
    if (!$date) {
        http_response_code(400);
        echo json_encode(['error' => 'La date est obligatoire']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO sessions (date, status) VALUES (?, ?)");
    $stmt->bind_param('ss', $date, $status);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id,
            'message' => 'Séance créée avec succès'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

/* =========================
   PUT: Modifier une séance (status ou isArchived)
========================= */
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? null;
    $status = $data['status'] ?? null;
    $isArchived = $data['isArchived'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID est obligatoire']);
        exit;
    }
    
    // Construire la requête dynamiquement
    $setParts = [];
    $types = '';
    $params = [];
    
    if ($status !== null) {
        $setParts[] = "status = ?";
        $types .= 's';
        $params[] = $status;
    }
    
    if ($isArchived !== null) {
        $setParts[] = "isArchived = ?";
        $types .= 'i';
        $params[] = (int)$isArchived;
    }
    
    if (empty($setParts)) {
        http_response_code(400);
        echo json_encode(['error' => 'Au moins un champ doit être fourni']);
        exit;
    }
    
    $params[] = $id;  // Ajouter l'ID à la fin pour la clause WHERE
    $types .= 'i';
    
    $sql = "UPDATE sessions SET " . implode(', ', $setParts) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Séance mise à jour']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

/* =========================
   DELETE: Archiver une séance
========================= */
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de séance manquant']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE sessions SET isArchived = 1 WHERE id = ?");
    $stmt->bind_param('i', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Séance archivée']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non supportée']);
}

$conn->close();
?>
