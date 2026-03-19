<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['action']) ? $_GET['action'] : '';

/* =========================
   POST: Créer un compte (Register)
========================= */
if ($method === 'POST' && $request === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = $data['email'] ?? null;
    $password = $data['password'] ?? null;
    $role = $data['role'] ?? 'player';
    
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email et mot de passe sont obligatoires']);
        exit;
    }
    
    // Vérifier si l'email existe déjà
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cet email est déjà utilisé']);
        $stmt->close();
        exit;
    }
    
    $stmt->close();
    
    // Hasher le mot de passe
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Créer le compte
    $stmt = $conn->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
    $stmt->bind_param('sss', $email, $hashedPassword, $role);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id,
            'message' => 'Compte créé avec succès'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
    }
    
    $stmt->close();
}

/* =========================
   POST: Login
========================= */
elseif ($method === 'POST' && $request === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = $data['email'] ?? null;
    $password = $data['password'] ?? null;
    
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email et mot de passe sont obligatoires']);
        exit;
    }
    
    // Récupérer l'utilisateur
    $stmt = $conn->prepare("SELECT id, email, password, role FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou mot de passe incorrect']);
        $stmt->close();
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    // Vérifier le mot de passe
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou mot de passe incorrect']);
        $stmt->close();
        exit;
    }
    
    $stmt->close();
    
    // Répondre avec les infos de l'utilisateur (sans le password)
    echo json_encode([
        'success' => true,
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role']
    ]);
}

/* =========================
   GET: Récupérer un utilisateur
========================= */
elseif ($method === 'GET') {
    $userId = $_GET['id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID utilisateur manquant']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT id, email, role FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Utilisateur non trouvé']);
        $stmt->close();
        exit;
    }
    
    $user = $result->fetch_assoc();
    echo json_encode($user);
    
    $stmt->close();
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non supportée']);
}

$conn->close();
?>
