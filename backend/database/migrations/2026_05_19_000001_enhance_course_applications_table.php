<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('course_applications', 'batch_id')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->foreignId('batch_id')->nullable()->constrained('batches')->onDelete('set null')->after('course_id');
            });
        }

        if (!Schema::hasColumn('course_applications', 'approval_level')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->integer('approval_level')->default(0)->after('status'); // 0=pending, 1=secretary, 2=coordinator, 3=director(final)
            });
        }

        if (!Schema::hasColumn('course_applications', 'documents_verified')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->json('documents_verified')->nullable()->after('documents'); // {"nic": true, "birth_cert": false, ...}
            });
        }

        if (!Schema::hasColumn('course_applications', 'approved_by_secretary')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->foreignId('approved_by_secretary')->nullable()->constrained('users')->onDelete('set null');
            });
        }

        if (!Schema::hasColumn('course_applications', 'approved_by_coordinator')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->foreignId('approved_by_coordinator')->nullable()->constrained('users')->onDelete('set null');
            });
        }

        if (!Schema::hasColumn('course_applications', 'approved_by_director')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->foreignId('approved_by_director')->nullable()->constrained('users')->onDelete('set null');
            });
        }

        if (!Schema::hasColumn('course_applications', 'secretary_comment')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->text('secretary_comment')->nullable();
            });
        }

        if (!Schema::hasColumn('course_applications', 'coordinator_comment')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->text('coordinator_comment')->nullable();
            });
        }

        if (!Schema::hasColumn('course_applications', 'director_comment')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->text('director_comment')->nullable();
            });
        }

        if (!Schema::hasColumn('course_applications', 'secretary_approved_at')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->timestamp('secretary_approved_at')->nullable();
            });
        }

        if (!Schema::hasColumn('course_applications', 'coordinator_approved_at')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->timestamp('coordinator_approved_at')->nullable();
            });
        }

        if (!Schema::hasColumn('course_applications', 'director_approved_at')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->timestamp('director_approved_at')->nullable();
            });
        }

        if (!Schema::hasColumn('course_applications', 'generated_student_number')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->string('generated_student_number')->nullable(); // Assigned after final approval
            });
        }

        // Add registration_deadline to batches
        if (!Schema::hasColumn('batches', 'registration_deadline')) {
            Schema::table('batches', function (Blueprint $table) {
                $table->date('registration_deadline')->nullable()->after('start_date');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('course_applications', 'batch_id')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->dropForeign(['batch_id']);
                $table->dropColumn('batch_id');
            });
        }
        if (Schema::hasColumn('course_applications', 'approved_by_secretary')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->dropForeign(['approved_by_secretary']);
                $table->dropColumn('approved_by_secretary');
            });
        }
        if (Schema::hasColumn('course_applications', 'approved_by_coordinator')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->dropForeign(['approved_by_coordinator']);
                $table->dropColumn('approved_by_coordinator');
            });
        }
        if (Schema::hasColumn('course_applications', 'approved_by_director')) {
            Schema::table('course_applications', function (Blueprint $table) {
                $table->dropForeign(['approved_by_director']);
                $table->dropColumn('approved_by_director');
            });
        }
        
        $columnsToDrop = array_filter([
            'approval_level', 'documents_verified',
            'secretary_comment', 'coordinator_comment', 'director_comment',
            'secretary_approved_at', 'coordinator_approved_at', 'director_approved_at',
            'generated_student_number'
        ], function($col) {
            return Schema::hasColumn('course_applications', $col);
        });

        if (!empty($columnsToDrop)) {
            Schema::table('course_applications', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }

        if (Schema::hasColumn('batches', 'registration_deadline')) {
            Schema::table('batches', function (Blueprint $table) {
                $table->dropColumn('registration_deadline');
            });
        }
    }
};
