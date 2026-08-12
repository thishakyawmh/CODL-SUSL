<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$studentUrl = 'https://docs.google.com/spreadsheets/d/14fyJdJ6L2IJd_1wb8Vf4KHdELiuFv0J2OOxitMwFhDo/export?format=csv&gid=0';
$industryUrl = 'https://docs.google.com/spreadsheets/d/14fyJdJ6L2IJd_1wb8Vf4KHdELiuFv0J2OOxitMwFhDo/export?format=csv&gid=785328217';

echo "Fetching Student Sheet CSV...\n";
$resStudent = Http::get($studentUrl);
$linesStudent = explode("\n", $resStudent->body());
echo "Student Headers:\n" . array_shift($linesStudent) . "\n\n";

echo "Fetching Industry Sheet CSV...\n";
$resIndustry = Http::get($industryUrl);
$linesIndustry = explode("\n", $resIndustry->body());
echo "Industry Headers:\n" . array_shift($linesIndustry) . "\n\n";

// Search for sheet name and gid mappings in the sheet metadata JSON inside the HTML page
// Google Sheets page contains a JS object: bootstrapData
preg_match('/bootstrapData\s*=\s*(\{.*?\});/s', $html, $matches);
if (isset($matches[1])) {
    echo "Found bootstrapData!\n";
    $json = $matches[1];
    // Find all occurrences of sheet names and gids
    // Format is typically: "131451231", "Sheet Name"
    preg_match_all('/"([0-9]+)"\s*,\s*"([^"]+)"/', $json, $sheetMatches);
    foreach ($sheetMatches[1] as $idx => $gid) {
        $name = $sheetMatches[2][$idx];
        echo "Sheet: {$name} | GID: {$gid}\n";
    }
} else {
    echo "bootstrapData not found in HTML. Let's do a simple regex for gid=.\n";
    preg_match_all('/gid=([0-9]+)/', $html, $gids);
    $uniqueGids = array_unique($gids[1] ?? []);
    foreach ($uniqueGids as $gid) {
        echo "Found GID: {$gid}\n";
    }
}
