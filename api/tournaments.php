<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['action']) ? $_GET['action'] : '';

// Logs de débogage
error_log("tournaments.php - METHOD: " . $method . ", REQUEST: " . $request);

/* =========================
   GET: Récupérer les tournois
========================= */
if ($method === 'GET') {
    if ($request === 'all' || !$request) {
        // Récupérer uniquement les tournois NON archivés
        $sql = "SELECT * FROM tournaments WHERE isArchived = 0 ORDER BY date DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Query error: ' . $conn->error]);
            exit;
        }
        
        $tournaments = [];
        while ($row = $result->fetch_assoc()) {
            $tournaments[] = $row;
        }
        
        echo json_encode($tournaments);
    }
    elseif ($request === 'archived') {
        // Récupérer uniquement les tournois archivés
        $sql = "SELECT * FROM tournaments WHERE isArchived = 1 ORDER BY date DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Query error: ' . $conn->error]);
            exit;
        }
        
        $tournaments = [];
        while ($row = $result->fetch_assoc()) {
            $tournaments[] = $row;
        }
        
        echo json_encode($tournaments);
    }
}

/* =========================
   POST: Créer un tournoi / Enregistrer le gagnant
========================= */
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $data['name'] ?? null;
    $winner_id = $data['winner_id'] ?? null;
    $date = $data['date'] ?? date('Y-m-d');
    
    if (!$name || !$winner_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Nom et ID du gagnant sont obligatoires']);
        exit;
    }
    
    $stmt = $conn->prepare(
        "INSERT INTO tournaments (name, winner_id, date) VALUES (?, ?, ?)"
    );
    $stmt->bind_param('sis', $name, $winner_id, $date);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id,
            'message' => 'Tournoi créé avec succès'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

/* =========================
   PUT: Restaurer un tournoi (mettre isArchived = 0)
========================= */
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? null;
    $isArchived = $data['isArchived'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID est obligatoire']);
        exit;
    }
    
    if ($isArchived === null) {
        http_response_code(400);
        echo json_encode(['error' => 'isArchived doit être fourni']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE tournaments SET isArchived = ? WHERE id = ?");
    $stmt->bind_param('ii', $isArchived, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Tournoi mis à jour']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

/* =========================
   DELETE: Archiver un tournoi (mettre isArchived = 1)
========================= */
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de tournoi manquant']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE tournaments SET isArchived = 1 WHERE id = ?");
    $stmt->bind_param('i', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Tournoi archivé']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

$conn->close();
?>
