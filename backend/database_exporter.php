<?php

// Bootstrap Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Connecting to Azure database and fetching tables...\n";
    
    // Get all tables from default connection
    $tables = DB::connection('mysql')->select('SHOW TABLES');
    $dbName = env('DB_DATABASE', 'codl_susl');
    $tableKey = "Tables_in_{$dbName}";
    
    $backupData = [];
    
    foreach ($tables as $table) {
        if (!isset($table->$tableKey)) {
            continue;
        }
        $tableName = $table->$tableKey;
        
        // Skip migrations table to prevent conflicts
        if ($tableName === 'migrations') {
            continue;
        }
        
        echo "Exporting table: {$tableName}...\n";
        $rows = DB::connection('mysql')->table($tableName)->get()->toArray();
        
        // Convert StdClass objects to associative arrays
        $backupData[$tableName] = array_map(function($row) {
            return (array) $row;
        }, $rows);
    }
    
    // Also try backup analytics connection if it has tables
    try {
        $analyticsTables = DB::connection('analytics')->select('SHOW TABLES');
        $analyticsDbName = env('DB_ANALYTICS_DATABASE', 'codl_susl');
        $analyticsTableKey = "Tables_in_{$analyticsDbName}";
        
        foreach ($analyticsTables as $table) {
            if (!isset($table->$analyticsTableKey)) {
                continue;
            }
            $tableName = $table->$analyticsTableKey;
            
            // Skip migrations
            if ($tableName === 'migrations') {
                continue;
            }
            
            // Prefix to distinguish tables if they overlap
            $keyName = "analytics_{$tableName}";
            echo "Exporting analytics table: {$tableName}...\n";
            $rows = DB::connection('analytics')->table($tableName)->get()->toArray();
            $backupData[$keyName] = array_map(function($row) {
                return (array) $row;
            }, $rows);
        }
    } catch (\Exception $e) {
        echo "Note: Skipping separate analytics connection tables (using default tables only).\n";
    }
    
    file_put_contents('database_backup.json', json_encode($backupData, JSON_PRETTY_PRINT));
    echo "SUCCESS! The entire database has been successfully backed up to 'database_backup.json' in your backend directory.\n";
    
} catch (\Exception $e) {
    echo "ERROR: Failed to run backup: " . $e->getMessage() . "\n";
}
