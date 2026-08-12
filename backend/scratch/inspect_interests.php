<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\StudentInterest;

echo "=== DISTINCT STUDENT INTERESTS ===\n";
$primary = StudentInterest::select('primary_interest')->distinct()->pluck('primary_interest')->toArray();
$secondary = StudentInterest::select('secondary_interest')->distinct()->pluck('secondary_interest')->toArray();
$ternary = StudentInterest::select('ternary_interest')->distinct()->pluck('ternary_interest')->toArray();

$all = array_unique(array_merge($primary, $secondary, $ternary));
foreach ($all as $interest) {
    echo "- {$interest}\n";
}
