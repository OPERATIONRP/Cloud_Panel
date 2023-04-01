<?php
include 'main.php';
// Errors array
$errors = [];
// Formatted file object
$file = null;
// Make sure the GET paramters exist and the token is valid
if (isset($_GET['file'], $_GET['token']) && verify_token($_GET['file'], $_GET['token'])) {
    // Determine the correct path
    $path = rtrim(determine_full_path($_GET['file']), '/');
    // If the path exists
    if (file_exists($path)) {
        // Make sure the captured input file/directory name exists and isn't empty
        if (isset($_POST['filename']) && !empty($_POST['filename'])) {
            // Make sure it's valid
            if (preg_match('/^[\w\-. ]+$/', $_POST['filename'])) {
                // Rename the file/directory
                $new_filename = rtrim(pathinfo($path, PATHINFO_DIRNAME), '/') . '/' . $_POST['filename'];
                if (!rename($path, $new_filename)) {
                    $errors[] = 'Failed to rename file!';
                } else {
                    $file = get_formatted_file_data($new_filename);
                }
            } else {
                $errors[] = 'Please enter a valid name!';
            }
        } else {
            $errors[] = 'Please enter the name!';
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
    'data' => $errors ? $errors : $file
]));
?>