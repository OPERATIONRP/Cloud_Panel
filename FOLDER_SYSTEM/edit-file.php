<?php
include 'main.php';
// Errors array
$errors = [];
// Contents object
$contents = null;
// Make sure GET params exist and verify file
if (isset($_GET['file'], $_GET['token']) && verify_token($_GET['file'], $_GET['token'])) {
    // Determine the correct path
    $path = rtrim(determine_full_path($_GET['file']), '/');
    // Make sure file exists
    if (file_exists($path)) {
        // Make sure file is writable
        if (is_writable($path)) {
            // If captured content exists (user saved the file)
            if (isset($_POST['content'])) {
                // Update the file
                if (file_put_contents($path, $_POST['content']) === false) {
                    $errors[] = 'Could not write to file!';
                } else {
                    $contents = get_formatted_file_data($path);
                }
            } else {
                // Get the file contents and convert special characters
                $contents = htmlspecialchars(file_get_contents($path), ENT_QUOTES);
            }
        } else {
            $errors[] = 'File isn\'t writable!';
        }
    } else {
        $errors[] = 'File doesn\'t exist!';
    }
} else {
    $errors[] = 'Invalid Request!';
}
// Output JSON object
header('Content-Type: application/json; charset=utf-8');
exit(json_encode([ 
    'status' => $errors ? 'error' : 'success', 
    'data' => $errors ? $errors : $contents 
]));
?>