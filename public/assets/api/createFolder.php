<?php
header('Content-Type: application/json');

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

$folderName = trim((string) ($data['folderName'] ?? ''));
$parent = trim((string) ($data['parent'] ?? ''), '/');

if ($folderName === '' || !preg_match('/^[A-Za-z0-9 _.\-]+$/', $folderName)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid folder name.'
    ]);
    exit;
}

$basePath = $realUploadsRoot;

if ($parent !== '') {
    $parentPath = realpath($realUploadsRoot . '/' . $parent);

    if ($parentPath === false || !is_dir($parentPath) || strpos($parentPath, $realUploadsRoot) !== 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid parent folder.'
        ]);
        exit;
    }

    $basePath = $parentPath;
}

$targetPath = $basePath . '/' . $folderName;

if (file_exists($targetPath)) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Folder already exists.',
        'path' => 'uploads/' . ($parent !== '' ? $parent . '/' : '') . $folderName
    ]);
    exit;
}

if (!mkdir($targetPath, 0777, true)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to create folder.'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'message' => 'Folder created successfully.',
    'path' => 'uploads/' . ($parent !== '' ? $parent . '/' : '') . $folderName
]);
exit;