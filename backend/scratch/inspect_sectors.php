<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\IndustryRequirement;
use App\Models\Course;

echo "=== COURSES ===\n";
foreach (Course::all() as $c) {
    echo "ID: {$c->id} | Title: {$c->title} | Dept: {$c->department} | Level: {$c->level}\n";
}

echo "=== INDUSTRY SECTORS ===\n";
foreach (IndustryRequirement::select('industry_sector')->distinct()->pluck('industry_sector') as $s) {
    echo "- {$s}\n";
}

echo "=== ACADEMIC FIELDS ===\n";
foreach (IndustryRequirement::select('primary_academic_field')->distinct()->pluck('primary_academic_field') as $f) {
    echo "- {$f}\n";
}
