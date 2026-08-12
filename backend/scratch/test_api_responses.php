<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(\App\AI\Controllers\AIAnalyticsController::class);

foreach ([10, 11, 13, 14, 15, 17] as $courseId) {
    $res = $controller->getOverview($courseId);
    $data = json_decode($res->getContent(), true);
    echo "Course ID: {$courseId} | Last Generated: " . ($data['last_generated'] ?? 'NONE') . " | Coverage: " . ($data['coverage_percent'] ?? 'NONE') . "%\n";
}
