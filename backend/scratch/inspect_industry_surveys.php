<?php
$backupFilePath = __DIR__ . '/../database_backup.json';
$json = json_decode(file_get_contents($backupFilePath), true);
$rows = $json['industry_surveys'] ?? [];
if (count($rows) > 0) {
    echo "Columns of industry_surveys in backup:\n";
    print_r(array_keys($rows[0]));
} else {
    echo "No rows found in industry_surveys!\n";
}
