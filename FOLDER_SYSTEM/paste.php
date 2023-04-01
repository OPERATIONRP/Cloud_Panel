<?php
include 'main.php';
// Get captured data
$data = file_get_contents('php://input');
// Errors array
$errors = [];
// Files array
$files = [];
// Make sure the data exists and verify the token...
if ($data && isset($_GET['directory'], $_GET['token'], $_GET['method']) && verify_token($_GET['directory'], $_GET['token'])) {
    // Convert JSON string to assoc array
    $json = json_decode($data, true);
    if ($json) {
        // Determine the correct path
        $path = rtrim(determine_full_path($_GET['directory']), '/');
        // Iterate the files and directories
        foreach($json as $item) {
            // Make sure the token is valid
            if (isset($item['file'], $item['token']) && verify_token($item['file'], $item['token'])) {
                // Copy file(s)
                if ($_GET['method'] == 'copy' && !is_dir($path . '/' . $item['file'])) {
                    // File extension
                    $ext = pathinfo($item['file'], PATHINFO_EXTENSION);
                    // Determine the new file name
                    $filename = basename($item['file'], '.' . $ext);
                    $newfile = $path . '/' . $filename . '.' . $ext;
                    $n = 0;
                    // If the file exists, increment the variable above and add it to the file name
                    while (file_exists($newfile)) {
                        $n++;
                        $newfile = $path . '/' . $filename .  ' (' . $n . ').' . $ext;
                    }
                    // Copy the file to the new location
                    if (!copy(str_replace('\\', '/', INITIAL_DIRECTORY) . '/' . $item['file'], $newfile)) {
                        $errors[] = 'Failed to copy ' . $item['file'];
                    } else {
                        // Success! Add the formatted file object to the files array
                        $files[] = get_formatted_file_data($newfile);
                    }
                }
                // Cut file/directory
                if ($_GET['method'] == 'cut') {
                    // If the path is a file
                    if (!is_dir($path . '/' . $item['file'])) {
                        // Determine the new file name
                        $ext = pathinfo($item['file'], PATHINFO_EXTENSION);
                        $filename = basename($item['file'], '.' . $ext);
                        $newfile = $path . '/' . $filename . '.' . $ext;
                    } else {
                        // Determine the new directory name
                        $filename = basename($item['file']);
                        $newfile = $path . '/' . $filename;
                    }
                    $n = 0;
                    // Increment the above variable if the new file/directory already exists
                    while (file_exists($newfile)) {
                        $n++;
                        $newfile = $path . '/' . $filename .  ' (' . $n . ')' . (!is_dir($item['file']) ? '.' . $ext : '');
                    }
                    // Rename the file/directory 
                    if (!rename(str_replace('\\', '/', INITIAL_DIRECTORY) . '/' . $item['file'], $newfile)) {
                        $errors[] = 'Failed to move ' . $item['file'];
                    } else {
                        // Success! Add the formatted file object to the files array
                        $files[] = get_formatted_file_data($newfile);
                    }
                }
            }
        }
    } else {
        $errors[] = 'Invalid JSON Request!';
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