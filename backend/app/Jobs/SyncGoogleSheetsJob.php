<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\AI\Controllers\AIAnalyticsController;

class SyncGoogleSheetsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 1;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 600;

    protected $type;
    protected $sheetUrl;

    /**
     * Create a new job instance.
     */
    public function __construct($type = null, $sheetUrl = null)
    {
        $this->type = $type;
        $this->sheetUrl = $sheetUrl;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Try to obtain the lock for 10 minutes
        $lock = Cache::lock('ai_analytics_sync_lock', 600);
        
        if (!$lock->get()) {
            Log::warning('SyncGoogleSheetsJob: Sync job aborted because another sync is already running.');
            return;
        }

        try {
            Cache::put('ai_analytics_sync_status', [
                'status' => 'syncing',
                'message' => 'Initializing synchronization...',
                'error' => null,
                'started_at' => now()->toIso8601String(),
            ], 1200);

            $controller = app(AIAnalyticsController::class);

            if ($this->type === null) {
                // Sync both student and industry
                $studentUrl = config('services.google_sheets.student_url');
                $industryUrl = config('services.google_sheets.industry_url');

                if (!$studentUrl || !$industryUrl) {
                    throw new \Exception('Google Sheets URLs are not fully configured in config/services.php.');
                }

                Cache::put('ai_analytics_sync_status', [
                    'status' => 'syncing',
                    'message' => 'Downloading and parsing Student Survey sheet...',
                    'error' => null,
                    'started_at' => now()->toIso8601String(),
                ], 1200);

                $studentResult = $controller->executeSingleSync('student', $studentUrl);
                if (isset($studentResult['error'])) {
                    throw new \Exception('Student Sync Failed: ' . $studentResult['error']);
                }

                Cache::put('ai_analytics_sync_status', [
                    'status' => 'syncing',
                    'message' => 'Downloading and parsing Industry Survey sheet...',
                    'error' => null,
                    'started_at' => now()->toIso8601String(),
                ], 1200);

                $industryResult = $controller->executeSingleSync('industry', $industryUrl);
                if (isset($industryResult['error'])) {
                    throw new \Exception('Industry Sync Failed: ' . $industryResult['error']);
                }

                Cache::put('ai_analytics_sync_status', [
                    'status' => 'processing',
                    'message' => 'Running AI matching pipeline...',
                    'error' => null,
                    'started_at' => now()->toIso8601String(),
                ], 1200);

                // Run the NLP pipeline synchronously inside this background job
                $nlpService = app(\App\AI\Services\AnalyticsNLPService::class);
                $recommendationEngine = app(\App\AI\Services\RecommendationEngineService::class);
                $pipelineJob = new ProcessAnalyticsPipelineJob();
                $pipelineJob->handle($nlpService, $recommendationEngine);

                Cache::forget('ai_analytics_global_overview');
                Cache::forget('ai_analytics_geography_data');
                Cache::forget('ai_analytics_common_overview');
                Cache::put('ai_analytics_last_sync_time', now()->toIso8601String(), 86400);

                Cache::put('ai_analytics_sync_status', [
                    'status' => 'completed',
                    'message' => 'Sync completed successfully for both Student and Industry sheets.',
                    'student_imported' => $studentResult['imported'] ?? 0,
                    'student_ignored' => $studentResult['ignored'] ?? 0,
                    'industry_imported' => $industryResult['imported'] ?? 0,
                    'industry_ignored' => $industryResult['ignored'] ?? 0,
                    'completed_at' => now()->toIso8601String(),
                ], 86400);
            } else {
                // Sync single type
                Cache::put('ai_analytics_sync_status', [
                    'status' => 'syncing',
                    'message' => 'Downloading and parsing ' . ucfirst($this->type) . ' Survey sheet...',
                    'error' => null,
                    'started_at' => now()->toIso8601String(),
                ], 1200);

                $singleResult = $controller->executeSingleSync($this->type, $this->sheetUrl);
                if (isset($singleResult['error'])) {
                    throw new \Exception(ucfirst($this->type) . ' Sync Failed: ' . $singleResult['error']);
                }

                Cache::put('ai_analytics_sync_status', [
                    'status' => 'processing',
                    'message' => 'Running AI matching pipeline...',
                    'error' => null,
                    'started_at' => now()->toIso8601String(),
                ], 1200);

                $nlpService = app(\App\AI\Services\AnalyticsNLPService::class);
                $recommendationEngine = app(\App\AI\Services\RecommendationEngineService::class);
                $pipelineJob = new ProcessAnalyticsPipelineJob();
                $pipelineJob->handle($nlpService, $recommendationEngine);

                Cache::forget('ai_analytics_global_overview');
                Cache::forget('ai_analytics_geography_data');
                Cache::forget('ai_analytics_common_overview');
                Cache::put('ai_analytics_last_sync_time', now()->toIso8601String(), 86400);

                Cache::put('ai_analytics_sync_status', [
                    'status' => 'completed',
                    'message' => ucfirst($this->type) . ' Survey Imported Successfully',
                    'rows_imported' => $singleResult['imported'] ?? 0,
                    'rows_ignored' => $singleResult['ignored'] ?? 0,
                    'completed_at' => now()->toIso8601String(),
                ], 86400);
            }
        } catch (\Exception $e) {
            Log::error('SyncGoogleSheetsJob failed: ' . $e->getMessage());
            Cache::put('ai_analytics_sync_status', [
                'status' => 'failed',
                'message' => 'Synchronization failed.',
                'error' => $e->getMessage(),
                'failed_at' => now()->toIso8601String(),
            ], 86400);
        } finally {
            $lock->release();
        }
    }
}
