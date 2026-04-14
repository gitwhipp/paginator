<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

echo json_encode([
    'status' => 'success',
    'isLoggedIn' => isset($_SESSION['paginator_admin']) && $_SESSION['paginator_admin'] === true
]);
exit;