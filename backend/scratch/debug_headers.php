<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBG1UkL1l-2L-KOTZziYCiLv4oZf0c-gR_PXZl_d8MSIAr6Z8HH_doFN-I4dU40wkT06GaGuJ8KSVW/pub?gid=710071064&single=true&output=csv';
$response = Http::get($url);
$csvData = $response->body();
$lines = explode("\n", $csvData);
$headers = str_getcsv(array_shift($lines));
$cleanedHeaders = array_map(function($h) {
    return trim(preg_replace('/\s+/', ' ', $h));
}, $headers);

echo "CLEANED HEADERS FROM SHEET:\n";
foreach ($cleanedHeaders as $idx => $h) {
    echo "$idx: [$h]\n";
}

$studentHeaderMap = [
    'Timestamp' => 'survey_submitted_at',
    'Current Education Level' => 'education_level',
    'Province' => 'province',
    'Student District' => 'district',
    'Which academic field is your primary interest for university study?' => 'primary_field',
    'Which academic field is your Secondary interest for university study?' => 'secondary_field',
    'Which academic field is your Third interest for university study?' => 'third_field',
    'Specializations' => 'specializations',
    'Teaching Methods' => 'learning_preferences',
    'Theory vs Practical' => 'theory_practical_score',
    'Which university opportunities are most important to you?' => 'university_opportunities',
    'Which emerging fields do you think universities should introduce or expand?' => 'emerging_fields',
    'If you could introduce ONE new degree program or specialization, what would it be?' => 'new_program_suggestion',
];

echo "\nCOMPARING WITH MAP KEYS:\n";
foreach ($studentHeaderMap as $mapKey => $dbColumn) {
    $found = false;
    $mapKeyLower = strtolower(trim($mapKey));
    foreach ($cleanedHeaders as $idx => $header) {
        $headerLower = strtolower(trim($header));
        if ($headerLower === $mapKeyLower) {
            echo "MATCH: Map key [$mapKey] matches index $idx [$header]\n";
            $found = true;
            break;
        }
    }
    if (!$found) {
        echo "MISSING: Map key [$mapKey] (for $dbColumn) did NOT match any header!\n";
    }
}
