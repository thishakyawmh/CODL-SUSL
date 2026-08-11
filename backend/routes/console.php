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
