<?php
// Remove the script execution time limit 
set_time_limit(0);
include 'main.php';
// Errors array
$errors = [];
// Ensure GET params exist and file is valid
if (isset($_GET['file'], $_GET['token']) && verify_token($_GET['file'], $_GET['token'])) {
    // Determine the correct path
    $path = rtrim(determine_full_path($_GET['file']), '/');
    // Make sure archive file exists
    if (file_exists($path)) {
        // Determine the type
        $type = strtolower(pathinfo($_GET['file'], PATHINFO_EXTENSION));
        // If the file type is Zip
        if ($type == 'zip') {
            // Make sure ZipArchive extension is enabled
            if (!class_exists('ZipArchive')) {
                $errors[] = 'The Zip extension needs to be enabled to use this feature!';
            } else {
                // Extract archive file to the same directory
                $zip = new ZipArchive;
                if ($zip->open($path) === TRUE) {
                    if (!$zip->extractTo(pathinfo($path, PATHINFO_DIRNAME))) {
                        $errors[] = 'Falied to extract Zip file!';
                    }
                    $zip->close();
                } else {
                    $errors[] = 'Could not open Zip file!';
                }
            }
        } else if ($type == 'tar' || $type == 'phar' || $type == 'gz' || $type == 'bz2') {
            // File type is a Phar, make sure the PharData extension is enabled
            if (!class_exists('PharData')) {
                $errors[] = 'The Phar extension needs to be enabled to use this feature!';
            } else {
                // Open the Phar file 
                $phar = new PharData($path);
                if ($phar) {
                    if ($type == 'gz' || $type == 'bz2') {
                        // Phar file is compressed, so decompress it before extraction
                        $phar = $phar->decompress();
                        $phar = new PharData(str_replace(['.gz', '.bz2'], '', $path));
                    }
                    // Extract the Phar file
                    if (!$phar->extractTo(pathinfo($path, PATHINFO_DIRNAME), null, true)) {
                        $errors[] = 'Falied to extract Tar file!';
                    } else if ($type == 'gz' || $type == 'bz2') {
                        // Remove the decompressed file
                        unlink(str_replace(['.gz', '.bz2'], '', $path));
                    }
                } else {
                    $errors[] = 'Could not open Tar file!';
                }
            }
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
    'data' => $errors ? $errors : ''
]));
?>