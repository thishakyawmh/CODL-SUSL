<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\AnalyticsCache;
use App\Models\Course;

foreach ([10, 11] as $id) {
    $course = Course::find($id);
    if (!$course) continue;
    $cache = AnalyticsCache::where('scope_type', 'program')->where('scope_id', $id)->first();
    if (!$cache) {
        echo "No cache found for course ID {$id} ({$course->title})!\n";
        continue;
    }
    
    echo "========================================================\n";
    echo "COURSE: {$course->title} (ID: {$id})\n";
    echo "========================================================\n";
    
    $reqs = $cache->academic_entry_requirements;
    if (!$reqs) {
        echo "academic_entry_requirements is NULL or empty!\n";
        continue;
    }
    
    echo "Accepted Industry Count: " . ($reqs['accepted_industry_count'] ?? 'N/A') . "\n";
    echo "Education Requirement Count: " . ($reqs['education_requirement_count'] ?? 'N/A') . "\n";
    echo "Result Requirement Count: " . ($reqs['result_requirement_count'] ?? 'N/A') . "\n";
    
    echo "\nEDUCATION DISTRIBUTION:\n";
    foreach ($reqs['education_distribution'] ?? [] as $edu) {
        echo "  - {$edu['label']}: Count: {$edu['count']}, Pct: {$edu['percentage']}%\n";
    }
    
    echo "\nRESULT DISTRIBUTION:\n";
    foreach ($reqs['result_distribution'] ?? [] as $res) {
        echo "  - {$res['label']}: Count: {$res['count']}, Pct: {$res['percentage']}%\n";
    }
    
    echo "\nSUMMARY:\n";
    echo "  " . ($reqs['summary'] ?? 'N/A') . "\n";
    
    echo "\n\n";
}
