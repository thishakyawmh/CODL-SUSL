<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$users = App\Models\User::whereIn('role', ['super_admin', 'admin', 'director', 'coordinator', 'secretary', 'lecturer'])->get();
foreach ($users as $u) {
    echo "ID: {$u->id}, Name: {$u->full_name}, Email: {$u->email}, Role: {$u->role}\n";
}
