<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->string('backup_frequency')->default('daily')->after('maintenance_message');
            $table->integer('backup_retention')->default(30)->after('backup_frequency');
            $table->timestamp('last_backup_at')->nullable()->after('backup_retention');
            $table->string('last_backup_status')->nullable()->after('last_backup_at');
            $table->timestamp('next_backup_at')->nullable()->after('last_backup_status');
        });
    }

    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropColumn([
                'backup_frequency',
                'backup_retention',
                'last_backup_at',
                'last_backup_status',
                'next_backup_at'
            ]);
        });
    }
};
