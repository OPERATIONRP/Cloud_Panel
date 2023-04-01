<?php
// Remove the time limit
set_time_limit(0);
include 'main.php';
// Make sure the GET params exist and the token is valid
if (isset($_GET['file'], $_GET['token']) && verify_token($_GET['file'], $_GET['token'])) {
    // Determine the correct path
    $path = rtrim(determine_full_path($_GET['file']), '/');
    // Get the file type
    $type = mime_content_type($path);
    // Make sure the user can only view images, videos, or audio files
    $viewable = false;
    $viewable = preg_match('/image\/*/', $type) ? true : $viewable;
    $viewable = preg_match('/audio\/*/', $type) ? true : $viewable;
    $viewable = preg_match('/video\/*/', $type) ? true : $viewable;
    // Make sure the file exists
    if (file_exists($path) && $viewable) {
        // Output the file
        header('Content-type: ' . $type);
        readfile($path);
        exit; 
    } else {
        exit('File doesn\'t exist!');
    }
} else {
    exit('Invalid Request!');
}
?>