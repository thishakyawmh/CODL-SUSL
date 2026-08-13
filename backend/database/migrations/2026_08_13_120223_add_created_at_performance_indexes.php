<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('created_at', 'idx_activity_logs_created_at');
        });

        Schema::table('user_courses', function (Blueprint $table) {
            $table->index('created_at', 'idx_user_courses_created_at');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('idx_activity_logs_created_at');
        });

        Schema::table('user_courses', function (Blueprint $table) {
            $table->dropIndex('idx_user_courses_created_at');
        });
    }
};
