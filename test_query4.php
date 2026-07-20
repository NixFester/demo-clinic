<?php
$url = 'http://apivercel.healthcenterindonesia.com';
$env = file_get_contents('.env');
preg_match('/BRIDGE_SECRET=(.*)/', $env, $matches);
$secret = trim($matches[1]);

function call_bridge($action, $data) {
    global $url, $secret;
    $ch = curl_init($url);
    $payload = json_encode(['action' => $action, 'data' => $data]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Bridge-Secret: ' . $secret
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

// Check paket layanan list
$res = call_bridge('paket_layanan.index', []);
print_r($res);
