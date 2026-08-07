<?php
$controller = app(App\AI\Controllers\AIAnalyticsController::class);
$response = $controller->getOverview();
echo "API Overview Response:\n";
echo json_encode(json_decode($response->getContent()), JSON_PRETTY_PRINT);
echo "\nTest Completed.\n";
