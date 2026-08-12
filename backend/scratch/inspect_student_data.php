<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$rows = DB::connection('analytics')->table('student_interests')
    ->select('province', 'district', 'education_level', 'primary_interest', 'secondary_interest', 'ternary_interest', 'primary_skills', 'secondary_skills', 'ternary_skills')
    ->limit(5)
    ->get();

foreach ($rows as $r) {
    echo "Province: [{$r->province}] | District: [{$r->district}] | Education: [{$r->education_level}]\n";
    echo "  Primary: [{$r->primary_interest}] -> Skills: [{$r->primary_skills}]\n";
    echo "  Secondary: [{$r->secondary_interest}] -> Skills: [{$r->secondary_skills}]\n";
    echo "  Ternary: [{$r->ternary_interest}] -> Skills: [{$r->ternary_skills}]\n\n";
}

// Get all distinct provinces and education levels
echo "\nDistinct Provinces:\n";
$provinces = DB::connection('analytics')->table('student_interests')->select('province')->distinct()->pluck('province');
foreach ($provinces as $p) echo "  [{$p}]\n";

echo "\nDistinct Education Levels:\n";
$levels = DB::connection('analytics')->table('student_interests')->select('education_level')->distinct()->pluck('education_level');
foreach ($levels as $l) echo "  [{$l}]\n";
