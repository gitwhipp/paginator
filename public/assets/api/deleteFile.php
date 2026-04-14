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

if (!(isset($_SESSION['paginator_admin']) && $_SESSION['paginator_admin'] === true)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];

$uploadsRoot = __DIR__ . '/../../uploads';
$realUploadsRoot = realpath($uploadsRoot);

if ($realUploadsRoot === false || !is_dir($realUploadsRoot)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Uploads root not found.'
    ]);
    exit;
}

$dir = trim((string) ($data['dir'] ?? ''), '/');
$file = trim((string) ($data['file'] ?? ''), '/');

if ($file === '') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing file.'
    ]);
    exit;
}

$targetDir = $dir === '' ? $realUploadsRoot : $realUploadsRoot . '/' . $dir;
$realTargetDir = realpath($targetDir);

if (
    $realTargetDir === false ||
    !is_dir($realTargetDir) ||
    strpos($realTargetDir, $realUploadsRoot) !== 0
) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid directory.'
    ]);
    exit;
}

$targetFile = $realTargetDir . '/' . basename($file);
$realTargetFile = realpath($targetFile);

if (
    $realTargetFile === false ||
    !is_file($realTargetFile) ||
    strpos($realTargetFile, $realTargetDir) !== 0
) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid file.'
    ]);
    exit;
}

if (!unlink($realTargetFile)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Delete failed.'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'dir' => $dir,
    'file' => basename($file)
]);
exit;