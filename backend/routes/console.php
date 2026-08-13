<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Http\Request;
use App\AI\Services\AnalyticsNLPService;
use App\AI\Services\RecommendationEngineService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('analytics:sync {type?}', function () {
    $type = $this->argument('type');
    if ($type && !in_array($type, ['student', 'industry'])) {
        $this->error("Invalid type. Allowed values are 'student' or 'industry'.");
        return;
    }

    $types = $type ? [$type] : ['student', 'industry'];

    foreach ($types as $t) {
        $envKey = $t === 'student' ? 'GOOGLE_SHEET_STUDENT_URL' : 'GOOGLE_SHEET_INDUSTRY_URL';
        $url = env($envKey);

        if (!$url) {
            $this->warn("No sheet URL configured for {$t}. Please set {$envKey} in .env");
            continue;
        }

        $this->info("Syncing {$t} survey from Google Sheets: {$url}");

        try {
            // Resolve the controller from the Laravel container
            $controller = app(\App\AI\Controllers\AIAnalyticsController::class);
            
            // Build a request object matching what the controller expects
            $request = new Request([
                'type' => $t,
                'sheet_url' => $url
            ]);

            // Call the controller method directly
            $nlpService = app(AnalyticsNLPService::class);
            $recEngine = app(RecommendationEngineService::class);
            
            $response = $controller->syncGoogleSheet($request, $nlpService, $recEngine);
            $data = json_decode($response->getContent(), true);

            if ($response->getStatusCode() === 200) {
                $this->info("Sync successful: " . ($data['message'] ?? 'Done'));
                $this->line("Imported: " . ($data['rows_imported'] ?? 0) . ", Ignored: " . ($data['rows_ignored'] ?? 0) . ", Time: " . ($data['execution_time_sec'] ?? 0) . "s");
            } else {
                $this->error("Sync failed: " . ($data['error'] ?? 'Unknown error'));
            }
        } catch (\Exception $e) {
            $this->error("Error running sync for {$t}: " . $e->getMessage());
        }
    }
})->purpose('Synchronize student interest or industry requirement surveys from Google Sheets');

Artisan::command('db:backup', function () {
    $settings = \App\Models\SystemSetting::first();
    if (!$settings) {
        $this->error('System settings not found.');
        return;
    }

    $this->info('Starting automated database backup...');

    try {
        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists('backups')) {
            \Illuminate\Support\Facades\Storage::disk('local')->makeDirectory('backups');
        }

        $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
        $tables = [];

        if ($driver === 'sqlite') {
            $result = \Illuminate\Support\Facades\DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            foreach ($result as $row) {
                $tables[] = $row->name;
            }
        } else {
            $result = \Illuminate\Support\Facades\DB::select("SHOW TABLES");
            $dbName = config('database.connections.mysql.database');
            $keyName = 'Tables_in_' . $dbName;
            foreach ($result as $row) {
                $tables[] = $row->$keyName;
            }
        }

        $filename = 'backup_' . now()->format('Y_m_d_His') . '.sql';
        $relativeFilePath = 'backups/' . $filename;
        $fullPath = \Illuminate\Support\Facades\Storage::disk('local')->path($relativeFilePath);

        $handle = fopen($fullPath, 'w');
        if (!$handle) {
            throw new \Exception("Unable to open backup file stream.");
        }

        fwrite($handle, "-- CODL Scheduled Database Backup\n");
        fwrite($handle, "-- Generated on " . now()->toDateTimeString() . "\n\n");

        if ($driver !== 'sqlite') {
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");
        }

        foreach ($tables as $table) {
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
                continue;
            }

            if ($driver === 'sqlite') {
                $createTableResult = \Illuminate\Support\Facades\DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$table]);
                $createTableSql = $createTableResult[0]->sql ?? '';
            } else {
                $createTableResult = \Illuminate\Support\Facades\DB::select("SHOW CREATE TABLE `" . str_replace('`', '', $table) . "`");
                $createTableSql = $createTableResult[0]->{'Create Table'} ?? '';
            }
            
            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");
            fwrite($handle, $createTableSql . ";\n\n");

            \Illuminate\Support\Facades\DB::table($table)->orderBy(\Illuminate\Support\Facades\DB::raw('1'))->chunk(500, function ($rows) use ($handle, $table) {
                foreach ($rows as $row) {
                    $rowArray = (array)$row;
                    $fields = array_keys($rowArray);
                    $escapedValues = array_map(function($value) {
                        if (is_null($value)) {
                            return 'NULL';
                        }
                        return \Illuminate\Support\Facades\DB::getPdo()->quote($value);
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
        $allFiles = \Illuminate\Support\Facades\Storage::disk('local')->files('backups');
        foreach ($allFiles as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'sql') {
                $lastModified = \Illuminate\Support\Facades\Storage::disk('local')->lastModified($file);
                if (time() - $lastModified > ($retentionDays * 86400)) {
                    \Illuminate\Support\Facades\Storage::disk('local')->delete($file);
                }
            }
        }

        $this->info("Database backup completed successfully: {$filename}");
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Scheduled database backup failed: ' . $e->getMessage());
        $settings->update([
            'last_backup_status' => 'failed',
        ]);
        $this->error('Database backup failed: ' . $e->getMessage());
    }
})->purpose('Run automated database backup');

// Schedule checking for backup execution window
Schedule::call(function () {
    $settings = \App\Models\SystemSetting::first();
    if (!$settings) return;

    if ($settings->next_backup_at && now()->greaterThanOrEqualTo($settings->next_backup_at)) {
        \Illuminate\Support\Facades\Artisan::call('db:backup');
    }
})->everyFiveMinutes();

