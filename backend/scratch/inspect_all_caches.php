<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\AnalyticsCache;
use App\Models\Course;

$caches = AnalyticsCache::where('scope_type', 'program')
    ->orderBy('generated_at', 'desc')
    ->get();

echo "Total Cache Entries: " . $caches->count() . "\n\n";

foreach ($caches as $cache) {
    $course = Course::find($cache->scope_id);
    $title = $course ? $course->title : 'Unknown Course';
    echo "ID: {$cache->id} | Course ID: {$cache->scope_id} ({$title}) | Generated At: " . $cache->generated_at . "\n";
    $kpis = $cache->kpis;
    echo "  Student Count: " . ($kpis['student_count'] ?? 'N/A') . "\n";
    echo "  Industry Count: " . ($kpis['industry_count'] ?? 'N/A') . "\n";
    echo "  Confidence: " . ($kpis['confidence'] ?? 'N/A') . "\n";
    echo "  Curriculum Coverage: " . ($kpis['alignment'] ?? 'N/A') . "%\n";
    echo "  Coverage Percent field in Cache: " . ($cache->kpis['coverage_percent'] ?? 'N/A') . "%\n";
    echo "--------------------------------------------------------\n";
}
