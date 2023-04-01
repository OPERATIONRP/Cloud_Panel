<?php
// Remove the time limit, compressing files can take some time...
set_time_limit(0);
include 'main.php';
// Errors array
$errors = [];
// Get the captured data (POST)
$data = file_get_contents('php://input');
// File object
$file = null;
// Make sure the captured data exists and verify the directory
if ($data && isset($_GET['directory'], $_GET['token'], $_GET['type']) && verify_token($_GET['directory'], $_GET['token'])) {
    // Convert JSON string to assoc array
    $json = json_decode($data, true);
    // Check if the ZipArchive extension is enabled...
    if (!class_exists('ZipArchive')) {
        $errors[] = 'The Zip extension needs to be enabled to use this feature!';
    } else if ($json) {
        // Determine the correct path
        $path = rtrim(determine_full_path($_GET['directory']), '/');
        // Make sure the captured file name is valid
        if (!preg_match('/^[\w\-. ]+$/', $json['filename'])) {
            $errors[] = 'Please enter a valid file name!';
        } else if (!class_exists('ZipArchive')) {
            $errors[] = 'The Zip extension needs to be enabled to use this feature!';
        } else if ($_GET['type'] == 'zip') {
            // Zip option is selected, so create the Zip file
            $zip = new ZipArchive;
            // Attempt to create the Zip file or overwrite if one exists with the same name
            if ($zip->open($path . '/' . $json['filename'] . '.zip', ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
                // Iterate the files and directories
                foreach($json['items'] as $item) {
                    // Verify file/directory
                    if (isset($item['file'], $item['token']) && verify_token($item['file'], $item['token'])) {
                        // Determine the correct path
                        $file_path = rtrim(determine_full_path($item['file']), '/');
                        // If directory...
                        if (is_dir($file_path)) {
                            // Iterate the subdirectories 
                            $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($file_path), RecursiveIteratorIterator::LEAVES_ONLY);
                            foreach ($files as $name => $file) {
                                // Add the file/directory
                                $filePath = $file->getRealPath();
                                $relativePath = basename($file_path) . '/' . substr($filePath, strlen(realpath($file_path)) + 1);
                                if (!$file->isDir()) {
                                    $zip->addFile($filePath, $relativePath);
                                } else if ($relativePath !== false) {
                                    $zip->addEmptyDir($relativePath);
                                }
                            }
                        } else {
                            // Add file
                            $zip->addFile($file_path, basename($file_path));
                        }
                    }
                }    
                $zip->close();
                // Retrieve the formatted file data for the newly created Zip file
                $file = get_formatted_file_data($path . '/' . $json['filename'] . '.zip');
            } else {
                $errors[] = 'Failed to create ZIP file!';
            }  
        } else if (!class_exists('PharData')) {
            $errors[] = 'The Phar extension needs to be enabled to use this feature!';
        } else if ($_GET['type'] == 'tar' || $_GET['type'] == 'gz' || $_GET['type'] == 'bz2') {
            // Create new Phar file
            $phar = new PharData($path . '/' . $json['filename'] . '.tar');
            if ($phar) {
                // Iterate the files and directories
                foreach($json['items'] as $item) {
                    // Verify the file/directory
                    if (isset($item['file'], $item['token']) && verify_token($item['file'], $item['token'])) {
                        // Determine the correct path
                        $file_path = rtrim(determine_full_path($item['file']), '/');
                        // If directory...
                        if (is_dir($file_path)) {
                            // Iterate and add all subdirectories and files
                            $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($file_path), RecursiveIteratorIterator::LEAVES_ONLY);
                            foreach ($files as $name => $file) {
                                $filePath = $file->getRealPath();
                                $relativePath = basename($file_path) . '/' . substr($filePath, strlen(realpath($file_path)) + 1);
                                if (!$file->isDir()) {
                                    $phar->addFile($filePath, $relativePath);
                                } else if ($relativePath !== false) {
                                    $phar->addEmptyDir($relativePath);
                                }
                            }
                        } else {
                            // Add file
                            $phar->addFile($file_path, basename($item['file']));
                        }
                    }
                }    
                $compressed_ext = '';
                // If compression GZ is selected
                if ($_GET['type'] == 'gz') {
                    // Compress Phar file
                    $phar->compress(Phar::GZ);
                    $compressed_ext = '.gz';
                    // Remove the original file
                    unlink($path . '/' . $json['filename'] . '.tar');
                }
                // If compression bz2 is selected
                if ($_GET['type'] == 'bz2') {
                    // Compress Phar file
                    $phar->compress(Phar::BZ2);
                    $compressed_ext = '.bz2';
                    // Remove the original file
                    unlink($path . '/' . $json['filename'] . '.tar');
                }
                // Retrieve the file data               
                $file = get_formatted_file_data($path . '/' . $json['filename'] . '.tar' . $compressed_ext);
            } else {
                $errors[] = 'Failed to create Tar file!';
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
    'data' => $errors ? $errors : $file 
]));
?>