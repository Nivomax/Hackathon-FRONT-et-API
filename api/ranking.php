<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['action']) ? $_GET['action'] : '';

/* =========================
   GET: Récupérer le classement général
========================= */
if ($method === 'GET') {
    if ($request === 'general') {
        // Classement avec total des points
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
    }
    
    elseif ($request === 'player') {
        // Historique complet d'un joueur
        $playerId = $_GET['id'] ?? null;
        
        if (!$playerId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID joueur manquant']);
            exit;
        }
        
        // Infos générales
        $sql = "SELECT id, name, studentNum FROM players WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $playerId);
        $stmt->execute();
        $playerResult = $stmt->get_result();
        
        if ($playerResult->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Joueur non trouvé']);
            $stmt->close();
            exit;
        }
        
        $player = $playerResult->fetch_assoc();
        $stmt->close();
        
        // Historique des participations
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
        
        // Statistiques
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
            'history' => $history
        ]);
    }
    
    else {
        http_response_code(400);
        echo json_encode(['error' => 'Action non reconnue']);
    }
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non supportée']);
}

$conn->close();
?>
