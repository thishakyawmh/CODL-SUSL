<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;

foreach ([10, 11, 17, 18] as $id) {
    $course = Course::find($id);
    $course->loadMissing('semesters.subjects', 'category');
    
    $curriculumSubjects = [];
    foreach ($course->semesters as $semester) {
        foreach ($semester->subjects as $subject) {
            $curriculumSubjects[] = [
                'name' => $subject->name,
                'code' => $subject->code
            ];
        }
    }
    
    $profileTextParts = [
        $course->title,
        $course->code,
        $course->level,
        $course->department,
    ];
    if ($course->category) {
        $profileTextParts[] = $course->category->name;
    }
    foreach ($curriculumSubjects as $subject) {
        $profileTextParts[] = $subject['name'];
        $profileTextParts[] = $subject['code'];
    }
    $programProfileText = strtolower(implode(' ', array_filter($profileTextParts)));

    $relatedSectors = [];
    foreach (config('analytics.sectors', []) as $sector => $keywords) {
        foreach ($keywords as $kw) {
            if (preg_match('/\b' . preg_quote(strtolower($kw), '/') . '\b/i', $programProfileText)) {
                $relatedSectors[] = $sector;
                break;
            }
        }
    }

    $relatedInterests = [];
    foreach (config('analytics.academic_interests', []) as $interest => $keywords) {
        foreach ($keywords as $kw) {
            if (preg_match('/\b' . preg_quote(strtolower($kw), '/') . '\b/i', $programProfileText)) {
                $relatedInterests[] = $interest;
                break;
            }
        }
    }

    echo "========================================================\n";
    echo "COURSE: {$course->title} (ID: {$id})\n";
    echo "Sectors Matched: " . implode(', ', $relatedSectors) . "\n";
    echo "Interests Matched: " . implode(', ', $relatedInterests) . "\n";
}
