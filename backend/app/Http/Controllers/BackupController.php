<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    public function index()
    {
        $settings = SystemSetting::first();

        // Seed default settings if none exist
        if (!$settings) {
            $settings = SystemSetting::create([
                'institution_name' => 'Centre for Open & Distance Learning',
                'university_name' => 'Sabaragamuwa University of Sri Lanka',
                'contact_email' => 'info@codl.sab.ac.lk',
                'contact_phone' => '045-2280179',
                'address' => 'Sabaragamuwa University of Sri Lanka, P.O. Box 02, Belihuloya, 70140, Sri Lanka.',
                'logo' => '/images/logo.png',
                'website_url' => 'https://www.sab.ac.lk/codl',
                'academic_year' => '2025/2026',
                'session_timeout' => 30,
                'min_password_length' => 8,
                'maintenance_mode' => false,
                'maintenance_message' => 'The system is currently undergoing scheduled maintenance. Please check back later.',
                'backup_frequency' => 'daily',
                'backup_retention' => 30,
            ]);
        }

        $files = [];
        if (Storage::disk('local')->exists('backups')) {
            $allFiles = Storage::disk('local')->files('backups');
            foreach ($allFiles as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'sql') {
                    $files[] = [
                        'name' => basename($file),
                        'size' => Storage::disk('local')->size($file),
                        'created_at' => date('Y-m-d H:i:s', Storage::disk('local')->lastModified($file)),
                    ];
                }
            }
        }

        // Sort files by creation date descending
        usort($files, function($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return response()->json([
            'settings' => $settings,
            'files' => $files,
        ]);
    }

    public function run(Request $request)
    {
        $settings = SystemSetting::first();
        if (!$settings) {
            return response()->json(['message' => 'System settings not found.'], 404);
        }

        try {
            // Ensure backups directory exists
            if (!Storage::disk('local')->exists('backups')) {
                Storage::disk('local')->makeDirectory('backups');
            }

            // Perform backup
            $driver = \DB::connection()->getDriverName();
            $tables = [];

            if ($driver === 'sqlite') {
                $result = \DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                foreach ($result as $row) {
                    $tables[] = $row->name;
                }
            } else {
                $result = \DB::select("SHOW TABLES");
                $dbName = config('database.connections.mysql.database');
                $keyName = 'Tables_in_' . $dbName;
                foreach ($result as $row) {
                    $tables[] = $row->$keyName;
                }
            }

            $sqlContent = "-- CODL Database Backup\n";
            $sqlContent .= "-- Generated on " . now()->toDateTimeString() . "\n\n";

            if ($driver !== 'sqlite') {
                $sqlContent .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
            }

            foreach ($tables as $table) {
                // Get Table Schema
                if ($driver === 'sqlite') {
                    $createTableResult = \DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name='{$table}'");
                    $createTableSql = $createTableResult[0]->sql;
                } else {
                    $createTableResult = \DB::select("SHOW CREATE TABLE `{$table}`");
                    $createTableSql = $createTableResult[0]->{'Create Table'};
                }
                
                $sqlContent .= "DROP TABLE IF EXISTS `{$table}`;\n";
                $sqlContent .= $createTableSql . ";\n\n";

                // Get Table Data
                $rows = \DB::table($table)->get();
                foreach ($rows as $row) {
                    $rowArray = (array)$row;
                    $fields = array_keys($rowArray);
                    $escapedValues = array_map(function($value) {
                        if (is_null($value)) {
                            return 'NULL';
                        }
                        return \DB::getPdo()->quote($value);
                    }, $rowArray);

                    $sqlContent .= "INSERT INTO `{$table}` (`" . implode("`, `", $fields) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
                }
                $sqlContent .= "\n";
            }

            if ($driver !== 'sqlite') {
                $sqlContent .= "SET FOREIGN_KEY_CHECKS=1;\n";
            }

            $filename = 'backup_' . now()->format('Y_m_d_His') . '.sql';
            Storage::disk('local')->put('backups/' . $filename, $sqlContent);

            // Compute next backup time
            $now = now();
            $nextBackup = now();
            if ($settings->backup_frequency === 'weekly') {
                $nextBackup = $now->addWeek();
            } elseif ($settings->backup_frequency === 'monthly') {
                $nextBackup = $now->addMonth();
            } else {
                $nextBackup = $now->addDay();
            }

            // Update settings record
            $settings->update([
                'last_backup_at' => $now,
                'last_backup_status' => 'successful',
                'next_backup_at' => $nextBackup,
            ]);

            // Enforce retention period (delete files older than backup_retention days)
            $retentionDays = $settings->backup_retention ?: 30;
            $allFiles = Storage::disk('local')->files('backups');
            foreach ($allFiles as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'sql') {
                    $lastModified = Storage::disk('local')->lastModified($file);
                    if (time() - $lastModified > ($retentionDays * 86400)) {
                        Storage::disk('local')->delete($file);
                    }
                }
            }

            // Log administrative action
            $user = $request->user();
            if ($user) {
                \App\Models\ActivityLog::log($user->id, 'Ran database backup manually', 'Database Backup', 'system');
            }

            return response()->json([
                'message' => 'Database backup completed successfully.',
                'filename' => $filename,
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            \Log::error('Database backup failed: ' . $e->getMessage());
            
            $settings->update([
                'last_backup_status' => 'failed',
            ]);

            return response()->json([
                'message' => 'Database backup failed: ' . $e->getMessage(),
                'settings' => $settings,
            ], 500);
        }
    }

    public function download($filename)
    {
        // Prevent path traversal
        $filename = basename($filename);
        $path = 'backups/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            abort(404, 'Backup file not found.');
        }

        return Storage::disk('local')->download($path);
    }

    public function destroy($filename)
    {
        $filename = basename($filename);
        $path = 'backups/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'Backup file not found.'], 404);
        }

        Storage::disk('local')->delete($path);

        return response()->json(['message' => 'Backup file deleted successfully.']);
    }
}
