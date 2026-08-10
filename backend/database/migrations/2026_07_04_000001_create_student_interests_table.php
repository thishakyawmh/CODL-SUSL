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

            $table->string('email')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('education_level');
            $table->string('province')->nullable();
            $table->string('district')->nullable();

            $table->string('primary_interest')->nullable();
            $table->text('primary_skills')->nullable();
            $table->text('primary_learning_methods')->nullable();
            $table->string('primary_learning_balance')->nullable();

            $table->string('secondary_interest')->nullable();
            $table->text('secondary_skills')->nullable();
            $table->text('secondary_learning_methods')->nullable();
            $table->string('secondary_learning_balance')->nullable();

            $table->string('ternary_interest')->nullable();
            $table->text('ternary_skills')->nullable();
            $table->text('ternary_learning_methods')->nullable();
            $table->string('ternary_learning_balance')->nullable();

            $table->text('university_opportunities')->nullable();
            $table->text('new_program_suggestion')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('student_interests');
    }
};
