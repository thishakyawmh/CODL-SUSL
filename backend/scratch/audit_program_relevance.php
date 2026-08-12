<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;
use App\AI\Services\AnalyticsNLPService;

$options = getopt("", ["course:"]);
$courseId = $options['course'] ?? null;

if (!$courseId) {
    echo "Usage: php scratch/audit_program_relevance.php --course=ID\n";
    exit(1);
}

$course = Course::find($courseId);
if (!$course) {
    echo "Error: Course ID {$courseId} not found!\n";
    exit(1);
}

$nlpService = app(AnalyticsNLPService::class);
$analytics  = $nlpService->processAll($course);

$explain         = $analytics['explainability'] ?? [];
$studentSurveys  = $explain['student_surveys']  ?? [];
$industrySurveys = $explain['industry_surveys'] ?? [];
$domainMatrix    = $explain['domain_matrix']    ?? [];

usort($domainMatrix, function ($a, $b) {
    $order = ['CORE' => 1, 'ADJACENT' => 2, 'EMERGING' => 3, 'OUT-OF-SCOPE' => 4];
    $oa = $order[$a['relevance_level']] ?? 5;
    $ob = $order[$b['relevance_level']] ?? 5;
    if ($oa !== $ob) return $oa <=> $ob;
    return $b['combined_pct'] <=> $a['combined_pct'];
});

// Build curriculum subjects list
$course->loadMissing('semesters.subjects', 'category');
$curriculumSubjects = [];
foreach ($course->semesters as $semester) {
    foreach ($semester->subjects as $subject) {
        $curriculumSubjects[] = ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name, 'credits' => $subject->credits];
    }
}

// Expose private buildProgramProfile via reflection
$ref    = new ReflectionClass($nlpService);
$method = $ref->getMethod('buildProgramProfile');
$method->setAccessible(true);
$profile = $method->invoke($nlpService, $course, $curriculumSubjects);

echo "================================================================================\n";
echo "PROGRAM PROFILE: {$course->title} (ID: {$course->id})\n";
echo "================================================================================\n";
echo "Title:        {$course->title}\n";
echo "Department:   {$course->department}\n";
echo "Level:        {$course->academic_level}\n";
echo "Program Type: {$profile['program_type']}\n";

echo "\n--- DOMAIN BOUNDARIES ---\n";
echo "CORE:     " . implode(', ', $profile['core_domains']) . "\n";
echo "ADJACENT: " . implode(', ', $profile['adjacent_domains']) . "\n";
echo "EMERGING: " . implode(', ', $profile['emerging_domains']) . "\n";
echo "EXCLUDED: " . implode(', ', $profile['excluded_domains']) . "\n";

echo "\nRelated Sectors: " . implode(', ', $profile['related_sectors']) . "\n";
echo "\nCurriculum Subjects:\n";
foreach ($curriculumSubjects as $sub) {
    echo "  - [{$sub['code']}] {$sub['name']}\n";
}
if (empty($curriculumSubjects)) {
    echo "  (none)\n";
}

// INDUSTRY FILTER AUDIT
echo "\n================================================================================\n";
echo "INDUSTRY FILTER AUDIT (Total: " . count($industrySurveys) . " processed)\n";
echo "================================================================================\n";
$acceptedInd = array_filter($industrySurveys, fn ($s) => $s['accepted']);
$rejectedInd = array_filter($industrySurveys, fn ($s) => !$s['accepted']);

echo "ACCEPTED INDUSTRY RECORDS (" . count($acceptedInd) . "):\n";
foreach ($acceptedInd as $s) {
    echo "  Record #{$s['record_id']} | Company: {$s['company_name']} | Score: " . round($s['relevance_score'], 2) . "\n";
    echo "    Sector: {$s['sector']} | Discipline: {$s['discipline']}\n";
    echo "    Skills: " . substr($s['skills'], 0, 100) . "\n";
    echo "    Reason: {$s['reason']}\n\n";
}

