<?php

// Bootstrap Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    if (!file_exists('database_backup.json')) {
        die("ERROR: 'database_backup.json' not found. Please run database_exporter.php first.\n");
    }
    
    echo "Reading database_backup.json...\n";
    $backupData = json_decode(file_get_contents('database_backup.json'), true);
    
    // Disable foreign key checks for clean load
    Schema::disableForeignKeyConstraints();
    
    foreach ($backupData as $tableName => $rows) {
        $connectionName = 'mysql';
        $actualTableName = $tableName;
        
        // Check if this was an analytics prefixed table
        if (str_starts_with($tableName, 'analytics_')) {
            $connectionName = 'analytics';
            $actualTableName = substr($tableName, strlen('analytics_'));
        }
        
        if (!Schema::connection($connectionName)->hasTable($actualTableName)) {
            echo "Warning: Table '{$actualTableName}' does not exist on connection '{$connectionName}'. Skipping.\n";
            continue;
        }
        
        echo "Importing table: {$actualTableName} on connection: {$connectionName}...\n";
        
        // Truncate table first to prevent duplicate keys
        DB::connection($connectionName)->table($actualTableName)->truncate();
        
        if (count($rows) > 0) {
            // Insert in chunks of 100 to prevent SQL length issues
            $chunks = array_chunk($rows, 100);
            foreach ($chunks as $chunk) {
                DB::connection($connectionName)->table($actualTableName)->insert($chunk);
            }
        }
    }
    
    Schema::enableForeignKeyConstraints();
    echo "SUCCESS! All data imported successfully into your active database.\n";
    
} catch (\Exception $e) {
    Schema::enableForeignKeyConstraints();
    echo "ERROR: Failed to run import: " . $e->getMessage() . "\n";
}
