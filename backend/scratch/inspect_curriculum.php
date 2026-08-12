<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;

$course = Course::with('semesters.subjects')->find(11);
echo "Course: {$course->title}\n";
foreach ($course->semesters as $sem) {
    echo "Semester: {$sem->name}\n";
    foreach ($sem->subjects as $sub) {
        echo "  - {$sub->code}: {$sub->name} ({$sub->credits} credits)\n";
    }
}
