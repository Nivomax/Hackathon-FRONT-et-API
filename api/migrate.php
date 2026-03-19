<?php
// Connexion directe à la BD
$conn = new mysqli('localhost', 'root', '', 'poker_db');

if ($conn->connect_error) {
    die("❌ Erreur de connexion: " . $conn->connect_error);
}

$conn->set_charset('utf8mb4');

// Ajouter la colonne isArchived aux tables
$tables = ['sessions', 'tournaments'];

foreach ($tables as $table) {
    $sql = "ALTER TABLE $table ADD COLUMN IF NOT EXISTS isArchived TINYINT DEFAULT 0";
    if ($conn->query($sql)) {
        echo "✅ Colonne isArchived ajoutée à $table\n";
    } else {
        echo "❌ Erreur pour $table: " . $conn->error . "\n";
    }
}

echo "\n✅ Migration complète!\n";
$conn->close();
?>
