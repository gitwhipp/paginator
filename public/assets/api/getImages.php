<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true) ?: [];

$baseDir = __DIR__ . '/../../uploads';
$maxPageSizeBytes = intval($data['maxPageSizeBytes'] ?? (40 * 1024 * 1024));
$dir = trim((string) ($data['dir'] ?? ''), '/');
$page = max(0, intval($data['page'] ?? 0));
$sort = (string) ($data['sort'] ?? 'default');

$realBaseDir = realpath($baseDir);
$targetDir = $dir === '' ? $baseDir : $baseDir . '/' . $dir;
$realTargetDir = realpath($targetDir);
$isAdmin = isset($_SESSION['paginator_admin']) && $_SESSION['paginator_admin'] === true;

if (
    $realBaseDir === false ||
    $realTargetDir === false ||
    !is_dir($realTargetDir) ||
    strpos($realTargetDir, $realBaseDir) !== 0
) {
    exitWithError('Invalid directory.');
}

if (!$isAdmin && file_exists($realTargetDir . '/.private')) {
    exitWithError('Access denied.');
}

$files = [];
$folders = [];

foreach (scandir($realTargetDir) as $file) {
    if ($file === '.' || $file === '..') {
        continue;
    }

    $path = $realTargetDir . '/' . $file;

    if (is_file($path)) {
        if ($file === '.hidden' || $file === '.private') {
            continue;
        }

        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

        $files[] = [
            'name' => $file,
            'size' => filesize($path),
            'mtime' => filemtime($path),
            'ext' => $ext
        ];
        continue;
    }

    if (is_dir($path)) {
        $hidden = file_exists($path . '/.hidden');
        $private = file_exists($path . '/.private');

        if (($hidden || $private) && !$isAdmin) {
            continue;
        }

        $folders[] = [
            'name' => $file,
            'hidden' => $hidden,
            'private' => $private,
            'mtime' => filemtime($path)
        ];
    }
}

if ($sort === 'az') {
    usort($files, fn($a, $b) => strcasecmp($a['name'], $b['name']));
} elseif ($sort === 'za') {
    usort($files, fn($a, $b) => strcasecmp($b['name'], $a['name']));
} elseif ($sort === 'date') {
    usort($files, fn($a, $b) => ($b['mtime'] ?? 0) <=> ($a['mtime'] ?? 0));
} elseif ($sort === 'date_old') {
    usort($files, fn($a, $b) => ($a['mtime'] ?? 0) <=> ($b['mtime'] ?? 0));
} else {
    usort($files, fn($a, $b) => strcasecmp($a['name'], $b['name']));
}

$pages = [];
$currentPage = [];
$currentSize = 0;

foreach ($files as $file) {
    $fileSize = intval($file['size'] ?? 0);

    if ($currentSize + $fileSize > $maxPageSizeBytes && !empty($currentPage)) {
        $pages[] = $currentPage;
        $currentPage = [];
        $currentSize = 0;
    }

    $currentPage[] = $file;
    $currentSize += $fileSize;
}

if (!empty($currentPage)) {
    $pages[] = $currentPage;
}

echo json_encode([
    'folders' => $folders,
    'files' => $pages[$page] ?? [],
    'totalPages' => count($pages),
    'currentPage' => $page
]);
exit;

function exitWithError(string $message): void
{
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit;
}