<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    die(json_encode(['error' => $errstr . ' (Line ' . $errline . ')']));
});
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'poker_db');
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Erreur de connexion: ' . $conn->connect_error]));
}

$dbNameEscaped = DB_NAME;
if (!$conn->query("CREATE DATABASE IF NOT EXISTS `{$dbNameEscaped}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")) {
    http_response_code(500);
    die(json_encode(['error' => 'Erreur creation base: ' . $conn->error]));
}

if (!$conn->select_db(DB_NAME)) {
    http_response_code(500);
    die(json_encode(['error' => 'Erreur selection base: ' . $conn->error]));
}

$conn->set_charset('utf8mb4');

$schema = [
    "CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(190) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','player') NOT NULL DEFAULT 'player',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS players (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(120) NOT NULL,
        studentNum VARCHAR(64) NULL,
        user_id INT UNSIGNED NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_players_name (name),
        KEY idx_players_user_id (user_id),
        CONSTRAINT fk_players_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS sessions (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        date DATE NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'created',
        isArchived TINYINT(1) NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_sessions_date (date),
        KEY idx_sessions_archived (isArchived)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS session_participations (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        session_id INT UNSIGNED NOT NULL,
        player_id INT UNSIGNED NOT NULL,
        arrivedAt BIGINT UNSIGNED NOT NULL,
        eliminateAt BIGINT UNSIGNED NULL,
        position INT NULL,
        placementPoints INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_sp_session_id (session_id),
        KEY idx_sp_player_id (player_id),
        KEY idx_sp_position (position),
        CONSTRAINT fk_sp_session
            FOREIGN KEY (session_id) REFERENCES sessions(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        CONSTRAINT fk_sp_player
            FOREIGN KEY (player_id) REFERENCES players(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS tournaments (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(190) NOT NULL,
        winner_id INT UNSIGNED NOT NULL,
        date DATE NOT NULL,
        isArchived TINYINT(1) NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tournaments_winner_id (winner_id),
        KEY idx_tournaments_date (date),
        KEY idx_tournaments_archived (isArchived),
        CONSTRAINT fk_tournaments_winner
            FOREIGN KEY (winner_id) REFERENCES players(id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS semesters (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(190) NOT NULL,
        closedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        totalSessions INT NOT NULL DEFAULT 0,
        totalTournaments INT NOT NULL DEFAULT 0,
        snapshot_json LONGTEXT NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
];

foreach ($schema as $ddl) {
    if (!$conn->query($ddl)) {
        http_response_code(500);
        die(json_encode(['error' => 'Erreur migration schema: ' . $conn->error]));
    }
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
