<?php
/* =========================
   Configuration BD
========================= */

// Afficher les erreurs PHP en JSON au lieu d'HTML
ini_set('display_errors', '0');
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    die(json_encode(['error' => $errstr . ' (Line ' . $errline . ')']));
});

// Paramètres de connexion MySQL
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'poker_db');

// Créer la connexion
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Vérifier la connexion
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Erreur de connexion: ' . $conn->connect_error]));
}

// Définir le charset
$conn->set_charset('utf8mb4');

// Headers CORS (pour que le frontend puisse appeler l'API)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Gérer les requests OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
