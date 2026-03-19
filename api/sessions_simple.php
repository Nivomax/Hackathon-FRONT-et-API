<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'all';

if ($method === 'GET') {
    if ($action === 'all') {
        // Récupérer les séances (juste les séances, pas de participations pour l'instant)
        $sql = "SELECT id, date, status, createdAt FROM sessions ORDER BY date DESC";
        $result = $conn->query($sql);
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Query error: ' . $conn->error]);
            exit;
        }
        
        $sessions = [];
        while ($row = $result->fetch_assoc()) {
            $sessions[] = $row;
        }
        
        echo json_encode($sessions);
    }
}

$conn->close();
?>
