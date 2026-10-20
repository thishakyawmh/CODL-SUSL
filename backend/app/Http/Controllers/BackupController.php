<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class BackupController extends Controller
{
     
    private function checkAuthorization(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'super_admin') {
            abort(response()->json(['message' => 'Unauthorized. Super Admin permissions required.'], 403));
        }
    }

    public function index(Request $request)
    {
        $this->checkAuthorization($request);

        $settings = SystemSetting::first();


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
        $this->checkAuthorization($request);

        $settings = SystemSetting::first();
        if (!$settings) {
            return response()->json(['message' => 'System settings not found.'], 404);
        }

        try {

            if (!Storage::disk('local')->exists('backups')) {
                Storage::disk('local')->makeDirectory('backups');
            }

            $driver = DB::connection()->getDriverName();
            $tables = [];

            if ($driver === 'sqlite') {
                $result = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                foreach ($result as $row) {
                    $tables[] = $row->name;
                }
            } else {
                $result = DB::select("SHOW TABLES");
                $dbName = config('database.connections.mysql.database');
                $keyName = 'Tables_in_' . $dbName;
                foreach ($result as $row) {
                    $tables[] = $row->$keyName;
                }
            }

            $filename = 'backup_' . now()->format('Y_m_d_His') . '.sql';
            $relativeFilePath = 'backups/' . $filename;
            $fullPath = Storage::disk('local')->path($relativeFilePath);


            $handle = fopen($fullPath, 'w');
            if (!$handle) {
                throw new \Exception("Unable to open backup file stream for writing.");
            }

            fwrite($handle, "-- CODL Database Backup\n");
            fwrite($handle, "-- Generated on " . now()->toDateTimeString() . "\n\n");

            if ($driver !== 'sqlite') {
                fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");
            }

            foreach ($tables as $table) {

                if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
                    continue;
                }


                if ($driver === 'sqlite') {
                    $createTableResult = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$table]);
                    $createTableSql = $createTableResult[0]->sql ?? '';
                } else {
                    $createTableResult = DB::select("SHOW CREATE TABLE `" . str_replace('`', '', $table) . "`");
                    $createTableSql = $createTableResult[0]->{'Create Table'} ?? '';
                }
                
                fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");
                fwrite($handle, $createTableSql . ";\n\n");


                DB::table($table)->orderBy(DB::raw('1'))->chunk(500, function ($rows) use ($handle, $table) {
                    foreach ($rows as $row) {
                        $rowArray = (array)$row;
                        $fields = array_keys($rowArray);
                        $escapedValues = array_map(function($value) {
                            if (is_null($value)) {
                                return 'NULL';
                            }
                            return DB::getPdo()->quote($value);
                        }, $rowArray);

                        $insertLine = "INSERT INTO `{$table}` (`" . implode("`, `", $fields) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
                        fwrite($handle, $insertLine);
                    }
                });
                fwrite($handle, "\n");
            }

            if ($driver !== 'sqlite') {
                fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
            }

            fclose($handle);


            $now = now();
            $nextBackup = now();
            if ($settings->backup_frequency === 'weekly') {
                $nextBackup = $now->addWeek();
            } elseif ($settings->backup_frequency === 'monthly') {
                $nextBackup = $now->addMonth();
            } else {
                $nextBackup = $now->addDay();
            }


            $settings->update([
                'last_backup_at' => $now,
                'last_backup_status' => 'successful',
                'next_backup_at' => $nextBackup,
            ]);


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

    public function download(Request $request, $filename)
    {
        $this->checkAuthorization($request);


        $filename = basename($filename);
        $path = 'backups/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            abort(404, 'Backup file not found.');
        }

        return Storage::disk('local')->download($path);
    }

    public function destroy(Request $request, $filename)
    {
        $this->checkAuthorization($request);

        $filename = basename($filename);
        $path = 'backups/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'Backup file not found.'], 404);
        }

        Storage::disk('local')->delete($path);

        return response()->json(['message' => 'Backup file deleted successfully.']);
    }
}
