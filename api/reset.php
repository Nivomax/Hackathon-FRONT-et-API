<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Confirmation de sécurité
    $data = json_decode(file_get_contents('php://input'), true);
    $confirm = $data['confirm'] ?? false;
    
    if (!$confirm) {
        http_response_code(400);
        echo json_encode(['error' => 'Confirmation requise (confirm: true)']);
        exit;
    }
    
    try {
        // Désactiver les foreign keys temporairement
        $conn->query("SET FOREIGN_KEY_CHECKS=0");
        
        // Vider les participations en premier (FK vers sessions et players)
        $conn->query("DELETE FROM session_participations");
        echo json_encode(['message' => 'session_participations vidée']);
        
        // Vider les séances
        $conn->query("DELETE FROM sessions");
        echo json_encode(['message' => 'sessions vidée']);
        
        // Vider les tournois
        $conn->query("DELETE FROM tournaments");
        echo json_encode(['message' => 'tournaments vidée']);
        
        // Vider les joueurs
        $conn->query("DELETE FROM players");
        echo json_encode(['message' => 'players vidée']);
        
        // Réactiver les foreign keys
        $conn->query("SET FOREIGN_KEY_CHECKS=1");
        
        echo json_encode([
            'success' => true,
            'message' => '✅ Base de données réinitialisée (sessions, joueurs, tournois supprimés)'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée. Utilise POST avec {confirm: true}']);
}
?>
