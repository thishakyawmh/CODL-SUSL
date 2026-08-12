<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Jobs\ProcessAnalyticsPipelineJob;

echo "Dispatching ProcessAnalyticsPipelineJob...\n";
ProcessAnalyticsPipelineJob::dispatch();
echo "Dispatched successfully!\n";
