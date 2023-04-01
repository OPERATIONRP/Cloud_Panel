<?php
include 'main.php';
// Capture input data
$data = file_get_contents('php://input');
// Errors array
$errors = [];
// Make sure the data and GET parameters exist
if ($data && isset($_GET['permission'], $_GET['recursive'])) {
    // Convert JSON string to assoc array
    $json = json_decode($data, true);
    if ($json) {
        // Permission variable (e.g. 0755)
        $perm = intval($_GET['permission'], 8);
        // Recursive variable (0|1)
        $recursive = intval($_GET['recursive']);
        // Iterate the files and directories
        foreach($json as $item) {
            // Make sure the token is valid
            if (isset($item['file'], $item['token']) && verify_token($item['file'], $item['token'])) {
                // Determine the correct path
                $path = rtrim(determine_full_path($item['file']), '/');
                // If the recursive option is selected (1)
                if ($recursive) {
                    // Execute the recursive_chmod function with the declared variables and update the file/directory permissions
                    if (!recursive_chmod($path, $perm)) {
                        $errors[] = 'Unable to change permission for ' . $item['file'] . '!';
                    }
                } else {
                    // Update the file/directory permissions
                    if (!chmod($path, $perm)) {
                        $errors[] = 'Unable to change permission for ' . $item['file'] . '!';
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