<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::connection('analytics')->select("DESCRIBE industry_requirements");
foreach ($columns as $column) {
    echo "Field: {$column->Field} | Type: {$column->Type} | Null: {$column->Null}\n";
}
