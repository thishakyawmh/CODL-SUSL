<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Testing Main Connection ('mysql')...\n";
try {
    $results = DB::connection('mysql')->select('SHOW TABLES');
    echo "SUCCESS! Main connection has " . count($results) . " tables.\n";
} catch (\Exception $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}

echo "\nTesting AI Connection ('analytics')...\n";
try {
    $results = DB::connection('analytics')->select('SHOW TABLES');
    echo "SUCCESS! AI connection has " . count($results) . " tables.\n";
} catch (\Exception $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
