<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\AnalyticsCache;

$cache = AnalyticsCache::where('scope_type', 'program')->where('scope_id', 10)->orderBy('generated_at', 'desc')->first();
$kpis = $cache->kpis;
foreach ($kpis as $k => $v) {
    if (!is_array($v)) {
        echo "$k: $v\n";
    } else {
        echo "$k: [array with " . count($v) . " items]\n";
    }
}
