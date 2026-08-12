<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(\App\AI\Controllers\AIAnalyticsController::class);
$nlpService = app(\App\AI\Services\AnalyticsNLPService::class);
$response = $controller->getGlobalOverview($nlpService);
echo $response->getContent() . "\n";
