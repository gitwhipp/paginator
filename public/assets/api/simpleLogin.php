<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed.'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$password = (string) ($data['password'] ?? '');

/*
|--------------------------------------------------------------------------
| Simple repo-safe starter password
|--------------------------------------------------------------------------
| Change this before real use.
| Later, move it to env/config if you want.
*/
const SIMPLE_ADMIN_PASSWORD = 'change-me';

if ($password === '' || !hash_equals(SIMPLE_ADMIN_PASSWORD, $password)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid password.'
    ]);
    exit;
}

$_SESSION['paginator_admin'] = true;
$_SESSION['paginator_login_time'] = time();

echo json_encode([
    'status' => 'success',
    'message' => 'Login successful.'
]);
exit;