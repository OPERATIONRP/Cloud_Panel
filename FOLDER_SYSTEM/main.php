<?php
include 'config.php';
// Determine the file icon function
function get_filetype_icon($filetype, $type = null) {
    if (is_dir($filetype)) {
        return '<i class="fa-solid fa-folder"></i>';
    } else if (preg_match('/image\/*/', $type ? $type : mime_content_type($filetype))) {
        return '<i class="fa-solid fa-file-image"></i>';
    } else if (preg_match('/video\/*/', $type ? $type : mime_content_type($filetype))) {
        return '<i class="fa-solid fa-file-video"></i>';
    } else if (preg_match('/audio\/*/', $type ? $type : mime_content_type($filetype))) {
        return '<i class="fa-solid fa-file-audio"></i>';
    } else if (preg_match('/text\/*/', $type ? $type : mime_content_type($filetype))) {
        return '<i class="fa-solid fa-file-lines"></i>';
    } else if (preg_match('/application\/(zip|x-tar|gzip|x-bzip2)/', $type ? $type : mime_content_type($filetype))) {
        return '<i class="fa-solid fa-file-zipper"></i>';
    }
    return '<i class="fa-solid fa-file"></i>';
}
// Convert filesize to human-readable format function
function convert_filesize($bytes, $precision = 2) {
    $units = ['Bytes', 'KB', 'MB', 'GB', 'TB']; 
    $bytes = max($bytes, 0); 
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024)); 
    $pow = min($pow, count($units) - 1); 
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow]; 
}
// Change directory permissions recursively function
function recursive_chmod($path, $perms) {
    if (is_dir($path)) {
        $dir = new DirectoryIterator($path);
        foreach ($dir as $item) {
            if (!chmod($item->getPathname(), $perms)) {
                return false;
            }
            if ($item->isDir() && !$item->isDot()) {
                recursive_chmod($item->getPathname(), $perms);
            }
        }
    } else {
        if (!chmod($path, $perms)) {
            return false;
        }
    }
    return true;
}
// Format file function
function get_formatted_file_data($file) {
    if (file_exists($file)) {
        $editable_extensions = explode(',', EDITABLE_EXTENSIONS);
        $type = mime_content_type($file);
        $media = '';
        $media = preg_match('/image\/*/', $type) ? 'image' : $media;
        $media = preg_match('/audio\/*/', $type) ? 'audio' : $media;
        $media = preg_match('/video\/*/', $type) ? 'video' : $media;
        return [
            'name' => determine_relative_path($file),
            'encodedname' => urlencode(determine_relative_path($file)),
            'basename' => basename($file),
            'icon' => get_filetype_icon($file, $type),
            'size' => is_dir($file) ? 'Folder' : convert_filesize(filesize($file)),
            'modified' => str_replace(date('F j, Y'), 'Today,', date('F j, Y H:ia', filemtime($file))),
            'type' => $type,
            'perms' => substr(sprintf('%o', fileperms($file)), -4),
            'owner' => function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($file))['name'] . ':' . posix_getgrgid(filegroup($file))['name'] : fileowner($file) . ':' . filegroup($file),
            'editable' => in_array(strtolower(substr($file, strrpos($file, '.'))), $editable_extensions),
            'token' => hash_hmac('sha256', determine_relative_path($file), SECRET_KEY),
            'media' => $media
        ];
    }
    return false;
}
// Get all directories function - they will be populated in the aside element
function get_directories($intial_dir, $level = 0) {
    $intial_dir = str_replace('\\', '/', $intial_dir);
    $directories = [];
    foreach (scandir($intial_dir) as $file) {
        if ($file == '.' || $file == '..') continue;
        $dir = $intial_dir . '/' . $file;
        if (is_dir($dir)) {
            $directories[] = [
                'level' => $level,
                'name' => $file,
                'path' => urlencode(rtrim(determine_relative_path($dir), '/') . '/'),
                'token' => hash_hmac('sha256', rtrim(determine_relative_path($dir), '/') . '/', SECRET_KEY),
                'children' => get_directories($dir, $level+1)
            ];
        }
    }
    return $directories;
}
// Determine the relative path 
function determine_relative_path($path) {
    $intial_dir = str_replace('\\', '/', INITIAL_DIRECTORY);
    if (substr($path, 0, strlen($intial_dir)) == $intial_dir) {
        $path = ltrim(substr($path, strlen($intial_dir)), '/');
    } 
    return $path;
}
// Determine the full path function
function determine_full_path($path) {
    return rtrim(str_replace('\\', '/', INITIAL_DIRECTORY), '/') . '/' . determine_relative_path($path);
}
// Token verification function - will prevent the user from accessing files and directories they're not supposed to access
function verify_token($file, $token) {
    if (!VERIFY_TOKEN) return true;
    if (hash_hmac('sha256', $file, SECRET_KEY) == $token) {
        return true;
    }
    return false;
}
?>