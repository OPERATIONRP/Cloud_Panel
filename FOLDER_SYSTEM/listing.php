<?php
include 'main.php';
// Errors array
$errors = [];
// The initial dorectory local variable
$initial_directory = rtrim(str_replace('\\', '/', INITIAL_DIRECTORY), '/') . '/';
// Current directory variable - will update depending on the selected directory
$current_directory = '';
// Editable extensions array
$editable_extensions = explode(',', EDITABLE_EXTENSIONS);
// If the GET directory param is specified, verify the directory and make sure it's valid
if (isset($_GET['directory'], $_GET['token']) && verify_token($_GET['directory'], $_GET['token']) && is_dir($initial_directory . $_GET['directory'])) {
    // Update the current directory variable
    $current_directory = rtrim($_GET['directory'], '/') . '/';
    // Compare the path with the initial path and declare the parent directory array (...)
    if (realpath($initial_directory . $current_directory) != realpath(INITIAL_DIRECTORY)) {
        $parent_directory_path = dirname($current_directory);
        $parent_directory = [ 
            'back' => true, 
            'name' => $parent_directory_path != '.' ? $parent_directory_path : '', 
            'encodedname' => urlencode($parent_directory_path != '.' ? $parent_directory_path : ''),
            'token' => hash_hmac('sha256', $parent_directory_path != '.' ? $parent_directory_path : '', SECRET_KEY), 
            'basename' => '...' 
        ];
    }
}
// Sort by variable
$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : '';
// Sort order variable (ASC|DESC)
$sort_order = isset($_GET['sort_order']) ? $_GET['sort_order'] : 'DESC';
// If the initial directory exists
if (file_exists(INITIAL_DIRECTORY)) {
    // Get files and directories (including hidden files)
    $results = glob(str_replace(['[',']',"\f[","\f]"], ["\f[","\f]",'[[]','[]]'], $initial_directory . $current_directory) . '{,.}[!.,!..]*', GLOB_BRACE);
    // If success
    if ($results !== false) {
        // Sort results with directories being listed first but only if the setting is enabled
        if (DIRECTORY_FIRST) {
            usort($results, function($a, $b){
                $a_is_dir = is_dir($a);
                $b_is_dir = is_dir($b);
                if ($a_is_dir === $b_is_dir) {
                    return strnatcasecmp($a, $b);
                } else if ($a_is_dir && !$b_is_dir) {
                    return -1;
                } else if (!$a_is_dir && $b_is_dir) {
                    return 1;
                }
            });
        }
        // If the sorting params exist, sort the columns
        if (isset($_GET['sort_by'], $_GET['sort_order'])) {
            usort($results, function($a, $b) {
                if ($_GET['sort_by'] == 'name') {
                    return $_GET['sort_order'] == 'ASC' ? strcmp($a, $b) : strcmp($b, $a);
                } else if ($_GET['sort_by'] == 'size') {
                    return $_GET['sort_order'] == 'ASC' ? filesize($a) - filesize($b) : filesize($b) - filesize($a);
                } else if ($_GET['sort_by'] == 'modified') {
                    return $_GET['sort_order'] == 'ASC' ? filemtime($a) - filemtime($b) : filemtime($b) - filemtime($a);
                } else if ($_GET['sort_by'] == 'type') {
                    return $_GET['sort_order'] == 'ASC' ? strcmp(mime_content_type($a), mime_content_type($b)) : strcmp(mime_content_type($b), mime_content_type($a));
                } else if ($_GET['sort_by'] == 'perms') {
                    return $_GET['sort_order'] == 'ASC' ? substr(sprintf('%o', fileperms($a)), -4) - substr(sprintf('%o', fileperms($b)), -4) : substr(sprintf('%o', fileperms($b)), -4) - substr(sprintf('%o', fileperms($a)), -4);
                } else if ($_GET['sort_by'] == 'owner') {
                    return $_GET['sort_order'] == 'ASC' ? strcmp(fileowner($a) . ':' . filegroup($a), fileowner($b) . ':' . filegroup($b)) : strcmp(fileowner($b) . ':' . filegroup($b), fileowner($a) . ':' . filegroup($a));
                }
            });
        }
        // Format results
        $results = array_map(function($item) {
            return get_formatted_file_data($item);
        }, $results);
        // Add the parent directory array (...)
        if (isset($parent_directory)) {
            array_unshift($results, $parent_directory);
        }
    } else {
        $errors[] = 'Unknown error with the glob() function!';
    }
} else {
    $errors[] = 'The directory path is invalid!';
}
// Output JSON object
header('Content-Type: application/json; charset=utf-8');
exit(json_encode([ 
    'status' => $errors ? 'error' : 'success', 
    'directory' => urlencode($current_directory),
    'directoryRaw' => $current_directory,
    'isIntialDirectory' => empty($current_directory) ? true : false,
    'token' => hash_hmac('sha256', $current_directory, SECRET_KEY),
    'data' => $errors ? $errors : $results
]));
?>