<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;

foreach (Course::all() as $course) {
    $course->loadMissing('semesters.subjects');
    $subjectCount = 0;
    foreach ($course->semesters as $sem) {
        $subjectCount += $sem->subjects->count();
    }
    echo "Course ID {$course->id}: '{$course->title}' | Subjects Count: {$subjectCount}\n";
}
