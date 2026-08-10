<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BackupDataSeeder extends Seeder
{
    public function run(): void
    {
        $backupFilePath = base_path('database_backup.json');

        if (!file_exists($backupFilePath)) {
            echo "Warning: 'database_backup.json' not found. Skipping backup import.\n";
            return;
        }

        echo "Reading database_backup.json from project root...\n";
        $backupData = json_decode(file_get_contents($backupFilePath), true);

        // Disable foreign key constraints
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

            echo "Seeding/Importing table: {$actualTableName} on connection: {$connectionName}...\n";

            // Truncate first to prevent key duplicates
            DB::connection($connectionName)->table($actualTableName)->truncate();

            if (count($rows) > 0) {
                // Chunk size to prevent SQL packet limits
                $chunks = array_chunk($rows, 100);
                foreach ($chunks as $chunk) {
                    DB::connection($connectionName)->table($actualTableName)->insert($chunk);
                }
            }
        }

        Schema::enableForeignKeyConstraints();
        echo "Database backup import completed successfully!\n";
    }
}
