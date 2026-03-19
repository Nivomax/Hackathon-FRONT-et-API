<?php
// Script simple pour vider la BD
$conn = new mysqli('localhost', 'root', '', 'poker_db');

if ($conn->connect_error) {
    die('❌ Erreur: ' . $conn->connect_error);
}

$conn->query('SET FOREIGN_KEY_CHECKS=0');
$conn->query('DELETE FROM session_participations');
$conn->query('DELETE FROM sessions');
$conn->query('DELETE FROM tournaments');
$conn->query('DELETE FROM players');
$conn->query('SET FOREIGN_KEY_CHECKS=1');

echo '✅ BD complètement vidée!' . PHP_EOL;
echo '   - session_participations vidée' . PHP_EOL;
echo '   - sessions vidée' . PHP_EOL;
echo '   - tournaments vidée' . PHP_EOL;
echo '   - players vidée' . PHP_EOL;
?>
