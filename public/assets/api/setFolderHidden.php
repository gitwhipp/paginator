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

$uploadsRoot = __DIR__ . '/../../uploads';
$realUploadsRoot = realpath($uploadsRoot);

if ($realUploadsRoot === false || !is_dir($realUploadsRoot)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Uploads root not found.'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$folder = trim((string) ($input['folder'] ?? ''), '/');
$value = (bool) ($input['value'] ?? false);

if ($folder === '') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid folder.'
    ]);
    exit;
}

$folderPath = realpath($realUploadsRoot . '/' . $folder);

if (
    $folderPath === false ||
    !is_dir($folderPath) ||
    strpos($folderPath, $realUploadsRoot) !== 0
) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Folder not found.'
    ]);
    exit;
}

$marker = $folderPath . '/.hidden';

if ($value) {
    if (file_put_contents($marker, 'hidden') === false) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to set hidden flag.'
        ]);
        exit;
    }
} else {
    if (file_exists($marker) && !unlink($marker)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to clear hidden flag.'
        ]);
        exit;
    }
}

echo json_encode([
    'status' => 'success'
]);
exit;