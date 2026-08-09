<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance indexes for remote Azure MySQL database.
 * These indexes dramatically speed up WHERE/JOIN queries on frequently filtered columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Users table: role and status are filtered on almost every query
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
            $table->index('status', 'idx_users_status');
            $table->index(['role', 'status'], 'idx_users_role_status');
            $table->index('nic', 'idx_users_nic');
        });

        // Course applications: status, approval_level, course_id, and user_id are heavily queried
        Schema::table('course_applications', function (Blueprint $table) {
            $table->index('status', 'idx_course_apps_status');
            $table->index('approval_level', 'idx_course_apps_approval_level');
            $table->index(['status', 'approval_level'], 'idx_course_apps_status_level');
            $table->index('applicant_nic', 'idx_course_apps_nic');
            $table->index('applicant_email', 'idx_course_apps_email');
            $table->index('is_new_applicant', 'idx_course_apps_is_new');
        });

        // Letter requests: status is filtered frequently
        Schema::table('letter_requests', function (Blueprint $table) {
            $table->index('status', 'idx_letter_requests_status');
            $table->index(['status', 'approval_level'], 'idx_letter_requests_status_level');
        });

        // Exam applications: status filtered
        Schema::table('exam_applications', function (Blueprint $table) {
            $table->index('status', 'idx_exam_apps_status');
        });

        // Postponement requests: status filtered
        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->index('status', 'idx_postponement_status');
        });

        // Reattempt requests: status filtered
        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->index('status', 'idx_reattempt_status');
        });

        // Batches: status and course_id queried together
        Schema::table('batches', function (Blueprint $table) {
            $table->index('status', 'idx_batches_status');
            $table->index(['course_id', 'status'], 'idx_batches_course_status');
        });

        // Courses: secretary_id and coordinator_id used in role-based filtering
        Schema::table('courses', function (Blueprint $table) {
            $table->index('secretary_id', 'idx_courses_secretary');
            $table->index('coordinator_id', 'idx_courses_coordinator');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_status');
            $table->dropIndex('idx_users_role_status');
            $table->dropIndex('idx_users_nic');
        });

        Schema::table('course_applications', function (Blueprint $table) {
            $table->dropIndex('idx_course_apps_status');
            $table->dropIndex('idx_course_apps_approval_level');
            $table->dropIndex('idx_course_apps_status_level');
            $table->dropIndex('idx_course_apps_nic');
            $table->dropIndex('idx_course_apps_email');
            $table->dropIndex('idx_course_apps_is_new');
        });

        Schema::table('letter_requests', function (Blueprint $table) {
            $table->dropIndex('idx_letter_requests_status');
            $table->dropIndex('idx_letter_requests_status_level');
        });

        Schema::table('exam_applications', function (Blueprint $table) {
            $table->dropIndex('idx_exam_apps_status');
        });

        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->dropIndex('idx_postponement_status');
        });

        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->dropIndex('idx_reattempt_status');
        });

        Schema::table('batches', function (Blueprint $table) {
            $table->dropIndex('idx_batches_status');
            $table->dropIndex('idx_batches_course_status');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex('idx_courses_secretary');
            $table->dropIndex('idx_courses_coordinator');
        });
    }
};
