<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(\App\AI\Controllers\AIAnalyticsController::class);
$response = $controller->getOverview(10);
$data = json_decode($response->getContent(), true);

$kpis = $data['kpis'];
echo "evidence_status: " . ($kpis['evidence_status'] ?? 'NULL') . "\n";
echo "surveys: " . ($kpis['surveys'] ?? 'NULL') . "\n";
echo "student_count: " . ($kpis['student_count'] ?? 'NULL') . "\n";
echo "industry_count: " . ($kpis['industry_count'] ?? 'NULL') . "\n";
