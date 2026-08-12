<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\AnalyticsCache;

$cache = AnalyticsCache::where('scope_type', 'program')->where('scope_id', 10)->orderBy('generated_at', 'desc')->first();
echo "Cache ID: " . $cache->id . "\n";
echo "KPIs in database:\n";
print_r($cache->kpis);
echo "\nJaccard Jaccard:\n";
print_r($cache->jaccard_similarity_results);
