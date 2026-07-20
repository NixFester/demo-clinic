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

// Check antrian detail to see pk.id_paket_layanan
$res = call_bridge('debug.query', [
    'query' => 'SELECT pk.* FROM paket_kunjungan pk WHERE pk.id_pendaftaran = 30'
]);
print_r($res);
