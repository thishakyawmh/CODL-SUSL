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
        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->foreignId('assigned_exam_id')
                  ->nullable()
                  ->after('status')
                  ->constrained('exams')
                  ->nullOnDelete();
        });

        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->foreignId('assigned_exam_id')
                  ->nullable()
                  ->after('status')
                  ->constrained('exams')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->dropForeign(['assigned_exam_id']);
            $table->dropColumn('assigned_exam_id');
        });

        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->dropForeign(['assigned_exam_id']);
            $table->dropColumn('assigned_exam_id');
        });
    }
};
