<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Composite index for querying student enrollments in courses
        Schema::table('user_courses', function (Blueprint $table) {
            $table->index(['user_id', 'course_id'], 'idx_user_courses_user_course');
        });

        // Composite index for querying batch names within specific courses
        Schema::table('batches', function (Blueprint $table) {
            $table->index(['course_id', 'name'], 'idx_batches_course_name');
        });
    }

    public function down(): void
    {
        Schema::table('user_courses', function (Blueprint $table) {
            $table->dropIndex('idx_user_courses_user_course');
        });

        Schema::table('batches', function (Blueprint $table) {
            $table->dropIndex('idx_batches_course_name');
        });
    }
};
