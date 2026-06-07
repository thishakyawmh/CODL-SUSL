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

        Schema::create('course_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('applicant_name');
            $table->string('applicant_email');
            $table->string('applicant_nic');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('pending');
            $table->string('phone')->nullable();
            $table->string('district')->nullable();
            $table->date('dob')->nullable();
            $table->string('sex')->nullable();
            $table->string('civil_status')->nullable();
            $table->text('address')->nullable();
            $table->string('employment_title')->nullable();
            $table->text('official_address')->nullable();
            $table->json('ol_subjects')->nullable();
            $table->json('al_subjects')->nullable();
            $table->text('other_qualifications')->nullable();
            $table->boolean('is_new_applicant')->default(true);
            $table->json('documents')->nullable();
            $table->timestamps();
        });
    
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_applications');
    }
};
