<?php
$backupFilePath = __DIR__ . '/../database_backup.json';
if (!file_exists($backupFilePath)) {
    die("File not found!\n");
}
echo "Reading backup JSON...\n";
$json = json_decode(file_get_contents($backupFilePath), true);
echo "Keys in backup:\n";
foreach ($json as $key => $rows) {
    echo "- {$key}: " . count($rows) . " rows\n";
}
