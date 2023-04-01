<?php
include 'main.php';
// Get the captured data
$data = file_get_contents('php://input');
// Errors array
$errors = [];
// Ensure captured data exists
if ($data) {
    // Convert JSON string to assoc array
    $json = json_decode($data, true);
    if ($json) {
        // Iterate the JSON files array
        foreach($json as $item) {
            // Verify file
            if (isset($item['file'], $item['token']) && verify_token($item['file'], $item['token'])) {
                // Determine the correct path
                $path = rtrim(determine_full_path($item['file']), '/');
                // If the path is a directory
                if (is_dir($path)) {
                    // Remove directory
                    if (!@rmdir($path)) {
                        $errors[] = 'Unable to delete ' . $item['file'] . '! Please make sure the directory is empty and/or you have the correct permissions!';
                    }
                } else {
                    // Path is file, remove the file
                    if (!@unlink($path)) {
                        $errors[] = 'Unable to delete ' . $item['file'] . '! Please make sure you have the correct permissions!';
                    }
                }
            }
        }    
    } else {
        $errors[] = 'Invalid Request!';
    }
} else {
    $errors[] = 'Invalid Request!';
}
// Output JSON object
header('Content-Type: application/json; charset=utf-8');
exit(json_encode([ 
    'status' => $errors ? 'error' : 'success', 
    'data' => $errors ? $errors : '' 
]));
?>