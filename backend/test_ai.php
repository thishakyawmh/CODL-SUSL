<?php
$nlp = app(App\AI\Services\AnalyticsNLPService::class);
$domains = $nlp->extractDomains('I want to learn docker, aws, and some machine learning for data science.');
echo "Extracted Domains:\n";
print_r($domains);

echo "\nTest Completed.\n";
