<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('analytics')->create('student_interests', function (Blueprint $table) {
            $table->id();
            $table->string('respondent_type'); // school_leaver, prospective_student, current_student
            $table->string('preferred_field');
            $table->string('career_interests');
            $table->text('skills_to_learn');
            $table->string('job_aspirations');
            $table->text('comments')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('student_interests');
    }
};