<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;
use App\AI\Services\AnalyticsNLPService;

$nlpService = app(AnalyticsNLPService::class);

$courseIds = [11, 26, 10, 13, 21, 27, 24, 23, 29];
$markdown = "# Diagnostic Relevance Audit Report\n\nGenerated on: 2026-08-12\n\n";

foreach ($courseIds as $id) {
    $course = Course::find($id);
    if (!$course) continue;
    
    $analytics = $nlpService->processAll($course);
    $explain = $analytics['explainability'] ?? [];
    $studentSurveys = $explain['student_surveys'] ?? [];
    $industrySurveys = $explain['industry_surveys'] ?? [];
    $domainMatrix = $explain['domain_matrix'] ?? [];

    usort($domainMatrix, function($a, $b) {
        $order = ['CORE' => 1, 'ADJACENT' => 2, 'EMERGING' => 3, 'OUT-OF-SCOPE' => 4];
        $oa = $order[$a['relevance_level']] ?? 5;
        $ob = $order[$b['relevance_level']] ?? 5;
        if ($oa !== $ob) {
            return $oa <=> $ob;
        }
        return $b['combined_pct'] <=> $a['combined_pct'];
    });

    $markdown .= "## Course: {$course->title} (ID: {$id})\n";
    $markdown .= "- **Faculty**: {$course->faculty}\n";
    $markdown .= "- **Department**: {$course->department}\n";
    $markdown .= "- **Confidence**: " . ($analytics['kpis']['confidence'] ?? 'N/A') . "\n";
    $markdown .= "- **Evidence-supported requirement coverage**: " . ($analytics['kpis']['alignment'] !== null ? $analytics['kpis']['alignment'] . "%" : "N/A") . "\n\n";

    $markdown .= "### Domain Decision Matrix\n\n";
    $markdown .= "| Domain | Relevance Level | Industry Qty | Student Qty | Combined Pct | Curriculum Coverage | Decision | Reason |\n";
    $markdown .= "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n";
    foreach ($domainMatrix as $row) {
        // Exclude out of scope rows with 0 combined to keep the table readable, but include core/adjacent/emerging
        if ($row['relevance_level'] === 'OUT-OF-SCOPE' && $row['combined_pct'] == 0 && $row['classification'] === 'IGNORE') {
            continue;
        }
        $markdown .= "| {$row['name']} | {$row['relevance_level']} | {$row['relevant_industry_responses']} | {$row['relevant_student_responses']} | {$row['combined_pct']}% | {$row['curriculum_coverage_status']} | {$row['classification']} | {$row['explanation']} |\n";
    }
    $markdown .= "\n---\n\n";
}

file_put_contents('C:\Users\hirun\.gemini\antigravity-ide\brain\9f30c389-2c54-4fc6-a7c1-1638b523b422\program_relevance_audit.md', $markdown);
echo "Successfully generated program_relevance_audit.md!\n";
