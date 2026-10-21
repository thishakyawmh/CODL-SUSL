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
        if (Schema::hasTable('batches') && !Schema::hasColumn('batches', 'groups')) {
            Schema::table('batches', function (Blueprint $table) {
                $table->json('groups')->nullable()->after('materials');
            });
        }

        if (Schema::hasTable('user_courses') && !Schema::hasColumn('user_courses', 'group')) {
            Schema::table('user_courses', function (Blueprint $table) {
                $table->string('group')->nullable()->after('batch');
            });
        }

        if (Schema::hasTable('course_applications') && !Schema::hasColumn('course_applications', 'group')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->string('group')->nullable()->after('batch_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('batches') && Schema::hasColumn('batches', 'groups')) {
            Schema::table('batches', function (Blueprint $table) {
                $table->dropColumn('groups');
            });
        }

        if (Schema::hasTable('user_courses') && Schema::hasColumn('user_courses', 'group')) {
            Schema::table('user_courses', function (Blueprint $table) {
                $table->dropColumn('group');
            });
        }

        if (Schema::hasTable('course_applications') && Schema::hasColumn('course_applications', 'group')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->dropColumn('group');
            });
        }
    }
};
