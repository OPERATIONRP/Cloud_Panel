<?php
// Remove the time limit
set_time_limit(0);
include 'main.php';
// Verify file
if (isset($_GET['file'], $_GET['token']) && verify_token($_GET['file'], $_GET['token'])) {
    // Determine the correct path
    $path = rtrim(determine_full_path($_GET['file']), '/');
    // Make sure the file exists
    if (file_exists($path)) {
        // Download file
        header('Content-Description: File Transfer'); 
        header('Content-Type: application/octet-stream'); 
        header('Content-Disposition: attachment; filename="' . basename($path) . '"'); 
        readfile($path);
        exit; 
    } else {
        exit('File doesn\'t exist!');
    }
} else {
    exit('Invalid Request!');
}
?>