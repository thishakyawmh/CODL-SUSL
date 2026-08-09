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
        Schema::table('exam_applications', function (Blueprint $table) {
            $table->json('stages')->nullable()->after('status');
            $table->integer('current_step')->default(1)->after('stages');
            $table->text('rejection_reason')->nullable()->after('current_step');
        });

        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->json('stages')->nullable()->after('status');
            $table->integer('current_step')->default(1)->after('stages');
            $table->text('rejection_reason')->nullable()->after('current_step');
        });

        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->json('stages')->nullable()->after('status');
            $table->integer('current_step')->default(1)->after('stages');
            $table->text('rejection_reason')->nullable()->after('current_step');
        });

        Schema::table('exam_results', function (Blueprint $table) {
            $table->string('min_repeat_grade')->default('D')->after('released_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_applications', function (Blueprint $table) {
            $table->dropColumn(['stages', 'current_step', 'rejection_reason']);
        });

        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->dropColumn(['stages', 'current_step', 'rejection_reason']);
        });

        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->dropColumn(['stages', 'current_step', 'rejection_reason']);
        });

        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropColumn(['min_repeat_grade']);
        });
    }
};
