<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

if (!(isset($_SESSION['paginator_admin']) && $_SESSION['paginator_admin'] === true)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];

if (
    !isset($data['order']) || !is_array($data['order']) ||
    !isset($data['path']) || !is_string($data['path'])
) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid input.'
    ]);
    exit;
}

$order = array_values(array_map('strval', $data['order']));
$pathKey = trim($data['path']);
$pathKey = ($pathKey === '' || $pathKey === '/')
    ? '/'
    : '/' . trim($pathKey, '/');

$configDir = __DIR__ . '/../config';
if (!is_dir($configDir) && !mkdir($configDir, 0777, true)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to create config directory.'
    ]);
    exit;
}

$file = $configDir . '/folder_order.json';
$existing = [];

if (file_exists($file)) {
    $decoded = json_decode(file_get_contents($file), true);
    if (is_array($decoded)) {
        $existing = $decoded;
    }
}

$existing[$pathKey] = $order;

if (file_put_contents($file, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to write order file.'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'count' => count($order),
    'savedPathKey' => $pathKey
]);
exit;