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

            if ($actualTableName === 'student_interests' && count($rows) > 0) {
                $mappedRows = [];
                foreach ($rows as $row) {
                    $newRow = [];
                    // Keep unchanged columns
                    $unchanged = ['id', 'survey_submitted_at', 'email', 'education_level', 'province', 'district', 'university_opportunities', 'new_program_suggestion', 'created_at', 'updated_at'];
                    foreach ($unchanged as $col) {
                        if (array_key_exists($col, $row)) {
                            $newRow[$col] = $row[$col];
                        }
                    }

                    // Map legacy columns to new columns
                    if (array_key_exists('primary_field', $row)) {
                        $newRow['primary_interest'] = $row['primary_field'];
                    }
                    if (array_key_exists('secondary_field', $row)) {
                        $newRow['secondary_interest'] = $row['secondary_field'];
                    }
                    if (array_key_exists('third_field', $row)) {
                        $newRow['ternary_interest'] = $row['third_field'];
                    }
                    if (array_key_exists('specializations', $row)) {
                        $newRow['primary_skills'] = $row['specializations'];
                    }
                    if (array_key_exists('learning_preferences', $row)) {
                        $newRow['primary_learning_methods'] = $row['learning_preferences'];
                    }
                    if (array_key_exists('theory_practical_score', $row)) {
                        $score = $row['theory_practical_score'];
                        if (is_numeric($score)) {
                            if ($score > 5) {
                                $score = (int) round($score / 20);
                            }
                            $newRow['primary_learning_balance'] = max(1, min(5, $score));
                        } else {
                            $newRow['primary_learning_balance'] = null;
                        }
                    }
                    if (array_key_exists('whatsapp_no', $row)) {
                        $newRow['whatsapp'] = $row['whatsapp_no'];
                    }

                    $mappedRows[] = $newRow;
                }
                $rows = $mappedRows;
            }

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
