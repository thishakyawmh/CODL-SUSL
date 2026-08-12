<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Services\AnalyticsNLPService;
use App\AI\Services\RecommendationEngineService;
use App\Jobs\ProcessAnalyticsPipelineJob;
use App\AI\Models\AnalyticsCache;

echo "Truncating analytics cache for clean regeneration...\n";
AnalyticsCache::truncate();

echo "Running ProcessAnalyticsPipelineJob synchronously...\n";
$job = new ProcessAnalyticsPipelineJob();
$job->handle(new AnalyticsNLPService(), new RecommendationEngineService());
echo "Regeneration completed successfully!\n";
