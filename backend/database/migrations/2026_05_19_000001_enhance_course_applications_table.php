<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_applications', function (Blueprint $table) {
            $table->foreignId('batch_id')->nullable()->constrained('batches')->onDelete('set null')->after('course_id');
            $table->integer('approval_level')->default(0)->after('status'); // 0=pending, 1=secretary, 2=coordinator, 3=director(final)
            $table->json('documents_verified')->nullable()->after('documents'); // {"nic": true, "birth_cert": false, ...}
            $table->foreignId('approved_by_secretary')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by_coordinator')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by_director')->nullable()->constrained('users')->onDelete('set null');
            $table->text('secretary_comment')->nullable();
            $table->text('coordinator_comment')->nullable();
            $table->text('director_comment')->nullable();
            $table->timestamp('secretary_approved_at')->nullable();
            $table->timestamp('coordinator_approved_at')->nullable();
            $table->timestamp('director_approved_at')->nullable();
            $table->string('generated_student_number')->nullable(); // Assigned after final approval
        });

        // Add registration_deadline to batches
        Schema::table('batches', function (Blueprint $table) {
            $table->date('registration_deadline')->nullable()->after('start_date');
        });
    }

    public function down(): void
    {
        Schema::table('course_applications', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropForeign(['approved_by_secretary']);
            $table->dropForeign(['approved_by_coordinator']);
            $table->dropForeign(['approved_by_director']);
            $table->dropColumn([
                'batch_id', 'approval_level', 'documents_verified',
                'approved_by_secretary', 'approved_by_coordinator', 'approved_by_director',
                'secretary_comment', 'coordinator_comment', 'director_comment',
                'secretary_approved_at', 'coordinator_approved_at', 'director_approved_at',
                'generated_student_number'
            ]);
        });

        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn('registration_deadline');
        });
    }
};