echo "\nREJECTED INDUSTRY RECORDS (" . count($rejectedInd) . "):\n";
foreach ($rejectedInd as $s) {
    echo "  Record #{$s['record_id']} | Company: {$s['company_name']} | Score: " . round($s['relevance_score'], 2) . "\n";
    echo "    Sector: {$s['sector']} | Discipline: {$s['discipline']}\n";
    echo "    Skills: " . substr($s['skills'], 0, 100) . "\n";
    echo "    Rejection: {$s['reason']}\n\n";
}

// STUDENT FILTER AUDIT
echo "================================================================================\n";
echo "STUDENT FILTER AUDIT (Total: " . count($studentSurveys) . " processed)\n";
echo "================================================================================\n";
$acceptedStud = array_filter($studentSurveys, fn ($s) => $s['accepted']);
$rejectedStud = array_filter($studentSurveys, fn ($s) => !$s['accepted']);

echo "ACCEPTED STUDENT RECORDS (" . count($acceptedStud) . "):\n";
foreach ($acceptedStud as $s) {
    echo "  Record #{$s['record_id']} | Score: " . round($s['relevance_score'], 2) . " | Weight: {$s['weight']}\n";
    echo "    Primary: {$s['primary_interest']} | Sec: {$s['secondary_interest']} | Ter: {$s['ternary_interest']}\n";
    echo "    Reason: {$s['reason']}\n\n";
}

echo "\nREJECTED STUDENT RECORDS (" . count($rejectedStud) . "):\n";
foreach ($rejectedStud as $s) {
    echo "  Record #{$s['record_id']} | Score: " . round($s['relevance_score'], 2) . "\n";
    echo "    Primary: {$s['primary_interest']} | Sec: {$s['secondary_interest']} | Ter: {$s['ternary_interest']}\n";
    echo "    Rejection: {$s['reason']}\n\n";
}

// DOMAIN DECISIONS MATRIX
echo "================================================================================\n";
echo "DOMAIN DECISIONS MATRIX\n";
echo "================================================================================\n";
printf(
    "%-28s %-10s %-8s %-8s %-7s %-7s %-8s %-22s %-24s\n",
    "DOMAIN", "REL_LEVEL", "IND_QTY", "STUD_QTY", "IND_%", "STUD_%", "COMB_%", "CURR_COVERAGE", "DECISION"
);
echo str_repeat("-", 133) . "\n";
foreach ($domainMatrix as $row) {
    printf(
        "%-28s %-10s %-8d %-8d %-6d%% %-6d%% %-6d%% %-22s %-24s\n",
        substr($row['name'], 0, 28),
        $row['relevance_level'],
        $row['relevant_industry_responses'],
        $row['relevant_student_responses'],
        $row['industry_pct'],
        $row['student_pct'],
        $row['combined_pct'],
        substr($row['curriculum_coverage_status'], 0, 22),
        substr($row['classification'], 0, 24)
    );
}
echo "================================================================================\n";
echo "\nEVIDENCE SUMMARY:\n";
echo "  Relevant Student Responses:  " . ($analytics['kpis']['student_count'] ?? 0) . "\n";
echo "  Relevant Industry Responses: " . ($analytics['kpis']['industry_count'] ?? 0) . "\n";
echo "  Coverage %:                  " . ($analytics['coverage_percent'] ?? 'N/A') . "\n";
echo "  Confidence:                  " . ($analytics['kpis']['confidence'] ?? 'N/A') . "\n";
echo "  Gaps / Enhancements Found:   " . count($analytics['missing_subjects'] ?? []) . "\n";
foreach ($analytics['missing_subjects'] ?? [] as $ms) {
    echo "    -> [{$ms['classification']}] {$ms['name']} ({$ms['combined_pct']}% combined, {$ms['count']} responses)\n";
}
echo "================================================================================\n";
