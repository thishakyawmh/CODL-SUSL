<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create survey interests configuration table
        Schema::connection('analytics')->create('survey_interests_config', function (Blueprint $table) {
            $table->id();
            $table->string('interest_field');
            $table->text('skills'); // Comma-separated list of skills
            $table->timestamps();
        });

        // 2. Add columns to student_interests table for detailed mapping
        Schema::connection('analytics')->table('student_interests', function (Blueprint $table) {
            // Primary details
            $table->text('primary_skills')->nullable()->after('primary_field');
            $table->text('primary_teaching_methods')->nullable()->after('primary_skills');
            $table->unsignedTinyInteger('primary_theory_practical')->nullable()->after('primary_teaching_methods');

            // Secondary details
            $table->text('secondary_skills')->nullable()->after('secondary_field');
            $table->text('secondary_teaching_methods')->nullable()->after('secondary_skills');
            $table->unsignedTinyInteger('secondary_theory_practical')->nullable()->after('secondary_teaching_methods');

            // Third/Ternary details
            $table->text('third_skills')->nullable()->after('third_field');
            $table->text('third_teaching_methods')->nullable()->after('third_skills');
            $table->unsignedTinyInteger('third_theory_practical')->nullable()->after('third_teaching_methods');
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('survey_interests_config');

        Schema::connection('analytics')->table('student_interests', function (Blueprint $table) {
            $table->dropColumn([
                'primary_skills', 'primary_teaching_methods', 'primary_theory_practical',
                'secondary_skills', 'secondary_teaching_methods', 'secondary_theory_practical',
                'third_skills', 'third_teaching_methods', 'third_theory_practical'
            ]);
        });
    }
};
