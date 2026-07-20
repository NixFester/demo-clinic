<?php
$pdo = new PDO('mysql:host=localhost;dbname=simklinik;charset=utf8mb4', 'root', '');
$stmt = $pdo->query("SELECT * FROM pendaftaran WHERE id_paket_layanan IS NOT NULL ORDER BY id DESC LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
