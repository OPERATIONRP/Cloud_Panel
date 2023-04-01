<?php
include 'main.php';
// Errors array
$errors = [];
// File object
$file = null;
// Ensure GET params exist and verify the file/directory
if (isset($_GET['directory'], $_GET['token'], $_GET['type'], $_POST['filename']) && verify_token($_GET['directory'], $_GET['token'])) {
    // Determine the correct path
    $path = rtrim(determine_full_path($_GET['directory']), '/');
    // Make sure the file/directory doesn't exist before we create it
    if (!file_exists($path . '/' . $_POST['filename'])) {
        // Make sure the file/directory name isn't empty
        if (!empty($_POST['filename'])) {
            // Make sure the name is valid - no special characters allowed
            if (preg_match('/^[\w\-. ]+$/', $_POST['filename'])) {
                // If type is directory
                if ($_GET['type'] == 'directory') {
                    // Create the directory
                    if (!mkdir($path . '/' . $_POST['filename'])) {
                        $errors[] = 'Failed to created directory!';
                    }
                } else {
                    // Create the file
                    if (file_put_contents($path . '/' . $_POST['filename'], '') === false) {
                        $errors[] = 'Failed to create file!';
                    }
                }
                // Retrieve the formatted file/directory data
                $file = get_formatted_file_data($path . '/' . $_POST['filename']);
            } else {
                $errors[] = 'Please enter a valid name!';
            }
        } else {
            $errors[] = 'Please enter the name!';
        }
    } else {
        $errors[] = 'File/directory already exists with that name!';
    }
} else {
    $errors[] = 'Invalid Request!';
}
// Output JSON object
header('Content-Type: application/json; charset=utf-8');
exit(json_encode([ 
    'status' => $errors ? 'error' : 'success', 
    'data' => $errors ? $errors : $file
]));
?>