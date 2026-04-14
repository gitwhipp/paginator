<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

if (!(isset($_SESSION['paginator_admin']) && $_SESSION['paginator_admin'] === true)) {
    exitWithError('Unauthorized');
}

$baseDir = __DIR__ . '/../../uploads';

if (!is_dir($baseDir)) {
    exitWithError('Uploads root not found');
}

$dir = trim((string) ($_POST['dir'] ?? ''), '/');
if ($dir !== '' && !preg_match('/^[A-Za-z0-9 _.\-\/]{1,255}$/', $dir)) {
    exitWithError('Invalid target folder');
}

$targetDir = $dir === '' ? $baseDir : $baseDir . '/' . $dir;

if (!is_dir($targetDir) && !mkdir($targetDir, 0777, true)) {
    exitWithError('Failed to create folder');
}

$realBaseDir = realpath($baseDir);
$realTargetDir = realpath($targetDir);

if (
    $realBaseDir === false ||
    $realTargetDir === false ||
    !is_dir($realTargetDir) ||
    strpos($realTargetDir, $realBaseDir) !== 0
) {
    exitWithError('Invalid target folder');
}

if (!isset($_FILES['files'])) {
    exitWithError('No files uploaded');
}

$names = $_FILES['files']['name'] ?? [];
$tmpNames = $_FILES['files']['tmp_name'] ?? [];
$errors = $_FILES['files']['error'] ?? [];

$results = [];

foreach ($names as $i => $name) {
    $tmp = $tmpNames[$i] ?? '';
    $error = $errors[$i] ?? UPLOAD_ERR_NO_FILE;

    $row = [
        'name' => $name,
        'status' => 'error',
        'message' => 'Unknown error',
    ];

    if ($error !== UPLOAD_ERR_OK) {
        $row['message'] = 'Upload error code ' . $error;
        $results[] = $row;
        continue;
    }

    if ($tmp === '' || !is_uploaded_file($tmp)) {
        $row['message'] = 'Not an uploaded file';
        $results[] = $row;
        continue;
    }

    $info = pathinfo((string) $name);
    $baseName = preg_replace('/[^A-Za-z0-9 _.\-]/', '_', $info['filename'] ?? 'file');
    if ($baseName === '') {
        $baseName = 'file';
    }

    $extension = '';
    if (!empty($info['extension'])) {
        $extension = '.' . preg_replace('/[^A-Za-z0-9]/', '', (string) $info['extension']);
    }

    $finalName = $baseName . $extension;
    $destination = $realTargetDir . '/' . $finalName;

    $counter = 1;
    while (file_exists($destination)) {
        $finalName = $baseName . ' (' . $counter . ')' . $extension;
        $destination = $realTargetDir . '/' . $finalName;
        $counter++;
    }

    if (!move_uploaded_file($tmp, $destination)) {
        $row['message'] = 'Failed to save file';
        $results[] = $row;
        continue;
    }

    $row['status'] = 'success';
    $row['message'] = 'Saved';
    $row['savedAs'] = $finalName;
    $results[] = $row;
}

$saved = array_values(array_filter($results, fn($r) => ($r['status'] ?? '') === 'success'));
$failed = array_values(array_filter($results, fn($r) => ($r['status'] ?? '') !== 'success'));

echo json_encode([
    'status' => count($saved) > 0 ? 'success' : 'error',
    'folder' => $dir,
    'target' => $dir === '' ? 'uploads' : 'uploads/' . $dir,
    'saved' => $saved,
    'failed' => $failed,
]);
exit;

function exitWithError(string $message): void
{
    echo json_encode([
        'status' => 'error',
        'message' => $message,
    ]);
    exit;
}