<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Controllers\AIAnalyticsController;
use Illuminate\Http\Request;

// Create the request
$request = Request::create('/admin/ai-analytics/sync-sheet', 'POST', [
    'type' => 'student',
    'url' => 'https://docs.google.com/spreadsheets/d/1BR4zpfaaYbdHCDLswafBBjiJ9csiwb72TsN9ks_TglI/export?format=csv'
]);

echo "Invoking controller...\n";
try {
    $nlpService = app(App\AI\Services\AnalyticsNLPService::class);
    $recEngine = app(App\AI\Services\RecommendationEngineService::class);
    
    $controller = new AIAnalyticsController();
    $response = $controller->syncGoogleSheet($request, $nlpService, $recEngine);
    
    echo "STATUS: " . $response->getStatusCode() . "\n";
    echo "CONTENT: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo "STACK: " . $e->getTraceAsString() . "\n";
}
