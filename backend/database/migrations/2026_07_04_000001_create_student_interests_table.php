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
            $table->timestamp('survey_submitted_at')->nullable();

            // Section 1
            $table->string('education_level');
            $table->string('province')->nullable();
            $table->string('district')->nullable();

            // Section 2
            $table->string('primary_field');
            $table->string('secondary_field')->nullable();
            $table->string('third_field')->nullable();

            // Section 3
            $table->text('specializations')->nullable();

            // Section 4
            $table->text('learning_preferences')->nullable();
            $table->unsignedTinyInteger('theory_practical_score')->nullable();
            $table->text('university_opportunities')->nullable();

            // Section 5
            $table->text('emerging_fields')->nullable();
            $table->text('new_program_suggestion')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('student_interests');
    }
};
