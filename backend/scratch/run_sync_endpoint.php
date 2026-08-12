<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\AI\Controllers\AIAnalyticsController;
use App\AI\Services\AnalyticsNLPService;
use App\AI\Services\RecommendationEngineService;

$controller = app(AIAnalyticsController::class);
$nlpService = app(AnalyticsNLPService::class);
$recEngine = app(RecommendationEngineService::class);

$request = new Request(); // no params means dual sync with configured .env URLs

echo "Starting sync + pipeline run synchronously (this will take 45-60 seconds)...\n";
$start = microtime(true);
$response = $controller->syncGoogleSheet($request, $nlpService, $recEngine);
$elapsed = microtime(true) - $start;

echo "Sync completed in " . round($elapsed, 2) . " seconds!\n";
echo "Response:\n";
echo $response->getContent() . "\n";
