renameFile.php

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
$oldName = trim((string) ($data['oldName'] ?? ''));
$newName = trim((string) ($data['newName'] ?? ''));

if ($oldName === '' || $newName === '') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing file names.'
    ]);
    exit;
}

if (!preg_match('/^[A-Za-z0-9 _.\-]+$/', $newName)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid new file name.'
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

$oldPath = $realTargetDir . '/' . basename($oldName);
$newPath = $realTargetDir . '/' . basename($newName);

if (!file_exists($oldPath) || !is_file($oldPath)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Original file does not exist.'
    ]);
    exit;
}

if (file_exists($newPath)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Target file already exists.'
    ]);
    exit;
}

if (!rename($oldPath, $newPath)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to rename file.'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'message' => 'File renamed successfully.'
]);
exit;