<?php
require_once 'config.php';

// Récupérer la méthode HTTP
$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['action']) ? $_GET['action'] : '';

/* =========================
   GET: Récupérer les joueurs
========================= */
if ($method === 'GET') {
    if ($request === 'all' || !$request) {
        // Récupérer tous les joueurs
        $sql = "SELECT id, name, studentNum FROM players ORDER BY name ASC";
        $result = $conn->query($sql);
        
        $players = [];
        while ($row = $result->fetch_assoc()) {
            $players[] = $row;
        }
        
        echo json_encode($players);
    }
}

/* =========================
   POST: Créer un nouveau joueur
========================= */
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $data['name'] ?? null;
    $studentNum = $data['studentNum'] ?? null;
    $user_id = $data['user_id'] ?? null;
    
    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Le nom du joueur est obligatoire']);
        exit;
    }
    
    // Préparer la requête
    $stmt = $conn->prepare("INSERT INTO players (name, studentNum, user_id) VALUES (?, ?, ?)");
    $stmt->bind_param('ssi', $name, $studentNum, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id,
            'message' => 'Joueur créé avec succès'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

/* =========================
   Méthode non supportée
========================= */
else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non supportée']);
}

$conn->close();
?>
