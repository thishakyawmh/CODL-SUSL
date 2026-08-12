<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(\App\AI\Controllers\AIAnalyticsController::class);
$response = $controller->getOverview(10);
$data = json_decode($response->getContent(), true);

echo "KPIs Keys: " . implode(', ', array_keys($data['kpis'])) . "\n";
echo "KPIs: \n";
print_r($data['kpis']);
