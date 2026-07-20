<?php
try {
  $pdo = new PDO('mysql:host=localhost;dbname=simklinik;charset=utf8mb4', 'root', '');
  $stmt = $pdo->prepare("SELECT DATE_FORMAT(created_at,'%Y-%m') as df, COUNT(*) FROM invoice GROUP BY df");
  $stmt->execute();
  print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch(Exception $e) { echo $e->getMessage(); }
