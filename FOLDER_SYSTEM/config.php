<?php
// Prevents file manipulation - strong unique key is advised
define('SECRET_KEY', 'your secret key');
// If disabled, token verification will be skipped
define('VERIFY_TOKEN', TRUE);
/* The initial directory 
    Examples:
        Subdirectory: 
            __DIR__ . '/subdirectory'
        Parent directory: 
            __DIR__ . '/../'
        Custom: 
            'c:/XAMPP/htdocs/your_project'
        Linux:
            '/var/www/your_project'
*/
define('INITIAL_DIRECTORY', __DIR__);
// List directories first
define('DIRECTORY_FIRST', TRUE);
// Separated comma-list of file extensions that can be edited
define('EDITABLE_EXTENSIONS', '.php,.txt,.css,.scss,.py,.js,.ini,.html,.sql,.csv,.tpl,.htaccess,.readme,.json,.md');
// PHP global settings; If setting the below variables doesn't work, you'll need to edit the php.ini file directly and change the variables
// Increase the max upload file size
ini_set('post_max_size', '200M');
ini_set('upload_max_filesize', '200M');
?>