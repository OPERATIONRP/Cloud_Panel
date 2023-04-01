<?php
include 'main.php';
// Output JSON object containing all directories
header('Content-Type: application/json; charset=utf-8');
exit(json_encode([ 
    'status' => 'success', 
    'data' => get_directories(INITIAL_DIRECTORY)
]));
?>