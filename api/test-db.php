<?php
$conn = new mysqli('localhost', 'root', '', 'poker_db');
$conn->set_charset('utf8mb4');

// Vérifier chaque table
$tables = ['session_participations', 'players', 'sessions', 'users', 'tournaments'];
foreach ($tables as $table) {
    $result = $conn->query("DESCRIBE $table");
    echo "\n=== TABLE: $table ===\n";
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            echo "  {$row['Field']}: {$row['Type']} ({$row['Null']})\n";
        }
    } else {
        echo "\nERREUR: {$conn->error}\n";
    }
    
    // Compter le nombre de lignes
    $count = $conn->query("SELECT COUNT(*) as cnt FROM $table");
    $row = $count->fetch_assoc();
    echo "  -> {$row['cnt']} lignes\n";
}

// Test la requête directement
echo "\n\n=== TEST REQUÊTE DIRECTE ===\n";
$sql = "SELECT sp.id, sp.session_id, sp.player_id, p.name, p.studentNum,
        sp.arrivedAt, sp.eliminateAt, sp.position, sp.placementPoints
        FROM session_participations sp
        LEFT JOIN players p ON sp.player_id = p.id
        ORDER BY sp.session_id, sp.position ASC";

$result = $conn->query($sql);
if ($result === false) {
    echo "ERREUR SQL: " . $conn->error . "\n";
} else {
    echo "OK - " . $result->num_rows . " lignes trouvées\n";
    $first = $result->fetch_assoc();
    if ($first) {
        echo json_encode($first, JSON_PRETTY_PRINT) . "\n";
    }
}
?>
