<?php
// Remove the time limit - uploading files may take a while depening on the file size
set_time_limit(0);
include 'main.php';
// Errors variable
$errors = [];
// Formatted files array
$files = [];
// Make sure files have been uploaded and the token is valid
if (isset($_FILES['files'], $_GET['directory'], $_GET['token']) && !empty($_FILES['files']) && verify_token($_GET['directory'], $_GET['token'])) {
    // Iterate all the uploaded files
    for ($i = 0; $i < count($_FILES['files']['tmp_name']); $i++) {
        // Determine the correct path
        $path = rtrim(determine_full_path($_GET['directory']), '/');
        // File extension
        $ext = pathinfo($_FILES['files']['name'][$i], PATHINFO_EXTENSION);
        // New file name
        $filename = basename($_FILES['files']['name'][$i], '.' . $ext);
        $file = $path . '/' . $filename . '.' . $ext;
        $n = 0;
        // If the file name already exists, increment the above variable and add it to the name
        while (file_exists($file)) {
            $n++;
            $file = $path . '/' . $filename .  ' (' . $n . ').' . $ext;
        }
        // Move the uploaded file to the new location
        if (move_uploaded_file($_FILES['files']['tmp_name'][$i], $file)) {
            // Format the new file and add to the files array
            $files[] = get_formatted_file_data($file);
        } else {
            $errors[] = 'Could not upload file ' . $file . '!';
        }
    }
} else {
    $errors[] = 'Invalid Request!';
}
// Output JSON object
header('Content-Type: application/json; charset=utf-8');
exit(json_encode([ 
    'status' => $errors ? 'error' : 'success', 
    'data' => $errors ? $errors : $files 
]));
?>