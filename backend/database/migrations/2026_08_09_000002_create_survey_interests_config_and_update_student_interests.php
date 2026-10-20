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
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'primary_skills')) {
                $table->text('primary_skills')->nullable();
            }
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'primary_teaching_methods')) {
                $table->text('primary_teaching_methods')->nullable();
            }
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'primary_theory_practical')) {
                $table->unsignedTinyInteger('primary_theory_practical')->nullable();
            }

            // Secondary details
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'secondary_skills')) {
                $table->text('secondary_skills')->nullable();
            }
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'secondary_teaching_methods')) {
                $table->text('secondary_teaching_methods')->nullable();
            }
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'secondary_theory_practical')) {
                $table->unsignedTinyInteger('secondary_theory_practical')->nullable();
            }

            // Third/Ternary details
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'third_skills')) {
                $table->text('third_skills')->nullable();
            }
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'third_teaching_methods')) {
                $table->text('third_teaching_methods')->nullable();
            }
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'third_theory_practical')) {
                $table->unsignedTinyInteger('third_theory_practical')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('survey_interests_config');

        Schema::connection('analytics')->table('student_interests', function (Blueprint $table) {
            $cols = [];
            $allCols = [
                'primary_skills', 'primary_teaching_methods', 'primary_theory_practical',
                'secondary_skills', 'secondary_teaching_methods', 'secondary_theory_practical',
                'third_skills', 'third_teaching_methods', 'third_theory_practical'
            ];
            foreach ($allCols as $col) {
                if (Schema::connection('analytics')->hasColumn('student_interests', $col)) {
                    $cols[] = $col;
                }
            }
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
