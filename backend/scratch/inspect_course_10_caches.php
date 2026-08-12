<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\AnalyticsCache;

$caches = AnalyticsCache::where('scope_type', 'program')
    ->where('scope_id', 10)
    ->orderBy('generated_at', 'desc')
    ->get();

echo "Total Cache Entries for Course 10: " . $caches->count() . "\n\n";

foreach ($caches as $cache) {
    echo "ID: {$cache->id} | Generated At: " . $cache->generated_at . "\n";
    $kpis = $cache->kpis;
    echo "  Student Count: " . ($kpis['student_count'] ?? 'N/A') . "\n";
    echo "  Industry Count: " . ($kpis['industry_count'] ?? 'N/A') . "\n";
    echo "  Evidence Status: " . ($kpis['evidence_status'] ?? 'N/A') . "\n";
    echo "  Confidence: " . ($kpis['confidence'] ?? 'N/A') . "\n";
    echo "  Curriculum Coverage: " . ($kpis['alignment'] ?? 'N/A') . "%\n";
    echo "--------------------------------------------------------\n";
}
