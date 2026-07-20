<?php
require 'handler.php';
// We don't have $pdo, but we can check if all functions in match($action) exist!
$content = file_get_contents('handler.php');
preg_match_all("/=>\s*([a-zA-Z0-9_]+)\\\(/", $content, $matches);
$errors = [];
foreach ($matches[1] as $func) {
    if (!function_exists($func)) {
        $errors[] = $func;
    }
}
print_r($errors);
