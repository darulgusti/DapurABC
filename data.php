<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'registrants.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Ambil semua data
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } else {
        echo json_encode([]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Simpan data baru
    $input = json_decode(file_get_contents('php://input'), true);
    $data = json_decode(file_get_contents($dataFile), true) ?: [];
    
    array_unshift($data, $input);
    // Batasi 100 data terakhir
    $data = array_slice($data, 0, 100);
    
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode(['status' => 'success']);
}
?>