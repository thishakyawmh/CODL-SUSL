<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;

$courses = Course::all();
foreach ($courses as $c) {
    echo "ID: {$c->id} | Code: {$c->course_code} | Title: {$c->title} | Level: {$c->level} | Dept: {$c->department}\n";
}
