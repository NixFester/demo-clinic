<?php
require 'handler.php';
$pdo = new PDO('mysql:host=localhost;dbname=simklinik;charset=utf8mb4', 'root', '');
print_r(dispatch($pdo, "auth.findByUsername", ["username" => "admin", "password" => "admin123"]));
