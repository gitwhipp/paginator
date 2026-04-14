<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

$basePath = __DIR__ . '/../../uploads';
$isAdmin = isset($_SESSION['paginator_admin']) && $_SESSION['paginator_admin'] === true;

if (!is_dir($basePath)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Uploads folder not found.'
    ]);
    exit;
}

$out = [];
$dirs = array_filter(glob($basePath . '/*'), 'is_dir');

foreach ($dirs as $dirPath) {
    $name = basename($dirPath);
    $hidden = file_exists($dirPath . '/.hidden');
    $private = file_exists($dirPath . '/.private');

    if ($hidden && !$isAdmin) {
        continue;
    }

    if ($private && !$isAdmin) {
        continue;
    }

    $out[] = [
        'name' => $name,
        'hidden' => $hidden,
        'private' => $private,
        'mtime' => filemtime($dirPath)
    ];
}

echo json_encode($out);
exit;