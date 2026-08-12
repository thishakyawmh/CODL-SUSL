<?php
$file = __DIR__ . '/src/components/admin-portal/AIAnalytics.tsx';
$lines = file($file);

echo "Total lines before: " . count($lines) . "\n";

$newLines = [];
for ($i = 0; $i < count($lines); $i++) {
    $lineNum = $i + 1;
    if ($lineNum >= 1592 && $lineNum <= 1629) {
        continue;
    }
    $newLines[] = $lines[$i];
}

echo "Total lines after: " . count($newLines) . "\n";

file_put_contents($file, implode('', $newLines));
echo "Successfully updated AIAnalytics.tsx!\n";
