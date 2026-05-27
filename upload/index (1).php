<?php

/**
 * SIMKlinik — PHP Bridge
 * ----------------------
 * Pintu masuk tunggal dari Vercel (Next.js) ke MySQL di cPanel.
 * Semua business logic ada di Vercel. File ini hanya menjalankan
 * query berdasarkan action yang dikirim, lalu mengembalikan JSON.
 *
 * Cara deploy: upload seluruh folder /bridge ke cPanel via File Manager.
 * Letakkan di luar public_html jika memungkinkan, atau di dalam subfolder
 * dengan nama acak (contoh: /public_html/x7k2m9p/).
 */

declare(strict_types=1);

// ─── CORS & Headers ───────────────────────────────────────────────────────────

$allowed_origin = getenv('ALLOWED_ORIGIN') ?: '*';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $allowed_origin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Bridge-Secret');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Method Guard ─────────────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Method not allowed']));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

$incoming_secret = $_SERVER['HTTP_X_BRIDGE_SECRET'] ?? '';
$expected_secret = getenv('BRIDGE_SECRET') ?: '';

if (empty($expected_secret) || !hash_equals($expected_secret, $incoming_secret)) {
    http_response_code(403);
    exit(json_encode(['error' => 'Forbidden']));
}

// ─── Parse Body ───────────────────────────────────────────────────────────────

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body) || empty($body['action'])) {
    http_response_code(400);
    exit(json_encode(['error' => 'Missing action']));
}

$action = (string) $body['action'];
$data   = $body['data'] ?? [];

// ─── DB Connection ────────────────────────────────────────────────────────────

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: '';
$db_user = getenv('DB_USER') ?: '';
$db_pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    exit(json_encode(['error' => 'DB connection failed']));
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

require_once __DIR__ . '/handlers.php';

try {
    $result = dispatch($pdo, $action, $data);
    echo json_encode($result);
} catch (BridgeException $e) {
    http_response_code($e->getCode() ?: 422);
    echo json_encode(['error' => $e->getMessage()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal error']);
}
