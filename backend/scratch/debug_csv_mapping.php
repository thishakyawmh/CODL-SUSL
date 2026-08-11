<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$url = 'https://docs.google.com/spreadsheets/d/14fyJdJ6L2IJd_1wb8Vf4KHdELiuFv0J2OOxitMwFhDo/export?format=csv&gid=785328217';
$response = Http::get($url);
$csvData = $response->body();

$tempStream = fopen('php://temp', 'r+');
fwrite($tempStream, $csvData);
rewind($tempStream);

$allRows = [];
while (($row = fgetcsv($tempStream, 0, ',', '"', '\\')) !== false) {
    if (empty($row) || (count($row) === 1 && $row[0] === null)) {
        continue;
    }
    $allRows[] = $row;
}
fclose($tempStream);

$headers = array_shift($allRows);
$headers = array_map(function($h) {
    return trim(preg_replace('/\s+/', ' ', $h));
}, $headers);

$industryHeaderMap = [
    'Timestamp' => 'survey_submitted_at',
    'Organization / Company Name' => 'company_name',
    'Industry Sector' => 'industry_sector',
    'Organization Size' => 'organization_size',
    'Primary academic field recruited' => 'primary_academic_field',
    'Primary Academic Domain of Interest' => 'primary_academic_field',
    'Secondary academic field recruited' => 'secondary_academic_field',
    'Sub disciplines' => 'secondary_academic_field',
    'Third academic field recruited' => 'third_academic_field',
    'Soft skills needed' => 'third_academic_field',
    'Required skills' => 'required_skills',
    'Tech stacks / Specialized Areas Needed' => 'required_skills',
    'Academic practices required' => 'academic_practices',
    'Training Practices Requested' => 'academic_practices',
    'Minimum qualification' => 'minimum_qualification',
    'Minimum education required' => 'minimum_qualification',
    'Minimum degree result' => 'minimum_degree_result',
    'Minimum expected GPA/result class' => 'minimum_degree_result',
    'Certification importance (1-5)' => 'certification_importance',
    'Importance value on professional credentials' => 'certification_importance',
    'Emerging fields to introduce' => 'emerging_fields',
    'New program suggestions' => 'new_program_suggestion',
    'Direct suggestions for new degree programs' => 'new_program_suggestion',
    'Graduate skill gaps' => 'graduate_skill_gaps',
    'Identified Capability deficits in recent graduates' => 'graduate_skill_gaps',
    'Additional recommendations' => 'additional_recommendations',
];

$mappedIndexes = [];
foreach ($headers as $index => $header) {
    $headerLower = strtolower(trim($header));
    $foundMatch = false;

    echo "Header $index: [{$header}]\n";

    // Try exact match
    foreach ($industryHeaderMap as $mapKey => $dbColumn) {
        if (strtolower($mapKey) === $headerLower) {
            $mappedIndexes[$dbColumn] = $index;
            $foundMatch = true;
            echo "  -> EXACT MATCH: {$dbColumn}\n";
            break;
        }
    }

    if (!$foundMatch) {
        foreach ($industryHeaderMap as $mapKey => $dbColumn) {
            $cleanHeader = strtolower(preg_replace('/[^a-z0-9]/i', '', $headerLower));
            $matched = false;
            if (str_contains($cleanHeader, 'company') && $dbColumn === 'company_name') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'sector') && $dbColumn === 'industry_sector') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'education') && $dbColumn === 'education_level') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'province') && $dbColumn === 'province') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'primaryacademic') && $dbColumn === 'primary_academic_field') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'subdiscipline') && $dbColumn === 'secondary_academic_field') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'softskill') && $dbColumn === 'third_academic_field') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'techstack') && $dbColumn === 'required_skills') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'trainingpractice') && $dbColumn === 'academic_practices') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'mineducation') && $dbColumn === 'minimum_qualification') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'mingpa') && $dbColumn === 'minimum_degree_result') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'credentialimportance') && $dbColumn === 'certification_importance') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'newprogram') && $dbColumn === 'new_program_suggestion') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if (str_contains($cleanHeader, 'capabilitydeficit') && $dbColumn === 'graduate_skill_gaps') { $mappedIndexes[$dbColumn] = $index; $matched = true; }
            if ($matched) {
                echo "  -> KEYWORD MATCH: {$dbColumn} (using cleanHeader: {$cleanHeader})\n";
                break;
            }
        }
    }
}

echo "\nMapped Indexes:\n";
print_r($mappedIndexes);
