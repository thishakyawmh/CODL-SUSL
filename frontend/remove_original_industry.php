<?php
$file = __DIR__ . '/src/components/admin-portal/AIAnalytics.tsx';
$lines = file($file);

echo "Total lines before: " . count($lines) . "\n";

// Remove 1-indexed lines 1592 to 1629 (which is 0-indexed 1591 to 1628)
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
