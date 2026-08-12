<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$exams = App\Models\Exam::all();
foreach ($exams as $exam) {
    echo "ID: {$exam->id}, Title: {$exam->title}, Course ID: {$exam->course_id}, Batch: {$exam->batch_name}\n";
}

