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
        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'student' or 'industry'
            
            // Student specific fields
            $table->string('respondent_type')->nullable();
            $table->string('preferred_field')->nullable();
            $table->text('skills_to_learn')->nullable();
            $table->string('job_aspirations')->nullable();
            
            // Industry specific fields
            $table->string('company_name')->nullable();
            $table->string('industry_sector')->nullable();
            $table->text('required_skills')->nullable();
            $table->string('skill_shortages')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
    }
};
