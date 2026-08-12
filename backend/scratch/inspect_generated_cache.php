<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\AnalyticsCache;
use App\Models\Course;

foreach ([10, 11, 17, 18] as $id) {
    $course = Course::find($id);
    $cache = AnalyticsCache::where('scope_type', 'program')->where('scope_id', $id)->first();
    if (!$cache) {
        echo "No cache found for course ID {$id} ({$course->title})!\n";
        continue;
    }
    
    echo "========================================================\n";
    echo "COURSE: {$course->title} (ID: {$id})\n";
    echo "========================================================\n";
    
    $kpis = $cache->kpis;
    echo "KPIS:\n";
    echo "  Student Count: " . ($kpis['student_count'] ?? 'N/A') . "\n";
    echo "  Industry Count: " . ($kpis['industry_count'] ?? 'N/A') . "\n";
    echo "  Evidence Status: " . ($kpis['evidence_status'] ?? 'N/A') . "\n";
    echo "  Confidence: " . ($kpis['confidence'] ?? 'N/A') . "\n";
    echo "  Avg Student Relevance: " . ($kpis['avg_student_relevance'] ?? 'N/A') . "\n";
    echo "  Avg Industry Relevance: " . ($kpis['avg_industry_relevance'] ?? 'N/A') . "\n";
    echo "  Curriculum Coverage: " . ($kpis['alignment'] ?? 'N/A') . "%\n";
    
    echo "\nMISSING CORE SUBJECTS:\n";
    foreach ($cache->kpis['missing_subjects'] ?? [] as $sub) {
        echo "  - {$sub['name']} | Combined: {$sub['combined_pct']}% | Ind: {$sub['industry_pct']}% | Stud: {$sub['student_pct']}%\n";
        echo "    Skills: " . implode(', ', $sub['skills']) . "\n";
    }
    
    echo "\nCURRICULUM ANOMALIES:\n";
    foreach ($cache->kpis['outdated_subjects'] ?? [] as $anomaly) {
        echo "  - [{$anomaly['anomaly_type']}] Subject: {$anomaly['affected_subject']}\n";
        echo "    Explanation: {$anomaly['explanation']}\n";
        echo "    Combined relevance: {$anomaly['combined_evidence']}%\n";
    }
    
    echo "\nPREFERRED LEARNING METHODS:\n";
    foreach ($cache->kpis['learning_preferences_data']['student_methods'] ?? [] as $method) {
        echo "  - {$method['name']} | Value: {$method['value']}% | Alignment: {$method['alignment_level']}\n";
        echo "    Evidence: {$method['industry_evidence']}\n";
    }
    
    echo "\n\n";
}
